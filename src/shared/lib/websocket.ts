/**
 * WebSocket client for real-time communication
 * Handles connection management, reconnection, and message queuing
 */

import { apiClient } from './api';

// ========================================
// Types and Interfaces
// ========================================

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
  messageTimeout: number;
  queueMaxSize: number;
}

export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

// ========================================
// WebSocket Client Class
// ========================================

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private handlers: WebSocketEventHandlers = {};
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private pendingMessages = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(config: Partial<WebSocketConfig> & { url: string }) {
    this.config = {
      protocols: undefined,
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      heartbeatInterval: 30000,
      messageTimeout: 10000,
      queueMaxSize: 100,
      ...config,
    };
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status === 'connected' || this.status === 'connecting') {
        resolve();
        return;
      }

      this.setStatus('connecting');

      try {
        // SECURITY: createWebSocket now returns { ws, sendAuth } to avoid
        // passing tokens in URL query parameters (prevents credential exposure
        // in server logs, browser history, and Referer headers)
        const { ws, sendAuth } = apiClient.createWebSocket(
          this.config.url,
          this.config.protocols
        );
        this.ws = ws;

        this.ws.onopen = () => {
          // Send auth token as first message after connection opens
          sendAuth();
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.handlers.onOpen?.();
          resolve();
        };

        this.ws.onclose = (event) => {
          this.cleanup();
          this.handlers.onClose?.(event);

          if (event.code !== 1000 && this.shouldReconnect()) {
            this.scheduleReconnect();
          } else {
            this.setStatus('disconnected');
          }
        };

        this.ws.onerror = (error) => {
          this.handlers.onError?.(error);
          if (this.status === 'connecting') {
            reject(new Error('WebSocket connection failed'));
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.setStatus('failed');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }

    this.cleanup();
    this.setStatus('disconnected');
  }

  // Message handling
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle response to pending message
      if (message.type === 'response' && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        pending.resolve(message.payload);
        return;
      }

      // Handle error response
      if (message.type === 'error' && this.pendingMessages.has(message.id)) {
        const pending = this.pendingMessages.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(message.id);
        pending.reject(new Error(message.payload.message || 'WebSocket error'));
        return;
      }

      // Handle heartbeat
      if (message.type === 'ping') {
        this.send({
          id: crypto.randomUUID(),
          type: 'pong',
          payload: {},
          timestamp: Date.now(),
        });
        return;
      }

      // Handle regular message
      this.handlers.onMessage?.(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Send message
  send(message: Partial<WebSocketMessage>): void {
    const fullMessage: WebSocketMessage = {
      id: crypto.randomUUID(),
      type: 'message',
      payload: {},
      timestamp: Date.now(),
      ...message,
    };

    if (this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      this.queueMessage(fullMessage);
    }
  }

  // Send message and wait for response
  sendAndWaitForResponse<T = unknown>(
    message: Partial<WebSocketMessage>,
    timeout = this.config.messageTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const messageId = crypto.randomUUID();
      const fullMessage: WebSocketMessage = {
        id: messageId,
        type: 'request',
        payload: {},
        timestamp: Date.now(),
        ...message,
      };

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error('Message timeout'));
      }, timeout);

      // Store pending message
      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      if (
        this.status === 'connected' &&
        this.ws?.readyState === WebSocket.OPEN
      ) {
        this.ws.send(JSON.stringify(fullMessage));
      } else {
        this.queueMessage(fullMessage);
      }
    });
  }

  // Message queue management
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.queueMaxSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(message);
  }

  private flushMessageQueue(): void {
    while (
      this.messageQueue.length > 0 &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }

  // Reconnection logic
  private shouldReconnect(): boolean {
    return this.reconnectAttempts < this.config.reconnectAttempts;
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        if (this.shouldReconnect()) {
          this.scheduleReconnect();
        } else {
          this.setStatus('failed');
        }
      });
    }, delay);
  }

  // Heartbeat
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          payload: { timestamp: Date.now() },
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Status management
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.handlers.onStatusChange?.(status);
    }
  }

  // Cleanup
  private cleanup(): void {
    this.stopHeartbeat();

    // Reject all pending messages
    this.pendingMessages.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingMessages.clear();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws = null;
    }
  }

  // Event handlers
  on(event: keyof WebSocketEventHandlers, handler: unknown): void {
    this.handlers[event] = handler;
  }

  off(event: keyof WebSocketEventHandlers): void {
    delete this.handlers[event];
  }

  // Getters
  getStatus(): WebSocketStatus {
    return this.status;
  }

  isConnected(): boolean {
    return (
      this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN
    );
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  getPendingMessageCount(): number {
    return this.pendingMessages.size;
  }
}

// ========================================
// WebSocket Manager
// ========================================

export class WebSocketManager {
  private connections = new Map<string, WebSocketClient>();

  createConnection(
    name: string,
    config: Partial<WebSocketConfig> & { url: string }
  ): WebSocketClient {
    if (this.connections.has(name)) {
      this.connections.get(name)!.disconnect();
    }

    const client = new WebSocketClient(config);
    this.connections.set(name, client);
    return client;
  }

  getConnection(name: string): WebSocketClient | undefined {
    return this.connections.get(name);
  }

  disconnectAll(): void {
    this.connections.forEach((client) => client.disconnect());
    this.connections.clear();
  }

  getConnectionStatus(): Record<string, WebSocketStatus> {
    const status: Record<string, WebSocketStatus> = {};
    this.connections.forEach((client, name) => {
      status[name] = client.getStatus();
    });
    return status;
  }
}

// ========================================
// Default WebSocket Manager
// ========================================

export const websocketManager = new WebSocketManager();

// ========================================
// Predefined Connection Factories
// ========================================

export const createChatWebSocket = () => {
  return websocketManager.createConnection('chat', {
    url: '/ws/chat',
    heartbeatInterval: 15000,
  });
};

export const createWorkforceWebSocket = () => {
  return websocketManager.createConnection('workforce', {
    url: '/ws/workforce',
    heartbeatInterval: 10000,
  });
};

export const createNotificationWebSocket = () => {
  return websocketManager.createConnection('notifications', {
    url: '/ws/notifications',
    heartbeatInterval: 30000,
  });
};

// ========================================
// React Hook for WebSocket
// ========================================

import { useEffect, useRef, useState } from 'react';

export interface UseWebSocketOptions extends Partial<WebSocketConfig> {
  url: string;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
}

export const useWebSocket = ({
  enabled = true,
  ...options
}: UseWebSocketOptions) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!enabled) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      return;
    }

    const client = new WebSocketClient(options);
    clientRef.current = client;

    client.on('onStatusChange', (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
      options.onStatusChange?.(newStatus);
    });

    client.on('onMessage', (message: WebSocketMessage) => {
      setLastMessage(message);
      options.onMessage?.(message);
    });

    client.connect().catch((error) => {
      console.error('WebSocket connection failed:', error);
    });

    return () => {
      client.disconnect();
    };
  }, [enabled, options.url, options]);

  const sendMessage = (message: Partial<WebSocketMessage>) => {
    clientRef.current?.send(message);
  };

  const sendAndWaitForResponse = <T = unknown>(
    message: Partial<WebSocketMessage>,
    timeout?: number
  ): Promise<T> => {
    if (!clientRef.current) {
      return Promise.reject(new Error('WebSocket not connected'));
    }
    return clientRef.current.sendAndWaitForResponse<T>(message, timeout);
  };

  return {
    status,
    lastMessage,
    sendMessage,
    sendAndWaitForResponse,
    isConnected: status === 'connected',
    client: clientRef.current,
  };
};

export default WebSocketClient;
