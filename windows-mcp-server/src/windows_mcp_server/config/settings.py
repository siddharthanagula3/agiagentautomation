"""
Configuration Settings - Environment-based configuration with validation.

Supports:
- Environment variables with WINDOWS_MCP_ prefix
- .env file loading
- Configuration file (JSON/YAML)
- Default values with type validation
"""

from __future__ import annotations

import os
from enum import Enum
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator


class LogLevel(str, Enum):
    """Log levels."""

    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class TransportType(str, Enum):
    """Transport types for MCP communication."""

    STDIO = "stdio"
    HTTP = "http"
    WEBSOCKET = "websocket"


class SecuritySettings(BaseModel):
    """Security-related settings."""

    require_auth: bool = Field(default=False, description="Require authentication")
    api_key: str | None = Field(default=None, description="API key for authentication")
    allowed_origins: list[str] = Field(
        default_factory=lambda: ["localhost", "127.0.0.1"],
        description="Allowed origins for CORS",
    )
    rate_limit_requests: int = Field(
        default=100, ge=1, description="Max requests per minute"
    )
    rate_limit_window: int = Field(
        default=60, ge=1, description="Rate limit window in seconds"
    )
    sandbox_mode: bool = Field(
        default=True, description="Restrict operations to safe directories"
    )
    allowed_paths: list[str] = Field(
        default_factory=list, description="Allowed paths in sandbox mode"
    )
    blocked_paths: list[str] = Field(
        default_factory=lambda: [
            "C:\\Windows\\System32",
            "C:\\Windows\\SysWOW64",
            "C:\\Program Files",
            "C:\\Program Files (x86)",
        ],
        description="Paths blocked from access",
    )
    allow_process_management: bool = Field(
        default=True, description="Allow process start/stop operations"
    )
    allow_registry_access: bool = Field(
        default=True, description="Allow registry read operations"
    )
    allow_clipboard_access: bool = Field(
        default=True, description="Allow clipboard operations"
    )


class ServerSettings(BaseModel):
    """Server configuration settings."""

    host: str = Field(default="127.0.0.1", description="Server host")
    port: int = Field(default=8765, ge=1, le=65535, description="Server port")
    transport: TransportType = Field(
        default=TransportType.STDIO, description="Transport type"
    )
    timeout: int = Field(
        default=30, ge=1, le=300, description="Request timeout in seconds"
    )
    max_concurrent_requests: int = Field(
        default=10, ge=1, description="Maximum concurrent requests"
    )


class LoggingSettings(BaseModel):
    """Logging configuration."""

    level: LogLevel = Field(default=LogLevel.INFO, description="Log level")
    format: str = Field(
        default="json", description="Log format (json or console)"
    )
    file: str | None = Field(default=None, description="Log file path")
    max_file_size: int = Field(
        default=10 * 1024 * 1024, ge=1024, description="Max log file size in bytes"
    )
    backup_count: int = Field(
        default=5, ge=0, description="Number of backup log files"
    )


class ToolSettings(BaseModel):
    """Tool-specific settings."""

    file_max_size: int = Field(
        default=10 * 1024 * 1024,
        ge=1024,
        description="Maximum file size for operations (bytes)",
    )
    file_allowed_extensions: list[str] = Field(
        default_factory=lambda: [
            ".txt", ".json", ".xml", ".yaml", ".yml", ".md", ".csv",
            ".log", ".ini", ".cfg", ".conf", ".bat", ".cmd", ".ps1",
            ".py", ".js", ".ts", ".html", ".css", ".sql",
        ],
        description="Allowed file extensions",
    )
    process_timeout: int = Field(
        default=60, ge=1, description="Process execution timeout"
    )
    registry_timeout: int = Field(
        default=10, ge=1, description="Registry operation timeout"
    )
    clipboard_max_size: int = Field(
        default=1 * 1024 * 1024,
        ge=1024,
        description="Maximum clipboard content size (bytes)",
    )


class Settings(BaseModel):
    """Main settings class combining all configuration sections."""

    server: ServerSettings = Field(default_factory=ServerSettings)
    security: SecuritySettings = Field(default_factory=SecuritySettings)
    logging: LoggingSettings = Field(default_factory=LoggingSettings)
    tools: ToolSettings = Field(default_factory=ToolSettings)

    @classmethod
    def from_env(cls, env_file: str | Path | None = None) -> Settings:
        """Load settings from environment variables.

        Environment variables use the prefix WINDOWS_MCP_ and nested keys
        are separated by double underscores.

        Examples:
            WINDOWS_MCP_SERVER__HOST=0.0.0.0
            WINDOWS_MCP_SECURITY__REQUIRE_AUTH=true
            WINDOWS_MCP_LOGGING__LEVEL=debug
        """
        if env_file:
            load_dotenv(env_file)
        else:
            load_dotenv()

        def get_env(key: str, default: Any = None) -> Any:
            """Get environment variable with prefix."""
            env_key = f"WINDOWS_MCP_{key.upper()}"
            return os.getenv(env_key, default)

        def parse_list(value: str | None) -> list[str]:
            """Parse comma-separated list from env var."""
            if not value:
                return []
            return [v.strip() for v in value.split(",") if v.strip()]

        def parse_bool(value: str | None, default: bool = False) -> bool:
            """Parse boolean from env var."""
            if not value:
                return default
            return value.lower() in ("true", "1", "yes", "on")

        server = ServerSettings(
            host=get_env("SERVER__HOST", "127.0.0.1"),
            port=int(get_env("SERVER__PORT", "8765")),
            transport=TransportType(get_env("SERVER__TRANSPORT", "stdio")),
            timeout=int(get_env("SERVER__TIMEOUT", "30")),
        )

        security = SecuritySettings(
            require_auth=parse_bool(get_env("SECURITY__REQUIRE_AUTH")),
            api_key=get_env("SECURITY__API_KEY"),
            sandbox_mode=parse_bool(get_env("SECURITY__SANDBOX_MODE"), True),
            allowed_paths=parse_list(get_env("SECURITY__ALLOWED_PATHS")),
            allow_process_management=parse_bool(
                get_env("SECURITY__ALLOW_PROCESS_MANAGEMENT"), True
            ),
            allow_registry_access=parse_bool(
                get_env("SECURITY__ALLOW_REGISTRY_ACCESS"), True
            ),
            allow_clipboard_access=parse_bool(
                get_env("SECURITY__ALLOW_CLIPBOARD_ACCESS"), True
            ),
        )

        logging_settings = LoggingSettings(
            level=LogLevel(get_env("LOGGING__LEVEL", "info")),
            format=get_env("LOGGING__FORMAT", "json"),
            file=get_env("LOGGING__FILE"),
        )

        tools = ToolSettings(
            file_max_size=int(get_env("TOOLS__FILE_MAX_SIZE", str(10 * 1024 * 1024))),
            process_timeout=int(get_env("TOOLS__PROCESS_TIMEOUT", "60")),
        )

        return cls(
            server=server,
            security=security,
            logging=logging_settings,
            tools=tools,
        )

    @classmethod
    def from_file(cls, path: str | Path) -> Settings:
        """Load settings from a JSON or YAML configuration file."""
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Configuration file not found: {path}")

        content = path.read_text()

        if path.suffix in (".yaml", ".yml"):
            try:
                import yaml
                data = yaml.safe_load(content)
            except ImportError:
                raise ImportError("PyYAML is required for YAML config files")
        else:
            import json
            data = json.loads(content)

        return cls.model_validate(data)

    def to_file(self, path: str | Path) -> None:
        """Save settings to a configuration file."""
        path = Path(path)
        import json
        path.write_text(json.dumps(self.model_dump(), indent=2))
