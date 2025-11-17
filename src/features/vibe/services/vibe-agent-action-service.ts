/**
 * VIBE Agent Action Service
 *
 * Handles logging and tracking of agent actions during task execution
 * Provides real-time updates to the VIBE workspace UI
 */

import { supabase } from '@shared/lib/supabase-client';

export type AgentActionType =
  | 'file_edit'
  | 'command_execution'
  | 'app_preview'
  | 'task_planning'
  | 'tool_execution'
  | 'file_read'
  | 'file_create'
  | 'file_delete';

export type AgentActionStatus = 'in_progress' | 'completed' | 'failed';

export interface VibeAgentAction {
  id: string;
  session_id: string;
  agent_name: string;
  action_type: AgentActionType;
  timestamp: string;
  // Updated: Nov 16th 2025 - Fixed any type
  metadata?: Record<string, unknown>;
  status: AgentActionStatus;
  result?: Record<string, unknown>;
  error?: string | null;
}

export interface CreateAgentActionParams {
  sessionId: string;
  agentName: string;
  actionType: AgentActionType;
  metadata?: Record<string, unknown>;
  status?: AgentActionStatus;
}

export interface UpdateAgentActionParams {
  status?: AgentActionStatus;
  result?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent Action Service Class
 * Provides logging and tracking of agent actions
 */
export class VibeAgentActionService {
  /**
   * Create a new agent action log entry
   */
  static async createAction(
    params: CreateAgentActionParams
  ): Promise<VibeAgentAction> {
    const { sessionId, agentName, actionType, metadata, status } = params;

    const actionId = crypto.randomUUID();
    const action = {
      id: actionId,
      session_id: sessionId,
      agent_name: agentName,
      action_type: actionType,
      metadata: metadata || {},
      status: status || 'in_progress',
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('vibe_agent_actions')
      .insert(action)
      .select()
      .single();

    if (error) {
      console.error('[VibeAgentActionService] Failed to create action:', error);
      throw new Error(`Failed to create action: ${error.message}`);
    }

    return data as VibeAgentAction;
  }

  /**
   * Update an existing agent action
   */
  static async updateAction(
    actionId: string,
    updates: UpdateAgentActionParams
  ): Promise<VibeAgentAction> {
    const { data, error } = await supabase
      .from('vibe_agent_actions')
      .update(updates)
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('[VibeAgentActionService] Failed to update action:', error);
      throw new Error(`Failed to update action: ${error.message}`);
    }

    return data as VibeAgentAction;
  }

  /**
   * Mark action as completed with result
   */
  static async completeAction(
    actionId: string,
    result?: Record<string, unknown>
  ): Promise<VibeAgentAction> {
    return this.updateAction(actionId, {
      status: 'completed',
      result,
    });
  }

  /**
   * Mark action as failed with error message
   */
  static async failAction(
    actionId: string,
    error: string
  ): Promise<VibeAgentAction> {
    return this.updateAction(actionId, {
      status: 'failed',
      error,
    });
  }

  /**
   * Get all actions for a session
   */
  static async getActions(sessionId: string): Promise<VibeAgentAction[]> {
    const { data, error } = await supabase
      .from('vibe_agent_actions')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[VibeAgentActionService] Failed to fetch actions:', error);
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }

    return (data as VibeAgentAction[]) || [];
  }

  /**
   * Get actions for a specific agent
   */
  static async getAgentActions(
    sessionId: string,
    agentName: string
  ): Promise<VibeAgentAction[]> {
    const { data, error } = await supabase
      .from('vibe_agent_actions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('agent_name', agentName)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error(
        '[VibeAgentActionService] Failed to fetch agent actions:',
        error
      );
      throw new Error(`Failed to fetch agent actions: ${error.message}`);
    }

    return (data as VibeAgentAction[]) || [];
  }

  /**
   * Subscribe to real-time action updates
   */
  static subscribeToActions(
    sessionId: string,
    onAction: (action: VibeAgentAction) => void,
    onError?: (error: Error) => void
  ) {
    const channel = supabase
      .channel(`vibe-agent-actions-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vibe_agent_actions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new) {
            onAction(payload.new as VibeAgentAction);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Failed to subscribe to action updates'));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Helper: Log file edit action
   */
  static async logFileEdit(params: {
    sessionId: string;
    agentName: string;
    filePath: string;
    changes: string;
  }) {
    const action = await this.createAction({
      sessionId: params.sessionId,
      agentName: params.agentName,
      actionType: 'file_edit',
      metadata: {
        file_path: params.filePath,
        changes: params.changes,
      },
    });

    return {
      actionId: action.id,
      complete: (output?: string) => this.completeAction(action.id, { output }),
      fail: (error: string) => this.failAction(action.id, error),
    };
  }

  /**
   * Helper: Log command execution
   */
  static async logCommandExecution(params: {
    sessionId: string;
    agentName: string;
    command: string;
    cwd?: string;
  }) {
    const action = await this.createAction({
      sessionId: params.sessionId,
      agentName: params.agentName,
      actionType: 'command_execution',
      metadata: {
        command: params.command,
        cwd: params.cwd,
      },
    });

    return {
      actionId: action.id,
      complete: (output: string, exitCode: number = 0) =>
        this.completeAction(action.id, {
          output,
          exit_code: exitCode,
          stdout: output,
        }),
      fail: (error: string, exitCode: number = 1) =>
        this.updateAction(action.id, {
          status: 'failed',
          error,
          result: { exit_code: exitCode },
        }),
    };
  }

  /**
   * Helper: Log app preview
   */
  static async logAppPreview(params: {
    sessionId: string;
    agentName: string;
    previewUrl: string;
    port?: number;
  }) {
    const action = await this.createAction({
      sessionId: params.sessionId,
      agentName: params.agentName,
      actionType: 'app_preview',
      metadata: {
        preview_url: params.previewUrl,
        url: params.previewUrl,
        endpoint: params.previewUrl,
        port: params.port,
      },
      status: 'completed', // Preview is immediately available
    });

    return action;
  }

  /**
   * Helper: Log tool execution
   */
  static async logToolExecution(params: {
    sessionId: string;
    agentName: string;
    toolName: string;
    toolInput: Record<string, unknown>;
  }) {
    const action = await this.createAction({
      sessionId: params.sessionId,
      agentName: params.agentName,
      actionType: 'tool_execution',
      metadata: {
        tool_name: params.toolName,
        tool_input: params.toolInput,
      },
    });

    return {
      actionId: action.id,
      complete: (toolOutput: unknown) =>
        this.completeAction(action.id, {
          tool_output: toolOutput,
          output: JSON.stringify(toolOutput),
        }),
      fail: (error: string) => this.failAction(action.id, error),
    };
  }

  /**
   * Helper: Log task planning
   */
  static async logTaskPlanning(params: {
    sessionId: string;
    agentName: string;
    taskDescription: string;
    plan: unknown;
  }) {
    const action = await this.createAction({
      sessionId: params.sessionId,
      agentName: params.agentName,
      actionType: 'task_planning',
      metadata: {
        task: params.taskDescription,
        description: params.taskDescription,
      },
      status: 'completed',
    });

    await this.completeAction(action.id, {
      plan: params.plan,
      summary: `Planned: ${params.taskDescription}`,
    });

    return action;
  }

  /**
   * Clear all actions for a session
   */
  static async clearSessionActions(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('vibe_agent_actions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('[VibeAgentActionService] Failed to clear actions:', error);
      throw new Error(`Failed to clear actions: ${error.message}`);
    }
  }

  /**
   * Get action statistics for a session
   */
  static async getActionStats(sessionId: string) {
    const actions = await this.getActions(sessionId);

    return {
      total: actions.length,
      completed: actions.filter((a) => a.status === 'completed').length,
      failed: actions.filter((a) => a.status === 'failed').length,
      in_progress: actions.filter((a) => a.status === 'in_progress').length,
      by_type: actions.reduce(
        (acc, action) => {
          acc[action.action_type] = (acc[action.action_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      by_agent: actions.reduce(
        (acc, action) => {
          acc[action.agent_name] = (acc[action.agent_name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
}
