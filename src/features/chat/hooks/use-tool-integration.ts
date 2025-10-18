import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { toolsExecutionService } from '../services/tool-execution-handler';
import type { Tool, ToolCall } from '../types';

export const useTools = () => {
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, ToolCall>>({});
  const [toolHistory, setToolHistory] = useState<ToolCall[]>([]);

  // Load available tools on mount
  useEffect(() => {
    const tools = toolsExecutionService.getAvailableTools();
    setAvailableTools(tools);
  }, []);

  // Execute a tool
  const executeTool = useCallback(
    async (toolId: string, args?: Record<string, unknown>) => {
      try {
        setActiveTool(toolId);
        toast.info(`Executing ${toolId}...`);

        const toolCall = await toolsExecutionService.executeTool(
          toolId,
          args || {}
        );

        // Store result
        setToolResults((prev) => ({
          ...prev,
          [toolCall.id]: toolCall,
        }));

        // Add to history
        setToolHistory((prev) => [toolCall, ...prev]);

        if (toolCall.status === 'completed') {
          toast.success(`${toolId} completed successfully`);
        } else if (toolCall.status === 'failed') {
          toast.error(`${toolId} failed: ${toolCall.error}`);
        }

        return toolCall;
      } catch (error) {
        console.error('Tool execution failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        toast.error(`Tool execution failed: ${errorMessage}`);
        throw error;
      } finally {
        setActiveTool(null);
      }
    },
    []
  );

  // Execute multiple tools in sequence
  const executeToolChain = useCallback(
    async (
      toolChain: Array<{ toolId: string; args?: Record<string, unknown> }>
    ) => {
      const results: ToolCall[] = [];

      for (const { toolId, args } of toolChain) {
        try {
          const result = await executeTool(toolId, args);
          results.push(result);

          // Stop chain if any tool fails
          if (result.status === 'failed') {
            toast.error('Tool chain stopped due to failure');
            break;
          }
        } catch (error) {
          console.error('Tool chain execution failed:', error);
          break;
        }
      }

      return results;
    },
    [executeTool]
  );

  // Get tool by ID
  const getToolById = useCallback(
    (toolId: string) => {
      return availableTools.find((tool) => tool.id === toolId);
    },
    [availableTools]
  );

  // Get tools by category
  const getToolsByCategory = useCallback(
    (category: Tool['category']) => {
      return availableTools.filter((tool) => tool.category === category);
    },
    [availableTools]
  );

  // Get tool result by ID
  const getToolResult = useCallback(
    (toolCallId: string) => {
      return toolResults[toolCallId];
    },
    [toolResults]
  );

  // Clear tool history
  const clearToolHistory = useCallback(() => {
    setToolHistory([]);
    setToolResults({});
    toast.success('Tool history cleared');
  }, []);

  // Get statistics about tool usage
  const getToolStats = useCallback(() => {
    const totalCalls = toolHistory.length;
    const successfulCalls = toolHistory.filter(
      (call) => call.status === 'completed'
    ).length;
    const failedCalls = toolHistory.filter(
      (call) => call.status === 'failed'
    ).length;

    const toolUsageCount: Record<string, number> = {};
    toolHistory.forEach((call) => {
      toolUsageCount[call.name] = (toolUsageCount[call.name] || 0) + 1;
    });

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      toolUsageCount,
      mostUsedTool: Object.entries(toolUsageCount).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0],
    };
  }, [toolHistory]);

  // Check if a tool is currently executing
  const isToolExecuting = useCallback(
    (toolId?: string) => {
      if (toolId) {
        return activeTool === toolId;
      }
      return activeTool !== null;
    },
    [activeTool]
  );

  return {
    availableTools,
    activeTool,
    toolResults,
    toolHistory,
    executeTool,
    executeToolChain,
    getToolById,
    getToolsByCategory,
    getToolResult,
    clearToolHistory,
    getToolStats,
    isToolExecuting,
  };
};
