# Model Context Protocol (MCP) Tools Reference

## Overview

The Model Context Protocol (MCP) is an open-source standard introduced by Anthropic for connecting AI assistants to systems where data lives. This document outlines all official MCP tools implemented in the AGI Agent Automation platform.

**Official Resources:**
- GitHub: https://github.com/modelcontextprotocol
- Documentation: https://docs.anthropic.com/en/docs/build-with-claude/mcp
- Servers Repository: https://github.com/modelcontextprotocol/servers

---

## Official MCP Server Tools

### 1. **Fetch** - Web Content Retrieval
**Purpose:** Web content fetching and conversion for efficient LLM usage

**Tools:**
- `fetch_web_content` - Fetch and convert web content to markdown/text/JSON
  - Supports HTML to markdown conversion
  - Extracts links and key information
  - Configurable max length and format

**Use Cases:**
- Research and information gathering
- Content extraction from websites
- Competitive analysis
- Documentation retrieval

---

### 2. **Filesystem** - Secure File Operations
**Purpose:** Secure file operations with configurable access controls

**Tools:**
- `read_file` - Read file contents with encoding support (utf8, ascii, base64)
- `write_file` - Write content to files securely
- `list_directory` - List files/directories with glob pattern filtering
- `create_directory` - Create directories with recursive option
- `delete_file` - Delete files/directories (requires confirmation)

**Security Features:**
- Configurable access controls
- Path validation
- Confirmation required for destructive operations

**Use Cases:**
- Code review and analysis
- File management automation
- Configuration file updates
- Log file analysis

---

### 3. **Git** - Repository Management
**Purpose:** Tools to read, search, and manipulate Git repositories

**Tools:**
- `git_status` - Get repository status
- `git_log` - Retrieve commit history with branch filtering
- `git_diff` - Show file differences (unstaged/staged)
- `git_commit` - Create commits with specified files
- `git_search` - Search repository by commit message, content, author, or filename

**Use Cases:**
- Code review automation
- Commit message generation
- Repository analysis
- Change tracking
- Automated documentation updates

---

### 4. **Memory** - Knowledge Graph System
**Purpose:** Knowledge graph-based persistent memory system for AI context retention

**Tools:**
- `create_memory` - Store information with tags and metadata
- `retrieve_memory` - Retrieve by key or semantic search
- `search_memory` - Search across all memories with tag filtering
- `delete_memory` - Remove specific memories

**Features:**
- Semantic search capabilities
- Tag-based categorization
- Metadata support
- Persistent storage

**Use Cases:**
- Conversation context retention
- User preference storage
- Project knowledge base
- Long-term learning

---

### 5. **Sequential Thinking** - Complex Problem Solving
**Purpose:** Dynamic and reflective problem-solving through thought sequences

**Tools:**
- `start_thinking_sequence` - Initialize problem-solving with approach selection
- `add_thinking_step` - Add reasoning steps with reflection
- `complete_thinking_sequence` - Finalize with conclusion and confidence score

**Approaches:**
- Analytical thinking
- Creative problem-solving
- Systematic decomposition
- Exploratory reasoning

**Use Cases:**
- Complex task decomposition
- Multi-step reasoning
- Decision making with reflection
- Problem-solving with uncertainty

---

### 6. **Time** - Timezone Management
**Purpose:** Time and timezone conversion capabilities

**Tools:**
- `get_current_time` - Get current time in any timezone (IANA format)
- `convert_timezone` - Convert between timezones
- `get_timezone_info` - Detailed timezone information

**Formats:**
- ISO 8601
- 12-hour/24-hour
- Unix timestamp

**Use Cases:**
- Global team coordination
- Meeting scheduling
- Time-based automation
- International operations

---

### 7. **GitHub** - GitHub Integration
**Purpose:** GitHub repository and issue management

**Tools:**
- `github_search_repos` - Search repositories by language, stars, etc.
- `github_get_repo` - Get detailed repository information
- `github_create_issue` - Create issues with labels
- `github_list_prs` - List pull requests by state

**Use Cases:**
- Project discovery
- Issue tracking automation
- Code review workflows
- Repository analysis

---

### 8. **Slack** - Team Communication
**Purpose:** Slack workspace integration

**Tools:**
- `slack_send_message` - Send messages to channels/threads
- `slack_get_history` - Retrieve channel message history
- `slack_list_channels` - List available channels

**Channel Types:**
- Public channels
- Private channels
- Direct messages
- Multi-party DMs

**Use Cases:**
- Automated notifications
- Team updates
- Alert systems
- Conversation retrieval

---

### 9. **PostgreSQL** - Database Operations
**Purpose:** PostgreSQL database interaction

**Tools:**
- `postgres_query` - Execute SQL queries with parameters
- `postgres_list_tables` - List all tables in schema
- `postgres_describe_table` - Get table structure and columns

**Features:**
- Parameterized queries
- Schema support
- Connection pooling

**Use Cases:**
- Data analysis
- Report generation
- Database management
- Query optimization

---

### 10. **Puppeteer** - Browser Automation
**Purpose:** Headless browser automation and web scraping

**Tools:**
- `browser_navigate` - Navigate to URLs with wait conditions
- `browser_screenshot` - Capture full page or element screenshots
- `browser_click` - Click elements by CSS selector
- `browser_fill_form` - Fill multiple form fields
- `browser_extract_data` - Extract data using selectors

**Features:**
- Headless Chrome/Chromium
- Network idle detection
- Element-specific screenshots
- Form automation

**Use Cases:**
- Web scraping
- UI testing
- Screenshot generation
- Form automation
- Data extraction

---

## Claude for Chrome Browser Extension

### Overview
Claude for Chrome is an experimental browser extension that allows Claude to read, click, and navigate websites alongside you in a side panel.

### How It Works

1. **Visual Understanding**
   - Takes screenshots of active browser tab
   - Understands webpage content visually
   - Sees what you see in real-time

2. **Actions**
   - Click elements
   - Fill forms
   - Navigate pages
   - Scroll and interact
   - Submit data

3. **Capabilities**
   - Calendar management and meeting scheduling
   - Email response drafting
   - Expense report handling
   - Website feature testing
   - Multi-step workflows

### Safety Features

**Default Restrictions:**
- Blocked: Financial services websites
- Blocked: Adult content
- Blocked: Pirated content
- User can add custom blocklist

**Permission System:**
- High-risk actions require user approval:
  - Publishing content
  - Making purchases
  - Sharing personal data
  - Financial transactions

**Security Metrics:**
- Attack success rate without mitigations: 23.6%
- Attack success rate with mitigations: 11.2%
- 52% reduction in vulnerability

### Model
- Defaults to **Claude Sonnet 4.5**
- Enhanced browser task performance
- Improved reasoning for complex workflows
- Reduced error rate
- More consistent multi-step execution

### Availability
- **Max Plan subscribers only** (research preview)
- Limited to 1,000 initial pilot users
- Waitlist available for additional Max users
- Experimental feature with ongoing development

### Use Cases

**Productivity:**
- Schedule meetings across calendars
- Draft and send emails
- Process routine paperwork
- Fill out forms automatically

**Development:**
- Test website features
- Automate QA workflows
- Capture screenshots
- Validate UI/UX

**Research:**
- Gather information from multiple sources
- Extract structured data
- Monitor competitor websites
- Compile reports

---

## Implementation in AGI Agent Automation

### Integration Points

1. **Tool Registration**
   - All tools registered via `mcpService`
   - Executed through `toolInvocationService`
   - Type-safe TypeScript interfaces

2. **Access Control**
   - User-level tool permissions
   - Workspace-level restrictions
   - Admin configuration panel

3. **Execution Context**
   - Secure sandboxing
   - Rate limiting
   - Usage tracking
   - Error handling

4. **UI Components**
   - Tool selection interface
   - Configuration panels
   - Execution logs
   - Result visualization

### File Locations

```
src/
├── tools/
│   ├── mcp-tools.ts              # Original custom tools
│   └── official-mcp-tools.ts     # Official MCP server tools
├── services/
│   ├── mcp-service.ts            # MCP protocol service
│   └── tool-invocation-service.ts # Tool execution engine
└── pages/
    └── MCPToolsPage.tsx          # Tool management UI
```

---

## Future Enhancements

### Planned Tools
- **AWS KB Retrieval** - AWS Knowledge Base integration
- **Brave Search** - Privacy-focused search
- **Google Drive** - File storage integration
- **Google Maps** - Location services
- **GitLab** - GitLab repository management
- **Redis** - Cache and session storage
- **Sentry** - Error tracking
- **SQLite** - Embedded database
- **Stripe** - Payment processing

### Browser Extension Features
- Multi-tab coordination
- Session persistence
- Custom action macros
- Advanced security controls
- Enterprise deployment options

---

## Best Practices

### Security
1. Always validate user permissions before tool execution
2. Implement rate limiting for external API calls
3. Sanitize all user inputs
4. Log all tool executions for audit
5. Use confirmation dialogs for destructive actions

### Performance
1. Cache frequently accessed data
2. Use connection pooling for databases
3. Implement request debouncing
4. Monitor tool execution times
5. Set appropriate timeouts

### User Experience
1. Provide clear tool descriptions
2. Show execution progress
3. Display helpful error messages
4. Allow tool configuration
5. Enable/disable tools per workspace

---

## References

- **MCP Specification**: https://github.com/modelcontextprotocol
- **Claude for Chrome Announcement**: https://www.anthropic.com/news/claude-for-chrome
- **MCP Python SDK**: https://github.com/modelcontextprotocol/python-sdk
- **MCP TypeScript SDK**: https://github.com/modelcontextprotocol/typescript-sdk
- **Official Servers**: https://github.com/modelcontextprotocol/servers
- **Community Registry**: https://github.com/modelcontextprotocol/registry

---

**Last Updated:** October 4, 2025
**Author:** AGI Agent Automation Team
**Version:** 1.0.0
