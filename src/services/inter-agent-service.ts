/**
 * Inter-Agent Communication Service
 * Enables AI employees to delegate tasks to each other
 */

import { supabase } from '../integrations/supabase/client';

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: 'delegation' | 'request' | 'response' | 'update' | 'completion';
  content: string;
  taskId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'failed';
  context: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentDelegation {
  id: string;
  delegatorId: string;
  delegateeId: string;
  task: {
    title: string;
    description: string;
    requirements: string[];
    expectedOutput: string;
    deadline?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  context: {
    projectId: string;
    dependencies: string[];
    resources: string[];
    constraints: string[];
  };
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'failed';
  result?: {
    output: string;
    files: string[];
    metrics: Record<string, number>;
  };
  feedback?: {
    rating: number;
    comments: string;
    suggestions: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCollaboration {
  id: string;
  projectId: string;
  participants: string[];
  workflow: {
    steps: Array<{
      id: string;
      agentId: string;
      action: string;
      dependencies: string[];
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
    }>;
  };
  status: 'active' | 'paused' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

class InterAgentService {
  private messageQueue: AgentMessage[] = [];
  private activeCollaborations: Map<string, AgentCollaboration> = new Map();

  /**
   * Send a message from one agent to another
   */
  async sendMessage(message: Omit<AgentMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentMessage> {
    const newMessage: AgentMessage = {
      ...message,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to message queue
    this.messageQueue.push(newMessage);

    // Store in database
    try {
      const { data, error } = await supabase
        .from('agent_messages')
        .insert([{
          from_agent_id: newMessage.fromAgentId,
          to_agent_id: newMessage.toAgentId,
          message_type: newMessage.messageType,
          content: newMessage.content,
          task_id: newMessage.taskId,
          priority: newMessage.priority,
          status: newMessage.status,
          context: newMessage.context,
        }])
        .select()
        .single();

      if (error) throw error;

      // Process the message (trigger agent response)
      await this.processMessage(newMessage);

      return newMessage;
    } catch (error) {
      console.error('Failed to send agent message:', error);
      throw error;
    }
  }

  /**
   * Delegate a task from one agent to another
   */
  async delegateTask(delegation: Omit<AgentDelegation, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentDelegation> {
    const newDelegation: AgentDelegation = {
      ...delegation,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Store delegation in database
      const { data, error } = await supabase
        .from('agent_delegations')
        .insert([{
          delegator_id: newDelegation.delegatorId,
          delegatee_id: newDelegation.delegateeId,
          task: newDelegation.task,
          context: newDelegation.context,
          status: newDelegation.status,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send notification to delegatee
      await this.sendMessage({
        fromAgentId: newDelegation.delegatorId,
        toAgentId: newDelegation.delegateeId,
        messageType: 'delegation',
        content: `New task delegated: ${newDelegation.task.title}`,
        taskId: newDelegation.id,
        priority: newDelegation.task.priority,
        status: 'pending',
        context: {
          delegationId: newDelegation.id,
          task: newDelegation.task,
          context: newDelegation.context,
        },
      });

      return newDelegation;
    } catch (error) {
      console.error('Failed to delegate task:', error);
      throw error;
    }
  }

  /**
   * Accept or reject a delegation
   */
  async respondToDelegation(
    delegationId: string,
    response: 'accepted' | 'rejected',
    agentId: string
  ): Promise<void> {
    try {
      // Update delegation status
      const { error: updateError } = await supabase
        .from('agent_delegations')
        .update({ 
          status: response === 'accepted' ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', delegationId);

      if (updateError) throw updateError;

      // Get delegation details
      const { data: delegation, error: fetchError } = await supabase
        .from('agent_delegations')
        .select('*')
        .eq('id', delegationId)
        .single();

      if (fetchError) throw fetchError;

      // Send response message
      await this.sendMessage({
        fromAgentId: agentId,
        toAgentId: delegation.delegator_id,
        messageType: 'response',
        content: `Task delegation ${response}: ${delegation.task.title}`,
        taskId: delegationId,
        priority: delegation.task.priority,
        status: response === 'accepted' ? 'accepted' : 'rejected',
        context: {
          delegationId,
          response,
        },
      });

      // If accepted, start task execution
      if (response === 'accepted') {
        await this.startTaskExecution(delegationId, agentId);
      }
    } catch (error) {
      console.error('Failed to respond to delegation:', error);
      throw error;
    }
  }

  /**
   * Start collaborative workflow
   */
  async startCollaboration(
    projectId: string,
    participants: string[],
    workflow: AgentCollaboration['workflow']
  ): Promise<AgentCollaboration> {
    const collaboration: AgentCollaboration = {
      id: this.generateId(),
      projectId,
      participants,
      workflow,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.activeCollaborations.set(collaboration.id, collaboration);

    try {
      // Store collaboration in database
      const { data, error } = await supabase
        .from('agent_collaborations')
        .insert([{
          project_id: projectId,
          participants,
          workflow,
          status: collaboration.status,
        }])
        .select()
        .single();

      if (error) throw error;

      // Notify all participants
      for (const participantId of participants) {
        await this.sendMessage({
          fromAgentId: 'system',
          toAgentId: participantId,
          messageType: 'request',
          content: `You've been added to a collaborative workflow for project ${projectId}`,
          priority: 'medium',
          status: 'pending',
          context: {
            collaborationId: collaboration.id,
            projectId,
            workflow,
          },
        });
      }

      return collaboration;
    } catch (error) {
      console.error('Failed to start collaboration:', error);
      throw error;
    }
  }

  /**
   * Update collaboration step status
   */
  async updateCollaborationStep(
    collaborationId: string,
    stepId: string,
    status: 'in_progress' | 'completed' | 'failed',
    agentId: string
  ): Promise<void> {
    const collaboration = this.activeCollaborations.get(collaborationId);
    if (!collaboration) throw new Error('Collaboration not found');

    // Update step status
    const step = collaboration.workflow.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
    }

    // Update database
    try {
      const { error } = await supabase
        .from('agent_collaborations')
        .update({
          workflow: collaboration.workflow,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collaborationId);

      if (error) throw error;

      // Notify other participants if step completed
      if (status === 'completed') {
        const nextSteps = collaboration.workflow.steps.filter(s => 
          s.dependencies.includes(stepId) && s.status === 'pending'
        );

        for (const nextStep of nextSteps) {
          await this.sendMessage({
            fromAgentId: agentId,
            toAgentId: nextStep.agentId,
            messageType: 'request',
            content: `Dependency completed, you can now start: ${nextStep.action}`,
            priority: 'medium',
            status: 'pending',
            context: {
              collaborationId,
              stepId: nextStep.id,
              action: nextStep.action,
            },
          });
        }
      }
    } catch (error) {
      console.error('Failed to update collaboration step:', error);
      throw error;
    }
  }

  /**
   * Get messages for an agent
   */
  async getMessagesForAgent(agentId: string): Promise<AgentMessage[]> {
    try {
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('to_agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(msg => ({
        id: msg.id,
        fromAgentId: msg.from_agent_id,
        toAgentId: msg.to_agent_id,
        messageType: msg.message_type,
        content: msg.content,
        taskId: msg.task_id,
        priority: msg.priority,
        status: msg.status,
        context: msg.context,
        createdAt: new Date(msg.created_at),
        updatedAt: new Date(msg.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get messages for agent:', error);
      return [];
    }
  }

  /**
   * Get active delegations for an agent
   */
  async getDelegationsForAgent(agentId: string): Promise<AgentDelegation[]> {
    try {
      const { data, error } = await supabase
        .from('agent_delegations')
        .select('*')
        .eq('delegatee_id', agentId)
        .in('status', ['pending', 'accepted', 'in_progress']);

      if (error) throw error;

      return data.map(del => ({
        id: del.id,
        delegatorId: del.delegator_id,
        delegateeId: del.delegatee_id,
        task: del.task,
        context: del.context,
        status: del.status,
        result: del.result,
        feedback: del.feedback,
        createdAt: new Date(del.created_at),
        updatedAt: new Date(del.updated_at),
      }));
    } catch (error) {
      console.error('Failed to get delegations for agent:', error);
      return [];
    }
  }

  /**
   * Process incoming message (trigger agent response)
   */
  private async processMessage(message: AgentMessage): Promise<void> {
    // This would integrate with your AI agent system
    // For now, we'll simulate processing
    console.log(`Processing message from ${message.fromAgentId} to ${message.toAgentId}:`, message.content);
    
    // In a real implementation, this would:
    // 1. Parse the message content
    // 2. Determine the appropriate response
    // 3. Execute the requested action
    // 4. Send a response back
  }

  /**
   * Start task execution for accepted delegation
   */
  private async startTaskExecution(delegationId: string, agentId: string): Promise<void> {
    // This would integrate with your task execution system
    console.log(`Starting task execution for delegation ${delegationId} by agent ${agentId}`);
    
    // In a real implementation, this would:
    // 1. Load the task details
    // 2. Initialize the agent's execution environment
    // 3. Begin task processing
    // 4. Update status as progress is made
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

export const interAgentService = new InterAgentService();
