"""
Windows MCP Server - Model Context Protocol server for Windows automation.

This package provides a fully functional MCP server that exposes Windows-specific
tools for AI agents, including file system operations, process management,
registry access, clipboard operations, and window management.
"""

from windows_mcp_server.server import MCPServer
from windows_mcp_server.config.settings import Settings

__version__ = "1.0.0"
__all__ = ["MCPServer", "Settings", "__version__"]
