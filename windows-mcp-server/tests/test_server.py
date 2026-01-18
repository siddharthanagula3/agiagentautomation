"""Tests for MCP server."""

import json

import pytest

from windows_mcp_server.config import Settings, TransportType
from windows_mcp_server.server import MCPServer


@pytest.fixture
def settings():
    """Create test settings."""
    return Settings(
        server=Settings.model_fields["server"].default_factory(),
        security=Settings.model_fields["security"].default_factory(),
        logging=Settings.model_fields["logging"].default_factory(),
        tools=Settings.model_fields["tools"].default_factory(),
    )


@pytest.fixture
def server(settings: Settings):
    """Create test server."""
    settings.security.require_auth = False
    return MCPServer(settings)


class TestMCPServer:
    """Tests for the MCP server."""

    @pytest.mark.asyncio
    async def test_handle_initialize(self, server: MCPServer) -> None:
        """Test handling initialize request."""
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "1.0.0"},
            },
        }

        response_str = await server.handle_message(json.dumps(request))
        assert response_str is not None

        response = json.loads(response_str)
        assert response["id"] == 1
        assert "result" in response
        assert response["result"]["protocolVersion"] == "2024-11-05"
        assert "capabilities" in response["result"]
        assert "serverInfo" in response["result"]

    @pytest.mark.asyncio
    async def test_handle_tools_list(self, server: MCPServer) -> None:
        """Test handling tools/list request."""
        request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
        }

        response_str = await server.handle_message(json.dumps(request))
        assert response_str is not None

        response = json.loads(response_str)
        assert response["id"] == 2
        assert "result" in response
        assert "tools" in response["result"]
        assert len(response["result"]["tools"]) > 0

        # Check tool structure
        tool = response["result"]["tools"][0]
        assert "name" in tool
        assert "description" in tool
        assert "inputSchema" in tool

    @pytest.mark.asyncio
    async def test_handle_tools_call(self, server: MCPServer) -> None:
        """Test handling tools/call request."""
        request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "system_info",
                "arguments": {},
            },
        }

        response_str = await server.handle_message(json.dumps(request))
        assert response_str is not None

        response = json.loads(response_str)
        assert response["id"] == 3
        assert "result" in response
        assert "content" in response["result"]
        assert response["result"]["isError"] is False

    @pytest.mark.asyncio
    async def test_handle_tool_not_found(self, server: MCPServer) -> None:
        """Test calling a nonexistent tool."""
        request = {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "nonexistent_tool",
                "arguments": {},
            },
        }

        response_str = await server.handle_message(json.dumps(request))
        response = json.loads(response_str)

        assert response["id"] == 4
        assert "result" in response
        assert response["result"]["isError"] is True

    @pytest.mark.asyncio
    async def test_handle_method_not_found(self, server: MCPServer) -> None:
        """Test calling a nonexistent method."""
        request = {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "nonexistent/method",
        }

        response_str = await server.handle_message(json.dumps(request))
        response = json.loads(response_str)

        assert response["id"] == 5
        assert "error" in response
        assert response["error"]["code"] == -32601  # Method not found

    @pytest.mark.asyncio
    async def test_handle_invalid_json(self, server: MCPServer) -> None:
        """Test handling invalid JSON."""
        response_str = await server.handle_message("not valid json{")
        response = json.loads(response_str)

        assert "error" in response
        assert response["error"]["code"] == -32700  # Parse error

    @pytest.mark.asyncio
    async def test_handle_notification(self, server: MCPServer) -> None:
        """Test handling notification (no response)."""
        request = {
            "jsonrpc": "2.0",
            "method": "notifications/cancelled",
            "params": {"requestId": 1},
        }

        response_str = await server.handle_message(json.dumps(request))
        assert response_str is None  # No response for notifications

    @pytest.mark.asyncio
    async def test_handle_batch_request(self, server: MCPServer) -> None:
        """Test handling batch requests."""
        requests = [
            {"jsonrpc": "2.0", "id": 1, "method": "ping"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        ]

        response_str = await server.handle_message(json.dumps(requests))
        responses = json.loads(response_str)

        assert isinstance(responses, list)
        assert len(responses) == 2

    @pytest.mark.asyncio
    async def test_rate_limiting(self) -> None:
        """Test rate limiting."""
        settings = Settings()
        settings.security.require_auth = False
        settings.security.rate_limit_requests = 2
        settings.security.rate_limit_window = 60
        server = MCPServer(settings)

        request = json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "ping",
        })

        # First two should succeed
        await server.handle_message(request, "client1")
        await server.handle_message(request, "client1")

        # Third should be rate limited
        response_str = await server.handle_message(request, "client1")
        response = json.loads(response_str)

        assert "error" in response
        assert response["error"]["code"] == -32006  # Rate limited


class TestToolRegistry:
    """Tests for tool registry in server context."""

    @pytest.mark.asyncio
    async def test_tools_registered(self, server: MCPServer) -> None:
        """Test that default tools are registered."""
        tools = server.tool_registry.list_tools()

        tool_names = [t.name for t in tools]

        # File system tools
        assert "read_file" in tool_names
        assert "write_file" in tool_names
        assert "list_directory" in tool_names

        # Process tools
        assert "list_processes" in tool_names
        assert "execute_command" in tool_names

        # System tools
        assert "system_info" in tool_names
        assert "disk_info" in tool_names
        assert "memory_info" in tool_names

    @pytest.mark.asyncio
    async def test_tool_categories(self, server: MCPServer) -> None:
        """Test tool categorization."""
        fs_tools = server.tool_registry.list_by_category("filesystem")
        process_tools = server.tool_registry.list_by_category("process")
        system_tools = server.tool_registry.list_by_category("system")

        assert len(fs_tools) > 0
        assert len(process_tools) > 0
        assert len(system_tools) > 0

        # Check each list has correct category
        for tool in fs_tools:
            assert tool.category == "filesystem"
