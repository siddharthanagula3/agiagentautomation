"""
System Information Tools - System, disk, and memory information.

Provides tools for:
- System information
- Disk usage
- Memory usage
- Environment variables
"""

from __future__ import annotations

import os
import platform
import socket
import sys
from datetime import datetime
from typing import Any

import psutil
import structlog

from windows_mcp_server.protocol.models import ToolParameter, ToolResult
from windows_mcp_server.tools.base import BaseTool

logger = structlog.get_logger(__name__)


class SystemInfoTool(BaseTool):
    """Get system information."""

    name = "system_info"
    description = "Get comprehensive system information"
    category = "system"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return []

    async def execute(self) -> ToolResult:
        # Basic system info
        uname = platform.uname()

        # Boot time
        boot_time = datetime.fromtimestamp(psutil.boot_time())

        # CPU info
        cpu_info = {
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
            "max_frequency": None,
            "current_frequency": None,
            "cpu_percent": psutil.cpu_percent(interval=0.1),
        }

        try:
            freq = psutil.cpu_freq()
            if freq:
                cpu_info["max_frequency"] = f"{freq.max:.0f} MHz"
                cpu_info["current_frequency"] = f"{freq.current:.0f} MHz"
        except Exception:
            pass

        # Network info
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
        except Exception:
            hostname = platform.node()
            local_ip = None

        network_info = {
            "hostname": hostname,
            "local_ip": local_ip,
        }

        # Try to get more network details
        try:
            interfaces = {}
            for name, addrs in psutil.net_if_addrs().items():
                interfaces[name] = []
                for addr in addrs:
                    if addr.family == socket.AF_INET:
                        interfaces[name].append({
                            "type": "IPv4",
                            "address": addr.address,
                            "netmask": addr.netmask,
                        })
                    elif addr.family == socket.AF_INET6:
                        interfaces[name].append({
                            "type": "IPv6",
                            "address": addr.address,
                        })
            network_info["interfaces"] = interfaces
        except Exception:
            pass

        # Battery info (if available)
        battery_info = None
        try:
            battery = psutil.sensors_battery()
            if battery:
                battery_info = {
                    "percent": battery.percent,
                    "plugged_in": battery.power_plugged,
                    "time_left": str(battery.secsleft // 60) + " minutes" if battery.secsleft > 0 else None,
                }
        except Exception:
            pass

        info = {
            "system": {
                "name": uname.system,
                "node": uname.node,
                "release": uname.release,
                "version": uname.version,
                "machine": uname.machine,
                "processor": uname.processor or platform.processor(),
            },
            "python": {
                "version": sys.version,
                "implementation": platform.python_implementation(),
            },
            "boot_time": boot_time.isoformat(),
            "uptime_hours": round((datetime.now() - boot_time).total_seconds() / 3600, 1),
            "cpu": cpu_info,
            "network": network_info,
        }

        if battery_info:
            info["battery"] = battery_info

        return ToolResult.ok(info)


class DiskInfoTool(BaseTool):
    """Get disk usage information."""

    name = "disk_info"
    description = "Get disk usage information for all mounted drives"
    category = "system"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Specific path to check (optional)",
                type="string",
                required=False,
            ),
        ]

    async def execute(self, path: str | None = None) -> ToolResult:
        disks: list[dict[str, Any]] = []

        if path:
            # Get info for specific path
            try:
                usage = psutil.disk_usage(path)
                disks.append({
                    "path": path,
                    "total": usage.total,
                    "total_human": self._format_size(usage.total),
                    "used": usage.used,
                    "used_human": self._format_size(usage.used),
                    "free": usage.free,
                    "free_human": self._format_size(usage.free),
                    "percent_used": usage.percent,
                })
            except Exception as e:
                return ToolResult.fail(f"Failed to get disk info for {path}: {e}")
        else:
            # Get info for all partitions
            for partition in psutil.disk_partitions(all=False):
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disks.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total": usage.total,
                        "total_human": self._format_size(usage.total),
                        "used": usage.used,
                        "used_human": self._format_size(usage.used),
                        "free": usage.free,
                        "free_human": self._format_size(usage.free),
                        "percent_used": usage.percent,
                    })
                except (PermissionError, OSError):
                    # Some partitions may not be accessible
                    disks.append({
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "error": "Access denied or not mounted",
                    })

        return ToolResult.ok(
            disks,
            metadata={"disk_count": len(disks)},
        )

    @staticmethod
    def _format_size(size: int) -> str:
        """Format size in human-readable form."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


class MemoryInfoTool(BaseTool):
    """Get memory usage information."""

    name = "memory_info"
    description = "Get system memory (RAM) and swap usage information"
    category = "system"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return []

    async def execute(self) -> ToolResult:
        # Virtual memory (RAM)
        vm = psutil.virtual_memory()
        memory = {
            "total": vm.total,
            "total_human": self._format_size(vm.total),
            "available": vm.available,
            "available_human": self._format_size(vm.available),
            "used": vm.used,
            "used_human": self._format_size(vm.used),
            "percent_used": vm.percent,
        }

        # Swap memory
        swap = psutil.swap_memory()
        swap_info = {
            "total": swap.total,
            "total_human": self._format_size(swap.total),
            "used": swap.used,
            "used_human": self._format_size(swap.used),
            "free": swap.free,
            "free_human": self._format_size(swap.free),
            "percent_used": swap.percent,
        }

        return ToolResult.ok({
            "memory": memory,
            "swap": swap_info,
        })

    @staticmethod
    def _format_size(size: int) -> str:
        """Format size in human-readable form."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


class EnvironmentVariableTool(BaseTool):
    """Get or list environment variables."""

    name = "environment_variable"
    description = "Get the value of an environment variable or list all variables"
    category = "system"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="name",
                description="Name of the environment variable (omit to list all)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="filter",
                description="Filter variable names by pattern (case-insensitive)",
                type="string",
                required=False,
            ),
        ]

    async def execute(
        self,
        name: str | None = None,
        filter: str | None = None,
    ) -> ToolResult:
        if name:
            # Get specific variable
            value = os.environ.get(name)
            if value is None:
                return ToolResult.ok(
                    {"name": name, "value": None, "exists": False}
                )
            return ToolResult.ok(
                {"name": name, "value": value, "exists": True}
            )
        else:
            # List all variables
            variables: dict[str, str] = {}
            for key, value in os.environ.items():
                if filter:
                    if filter.lower() not in key.lower():
                        continue
                # Truncate long values
                variables[key] = value[:500] if len(value) > 500 else value

            # Sort by key
            sorted_vars = dict(sorted(variables.items(), key=lambda x: x[0].lower()))

            return ToolResult.ok(
                sorted_vars,
                metadata={"count": len(sorted_vars)},
            )
