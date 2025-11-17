/**
 * AgentPanel - Left panel showing agent status, process, and messages
 * Combines: AgentStatusCard + WorkingProcessSection + AgentMessageList
 */

import React from 'react';
import { AgentStatusCard, type AgentStatus } from './AgentStatusCard';
import {
  WorkingProcessSection,
  type WorkingStep,
} from './WorkingProcessSection';
import { AgentMessageList, type AgentMessage } from './AgentMessageList';

interface AgentPanelProps {
  agent: AgentStatus | null;
  workingSteps: WorkingStep[];
  messages: AgentMessage[];
}

export function AgentPanel({ agent, workingSteps, messages }: AgentPanelProps) {
  // No agent selected state
  if (!agent) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <h3 className="mb-2 text-lg font-semibold">No Active Agent</h3>
            <p className="text-sm text-muted-foreground">
              Send a message to start working with AI agents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Agent Status */}
      <AgentStatusCard agent={agent} />

      {/* Working Process */}
      {workingSteps.length > 0 && (
        <WorkingProcessSection steps={workingSteps} />
      )}

      {/* Messages */}
      <AgentMessageList messages={messages} />
    </div>
  );
}
