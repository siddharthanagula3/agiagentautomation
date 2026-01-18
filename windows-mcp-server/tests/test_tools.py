"""Tests for MCP tools."""

import os
import tempfile
from pathlib import Path

import pytest

from windows_mcp_server.config.settings import SecuritySettings
from windows_mcp_server.security.sandbox import Sandbox
from windows_mcp_server.tools.filesystem import (
    ReadFileTool,
    WriteFileTool,
    ListDirectoryTool,
    CreateDirectoryTool,
    DeleteFileTool,
    FileInfoTool,
)
from windows_mcp_server.tools.system import (
    SystemInfoTool,
    DiskInfoTool,
    MemoryInfoTool,
    EnvironmentVariableTool,
)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sandbox():
    """Create a sandbox for tests."""
    settings = SecuritySettings(sandbox_mode=False)
    return Sandbox(settings)


class TestFileSystemTools:
    """Tests for file system tools."""

    @pytest.mark.asyncio
    async def test_write_and_read_file(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test writing and reading a file."""
        write_tool = WriteFileTool(sandbox)
        read_tool = ReadFileTool(sandbox)

        test_file = str(temp_dir / "test.txt")
        test_content = "Hello, World!"

        # Write file
        result = await write_tool.execute(
            path=test_file,
            content=test_content,
        )
        assert result.success is True

        # Read file
        result = await read_tool.execute(path=test_file)
        assert result.success is True
        assert result.data == test_content

    @pytest.mark.asyncio
    async def test_read_nonexistent_file(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test reading a file that doesn't exist."""
        read_tool = ReadFileTool(sandbox)

        result = await read_tool.execute(path=str(temp_dir / "nonexistent.txt"))
        assert result.success is False
        assert "not found" in result.error.lower()

    @pytest.mark.asyncio
    async def test_write_file_append(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test appending to a file."""
        write_tool = WriteFileTool(sandbox)
        read_tool = ReadFileTool(sandbox)

        test_file = str(temp_dir / "append.txt")

        # Write initial content
        await write_tool.execute(path=test_file, content="Line 1\n")

        # Append content
        await write_tool.execute(path=test_file, content="Line 2\n", append=True)

        # Read and verify
        result = await read_tool.execute(path=test_file)
        assert result.success is True
        assert "Line 1" in result.data
        assert "Line 2" in result.data

    @pytest.mark.asyncio
    async def test_list_directory(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test listing directory contents."""
        # Create some test files
        (temp_dir / "file1.txt").write_text("content1")
        (temp_dir / "file2.txt").write_text("content2")
        (temp_dir / "subdir").mkdir()

        list_tool = ListDirectoryTool(sandbox)
        result = await list_tool.execute(path=str(temp_dir))

        assert result.success is True
        assert len(result.data) == 3

        names = [entry["name"] for entry in result.data]
        assert "file1.txt" in names
        assert "file2.txt" in names
        assert "subdir" in names

    @pytest.mark.asyncio
    async def test_list_directory_with_pattern(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test listing directory with glob pattern."""
        (temp_dir / "file.txt").write_text("text")
        (temp_dir / "file.json").write_text("{}")
        (temp_dir / "other.txt").write_text("other")

        list_tool = ListDirectoryTool(sandbox)
        result = await list_tool.execute(
            path=str(temp_dir),
            pattern="*.txt",
        )

        assert result.success is True
        assert len(result.data) == 2

    @pytest.mark.asyncio
    async def test_create_directory(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test creating a directory."""
        create_tool = CreateDirectoryTool(sandbox)

        new_dir = str(temp_dir / "newdir" / "nested")
        result = await create_tool.execute(path=new_dir, parents=True)

        assert result.success is True
        assert Path(new_dir).exists()
        assert Path(new_dir).is_dir()

    @pytest.mark.asyncio
    async def test_delete_file(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test deleting a file."""
        test_file = temp_dir / "to_delete.txt"
        test_file.write_text("delete me")

        delete_tool = DeleteFileTool(sandbox)
        result = await delete_tool.execute(path=str(test_file))

        assert result.success is True
        assert not test_file.exists()

    @pytest.mark.asyncio
    async def test_file_info(self, temp_dir: Path, sandbox: Sandbox) -> None:
        """Test getting file information."""
        test_file = temp_dir / "info.txt"
        test_file.write_text("Hello" * 100)

        info_tool = FileInfoTool(sandbox)
        result = await info_tool.execute(path=str(test_file))

        assert result.success is True
        assert result.data["name"] == "info.txt"
        assert result.data["type"] == "file"
        assert result.data["size"] == 500
        assert result.data["extension"] == ".txt"


class TestSystemTools:
    """Tests for system information tools."""

    @pytest.mark.asyncio
    async def test_system_info(self, sandbox: Sandbox) -> None:
        """Test getting system information."""
        tool = SystemInfoTool(sandbox)
        result = await tool.execute()

        assert result.success is True
        assert "system" in result.data
        assert "cpu" in result.data
        assert "network" in result.data
        assert result.data["system"]["name"]  # OS name

    @pytest.mark.asyncio
    async def test_disk_info(self, sandbox: Sandbox) -> None:
        """Test getting disk information."""
        tool = DiskInfoTool(sandbox)
        result = await tool.execute()

        assert result.success is True
        assert len(result.data) > 0  # At least one disk

        disk = result.data[0]
        assert "total" in disk
        assert "free" in disk
        assert "percent_used" in disk

    @pytest.mark.asyncio
    async def test_memory_info(self, sandbox: Sandbox) -> None:
        """Test getting memory information."""
        tool = MemoryInfoTool(sandbox)
        result = await tool.execute()

        assert result.success is True
        assert "memory" in result.data
        assert "swap" in result.data

        mem = result.data["memory"]
        assert mem["total"] > 0
        assert "percent_used" in mem

    @pytest.mark.asyncio
    async def test_environment_variable_single(self, sandbox: Sandbox) -> None:
        """Test getting a single environment variable."""
        tool = EnvironmentVariableTool(sandbox)

        # Set a test variable
        os.environ["TEST_MCP_VAR"] = "test_value"

        try:
            result = await tool.execute(name="TEST_MCP_VAR")
            assert result.success is True
            assert result.data["exists"] is True
            assert result.data["value"] == "test_value"
        finally:
            del os.environ["TEST_MCP_VAR"]

    @pytest.mark.asyncio
    async def test_environment_variable_nonexistent(self, sandbox: Sandbox) -> None:
        """Test getting a nonexistent environment variable."""
        tool = EnvironmentVariableTool(sandbox)

        result = await tool.execute(name="NONEXISTENT_VAR_12345")
        assert result.success is True
        assert result.data["exists"] is False
        assert result.data["value"] is None

    @pytest.mark.asyncio
    async def test_environment_variable_list(self, sandbox: Sandbox) -> None:
        """Test listing environment variables."""
        tool = EnvironmentVariableTool(sandbox)

        result = await tool.execute()
        assert result.success is True
        assert isinstance(result.data, dict)
        assert len(result.data) > 0
        assert "PATH" in result.data or "path" in result.data.keys()

    @pytest.mark.asyncio
    async def test_environment_variable_filter(self, sandbox: Sandbox) -> None:
        """Test filtering environment variables."""
        tool = EnvironmentVariableTool(sandbox)

        result = await tool.execute(filter="PATH")
        assert result.success is True
        # Should only include vars with PATH in name
        for key in result.data.keys():
            assert "path" in key.lower()
