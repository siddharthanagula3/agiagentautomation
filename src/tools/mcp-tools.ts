// MCP Tool Definitions for AI Employees
// These tools are available to AI employees through MCP

import { mcpService } from '../services/mcp-service';
import { toolInvocationService } from '../services/tool-invocation-service';

// Code Generation Tools
export const codeGenerationTools = {
  // Generate React Component
  generateReactComponent: {
    name: 'generate_react_component',
    description: 'Generate a React component with TypeScript and Tailwind CSS',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: 'Name of the component to generate'
        },
        props: {
          type: 'array',
          description: 'Props interface for the component',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              required: { type: 'boolean' }
            }
          }
        },
        features: {
          type: 'array',
          description: 'Features to include in the component',
          items: { type: 'string' }
        },
        styling: {
          type: 'string',
          description: 'Styling approach (Tailwind, CSS Modules, Styled Components)',
          enum: ['tailwind', 'css-modules', 'styled-components']
        }
      },
      required: ['componentName']
    }
  },

  // Generate API Endpoint
  generateApiEndpoint: {
    name: 'generate_api_endpoint',
    description: 'Generate a REST API endpoint with Express.js',
    inputSchema: {
      type: 'object',
      properties: {
        endpointPath: {
          type: 'string',
          description: 'API endpoint path (e.g., /api/users)'
        },
        httpMethod: {
          type: 'string',
          description: 'HTTP method',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
        },
        framework: {
          type: 'string',
          description: 'Framework to use',
          enum: ['express', 'fastify', 'koa']
        },
        database: {
          type: 'string',
          description: 'Database type',
          enum: ['postgresql', 'mongodb', 'mysql', 'sqlite']
        },
        authentication: {
          type: 'string',
          description: 'Authentication method',
          enum: ['jwt', 'oauth', 'session', 'none']
        },
        validation: {
          type: 'string',
          description: 'Validation library',
          enum: ['joi', 'yup', 'zod', 'none']
        }
      },
      required: ['endpointPath', 'httpMethod']
    }
  },

  // Generate Database Schema
  generateDatabaseSchema: {
    name: 'generate_database_schema',
    description: 'Generate database schema and migrations',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Name of the table to create'
        },
        columns: {
          type: 'array',
          description: 'Columns for the table',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        database: {
          type: 'string',
          description: 'Database type',
          enum: ['postgresql', 'mysql', 'sqlite']
        },
        orm: {
          type: 'string',
          description: 'ORM to use',
          enum: ['prisma', 'typeorm', 'sequelize', 'none']
        }
      },
      required: ['tableName', 'columns']
    }
  },

  // Generate Test Cases
  generateTestCases: {
    name: 'generate_test_cases',
    description: 'Generate comprehensive test cases for code',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Code to generate tests for'
        },
        testFramework: {
          type: 'string',
          description: 'Testing framework',
          enum: ['jest', 'mocha', 'vitest', 'jasmine']
        },
        testType: {
          type: 'string',
          description: 'Type of tests',
          enum: ['unit', 'integration', 'e2e']
        },
        coverage: {
          type: 'number',
          description: 'Target test coverage percentage',
          minimum: 0,
          maximum: 100
        }
      },
      required: ['code']
    }
  }
};

// Data Analysis Tools
export const dataAnalysisTools = {
  // Analyze Data
  analyzeData: {
    name: 'analyze_data',
    description: 'Analyze data and generate insights',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data to analyze (CSV, JSON, or SQL query)'
        },
        analysisType: {
          type: 'string',
          description: 'Type of analysis',
          enum: ['descriptive', 'predictive', 'prescriptive', 'diagnostic']
        },
        outputFormat: {
          type: 'string',
          description: 'Output format',
          enum: ['json', 'csv', 'html', 'pdf']
        }
      },
      required: ['data']
    }
  },

  // Generate Report
  generateReport: {
    name: 'generate_report',
    description: 'Generate data analysis report',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'string',
          description: 'Data for the report'
        },
        reportType: {
          type: 'string',
          description: 'Type of report',
          enum: ['summary', 'detailed', 'executive', 'technical']
        },
        format: {
          type: 'string',
          description: 'Report format',
          enum: ['pdf', 'html', 'markdown', 'docx']
        },
        includeCharts: {
          type: 'boolean',
          description: 'Include charts and visualizations'
        }
      },
      required: ['data', 'reportType']
    }
  }
};

// Design Tools
export const designTools = {
  // Generate UI Design
  generateUIDesign: {
    name: 'generate_ui_design',
    description: 'Generate UI design specifications',
    inputSchema: {
      type: 'object',
      properties: {
        componentType: {
          type: 'string',
          description: 'Type of UI component',
          enum: ['button', 'form', 'card', 'modal', 'navigation', 'dashboard']
        },
        style: {
          type: 'string',
          description: 'Design style',
          enum: ['modern', 'minimal', 'corporate', 'creative', 'material']
        },
        colorScheme: {
          type: 'string',
          description: 'Color scheme',
          enum: ['light', 'dark', 'auto']
        },
        responsive: {
          type: 'boolean',
          description: 'Make design responsive'
        }
      },
      required: ['componentType']
    }
  },

  // Generate Wireframe
  generateWireframe: {
    name: 'generate_wireframe',
    description: 'Generate wireframe for application',
    inputSchema: {
      type: 'object',
      properties: {
        pageType: {
          type: 'string',
          description: 'Type of page',
          enum: ['landing', 'dashboard', 'profile', 'settings', 'ecommerce']
        },
        layout: {
          type: 'string',
          description: 'Layout style',
          enum: ['single-column', 'two-column', 'three-column', 'grid']
        },
        components: {
          type: 'array',
          description: 'Components to include',
          items: { type: 'string' }
        }
      },
      required: ['pageType']
    }
  }
};

// Marketing Tools
export const marketingTools = {
  // Generate Content
  generateContent: {
    name: 'generate_content',
    description: 'Generate marketing content',
    inputSchema: {
      type: 'object',
      properties: {
        contentType: {
          type: 'string',
          description: 'Type of content',
          enum: ['blog-post', 'social-media', 'email', 'ad-copy', 'product-description']
        },
        topic: {
          type: 'string',
          description: 'Topic or subject'
        },
        tone: {
          type: 'string',
          description: 'Content tone',
          enum: ['professional', 'casual', 'friendly', 'authoritative', 'playful']
        },
        length: {
          type: 'string',
          description: 'Content length',
          enum: ['short', 'medium', 'long']
        },
        targetAudience: {
          type: 'string',
          description: 'Target audience'
        }
      },
      required: ['contentType', 'topic']
    }
  },

  // Generate SEO Strategy
  generateSEOStrategy: {
    name: 'generate_seo_strategy',
    description: 'Generate SEO strategy and recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        website: {
          type: 'string',
          description: 'Website URL or domain'
        },
        keywords: {
          type: 'array',
          description: 'Target keywords',
          items: { type: 'string' }
        },
        industry: {
          type: 'string',
          description: 'Industry or niche'
        },
        budget: {
          type: 'string',
          description: 'SEO budget',
          enum: ['low', 'medium', 'high']
        }
      },
      required: ['website']
    }
  }
};

// Register all MCP tools
export function registerMCPTools() {
  // Code Generation Tools
  mcpService.registerTool(codeGenerationTools.generateReactComponent, async (params) => {
    return await toolInvocationService.executeTool('cursor-agent-generate-component', params);
  });

  mcpService.registerTool(codeGenerationTools.generateApiEndpoint, async (params) => {
    return await toolInvocationService.executeTool('cursor-agent-generate-api', params);
  });

  mcpService.registerTool(codeGenerationTools.generateDatabaseSchema, async (params) => {
    return await toolInvocationService.executeTool('cursor-agent-generate-schema', params);
  });

  mcpService.registerTool(codeGenerationTools.generateTestCases, async (params) => {
    return await toolInvocationService.executeTool('cursor-agent-generate-tests', params);
  });

  // Data Analysis Tools
  mcpService.registerTool(dataAnalysisTools.analyzeData, async (params) => {
    return await toolInvocationService.executeTool('data-analyzer', params);
  });

  mcpService.registerTool(dataAnalysisTools.generateReport, async (params) => {
    return await toolInvocationService.executeTool('report-generator', params);
  });

  // Design Tools
  mcpService.registerTool(designTools.generateUIDesign, async (params) => {
    return await toolInvocationService.executeTool('ui-design-generator', params);
  });

  mcpService.registerTool(designTools.generateWireframe, async (params) => {
    return await toolInvocationService.executeTool('wireframe-generator', params);
  });

  // Marketing Tools
  mcpService.registerTool(marketingTools.generateContent, async (params) => {
    return await toolInvocationService.executeTool('content-generator', params);
  });

  mcpService.registerTool(marketingTools.generateSEOStrategy, async (params) => {
    return await toolInvocationService.executeTool('seo-strategy-generator', params);
  });
}

// Initialize MCP tools
registerMCPTools();
