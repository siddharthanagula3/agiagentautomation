/**
 * Multi-Agent Workflow Orchestration
 * Inspired by MetaGPT: https://github.com/FoundationAgents/MetaGPT
 *
 * Implements structured workflows with role-based agent coordination,
 * artifact generation, and dependency management.
 */

import { AgentMessage, AgentCapability } from './agent-collaboration-protocol';

// Workflow Types
export type WorkflowType =
  | 'software_development'
  | 'bug_fix'
  | 'feature_implementation'
  | 'code_review'
  | 'research'
  | 'custom';

export type AgentRole =
  | 'product_manager'
  | 'architect'
  | 'engineer'
  | 'qa_engineer'
  | 'devops'
  | 'designer'
  | 'researcher';

export type ArtifactType =
  | 'prd' // Product Requirements Document
  | 'architecture' // System Architecture
  | 'design' // UI/UX Design
  | 'code' // Implementation Code
  | 'tests' // Test Cases
  | 'documentation' // Documentation
  | 'deployment' // Deployment Config
  | 'report'; // Analysis Report

// Artifact Structure
export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  agentId: string;
  agentName: string;
  metadata: {
    version: number;
    createdAt: Date;
    updatedAt: Date;
    dependencies: string[]; // IDs of artifacts this depends on
    status: 'draft' | 'review' | 'approved' | 'rejected';
  };
  sections?: {
    [key: string]: string;
  };
}

// Workflow Step
export interface WorkflowStep {
  id: string;
  role: AgentRole;
  agentId?: string;
  action: string;
  description: string;
  dependencies: string[]; // Step IDs that must complete first
  artifacts: ArtifactType[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: Artifact[];
}

// Workflow Definition
export interface Workflow {
  id: string;
  type: WorkflowType;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'created' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  artifacts: Artifact[];
  messages: AgentMessage[];
}

// Agent Subscription
export interface AgentSubscription {
  agentId: string;
  subscribedTo: ArtifactType[];
  onArtifact: (artifact: Artifact) => Promise<void>;
}

/**
 * Workflow Templates inspired by MetaGPT
 */
export const WorkflowTemplates: Record<
  WorkflowType,
  Omit<Workflow, 'id' | 'createdAt' | 'status' | 'artifacts' | 'messages'>
> = {
  software_development: {
    type: 'software_development',
    name: 'Full Software Development Lifecycle',
    description: 'Complete SDLC from requirements to deployment',
    steps: [
      {
        id: 'step-1-prd',
        role: 'product_manager',
        action: 'create_prd',
        description: 'Create Product Requirements Document',
        dependencies: [],
        artifacts: ['prd'],
        status: 'pending',
      },
      {
        id: 'step-2-architecture',
        role: 'architect',
        action: 'design_architecture',
        description: 'Design system architecture based on PRD',
        dependencies: ['step-1-prd'],
        artifacts: ['architecture'],
        status: 'pending',
      },
      {
        id: 'step-3-design',
        role: 'designer',
        action: 'create_design',
        description: 'Create UI/UX designs',
        dependencies: ['step-1-prd'],
        artifacts: ['design'],
        status: 'pending',
      },
      {
        id: 'step-4-implementation',
        role: 'engineer',
        action: 'implement_code',
        description: 'Implement features based on architecture and design',
        dependencies: ['step-2-architecture', 'step-3-design'],
        artifacts: ['code'],
        status: 'pending',
      },
      {
        id: 'step-5-testing',
        role: 'qa_engineer',
        action: 'create_tests',
        description: 'Create and run tests',
        dependencies: ['step-4-implementation'],
        artifacts: ['tests'],
        status: 'pending',
      },
      {
        id: 'step-6-deployment',
        role: 'devops',
        action: 'deploy',
        description: 'Deploy to production',
        dependencies: ['step-5-testing'],
        artifacts: ['deployment'],
        status: 'pending',
      },
    ],
  },
  bug_fix: {
    type: 'bug_fix',
    name: 'Bug Fix Workflow',
    description: 'Identify, fix, test, and deploy bug fixes',
    steps: [
      {
        id: 'step-1-investigate',
        role: 'engineer',
        action: 'investigate_bug',
        description: 'Investigate and identify root cause',
        dependencies: [],
        artifacts: ['report'],
        status: 'pending',
      },
      {
        id: 'step-2-fix',
        role: 'engineer',
        action: 'implement_fix',
        description: 'Implement bug fix',
        dependencies: ['step-1-investigate'],
        artifacts: ['code'],
        status: 'pending',
      },
      {
        id: 'step-3-test',
        role: 'qa_engineer',
        action: 'verify_fix',
        description: 'Verify fix with tests',
        dependencies: ['step-2-fix'],
        artifacts: ['tests'],
        status: 'pending',
      },
      {
        id: 'step-4-deploy',
        role: 'devops',
        action: 'deploy_fix',
        description: 'Deploy fix to production',
        dependencies: ['step-3-test'],
        artifacts: ['deployment'],
        status: 'pending',
      },
    ],
  },
  feature_implementation: {
    type: 'feature_implementation',
    name: 'Feature Implementation',
    description: 'Implement a new feature with design, code, and tests',
    steps: [
      {
        id: 'step-1-design',
        role: 'designer',
        action: 'design_feature',
        description: 'Design feature UI/UX',
        dependencies: [],
        artifacts: ['design'],
        status: 'pending',
      },
      {
        id: 'step-2-implement',
        role: 'engineer',
        action: 'implement_feature',
        description: 'Implement feature code',
        dependencies: ['step-1-design'],
        artifacts: ['code'],
        status: 'pending',
      },
      {
        id: 'step-3-test',
        role: 'qa_engineer',
        action: 'test_feature',
        description: 'Test feature functionality',
        dependencies: ['step-2-implement'],
        artifacts: ['tests'],
        status: 'pending',
      },
    ],
  },
  code_review: {
    type: 'code_review',
    name: 'Code Review Workflow',
    description: 'Review code for quality, security, and best practices',
    steps: [
      {
        id: 'step-1-review',
        role: 'architect',
        action: 'review_architecture',
        description: 'Review architectural decisions',
        dependencies: [],
        artifacts: ['report'],
        status: 'pending',
      },
      {
        id: 'step-2-security',
        role: 'engineer',
        action: 'security_review',
        description: 'Review security implications',
        dependencies: [],
        artifacts: ['report'],
        status: 'pending',
      },
      {
        id: 'step-3-testing',
        role: 'qa_engineer',
        action: 'review_tests',
        description: 'Review test coverage',
        dependencies: [],
        artifacts: ['report'],
        status: 'pending',
      },
    ],
  },
  research: {
    type: 'research',
    name: 'Research & Analysis',
    description: 'Research topic and provide analysis',
    steps: [
      {
        id: 'step-1-research',
        role: 'researcher',
        action: 'conduct_research',
        description: 'Conduct research on topic',
        dependencies: [],
        artifacts: ['report'],
        status: 'pending',
      },
    ],
  },
  custom: {
    type: 'custom',
    name: 'Custom Workflow',
    description: 'User-defined workflow',
    steps: [],
  },
};

/**
 * Workflow Orchestrator
 * Coordinates multi-agent workflows with dependencies
 */
export class WorkflowOrchestrator {
  private workflows: Map<string, Workflow> = new Map();
  private subscriptions: Map<string, AgentSubscription> = new Map();
  private agentRoleMapping: Map<AgentRole, string> = new Map(); // Role → AgentId

  /**
   * Create a new workflow from template
   */
  createWorkflow(type: WorkflowType, customSteps?: WorkflowStep[]): Workflow {
    const template = WorkflowTemplates[type];
    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      ...template,
      steps: customSteps || template.steps.map((step) => ({ ...step })),
      status: 'created',
      createdAt: new Date(),
      artifacts: [],
      messages: [],
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  /**
   * Assign agent to role
   */
  assignAgentToRole(role: AgentRole, agentId: string): void {
    this.agentRoleMapping.set(role, agentId);
  }

  /**
   * Get agent for role
   */
  getAgentForRole(role: AgentRole): string | undefined {
    return this.agentRoleMapping.get(role);
  }

  /**
   * Subscribe agent to artifact types
   */
  subscribe(
    agentId: string,
    artifactTypes: ArtifactType[],
    callback: (artifact: Artifact) => Promise<void>
  ): void {
    this.subscriptions.set(agentId, {
      agentId,
      subscribedTo: artifactTypes,
      onArtifact: callback,
    });
  }

  /**
   * Publish artifact to subscribers
   */
  async publishArtifact(workflowId: string, artifact: Artifact): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    // Add to workflow artifacts
    workflow.artifacts.push(artifact);

    // Notify subscribers
    for (const subscription of this.subscriptions.values()) {
      if (subscription.subscribedTo.includes(artifact.type)) {
        await subscription.onArtifact(artifact);
      }
    }
  }

  /**
   * Get ready steps (dependencies satisfied)
   */
  getReadySteps(workflowId: string): WorkflowStep[] {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return [];

    return workflow.steps.filter((step) => {
      // Skip non-pending steps
      if (step.status !== 'pending') return false;

      // Check all dependencies are completed
      const dependenciesComplete = step.dependencies.every((depId) => {
        const depStep = workflow.steps.find((s) => s.id === depId);
        return depStep?.status === 'completed';
      });

      return dependenciesComplete;
    });
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    workflow.status = 'running';
    workflow.startedAt = new Date();
  }

  /**
   * Execute workflow step
   */
  async executeStep(
    workflowId: string,
    stepId: string,
    executor: (step: WorkflowStep) => Promise<Artifact[]>
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step) throw new Error('Step not found');

    // Assign agent to step
    const agentId = this.getAgentForRole(step.role);
    if (agentId) {
      step.agentId = agentId;
    }

    // Execute step
    step.status = 'in_progress';
    step.startTime = new Date();

    try {
      const artifacts = await executor(step);

      // Store artifacts
      step.output = artifacts;

      // Publish artifacts
      for (const artifact of artifacts) {
        await this.publishArtifact(workflowId, artifact);
      }

      step.status = 'completed';
      step.endTime = new Date();

      // Check if workflow is complete
      this.checkWorkflowCompletion(workflowId);
    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      workflow.status = 'failed';
      throw error;
    }
  }

  /**
   * Check if workflow is complete
   */
  private checkWorkflowCompletion(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const allComplete = workflow.steps.every(
      (step) => step.status === 'completed' || step.status === 'skipped'
    );

    if (allComplete) {
      workflow.status = 'completed';
      workflow.completedAt = new Date();
    }
  }

  /**
   * Add message to workflow
   */
  addMessage(workflowId: string, message: AgentMessage): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.messages.push(message);
    }
  }

  /**
   * Get workflow status
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Cancel workflow
   */
  cancelWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'cancelled';
      workflow.completedAt = new Date();
    }
  }

  /**
   * Get workflow progress
   */
  getProgress(workflowId: string): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { completed: 0, total: 0, percentage: 0 };

    const completed = workflow.steps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length;
    const total = workflow.steps.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  }
}

/**
 * Artifact Templates
 */
export const ArtifactTemplates: Record<
  ArtifactType,
  (data: Partial<Artifact>) => Artifact
> = {
  prd: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'prd',
    title: data.title || 'Product Requirements Document',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      overview: '',
      objectives: '',
      user_stories: '',
      requirements: '',
      constraints: '',
      success_metrics: '',
      ...data.sections,
    },
  }),
  architecture: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'architecture',
    title: data.title || 'System Architecture',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      overview: '',
      components: '',
      data_flow: '',
      technology_stack: '',
      scalability: '',
      security: '',
      ...data.sections,
    },
  }),
  design: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'design',
    title: data.title || 'UI/UX Design',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      wireframes: '',
      mockups: '',
      design_system: '',
      user_flows: '',
      accessibility: '',
      ...data.sections,
    },
  }),
  code: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'code',
    title: data.title || 'Implementation',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      files: '',
      changes: '',
      tests: '',
      ...data.sections,
    },
  }),
  tests: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'tests',
    title: data.title || 'Test Suite',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      unit_tests: '',
      integration_tests: '',
      e2e_tests: '',
      coverage: '',
      ...data.sections,
    },
  }),
  documentation: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'documentation',
    title: data.title || 'Documentation',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
  }),
  deployment: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'deployment',
    title: data.title || 'Deployment Configuration',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      configuration: '',
      commands: '',
      verification: '',
      rollback: '',
      ...data.sections,
    },
  }),
  report: (data) => ({
    id: data.id || `artifact-${Date.now()}`,
    type: 'report',
    title: data.title || 'Analysis Report',
    content: data.content || '',
    agentId: data.agentId || '',
    agentName: data.agentName || '',
    metadata: {
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      dependencies: [],
      status: 'draft',
      ...data.metadata,
    },
    sections: {
      summary: '',
      findings: '',
      recommendations: '',
      ...data.sections,
    },
  }),
};

export default WorkflowOrchestrator;
