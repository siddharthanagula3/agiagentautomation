"""
Process Management Tools - Process listing, starting, and stopping.

Provides tools for:
- Listing running processes
- Starting new processes
- Stopping processes
- Getting process details
- Executing commands
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import sys
from datetime import datetime
from typing import Any

import psutil
import structlog

from windows_mcp_server.protocol.models import ToolParameter, ToolResult
from windows_mcp_server.tools.base import BaseTool

logger = structlog.get_logger(__name__)


class ListProcessesTool(BaseTool):
    """List running processes."""

    name = "list_processes"
    description = "List all running processes on the system"
    category = "process"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="filter_name",
                description="Filter processes by name (case-insensitive)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="sort_by",
                description="Sort by: name, cpu, memory, pid",
                type="string",
                required=False,
                default="name",
                enum=["name", "cpu", "memory", "pid"],
            ),
            ToolParameter(
                name="limit",
                description="Maximum number of processes to return",
                type="number",
                required=False,
                default=50,
            ),
        ]

    async def execute(
        self,
        filter_name: str | None = None,
        sort_by: str = "name",
        limit: int = 50,
    ) -> ToolResult:
        processes: list[dict[str, Any]] = []

        for proc in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent", "status"]):
            try:
                info = proc.info
                name = info.get("name", "")

                # Apply name filter
                if filter_name and filter_name.lower() not in name.lower():
                    continue

                processes.append({
                    "pid": info.get("pid"),
                    "name": name,
                    "cpu_percent": info.get("cpu_percent", 0),
                    "memory_percent": round(info.get("memory_percent", 0), 2),
                    "status": info.get("status"),
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Sort processes
        sort_keys = {
            "name": lambda x: x["name"].lower(),
            "cpu": lambda x: -x["cpu_percent"],
            "memory": lambda x: -x["memory_percent"],
            "pid": lambda x: x["pid"],
        }
        processes.sort(key=sort_keys.get(sort_by, sort_keys["name"]))

        # Apply limit
        processes = processes[:limit]

        return ToolResult.ok(
            processes,
            metadata={"total_count": len(processes), "sort_by": sort_by},
        )


class StartProcessTool(BaseTool):
    """Start a new process."""

    name = "start_process"
    description = "Start a new process with the specified command"
    category = "process"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="command",
                description="Command to execute",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="args",
                description="Command arguments as a list",
                type="array",
                required=False,
            ),
            ToolParameter(
                name="working_dir",
                description="Working directory for the process",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="shell",
                description="Run command through shell",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="wait",
                description="Wait for process to complete",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="timeout",
                description="Timeout in seconds if waiting",
                type="number",
                required=False,
                default=60,
            ),
        ]

    async def execute(
        self,
        command: str,
        args: list[str] | None = None,
        working_dir: str | None = None,
        shell: bool = False,
        wait: bool = False,
        timeout: int = 60,
    ) -> ToolResult:
        if self.sandbox:
            self.sandbox.check_process_operation("start", process_name=command)
            if working_dir:
                self.sandbox.check_file_access(working_dir, "read")

        # Build command list
        cmd: list[str] | str
        if shell:
            cmd = command if not args else f"{command} {' '.join(args)}"
        else:
            cmd = [command] + (args or [])

        try:
            if wait:
                # Run and wait for completion
                process = await asyncio.wait_for(
                    asyncio.create_subprocess_shell(
                        cmd if isinstance(cmd, str) else " ".join(cmd),
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd=working_dir,
                    )
                    if shell
                    else asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd=working_dir,
                    ),
                    timeout=timeout,
                )

                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )

                return ToolResult.ok(
                    {
                        "pid": process.pid,
                        "return_code": process.returncode,
                        "stdout": stdout.decode("utf-8", errors="replace")[:10000],
                        "stderr": stderr.decode("utf-8", errors="replace")[:5000],
                    },
                    metadata={"command": command, "completed": True},
                )
            else:
                # Start and return immediately
                if shell:
                    process = await asyncio.create_subprocess_shell(
                        cmd if isinstance(cmd, str) else " ".join(cmd),
                        cwd=working_dir,
                    )
                else:
                    process = await asyncio.create_subprocess_exec(
                        *cmd,
                        cwd=working_dir,
                    )

                return ToolResult.ok(
                    {"pid": process.pid},
                    metadata={"command": command, "started": True},
                )

        except asyncio.TimeoutError:
            return ToolResult.fail(f"Process timed out after {timeout} seconds")
        except FileNotFoundError:
            return ToolResult.fail(f"Command not found: {command}")
        except PermissionError:
            return ToolResult.fail(f"Permission denied to execute: {command}")


class StopProcessTool(BaseTool):
    """Stop a running process."""

    name = "stop_process"
    description = "Stop a running process by PID or name"
    category = "process"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="pid",
                description="Process ID to stop",
                type="number",
                required=False,
            ),
            ToolParameter(
                name="name",
                description="Process name to stop (stops first match)",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="force",
                description="Force kill the process",
                type="boolean",
                required=False,
                default=False,
            ),
        ]

    async def execute(
        self,
        pid: int | None = None,
        name: str | None = None,
        force: bool = False,
    ) -> ToolResult:
        if not pid and not name:
            return ToolResult.fail("Either pid or name must be provided")

        # Find process
        target_process: psutil.Process | None = None

        if pid:
            try:
                target_process = psutil.Process(pid)
            except psutil.NoSuchProcess:
                return ToolResult.fail(f"Process with PID {pid} not found")
        else:
            for proc in psutil.process_iter(["pid", "name"]):
                try:
                    if proc.info["name"] and name.lower() in proc.info["name"].lower():
                        target_process = proc
                        break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            if not target_process:
                return ToolResult.fail(f"Process with name '{name}' not found")

        # Check sandbox permissions
        if self.sandbox:
            self.sandbox.check_process_operation(
                "stop",
                process_name=target_process.name(),
                pid=target_process.pid,
            )

        process_name = target_process.name()
        process_pid = target_process.pid

        try:
            if force:
                target_process.kill()
            else:
                target_process.terminate()

            # Wait briefly for process to exit
            try:
                target_process.wait(timeout=5)
            except psutil.TimeoutExpired:
                if not force:
                    logger.warning("Process did not terminate, forcing kill")
                    target_process.kill()
                    target_process.wait(timeout=5)

            return ToolResult.ok(
                f"Stopped process {process_name} (PID: {process_pid})",
                metadata={
                    "pid": process_pid,
                    "name": process_name,
                    "forced": force,
                },
            )

        except psutil.NoSuchProcess:
            return ToolResult.ok(
                f"Process already terminated",
                metadata={"pid": process_pid, "name": process_name},
            )
        except psutil.AccessDenied:
            return ToolResult.fail(f"Access denied to stop process {process_name}")


class ProcessInfoTool(BaseTool):
    """Get detailed information about a process."""

    name = "process_info"
    description = "Get detailed information about a running process"
    category = "process"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="pid",
                description="Process ID to get info for",
                type="number",
                required=True,
            ),
        ]

    async def execute(self, pid: int) -> ToolResult:
        try:
            proc = psutil.Process(pid)

            with proc.oneshot():
                info = {
                    "pid": proc.pid,
                    "name": proc.name(),
                    "status": proc.status(),
                    "created": datetime.fromtimestamp(proc.create_time()).isoformat(),
                    "cpu_percent": proc.cpu_percent(interval=0.1),
                    "memory_info": {
                        "rss": proc.memory_info().rss,
                        "rss_human": self._format_size(proc.memory_info().rss),
                        "vms": proc.memory_info().vms,
                        "vms_human": self._format_size(proc.memory_info().vms),
                    },
                    "memory_percent": round(proc.memory_percent(), 2),
                    "num_threads": proc.num_threads(),
                }

                try:
                    info["exe"] = proc.exe()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["exe"] = None

                try:
                    info["cmdline"] = proc.cmdline()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["cmdline"] = None

                try:
                    info["cwd"] = proc.cwd()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["cwd"] = None

                try:
                    info["username"] = proc.username()
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["username"] = None

                try:
                    parent = proc.parent()
                    info["parent"] = {
                        "pid": parent.pid,
                        "name": parent.name(),
                    } if parent else None
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["parent"] = None

                try:
                    children = proc.children()
                    info["children"] = [
                        {"pid": c.pid, "name": c.name()}
                        for c in children
                    ]
                except (psutil.AccessDenied, psutil.NoSuchProcess):
                    info["children"] = []

            return ToolResult.ok(info)

        except psutil.NoSuchProcess:
            return ToolResult.fail(f"Process with PID {pid} not found")
        except psutil.AccessDenied:
            return ToolResult.fail(f"Access denied to process {pid}")

    @staticmethod
    def _format_size(size: int) -> str:
        """Format size in human-readable form."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


class ExecuteCommandTool(BaseTool):
    """Execute a command and return output."""

    name = "execute_command"
    description = "Execute a shell command and return its output"
    category = "process"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="command",
                description="Command to execute",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="working_dir",
                description="Working directory for the command",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="timeout",
                description="Timeout in seconds",
                type="number",
                required=False,
                default=60,
            ),
            ToolParameter(
                name="env",
                description="Additional environment variables",
                type="object",
                required=False,
            ),
        ]

    async def execute(
        self,
        command: str,
        working_dir: str | None = None,
        timeout: int = 60,
        env: dict[str, str] | None = None,
    ) -> ToolResult:
        if self.sandbox:
            self.sandbox.check_process_operation("start", process_name=command.split()[0])
            if working_dir:
                self.sandbox.check_file_access(working_dir, "read")

        # Prepare environment
        process_env = os.environ.copy()
        if env:
            process_env.update(env)

        try:
            # Determine shell based on platform
            if sys.platform == "win32":
                shell_cmd = ["cmd", "/c", command]
            else:
                shell_cmd = ["/bin/sh", "-c", command]

            process = await asyncio.create_subprocess_exec(
                *shell_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=working_dir,
                env=process_env,
            )

            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), timeout=timeout
                )
            except asyncio.TimeoutError:
                process.kill()
                await process.wait()
                return ToolResult.fail(f"Command timed out after {timeout} seconds")

            stdout_text = stdout.decode("utf-8", errors="replace")
            stderr_text = stderr.decode("utf-8", errors="replace")

            result = {
                "return_code": process.returncode,
                "stdout": stdout_text[:50000],  # Limit output size
                "stderr": stderr_text[:10000],
            }

            if process.returncode == 0:
                return ToolResult.ok(result, metadata={"command": command})
            else:
                return ToolResult.ok(
                    result,
                    metadata={"command": command, "warning": "Non-zero exit code"},
                )

        except FileNotFoundError:
            return ToolResult.fail(f"Command not found: {command}")
        except PermissionError:
            return ToolResult.fail(f"Permission denied to execute: {command}")
