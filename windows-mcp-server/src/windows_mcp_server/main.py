"""
Main Entry Point - CLI interface for Windows MCP Server.

Provides command-line options for:
- Starting the server with different transports
- Configuration management
- API key generation
"""

from __future__ import annotations

import argparse
import asyncio
import signal
import sys
from pathlib import Path

import structlog

from windows_mcp_server.config import Settings, TransportType, LogLevel
from windows_mcp_server.server import MCPServer

logger = structlog.get_logger(__name__)


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        prog="windows-mcp-server",
        description="Windows MCP Server - Model Context Protocol server for Windows automation",
    )

    parser.add_argument(
        "--transport",
        "-t",
        choices=["stdio", "http", "websocket"],
        default="stdio",
        help="Transport type (default: stdio)",
    )

    parser.add_argument(
        "--host",
        "-H",
        default="127.0.0.1",
        help="Host to bind to for HTTP/WebSocket (default: 127.0.0.1)",
    )

    parser.add_argument(
        "--port",
        "-p",
        type=int,
        default=8765,
        help="Port to listen on for HTTP/WebSocket (default: 8765)",
    )

    parser.add_argument(
        "--config",
        "-c",
        type=Path,
        help="Path to configuration file (JSON or YAML)",
    )

    parser.add_argument(
        "--log-level",
        "-l",
        choices=["debug", "info", "warning", "error"],
        default="info",
        help="Log level (default: info)",
    )

    parser.add_argument(
        "--log-format",
        choices=["json", "console"],
        default="console",
        help="Log format (default: console)",
    )

    parser.add_argument(
        "--require-auth",
        action="store_true",
        help="Require API key authentication",
    )

    parser.add_argument(
        "--api-key",
        help="API key for authentication (or set WINDOWS_MCP_SECURITY__API_KEY)",
    )

    parser.add_argument(
        "--sandbox",
        action="store_true",
        default=True,
        help="Enable sandbox mode (default: enabled)",
    )

    parser.add_argument(
        "--no-sandbox",
        action="store_true",
        help="Disable sandbox mode (allows all file operations)",
    )

    parser.add_argument(
        "--generate-key",
        action="store_true",
        help="Generate a new API key and exit",
    )

    parser.add_argument(
        "--version",
        "-v",
        action="version",
        version="windows-mcp-server 1.0.0",
    )

    return parser.parse_args()


def build_settings(args: argparse.Namespace) -> Settings:
    """Build settings from command-line args and config file.

    Args:
        args: Parsed command-line arguments

    Returns:
        Configured Settings object
    """
    # Load from config file if provided
    if args.config:
        settings = Settings.from_file(args.config)
    else:
        settings = Settings.from_env()

    # Override with command-line arguments
    settings.server.transport = TransportType(args.transport)
    settings.server.host = args.host
    settings.server.port = args.port

    settings.logging.level = LogLevel(args.log_level)
    settings.logging.format = args.log_format

    if args.require_auth:
        settings.security.require_auth = True

    if args.api_key:
        settings.security.api_key = args.api_key

    if args.no_sandbox:
        settings.security.sandbox_mode = False

    return settings


async def run_server(settings: Settings) -> None:
    """Run the MCP server.

    Args:
        settings: Server configuration
    """
    server = MCPServer(settings)

    # Setup signal handlers
    loop = asyncio.get_event_loop()

    def handle_signal() -> None:
        logger.info("Received shutdown signal")
        asyncio.create_task(server.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    try:
        await server.start()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    finally:
        await server.stop()


def main() -> int:
    """Main entry point.

    Returns:
        Exit code
    """
    args = parse_args()

    # Handle special commands
    if args.generate_key:
        import secrets
        key = f"wmcp_{secrets.token_urlsafe(32)}"
        print(f"Generated API key: {key}")
        print("\nUse with:")
        print(f"  --api-key {key}")
        print("  or")
        print(f"  export WINDOWS_MCP_SECURITY__API_KEY={key}")
        return 0

    # Build settings
    try:
        settings = build_settings(args)
    except Exception as e:
        print(f"Error loading configuration: {e}", file=sys.stderr)
        return 1

    # Run server
    try:
        asyncio.run(run_server(settings))
        return 0
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
