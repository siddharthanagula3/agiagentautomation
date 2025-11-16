/**
 * WebSocket Manager
 * Advanced WebSocket connection management with:
 * - Connection pooling
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat/ping-pong
 * - Connection state tracking
 * - Event-based architecture
 */

import { supabase } from '@shared/lib/supabase-client';

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  FAILED = 'FAILED',
}

// Message types
export enum MessageType {
  CHAT = 'CHAT',
  TYPING = 'TYPING',
  PRESENCE = 'PRESENCE',
  CURSOR = 'CURSOR',
  ACTIVITY = 'ACTIVITY',
  DELIVERY = 'DELIVERY',
  READ_RECEIPT = 'READ_RECEIPT',
  SYSTEM = 'SYSTEM',
  HEARTBEAT = 'HEARTBEAT',
}

// WebSocket message structure
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: number;
  sessionId?: string;
  userId?: string;
  agentId?: string;
  priority?: 'high' | 'normal' | 'low';
}

// Connection configuration
export interface ConnectionConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  poolSize?: number;
  useSupabaseRealtime?: boolean;
}

// Connection metrics
export interface ConnectionMetrics {
  connectionId: string;
  state: WebSocketState;
  connectedAt?: number;
  disconnectedAt?: number;
  reconnectAttempts: number;
  messagesReceived: number;
  messagesSent: number;
  latency: number;
  errors: number;
  lastHeartbeat?: number;
}

// Event types
export type WebSocketEventType =
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'message'
  | 'error'
  | 'stateChange';

export interface WebSocketEvent {
  type: WebSocketEventType;
  connectionId: string;
  data?: unknown;
  timestamp: number;
}

// Connection pool entry
interface PooledConnection {
  id: string;
  ws: WebSocket | null;
  supabaseChannel?: ReturnType<typeof supabase.channel> | null;
  state: WebSocketState;
  metrics: ConnectionMetrics;
  config: Required<ConnectionConfig>;
  messageQueue: WebSocketMessage[];
  heartbeatTimer?: NodeJS.Timeout;
  reconnectTimer?: NodeJS.Timeout;
  listeners: Map<WebSocketEventType, Set<(event: WebSocketEvent) => void>>;
}

// Default configuration
const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  url: '',
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
  messageQueueSize: 1000,
  poolSize: 5,
  useSupabaseRealtime: true,
};

export class WebSocketManager {
  private connections: Map<string, PooledConnection> = new Map();
  private messageHandlers: Map<
    MessageType,
    Set<(message: WebSocketMessage) => void>
  > = new Map();
  private globalListeners: Map<
    WebSocketEventType,
    Set<(event: WebSocketEvent) => void>
  > = new Map();
  private config: Required<ConnectionConfig>;

  constructor(config: ConnectionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new WebSocket connection
   */
  async connect(connectionId: string, sessionId?: string): Promise<void> {
    // Check if connection already exists
    if (this.connections.has(connectionId)) {
      const conn = this.connections.get(connectionId)!;
      if (conn.state === WebSocketState.CONNECTED) {
        console.log(`[WebSocket] Connection ${connectionId} already connected`);
        return;
      }
    }

    // Initialize connection
    const connection: PooledConnection = {
      id: connectionId,
      ws: null,
      supabaseChannel: null,
      state: WebSocketState.CONNECTING,
      metrics: {
        connectionId,
        state: WebSocketState.CONNECTING,
        reconnectAttempts: 0,
        messagesReceived: 0,
        messagesSent: 0,
        latency: 0,
        errors: 0,
      },
      config: this.config,
      messageQueue: [],
      listeners: new Map(),
    };

    this.connections.set(connectionId, connection);
    this.emitEvent(connectionId, 'stateChange', {
      state: WebSocketState.CONNECTING,
    });

    try {
      if (this.config.useSupabaseRealtime) {
        // Use Supabase Realtime
        await this.connectSupabase(connection, sessionId);
      } else {
        // Use native WebSocket
        await this.connectNative(connection);
      }

      // Start heartbeat
      this.startHeartbeat(connection);

      // Process queued messages
      this.processMessageQueue(connection);

      console.log(`[WebSocket] Connected: ${connectionId}`);
    } catch (error) {
      console.error(`[WebSocket] Connection failed: ${connectionId}`, error);
      this.handleConnectionError(connection, error);
    }
  }

  /**
   * Connect using Supabase Realtime
   */
  private async connectSupabase(
    connection: PooledConnection,
    sessionId?: string
  ): Promise<void> {
    const channelName = sessionId || `global-${connection.id}`;

    connection.supabaseChannel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        this.handleMessage(connection, payload.payload as WebSocketMessage);
      })
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync(connection);
      })
      .on('presence', { event: 'join' }, (payload) => {
        this.handlePresenceJoin(connection, payload);
      })
      .on('presence', { event: 'leave' }, (payload) => {
        this.handlePresenceLeave(connection, payload);
      });

    // Subscribe to channel
    const status = await connection.supabaseChannel.subscribe();

    if (status === 'SUBSCRIBED') {
      connection.state = WebSocketState.CONNECTED;
      connection.metrics.state = WebSocketState.CONNECTED;
      connection.metrics.connectedAt = Date.now();
      connection.metrics.reconnectAttempts = 0;
      this.emitEvent(connection.id, 'connected', { channelName });
      this.emitEvent(connection.id, 'stateChange', {
        state: WebSocketState.CONNECTED,
      });
    } else {
      throw new Error(`Failed to subscribe to channel: ${status}`);
    }
  }

  /**
   * Connect using native WebSocket
   */
  private async connectNative(connection: PooledConnection): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(this.config.url);
        connection.ws = ws;

        ws.onopen = () => {
          connection.state = WebSocketState.CONNECTED;
          connection.metrics.state = WebSocketState.CONNECTED;
          connection.metrics.connectedAt = Date.now();
          connection.metrics.reconnectAttempts = 0;
          this.emitEvent(connection.id, 'connected', {});
          this.emitEvent(connection.id, 'stateChange', {
            state: WebSocketState.CONNECTED,
          });
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(connection, message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message', error);
            connection.metrics.errors++;
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error', error);
          connection.metrics.errors++;
          this.emitEvent(connection.id, 'error', { error });
          reject(error);
        };

        ws.onclose = (event) => {
          console.log(
            `[WebSocket] Closed: ${connection.id}`,
            event.code,
            event.reason
          );
          this.handleConnectionClose(connection, event.code, event.reason);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect a WebSocket connection
   */
  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`[WebSocket] Connection not found: ${connectionId}`);
      return;
    }

    connection.state = WebSocketState.DISCONNECTING;
    this.emitEvent(connectionId, 'stateChange', {
      state: WebSocketState.DISCONNECTING,
    });

    // Stop heartbeat
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = undefined;
    }

    // Stop reconnect timer
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
      connection.reconnectTimer = undefined;
    }

    // Close connection
    if (connection.supabaseChannel) {
      await connection.supabaseChannel.unsubscribe();
      connection.supabaseChannel = null;
    }

    if (connection.ws) {
      connection.ws.close(1000, 'Normal closure');
      connection.ws = null;
    }

    connection.state = WebSocketState.DISCONNECTED;
    connection.metrics.state = WebSocketState.DISCONNECTED;
    connection.metrics.disconnectedAt = Date.now();
    this.emitEvent(connectionId, 'disconnected', {});
    this.emitEvent(connectionId, 'stateChange', {
      state: WebSocketState.DISCONNECTED,
    });

    // Remove from pool
    this.connections.delete(connectionId);
    console.log(`[WebSocket] Disconnected: ${connectionId}`);
  }

  /**
   * Send a message through WebSocket
   */
  async send(
    connectionId: string,
    message: Omit<WebSocketMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // Create full message
    const fullMessage: WebSocketMessage = {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      ...message,
    };

    // If not connected, queue the message
    if (connection.state !== WebSocketState.CONNECTED) {
      if (connection.messageQueue.length < this.config.messageQueueSize) {
        connection.messageQueue.push(fullMessage);
        console.log(
          `[WebSocket] Message queued: ${connection.id}, queue size: ${connection.messageQueue.length}`
        );
      } else {
        console.warn(`[WebSocket] Message queue full: ${connection.id}`);
      }
      return;
    }

    try {
      if (connection.supabaseChannel) {
        // Send via Supabase Realtime
        await connection.supabaseChannel.send({
          type: 'broadcast',
          event: 'message',
          payload: fullMessage,
        });
      } else if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        // Send via native WebSocket
        connection.ws.send(JSON.stringify(fullMessage));
      } else {
        throw new Error('WebSocket not ready');
      }

      connection.metrics.messagesSent++;
    } catch (error) {
      console.error('[WebSocket] Failed to send message', error);
      connection.metrics.errors++;

      // Queue the message for retry
      if (connection.messageQueue.length < this.config.messageQueueSize) {
        connection.messageQueue.push(fullMessage);
      }

      throw error;
    }
  }

  /**
   * Broadcast a message to all connections
   */
  async broadcast(
    message: Omit<WebSocketMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const promises = Array.from(this.connections.keys()).map((connectionId) =>
      this.send(connectionId, message).catch((error) =>
        console.error(`Failed to broadcast to ${connectionId}`, error)
      )
    );

    await Promise.allSettled(promises);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(
    connection: PooledConnection,
    message: WebSocketMessage
  ): void {
    connection.metrics.messagesReceived++;

    // Handle heartbeat responses
    if (message.type === MessageType.HEARTBEAT) {
      const latency = Date.now() - message.timestamp;
      connection.metrics.latency = latency;
      connection.metrics.lastHeartbeat = Date.now();
      return;
    }

    // Emit to specific message type handlers
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Message handler error', error);
        }
      });
    }

    // Emit generic message event
    this.emitEvent(connection.id, 'message', message);
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(
    connection: PooledConnection,
    code: number,
    reason: string
  ): void {
    connection.state = WebSocketState.DISCONNECTED;
    connection.metrics.disconnectedAt = Date.now();
    this.emitEvent(connection.id, 'disconnected', { code, reason });
    this.emitEvent(connection.id, 'stateChange', {
      state: WebSocketState.DISCONNECTED,
    });

    // Attempt reconnection if not a normal closure
    if (
      code !== 1000 &&
      connection.metrics.reconnectAttempts < this.config.maxReconnectAttempts
    ) {
      this.scheduleReconnect(connection);
    } else if (
      connection.metrics.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      connection.state = WebSocketState.FAILED;
      connection.metrics.state = WebSocketState.FAILED;
      this.emitEvent(connection.id, 'stateChange', {
        state: WebSocketState.FAILED,
      });
      console.error(
        `[WebSocket] Max reconnect attempts reached: ${connection.id}`
      );
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(
    connection: PooledConnection,
    error: unknown
  ): void {
    connection.metrics.errors++;
    this.emitEvent(connection.id, 'error', { error });

    // Attempt reconnection
    if (
      connection.metrics.reconnectAttempts < this.config.maxReconnectAttempts
    ) {
      this.scheduleReconnect(connection);
    } else {
      connection.state = WebSocketState.FAILED;
      connection.metrics.state = WebSocketState.FAILED;
      this.emitEvent(connection.id, 'stateChange', {
        state: WebSocketState.FAILED,
      });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(connection: PooledConnection): void {
    if (connection.reconnectTimer) {
      clearTimeout(connection.reconnectTimer);
    }

    connection.state = WebSocketState.RECONNECTING;
    connection.metrics.reconnectAttempts++;
    this.emitEvent(connection.id, 'reconnecting', {
      attempt: connection.metrics.reconnectAttempts,
    });
    this.emitEvent(connection.id, 'stateChange', {
      state: WebSocketState.RECONNECTING,
    });

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay =
      this.config.reconnectInterval *
      Math.pow(2, connection.metrics.reconnectAttempts - 1);
    console.log(
      `[WebSocket] Scheduling reconnect for ${connection.id} in ${delay}ms (attempt ${connection.metrics.reconnectAttempts})`
    );

    connection.reconnectTimer = setTimeout(() => {
      this.connect(connection.id).catch((error) => {
        console.error('[WebSocket] Reconnection failed', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat for connection health monitoring
   */
  private startHeartbeat(connection: PooledConnection): void {
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
    }

    connection.heartbeatTimer = setInterval(() => {
      if (connection.state === WebSocketState.CONNECTED) {
        this.send(connection.id, {
          type: MessageType.HEARTBEAT,
          payload: { ping: true },
        }).catch((error) => {
          console.error('[WebSocket] Heartbeat failed', error);
        });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(
    connection: PooledConnection
  ): Promise<void> {
    if (
      connection.state !== WebSocketState.CONNECTED ||
      connection.messageQueue.length === 0
    ) {
      return;
    }

    console.log(
      `[WebSocket] Processing ${connection.messageQueue.length} queued messages`
    );

    // Sort by priority (high > normal > low)
    connection.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return (
        (priorityOrder[b.priority || 'normal'] || 2) -
        (priorityOrder[a.priority || 'normal'] || 2)
      );
    });

    // Send all queued messages
    while (connection.messageQueue.length > 0) {
      const message = connection.messageQueue.shift()!;
      try {
        await this.send(connection.id, message);
      } catch (error) {
        console.error('[WebSocket] Failed to send queued message', error);
        // Re-queue if send failed
        connection.messageQueue.unshift(message);
        break;
      }
    }
  }

  /**
   * Handle Supabase presence sync
   */
  private handlePresenceSync(connection: PooledConnection): void {
    if (!connection.supabaseChannel) return;

    const state = connection.supabaseChannel.presenceState();
    this.emitEvent(connection.id, 'message', {
      type: MessageType.PRESENCE,
      payload: { event: 'sync', state },
    });
  }

  /**
   * Handle Supabase presence join
   */
  private handlePresenceJoin(
    connection: PooledConnection,
    payload: unknown
  ): void {
    this.emitEvent(connection.id, 'message', {
      type: MessageType.PRESENCE,
      payload: { event: 'join', ...payload },
    });
  }

  /**
   * Handle Supabase presence leave
   */
  private handlePresenceLeave(
    connection: PooledConnection,
    payload: unknown
  ): void {
    this.emitEvent(connection.id, 'message', {
      type: MessageType.PRESENCE,
      payload: { event: 'leave', ...payload },
    });
  }

  /**
   * Register message handler for specific message type
   */
  onMessage(
    type: MessageType,
    handler: (message: WebSocketMessage) => void
  ): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  /**
   * Register event listener
   */
  on(
    connectionId: string,
    event: WebSocketEventType,
    handler: (event: WebSocketEvent) => void
  ): () => void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      console.warn(`[WebSocket] Connection not found: ${connectionId}`);
      return () => {};
    }

    if (!connection.listeners.has(event)) {
      connection.listeners.set(event, new Set());
    }

    const listeners = connection.listeners.get(event)!;
    listeners.add(handler);

    // Return unsubscribe function
    return () => {
      listeners.delete(handler);
      if (listeners.size === 0) {
        connection.listeners.delete(event);
      }
    };
  }

  /**
   * Register global event listener (all connections)
   */
  onGlobal(
    event: WebSocketEventType,
    handler: (event: WebSocketEvent) => void
  ): () => void {
    if (!this.globalListeners.has(event)) {
      this.globalListeners.set(event, new Set());
    }

    const listeners = this.globalListeners.get(event)!;
    listeners.add(handler);

    // Return unsubscribe function
    return () => {
      listeners.delete(handler);
      if (listeners.size === 0) {
        this.globalListeners.delete(event);
      }
    };
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(
    connectionId: string,
    type: WebSocketEventType,
    data?: unknown
  ): void {
    const event: WebSocketEvent = {
      type,
      connectionId,
      data,
      timestamp: Date.now(),
    };

    // Emit to connection-specific listeners
    const connection = this.connections.get(connectionId);
    if (connection) {
      const listeners = connection.listeners.get(type);
      if (listeners) {
        listeners.forEach((handler) => {
          try {
            handler(event);
          } catch (error) {
            console.error('[WebSocket] Event handler error', error);
          }
        });
      }
    }

    // Emit to global listeners
    const globalListeners = this.globalListeners.get(type);
    if (globalListeners) {
      globalListeners.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('[WebSocket] Global event handler error', error);
        }
      });
    }
  }

  /**
   * Get connection state
   */
  getState(connectionId: string): WebSocketState | undefined {
    return this.connections.get(connectionId)?.state;
  }

  /**
   * Get connection metrics
   */
  getMetrics(connectionId: string): ConnectionMetrics | undefined {
    return this.connections.get(connectionId)?.metrics;
  }

  /**
   * Get all connections
   */
  getAllConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Check if connection is active
   */
  isConnected(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    return connection?.state === WebSocketState.CONNECTED;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Clean up all connections
   */
  async cleanup(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map((connectionId) =>
      this.disconnect(connectionId)
    );

    await Promise.allSettled(promises);
    this.messageHandlers.clear();
    this.globalListeners.clear();
    console.log('[WebSocket] Cleanup complete');
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();
