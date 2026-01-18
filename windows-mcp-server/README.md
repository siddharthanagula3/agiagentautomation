# Windows MCP Server

A fully functional Model Context Protocol (MCP) server for Windows automation. This server exposes Windows-specific tools for AI agents, enabling file system operations, process management, registry access, clipboard operations, and window management.

## Features

- **Full MCP Protocol Support**: JSON-RPC 2.0 compliant with proper error handling
- **Multiple Transports**: stdio, HTTP, and WebSocket support
- **Comprehensive Security**: Authentication, rate limiting, and sandboxing
- **Windows-Specific Tools**:
  - File system operations (read, write, copy, move, delete, search)
  - Process management (list, start, stop, execute commands)
  - Registry access (read-only)
  - Clipboard operations (read/write)
  - Window management (list, focus, minimize, maximize)
  - System information (CPU, memory, disk, network)

## Installation

### Using pip

```bash
pip install windows-mcp-server
```

### From source

```bash
git clone https://github.com/agiagentautomation/windows-mcp-server
cd windows-mcp-server
pip install -e .
```

### Using uv

```bash
uv pip install windows-mcp-server
```

## Quick Start

### stdio Transport (Default)

Start the server with stdio transport for integration with Claude Desktop or other MCP clients:

```bash
windows-mcp-server
```

### HTTP Transport

Start an HTTP server for web-based integrations:

```bash
windows-mcp-server --transport http --host 127.0.0.1 --port 8765
```

### WebSocket Transport

Start a WebSocket server for real-time communication:

```bash
windows-mcp-server --transport websocket --host 127.0.0.1 --port 8765
```

## Configuration

### Environment Variables

All configuration can be set via environment variables with the `WINDOWS_MCP_` prefix:

```bash
# Server settings
WINDOWS_MCP_SERVER__HOST=0.0.0.0
WINDOWS_MCP_SERVER__PORT=8765
WINDOWS_MCP_SERVER__TRANSPORT=http

# Security settings
WINDOWS_MCP_SECURITY__REQUIRE_AUTH=true
WINDOWS_MCP_SECURITY__API_KEY=wmcp_your_secure_key
WINDOWS_MCP_SECURITY__SANDBOX_MODE=true

# Logging
WINDOWS_MCP_LOGGING__LEVEL=info
WINDOWS_MCP_LOGGING__FORMAT=json
```

### Configuration File

Create a `config.json` or `config.yaml`:

```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 8765,
    "transport": "http"
  },
  "security": {
    "require_auth": true,
    "api_key": "wmcp_your_secure_key",
    "sandbox_mode": true,
    "allowed_paths": ["C:\\Users\\YourUser\\Documents"],
    "blocked_paths": ["C:\\Windows\\System32"]
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

Then run with:

```bash
windows-mcp-server --config config.json
```

### Command Line Options

```
usage: windows-mcp-server [-h] [--transport {stdio,http,websocket}]
                          [--host HOST] [--port PORT] [--config CONFIG]
                          [--log-level {debug,info,warning,error}]
                          [--log-format {json,console}] [--require-auth]
                          [--api-key API_KEY] [--sandbox] [--no-sandbox]
                          [--generate-key] [--version]

Options:
  --transport, -t    Transport type (stdio, http, websocket)
  --host, -H         Host to bind to (default: 127.0.0.1)
  --port, -p         Port to listen on (default: 8765)
  --config, -c       Path to configuration file
  --log-level, -l    Log level (debug, info, warning, error)
  --log-format       Log format (json, console)
  --require-auth     Require API key authentication
  --api-key          API key for authentication
  --sandbox          Enable sandbox mode (default)
  --no-sandbox       Disable sandbox mode
  --generate-key     Generate a new API key and exit
  --version, -v      Show version
```

## Available Tools

### File System Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read contents of a file |
| `write_file` | Write content to a file |
| `list_directory` | List files and directories |
| `create_directory` | Create a new directory |
| `delete_file` | Delete a file or directory |
| `copy_file` | Copy a file or directory |
| `move_file` | Move/rename a file or directory |
| `file_info` | Get detailed file information |
| `search_files` | Search for files by pattern or content |
| `watch_file` | Watch a file for changes |

### Process Tools

| Tool | Description |
|------|-------------|
| `list_processes` | List running processes |
| `start_process` | Start a new process |
| `stop_process` | Stop a running process |
| `process_info` | Get detailed process information |
| `execute_command` | Execute a shell command |

### Registry Tools (Read-Only)

| Tool | Description |
|------|-------------|
| `read_registry` | Read a registry value |
| `list_registry_keys` | List subkeys and values |
| `search_registry` | Search registry for values |

### Clipboard Tools

| Tool | Description |
|------|-------------|
| `get_clipboard` | Get clipboard content |
| `set_clipboard` | Set clipboard content |

### Window Tools

| Tool | Description |
|------|-------------|
| `list_windows` | List all visible windows |
| `get_active_window` | Get the active window |
| `set_window_state` | Minimize/maximize/focus a window |
| `find_window` | Find windows by title or class |

### System Tools

| Tool | Description |
|------|-------------|
| `system_info` | Get system information |
| `disk_info` | Get disk usage information |
| `memory_info` | Get memory usage information |
| `environment_variable` | Get/list environment variables |

## Integration with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "windows": {
      "command": "windows-mcp-server",
      "args": ["--log-level", "info"]
    }
  }
}
```

## Security

### Sandbox Mode

By default, the server runs in sandbox mode which:

- Restricts file access to allowed paths
- Blocks access to system directories
- Prevents termination of critical processes
- Only allows read access to registry

### Authentication

Enable API key authentication:

```bash
# Generate a key
windows-mcp-server --generate-key

# Start with authentication required
windows-mcp-server --require-auth --api-key wmcp_your_key
```

### Rate Limiting

The server includes built-in rate limiting:

- Default: 100 requests per minute per client
- Configurable via settings

## API Reference

### Initialize

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "your-client",
      "version": "1.0.0"
    }
  }
}
```

### List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

### Call Tool

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "C:\\Users\\User\\document.txt"
    }
  }
}
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/agiagentautomation/windows-mcp-server
cd windows-mcp-server

# Install with dev dependencies
pip install -e ".[dev]"
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=windows_mcp_server

# Run specific test file
pytest tests/test_tools.py
```

### Type Checking

```bash
mypy src/windows_mcp_server
```

### Linting

```bash
ruff check src/windows_mcp_server
black src/windows_mcp_server
```

## Architecture

```
windows-mcp-server/
├── src/windows_mcp_server/
│   ├── __init__.py
│   ├── main.py              # CLI entry point
│   ├── server.py            # MCP server implementation
│   ├── logging.py           # Structured logging
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Configuration management
│   ├── protocol/
│   │   ├── __init__.py
│   │   ├── models.py        # JSON-RPC and MCP models
│   │   └── handler.py       # Protocol message handling
│   ├── security/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication
│   │   ├── sandbox.py       # Path validation
│   │   └── rate_limiter.py  # Rate limiting
│   └── tools/
│       ├── __init__.py
│       ├── base.py          # Base tool class
│       ├── registry.py      # Tool registry
│       ├── filesystem.py    # File system tools
│       ├── process.py       # Process tools
│       ├── windows_registry.py  # Registry tools
│       ├── clipboard.py     # Clipboard tools
│       ├── window.py        # Window tools
│       └── system.py        # System info tools
└── tests/
    ├── test_protocol.py
    ├── test_security.py
    ├── test_tools.py
    └── test_server.py
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## Support

- GitHub Issues: https://github.com/agiagentautomation/windows-mcp-server/issues
- Documentation: https://github.com/agiagentautomation/windows-mcp-server#readme
