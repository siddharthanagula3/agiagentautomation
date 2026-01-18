"""
Tool Registry - Central registry for all available tools.

Manages tool registration, discovery, and execution.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import structlog

from windows_mcp_server.protocol.models import ToolDefinition, ToolResult

if TYPE_CHECKING:
    from windows_mcp_server.config.settings import Settings
    from windows_mcp_server.security.sandbox import Sandbox
    from windows_mcp_server.tools.base import BaseTool

logger = structlog.get_logger(__name__)


class ToolRegistry:
    """Registry for MCP tools."""

    def __init__(self, sandbox: Sandbox | None = None) -> None:
        """Initialize the registry.

        Args:
            sandbox: Security sandbox for tools
        """
        self.sandbox = sandbox
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool.

        Args:
            tool: Tool instance to register
        """
        if tool.name in self._tools:
            logger.warning("Overwriting existing tool", tool=tool.name)

        self._tools[tool.name] = tool
        logger.info("Registered tool", tool=tool.name, category=tool.category)

    def unregister(self, name: str) -> bool:
        """Unregister a tool.

        Args:
            name: Tool name

        Returns:
            True if tool was found and removed
        """
        if name in self._tools:
            del self._tools[name]
            logger.info("Unregistered tool", tool=name)
            return True
        return False

    def get(self, name: str) -> BaseTool | None:
        """Get a tool by name.

        Args:
            name: Tool name

        Returns:
            Tool instance or None if not found
        """
        return self._tools.get(name)

    def list_tools(self) -> list[ToolDefinition]:
        """Get definitions for all registered tools.

        Returns:
            List of tool definitions
        """
        return [tool.get_definition() for tool in self._tools.values()]

    def list_by_category(self, category: str) -> list[ToolDefinition]:
        """Get tools filtered by category.

        Args:
            category: Category to filter by

        Returns:
            List of tool definitions in the category
        """
        return [
            tool.get_definition()
            for tool in self._tools.values()
            if tool.category == category
        ]

    async def execute_tool(self, name: str, arguments: dict[str, Any]) -> ToolResult:
        """Execute a tool by name.

        Args:
            name: Tool name
            arguments: Tool arguments

        Returns:
            Tool execution result
        """
        tool = self._tools.get(name)
        if not tool:
            logger.warning("Tool not found", tool=name)
            return ToolResult.fail(f"Tool not found: {name}")

        return await tool.safe_execute(**arguments)

    @classmethod
    def create_default(cls, settings: Settings, sandbox: Sandbox) -> ToolRegistry:
        """Create a registry with default Windows tools.

        Args:
            settings: Application settings
            sandbox: Security sandbox

        Returns:
            Configured tool registry
        """
        registry = cls(sandbox)

        # Import and register all tools
        from windows_mcp_server.tools.filesystem import (
            ReadFileTool,
            WriteFileTool,
            ListDirectoryTool,
            CreateDirectoryTool,
            DeleteFileTool,
            CopyFileTool,
            MoveFileTool,
            FileInfoTool,
            SearchFilesTool,
            WatchFileTool,
        )
        from windows_mcp_server.tools.process import (
            ListProcessesTool,
            StartProcessTool,
            StopProcessTool,
            ProcessInfoTool,
            ExecuteCommandTool,
        )
        from windows_mcp_server.tools.windows_registry import (
            ReadRegistryTool,
            ListRegistryKeysTool,
            SearchRegistryTool,
        )
        from windows_mcp_server.tools.clipboard import (
            GetClipboardTool,
            SetClipboardTool,
        )
        from windows_mcp_server.tools.window import (
            ListWindowsTool,
            GetActiveWindowTool,
            SetWindowStateTool,
            FindWindowTool,
        )
        from windows_mcp_server.tools.system import (
            SystemInfoTool,
            DiskInfoTool,
            MemoryInfoTool,
            EnvironmentVariableTool,
        )

        # File system tools
        registry.register(ReadFileTool(sandbox))
        registry.register(WriteFileTool(sandbox))
        registry.register(ListDirectoryTool(sandbox))
        registry.register(CreateDirectoryTool(sandbox))
        registry.register(DeleteFileTool(sandbox))
        registry.register(CopyFileTool(sandbox))
        registry.register(MoveFileTool(sandbox))
        registry.register(FileInfoTool(sandbox))
        registry.register(SearchFilesTool(sandbox))
        registry.register(WatchFileTool(sandbox))

        # Process tools
        if settings.security.allow_process_management:
            registry.register(ListProcessesTool(sandbox))
            registry.register(StartProcessTool(sandbox))
            registry.register(StopProcessTool(sandbox))
            registry.register(ProcessInfoTool(sandbox))
            registry.register(ExecuteCommandTool(sandbox))

        # Registry tools
        if settings.security.allow_registry_access:
            registry.register(ReadRegistryTool(sandbox))
            registry.register(ListRegistryKeysTool(sandbox))
            registry.register(SearchRegistryTool(sandbox))

        # Clipboard tools
        if settings.security.allow_clipboard_access:
            registry.register(GetClipboardTool(sandbox))
            registry.register(SetClipboardTool(sandbox))

        # Window management tools
        registry.register(ListWindowsTool(sandbox))
        registry.register(GetActiveWindowTool(sandbox))
        registry.register(SetWindowStateTool(sandbox))
        registry.register(FindWindowTool(sandbox))

        # System info tools
        registry.register(SystemInfoTool(sandbox))
        registry.register(DiskInfoTool(sandbox))
        registry.register(MemoryInfoTool(sandbox))
        registry.register(EnvironmentVariableTool(sandbox))

        logger.info("Registered default tools", count=len(registry._tools))
        return registry
