"""Tests for MCP protocol models and handler."""

import pytest

from windows_mcp_server.protocol.models import (
    JSONRPCRequest,
    JSONRPCResponse,
    JSONRPCError,
    ToolDefinition,
    ToolParameter,
    ToolResult,
    ErrorCode,
    MCPCapabilities,
    MCPServerInfo,
    ToolCallResult,
)


class TestJSONRPCModels:
    """Tests for JSON-RPC message models."""

    def test_request_creation(self) -> None:
        """Test creating a valid request."""
        request = JSONRPCRequest(
            id=1,
            method="tools/list",
            params={"filter": "filesystem"},
        )
        assert request.jsonrpc == "2.0"
        assert request.id == 1
        assert request.method == "tools/list"
        assert request.params == {"filter": "filesystem"}

    def test_request_notification(self) -> None:
        """Test creating a notification (no ID)."""
        request = JSONRPCRequest(
            method="notifications/cancelled",
            params={"requestId": 1},
        )
        assert request.id is None

    def test_request_empty_method_fails(self) -> None:
        """Test that empty method name fails validation."""
        with pytest.raises(ValueError):
            JSONRPCRequest(id=1, method="")

    def test_response_success(self) -> None:
        """Test creating a success response."""
        response = JSONRPCResponse.success(1, {"tools": []})
        assert response.id == 1
        assert response.result == {"tools": []}
        assert response.error is None

    def test_response_failure(self) -> None:
        """Test creating an error response."""
        error = JSONRPCError.from_code(ErrorCode.METHOD_NOT_FOUND)
        response = JSONRPCResponse.failure(1, error)
        assert response.id == 1
        assert response.result is None
        assert response.error is not None
        assert response.error.code == ErrorCode.METHOD_NOT_FOUND

    def test_error_from_code(self) -> None:
        """Test creating error from standard code."""
        error = JSONRPCError.from_code(ErrorCode.PARSE_ERROR)
        assert error.code == -32700
        assert error.message == "Parse error"

    def test_error_custom_message(self) -> None:
        """Test error with custom message."""
        error = JSONRPCError.from_code(
            ErrorCode.INVALID_PARAMS,
            "Missing required parameter: path",
        )
        assert error.message == "Missing required parameter: path"


class TestToolModels:
    """Tests for tool-related models."""

    def test_tool_parameter(self) -> None:
        """Test tool parameter model."""
        param = ToolParameter(
            name="path",
            description="File path to read",
            type="string",
            required=True,
        )
        assert param.name == "path"
        assert param.required is True

        schema = param.to_json_schema()
        assert schema["type"] == "string"
        assert schema["description"] == "File path to read"

    def test_tool_parameter_optional(self) -> None:
        """Test optional parameter with default."""
        param = ToolParameter(
            name="encoding",
            description="File encoding",
            type="string",
            required=False,
            default="utf-8",
        )
        schema = param.to_json_schema()
        assert schema["default"] == "utf-8"

    def test_tool_parameter_enum(self) -> None:
        """Test parameter with enum values."""
        param = ToolParameter(
            name="format",
            description="Output format",
            type="string",
            required=True,
            enum=["json", "text", "csv"],
        )
        schema = param.to_json_schema()
        assert schema["enum"] == ["json", "text", "csv"]

    def test_tool_definition(self) -> None:
        """Test tool definition."""
        tool = ToolDefinition(
            name="read_file",
            description="Read a file",
            parameters=[
                ToolParameter(
                    name="path",
                    description="File path",
                    type="string",
                ),
            ],
            category="filesystem",
            is_destructive=False,
        )

        schema = tool.to_mcp_schema()
        assert schema["name"] == "read_file"
        assert schema["description"] == "Read a file"
        assert "inputSchema" in schema
        assert "path" in schema["inputSchema"]["properties"]

    def test_tool_result_success(self) -> None:
        """Test successful tool result."""
        result = ToolResult.ok(
            {"content": "Hello World"},
            metadata={"size": 11},
        )
        assert result.success is True
        assert result.data == {"content": "Hello World"}
        assert result.metadata["size"] == 11
        assert result.error is None

    def test_tool_result_failure(self) -> None:
        """Test failed tool result."""
        result = ToolResult.fail("File not found: test.txt")
        assert result.success is False
        assert result.error == "File not found: test.txt"
        assert result.data is None

    def test_tool_call_result_success(self) -> None:
        """Test tool call result with text content."""
        result = ToolCallResult.success("Operation completed")
        assert result.is_error is False
        assert len(result.content) == 1
        assert result.content[0]["type"] == "text"
        assert result.content[0]["text"] == "Operation completed"

    def test_tool_call_result_error(self) -> None:
        """Test tool call result with error."""
        result = ToolCallResult.error("Something went wrong")
        assert result.is_error is True
        assert result.content[0]["text"] == "Something went wrong"


class TestMCPModels:
    """Tests for MCP-specific models."""

    def test_capabilities(self) -> None:
        """Test MCP capabilities model."""
        caps = MCPCapabilities(
            tools=True,
            resources=False,
            prompts=False,
            logging=True,
        )
        assert caps.tools is True
        assert caps.resources is False

    def test_server_info(self) -> None:
        """Test server info model."""
        info = MCPServerInfo(
            name="windows-mcp-server",
            version="1.0.0",
            protocol_version="2024-11-05",
            platform="windows",
        )
        assert info.name == "windows-mcp-server"
        assert info.capabilities.tools is True  # default
