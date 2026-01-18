"""
Sandbox Module - Path validation and access control.

Provides security controls for file system operations:
- Path allowlist/blocklist validation
- Directory traversal prevention
- Symlink attack prevention
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from windows_mcp_server.config.settings import SecuritySettings

logger = structlog.get_logger(__name__)


class PathValidator:
    """Validates and normalizes file paths for security."""

    def __init__(
        self,
        allowed_paths: list[str] | None = None,
        blocked_paths: list[str] | None = None,
    ) -> None:
        """Initialize the path validator.

        Args:
            allowed_paths: Paths that are allowed (if empty, all non-blocked paths allowed)
            blocked_paths: Paths that are always blocked
        """
        self.allowed_paths = [Path(p).resolve() for p in (allowed_paths or [])]
        self.blocked_paths = [Path(p).resolve() for p in (blocked_paths or [])]

    def normalize(self, path: str) -> Path:
        """Normalize and resolve a path.

        Args:
            path: Path to normalize

        Returns:
            Normalized Path object

        Raises:
            ValueError: If path is invalid or contains directory traversal
        """
        # Convert to Path and resolve
        try:
            normalized = Path(path).resolve()
        except Exception as e:
            raise ValueError(f"Invalid path: {path}") from e

        # Check for path traversal attempts in the original string
        if ".." in path:
            logger.warning("Path traversal attempt detected", path=path)
            raise ValueError("Path traversal not allowed")

        return normalized

    def is_allowed(self, path: str) -> bool:
        """Check if a path is allowed.

        Args:
            path: Path to check

        Returns:
            True if path is allowed
        """
        try:
            normalized = self.normalize(path)
        except ValueError:
            return False

        # Check against blocked paths first
        for blocked in self.blocked_paths:
            try:
                normalized.relative_to(blocked)
                logger.debug("Path is blocked", path=str(normalized), blocked=str(blocked))
                return False
            except ValueError:
                # Not under this blocked path
                pass

        # If we have allowed paths, check against them
        if self.allowed_paths:
            for allowed in self.allowed_paths:
                try:
                    normalized.relative_to(allowed)
                    return True
                except ValueError:
                    pass
            # Not under any allowed path
            logger.debug("Path not in allowed list", path=str(normalized))
            return False

        # No allowed paths specified, and path is not blocked
        return True

    def validate(self, path: str) -> Path:
        """Validate a path and return normalized version.

        Args:
            path: Path to validate

        Returns:
            Normalized Path object

        Raises:
            PermissionError: If path is not allowed
        """
        normalized = self.normalize(path)

        if not self.is_allowed(path):
            raise PermissionError(f"Access denied: {path}")

        return normalized


class Sandbox:
    """Manages sandboxed execution environment."""

    def __init__(self, settings: SecuritySettings) -> None:
        """Initialize the sandbox.

        Args:
            settings: Security settings
        """
        self.settings = settings
        self.enabled = settings.sandbox_mode
        self.path_validator = PathValidator(
            allowed_paths=settings.allowed_paths,
            blocked_paths=settings.blocked_paths,
        )

    def check_file_access(
        self,
        path: str,
        operation: str = "read",
    ) -> Path:
        """Check if file access is allowed.

        Args:
            path: File path to check
            operation: Operation type (read, write, delete)

        Returns:
            Validated path

        Raises:
            PermissionError: If access is denied
        """
        if not self.enabled:
            return Path(path).resolve()

        validated_path = self.path_validator.validate(path)

        # Additional checks for write/delete operations
        if operation in ("write", "delete"):
            # Don't allow modifications to system directories
            protected_dirs = [
                Path(os.environ.get("WINDIR", "C:\\Windows")),
                Path(os.environ.get("PROGRAMFILES", "C:\\Program Files")),
                Path(os.environ.get("PROGRAMFILES(X86)", "C:\\Program Files (x86)")),
            ]

            for protected in protected_dirs:
                try:
                    validated_path.relative_to(protected)
                    raise PermissionError(
                        f"Cannot {operation} files in protected directory: {protected}"
                    )
                except ValueError:
                    pass

        logger.debug(
            "File access allowed",
            path=str(validated_path),
            operation=operation,
        )
        return validated_path

    def check_process_operation(
        self,
        operation: str,
        process_name: str | None = None,
        pid: int | None = None,
    ) -> None:
        """Check if a process operation is allowed.

        Args:
            operation: Operation type (start, stop, list)
            process_name: Name of process (for start)
            pid: Process ID (for stop)

        Raises:
            PermissionError: If operation is denied
        """
        if not self.settings.allow_process_management:
            raise PermissionError("Process management is disabled")

        # Block terminating critical processes
        protected_processes = {
            "system", "csrss.exe", "wininit.exe", "services.exe",
            "lsass.exe", "smss.exe", "winlogon.exe", "explorer.exe",
        }

        if operation == "stop" and process_name:
            if process_name.lower() in protected_processes:
                raise PermissionError(f"Cannot terminate protected process: {process_name}")

        logger.debug(
            "Process operation allowed",
            operation=operation,
            process_name=process_name,
            pid=pid,
        )

    def check_registry_access(
        self,
        key_path: str,
        operation: str = "read",
    ) -> None:
        """Check if registry access is allowed.

        Args:
            key_path: Registry key path
            operation: Operation type (read only supported)

        Raises:
            PermissionError: If access is denied
        """
        if not self.settings.allow_registry_access:
            raise PermissionError("Registry access is disabled")

        # Only allow read operations
        if operation != "read":
            raise PermissionError("Only registry read operations are allowed")

        # Block access to sensitive keys
        sensitive_keys = [
            "HKEY_LOCAL_MACHINE\\SAM",
            "HKEY_LOCAL_MACHINE\\SECURITY",
            "HKLM\\SAM",
            "HKLM\\SECURITY",
        ]

        key_upper = key_path.upper()
        for sensitive in sensitive_keys:
            if key_upper.startswith(sensitive.upper()):
                raise PermissionError(f"Access to sensitive registry key denied: {key_path}")

        logger.debug("Registry access allowed", key_path=key_path, operation=operation)

    def check_clipboard_access(self, operation: str) -> None:
        """Check if clipboard access is allowed.

        Args:
            operation: Operation type (read, write)

        Raises:
            PermissionError: If access is denied
        """
        if not self.settings.allow_clipboard_access:
            raise PermissionError("Clipboard access is disabled")

        logger.debug("Clipboard access allowed", operation=operation)
