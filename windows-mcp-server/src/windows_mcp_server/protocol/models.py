"""
MCP Protocol Models - JSON-RPC 2.0 and MCP-specific data structures.

Implements the Model Context Protocol specification with proper type safety
and validation using Pydantic v2.
"""

from __future__ import annotations

from enum import IntEnum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class ErrorCode(IntEnum):
    """Standard JSON-RPC 2.0 error codes plus MCP-specific codes."""

    # Standard JSON-RPC 2.0 error codes
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603

    # MCP-specific error codes (-32000 to -32099)
    TOOL_NOT_FOUND = -32001
    TOOL_EXECUTION_ERROR = -32002
    AUTHENTICATION_REQUIRED = -32003
    PERMISSION_DENIED = -32004
    RESOURCE_NOT_FOUND = -32005
    RATE_LIMITED = -32006
    TIMEOUT = -32007
    CANCELLED = -32008
    PLATFORM_NOT_SUPPORTED = -32009


class JSONRPCError(BaseModel):
    """JSON-RPC 2.0 Error object."""

    code: int = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    data: Any | None = Field(default=None, description="Additional error data")

    @classmethod
    def from_code(cls, code: ErrorCode, message: str | None = None, data: Any = None) -> JSONRPCError:
        """Create an error from a standard error code."""
        default_messages = {
            ErrorCode.PARSE_ERROR: "Parse error",
            ErrorCode.INVALID_REQUEST: "Invalid Request",
            ErrorCode.METHOD_NOT_FOUND: "Method not found",
            ErrorCode.INVALID_PARAMS: "Invalid params",
            ErrorCode.INTERNAL_ERROR: "Internal error",
            ErrorCode.TOOL_NOT_FOUND: "Tool not found",
            ErrorCode.TOOL_EXECUTION_ERROR: "Tool execution error",
            ErrorCode.AUTHENTICATION_REQUIRED: "Authentication required",
            ErrorCode.PERMISSION_DENIED: "Permission denied",
            ErrorCode.RESOURCE_NOT_FOUND: "Resource not found",
            ErrorCode.RATE_LIMITED: "Rate limited",
            ErrorCode.TIMEOUT: "Request timeout",
            ErrorCode.CANCELLED: "Request cancelled",
            ErrorCode.PLATFORM_NOT_SUPPORTED: "Platform not supported",
        }
        return cls(
            code=code,
            message=message or default_messages.get(code, "Unknown error"),
            data=data,
        )


class JSONRPCRequest(BaseModel):
    """JSON-RPC 2.0 Request object."""

    jsonrpc: Literal["2.0"] = Field(default="2.0", description="JSON-RPC version")
    id: int | str | None = Field(default=None, description="Request ID (null for notifications)")
    method: str = Field(..., description="Method name")
    params: dict[str, Any] | list[Any] | None = Field(
        default=None, description="Method parameters"
    )

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        """Validate method name."""
        if not v or not v.strip():
            raise ValueError("Method name cannot be empty")
        # MCP methods typically use slash notation
        return v.strip()


class JSONRPCResponse(BaseModel):
    """JSON-RPC 2.0 Response object."""

    jsonrpc: Literal["2.0"] = Field(default="2.0", description="JSON-RPC version")
    id: int | str | None = Field(..., description="Request ID")
    result: Any | None = Field(default=None, description="Result (mutually exclusive with error)")
    error: JSONRPCError | None = Field(
        default=None, description="Error (mutually exclusive with result)"
    )

    @classmethod
    def success(cls, id: int | str | None, result: Any) -> JSONRPCResponse:
        """Create a successful response."""
        return cls(id=id, result=result)

    @classmethod
    def failure(cls, id: int | str | None, error: JSONRPCError) -> JSONRPCResponse:
        """Create an error response."""
        return cls(id=id, error=error)


class ToolParameter(BaseModel):
    """Definition of a tool parameter."""

    name: str = Field(..., description="Parameter name")
    description: str = Field(..., description="Parameter description")
    type: str = Field(..., description="Parameter type (string, number, boolean, array, object)")
    required: bool = Field(default=True, description="Whether the parameter is required")
    default: Any | None = Field(default=None, description="Default value if not required")
    enum: list[str] | None = Field(default=None, description="Allowed values for enum parameters")

    def to_json_schema(self) -> dict[str, Any]:
        """Convert to JSON Schema format."""
        schema: dict[str, Any] = {
            "type": self.type,
            "description": self.description,
        }
        if self.default is not None:
            schema["default"] = self.default
        if self.enum:
            schema["enum"] = self.enum
        return schema


class ToolDefinition(BaseModel):
    """Definition of an MCP tool."""

    name: str = Field(..., description="Tool name (unique identifier)")
    description: str = Field(..., description="Human-readable description")
    parameters: list[ToolParameter] = Field(default_factory=list, description="Tool parameters")
    category: str = Field(default="general", description="Tool category")
    requires_auth: bool = Field(default=False, description="Whether tool requires authentication")
    is_destructive: bool = Field(default=False, description="Whether tool can modify system state")

    def to_mcp_schema(self) -> dict[str, Any]:
        """Convert to MCP tool schema format."""
        properties: dict[str, Any] = {}
        required_params: list[str] = []

        for param in self.parameters:
            properties[param.name] = param.to_json_schema()
            if param.required:
                required_params.append(param.name)

        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": {
                "type": "object",
                "properties": properties,
                "required": required_params,
            },
        }


class ToolResult(BaseModel):
    """Result of a tool execution."""

    success: bool = Field(..., description="Whether execution was successful")
    data: Any | None = Field(default=None, description="Result data")
    error: str | None = Field(default=None, description="Error message if failed")
    metadata: dict[str, Any] = Field(
        default_factory=dict, description="Additional metadata about execution"
    )

    @classmethod
    def ok(cls, data: Any, metadata: dict[str, Any] | None = None) -> ToolResult:
        """Create a successful result."""
        return cls(success=True, data=data, metadata=metadata or {})

    @classmethod
    def fail(cls, error: str, metadata: dict[str, Any] | None = None) -> ToolResult:
        """Create a failed result."""
        return cls(success=False, error=error, metadata=metadata or {})


class MCPCapabilities(BaseModel):
    """MCP Server capabilities."""

    tools: bool = Field(default=True, description="Server supports tools")
    resources: bool = Field(default=False, description="Server supports resources")
    prompts: bool = Field(default=False, description="Server supports prompts")
    logging: bool = Field(default=True, description="Server supports logging")
    experimental: dict[str, bool] = Field(
        default_factory=dict, description="Experimental features"
    )


class MCPServerInfo(BaseModel):
    """MCP Server information."""

    name: str = Field(..., description="Server name")
    version: str = Field(..., description="Server version")
    protocol_version: str = Field(default="2024-11-05", description="MCP protocol version")
    capabilities: MCPCapabilities = Field(
        default_factory=MCPCapabilities, description="Server capabilities"
    )
    platform: str = Field(default="windows", description="Target platform")


class InitializeParams(BaseModel):
    """Parameters for the initialize request."""

    protocol_version: str = Field(..., alias="protocolVersion")
    capabilities: dict[str, Any] = Field(default_factory=dict)
    client_info: dict[str, str] = Field(default_factory=dict, alias="clientInfo")

    class Config:
        populate_by_name = True


class InitializeResult(BaseModel):
    """Result of the initialize request."""

    protocol_version: str = Field(..., alias="protocolVersion")
    capabilities: MCPCapabilities
    server_info: MCPServerInfo = Field(..., alias="serverInfo")

    class Config:
        populate_by_name = True
        by_alias = True


class ToolsListResult(BaseModel):
    """Result of tools/list request."""

    tools: list[dict[str, Any]] = Field(default_factory=list)


class ToolCallParams(BaseModel):
    """Parameters for tools/call request."""

    name: str = Field(..., description="Tool name to call")
    arguments: dict[str, Any] = Field(default_factory=dict, description="Tool arguments")


class ToolCallResult(BaseModel):
    """Result of tools/call request."""

    content: list[dict[str, Any]] = Field(default_factory=list)
    is_error: bool = Field(default=False, alias="isError")

    class Config:
        populate_by_name = True
        by_alias = True

    @classmethod
    def success(cls, text: str) -> ToolCallResult:
        """Create a successful text result."""
        return cls(content=[{"type": "text", "text": text}], is_error=False)

    @classmethod
    def error(cls, message: str) -> ToolCallResult:
        """Create an error result."""
        return cls(content=[{"type": "text", "text": message}], is_error=True)
