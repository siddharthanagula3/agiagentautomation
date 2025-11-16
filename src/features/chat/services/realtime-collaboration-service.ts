/**
 * Real-Time Collaboration Service
 * Provides real-time collaboration features:
 * - Live typing indicators
 * - Presence broadcasting (online/offline/away)
 * - Cursor position sharing (for collaborative editing)
 * - Activity status updates
 * - User awareness
 */

import { supabase } from '@shared/lib/supabase-client';
import {
  websocketManager,
  MessageType,
} from '@core/integrations/websocket-manager';

// Presence status types
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

// Activity types
export enum ActivityType {
  VIEWING = 'viewing',
  TYPING = 'typing',
  EDITING = 'editing',
  THINKING = 'thinking',
  IDLE = 'idle',
}

// User presence information
export interface UserPresence {
  userId: string;
  sessionId: string;
  status: PresenceStatus;
  activity: ActivityType;
  lastSeen: number;
  metadata?: {
    username?: string;
    avatar?: string;
    color?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
  };
}

// Typing indicator information
export interface TypingIndicator {
  userId: string;
  sessionId: string;
  agentId?: string;
  isTyping: boolean;
  timestamp: number;
  metadata?: {
    username?: string;
    avatar?: string;
  };
}

// Cursor position for collaborative editing
export interface CursorPosition {
  userId: string;
  sessionId: string;
  x: number;
  y: number;
  elementId?: string;
  selection?: {
    start: number;
    end: number;
    text?: string;
  };
  timestamp: number;
  metadata?: {
    username?: string;
    color?: string;
  };
}

// Activity status update
export interface ActivityUpdate {
  userId: string;
  sessionId: string;
  activity: ActivityType;
  details?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Collaboration session
export interface CollaborationSession {
  id: string;
  participants: Map<string, UserPresence>;
  typingUsers: Map<string, TypingIndicator>;
  cursors: Map<string, CursorPosition>;
  activities: Map<string, ActivityUpdate>;
  startedAt: number;
  lastActivity: number;
}

// Configuration
const TYPING_TIMEOUT = 3000; // 3 seconds
const PRESENCE_HEARTBEAT = 30000; // 30 seconds
const CURSOR_THROTTLE = 100; // 100ms
const ACTIVITY_DEBOUNCE = 500; // 500ms

export class RealtimeCollaborationService {
  private sessions: Map<string, CollaborationSession> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private presenceTimers: Map<string, NodeJS.Timeout> = new Map();
  private cursorThrottleTimers: Map<string, NodeJS.Timeout> = new Map();
  private activityDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private supabaseChannels: Map<string, ReturnType<typeof supabase.channel>> =
    new Map();
  private currentUserId?: string;
  private currentSessionId?: string;

  /**
   * Initialize collaboration for a session
   */
  async initializeSession(
    sessionId: string,
    userId: string,
    metadata?: UserPresence['metadata']
  ): Promise<void> {
    this.currentUserId = userId;
    this.currentSessionId = sessionId;

    // Create session if it doesn't exist
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        participants: new Map(),
        typingUsers: new Map(),
        cursors: new Map(),
        activities: new Map(),
        startedAt: Date.now(),
        lastActivity: Date.now(),
      });
    }

    // Set up Supabase Realtime channel for collaboration
    const channel = supabase.channel(`collaboration:${sessionId}`);

    // Subscribe to presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.handlePresenceSync(sessionId, state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(sessionId, key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(sessionId, key, leftPresences);
      });

    // Subscribe to typing indicators
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      this.handleTypingUpdate(sessionId, payload.payload as TypingIndicator);
    });

    // Subscribe to cursor updates
    channel.on('broadcast', { event: 'cursor' }, (payload) => {
      this.handleCursorUpdate(sessionId, payload.payload as CursorPosition);
    });

    // Subscribe to activity updates
    channel.on('broadcast', { event: 'activity' }, (payload) => {
      this.handleActivityUpdate(sessionId, payload.payload as ActivityUpdate);
    });

    // Subscribe to channel
    await channel.subscribe();

    // Track presence
    await channel.track({
      userId,
      sessionId,
      status: PresenceStatus.ONLINE,
      activity: ActivityType.VIEWING,
      lastSeen: Date.now(),
      metadata,
    });

    this.supabaseChannels.set(sessionId, channel);

    // Start presence heartbeat
    this.startPresenceHeartbeat(sessionId, userId, metadata);

    // Also set up WebSocket fallback
    await websocketManager.connect(`collaboration-${sessionId}`, sessionId);

    console.log(`[Collaboration] Session initialized: ${sessionId}`);
  }

  /**
   * Clean up collaboration session
   */
  async cleanupSession(sessionId: string): Promise<void> {
    // Stop all timers
    this.stopAllTimers(sessionId);

    // Unsubscribe from Supabase channel
    const channel = this.supabaseChannels.get(sessionId);
    if (channel) {
      await channel.unsubscribe();
      this.supabaseChannels.delete(sessionId);
    }

    // Disconnect WebSocket
    await websocketManager.disconnect(`collaboration-${sessionId}`);

    // Remove session
    this.sessions.delete(sessionId);

    console.log(`[Collaboration] Session cleaned up: ${sessionId}`);
  }

  /**
   * Update user presence status
   */
  async updatePresence(
    sessionId: string,
    userId: string,
    status: PresenceStatus,
    activity: ActivityType = ActivityType.IDLE,
    metadata?: UserPresence['metadata']
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return;
    }

    const presence: UserPresence = {
      userId,
      sessionId,
      status,
      activity,
      lastSeen: Date.now(),
      metadata,
    };

    session.participants.set(userId, presence);
    session.lastActivity = Date.now();

    // Broadcast via Supabase Realtime
    const channel = this.supabaseChannels.get(sessionId);
    if (channel) {
      await channel.track(presence);
    }

    // Also send via WebSocket as fallback
    await websocketManager
      .send(`collaboration-${sessionId}`, {
        type: MessageType.PRESENCE,
        payload: presence,
        sessionId,
        userId,
      })
      .catch(() => {
        // Ignore WebSocket errors, Supabase is primary
      });
  }

  /**
   * Broadcast typing indicator
   */
  async broadcastTyping(
    sessionId: string,
    userId: string,
    isTyping: boolean,
    agentId?: string,
    metadata?: TypingIndicator['metadata']
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return;
    }

    const indicator: TypingIndicator = {
      userId,
      sessionId,
      agentId,
      isTyping,
      timestamp: Date.now(),
      metadata,
    };

    // Update local state
    if (isTyping) {
      session.typingUsers.set(userId, indicator);

      // Clear existing timer
      const timerId = this.typingTimers.get(`${sessionId}:${userId}`);
      if (timerId) {
        clearTimeout(timerId);
      }

      // Auto-clear typing after timeout
      const newTimer = setTimeout(() => {
        this.broadcastTyping(sessionId, userId, false, agentId, metadata);
      }, TYPING_TIMEOUT);

      this.typingTimers.set(`${sessionId}:${userId}`, newTimer);
    } else {
      session.typingUsers.delete(userId);

      // Clear timer
      const timerId = this.typingTimers.get(`${sessionId}:${userId}`);
      if (timerId) {
        clearTimeout(timerId);
        this.typingTimers.delete(`${sessionId}:${userId}`);
      }
    }

    session.lastActivity = Date.now();

    // Broadcast via Supabase Realtime
    const channel = this.supabaseChannels.get(sessionId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: indicator,
      });
    }

    // Also send via WebSocket
    await websocketManager
      .send(`collaboration-${sessionId}`, {
        type: MessageType.TYPING,
        payload: indicator,
        sessionId,
        userId,
        agentId,
      })
      .catch(() => {
        // Ignore errors
      });
  }

  /**
   * Broadcast cursor position (throttled)
   */
  async broadcastCursor(
    sessionId: string,
    userId: string,
    position: Omit<CursorPosition, 'userId' | 'sessionId' | 'timestamp'>,
    metadata?: CursorPosition['metadata']
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return;
    }

    const timerKey = `${sessionId}:${userId}`;

    // Throttle cursor updates
    const existingTimer = this.cursorThrottleTimers.get(timerKey);
    if (existingTimer) {
      return; // Skip this update, still throttled
    }

    const cursor: CursorPosition = {
      userId,
      sessionId,
      ...position,
      timestamp: Date.now(),
      metadata,
    };

    session.cursors.set(userId, cursor);
    session.lastActivity = Date.now();

    // Broadcast via Supabase Realtime
    const channel = this.supabaseChannels.get(sessionId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: cursor,
      });
    }

    // Also send via WebSocket
    await websocketManager
      .send(`collaboration-${sessionId}`, {
        type: MessageType.CURSOR,
        payload: cursor,
        sessionId,
        userId,
      })
      .catch(() => {
        // Ignore errors
      });

    // Set throttle timer
    const timer = setTimeout(() => {
      this.cursorThrottleTimers.delete(timerKey);
    }, CURSOR_THROTTLE);

    this.cursorThrottleTimers.set(timerKey, timer);
  }

  /**
   * Broadcast activity update (debounced)
   */
  async broadcastActivity(
    sessionId: string,
    userId: string,
    activity: ActivityType,
    details?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return;
    }

    const timerKey = `${sessionId}:${userId}`;

    // Clear existing debounce timer
    const existingTimer = this.activityDebounceTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce activity updates
    const timer = setTimeout(async () => {
      const update: ActivityUpdate = {
        userId,
        sessionId,
        activity,
        details,
        timestamp: Date.now(),
        metadata,
      };

      session.activities.set(userId, update);
      session.lastActivity = Date.now();

      // Broadcast via Supabase Realtime
      const channel = this.supabaseChannels.get(sessionId);
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'activity',
          payload: update,
        });
      }

      // Also send via WebSocket
      await websocketManager
        .send(`collaboration-${sessionId}`, {
          type: MessageType.ACTIVITY,
          payload: update,
          sessionId,
          userId,
        })
        .catch(() => {
          // Ignore errors
        });

      this.activityDebounceTimers.delete(timerKey);
    }, ACTIVITY_DEBOUNCE);

    this.activityDebounceTimers.set(timerKey, timer);
  }

  /**
   * Get all participants in a session
   */
  getParticipants(sessionId: string): UserPresence[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.participants.values());
  }

  /**
   * Get users currently typing
   */
  getTypingUsers(sessionId: string): TypingIndicator[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.typingUsers.values());
  }

  /**
   * Get all cursor positions
   */
  getCursors(sessionId: string): CursorPosition[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.cursors.values());
  }

  /**
   * Get all activity updates
   */
  getActivities(sessionId: string): ActivityUpdate[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return Array.from(session.activities.values());
  }

  /**
   * Subscribe to presence changes
   */
  onPresenceChange(
    sessionId: string,
    callback: (participants: UserPresence[]) => void
  ): () => void {
    const channel = this.supabaseChannels.get(sessionId);
    if (!channel) {
      console.warn(`[Collaboration] Channel not found: ${sessionId}`);
      return () => {};
    }

    // Return the callback directly since we handle it in handlePresenceSync
    const handler = () => {
      callback(this.getParticipants(sessionId));
    };

    // Store the handler (we could use a Map if we need to manage multiple handlers)
    return () => {
      // Cleanup if needed
    };
  }

  /**
   * Subscribe to typing indicator changes
   */
  onTypingChange(
    sessionId: string,
    callback: (typingUsers: TypingIndicator[]) => void
  ): () => void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return () => {};
    }

    // We'll emit via a custom event system
    const handler = () => {
      callback(this.getTypingUsers(sessionId));
    };

    return () => {
      // Cleanup
    };
  }

  /**
   * Subscribe to cursor updates
   */
  onCursorUpdate(
    sessionId: string,
    callback: (cursors: CursorPosition[]) => void
  ): () => void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return () => {};
    }

    const handler = () => {
      callback(this.getCursors(sessionId));
    };

    return () => {
      // Cleanup
    };
  }

  /**
   * Subscribe to activity updates
   */
  onActivityUpdate(
    sessionId: string,
    callback: (activities: ActivityUpdate[]) => void
  ): () => void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[Collaboration] Session not found: ${sessionId}`);
      return () => {};
    }

    const handler = () => {
      callback(this.getActivities(sessionId));
    };

    return () => {
      // Cleanup
    };
  }

  /**
   * Handle presence sync from Supabase
   */
  private handlePresenceSync(
    sessionId: string,
    state: Record<string, unknown>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Update participants based on presence state
    for (const [key, presences] of Object.entries(state)) {
      const presenceList = presences as UserPresence[];
      for (const presence of presenceList) {
        session.participants.set(presence.userId, presence);
      }
    }

    console.log(
      `[Collaboration] Presence synced: ${sessionId}, ${session.participants.size} participants`
    );
  }

  /**
   * Handle presence join
   */
  private handlePresenceJoin(
    sessionId: string,
    key: string,
    presences: unknown[]
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const presence of presences as UserPresence[]) {
      session.participants.set(presence.userId, presence);
      console.log(`[Collaboration] User joined: ${presence.userId}`);
    }
  }

  /**
   * Handle presence leave
   */
  private handlePresenceLeave(
    sessionId: string,
    key: string,
    presences: unknown[]
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const presence of presences as UserPresence[]) {
      session.participants.delete(presence.userId);
      session.typingUsers.delete(presence.userId);
      session.cursors.delete(presence.userId);
      session.activities.delete(presence.userId);
      console.log(`[Collaboration] User left: ${presence.userId}`);
    }
  }

  /**
   * Handle typing update
   */
  private handleTypingUpdate(
    sessionId: string,
    indicator: TypingIndicator
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Don't update if it's from current user
    if (indicator.userId === this.currentUserId) return;

    if (indicator.isTyping) {
      session.typingUsers.set(indicator.userId, indicator);
    } else {
      session.typingUsers.delete(indicator.userId);
    }
  }

  /**
   * Handle cursor update
   */
  private handleCursorUpdate(sessionId: string, cursor: CursorPosition): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Don't update if it's from current user
    if (cursor.userId === this.currentUserId) return;

    session.cursors.set(cursor.userId, cursor);
  }

  /**
   * Handle activity update
   */
  private handleActivityUpdate(
    sessionId: string,
    update: ActivityUpdate
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Don't update if it's from current user
    if (update.userId === this.currentUserId) return;

    session.activities.set(update.userId, update);
  }

  /**
   * Start presence heartbeat to keep user online
   */
  private startPresenceHeartbeat(
    sessionId: string,
    userId: string,
    metadata?: UserPresence['metadata']
  ): void {
    const timerKey = `${sessionId}:${userId}`;

    // Clear existing timer
    const existingTimer = this.presenceTimers.get(timerKey);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Send heartbeat
    const timer = setInterval(() => {
      this.updatePresence(
        sessionId,
        userId,
        PresenceStatus.ONLINE,
        ActivityType.VIEWING,
        metadata
      ).catch((error) => {
        console.error('[Collaboration] Heartbeat failed', error);
      });
    }, PRESENCE_HEARTBEAT);

    this.presenceTimers.set(timerKey, timer);
  }

  /**
   * Stop all timers for a session
   */
  private stopAllTimers(sessionId: string): void {
    // Stop typing timers
    for (const [key, timer] of this.typingTimers.entries()) {
      if (key.startsWith(`${sessionId}:`)) {
        clearTimeout(timer);
        this.typingTimers.delete(key);
      }
    }

    // Stop presence timers
    for (const [key, timer] of this.presenceTimers.entries()) {
      if (key.startsWith(`${sessionId}:`)) {
        clearInterval(timer);
        this.presenceTimers.delete(key);
      }
    }

    // Stop cursor throttle timers
    for (const [key, timer] of this.cursorThrottleTimers.entries()) {
      if (key.startsWith(`${sessionId}:`)) {
        clearTimeout(timer);
        this.cursorThrottleTimers.delete(key);
      }
    }

    // Stop activity debounce timers
    for (const [key, timer] of this.activityDebounceTimers.entries()) {
      if (key.startsWith(`${sessionId}:`)) {
        clearTimeout(timer);
        this.activityDebounceTimers.delete(key);
      }
    }
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.cleanupSession(sessionId);
    }

    console.log('[Collaboration] All sessions cleaned up');
  }
}

// Singleton instance
export const realtimeCollaborationService = new RealtimeCollaborationService();
