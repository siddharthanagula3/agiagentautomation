"""
File System Tools - File and directory operations.

Provides tools for:
- Reading and writing files
- Directory listing and creation
- File copying, moving, and deletion
- File search and watch
"""

from __future__ import annotations

import asyncio
import fnmatch
import os
import shutil
import stat
from datetime import datetime
from pathlib import Path
from typing import Any

import aiofiles
import structlog

from windows_mcp_server.protocol.models import ToolParameter, ToolResult
from windows_mcp_server.tools.base import BaseTool

logger = structlog.get_logger(__name__)


class ReadFileTool(BaseTool):
    """Read contents of a file."""

    name = "read_file"
    description = "Read the contents of a file at the specified path"
    category = "filesystem"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to the file to read",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="encoding",
                description="File encoding (default: utf-8)",
                type="string",
                required=False,
                default="utf-8",
            ),
            ToolParameter(
                name="offset",
                description="Byte offset to start reading from",
                type="number",
                required=False,
                default=0,
            ),
            ToolParameter(
                name="limit",
                description="Maximum bytes to read (0 for unlimited)",
                type="number",
                required=False,
                default=0,
            ),
        ]

    async def execute(
        self,
        path: str,
        encoding: str = "utf-8",
        offset: int = 0,
        limit: int = 0,
    ) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "read")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"File not found: {path}")

        if not validated_path.is_file():
            return ToolResult.fail(f"Path is not a file: {path}")

        try:
            async with aiofiles.open(validated_path, mode="r", encoding=encoding) as f:
                if offset > 0:
                    await f.seek(offset)
                if limit > 0:
                    content = await f.read(limit)
                else:
                    content = await f.read()

            return ToolResult.ok(
                content,
                metadata={
                    "path": str(validated_path),
                    "size": len(content),
                    "encoding": encoding,
                },
            )
        except UnicodeDecodeError:
            # Try reading as binary
            async with aiofiles.open(validated_path, mode="rb") as f:
                if offset > 0:
                    await f.seek(offset)
                if limit > 0:
                    binary_content = await f.read(limit)
                else:
                    binary_content = await f.read()

            return ToolResult.ok(
                f"<binary file, {len(binary_content)} bytes>",
                metadata={"path": str(validated_path), "binary": True},
            )


class WriteFileTool(BaseTool):
    """Write content to a file."""

    name = "write_file"
    description = "Write content to a file, creating it if it doesn't exist"
    category = "filesystem"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to the file to write",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="content",
                description="Content to write to the file",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="encoding",
                description="File encoding (default: utf-8)",
                type="string",
                required=False,
                default="utf-8",
            ),
            ToolParameter(
                name="append",
                description="Append to file instead of overwriting",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="create_dirs",
                description="Create parent directories if they don't exist",
                type="boolean",
                required=False,
                default=True,
            ),
        ]

    async def execute(
        self,
        path: str,
        content: str,
        encoding: str = "utf-8",
        append: bool = False,
        create_dirs: bool = True,
    ) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "write")
        else:
            validated_path = Path(path).resolve()

        # Create parent directories if requested
        if create_dirs and not validated_path.parent.exists():
            validated_path.parent.mkdir(parents=True, exist_ok=True)

        mode = "a" if append else "w"

        async with aiofiles.open(validated_path, mode=mode, encoding=encoding) as f:
            await f.write(content)

        return ToolResult.ok(
            f"Successfully wrote {len(content)} bytes to {path}",
            metadata={
                "path": str(validated_path),
                "bytes_written": len(content),
                "mode": "append" if append else "write",
            },
        )


class ListDirectoryTool(BaseTool):
    """List contents of a directory."""

    name = "list_directory"
    description = "List files and subdirectories in a directory"
    category = "filesystem"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to the directory to list",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="pattern",
                description="Glob pattern to filter entries (e.g., '*.txt')",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="recursive",
                description="List contents recursively",
                type="boolean",
                required=False,
                default=False,
            ),
            ToolParameter(
                name="include_hidden",
                description="Include hidden files (starting with .)",
                type="boolean",
                required=False,
                default=False,
            ),
        ]

    async def execute(
        self,
        path: str,
        pattern: str | None = None,
        recursive: bool = False,
        include_hidden: bool = False,
    ) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "read")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"Directory not found: {path}")

        if not validated_path.is_dir():
            return ToolResult.fail(f"Path is not a directory: {path}")

        entries: list[dict[str, Any]] = []

        def process_entry(entry_path: Path) -> dict[str, Any] | None:
            name = entry_path.name

            # Skip hidden files unless requested
            if not include_hidden and name.startswith("."):
                return None

            # Apply pattern filter
            if pattern and not fnmatch.fnmatch(name, pattern):
                return None

            try:
                stat_info = entry_path.stat()
                return {
                    "name": name,
                    "path": str(entry_path),
                    "type": "directory" if entry_path.is_dir() else "file",
                    "size": stat_info.st_size,
                    "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                    "created": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
                }
            except (PermissionError, OSError) as e:
                return {
                    "name": name,
                    "path": str(entry_path),
                    "error": str(e),
                }

        if recursive:
            for root, dirs, files in os.walk(validated_path):
                root_path = Path(root)
                for name in dirs + files:
                    entry = process_entry(root_path / name)
                    if entry:
                        entries.append(entry)
        else:
            for item in validated_path.iterdir():
                entry = process_entry(item)
                if entry:
                    entries.append(entry)

        # Sort by name
        entries.sort(key=lambda x: (x.get("type", "") != "directory", x.get("name", "").lower()))

        return ToolResult.ok(
            entries,
            metadata={"path": str(validated_path), "count": len(entries)},
        )


class CreateDirectoryTool(BaseTool):
    """Create a directory."""

    name = "create_directory"
    description = "Create a new directory at the specified path"
    category = "filesystem"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path of the directory to create",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="parents",
                description="Create parent directories if they don't exist",
                type="boolean",
                required=False,
                default=True,
            ),
        ]

    async def execute(self, path: str, parents: bool = True) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "write")
        else:
            validated_path = Path(path).resolve()

        if validated_path.exists():
            if validated_path.is_dir():
                return ToolResult.ok(
                    f"Directory already exists: {path}",
                    metadata={"path": str(validated_path), "already_existed": True},
                )
            return ToolResult.fail(f"Path exists but is not a directory: {path}")

        validated_path.mkdir(parents=parents, exist_ok=True)

        return ToolResult.ok(
            f"Created directory: {path}",
            metadata={"path": str(validated_path)},
        )


class DeleteFileTool(BaseTool):
    """Delete a file or directory."""

    name = "delete_file"
    description = "Delete a file or directory at the specified path"
    category = "filesystem"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to delete",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="recursive",
                description="Delete directories recursively",
                type="boolean",
                required=False,
                default=False,
            ),
        ]

    async def execute(self, path: str, recursive: bool = False) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "delete")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"Path not found: {path}")

        if validated_path.is_file():
            validated_path.unlink()
            return ToolResult.ok(
                f"Deleted file: {path}",
                metadata={"path": str(validated_path), "type": "file"},
            )

        if validated_path.is_dir():
            if recursive:
                shutil.rmtree(validated_path)
            else:
                validated_path.rmdir()  # Will fail if not empty

            return ToolResult.ok(
                f"Deleted directory: {path}",
                metadata={"path": str(validated_path), "type": "directory"},
            )

        return ToolResult.fail(f"Unknown path type: {path}")


class CopyFileTool(BaseTool):
    """Copy a file or directory."""

    name = "copy_file"
    description = "Copy a file or directory to a new location"
    category = "filesystem"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="source",
                description="Source path to copy from",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="destination",
                description="Destination path to copy to",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="overwrite",
                description="Overwrite if destination exists",
                type="boolean",
                required=False,
                default=False,
            ),
        ]

    async def execute(
        self,
        source: str,
        destination: str,
        overwrite: bool = False,
    ) -> ToolResult:
        if self.sandbox:
            src_path = self.sandbox.check_file_access(source, "read")
            dst_path = self.sandbox.check_file_access(destination, "write")
        else:
            src_path = Path(source).resolve()
            dst_path = Path(destination).resolve()

        if not src_path.exists():
            return ToolResult.fail(f"Source not found: {source}")

        if dst_path.exists() and not overwrite:
            return ToolResult.fail(f"Destination already exists: {destination}")

        if src_path.is_file():
            shutil.copy2(src_path, dst_path)
        else:
            if dst_path.exists():
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)

        return ToolResult.ok(
            f"Copied {source} to {destination}",
            metadata={
                "source": str(src_path),
                "destination": str(dst_path),
            },
        )


class MoveFileTool(BaseTool):
    """Move a file or directory."""

    name = "move_file"
    description = "Move a file or directory to a new location"
    category = "filesystem"
    is_destructive = True

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="source",
                description="Source path to move from",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="destination",
                description="Destination path to move to",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="overwrite",
                description="Overwrite if destination exists",
                type="boolean",
                required=False,
                default=False,
            ),
        ]

    async def execute(
        self,
        source: str,
        destination: str,
        overwrite: bool = False,
    ) -> ToolResult:
        if self.sandbox:
            src_path = self.sandbox.check_file_access(source, "delete")
            dst_path = self.sandbox.check_file_access(destination, "write")
        else:
            src_path = Path(source).resolve()
            dst_path = Path(destination).resolve()

        if not src_path.exists():
            return ToolResult.fail(f"Source not found: {source}")

        if dst_path.exists():
            if not overwrite:
                return ToolResult.fail(f"Destination already exists: {destination}")
            if dst_path.is_dir():
                shutil.rmtree(dst_path)
            else:
                dst_path.unlink()

        shutil.move(str(src_path), str(dst_path))

        return ToolResult.ok(
            f"Moved {source} to {destination}",
            metadata={
                "source": str(src_path),
                "destination": str(dst_path),
            },
        )


class FileInfoTool(BaseTool):
    """Get detailed file information."""

    name = "file_info"
    description = "Get detailed information about a file or directory"
    category = "filesystem"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to get information about",
                type="string",
                required=True,
            ),
        ]

    async def execute(self, path: str) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "read")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"Path not found: {path}")

        stat_info = validated_path.stat()

        # Determine file type
        if validated_path.is_file():
            file_type = "file"
        elif validated_path.is_dir():
            file_type = "directory"
        elif validated_path.is_symlink():
            file_type = "symlink"
        else:
            file_type = "other"

        # Get permissions
        mode = stat_info.st_mode
        permissions = {
            "readable": bool(mode & stat.S_IRUSR),
            "writable": bool(mode & stat.S_IWUSR),
            "executable": bool(mode & stat.S_IXUSR),
            "mode_octal": oct(mode)[-3:],
        }

        info = {
            "path": str(validated_path),
            "name": validated_path.name,
            "type": file_type,
            "size": stat_info.st_size,
            "size_human": self._format_size(stat_info.st_size),
            "created": datetime.fromtimestamp(stat_info.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
            "accessed": datetime.fromtimestamp(stat_info.st_atime).isoformat(),
            "permissions": permissions,
            "extension": validated_path.suffix if validated_path.is_file() else None,
            "parent": str(validated_path.parent),
        }

        if validated_path.is_symlink():
            info["link_target"] = str(validated_path.readlink())

        return ToolResult.ok(info)

    @staticmethod
    def _format_size(size: int) -> str:
        """Format size in human-readable form."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


class SearchFilesTool(BaseTool):
    """Search for files matching criteria."""

    name = "search_files"
    description = "Search for files matching a pattern or containing text"
    category = "filesystem"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Directory to search in",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="pattern",
                description="Glob pattern to match file names (e.g., '*.txt')",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="content",
                description="Text to search for in file contents",
                type="string",
                required=False,
            ),
            ToolParameter(
                name="max_results",
                description="Maximum number of results to return",
                type="number",
                required=False,
                default=100,
            ),
            ToolParameter(
                name="recursive",
                description="Search recursively in subdirectories",
                type="boolean",
                required=False,
                default=True,
            ),
        ]

    async def execute(
        self,
        path: str,
        pattern: str | None = None,
        content: str | None = None,
        max_results: int = 100,
        recursive: bool = True,
    ) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "read")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"Directory not found: {path}")

        if not validated_path.is_dir():
            return ToolResult.fail(f"Path is not a directory: {path}")

        results: list[dict[str, Any]] = []

        async def search_content(file_path: Path) -> list[dict[str, int | str]]:
            """Search file content for matching text."""
            matches: list[dict[str, int | str]] = []
            try:
                async with aiofiles.open(file_path, "r", encoding="utf-8") as f:
                    line_num = 0
                    async for line in f:
                        line_num += 1
                        if content and content.lower() in line.lower():
                            matches.append({
                                "line": line_num,
                                "text": line.strip()[:200],  # Limit line length
                            })
            except (UnicodeDecodeError, PermissionError):
                pass
            return matches

        def walk_directory(dir_path: Path) -> list[Path]:
            """Walk directory and collect matching files."""
            files: list[Path] = []
            try:
                for item in dir_path.iterdir():
                    if item.is_file():
                        if pattern is None or fnmatch.fnmatch(item.name, pattern):
                            files.append(item)
                    elif item.is_dir() and recursive:
                        files.extend(walk_directory(item))
            except PermissionError:
                pass
            return files

        # Find matching files
        matching_files = walk_directory(validated_path)

        for file_path in matching_files[:max_results * 10]:  # Process more for content filtering
            if len(results) >= max_results:
                break

            result: dict[str, Any] = {
                "path": str(file_path),
                "name": file_path.name,
            }

            # If searching content, include matches
            if content:
                content_matches = await search_content(file_path)
                if content_matches:
                    result["matches"] = content_matches
                    results.append(result)
            else:
                results.append(result)

        return ToolResult.ok(
            results,
            metadata={
                "search_path": str(validated_path),
                "pattern": pattern,
                "content_search": content,
                "result_count": len(results),
            },
        )


class WatchFileTool(BaseTool):
    """Watch a file or directory for changes."""

    name = "watch_file"
    description = "Watch a file or directory for changes (one-time check)"
    category = "filesystem"
    is_destructive = False

    def get_parameters(self) -> list[ToolParameter]:
        return [
            ToolParameter(
                name="path",
                description="Path to watch",
                type="string",
                required=True,
            ),
            ToolParameter(
                name="timeout",
                description="Timeout in seconds to wait for changes",
                type="number",
                required=False,
                default=5,
            ),
        ]

    async def execute(self, path: str, timeout: float = 5) -> ToolResult:
        if self.sandbox:
            validated_path = self.sandbox.check_file_access(path, "read")
        else:
            validated_path = Path(path).resolve()

        if not validated_path.exists():
            return ToolResult.fail(f"Path not found: {path}")

        # Get initial state
        initial_stat = validated_path.stat()
        initial_mtime = initial_stat.st_mtime

        # Wait for changes
        start_time = asyncio.get_event_loop().time()
        changed = False

        while asyncio.get_event_loop().time() - start_time < timeout:
            await asyncio.sleep(0.5)

            try:
                current_stat = validated_path.stat()
                if current_stat.st_mtime != initial_mtime:
                    changed = True
                    break
            except FileNotFoundError:
                return ToolResult.ok(
                    {"changed": True, "event": "deleted"},
                    metadata={"path": str(validated_path)},
                )

        if changed:
            return ToolResult.ok(
                {"changed": True, "event": "modified"},
                metadata={
                    "path": str(validated_path),
                    "old_mtime": datetime.fromtimestamp(initial_mtime).isoformat(),
                    "new_mtime": datetime.fromtimestamp(current_stat.st_mtime).isoformat(),
                },
            )

        return ToolResult.ok(
            {"changed": False},
            metadata={
                "path": str(validated_path),
                "timeout": timeout,
            },
        )
