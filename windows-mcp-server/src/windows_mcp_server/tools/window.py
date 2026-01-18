"""
Window Management Tools - List, find, and manipulate windows.

Provides tools for:
- Listing all windows
- Getting active window
- Finding windows by title
- Minimizing/maximizing/restoring windows
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
    import ctypes
    from ctypes import wintypes

    user32 = ctypes.windll.user32

    # Window show commands
    SW_HIDE = 0
    SW_MINIMIZE = 6
    SW_MAXIMIZE = 3
    SW_RESTORE = 9
    SW_SHOW = 5

    # Window enumeration callback type
    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)


def _get_window_info(hwnd: int) -> dict[str, Any] | None:
    """Get information about a window.

    Args:
        hwnd: Window handle

    Returns:
        Window info dict or None if invalid
    """
    if sys.platform != "win32":
        return None

    try:
        # Check if window is valid and visible
        if not user32.IsWindow(hwnd):
            return None

        # Get window title
        title_length = user32.GetWindowTextLengthW(hwnd)
        if title_length == 0:
            return None  # Skip windows without titles

        title_buffer = ctypes.create_unicode_buffer(title_length + 1)
        user32.GetWindowTextW(hwnd, title_buffer, title_length + 1)
        title = title_buffer.value

        if not title:
            return None

        # Get window rectangle
        rect = wintypes.RECT()
        user32.GetWindowRect(hwnd, ctypes.byref(rect))

        # Get window state
        is_visible = bool(user32.IsWindowVisible(hwnd))
        is_minimized = bool(user32.IsIconic(hwnd))
        is_maximized = bool(user32.IsZoomed(hwnd))

        # Get process ID
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

        # Get class name
        class_buffer = ctypes.create_unicode_buffer(256)
        user32.GetClassNameW(hwnd, class_buffer, 256)

        return {
            "hwnd": hwnd,
            "title": title,
            "class_name": class_buffer.value,
            "pid": pid.value,
            "visible": is_visible,
            "minimized": is_minimized,
            "maximized": is_maximized,
            "position": {
                "left": rect.left,
                "top": rect.top,
                "right": rect.right,
                "bottom": rect.bottom,
            },
            "size": {
                "width": rect.right - rect.left,
                "height": rect.bottom - rect.top,
            },
        }
    except Exception as e:
        logger.debug("Failed to get window info", hwnd=hwnd, error=str(e))
        return None


class ListWindowsTool(BaseTool):
    """List all visible windows."""

    name = "list_windows"
    description = "List all visible windows on the desktop"
    category = "window"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="include_hidden",
                description="Include hidden windows",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="filter_title",
                description="Filter windows by title (case-insensitive)",
                type="string",
                required=False,
            ),
        ]

    async def execute(
        self,
        include_hidden: bool = False,
        filter_title: str | None = None,
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Window operations are only available on Windows")

        windows: list[dict[str, Any]] = []

        def enum_callback(hwnd: int, _: int) -> bool:
            info = _get_window_info(hwnd)
            if info:
                # Apply visibility filter
                if not include_hidden and not info["visible"]:
                    return True

                # Apply title filter
                if filter_title:
                    if filter_title.lower() not in info["title"].lower():
                        return True

                windows.append(info)
            return True

        callback = WNDENUMPROC(enum_callback)
        user32.EnumWindows(callback, 0)

        # Sort by title
        windows.sort(key=lambda w: w["title"].lower())

        return ToolResult.ok(
            windows,
            metadata={"window_count": len(windows)},
        )


class GetActiveWindowTool(BaseTool):
    """Get the currently active window."""

    name = "get_active_window"
    description = "Get information about the currently active (foreground) window"
    category = "window"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return []

    async def execute(self) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Window operations are only available on Windows")

        hwnd = user32.GetForegroundWindow()
        if not hwnd:
            return ToolResult.ok({"active_window": None})

        info = _get_window_info(hwnd)
        if not info:
            return ToolResult.ok({"active_window": None})

        return ToolResult.ok(info)


class SetWindowStateTool(BaseTool):
    """Set window state (minimize, maximize, restore)."""

    name = "set_window_state"
    description = "Minimize, maximize, restore, or focus a window"
    category = "window"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="hwnd",
                description="Window handle",
                type="number",
                required=False,
            ),
            ToolParameter(
                name="title",
                description="Window title to find (if hwnd not provided)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="state",
                description="Window state to set",
                type="string",
                required=True,
                enum=["minimize", "maximize", "restore", "focus", "hide", "show"],
            ),
        ]

    async def execute(
        self,
        state: str,
        hwnd: int | None = None,
        title: str | None = None,
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Window operations are only available on Windows")

        # Find window by title if hwnd not provided
        if not hwnd and title:
            found_hwnd = user32.FindWindowW(None, title)
            if not found_hwnd:
                # Try partial match
                def find_callback(h: int, _: int) -> bool:
                    nonlocal hwnd
                    info = _get_window_info(h)
                    if info and title.lower() in info["title"].lower():
                        hwnd = h
                        return False  # Stop enumeration
                    return True

                callback = WNDENUMPROC(find_callback)
                user32.EnumWindows(callback, 0)
            else:
                hwnd = found_hwnd

        if not hwnd:
            return ToolResult.fail("Window not found. Provide hwnd or valid title.")

        # Get window info before change
        info = _get_window_info(hwnd)
        if not info:
            return ToolResult.fail(f"Invalid window handle: {hwnd}")

        # Apply state change
        state_map = {
            "minimize": SW_MINIMIZE,
            "maximize": SW_MAXIMIZE,
            "restore": SW_RESTORE,
            "hide": SW_HIDE,
            "show": SW_SHOW,
        }

        if state == "focus":
            # Bring window to foreground
            user32.SetForegroundWindow(hwnd)
            user32.ShowWindow(hwnd, SW_RESTORE)
        else:
            show_cmd = state_map.get(state)
            if show_cmd is None:
                return ToolResult.fail(f"Unknown state: {state}")
            user32.ShowWindow(hwnd, show_cmd)

        return ToolResult.ok(
            f"Set window '{info['title']}' to state: {state}",
            metadata={
                "hwnd": hwnd,
                "title": info["title"],
                "new_state": state,
            },
        )


class FindWindowTool(BaseTool):
    """Find a window by class name or title."""

    name = "find_window"
    description = "Find a window by its class name or title"
    category = "window"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="title",
                description="Window title to search for (partial match)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="class_name",
                description="Window class name to search for (exact match)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="pid",
                description="Process ID to filter by",
                type="number",
                required=False,
            ),
        ]

    async def execute(
        self,
        title: str | None = None,
        class_name: str | None = None,
        pid: int | None = None,
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Window operations are only available on Windows")

        if not title and not class_name and not pid:
            return ToolResult.fail("At least one of title, class_name, or pid must be provided")

        results: list[dict[str, Any]] = []

        def search_callback(hwnd: int, _: int) -> bool:
            info = _get_window_info(hwnd)
            if not info:
                return True

            match = True

            if title and title.lower() not in info["title"].lower():
                match = False

            if class_name and info["class_name"] != class_name:
                match = False

            if pid and info["pid"] != pid:
                match = False

            if match:
                results.append(info)

            return True

        callback = WNDENUMPROC(search_callback)
        user32.EnumWindows(callback, 0)

        return ToolResult.ok(
            results,
            metadata={
                "search_title": title,
                "search_class": class_name,
                "search_pid": pid,
                "result_count": len(results),
            },
        )
