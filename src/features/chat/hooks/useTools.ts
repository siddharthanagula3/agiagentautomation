/**
 * useTools Hook - Manage chat tool availability and execution (stubs wired to core services)
 */

import { useMemo, useState, useCallback } from 'react';
import { toolExecutorService } from '@_core/api/tool-executor-service';
import type { Tool } from '../types';

interface ToolResult {
  id: string;
  toolId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export const useTools = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, ToolResult>>(
    {}
  );

  const availableTools: Tool[] = useMemo(
    () => [
      {
        id: 'search',
        name: 'Web Search',
        type: 'search',
        description: 'Search the web for current information',
        icon: 'Search',
        enabled: true,
      },
      {
        id: 'code',
        name: 'Code Interpreter',
        type: 'code',
        description: 'Run small code snippets for analysis',
        icon: 'Code',
        enabled: true,
      },
      {
        id: 'image',
        name: 'Image Generation',
        type: 'image',
        description: 'Generate images from prompts',
        icon: 'Image',
        enabled: true,
      },
      {
        id: 'file',
        name: 'File Tools',
        type: 'file',
        description: 'Analyze and extract from files',
        icon: 'File',
        enabled: true,
      },
    ],
    []
  );

  const executeTool = useCallback(
    async (toolId: string, args?: Record<string, unknown>) => {
      const runId = crypto.randomUUID();
      setActiveTool(toolId);
      setToolResults((prev) => ({
        ...prev,
        [runId]: { id: runId, toolId, status: 'running' },
      }));

      try {
        let result: unknown;
        if (toolId === 'search') {
          const query = typeof args?.query === 'string' ? args.query : '';
          // TODO: Implement web search service
          result = { query, results: [] };
        } else if (toolId === 'code') {
          const language =
            typeof args?.language === 'string' ? args.language : 'javascript';
          const code = typeof args?.code === 'string' ? args.code : '';
          result = await toolExecutorService.executeTool('code_interpreter', {
            language,
            code,
          });
        } else if (toolId === 'image') {
          const prompt = typeof args?.prompt === 'string' ? args.prompt : '';
          // TODO: Implement image generation service
          result = { prompt, imageUrl: '' };
        } else if (toolId === 'file') {
          result = await toolExecutorService.executeTool(
            'analyze_file',
            args || {}
          );
        } else {
          result = await toolExecutorService.executeTool(toolId, args || {});
        }

        setToolResults((prev) => ({
          ...prev,
          [runId]: { id: runId, toolId, status: 'completed', result },
        }));
        return { id: runId, result };
      } catch (error) {
        const err = error as { message?: string };
        setToolResults((prev) => ({
          ...prev,
          [runId]: {
            id: runId,
            toolId,
            status: 'failed',
            error: err.message || 'Unknown error',
          },
        }));
        throw error;
      } finally {
        setActiveTool(null);
      }
    },
    []
  );

  const cancelTool = useCallback((runId: string) => {
    // Stubs: underlying services may expose abort; wire here when available
    setToolResults((prev) => ({
      ...prev,
      [runId]: {
        ...(prev[runId] || { id: runId, toolId: 'unknown' }),
        status: 'failed',
        error: 'Cancelled',
      },
    }));
  }, []);

  return {
    availableTools,
    activeTool,
    toolResults,
    executeTool,
    cancelTool,
  };
};
