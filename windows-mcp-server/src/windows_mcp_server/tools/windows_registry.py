"""
Windows Registry Tools - Read-only registry access.

Provides tools for:
- Reading registry values
- Listing registry keys
- Searching registry
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
    import winreg

    # Registry hive mapping
    HIVE_MAP = {
        "HKEY_CLASSES_ROOT": winreg.HKEY_CLASSES_ROOT,
        "HKCR": winreg.HKEY_CLASSES_ROOT,
        "HKEY_CURRENT_USER": winreg.HKEY_CURRENT_USER,
        "HKCU": winreg.HKEY_CURRENT_USER,
        "HKEY_LOCAL_MACHINE": winreg.HKEY_LOCAL_MACHINE,
        "HKLM": winreg.HKEY_LOCAL_MACHINE,
        "HKEY_USERS": winreg.HKEY_USERS,
        "HKU": winreg.HKEY_USERS,
        "HKEY_CURRENT_CONFIG": winreg.HKEY_CURRENT_CONFIG,
        "HKCC": winreg.HKEY_CURRENT_CONFIG,
    }

    # Registry type mapping
    TYPE_MAP = {
        winreg.REG_SZ: "REG_SZ",
        winreg.REG_EXPAND_SZ: "REG_EXPAND_SZ",
        winreg.REG_BINARY: "REG_BINARY",
        winreg.REG_DWORD: "REG_DWORD",
        winreg.REG_DWORD_BIG_ENDIAN: "REG_DWORD_BIG_ENDIAN",
        winreg.REG_LINK: "REG_LINK",
        winreg.REG_MULTI_SZ: "REG_MULTI_SZ",
        winreg.REG_QWORD: "REG_QWORD",
        winreg.REG_NONE: "REG_NONE",
    }


def _parse_key_path(key_path: str) -> tuple[Any, str]:
    """Parse a registry key path into hive and subkey.

    Args:
        key_path: Full registry path (e.g., "HKLM\\SOFTWARE\\Microsoft")

    Returns:
        Tuple of (hive constant, subkey path)

    Raises:
        ValueError: If hive is not recognized
    """
    if sys.platform != "win32":
        raise RuntimeError("Registry operations are only available on Windows")

    parts = key_path.replace("/", "\\").split("\\", 1)
    hive_name = parts[0].upper()
    subkey = parts[1] if len(parts) > 1 else ""

    hive = HIVE_MAP.get(hive_name)
    if hive is None:
        raise ValueError(f"Unknown registry hive: {hive_name}")

    return hive, subkey


def _format_value(value: Any, value_type: int) -> Any:
    """Format a registry value for JSON serialization.

    Args:
        value: The registry value
        value_type: Registry value type

    Returns:
        JSON-serializable value
    """
    if sys.platform != "win32":
        return value

    if value_type == winreg.REG_BINARY:
        # Convert binary to hex string
        return value.hex() if isinstance(value, bytes) else str(value)
    return value


class ReadRegistryTool(BaseTool):
    """Read a registry value."""

    name = "read_registry"
    description = "Read a value from the Windows registry"
    category = "registry"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="key_path",
                description="Full registry key path (e.g., 'HKLM\\SOFTWARE\\Microsoft')",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="value_name",
                description="Name of the value to read (empty for default value)",
                type="string",
                required=False,
                default="",
            ),
        ]

    async def execute(
        self,
        key_path: str,
        value_name: str = "",
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Registry operations are only available on Windows")

        if self.sandbox:
            self.sandbox.check_registry_access(key_path, "read")

        try:
            hive, subkey = _parse_key_path(key_path)

            with winreg.OpenKey(hive, subkey, 0, winreg.KEY_READ) as key:
                value, value_type = winreg.QueryValueEx(key, value_name)

                return ToolResult.ok(
                    {
                        "key_path": key_path,
                        "value_name": value_name or "(Default)",
                        "value": _format_value(value, value_type),
                        "type": TYPE_MAP.get(value_type, f"UNKNOWN({value_type})"),
                    }
                )

        except FileNotFoundError:
            return ToolResult.fail(f"Registry key or value not found: {key_path}\\{value_name}")
        except PermissionError:
            return ToolResult.fail(f"Access denied to registry key: {key_path}")
        except ValueError as e:
            return ToolResult.fail(str(e))


class ListRegistryKeysTool(BaseTool):
    """List subkeys and values in a registry key."""

    name = "list_registry_keys"
    description = "List all subkeys and values in a Windows registry key"
    category = "registry"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="key_path",
                description="Full registry key path (e.g., 'HKLM\\SOFTWARE')",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="include_values",
                description="Include values in the listing",
                type="boolean",
                required=False,
                default=True,
            ),
        ]

    async def execute(
        self,
        key_path: str,
        include_values: bool = True,
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Registry operations are only available on Windows")

        if self.sandbox:
            self.sandbox.check_registry_access(key_path, "read")

        try:
            hive, subkey = _parse_key_path(key_path)

            subkeys: list[str] = []
            values: list[dict[str, Any]] = []

            with winreg.OpenKey(hive, subkey, 0, winreg.KEY_READ) as key:
                # Enumerate subkeys
                i = 0
                while True:
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        subkeys.append(subkey_name)
                        i += 1
                    except OSError:
                        break

                # Enumerate values
                if include_values:
                    i = 0
                    while True:
                        try:
                            name, value, value_type = winreg.EnumValue(key, i)
                            values.append({
                                "name": name or "(Default)",
                                "value": _format_value(value, value_type),
                                "type": TYPE_MAP.get(value_type, f"UNKNOWN({value_type})"),
                            })
                            i += 1
                        except OSError:
                            break

            result = {
                "key_path": key_path,
                "subkeys": subkeys,
                "subkey_count": len(subkeys),
            }

            if include_values:
                result["values"] = values
                result["value_count"] = len(values)

            return ToolResult.ok(result)

        except FileNotFoundError:
            return ToolResult.fail(f"Registry key not found: {key_path}")
        except PermissionError:
            return ToolResult.fail(f"Access denied to registry key: {key_path}")
        except ValueError as e:
            return ToolResult.fail(str(e))


class SearchRegistryTool(BaseTool):
    """Search registry for keys or values."""

    name = "search_registry"
    description = "Search Windows registry for keys or values matching a pattern"
    category = "registry"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="key_path",
                description="Starting registry key path for search",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="pattern",
                description="Pattern to search for (case-insensitive)",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="search_keys",
                description="Search in key names",
                type="boolean",
                required=False,
                default=True,
            ),
            ToolParameter(
                name="search_values",
                description="Search in value names",
                type="boolean",
                required=False,
                default=True,
            ),
            ToolParameter(
                name="search_data",
                description="Search in value data",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="max_results",
                description="Maximum number of results",
                type="number",
                required=False,
                default=50,
            ),
            ToolParameter(
                name="max_depth",
                description="Maximum recursion depth",
                type="number",
                required=False,
                default=5,
            ),
        ]

    async def execute(
        self,
        key_path: str,
        pattern: str,
        search_keys: bool = True,
        search_values: bool = True,
        search_data: bool = False,
        max_results: int = 50,
        max_depth: int = 5,
    ) -> ToolResult:
        if sys.platform != "win32":
            return ToolResult.fail("Registry operations are only available on Windows")

        if self.sandbox:
            self.sandbox.check_registry_access(key_path, "read")

        results: list[dict[str, Any]] = []
        pattern_lower = pattern.lower()

        def search_key(hive: Any, subkey: str, current_depth: int) -> None:
            """Recursively search a registry key."""
            if len(results) >= max_results or current_depth > max_depth:
                return

            full_path = f"{key_path.split('\\')[0]}\\{subkey}" if subkey else key_path.split("\\")[0]

            try:
                with winreg.OpenKey(hive, subkey, 0, winreg.KEY_READ) as key:
                    # Search subkeys
                    i = 0
                    subkey_names: list[str] = []
                    while True:
                        try:
                            subkey_name = winreg.EnumKey(key, i)
                            subkey_names.append(subkey_name)

                            if search_keys and pattern_lower in subkey_name.lower():
                                results.append({
                                    "type": "key",
                                    "path": f"{full_path}\\{subkey_name}",
                                    "match": subkey_name,
                                })

                            i += 1
                        except OSError:
                            break

                    # Search values
                    if search_values or search_data:
                        i = 0
                        while True:
                            try:
                                name, value, value_type = winreg.EnumValue(key, i)

                                if search_values and pattern_lower in (name or "").lower():
                                    results.append({
                                        "type": "value_name",
                                        "path": full_path,
                                        "name": name or "(Default)",
                                        "match": name,
                                    })

                                if search_data:
                                    str_value = str(value).lower()
                                    if pattern_lower in str_value:
                                        results.append({
                                            "type": "value_data",
                                            "path": full_path,
                                            "name": name or "(Default)",
                                            "value": _format_value(value, value_type),
                                        })

                                i += 1
                            except OSError:
                                break

                    # Recurse into subkeys
                    for subkey_name in subkey_names:
                        if len(results) >= max_results:
                            break
                        new_subkey = f"{subkey}\\{subkey_name}" if subkey else subkey_name
                        search_key(hive, new_subkey, current_depth + 1)

            except (FileNotFoundError, PermissionError):
                pass

        try:
            hive, subkey = _parse_key_path(key_path)
            search_key(hive, subkey, 0)

            return ToolResult.ok(
                results,
                metadata={
                    "search_path": key_path,
                    "pattern": pattern,
                    "result_count": len(results),
                    "max_reached": len(results) >= max_results,
                },
            )

        except ValueError as e:
            return ToolResult.fail(str(e))
