/**
 * Background Chat Service
 * Manages chat sessions that run in the background
 * Enables continuous agent execution even when user navigates away
 */

import {
  useAgentMetricsStore,
  type ChatSession,
} from '@shared/stores/agent-metrics-store';
import {
  multiAgentOrchestrator,
  type AgentCommunication,
  type AgentStatus,
} from '@core/ai/orchestration/agent-collaboration-manager';

class BackgroundChatService {
  private activeSessions: Map<
    string,
    {
      session: ChatSession;
      abort: AbortController;
    }
  > = new Map();

  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start the background service
   */
  start() {
    const metricsStore = useAgentMetricsStore.getState();

    if (metricsStore.isBackgroundServiceRunning) {
      console.log('[BackgroundChatService] Already running');
      return;
    }

    console.log('[BackgroundChatService] Starting...');
    metricsStore.setBackgroundServiceRunning(true);

    // Cleanup old sessions every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupOldSessions();
      },
      5 * 60 * 1000
    );

    // Resume any in-progress sessions
    this.resumeActiveSessions();
  }

  /**
   * Stop the background service
   */
  stop() {
    const metricsStore = useAgentMetricsStore.getState();

    console.log('[BackgroundChatService] Stopping...');

    // Abort all active sessions
    this.activeSessions.forEach((sessionData) => {
      sessionData.abort.abort();
    });
    this.activeSessions.clear();

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    metricsStore.setBackgroundServiceRunning(false);
  }

  /**
   * Execute a task in the background
   */
  async executeTask(
    sessionId: string,
    userRequest: string,
    onProgress?: (progress: number) => void,
    onComplete?: (result: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const metricsStore = useAgentMetricsStore.getState();
    const session = metricsStore.currentSessions.find(
      (s) => s.id === sessionId
    );

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const abort = new AbortController();
    this.activeSessions.set(sessionId, { session, abort });

    try {
      console.log(
        `[BackgroundChatService] Executing task for session ${sessionId}`
      );

      // CRITICAL FIX: Wrap async operations in try-catch to prevent unhandled rejections
      // Track communications
      const handleCommunication = (comm: AgentCommunication) => {
        if (abort.signal.aborted) return;

        try {
          metricsStore.addCommunication(comm);
          metricsStore.updateSession(sessionId, {
            messagesCount: (session.messagesCount || 0) + 1,
          });
        } catch (err) {
          console.error('[BackgroundChatService] Error in handleCommunication:', err);
        }
      };

      // Track agent status
      const handleStatusUpdate = (status: AgentStatus) => {
        if (abort.signal.aborted) return;

        try {
          metricsStore.updateAgentStatus(status.agentName, status);

          // Report progress
          if (onProgress) {
            onProgress(status.progress);
          }

          metricsStore.updateSession(sessionId, {
            lastActivity: new Date(),
          });
        } catch (err) {
          console.error('[BackgroundChatService] Error in handleStatusUpdate:', err);
        }
      };

      // Check abort before analyzing
      if (abort.signal.aborted) {
        throw new Error('Task aborted before analysis');
      }

      // Analyze intent with error handling
      let plan;
      try {
        plan = await multiAgentOrchestrator.analyzeIntent(userRequest);
      } catch (analyzeError) {
        console.error('[BackgroundChatService] Error analyzing intent:', analyzeError);
        throw new Error(
          `Failed to analyze request: ${analyzeError instanceof Error ? analyzeError.message : 'Unknown error'}`
        );
      }

      // Check abort before execution
      if (abort.signal.aborted) {
        throw new Error('Task aborted before execution');
      }

      // Execute the plan with error handling
      let results;
      try {
        results = await multiAgentOrchestrator.executePlan(
          plan,
          handleCommunication,
          handleStatusUpdate
        );
      } catch (executeError) {
        console.error('[BackgroundChatService] Error executing plan:', executeError);
        throw new Error(
          `Failed to execute plan: ${executeError instanceof Error ? executeError.message : 'Unknown error'}`
        );
      }

      // Check if aborted after execution
      if (abort.signal.aborted) {
        throw new Error('Task aborted');
      }

      // Task completed
      const resultMessage = `Task completed successfully: ${userRequest}`;

      metricsStore.endSession(sessionId, 'completed', resultMessage);
      this.activeSessions.delete(sessionId);

      if (onComplete) {
        onComplete(resultMessage);
      }

      console.log(
        `[BackgroundChatService] Task completed for session ${sessionId}`
      );
    } catch (error) {
      console.error(
        `[BackgroundChatService] Error in session ${sessionId}:`,
        error
      );

      if (!abort.signal.aborted) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        metricsStore.endSession(sessionId, 'failed', errorMessage);

        if (onError) {
          onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      }

      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Abort a running task
   */
  abortTask(sessionId: string) {
    const sessionData = this.activeSessions.get(sessionId);

    if (sessionData) {
      console.log(`[BackgroundChatService] Aborting session ${sessionId}`);
      sessionData.abort.abort();
      this.activeSessions.delete(sessionId);

      const metricsStore = useAgentMetricsStore.getState();
      metricsStore.endSession(sessionId, 'failed', 'Task aborted by user');
    }
  }

  /**
   * Check if a session is running in the background
   */
  isSessionRunning(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Get all active session IDs
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Resume active sessions on service start
   */
  private resumeActiveSessions() {
    const metricsStore = useAgentMetricsStore.getState();
    const activeSessions = metricsStore.currentSessions.filter(
      (s) => s.isActive
    );

    console.log(
      `[BackgroundChatService] Found ${activeSessions.length} active sessions to resume`
    );

    // For now, we don't auto-resume sessions
    // In a production app, you might want to save session state and resume
  }

  /**
   * Cleanup sessions that have been inactive for too long
   * CRITICAL FIX: Create a copy of sessions array before iterating
   * to avoid modifying array during iteration
   */
  private cleanupOldSessions() {
    const metricsStore = useAgentMetricsStore.getState();
    const now = Date.now();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    // CRITICAL FIX: Create a copy of the sessions array to avoid modification during iteration
    // This prevents items from being skipped or repeated when endSession modifies the original array
    const sessionsToCheck = [...metricsStore.currentSessions];
    const sessionsToClean: string[] = [];

    // First pass: identify sessions that need cleanup
    for (const session of sessionsToCheck) {
      if (session.isActive) {
        const inactiveTime = now - new Date(session.lastActivity).getTime();

        if (inactiveTime > maxInactiveTime) {
          sessionsToClean.push(session.id);
        }
      }
    }

    // Second pass: cleanup identified sessions (safe to modify now)
    for (const sessionId of sessionsToClean) {
      console.log(
        `[BackgroundChatService] Cleaning up inactive session ${sessionId}`
      );
      try {
        metricsStore.endSession(
          sessionId,
          'failed',
          'Session timeout due to inactivity'
        );
      } catch (err) {
        console.error(`[BackgroundChatService] Error cleaning up session ${sessionId}:`, err);
      }
    }

    if (sessionsToClean.length > 0) {
      console.log(
        `[BackgroundChatService] Cleaned up ${sessionsToClean.length} inactive sessions`
      );
    }
  }
}

// Singleton instance
export const backgroundChatService = new BackgroundChatService();

// Auto-start on import (can be disabled if needed)
if (typeof window !== 'undefined') {
  // Start service when app loads
  setTimeout(() => {
    backgroundChatService.start();
  }, 1000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    backgroundChatService.stop();
  });
}
