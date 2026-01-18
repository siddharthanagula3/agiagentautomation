"""
Base Tool Class - Abstract base for all MCP tools.

All tools inherit from BaseTool and implement the execute method.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

import structlog

from windows_mcp_server.protocol.models import ToolDefinition, ToolParameter, ToolResult

if TYPE_CHECKING:
    from windows_mcp_server.security.sandbox import Sandbox

logger = structlog.get_logger(__name__)


class BaseTool(ABC):
    """Abstract base class for MCP tools."""

    # Tool metadata - override in subclasses
    name: str = "base_tool"
    description: str = "Base tool"
    category: str = "general"
    requires_auth: bool = False
    is_destructive: bool = False

    def __init__(self, sandbox: Sandbox | None = None) -> None:
        """Initialize the tool.

        Args:
            sandbox: Security sandbox for access control
        """
        self.sandbox = sandbox

    @abstractmethod
    def get_parameters(self) -> list[ToolParameter]:
        """Get the parameters for this tool.

        Returns:
            List of tool parameters
        """
        pass

    @abstractmethod
    async def execute(self, **kwargs: Any) -> ToolResult:
        """Execute the tool with given arguments.

        Args:
            **kwargs: Tool arguments

        Returns:
            Tool execution result
        """
        pass

    def get_definition(self) -> ToolDefinition:
        """Get the tool definition for MCP.

        Returns:
            Tool definition with schema
        """
        return ToolDefinition(
            name=self.name,
            description=self.description,
            parameters=self.get_parameters(),
            category=self.category,
            requires_auth=self.requires_auth,
            is_destructive=self.is_destructive,
        )

    async def safe_execute(self, **kwargs: Any) -> ToolResult:
        """Execute with error handling wrapper.

        Args:
            **kwargs: Tool arguments

        Returns:
            Tool execution result
        """
        try:
            logger.info(
                "Executing tool",
                tool=self.name,
                args={k: v for k, v in kwargs.items() if k not in ("password", "secret")},
            )
            result = await self.execute(**kwargs)
            logger.info(
                "Tool execution complete",
                tool=self.name,
                success=result.success,
            )
            return result
        except PermissionError as e:
            logger.warning("Permission denied", tool=self.name, error=str(e))
            return ToolResult.fail(f"Permission denied: {e}")
        except FileNotFoundError as e:
            logger.warning("File not found", tool=self.name, error=str(e))
            return ToolResult.fail(f"File not found: {e}")
        except TimeoutError as e:
            logger.warning("Operation timeout", tool=self.name, error=str(e))
            return ToolResult.fail(f"Operation timeout: {e}")
        except Exception as e:
            logger.exception("Tool execution failed", tool=self.name)
            return ToolResult.fail(f"Execution error: {e}")
