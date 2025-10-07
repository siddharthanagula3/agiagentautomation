/**
 * Chat Persistence Service
 * Handles chat state persistence, session management, and data recovery
 * Integrates with Supabase for data persistence
 */

import { createClient } from '@supabase/supabase-js';

export interface ChatSession {
  id: string;
  userId: string;
  employeeId: string;
  role: string;
  provider: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  contextData?: any;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId?: string;
  messages: Map<string, ChatMessage[]>;
  contextWindows: Map<string, any>;
  lastSync: Date;
}

export class ChatPersistenceService {
  private static instance: ChatPersistenceService;
  private supabase: any;
  private state: ChatState;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor() {
    this.state = {
      sessions: [],
      messages: new Map(),
      contextWindows: new Map(),
      lastSync: new Date()
    };

    this.initializeSupabase();
    this.setupEventListeners();
    this.startSyncInterval();
  }

  static getInstance(): ChatPersistenceService {
    if (!ChatPersistenceService.instance) {
      ChatPersistenceService.instance = new ChatPersistenceService();
    }
    return ChatPersistenceService.instance;
  }

  /**
   * Initialize Supabase client
   */
  private initializeSupabase(): void {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, using local storage only');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Setup event listeners for online/offline detection
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncToServer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveToLocalStorage();
    });

    // Load state on page load
    window.addEventListener('load', () => {
      this.loadFromLocalStorage();
    });
  }

  /**
   * Start periodic sync with server
   */
  private startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncToServer();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Create new chat session
   */
  async createSession(userId: string, employeeId: string, role: string, provider: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      employeeId,
      role,
      provider,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.state.sessions.push(session);
    this.state.activeSessionId = session.id;
    this.state.messages.set(session.id, []);

    // Save to server if online
    if (this.isOnline && this.supabase) {
      try {
        await this.supabase
          .from('chat_sessions')
          .insert({
            id: session.id,
            user_id: userId,
            employee_id: employeeId,
            role,
            provider,
            title: session.title,
            created_at: session.createdAt.toISOString(),
            updated_at: session.updatedAt.toISOString(),
            is_active: session.isActive
          });
      } catch (error) {
        console.error('Failed to save session to server:', error);
        // Continue with local storage
      }
    }

    this.saveToLocalStorage();
    return session;
  }

  /**
   * Add message to session
   */
  async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system' | 'tool', content: string, metadata?: any): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role,
      content,
      timestamp: new Date(),
      metadata
    };

    const messages = this.state.messages.get(sessionId) || [];
    messages.push(message);
    this.state.messages.set(sessionId, messages);

    // Update session timestamp
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (session) {
      session.updatedAt = new Date();
    }

    // Save to server if online
    if (this.isOnline && this.supabase) {
      try {
        await this.supabase
          .from('chat_messages')
          .insert({
            id: message.id,
            session_id: sessionId,
            role: message.role,
            content: message.content,
            created_at: message.timestamp.toISOString(),
            metadata: message.metadata
          });
      } catch (error) {
        console.error('Failed to save message to server:', error);
        // Continue with local storage
      }
    }

    this.saveToLocalStorage();
    return message;
  }

  /**
   * Get messages for session
   */
  getMessages(sessionId: string): ChatMessage[] {
    return this.state.messages.get(sessionId) || [];
  }

  /**
   * Get all sessions for user
   */
  getSessions(userId: string): ChatSession[] {
    return this.state.sessions.filter(s => s.userId === userId);
  }

  /**
   * Get active session
   */
  getActiveSession(): ChatSession | undefined {
    return this.state.sessions.find(s => s.id === this.state.activeSessionId);
  }

  /**
   * Set active session
   */
  setActiveSession(sessionId: string): void {
    this.state.activeSessionId = sessionId;
    this.saveToLocalStorage();
  }

  /**
   * Update session title
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date();

      if (this.isOnline && this.supabase) {
        try {
          await this.supabase
            .from('chat_sessions')
            .update({ title, updated_at: session.updatedAt.toISOString() })
            .eq('id', sessionId);
        } catch (error) {
          console.error('Failed to update session title:', error);
        }
      }

      this.saveToLocalStorage();
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.state.sessions = this.state.sessions.filter(s => s.id !== sessionId);
    this.state.messages.delete(sessionId);
    this.state.contextWindows.delete(sessionId);

    if (this.state.activeSessionId === sessionId) {
      this.state.activeSessionId = this.state.sessions[0]?.id;
    }

    if (this.isOnline && this.supabase) {
      try {
        await this.supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionId);
        
        await this.supabase
          .from('chat_messages')
          .delete()
          .eq('session_id', sessionId);
      } catch (error) {
        console.error('Failed to delete session from server:', error);
      }
    }

    this.saveToLocalStorage();
  }

  /**
   * Save context data for session
   */
  saveContextData(sessionId: string, contextData: any): void {
    this.state.contextWindows.set(sessionId, contextData);
    this.saveToLocalStorage();
  }

  /**
   * Get context data for session
   */
  getContextData(sessionId: string): any {
    return this.state.contextWindows.get(sessionId);
  }

  /**
   * Sync to server
   */
  private async syncToServer(): Promise<void> {
    if (!this.isOnline || !this.supabase) return;

    try {
      // Sync sessions
      for (const session of this.state.sessions) {
        const { error } = await this.supabase
          .from('chat_sessions')
          .upsert({
            id: session.id,
            user_id: session.userId,
            employee_id: session.employeeId,
            role: session.role,
            provider: session.provider,
            title: session.title,
            created_at: session.createdAt.toISOString(),
            updated_at: session.updatedAt.toISOString(),
            is_active: session.isActive
          });

        if (error) {
          console.error('Failed to sync session:', error);
        }
      }

      // Sync messages
      for (const [sessionId, messages] of this.state.messages) {
        for (const message of messages) {
          const { error } = await this.supabase
            .from('chat_messages')
            .upsert({
              id: message.id,
              session_id: message.sessionId,
              role: message.role,
              content: message.content,
              created_at: message.timestamp.toISOString(),
              metadata: message.metadata
            });

          if (error) {
            console.error('Failed to sync message:', error);
          }
        }
      }

      this.state.lastSync = new Date();
    } catch (error) {
      console.error('Failed to sync to server:', error);
    }
  }

  /**
   * Load from server
   */
  async loadFromServer(userId: string): Promise<void> {
    if (!this.isOnline || !this.supabase) return;

    try {
      // Load sessions
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (sessionsError) {
        console.error('Failed to load sessions:', sessionsError);
        return;
      }

      this.state.sessions = sessions.map(s => ({
        id: s.id,
        userId: s.user_id,
        employeeId: s.employee_id,
        role: s.role,
        provider: s.provider,
        title: s.title,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
        isActive: s.is_active
      }));

      // Load messages for each session
      for (const session of this.state.sessions) {
        const { data: messages, error: messagesError } = await this.supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Failed to load messages:', messagesError);
          continue;
        }

        this.state.messages.set(session.id, messages.map(m => ({
          id: m.id,
          sessionId: m.session_id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
          metadata: m.metadata
        })));
      }

      this.state.lastSync = new Date();
    } catch (error) {
      console.error('Failed to load from server:', error);
    }
  }

  /**
   * Save to local storage
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        sessions: this.state.sessions,
        activeSessionId: this.state.activeSessionId,
        messages: Array.from(this.state.messages.entries()),
        contextWindows: Array.from(this.state.contextWindows.entries()),
        lastSync: this.state.lastSync
      };
      localStorage.setItem('chat-persistence-state', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }

  /**
   * Load from local storage
   */
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('chat-persistence-state');
      if (data) {
        const parsed = JSON.parse(data);
        this.state.sessions = parsed.sessions || [];
        this.state.activeSessionId = parsed.activeSessionId;
        this.state.messages = new Map(parsed.messages || []);
        this.state.contextWindows = new Map(parsed.contextWindows || []);
        this.state.lastSync = new Date(parsed.lastSync || Date.now());
      }
    } catch (error) {
      console.error('Failed to load from local storage:', error);
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.state.sessions = [];
    this.state.messages.clear();
    this.state.contextWindows.clear();
    this.state.activeSessionId = undefined;
    this.state.lastSync = new Date();
    
    localStorage.removeItem('chat-persistence-state');
  }

  /**
   * Get state statistics
   */
  getStateStats(): {
    totalSessions: number;
    totalMessages: number;
    lastSync: Date;
    isOnline: boolean;
  } {
    return {
      totalSessions: this.state.sessions.length,
      totalMessages: Array.from(this.state.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
      lastSync: this.state.lastSync,
      isOnline: this.isOnline
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const chatPersistenceService = ChatPersistenceService.getInstance();
