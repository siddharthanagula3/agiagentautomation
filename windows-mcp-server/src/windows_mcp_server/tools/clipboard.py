"""
Clipboard Tools - Read and write to Windows clipboard.

Provides tools for:
- Reading clipboard content
- Setting clipboard content
"""

from __future__ import annotations

import sys
from typing import Any

import structlog

from windows_mcp_server.protocol.models import ToolParameter, ToolResult
from windows_mcp_server.tools.base import BaseTool

logger = structlog.get_logger(__name__)

# Platform check for Windows-specific imports
if sys.platform == "win32":
    import win32clipboard
    import win32con


class GetClipboardTool(BaseTool):
    """Get content from the clipboard."""

    name = "get_clipboard"
    description = "Get the current content of the Windows clipboard"
    category = "clipboard"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="format",
                description="Clipboard format to retrieve (text, unicode, html)",
                type="string",
                required=False,
                default="unicode",
                enum=["text", "unicode", "html"],
            ),
        ]

    async def execute(self, format: str = "unicode") -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Clipboard operations are only available on Windows")

        if self.sandbox:
            self.sandbox.check_clipboard_access("read")

        try:
            win32clipboard.OpenClipboard()

            try:
                # Determine format constant
                if format == "text":
                    cf = win32con.CF_TEXT
                elif format == "html":
                    # HTML format needs to be registered
                    cf = win32clipboard.RegisterClipboardFormat("HTML Format")
                else:
                    cf = win32con.CF_UNICODETEXT

                # Check if format is available
                if not win32clipboard.IsClipboardFormatAvailable(cf):
                    available_formats = []
                    cf_enum = 0
                    while True:
                        cf_enum = win32clipboard.EnumClipboardFormats(cf_enum)
                        if cf_enum == 0:
                            break
                        try:
                            name = win32clipboard.GetClipboardFormatName(cf_enum)
                        except Exception:
                            name = f"Format({cf_enum})"
                        available_formats.append(name)

                    return ToolResult.ok(
                        {
                            "content": None,
                            "format_available": False,
                            "available_formats": available_formats[:20],
                        }
                    )

                # Get clipboard data
                data = win32clipboard.GetClipboardData(cf)

                # Decode if bytes
                if isinstance(data, bytes):
                    try:
                        data = data.decode("utf-8")
                    except UnicodeDecodeError:
                        try:
                            data = data.decode("cp1252")
                        except UnicodeDecodeError:
                            data = data.hex()

                return ToolResult.ok(
                    {
                        "content": data[:100000] if data else "",  # Limit size
                        "format": format,
                        "length": len(data) if data else 0,
                    }
                )

            finally:
                win32clipboard.CloseClipboard()

        except Exception as e:
            logger.exception("Failed to read clipboard")
            return ToolResult.fail(f"Failed to read clipboard: {e}")


class SetClipboardTool(BaseTool):
    """Set content to the clipboard."""

    name = "set_clipboard"
    description = "Set content to the Windows clipboard"
    category = "clipboard"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="content",
                description="Content to set in the clipboard",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="format",
                description="Clipboard format (text, unicode)",
                type="string",
                required=False,
                default="unicode",
                enum=["text", "unicode"],
            ),
        ]

    async def execute(self, content: str, format: str = "unicode") -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Clipboard operations are only available on Windows")

        if self.sandbox:
            self.sandbox.check_clipboard_access("write")

        # Check content size
        max_size = 1 * 1024 * 1024  # 1MB
        if len(content) > max_size:
            return ToolResult.fail(f"Content too large: {len(content)} bytes (max {max_size})")

        try:
            win32clipboard.OpenClipboard()

            try:
                win32clipboard.EmptyClipboard()

                if format == "text":
                    win32clipboard.SetClipboardText(content, win32con.CF_TEXT)
                else:
                    win32clipboard.SetClipboardText(content, win32con.CF_UNICODETEXT)

                return ToolResult.ok(
                    f"Set clipboard content ({len(content)} characters)",
                    metadata={"format": format, "length": len(content)},
                )

            finally:
                win32clipboard.CloseClipboard()

        except Exception as e:
            logger.exception("Failed to set clipboard")
            return ToolResult.fail(f"Failed to set clipboard: {e}")
