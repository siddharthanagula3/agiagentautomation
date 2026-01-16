/**
 * Agent Collaboration Hook
 * Manages collaborative task execution between multiple AI agents
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useMissionStore } from '@shared/stores/mission-control-store';
import { useCompanyHubStore } from '@shared/stores/company-hub-store';
import { workforceOrchestratorRefactored } from '@core/ai/orchestration/workforce-orchestrator';
import type { AIEmployee } from '@core/types/ai-employee';

export interface CollaborationOptions {
  sessionId?: string;
  userId?: string;
  maxConcurrentAgents?: number;
  requireApproval?: boolean;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'waiting' | 'error';
  currentTool?: string;
  currentTask?: string;
  logs: Array<{ timestamp: Date; message: string }>;
}

export interface UseAgentCollaborationReturn {
  // State
  availableAgents: AIEmployee[];
  selectedAgents: string[];  // Changed from Set to array
  activeAgents: Record<string, AgentStatus>;  // Changed from Map to Record
  collaborationStatus: 'idle' | 'active' | 'paused' | 'completed';

  // Actions
  addAgent: (agentName: string) => void;
  removeAgent: (agentName: string) => void;
  toggleAgent: (agentName: string) => void;
  clearAgents: () => void;
  startCollaboration: (task: string) => Promise<void>;
  pauseCollaboration: () => void;
  resumeCollaboration: () => void;
  routeMessageToAgent: (agentName: string, message: string) => Promise<string>;

  // Utilities
  isAgentSelected: (agentName: string) => boolean;
  getAgentStatus: (agentName: string) => AgentStatus | undefined;
  canAddMoreAgents: boolean;
}

/**
 * Hook for managing multi-agent collaboration
 */
export function useAgentCollaboration(
  options: CollaborationOptions = {}
): UseAgentCollaborationReturn {
  const {
    sessionId,
    userId,
    maxConcurrentAgents = 5,
    requireApproval = false,
  } = options;

  // Store state
  const collaborativeAgents = useMissionStore(
    (state) => state.collaborativeAgents
  );
  const activeEmployees = useMissionStore((state) => state.activeEmployees);
  const missionStatus = useMissionStore((state) => state.missionStatus);
  const isOrchestrating = useMissionStore((state) => state.isOrchestrating);

  // Store actions
  const addCollaborativeAgent = useMissionStore(
    (state) => state.addCollaborativeAgent
  );
  const removeCollaborativeAgent = useMissionStore(
    (state) => state.removeCollaborativeAgent
  );
  const clearCollaborativeAgents = useMissionStore(
    (state) => state.clearCollaborativeAgents
  );
  const pauseMission = useMissionStore((state) => state.pauseMission);
  const resumeMission = useMissionStore((state) => state.resumeMission);

  // Local state
  const [availableAgents, setAvailableAgents] = useState<AIEmployee[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load available agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        // Trigger employee loading
        if (!workforceOrchestratorRefactored.areEmployeesLoaded()) {
          await workforceOrchestratorRefactored.processRequest({
            userId: userId || 'system',
            input: 'initialize',
            mode: 'chat',
          });
        }

        const agents = workforceOrchestratorRefactored.getAvailableEmployees();
        setAvailableAgents(agents);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to load agents:', err);
        toast.error('Failed to load available agents');
      }
    };

    if (!isInitialized) {
      loadAgents();
    }
  }, [userId, isInitialized]);

  // Add agent to collaboration
  const addAgent = useCallback(
    (agentName: string) => {
      // collaborativeAgents is now an array, not a Set
      if (collaborativeAgents.includes(agentName)) {
        toast.info(`${agentName} is already selected`);
        return;
      }

      if (collaborativeAgents.length >= maxConcurrentAgents) {
        toast.warning(
          `Maximum of ${maxConcurrentAgents} agents can collaborate simultaneously`
        );
        return;
      }

      const agent = availableAgents.find((a) => a.name === agentName);
      if (!agent) {
        toast.error(`Agent ${agentName} not found`);
        return;
      }

      addCollaborativeAgent(agentName);
      toast.success(`${agentName} added to collaboration team`);
    },
    [
      collaborativeAgents,
      maxConcurrentAgents,
      availableAgents,
      addCollaborativeAgent,
    ]
  );

  // Remove agent from collaboration
  const removeAgent = useCallback(
    (agentName: string) => {
      // collaborativeAgents is now an array, not a Set
      if (!collaborativeAgents.includes(agentName)) {
        return;
      }

      removeCollaborativeAgent(agentName);
      toast.info(`${agentName} removed from collaboration team`);
    },
    [collaborativeAgents, removeCollaborativeAgent]
  );

  // Toggle agent selection
  const toggleAgent = useCallback(
    (agentName: string) => {
      // collaborativeAgents is now an array, not a Set
      if (collaborativeAgents.includes(agentName)) {
        removeAgent(agentName);
      } else {
        addAgent(agentName);
      }
    },
    [collaborativeAgents, addAgent, removeAgent]
  );

  // Clear all agents
  const clearAgents = useCallback(() => {
    clearCollaborativeAgents();
    toast.success('Collaboration team cleared');
  }, [clearCollaborativeAgents]);

  // Start collaboration
  const startCollaboration = useCallback(
    async (task: string) => {
      // collaborativeAgents is now an array, not a Set
      if (collaborativeAgents.length === 0) {
        toast.error('Please select at least one agent for collaboration');
        return;
      }

      if (!userId) {
        toast.error('User ID is required');
        return;
      }

      try {
        const response = await workforceOrchestratorRefactored.processRequest({
          userId,
          input: task,
          mode: 'mission', // Use mission mode for collaboration
          sessionId,
        });

        if (!response.success) {
          throw new Error(response.error || 'Collaboration failed to start');
        }

        toast.success('Collaboration started successfully');
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to start collaboration';
        toast.error(errorMsg);
      }
    },
    [collaborativeAgents, userId, sessionId]
  );

  // Pause collaboration
  const pauseCollaboration = useCallback(() => {
    pauseMission();
    toast.info('Collaboration paused');
  }, [pauseMission]);

  // Resume collaboration
  const resumeCollaboration = useCallback(() => {
    resumeMission();
    toast.success('Collaboration resumed');
  }, [resumeMission]);

  // Route message to specific agent
  const routeMessageToAgent = useCallback(
    async (agentName: string, message: string): Promise<string> => {
      try {
        const response =
          await workforceOrchestratorRefactored.routeMessageToEmployee(
            agentName,
            message
          );
        return response;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to route message';
        toast.error(errorMsg);
        throw err;
      }
    },
    []
  );

  // Check if agent is selected
  const isAgentSelected = useCallback(
    (agentName: string) => {
      // collaborativeAgents is now an array, not a Set
      return collaborativeAgents.includes(agentName);
    },
    [collaborativeAgents]
  );

  // Get agent status
  const getAgentStatus = useCallback(
    (agentName: string) => {
      // activeEmployees is now a Record, not a Map
      return activeEmployees[agentName];
    },
    [activeEmployees]
  );

  // Determine collaboration status
  const collaborationStatus = (() => {
    if (!isOrchestrating) return 'idle';
    if (missionStatus === 'paused') return 'paused';
    if (missionStatus === 'completed') return 'completed';
    return 'active';
  })();

  // Check if can add more agents
  // collaborativeAgents is now an array, not a Set
  const canAddMoreAgents = collaborativeAgents.length < maxConcurrentAgents;

  // collaborativeAgents is already an array now
  const selectedAgentsArray = collaborativeAgents;

  return {
    // State
    availableAgents,
    selectedAgents: selectedAgentsArray,
    activeAgents: activeEmployees,
    collaborationStatus,

    // Actions
    addAgent,
    removeAgent,
    toggleAgent,
    clearAgents,
    startCollaboration,
    pauseCollaboration,
    resumeCollaboration,
    routeMessageToAgent,

    // Utilities
    isAgentSelected,
    getAgentStatus,
    canAddMoreAgents,
  };
}
