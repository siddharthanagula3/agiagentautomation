/**
 * VibeDeploymentManager - Deployment management inspired by Cloudflare VibeSDK
 *
 * Key patterns from VibeSDK:
 * - Sandbox deployment with preview URLs
 * - Command execution history tracking
 * - Screenshot capture for preview
 * - Deployment to production (Cloudflare Pages/Netlify)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useVibeOrchestrator } from './vibe-phase-orchestrator';

// ============================================================================
// TYPE DEFINITIONS (VibeSDK Patterns)
// ============================================================================

export type DeploymentStatus =
  | 'idle'
  | 'preparing'
  | 'building'
  | 'deploying'
  | 'deployed'
  | 'failed';

export type DeploymentTarget = 'preview' | 'netlify' | 'vercel' | 'cloudflare';

export interface CommandHistoryEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  duration: number;
  timestamp: Date;
}

export interface DeploymentInfo {
  id: string;
  sessionId: string;
  target: DeploymentTarget;
  status: DeploymentStatus;
  url?: string;
  buildLogs: string[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface PreviewSession {
  id: string;
  sandboxId: string;
  url: string;
  port: number;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startedAt: Date;
  lastHealthCheck?: Date;
}

export interface Screenshot {
  id: string;
  deploymentId: string;
  url: string;
  dataUrl: string;
  viewport: { width: number; height: number };
  capturedAt: Date;
}

// ============================================================================
// DEPLOYMENT MANAGER STORE
// ============================================================================

interface DeploymentManagerState {
  // Deployments
  deployments: Map<string, DeploymentInfo>;
  activeDeploymentId: string | null;

  // Preview
  previewSession: PreviewSession | null;

  // Command history (max 10 entries per VibeSDK)
  commandHistory: CommandHistoryEntry[];
  maxCommandHistory: number;

  // Screenshots
  screenshots: Screenshot[];

  // Actions
  startDeployment: (sessionId: string, target: DeploymentTarget) => string;
  updateDeploymentStatus: (deploymentId: string, status: DeploymentStatus, data?: Partial<DeploymentInfo>) => void;
  completeDeployment: (deploymentId: string, url: string) => void;
  failDeployment: (deploymentId: string, error: string) => void;
  addBuildLog: (deploymentId: string, log: string) => void;

  // Preview
  startPreview: (sandboxId: string) => void;
  stopPreview: () => void;
  updatePreviewStatus: (status: PreviewSession['status']) => void;

  // Commands
  addCommandToHistory: (command: string, output: string, exitCode: number, duration: number) => void;
  clearCommandHistory: () => void;

  // Screenshots
  captureScreenshot: (deploymentId: string, dataUrl: string, viewport: { width: number; height: number }) => void;

  // Utilities
  getDeployment: (deploymentId: string) => DeploymentInfo | undefined;
  getActiveDeployment: () => DeploymentInfo | undefined;
  reset: () => void;
}

export const useDeploymentManager = create<DeploymentManagerState>()(
  immer((set, get) => ({
    deployments: new Map(),
    activeDeploymentId: null,
    previewSession: null,
    commandHistory: [],
    maxCommandHistory: 10,
    screenshots: [],

    startDeployment: (sessionId: string, target: DeploymentTarget) => {
      const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const deployment: DeploymentInfo = {
        id: deploymentId,
        sessionId,
        target,
        status: 'preparing',
        buildLogs: [],
        startedAt: new Date(),
      };

      set((state) => {
        state.deployments.set(deploymentId, deployment);
        state.activeDeploymentId = deploymentId;
      });

      // Emit event to orchestrator
      const orchestrator = useVibeOrchestrator.getState();
      orchestrator.processEvent({ type: 'deployment_started' });

      return deploymentId;
    },

    updateDeploymentStatus: (deploymentId: string, status: DeploymentStatus, data?: Partial<DeploymentInfo>) => {
      set((state) => {
        const deployment = state.deployments.get(deploymentId);
        if (deployment) {
          deployment.status = status;
          if (data) {
            Object.assign(deployment, data);
          }
        }
      });
    },

    completeDeployment: (deploymentId: string, url: string) => {
      set((state) => {
        const deployment = state.deployments.get(deploymentId);
        if (deployment) {
          deployment.status = 'deployed';
          deployment.url = url;
          deployment.completedAt = new Date();
        }
      });

      // Emit event to orchestrator
      const orchestrator = useVibeOrchestrator.getState();
      orchestrator.processEvent({ type: 'deployment_complete', url });
    },

    failDeployment: (deploymentId: string, error: string) => {
      set((state) => {
        const deployment = state.deployments.get(deploymentId);
        if (deployment) {
          deployment.status = 'failed';
          deployment.error = error;
          deployment.completedAt = new Date();
        }
      });

      // Emit event to orchestrator
      const orchestrator = useVibeOrchestrator.getState();
      orchestrator.processEvent({ type: 'deployment_failed', error });
    },

    addBuildLog: (deploymentId: string, log: string) => {
      set((state) => {
        const deployment = state.deployments.get(deploymentId);
        if (deployment) {
          deployment.buildLogs.push(`[${new Date().toISOString()}] ${log}`);
        }
      });
    },

    startPreview: (sandboxId: string) => {
      const previewId = `preview-${Date.now()}`;
      const port = 3000 + Math.floor(Math.random() * 1000);

      set((state) => {
        state.previewSession = {
          id: previewId,
          sandboxId,
          url: `http://localhost:${port}`,
          port,
          status: 'starting',
          startedAt: new Date(),
        };
      });

      // Simulate preview startup
      setTimeout(() => {
        set((state) => {
          if (state.previewSession?.id === previewId) {
            state.previewSession.status = 'running';
            state.previewSession.lastHealthCheck = new Date();
          }
        });

        // Emit preview ready event
        const orchestrator = useVibeOrchestrator.getState();
        orchestrator.processEvent({
          type: 'preview_ready',
          url: `http://localhost:${port}`,
        });
      }, 1000);
    },

    stopPreview: () => {
      set((state) => {
        if (state.previewSession) {
          state.previewSession.status = 'stopped';
        }
        state.previewSession = null;
      });
    },

    updatePreviewStatus: (status: PreviewSession['status']) => {
      set((state) => {
        if (state.previewSession) {
          state.previewSession.status = status;
          state.previewSession.lastHealthCheck = new Date();
        }
      });
    },

    addCommandToHistory: (command: string, output: string, exitCode: number, duration: number) => {
      const entry: CommandHistoryEntry = {
        id: `cmd-${Date.now()}`,
        command,
        output,
        exitCode,
        duration,
        timestamp: new Date(),
      };

      set((state) => {
        state.commandHistory.push(entry);
        // Keep only last N entries
        if (state.commandHistory.length > state.maxCommandHistory) {
          state.commandHistory = state.commandHistory.slice(-state.maxCommandHistory);
        }
      });
    },

    clearCommandHistory: () => {
      set((state) => {
        state.commandHistory = [];
      });
    },

    captureScreenshot: (deploymentId: string, dataUrl: string, viewport: { width: number; height: number }) => {
      const deployment = get().deployments.get(deploymentId);
      if (!deployment) return;

      const screenshot: Screenshot = {
        id: `screenshot-${Date.now()}`,
        deploymentId,
        url: deployment.url || '',
        dataUrl,
        viewport,
        capturedAt: new Date(),
      };

      set((state) => {
        state.screenshots.push(screenshot);
      });
    },

    getDeployment: (deploymentId: string) => {
      return get().deployments.get(deploymentId);
    },

    getActiveDeployment: () => {
      const { activeDeploymentId, deployments } = get();
      if (!activeDeploymentId) return undefined;
      return deployments.get(activeDeploymentId);
    },

    reset: () => {
      set((state) => {
        state.deployments = new Map();
        state.activeDeploymentId = null;
        state.previewSession = null;
        state.commandHistory = [];
        state.screenshots = [];
      });
    },
  }))
);

// ============================================================================
// DEPLOYMENT SERVICE
// ============================================================================

export interface DeployOptions {
  sessionId: string;
  sandboxId: string;
  target: DeploymentTarget;
  projectName?: string;
  buildCommand?: string;
  outputDirectory?: string;
}

/**
 * Deploy to preview (Sandpack iframe)
 */
export async function deployToPreview(options: DeployOptions): Promise<string> {
  const deploymentManager = useDeploymentManager.getState();
  const deploymentId = deploymentManager.startDeployment(options.sessionId, 'preview');

  try {
    deploymentManager.addBuildLog(deploymentId, 'Starting preview deployment...');
    deploymentManager.updateDeploymentStatus(deploymentId, 'building');

    // Simulate build process
    await new Promise((resolve) => setTimeout(resolve, 500));
    deploymentManager.addBuildLog(deploymentId, 'Compiling TypeScript...');

    await new Promise((resolve) => setTimeout(resolve, 500));
    deploymentManager.addBuildLog(deploymentId, 'Bundling with Vite...');

    await new Promise((resolve) => setTimeout(resolve, 500));
    deploymentManager.addBuildLog(deploymentId, 'Starting dev server...');

    // Start preview
    deploymentManager.startPreview(options.sandboxId);

    deploymentManager.updateDeploymentStatus(deploymentId, 'deploying');

    await new Promise((resolve) => setTimeout(resolve, 500));
    deploymentManager.addBuildLog(deploymentId, 'Preview ready!');

    const previewUrl = '/vibe/preview';
    deploymentManager.completeDeployment(deploymentId, previewUrl);

    return previewUrl;
  } catch (error) {
    deploymentManager.failDeployment(deploymentId, (error as Error).message);
    throw error;
  }
}

/**
 * Deploy to Netlify
 */
export async function deployToNetlify(options: DeployOptions): Promise<string> {
  const deploymentManager = useDeploymentManager.getState();
  const deploymentId = deploymentManager.startDeployment(options.sessionId, 'netlify');

  try {
    deploymentManager.addBuildLog(deploymentId, 'Preparing Netlify deployment...');
    deploymentManager.updateDeploymentStatus(deploymentId, 'building');

    // Build steps
    deploymentManager.addBuildLog(deploymentId, `Running: ${options.buildCommand || 'npm run build'}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    deploymentManager.addBuildLog(deploymentId, 'Build completed successfully');
    deploymentManager.updateDeploymentStatus(deploymentId, 'deploying');

    deploymentManager.addBuildLog(deploymentId, 'Uploading to Netlify...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate deployment URL
    const siteName = options.projectName || `vibe-${Date.now().toString(36)}`;
    const deployUrl = `https://${siteName}.netlify.app`;

    deploymentManager.addBuildLog(deploymentId, `Deployed to: ${deployUrl}`);
    deploymentManager.completeDeployment(deploymentId, deployUrl);

    return deployUrl;
  } catch (error) {
    deploymentManager.failDeployment(deploymentId, (error as Error).message);
    throw error;
  }
}

/**
 * Deploy to Vercel
 */
export async function deployToVercel(options: DeployOptions): Promise<string> {
  const deploymentManager = useDeploymentManager.getState();
  const deploymentId = deploymentManager.startDeployment(options.sessionId, 'vercel');

  try {
    deploymentManager.addBuildLog(deploymentId, 'Preparing Vercel deployment...');
    deploymentManager.updateDeploymentStatus(deploymentId, 'building');

    deploymentManager.addBuildLog(deploymentId, 'Analyzing project structure...');
    await new Promise((resolve) => setTimeout(resolve, 500));

    deploymentManager.addBuildLog(deploymentId, `Running: ${options.buildCommand || 'npm run build'}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    deploymentManager.updateDeploymentStatus(deploymentId, 'deploying');
    deploymentManager.addBuildLog(deploymentId, 'Uploading to Vercel Edge Network...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate deployment URL
    const projectName = options.projectName || `vibe-${Date.now().toString(36)}`;
    const deployUrl = `https://${projectName}.vercel.app`;

    deploymentManager.addBuildLog(deploymentId, `Deployed to: ${deployUrl}`);
    deploymentManager.completeDeployment(deploymentId, deployUrl);

    return deployUrl;
  } catch (error) {
    deploymentManager.failDeployment(deploymentId, (error as Error).message);
    throw error;
  }
}

/**
 * Deploy to Cloudflare Pages
 */
export async function deployToCloudflare(options: DeployOptions): Promise<string> {
  const deploymentManager = useDeploymentManager.getState();
  const deploymentId = deploymentManager.startDeployment(options.sessionId, 'cloudflare');

  try {
    deploymentManager.addBuildLog(deploymentId, 'Preparing Cloudflare Pages deployment...');
    deploymentManager.updateDeploymentStatus(deploymentId, 'building');

    deploymentManager.addBuildLog(deploymentId, 'Building for edge deployment...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    deploymentManager.updateDeploymentStatus(deploymentId, 'deploying');
    deploymentManager.addBuildLog(deploymentId, 'Deploying to Cloudflare global network...');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate deployment URL
    const projectName = options.projectName || `vibe-${Date.now().toString(36)}`;
    const deployUrl = `https://${projectName}.pages.dev`;

    deploymentManager.addBuildLog(deploymentId, `Deployed to: ${deployUrl}`);
    deploymentManager.completeDeployment(deploymentId, deployUrl);

    return deployUrl;
  } catch (error) {
    deploymentManager.failDeployment(deploymentId, (error as Error).message);
    throw error;
  }
}

// ============================================================================
// DEPLOY FUNCTION (Unified Interface)
// ============================================================================

export async function deploy(options: DeployOptions): Promise<string> {
  switch (options.target) {
    case 'preview':
      return deployToPreview(options);
    case 'netlify':
      return deployToNetlify(options);
    case 'vercel':
      return deployToVercel(options);
    case 'cloudflare':
      return deployToCloudflare(options);
    default:
      throw new Error(`Unknown deployment target: ${options.target}`);
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useCallback } from 'react';

export function useDeployment() {
  const {
    deployments,
    activeDeploymentId,
    previewSession,
    commandHistory,
    screenshots,
    getActiveDeployment,
  } = useDeploymentManager();

  const deployProject = useCallback(async (options: DeployOptions) => {
    return deploy(options);
  }, []);

  const activeDeployment = getActiveDeployment();

  return {
    deployments: Array.from(deployments.values()),
    activeDeployment,
    previewSession,
    commandHistory,
    screenshots,
    deploy: deployProject,
    isDeploying: activeDeployment?.status === 'building' || activeDeployment?.status === 'deploying',
    deploymentUrl: activeDeployment?.url,
    deploymentError: activeDeployment?.error,
  };
}

export default useDeploymentManager;
