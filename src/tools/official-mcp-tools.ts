/**
 * Official MCP Tools - Based on Anthropic's Reference Servers
 * https://github.com/modelcontextprotocol/servers
 *
 * These tools implement the Model Context Protocol standards
 * for connecting AI to various data sources and systems.
 */

import { mcpService } from '../services/mcp-service';
import { toolInvocationService } from '../services/tool-invocation-service';

// ===== FETCH - Web Content Fetching =====
export const fetchTools = {
  fetchWebContent: {
    name: 'fetch_web_content',
    description: 'Fetch and convert web content for efficient LLM usage. Retrieves HTML, converts to markdown, and extracts key information.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch content from'
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['markdown', 'text', 'html', 'json']
        },
        includeLinks: {
          type: 'boolean',
          description: 'Include extracted links in response'
        },
        maxLength: {
          type: 'number',
          description: 'Maximum content length in characters'
        }
      },
      required: ['url']
    }
  }
};

// ===== FILESYSTEM - Secure File Operations =====
export const filesystemTools = {
  readFile: {
    name: 'read_file',
    description: 'Read file contents with secure access controls',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to read'
        },
        encoding: {
          type: 'string',
          description: 'File encoding',
          enum: ['utf8', 'ascii', 'base64']
        }
      },
      required: ['path']
    }
  },

  writeFile: {
    name: 'write_file',
    description: 'Write content to file with secure access controls',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'File path to write to'
        },
        content: {
          type: 'string',
          description: 'Content to write'
        },
        encoding: {
          type: 'string',
          description: 'File encoding',
          enum: ['utf8', 'ascii', 'base64']
        }
      },
      required: ['path', 'content']
    }
  },

  listDirectory: {
    name: 'list_directory',
    description: 'List files and directories in a path',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list'
        },
        recursive: {
          type: 'boolean',
          description: 'List recursively'
        },
        pattern: {
          type: 'string',
          description: 'Glob pattern to filter files'
        }
      },
      required: ['path']
    }
  },

  createDirectory: {
    name: 'create_directory',
    description: 'Create a new directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to create'
        },
        recursive: {
          type: 'boolean',
          description: 'Create parent directories if needed'
        }
      },
      required: ['path']
    }
  },

  deleteFile: {
    name: 'delete_file',
    description: 'Delete a file or directory (requires confirmation)',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to delete'
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation required for deletion'
        }
      },
      required: ['path', 'confirm']
    }
  }
};

// ===== GIT - Repository Management =====
export const gitTools = {
  gitStatus: {
    name: 'git_status',
    description: 'Get git repository status',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository'
        }
      },
      required: ['repoPath']
    }
  },

  gitLog: {
    name: 'git_log',
    description: 'Get git commit history',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository'
        },
        limit: {
          type: 'number',
          description: 'Number of commits to retrieve'
        },
        branch: {
          type: 'string',
          description: 'Branch name (default: current branch)'
        }
      },
      required: ['repoPath']
    }
  },

  gitDiff: {
    name: 'git_diff',
    description: 'Show git diff for files',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository'
        },
        filePath: {
          type: 'string',
          description: 'Specific file to diff (optional)'
        },
        staged: {
          type: 'boolean',
          description: 'Show staged changes only'
        }
      },
      required: ['repoPath']
    }
  },

  gitCommit: {
    name: 'git_commit',
    description: 'Create a git commit',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository'
        },
        message: {
          type: 'string',
          description: 'Commit message'
        },
        files: {
          type: 'array',
          description: 'Files to commit',
          items: { type: 'string' }
        }
      },
      required: ['repoPath', 'message']
    }
  },

  gitSearch: {
    name: 'git_search',
    description: 'Search git repository history',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Path to git repository'
        },
        query: {
          type: 'string',
          description: 'Search query'
        },
        searchType: {
          type: 'string',
          description: 'Type of search',
          enum: ['commit-message', 'file-content', 'author', 'file-name']
        }
      },
      required: ['repoPath', 'query']
    }
  }
};

// ===== MEMORY - Knowledge Graph Persistent Memory =====
export const memoryTools = {
  createMemory: {
    name: 'create_memory',
    description: 'Store information in knowledge graph memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Memory key/identifier'
        },
        content: {
          type: 'string',
          description: 'Content to store'
        },
        tags: {
          type: 'array',
          description: 'Tags for categorization',
          items: { type: 'string' }
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata'
        }
      },
      required: ['key', 'content']
    }
  },

  retrieveMemory: {
    name: 'retrieve_memory',
    description: 'Retrieve information from knowledge graph memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Memory key to retrieve'
        },
        query: {
          type: 'string',
          description: 'Semantic search query'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results'
        }
      }
    }
  },

  searchMemory: {
    name: 'search_memory',
    description: 'Search knowledge graph memory',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        tags: {
          type: 'array',
          description: 'Filter by tags',
          items: { type: 'string' }
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return'
        }
      },
      required: ['query']
    }
  },

  deleteMemory: {
    name: 'delete_memory',
    description: 'Delete memory from knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Memory key to delete'
        }
      },
      required: ['key']
    }
  }
};

// ===== SEQUENTIAL THINKING - Complex Problem Solving =====
export const sequentialThinkingTools = {
  startThinkingSequence: {
    name: 'start_thinking_sequence',
    description: 'Begin a sequential thinking process for complex problem-solving',
    inputSchema: {
      type: 'object',
      properties: {
        problem: {
          type: 'string',
          description: 'Problem statement or task'
        },
        approach: {
          type: 'string',
          description: 'Problem-solving approach',
          enum: ['analytical', 'creative', 'systematic', 'exploratory']
        },
        steps: {
          type: 'number',
          description: 'Expected number of thinking steps'
        }
      },
      required: ['problem']
    }
  },

  addThinkingStep: {
    name: 'add_thinking_step',
    description: 'Add a step to the thinking sequence',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: {
          type: 'string',
          description: 'Thinking sequence identifier'
        },
        thought: {
          type: 'string',
          description: 'Thought or reasoning step'
        },
        reflection: {
          type: 'string',
          description: 'Reflection on this step'
        },
        nextSteps: {
          type: 'array',
          description: 'Possible next steps',
          items: { type: 'string' }
        }
      },
      required: ['sequenceId', 'thought']
    }
  },

  completeThinkingSequence: {
    name: 'complete_thinking_sequence',
    description: 'Complete and summarize a thinking sequence',
    inputSchema: {
      type: 'object',
      properties: {
        sequenceId: {
          type: 'string',
          description: 'Thinking sequence identifier'
        },
        conclusion: {
          type: 'string',
          description: 'Final conclusion or solution'
        },
        confidence: {
          type: 'number',
          description: 'Confidence level (0-100)',
          minimum: 0,
          maximum: 100
        }
      },
      required: ['sequenceId', 'conclusion']
    }
  }
};

// ===== TIME - Time and Timezone Utilities =====
export const timeTools = {
  getCurrentTime: {
    name: 'get_current_time',
    description: 'Get current time in specified timezone',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone (IANA format, e.g., America/New_York)'
        },
        format: {
          type: 'string',
          description: 'Time format',
          enum: ['iso', '12h', '24h', 'unix']
        }
      }
    }
  },

  convertTimezone: {
    name: 'convert_timezone',
    description: 'Convert time between timezones',
    inputSchema: {
      type: 'object',
      properties: {
        time: {
          type: 'string',
          description: 'Time to convert (ISO format or timestamp)'
        },
        fromTimezone: {
          type: 'string',
          description: 'Source timezone'
        },
        toTimezone: {
          type: 'string',
          description: 'Target timezone'
        }
      },
      required: ['time', 'fromTimezone', 'toTimezone']
    }
  },

  getTimezonInfo: {
    name: 'get_timezone_info',
    description: 'Get detailed timezone information',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone identifier'
        }
      },
      required: ['timezone']
    }
  }
};

// ===== GITHUB - GitHub Integration =====
export const githubTools = {
  searchRepositories: {
    name: 'github_search_repos',
    description: 'Search GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        language: {
          type: 'string',
          description: 'Programming language filter'
        },
        sort: {
          type: 'string',
          description: 'Sort by',
          enum: ['stars', 'forks', 'updated', 'created']
        },
        limit: {
          type: 'number',
          description: 'Maximum results'
        }
      },
      required: ['query']
    }
  },

  getRepository: {
    name: 'github_get_repo',
    description: 'Get GitHub repository information',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        }
      },
      required: ['owner', 'repo']
    }
  },

  createIssue: {
    name: 'github_create_issue',
    description: 'Create a GitHub issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        title: {
          type: 'string',
          description: 'Issue title'
        },
        body: {
          type: 'string',
          description: 'Issue description'
        },
        labels: {
          type: 'array',
          description: 'Issue labels',
          items: { type: 'string' }
        }
      },
      required: ['owner', 'repo', 'title']
    }
  },

  listPullRequests: {
    name: 'github_list_prs',
    description: 'List pull requests for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          description: 'Repository name'
        },
        state: {
          type: 'string',
          description: 'PR state',
          enum: ['open', 'closed', 'all']
        }
      },
      required: ['owner', 'repo']
    }
  }
};

// ===== SLACK - Slack Integration =====
export const slackTools = {
  sendMessage: {
    name: 'slack_send_message',
    description: 'Send a message to Slack channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Channel ID or name'
        },
        text: {
          type: 'string',
          description: 'Message text'
        },
        threadTs: {
          type: 'string',
          description: 'Thread timestamp for replies'
        }
      },
      required: ['channel', 'text']
    }
  },

  getChannelHistory: {
    name: 'slack_get_history',
    description: 'Get Slack channel message history',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Channel ID'
        },
        limit: {
          type: 'number',
          description: 'Number of messages to retrieve'
        }
      },
      required: ['channel']
    }
  },

  listChannels: {
    name: 'slack_list_channels',
    description: 'List available Slack channels',
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'string',
          description: 'Channel types (public_channel, private_channel, im, mpim)'
        }
      }
    }
  }
};

// ===== POSTGRESQL - Database Operations =====
export const postgresTools = {
  executeQuery: {
    name: 'postgres_query',
    description: 'Execute PostgreSQL query',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query to execute'
        },
        params: {
          type: 'array',
          description: 'Query parameters',
          items: {}
        }
      },
      required: ['query']
    }
  },

  listTables: {
    name: 'postgres_list_tables',
    description: 'List all tables in database',
    inputSchema: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          description: 'Database schema (default: public)'
        }
      }
    }
  },

  describeTable: {
    name: 'postgres_describe_table',
    description: 'Get table structure and columns',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        schema: {
          type: 'string',
          description: 'Schema name'
        }
      },
      required: ['table']
    }
  }
};

// ===== PUPPETEER - Browser Automation =====
export const puppeteerTools = {
  navigateToUrl: {
    name: 'browser_navigate',
    description: 'Navigate browser to URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to navigate to'
        },
        waitUntil: {
          type: 'string',
          description: 'Wait condition',
          enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
        }
      },
      required: ['url']
    }
  },

  takeScreenshot: {
    name: 'browser_screenshot',
    description: 'Take screenshot of current page',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: {
          type: 'boolean',
          description: 'Capture full page'
        },
        selector: {
          type: 'string',
          description: 'CSS selector for specific element'
        }
      }
    }
  },

  clickElement: {
    name: 'browser_click',
    description: 'Click an element on the page',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector for element to click'
        }
      },
      required: ['selector']
    }
  },

  fillForm: {
    name: 'browser_fill_form',
    description: 'Fill form fields on page',
    inputSchema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          description: 'Form fields to fill',
          items: {
            type: 'object',
            properties: {
              selector: { type: 'string' },
              value: { type: 'string' }
            }
          }
        }
      },
      required: ['fields']
    }
  },

  extractPageData: {
    name: 'browser_extract_data',
    description: 'Extract data from page using selectors',
    inputSchema: {
      type: 'object',
      properties: {
        selectors: {
          type: 'object',
          description: 'CSS selectors for data extraction'
        }
      },
      required: ['selectors']
    }
  }
};

// Register all official MCP tools
export function registerOfficialMCPTools() {
  // Fetch Tools
  mcpService.registerTool(fetchTools.fetchWebContent, async (params) => {
    return await toolInvocationService.executeTool('mcp-fetch', params);
  });

  // Filesystem Tools
  Object.values(filesystemTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-filesystem', params);
    });
  });

  // Git Tools
  Object.values(gitTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-git', params);
    });
  });

  // Memory Tools
  Object.values(memoryTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-memory', params);
    });
  });

  // Sequential Thinking Tools
  Object.values(sequentialThinkingTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-sequential-thinking', params);
    });
  });

  // Time Tools
  Object.values(timeTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-time', params);
    });
  });

  // GitHub Tools
  Object.values(githubTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-github', params);
    });
  });

  // Slack Tools
  Object.values(slackTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-slack', params);
    });
  });

  // PostgreSQL Tools
  Object.values(postgresTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-postgres', params);
    });
  });

  // Puppeteer Tools
  Object.values(puppeteerTools).forEach(tool => {
    mcpService.registerTool(tool, async (params) => {
      return await toolInvocationService.executeTool('mcp-puppeteer', params);
    });
  });
}

// Export all tool categories
export const officialMCPTools = {
  fetch: fetchTools,
  filesystem: filesystemTools,
  git: gitTools,
  memory: memoryTools,
  sequentialThinking: sequentialThinkingTools,
  time: timeTools,
  github: githubTools,
  slack: slackTools,
  postgres: postgresTools,
  puppeteer: puppeteerTools
};

// Initialize official MCP tools
registerOfficialMCPTools();
