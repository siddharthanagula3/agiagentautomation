# Supabase MCP Server Configuration Guide

This guide explains how to configure Model Context Protocol (MCP) server access to your local Supabase PostgreSQL database.

## What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI assistants like Claude to connect directly to data sources and services. By configuring an MCP server for Supabase, you can give Claude direct database access for queries, schema inspection, and more.

## Prerequisites

1. **Supabase running locally**

   ```bash
   supabase start
   ```

2. **Docker Desktop running** (required for Supabase)

3. **Node.js installed** (for running the MCP server)

## Configuration Steps

### Step 1: Locate Your Claude Desktop Config File

The configuration file location depends on your operating system:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Add Supabase MCP Server Configuration

Open your `claude_desktop_config.json` file and add the following configuration:

```json
{
  "mcpServers": {
    "supabase-local": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:54322/postgres"
      ],
      "env": {}
    }
  }
}
```

**Important Notes:**

- The connection string format is: `postgresql://[user]:[password]@[host]:[port]/[database]`
- Default Supabase local credentials:
  - User: `postgres`
  - Password: `postgres`
  - Host: `localhost`
  - Port: `54322` (configured in `supabase/config.toml`)
  - Database: `postgres`

### Step 3: Configuration for Production Supabase

If you want to connect to your production Supabase instance instead:

```json
{
  "mcpServers": {
    "supabase-production": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
      ],
      "env": {}
    }
  }
}
```

You can find your production connection string in:

1. Go to Supabase Dashboard
2. Project Settings → Database
3. Copy the "Connection string" under "Connection pooling"

### Step 4: Restart Claude Desktop

After adding the configuration:

1. **Completely quit Claude Desktop** (not just close the window)
2. **Restart Claude Desktop**
3. The MCP server will automatically start when Claude launches

## Verification

Once configured, you can verify the connection by asking Claude:

- "What tables are in my database?"
- "Show me the schema for the purchased_employees table"
- "Query my database for all users"

Claude will now have direct read-only access to your Supabase database!

## Security Considerations

### Read-Only Access

The `@modelcontextprotocol/server-postgres` MCP server provides **read-only** access by default. This means:

- ✅ Claude can SELECT data
- ✅ Claude can inspect schemas
- ❌ Claude cannot INSERT, UPDATE, or DELETE data
- ❌ Claude cannot DROP tables or modify structure

### Local Development Only

For security reasons, it's recommended to:

- Use this configuration **only for local development**
- Never commit your production database credentials to git
- Use environment variables for sensitive credentials in production

### Using Environment Variables

For production, you can use environment variables:

```json
{
  "mcpServers": {
    "supabase-production": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:${SUPABASE_DB_PASSWORD}@${SUPABASE_HOST}:6543/postgres"
      ],
      "env": {
        "SUPABASE_DB_PASSWORD": "your-password-here",
        "SUPABASE_HOST": "aws-0-region.pooler.supabase.com"
      }
    }
  }
}
```

## Troubleshooting

### MCP Server Not Connecting

1. **Ensure Supabase is running:**

   ```bash
   supabase status
   ```

   If not running:

   ```bash
   supabase start
   ```

2. **Check Docker Desktop is running**
   - Supabase requires Docker to be active

3. **Verify port 54322 is accessible:**

   ```bash
   # On Windows
   netstat -an | findstr 54322

   # On macOS/Linux
   lsof -i :54322
   ```

4. **Check Claude Desktop logs:**
   - Look for MCP-related errors in Claude's logs
   - Restart Claude Desktop completely

### Connection Refused Error

If you see "connection refused":

- Confirm Supabase is running: `supabase status`
- Check the port in `supabase/config.toml` (should be 54322)
- Verify Docker containers are healthy

### Authentication Failed

If authentication fails:

- Default password is `postgres`
- Check if you've changed the default password in your Supabase setup
- Verify the connection string format is correct

## Advanced Configuration

### Multiple Environments

You can configure multiple MCP servers for different environments:

```json
{
  "mcpServers": {
    "supabase-local": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:54322/postgres"
      ]
    },
    "supabase-staging": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:${STAGING_PASSWORD}@staging-db.supabase.com:6543/postgres"
      ],
      "env": {
        "STAGING_PASSWORD": "your-staging-password"
      }
    },
    "supabase-production": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:${PROD_PASSWORD}@prod-db.supabase.com:6543/postgres"
      ],
      "env": {
        "PROD_PASSWORD": "your-production-password"
      }
    }
  }
}
```

### Read-Write Access (Use with Caution!)

If you need write access for development, you can use a different MCP server. However, **this is NOT recommended for production**:

```json
{
  "mcpServers": {
    "supabase-dev-write": {
      "command": "npx",
      "args": [
        "-y",
        "postgres-mcp-pro",
        "postgresql://postgres:postgres@localhost:54322/postgres"
      ],
      "env": {
        "POSTGRES_READ_ONLY": "false"
      }
    }
  }
}
```

## What You Can Do with MCP

Once configured, you can ask Claude to:

1. **Inspect Database Schema**
   - "Show me all tables in the database"
   - "What's the structure of the users table?"
   - "List all columns in purchased_employees"

2. **Query Data**
   - "How many users are in the database?"
   - "Show me the 10 most recent AI employees"
   - "Query employees where is_active = true"

3. **Analyze Data**
   - "What's the distribution of providers in purchased_employees?"
   - "Find duplicate records in the employees table"
   - "Calculate average usage by user"

4. **Generate Reports**
   - "Create a summary of all active subscriptions"
   - "List all failed payments in the last 30 days"
   - "Show user growth over time"

## Example Usage

Once MCP is configured, here are some example queries you can try:

```
You: "What tables are in my Supabase database?"

Claude: "I can see the following tables in your database:
- users
- purchased_employees
- subscriptions
- payments
- chat_messages
[etc.]"
```

```
You: "Show me the schema for purchased_employees"

Claude: "Here's the schema for purchased_employees:
- id (uuid, primary key)
- user_id (uuid, foreign key → users.id)
- employee_id (text)
- name (text)
- role (text)
- provider (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
[etc.]"
```

## Next Steps

1. **Test the connection** by asking Claude about your database
2. **Explore your data** using natural language queries
3. **Use MCP for debugging** database issues during development
4. **Generate SQL queries** and have Claude explain them

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Supabase logs: `supabase logs db`
3. Check Claude Desktop logs
4. Ensure all prerequisites are met

For more information:

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [PostgreSQL MCP Server](https://github.com/modelcontextprotocol/servers)

---

**Created**: October 2025
**Project**: AGI Agent Automation
**MCP Version**: Latest (2025)
