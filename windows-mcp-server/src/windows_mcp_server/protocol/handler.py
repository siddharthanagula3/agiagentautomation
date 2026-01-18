"""
MCP Protocol Handler - Routes JSON-RPC requests to appropriate handlers.

Implements the core MCP protocol methods:
- initialize: Negotiate capabilities with client
- tools/list: List available tools
- tools/call: Execute a tool
- notifications/cancelled: Handle request cancellation
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any, Callable, Coroutine

import structlog

from windows_mcp_server.protocol.models import (
    ErrorCode,
    InitializeParams,
    InitializeResult,
    JSONRPCError,
    JSONRPCRequest,
    JSONRPCResponse,
    MCPCapabilities,
    MCPServerInfo,
    ToolCallParams,
    ToolCallResult,
    ToolsListResult,
)

if TYPE_CHECKING:
    from windows_mcp_server.tools.registry import ToolRegistry

logger = structlog.get_logger(__name__)


class ProtocolHandler:
    """Handles MCP protocol messages."""

    def __init__(
        self,
        tool_registry: ToolRegistry,
        server_name: str = "windows-mcp-server",
        server_version: str = "1.0.0",
    ) -> None:
        """Initialize the protocol handler.

        Args:
            tool_registry: Registry of available tools
            server_name: Name of this server
            server_version: Version of this server
        """
        self.tool_registry = tool_registry
        self.server_name = server_name
        self.server_version = server_version
        self._initialized = False
        self._client_capabilities: dict[str, Any] = {}
        self._pending_requests: dict[int | str, asyncio.Task[Any]] = {}

        # Method handlers
        self._handlers: dict[
            str, Callable[[dict[str, Any] | None], Coroutine[Any, Any, Any]]
        ] = {
            "initialize": self._handle_initialize,
            "initialized": self._handle_initialized,
            "tools/list": self._handle_tools_list,
            "tools/call": self._handle_tools_call,
            "notifications/cancelled": self._handle_cancelled,
            "ping": self._handle_ping,
        }

    async def handle_request(self, request: JSONRPCRequest) -> JSONRPCResponse | None:
        """Handle an incoming JSON-RPC request.

        Args:
            request: The incoming request

        Returns:
            Response to send back, or None for notifications
        """
        logger.debug("Handling request", method=request.method, id=request.id)

        # Notifications don't have an ID and don't get responses
        is_notification = request.id is None

        handler = self._handlers.get(request.method)
        if not handler:
            if is_notification:
                return None
            return JSONRPCResponse.failure(
                request.id,
                JSONRPCError.from_code(
                    ErrorCode.METHOD_NOT_FOUND,
                    f"Method not found: {request.method}",
                ),
            )

        try:
            # Convert params to dict if needed
            params: dict[str, Any] | None = None
            if isinstance(request.params, dict):
                params = request.params
            elif isinstance(request.params, list):
                # For positional params, convert to dict with indices
                params = {str(i): v for i, v in enumerate(request.params)}

            result = await handler(params)

            if is_notification:
                return None

            return JSONRPCResponse.success(request.id, result)

        except ValueError as e:
            logger.warning("Invalid params", error=str(e))
            if is_notification:
                return None
            return JSONRPCResponse.failure(
                request.id,
                JSONRPCError.from_code(ErrorCode.INVALID_PARAMS, str(e)),
            )
        except PermissionError as e:
            logger.warning("Permission denied", error=str(e))
            if is_notification:
                return None
            return JSONRPCResponse.failure(
                request.id,
                JSONRPCError.from_code(ErrorCode.PERMISSION_DENIED, str(e)),
            )
        except TimeoutError as e:
            logger.warning("Request timeout", error=str(e))
            if is_notification:
                return None
            return JSONRPCResponse.failure(
                request.id,
                JSONRPCError.from_code(ErrorCode.TIMEOUT, str(e)),
            )
        except Exception as e:
            logger.exception("Internal error handling request")
            if is_notification:
                return None
            return JSONRPCResponse.failure(
                request.id,
                JSONRPCError.from_code(ErrorCode.INTERNAL_ERROR, str(e)),
            )

    async def _handle_initialize(self, params: dict[str, Any] | None) -> dict[str, Any]:
        """Handle the initialize request.

        This is the first request from a client, where we negotiate capabilities.
        """
        if params:
            try:
                init_params = InitializeParams.model_validate(params)
                self._client_capabilities = init_params.capabilities
                logger.info(
                    "Client initializing",
                    client_info=init_params.client_info,
                    protocol_version=init_params.protocol_version,
                )
            except Exception as e:
                logger.warning("Failed to parse initialize params", error=str(e))

        capabilities = MCPCapabilities(
            tools=True,
            resources=False,  # Not implemented yet
            prompts=False,  # Not implemented yet
            logging=True,
        )

        server_info = MCPServerInfo(
            name=self.server_name,
            version=self.server_version,
            protocol_version="2024-11-05",
            capabilities=capabilities,
            platform="windows",
        )

        result = InitializeResult(
            protocol_version="2024-11-05",
            capabilities=capabilities,
            server_info=server_info,
        )

        return result.model_dump(by_alias=True)

    async def _handle_initialized(self, params: dict[str, Any] | None) -> None:
        """Handle the initialized notification.

        Called by client after receiving initialize response.
        """
        self._initialized = True
        logger.info("Protocol initialized")
        return None

    async def _handle_tools_list(self, params: dict[str, Any] | None) -> dict[str, Any]:
        """Handle tools/list request.

        Returns a list of all available tools with their schemas.
        """
        tools = self.tool_registry.list_tools()
        tool_schemas = [tool.to_mcp_schema() for tool in tools]

        result = ToolsListResult(tools=tool_schemas)
        return result.model_dump()

    async def _handle_tools_call(self, params: dict[str, Any] | None) -> dict[str, Any]:
        """Handle tools/call request.

        Executes the requested tool with provided arguments.
        """
        if not params:
            raise ValueError("Missing required params for tools/call")

        try:
            call_params = ToolCallParams.model_validate(params)
        except Exception as e:
            raise ValueError(f"Invalid tool call params: {e}") from e

        logger.info("Executing tool", tool=call_params.name)

        try:
            tool_result = await self.tool_registry.execute_tool(
                call_params.name, call_params.arguments
            )

            if tool_result.success:
                # Format data appropriately
                if isinstance(tool_result.data, str):
                    text = tool_result.data
                elif tool_result.data is not None:
                    import json

                    text = json.dumps(tool_result.data, indent=2, default=str)
                else:
                    text = "Operation completed successfully"

                result = ToolCallResult.success(text)
            else:
                result = ToolCallResult.error(tool_result.error or "Unknown error")

            return result.model_dump(by_alias=True)

        except Exception as e:
            logger.exception("Tool execution failed", tool=call_params.name)
            result = ToolCallResult.error(str(e))
            return result.model_dump(by_alias=True)

    async def _handle_cancelled(self, params: dict[str, Any] | None) -> None:
        """Handle notifications/cancelled notification.

        Cancels a pending request if possible.
        """
        if not params:
            return None

        request_id = params.get("requestId")
        if request_id and request_id in self._pending_requests:
            task = self._pending_requests[request_id]
            task.cancel()
            logger.info("Cancelled request", request_id=request_id)

        return None

    async def _handle_ping(self, params: dict[str, Any] | None) -> dict[str, str]:
        """Handle ping request for health checks."""
        return {"status": "ok"}
