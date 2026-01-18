"""
MCP Server - Main server implementation supporting stdio, HTTP, and WebSocket.

The server handles:
- JSON-RPC 2.0 message parsing and response formatting
- Transport layer abstraction (stdio, HTTP, WebSocket)
- Authentication and rate limiting
- Tool execution routing
"""

from __future__ import annotations

import asyncio
import json
import sys
from typing import TYPE_CHECKING, AsyncIterator

import structlog

from windows_mcp_server.config import Settings, TransportType
from windows_mcp_server.logging import setup_logging
from windows_mcp_server.protocol import JSONRPCRequest, JSONRPCResponse, JSONRPCError, ErrorCode
from windows_mcp_server.protocol.handler import ProtocolHandler
from windows_mcp_server.security import Authenticator, RateLimiter, Sandbox
from windows_mcp_server.tools.registry import ToolRegistry

if TYPE_CHECKING:
    from aiohttp import web

logger = structlog.get_logger(__name__)


class MCPServer:
    """Model Context Protocol Server."""

    def __init__(self, settings: Settings | None = None) -> None:
        """Initialize the MCP server.

        Args:
            settings: Server configuration (loads from env if not provided)
        """
        self.settings = settings or Settings.from_env()

        # Setup logging
        setup_logging(self.settings.logging)

        # Initialize security components
        self.sandbox = Sandbox(self.settings.security)
        self.authenticator = Authenticator(self.settings.security)
        self.rate_limiter = RateLimiter(self.settings.security)

        # Initialize tool registry with default tools
        self.tool_registry = ToolRegistry.create_default(self.settings, self.sandbox)

        # Initialize protocol handler
        self.protocol_handler = ProtocolHandler(
            self.tool_registry,
            server_name="windows-mcp-server",
            server_version="1.0.0",
        )

        self._running = False

    async def start(self) -> None:
        """Start the server using configured transport."""
        self._running = True
        logger.info(
            "Starting MCP server",
            transport=self.settings.server.transport.value,
            host=self.settings.server.host,
            port=self.settings.server.port,
        )

        try:
            if self.settings.server.transport == TransportType.STDIO:
                await self._run_stdio()
            elif self.settings.server.transport == TransportType.HTTP:
                await self._run_http()
            elif self.settings.server.transport == TransportType.WEBSOCKET:
                await self._run_websocket()
            else:
                raise ValueError(f"Unknown transport: {self.settings.server.transport}")
        except asyncio.CancelledError:
            logger.info("Server shutdown requested")
        except Exception as e:
            logger.exception("Server error", error=str(e))
            raise
        finally:
            self._running = False

    async def stop(self) -> None:
        """Stop the server."""
        self._running = False
        logger.info("Stopping MCP server")

    async def handle_message(
        self,
        message: str,
        client_id: str = "anonymous",
    ) -> str | None:
        """Handle an incoming JSON-RPC message.

        Args:
            message: Raw JSON message
            client_id: Client identifier for rate limiting

        Returns:
            JSON response string, or None for notifications
        """
        # Rate limiting
        if not self.rate_limiter.is_allowed(client_id):
            error_response = JSONRPCResponse.failure(
                None,
                JSONRPCError.from_code(
                    ErrorCode.RATE_LIMITED,
                    f"Rate limit exceeded. Retry after {self.rate_limiter.get_reset_time(client_id):.0f}s",
                ),
            )
            return error_response.model_dump_json()

        # Parse request
        try:
            data = json.loads(message)
        except json.JSONDecodeError as e:
            error_response = JSONRPCResponse.failure(
                None,
                JSONRPCError.from_code(ErrorCode.PARSE_ERROR, f"Invalid JSON: {e}"),
            )
            return error_response.model_dump_json()

        # Handle batch requests
        if isinstance(data, list):
            responses: list[str] = []
            for item in data:
                response = await self._handle_single_request(item, client_id)
                if response:
                    responses.append(response)
            return "[" + ",".join(responses) + "]" if responses else None

        return await self._handle_single_request(data, client_id)

    async def _handle_single_request(
        self,
        data: dict,
        client_id: str,
    ) -> str | None:
        """Handle a single JSON-RPC request.

        Args:
            data: Parsed request data
            client_id: Client identifier

        Returns:
            JSON response string, or None for notifications
        """
        try:
            request = JSONRPCRequest.model_validate(data)
        except Exception as e:
            error_response = JSONRPCResponse.failure(
                data.get("id"),
                JSONRPCError.from_code(ErrorCode.INVALID_REQUEST, str(e)),
            )
            return error_response.model_dump_json()

        # Handle request
        response = await self.protocol_handler.handle_request(request)

        if response is None:
            return None

        return response.model_dump_json()

    async def _run_stdio(self) -> None:
        """Run server using stdio transport."""
        logger.info("Starting stdio transport")

        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)

        # Connect stdin
        loop = asyncio.get_event_loop()
        await loop.connect_read_pipe(lambda: protocol, sys.stdin)

        # Use stdout for responses
        writer_transport, writer_protocol = await loop.connect_write_pipe(
            asyncio.streams.FlowControlMixin, sys.stdout
        )
        writer = asyncio.StreamWriter(writer_transport, writer_protocol, None, loop)

        logger.info("Stdio transport ready")

        while self._running:
            try:
                # Read content-length header
                header = await asyncio.wait_for(reader.readline(), timeout=1.0)
                if not header:
                    continue

                header_str = header.decode("utf-8").strip()
                if not header_str.startswith("Content-Length:"):
                    continue

                content_length = int(header_str.split(":")[1].strip())

                # Read blank line
                await reader.readline()

                # Read content
                content = await reader.readexactly(content_length)
                message = content.decode("utf-8")

                logger.debug("Received message", length=content_length)

                # Handle message
                response = await self.handle_message(message)

                if response:
                    # Write response with header
                    response_bytes = response.encode("utf-8")
                    output = f"Content-Length: {len(response_bytes)}\r\n\r\n".encode() + response_bytes
                    writer.write(output)
                    await writer.drain()

            except asyncio.TimeoutError:
                continue
            except asyncio.IncompleteReadError:
                logger.info("Client disconnected")
                break
            except Exception as e:
                logger.exception("Error handling message", error=str(e))

    async def _run_http(self) -> None:
        """Run server using HTTP transport."""
        from aiohttp import web

        logger.info(
            "Starting HTTP transport",
            host=self.settings.server.host,
            port=self.settings.server.port,
        )

        app = web.Application()
        app.router.add_post("/", self._http_handler)
        app.router.add_get("/health", self._health_handler)

        runner = web.AppRunner(app)
        await runner.setup()

        site = web.TCPSite(
            runner,
            self.settings.server.host,
            self.settings.server.port,
        )
        await site.start()

        logger.info(
            "HTTP server listening",
            url=f"http://{self.settings.server.host}:{self.settings.server.port}",
        )

        # Keep running
        while self._running:
            await asyncio.sleep(1)

        await runner.cleanup()

    async def _http_handler(self, request: web.Request) -> web.Response:
        """Handle HTTP POST requests."""
        from aiohttp import web

        # Get client ID from auth header or IP
        api_key = request.headers.get("X-API-Key")
        bearer = request.headers.get("Authorization")
        client_id = "anonymous"

        if self.settings.security.require_auth:
            auth_result = self.authenticator.authenticate(
                api_key=api_key,
                bearer_token=bearer,
            )
            if not auth_result.authenticated:
                return web.json_response(
                    {
                        "jsonrpc": "2.0",
                        "id": None,
                        "error": {
                            "code": ErrorCode.AUTHENTICATION_REQUIRED,
                            "message": auth_result.error or "Authentication required",
                        },
                    },
                    status=401,
                )
            client_id = auth_result.client_id or "unknown"

        # Read body
        try:
            body = await request.text()
        except Exception as e:
            return web.json_response(
                {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": ErrorCode.PARSE_ERROR,
                        "message": f"Failed to read body: {e}",
                    },
                },
                status=400,
            )

        # Handle message
        response = await self.handle_message(body, client_id)

        if response is None:
            return web.Response(status=204)

        return web.Response(
            text=response,
            content_type="application/json",
        )

    async def _health_handler(self, request: web.Request) -> web.Response:
        """Handle health check requests."""
        from aiohttp import web

        return web.json_response({
            "status": "healthy",
            "server": "windows-mcp-server",
            "version": "1.0.0",
        })

    async def _run_websocket(self) -> None:
        """Run server using WebSocket transport."""
        from aiohttp import web

        logger.info(
            "Starting WebSocket transport",
            host=self.settings.server.host,
            port=self.settings.server.port,
        )

        app = web.Application()
        app.router.add_get("/ws", self._websocket_handler)
        app.router.add_get("/health", self._health_handler)

        runner = web.AppRunner(app)
        await runner.setup()

        site = web.TCPSite(
            runner,
            self.settings.server.host,
            self.settings.server.port,
        )
        await site.start()

        logger.info(
            "WebSocket server listening",
            url=f"ws://{self.settings.server.host}:{self.settings.server.port}/ws",
        )

        while self._running:
            await asyncio.sleep(1)

        await runner.cleanup()

    async def _websocket_handler(self, request: web.Request) -> web.WebSocketResponse:
        """Handle WebSocket connections."""
        from aiohttp import web, WSMsgType

        ws = web.WebSocketResponse()
        await ws.prepare(request)

        client_id = f"ws_{id(ws)}"
        logger.info("WebSocket client connected", client_id=client_id)

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    response = await self.handle_message(msg.data, client_id)
                    if response:
                        await ws.send_str(response)
                elif msg.type == WSMsgType.ERROR:
                    logger.warning(
                        "WebSocket error",
                        client_id=client_id,
                        error=ws.exception(),
                    )
                    break
        finally:
            logger.info("WebSocket client disconnected", client_id=client_id)

        return ws


def create_server(settings: Settings | None = None) -> MCPServer:
    """Create a configured MCP server.

    Args:
        settings: Server configuration

    Returns:
        Configured server instance
    """
    return MCPServer(settings)
