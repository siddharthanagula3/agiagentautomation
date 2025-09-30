/**
 * File System Tools with MCP Integration
 * Provides file operations with conversation history and knowledge base access
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService } from '@/services/cache-service';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  created?: Date;
  modified?: Date;
  content?: string;
}

export interface ConversationContext {
  conversationId: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  metadata: Record<string, any>;
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  relevance?: number;
}

class FileSystemTools {
  private readonly fileSystemCache = new Map<string, FileInfo>();
  
  /**
   * Read file contents
   */
  async readFile(path: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.fileSystemCache.get(path);
      if (cached?.content) {
        return cached.content;
      }
      
      // Use browser File System Access API if available
      if ('showOpenFilePicker' in window) {
        // For security, we can't directly access files without user permission
        console.log('[FileSystem] File system access requires user permission');
        return null;
      }
      
      // Alternative: Load from project knowledge if path matches
      const knowledgeEntry = await this.searchKnowledgeBase(path);
      if (knowledgeEntry) {
        return knowledgeEntry.content;
      }
      
      return null;
    } catch (error) {
      console.error('[FileSystem] Error reading file:', error);
      return null;
    }
  }
  
  /**
   * Write file contents
   */
  async writeFile(path: string, content: string): Promise<boolean> {
    try {
      // In browser, we can only write to downloads or with user permission
      if ('showSaveFilePicker' in window) {
        // Request permission to save file
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: path.split('/').pop(),
        });
        
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        
        // Update cache
        this.fileSystemCache.set(path, {
          name: path.split('/').pop() || '',
          path,
          type: 'file',
          content,
          modified: new Date()
        });
        
        return true;
      }
      
      // Fallback: trigger download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file.txt';
      a.click();
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('[FileSystem] Error writing file:', error);
      return false;
    }
  }
  
  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    try {
      // In browser environment, we can't list arbitrary directories
      // Instead, return cached files or project structure
      const files: FileInfo[] = [];
      
      for (const [filePath, info] of this.fileSystemCache) {
        if (filePath.startsWith(path)) {
          files.push(info);
        }
      }
      
      return files;
    } catch (error) {
      console.error('[FileSystem] Error listing directory:', error);
      return [];
    }
  }
  
  /**
   * Search files by pattern
   */
  async searchFiles(pattern: string, path?: string): Promise<FileInfo[]> {
    try {
      const regex = new RegExp(pattern, 'i');
      const results: FileInfo[] = [];
      
      for (const [filePath, info] of this.fileSystemCache) {
        if ((!path || filePath.startsWith(path)) && regex.test(info.name)) {
          results.push(info);
        }
      }
      
      // Also search in knowledge base
      const knowledgeResults = await this.searchKnowledgeBase(pattern);
      if (knowledgeResults) {
        results.push({
          name: knowledgeResults.title,
          path: `/knowledge/${knowledgeResults.id}`,
          type: 'file',
          content: knowledgeResults.content
        });
      }
      
      return results;
    } catch (error) {
      console.error('[FileSystem] Error searching files:', error);
      return [];
    }
  }
  
  /**
   * Get file metadata
   */
  async getFileInfo(path: string): Promise<FileInfo | null> {
    try {
      const cached = this.fileSystemCache.get(path);
      if (cached) {
        return cached;
      }
      
      return null;
    } catch (error) {
      console.error('[FileSystem] Error getting file info:', error);
      return null;
    }
  }
  
  /**
   * Access conversation history
   */
  async getConversationHistory(
    userId: string,
    conversationId?: string,
    limit: number = 50
  ): Promise<ConversationContext[]> {
    try {
      let query = supabase
        .from('chat_sessions')
        .select(`
          id,
          title,
          employee_id,
          created_at,
          chat_messages (
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (conversationId) {
        query = query.eq('id', conversationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map((session: any) => ({
        conversationId: session.id,
        messages: (session.chat_messages || []).map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        })),
        metadata: {
          title: session.title,
          employeeId: session.employee_id,
          createdAt: new Date(session.created_at)
        }
      }));
    } catch (error) {
      console.error('[FileSystem] Error getting conversation history:', error);
      return [];
    }
  }
  
  /**
   * Search conversation history
   */
  async searchConversations(
    userId: string,
    searchQuery: string,
    limit: number = 10
  ): Promise<ConversationContext[]> {
    try {
      // Search in chat messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          role,
          content,
          created_at,
          chat_sessions (
            id,
            user_id,
            title,
            employee_id
          )
        `)
        .ilike('content', `%${searchQuery}%`)
        .eq('chat_sessions.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Group by conversation
      const conversationMap = new Map<string, ConversationContext>();
      
      (data || []).forEach((msg: any) => {
        const session = msg.chat_sessions;
        if (!session) return;
        
        const convId = session.id;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            conversationId: convId,
            messages: [],
            metadata: {
              title: session.title,
              employeeId: session.employee_id
            }
          });
        }
        
        conversationMap.get(convId)!.messages.push({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        });
      });
      
      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('[FileSystem] Error searching conversations:', error);
      return [];
    }
  }
  
  /**
   * Get conversation context for AI
   */
  async getConversationContextForAI(
    userId: string,
    conversationId: string,
    maxMessages: number = 20
  ): Promise<string> {
    try {
      const conversations = await this.getConversationHistory(userId, conversationId, 1);
      
      if (conversations.length === 0) {
        return '';
      }
      
      const conversation = conversations[0];
      const recentMessages = conversation.messages.slice(-maxMessages);
      
      const context = recentMessages
        .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      
      return `Previous conversation context:\n\n${context}`;
    } catch (error) {
      console.error('[FileSystem] Error getting conversation context:', error);
      return '';
    }
  }
  
  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(
    query: string,
    limit: number = 5
  ): Promise<KnowledgeBaseEntry | null> {
    try {
      const cacheKey = `knowledge:search:${query}`;
      const cached = await cacheService.get<KnowledgeBaseEntry>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Use project knowledge search if available
      // This would integrate with your project knowledge system
      
      // For now, return null as knowledge base needs to be set up
      return null;
    } catch (error) {
      console.error('[FileSystem] Error searching knowledge base:', error);
      return null;
    }
  }
  
  /**
   * Get related documents from knowledge base
   */
  async getRelatedDocuments(
    topic: string,
    limit: number = 5
  ): Promise<KnowledgeBaseEntry[]> {
    try {
      // Search for related content in knowledge base
      // This would use semantic search or keyword matching
      return [];
    } catch (error) {
      console.error('[FileSystem] Error getting related documents:', error);
      return [];
    }
  }
  
  /**
   * Export conversation to file
   */
  async exportConversation(
    userId: string,
    conversationId: string,
    format: 'txt' | 'json' | 'md' = 'md'
  ): Promise<void> {
    try {
      const conversations = await this.getConversationHistory(userId, conversationId, 1);
      
      if (conversations.length === 0) {
        console.error('[FileSystem] Conversation not found');
        return;
      }
      
      const conversation = conversations[0];
      let content = '';
      
      switch (format) {
        case 'txt':
          content = conversation.messages
            .map(msg => `[${msg.role}] ${msg.content}`)
            .join('\n\n');
          break;
          
        case 'json':
          content = JSON.stringify(conversation, null, 2);
          break;
          
        case 'md':
          content = `# ${conversation.metadata.title || 'Conversation'}\n\n`;
          content += `**Conversation ID:** ${conversation.conversationId}\n\n`;
          content += `---\n\n`;
          content += conversation.messages
            .map(msg => {
              const emoji = msg.role === 'user' ? '👤' : '🤖';
              return `## ${emoji} ${msg.role}\n\n${msg.content}\n\n---\n`;
            })
            .join('\n');
          break;
      }
      
      await this.writeFile(
        `conversation-${conversationId}.${format}`,
        content
      );
    } catch (error) {
      console.error('[FileSystem] Error exporting conversation:', error);
    }
  }
  
  /**
   * Create conversation summary
   */
  async createConversationSummary(
    userId: string,
    conversationId: string
  ): Promise<string> {
    try {
      const conversations = await this.getConversationHistory(userId, conversationId, 1);
      
      if (conversations.length === 0) {
        return 'No conversation found';
      }
      
      const conversation = conversations[0];
      const messageCount = conversation.messages.length;
      const userMessages = conversation.messages.filter(m => m.role === 'user').length;
      const assistantMessages = conversation.messages.filter(m => m.role === 'assistant').length;
      
      const summary = `
Conversation Summary:
- Total Messages: ${messageCount}
- User Messages: ${userMessages}
- Assistant Messages: ${assistantMessages}
- Started: ${conversation.messages[0]?.timestamp.toLocaleString() || 'Unknown'}
- Last Message: ${conversation.messages[messageCount - 1]?.timestamp.toLocaleString() || 'Unknown'}
      `.trim();
      
      return summary;
    } catch (error) {
      console.error('[FileSystem] Error creating summary:', error);
      return 'Error creating summary';
    }
  }
  
  /**
   * Clear file system cache
   */
  clearCache(): void {
    this.fileSystemCache.clear();
  }
}

// Export singleton instance
export const fileSystemTools = new FileSystemTools();

// Export MCP tool definitions
export const mcpFileSystemTools = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read'
        }
      },
      required: ['path']
    },
    handler: async (params: { path: string }) => {
      const content = await fileSystemTools.readFile(params.path);
      return { success: !!content, content };
    }
  },
  {
    name: 'search_conversations',
    description: 'Search through conversation history',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return',
          default: 10
        }
      },
      required: ['query']
    },
    handler: async (params: { query: string; limit?: number }, context: { userId: string }) => {
      const results = await fileSystemTools.searchConversations(
        context.userId,
        params.query,
        params.limit
      );
      return { success: true, results };
    }
  },
  {
    name: 'get_conversation_context',
    description: 'Get conversation context for AI reference',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'The conversation ID'
        },
        maxMessages: {
          type: 'number',
          description: 'Maximum messages to include',
          default: 20
        }
      },
      required: ['conversationId']
    },
    handler: async (
      params: { conversationId: string; maxMessages?: number },
      context: { userId: string }
    ) => {
      const contextText = await fileSystemTools.getConversationContextForAI(
        context.userId,
        params.conversationId,
        params.maxMessages
      );
      return { success: true, context: contextText };
    }
  },
  {
    name: 'search_knowledge_base',
    description: 'Search the knowledge base for relevant information',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
          default: 5
        }
      },
      required: ['query']
    },
    handler: async (params: { query: string; limit?: number }) => {
      const result = await fileSystemTools.searchKnowledgeBase(params.query, params.limit);
      return { success: !!result, result };
    }
  },
  {
    name: 'export_conversation',
    description: 'Export a conversation to a file',
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'The conversation ID to export'
        },
        format: {
          type: 'string',
          enum: ['txt', 'json', 'md'],
          description: 'Export format',
          default: 'md'
        }
      },
      required: ['conversationId']
    },
    handler: async (
      params: { conversationId: string; format?: 'txt' | 'json' | 'md' },
      context: { userId: string }
    ) => {
      await fileSystemTools.exportConversation(
        context.userId,
        params.conversationId,
        params.format
      );
      return { success: true, message: 'Conversation exported' };
    }
  }
];
