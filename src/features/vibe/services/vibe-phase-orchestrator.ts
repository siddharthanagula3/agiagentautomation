/**
 * VibePhaseOrchestrator - Phase-based development system inspired by Cloudflare VibeSDK
 *
 * Implements the 7-phase development model:
 * 1. User describes app → 2. AI analyzes → 3. Blueprint generation
 * 4. Phase-by-phase code generation → 5. Live preview → 6. Iteration → 7. Deploy
 *
 * Key patterns from VibeSDK:
 * - Discriminated union state types
 * - Event-driven state transitions
 * - NDJSON streaming for real-time updates
 * - Blueprint progressive parsing
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPE DEFINITIONS (from VibeSDK patterns)
// ============================================================================

export type BehaviorType = 'phasic' | 'agentic';

export type PhaseStatus =
  | 'idle'
  | 'planning'
  | 'generating_blueprint'
  | 'blueprint_ready'
  | 'implementing'
  | 'implemented'
  | 'validating'
  | 'validated'
  | 'deploying'
  | 'deployed'
  | 'error';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export interface PhaseState {
  status: PhaseStatus;
  name?: string;
  description?: string;
  progress?: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface Blueprint {
  title: string;
  projectName: string;
  description: string;
  detailedDescription?: string;
  colorPalette?: string[];
  frameworks: string[];
  views?: Array<{ name: string; description: string }>;
  plan?: string[];
  implementationRoadmap?: Array<{ phase: string; description: string }>;
}

export interface FileOperation {
  action: 'create' | 'update' | 'delete';
  filePath: string;
  content?: string;
  diff?: string;
  purpose?: string;
}

export interface GenerationPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  files: FileOperation[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface VibeSession {
  id: string;
  behaviorType: BehaviorType;
  connection: ConnectionStatus;
  phase: PhaseState;
  blueprint?: Blueprint;
  generationPhases: GenerationPhase[];
  previewUrl?: string;
  deploymentUrl?: string;
  filesGenerated: number;
  totalFiles?: number;
  currentFile?: string;
  lastError?: string;
}

// ============================================================================
// EVENTS (Discriminated Union Pattern from VibeSDK)
// ============================================================================

export type VibeEvent =
  // Connection events
  | { type: 'connection_started' }
  | { type: 'connection_established'; sessionId: string }
  | { type: 'connection_failed'; error: string }
  | { type: 'connection_reconnecting'; attempt: number }
  // Blueprint events
  | { type: 'blueprint_generating' }
  | { type: 'blueprint_chunk'; chunk: string }
  | { type: 'blueprint_complete'; blueprint: Blueprint }
  // Phase events (for phasic behavior)
  | { type: 'phase_started'; phaseName: string; description: string }
  | { type: 'phase_progress'; phaseName: string; progress: number }
  | { type: 'phase_completed'; phaseName: string }
  | { type: 'phase_failed'; phaseName: string; error: string }
  // Generation events (for agentic behavior)
  | { type: 'generation_started'; totalFiles?: number }
  | { type: 'file_generating'; filePath: string }
  | { type: 'file_generated'; filePath: string; content: string; diff?: string }
  | { type: 'generation_complete' }
  // Preview events
  | { type: 'preview_ready'; url: string }
  | { type: 'preview_error'; error: string }
  // Deployment events
  | { type: 'deployment_started' }
  | { type: 'deployment_complete'; url: string }
  | { type: 'deployment_failed'; error: string };

// ============================================================================
// EVENT EMITTER (Type-safe pattern from VibeSDK)
// ============================================================================

type EventHandler<T> = (event: T) => void;

class TypedEventEmitter<TEvent> {
  private listeners = new Map<string, Set<EventHandler<TEvent>>>();

  on(eventType: string, handler: EventHandler<TEvent>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(handler);
    };
  }

  emit(event: TEvent & { type: string }): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }

    // Also emit to 'all' listeners
    const allHandlers = this.listeners.get('*');
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(event));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// ============================================================================
// BLUEPRINT STREAM PARSER (from VibeSDK)
// ============================================================================

export class BlueprintStreamParser {
  private buffer = '';

  append(chunk: string): string {
    this.buffer += chunk;
    return this.toMarkdown();
  }

  toMarkdown(): string {
    const startsLikeJson = /^\s*[[{]/.test(this.buffer);

    if (!startsLikeJson) {
      return this.buffer; // Plain text, return as-is
    }

    try {
      const parsed = JSON.parse(this.buffer);
      if (this.isRecord(parsed)) {
        return this.blueprintToMarkdown(parsed as Blueprint);
      }
    } catch {
      // Partial JSON: extract available fields with regex
      const title =
        this.extractJsonStringField(this.buffer, 'title') ??
        this.extractJsonStringField(this.buffer, 'projectName') ??
        'Blueprint';
      const desc = this.extractJsonStringField(this.buffer, 'description');
      return [`# ${title}`, '', desc ?? '*Generating blueprint...*'].join('\n');
    }

    return this.buffer;
  }

  getBlueprint(): Blueprint | null {
    try {
      const parsed = JSON.parse(this.buffer);
      if (this.isRecord(parsed)) {
        return parsed as Blueprint;
      }
    } catch {
      return null;
    }
    return null;
  }

  reset(): void {
    this.buffer = '';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private extractJsonStringField(buffer: string, field: string): string | null {
    const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = buffer.match(regex);
    return match ? match[1] : null;
  }

  private blueprintToMarkdown(bp: Blueprint): string {
    const lines: string[] = [];
    lines.push(`# ${bp.title ?? bp.projectName ?? 'Blueprint'}`);

    if (bp.description) lines.push('', bp.description);

    if (bp.frameworks?.length) {
      lines.push('', '## Frameworks');
      for (const f of bp.frameworks) lines.push(`- ${f}`);
    }

    if (bp.views?.length) {
      lines.push('', '## Views');
      for (const v of bp.views) lines.push(`- **${v.name}**: ${v.description}`);
    }

    if (bp.plan?.length) {
      lines.push('', '## Implementation Plan');
      bp.plan.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    }

    if (bp.implementationRoadmap?.length) {
      lines.push('', '## Roadmap');
      for (const phase of bp.implementationRoadmap) {
        lines.push(`- **${phase.phase}**: ${phase.description}`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// ZUSTAND STORE (Session State Management)
// ============================================================================

interface VibeOrchestratorState {
  session: VibeSession | null;
  blueprintParser: BlueprintStreamParser;
  eventEmitter: TypedEventEmitter<VibeEvent>;

  // Actions
  initSession: (behaviorType: BehaviorType) => string;
  updateConnection: (status: ConnectionStatus) => void;
  updatePhase: (phase: Partial<PhaseState>) => void;
  setBlueprint: (blueprint: Blueprint) => void;
  appendBlueprintChunk: (chunk: string) => string;
  addFileOperation: (phaseId: string, file: FileOperation) => void;
  setPreviewUrl: (url: string) => void;
  setDeploymentUrl: (url: string) => void;
  setError: (error: string) => void;
  reset: () => void;

  // Event handling
  processEvent: (event: VibeEvent) => void;
  subscribe: (
    eventType: string,
    handler: EventHandler<VibeEvent>
  ) => () => void;
}

export const useVibeOrchestrator = create<VibeOrchestratorState>()(
  immer((set, get) => ({
    session: null,
    blueprintParser: new BlueprintStreamParser(),
    eventEmitter: new TypedEventEmitter<VibeEvent>(),

    initSession: (behaviorType: BehaviorType) => {
      const sessionId = `vibe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      set((state) => {
        state.session = {
          id: sessionId,
          behaviorType,
          connection: 'disconnected',
          phase: { status: 'idle' },
          generationPhases: [],
          filesGenerated: 0,
        };
        state.blueprintParser = new BlueprintStreamParser();
      });

      return sessionId;
    },

    updateConnection: (status: ConnectionStatus) => {
      set((state) => {
        if (state.session) {
          state.session.connection = status;
        }
      });
    },

    updatePhase: (phase: Partial<PhaseState>) => {
      set((state) => {
        if (state.session) {
          state.session.phase = { ...state.session.phase, ...phase };
        }
      });
    },

    setBlueprint: (blueprint: Blueprint) => {
      set((state) => {
        if (state.session) {
          state.session.blueprint = blueprint;
          state.session.phase = {
            status: 'blueprint_ready',
            name: 'Blueprint Complete',
            completedAt: new Date(),
          };
        }
      });
    },

    appendBlueprintChunk: (chunk: string) => {
      const { blueprintParser } = get();
      const markdown = blueprintParser.append(chunk);

      // Try to extract complete blueprint
      const blueprint = blueprintParser.getBlueprint();
      if (blueprint) {
        set((state) => {
          if (state.session) {
            state.session.blueprint = blueprint;
          }
        });
      }

      return markdown;
    },

    addFileOperation: (phaseId: string, file: FileOperation) => {
      set((state) => {
        if (state.session) {
          const phase = state.session.generationPhases.find(
            (p) => p.id === phaseId
          );
          if (phase) {
            phase.files.push(file);
          }
          state.session.filesGenerated += 1;
          state.session.currentFile = file.filePath;
        }
      });
    },

    setPreviewUrl: (url: string) => {
      set((state) => {
        if (state.session) {
          state.session.previewUrl = url;
        }
      });
    },

    setDeploymentUrl: (url: string) => {
      set((state) => {
        if (state.session) {
          state.session.deploymentUrl = url;
          state.session.phase = {
            status: 'deployed',
            name: 'Deployed',
            completedAt: new Date(),
          };
        }
      });
    },

    setError: (error: string) => {
      set((state) => {
        if (state.session) {
          state.session.lastError = error;
          state.session.phase = {
            ...state.session.phase,
            status: 'error',
            error,
          };
        }
      });
    },

    reset: () => {
      const { eventEmitter } = get();
      eventEmitter.removeAllListeners();

      set((state) => {
        state.session = null;
        state.blueprintParser = new BlueprintStreamParser();
      });
    },

    processEvent: (event: VibeEvent) => {
      const { eventEmitter } = get();

      // Process event based on type
      switch (event.type) {
        case 'connection_established':
          get().updateConnection('connected');
          break;

        case 'connection_failed':
          get().updateConnection('failed');
          get().setError(event.error);
          break;

        case 'connection_reconnecting':
          get().updateConnection('reconnecting');
          break;

        case 'blueprint_generating':
          get().updatePhase({
            status: 'generating_blueprint',
            name: 'Generating Blueprint',
            startedAt: new Date(),
          });
          break;

        case 'blueprint_chunk':
          get().appendBlueprintChunk(event.chunk);
          break;

        case 'blueprint_complete':
          get().setBlueprint(event.blueprint);
          break;

        case 'phase_started':
          get().updatePhase({
            status: 'implementing',
            name: event.phaseName,
            description: event.description,
            startedAt: new Date(),
            progress: 0,
          });
          break;

        case 'phase_progress':
          get().updatePhase({ progress: event.progress });
          break;

        case 'phase_completed':
          get().updatePhase({
            status: 'implemented',
            completedAt: new Date(),
            progress: 100,
          });
          break;

        case 'phase_failed':
          get().setError(event.error);
          break;

        case 'generation_started':
          set((state) => {
            if (state.session) {
              state.session.totalFiles = event.totalFiles;
              state.session.filesGenerated = 0;
            }
          });
          get().updatePhase({
            status: 'implementing',
            name: 'Generating Code',
            startedAt: new Date(),
          });
          break;

        case 'file_generating':
          set((state) => {
            if (state.session) {
              state.session.currentFile = event.filePath;
            }
          });
          break;

        case 'file_generated':
          set((state) => {
            if (state.session) {
              state.session.filesGenerated += 1;
              state.session.currentFile = undefined;
            }
          });
          break;

        case 'generation_complete':
          get().updatePhase({
            status: 'implemented',
            completedAt: new Date(),
            progress: 100,
          });
          break;

        case 'preview_ready':
          get().setPreviewUrl(event.url);
          break;

        case 'preview_error':
          get().setError(event.error);
          break;

        case 'deployment_started':
          get().updatePhase({
            status: 'deploying',
            name: 'Deploying',
            startedAt: new Date(),
          });
          break;

        case 'deployment_complete':
          get().setDeploymentUrl(event.url);
          break;

        case 'deployment_failed':
          get().setError(event.error);
          break;
      }

      // Emit event to subscribers
      eventEmitter.emit(event);
    },

    subscribe: (eventType: string, handler: EventHandler<VibeEvent>) => {
      const { eventEmitter } = get();
      return eventEmitter.on(eventType, handler);
    },
  }))
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new generation phase
 */
export function createGenerationPhase(
  name: string,
  description: string
): GenerationPhase {
  return {
    id: `phase-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    description,
    status: 'pending',
    files: [],
  };
}

/**
 * Calculate overall progress across all phases
 */
export function calculateOverallProgress(phases: GenerationPhase[]): number {
  if (phases.length === 0) return 0;

  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const inProgressPhase = phases.find((p) => p.status === 'in_progress');

  let progress = (completedPhases / phases.length) * 100;

  if (inProgressPhase && inProgressPhase.files.length > 0) {
    // Add partial progress from current phase
    const phaseWeight = 100 / phases.length;
    // Assume each file is equal progress within a phase
    progress += (inProgressPhase.files.length / 10) * phaseWeight * 0.5; // Estimate 10 files per phase
  }

  return Math.min(100, Math.round(progress));
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(session: VibeSession | null): string {
  if (!session) return 'Not started';

  switch (session.phase.status) {
    case 'idle':
      return 'Ready to build';
    case 'planning':
      return 'Analyzing requirements...';
    case 'generating_blueprint':
      return 'Generating blueprint...';
    case 'blueprint_ready':
      return 'Blueprint ready';
    case 'implementing':
      if (session.currentFile) {
        return `Generating: ${session.currentFile}`;
      }
      return session.phase.name || 'Implementing...';
    case 'implemented':
      return 'Code generated';
    case 'validating':
      return 'Validating...';
    case 'validated':
      return 'Validation complete';
    case 'deploying':
      return 'Deploying...';
    case 'deployed':
      return 'Deployed successfully';
    case 'error':
      return `Error: ${session.phase.error || 'Unknown error'}`;
    default:
      return 'Processing...';
  }
}
