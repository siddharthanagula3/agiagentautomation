# Recommended MCP Tools for Testing & Debugging

This document lists the best open-source MCP (Model Context Protocol) servers for testing, debugging, and maintaining the AGI Agent Automation platform.

## 🎯 Essential MCP Tools for Testing

### 1. **Puppeteer MCP Server** (Official by Anthropic)

**Purpose:** Browser automation, screenshots, JavaScript execution

**Installation:**

```bash
npx @modelcontextprotocol/create-server puppeteer
```

**Features:**

- ✅ Full browser automation
- ✅ Screenshot capture (full page & elements)
- ✅ Console log monitoring
- ✅ Form interaction
- ✅ JavaScript execution

**Use Cases:**

- Automated E2E testing
- Visual regression testing
- Performance monitoring
- User flow validation

**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer

---

### 2. **Playwright MCP Server** (Official by Microsoft)

**Purpose:** Cross-browser testing, advanced automation

**Installation:**

```bash
npm install -g @playwright/mcp-server
```

**Features:**

- ✅ 33+ automation tools
- ✅ Multi-browser support (Chromium, Firefox, WebKit)
- ✅ Network interception
- ✅ Mobile emulation
- ✅ Parallel execution

**Use Cases:**

- Cross-browser compatibility testing
- Mobile responsiveness testing
- API mocking and testing
- Advanced debugging

**Repository:** https://github.com/microsoft/playwright-mcp

---

### 3. **Context7 MCP Server** (by Upstash)

**Purpose:** Up-to-date code documentation and examples

**Installation:**

```bash
npm install -g context7-mcp
```

**Features:**

- ✅ Real-time documentation lookup
- ✅ Version-specific code examples
- ✅ Framework and library documentation
- ✅ Best practices and patterns

**Use Cases:**

- Quick API reference
- Finding updated code examples
- Learning new libraries
- Debugging with official docs

**Repository:** https://github.com/upstash/context7

---

### 4. **MCP Inspector** (Official Testing Tool)

**Purpose:** Visual debugging and testing MCP servers

**Installation:**

```bash
npm install -g @modelcontextprotocol/inspector
```

**Features:**

- ✅ Visual interface for MCP testing
- ✅ Tool/resource/prompt testing
- ✅ LLM playground integration
- ✅ Authentication testing

**Use Cases:**

- Testing custom MCP servers
- Debugging MCP integrations
- API exploration
- Development workflow

**Repository:** https://github.com/modelcontextprotocol/inspector

---

## 🔧 Additional Useful MCP Tools

### 5. **GitHub MCP Server**

**Purpose:** Repository management and code analysis

**Features:**

- Repository operations
- Issue tracking
- PR management
- Code search

**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/github

---

### 6. **Filesystem MCP Server**

**Purpose:** Local file operations and analysis

**Features:**

- File reading/writing
- Directory traversal
- File search
- Content analysis

**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

---

### 7. **PostgreSQL/Supabase MCP Server**

**Purpose:** Database testing and debugging

**Features:**

- SQL query execution
- Schema inspection
- Data validation
- Migration testing

**Repository:** https://github.com/modelcontextprotocol/servers/tree/main/src/postgres

---

## 📋 Recommended Setup for AGI Agent Automation

### Quick Start Configuration

Create a `.mcp.json` configuration file:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "args": [
        "--allowed-directory",
        "C:\\Users\\SIDDHARTHA NAGULA\\Desktop\\agi\\agiagentautomation"
      ]
    }
  }
}
```

---

## 🎮 Testing Workflow

### 1. **Local Development Testing**

```bash
# Run Playwright tests
npm run e2e

# Run specific test file
npx playwright test e2e/vibe-chat-integration.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### 2. **Visual Testing with Puppeteer MCP**

Use Puppeteer MCP server to:

- Take full-page screenshots
- Compare visual changes
- Test responsive design
- Validate UI components

### 3. **Documentation Lookup with Context7**

Use Context7 to:

- Get latest React documentation
- Find Supabase API examples
- Check TypeScript patterns
- Verify best practices

### 4. **Bug Detection**

Run automated bug detection tests:

```bash
npx playwright test --grep "BUG CHECK"
```

---

## 📊 Test Coverage Goals

| Area              | Coverage | Status |
| ----------------- | -------- | ------ |
| Authentication    | 100%     | ✅     |
| Chat Interface    | 90%      | 🟡     |
| VIBE Workspace    | 85%      | 🟡     |
| Mission Control   | 80%      | 🟡     |
| Marketplace       | 95%      | ✅     |
| Settings          | 70%      | 🟡     |
| Mobile Responsive | 75%      | 🟡     |

---

## 🐛 Common Issues & Solutions

### Issue 1: MCP Server Not Starting

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Reinstall MCP packages
npm install -g @modelcontextprotocol/inspector
```

### Issue 2: Screenshot Directory Missing

**Solution:**

```bash
mkdir -p e2e/screenshots
mkdir -p test-results
```

### Issue 3: Browser Not Launching

**Solution:**

```bash
# Install Playwright browsers
npx playwright install

# Install system dependencies
npx playwright install-deps
```

---

## 🔗 Useful Resources

- **MCP Documentation:** https://modelcontextprotocol.io/
- **Awesome MCP Servers:** https://github.com/wong2/awesome-mcp-servers
- **Playwright Docs:** https://playwright.dev/
- **Puppeteer Docs:** https://pptr.dev/
- **Context7 Guide:** https://context7.com/docs

---

## 🚀 Next Steps

1. Install recommended MCP tools
2. Configure `.mcp.json` with your credentials
3. Run comprehensive test suite
4. Review test reports and screenshots
5. Fix identified bugs
6. Set up CI/CD pipeline with automated tests
7. Schedule regular automated testing

---

**Last Updated:** 2025-01-16
**Maintained By:** AGI Agent Automation Team
