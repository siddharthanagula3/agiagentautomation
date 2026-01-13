/**
 * Message Bookmarks Service
 * Handles CRUD operations for bookmarking chat messages
 */

import { supabase } from '@shared/lib/supabase-client';

export interface MessageBookmark {
  id: string;
  userId: string;
  sessionId: string;
  messageId: string;
  note?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkedMessage extends MessageBookmark {
  messageRole: 'user' | 'assistant' | 'system';
  messageContent: string;
  messageCreatedAt: Date;
  sessionTitle: string;
  sessionCreatedAt: Date;
}

interface DBBookmark {
  id: string;
  user_id: string;
  session_id: string;
  message_id: string;
  note?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface DBBookmarkedMessage extends DBBookmark {
  message_role: string;
  message_content: string;
  message_created_at: string;
  session_title: string;
  session_created_at: string;
}

interface BookmarkWithTags {
  tags: string[] | null;
}

class MessageBookmarksService {
  /**
   * Check if a message is bookmarked
   */
  async isBookmarked(userId: string, messageId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('message_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .maybeSingle();

    if (error) {
      console.error('[Bookmarks] Failed to check bookmark:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Add a bookmark
   */
  async addBookmark(
    userId: string,
    sessionId: string,
    messageId: string,
    options?: { note?: string; tags?: string[] }
  ): Promise<MessageBookmark> {
    const { data, error } = await supabase
      .from('message_bookmarks')
      .insert({
        user_id: userId,
        session_id: sessionId,
        message_id: messageId,
        note: options?.note,
        tags: options?.tags || [],
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Bookmarks] Failed to add bookmark:', error);
      throw new Error(`Failed to add bookmark: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to add bookmark: No data returned');
    }

    return this.mapDBBookmarkToBookmark(data);
  }

  /**
   * Remove a bookmark
   */
  async removeBookmark(userId: string, messageId: string): Promise<void> {
    const { error } = await supabase
      .from('message_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('message_id', messageId);

    if (error) {
      console.error('[Bookmarks] Failed to remove bookmark:', error);
      throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
  }

  /**
   * Update bookmark note/tags
   */
  async updateBookmark(
    userId: string,
    messageId: string,
    updates: { note?: string; tags?: string[] }
  ): Promise<void> {
    const { error } = await supabase
      .from('message_bookmarks')
      .update({
        ...(updates.note !== undefined && { note: updates.note }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
      })
      .eq('user_id', userId)
      .eq('message_id', messageId);

    if (error) {
      console.error('[Bookmarks] Failed to update bookmark:', error);
      throw new Error(`Failed to update bookmark: ${error.message}`);
    }
  }

  /**
   * Get all bookmarks for a user
   */
  async getUserBookmarks(userId: string): Promise<BookmarkedMessage[]> {
    const { data, error } = await supabase
      .from('bookmarked_messages')
      .select('*')
      .eq('user_id', userId)
      .order('bookmarked_at', { ascending: false });

    if (error) {
      console.error('[Bookmarks] Failed to get bookmarks:', error);
      throw new Error(`Failed to get bookmarks: ${error.message}`);
    }

    return (data || []).map(this.mapDBBookmarkedMessageToBookmarkedMessage);
  }

  /**
   * Get bookmarks for a specific session
   */
  async getSessionBookmarks(
    userId: string,
    sessionId: string
  ): Promise<BookmarkedMessage[]> {
    const { data, error } = await supabase
      .from('bookmarked_messages')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('message_created_at', { ascending: true });

    if (error) {
      console.error('[Bookmarks] Failed to get session bookmarks:', error);
      throw new Error(`Failed to get session bookmarks: ${error.message}`);
    }

    return (data || []).map(this.mapDBBookmarkedMessageToBookmarkedMessage);
  }

  /**
   * Search bookmarks by content or note
   */
  async searchBookmarks(
    userId: string,
    query: string
  ): Promise<BookmarkedMessage[]> {
    const { data, error } = await supabase
      .from('bookmarked_messages')
      .select('*')
      .eq('user_id', userId)
      .or(`message_content.ilike.%${query}%,bookmark_note.ilike.%${query}%`)
      .order('bookmarked_at', { ascending: false });

    if (error) {
      console.error('[Bookmarks] Failed to search bookmarks:', error);
      throw new Error(`Failed to search bookmarks: ${error.message}`);
    }

    return (data || []).map(this.mapDBBookmarkedMessageToBookmarkedMessage);
  }

  /**
   * Get bookmark count for user
   */
  async getBookmarkCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('message_bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('[Bookmarks] Failed to count bookmarks:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get bookmarks by tag
   */
  async getBookmarksByTag(
    userId: string,
    tag: string
  ): Promise<BookmarkedMessage[]> {
    const { data, error } = await supabase
      .from('bookmarked_messages')
      .select('*')
      .eq('user_id', userId)
      .contains('bookmark_tags', [tag])
      .order('bookmarked_at', { ascending: false });

    if (error) {
      console.error('[Bookmarks] Failed to get bookmarks by tag:', error);
      throw new Error(`Failed to get bookmarks by tag: ${error.message}`);
    }

    return (data || []).map(this.mapDBBookmarkedMessageToBookmarkedMessage);
  }

  /**
   * Get all unique tags for user's bookmarks
   */
  async getUserBookmarkTags(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('message_bookmarks')
      .select('tags')
      .eq('user_id', userId);

    if (error) {
      console.error('[Bookmarks] Failed to get tags:', error);
      return [];
    }

    const allTags = new Set<string>();
    ((data || []) as BookmarkWithTags[]).forEach((bookmark) => {
      if (bookmark.tags && Array.isArray(bookmark.tags)) {
        bookmark.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return Array.from(allTags).sort();
  }

  /**
   * Map database bookmark to MessageBookmark
   */
  private mapDBBookmarkToBookmark(dbBookmark: DBBookmark): MessageBookmark {
    return {
      id: dbBookmark.id,
      userId: dbBookmark.user_id,
      sessionId: dbBookmark.session_id,
      messageId: dbBookmark.message_id,
      note: dbBookmark.note,
      tags: dbBookmark.tags || [],
      createdAt: new Date(dbBookmark.created_at),
      updatedAt: new Date(dbBookmark.updated_at),
    };
  }

  /**
   * Map database bookmarked message to BookmarkedMessage
   */
  private mapDBBookmarkedMessageToBookmarkedMessage(
    dbBookmarked: DBBookmarkedMessage
  ): BookmarkedMessage {
    return {
      id: dbBookmarked.id,
      userId: dbBookmarked.user_id,
      sessionId: dbBookmarked.session_id,
      messageId: dbBookmarked.message_id,
      note: dbBookmarked.note,
      tags: dbBookmarked.tags || [],
      createdAt: new Date(dbBookmarked.created_at),
      updatedAt: new Date(dbBookmarked.updated_at),
      messageRole: dbBookmarked.message_role as 'user' | 'assistant' | 'system',
      messageContent: dbBookmarked.message_content,
      messageCreatedAt: new Date(dbBookmarked.message_created_at),
      sessionTitle: dbBookmarked.session_title,
      sessionCreatedAt: new Date(dbBookmarked.session_created_at),
    };
  }
}

export const messageBookmarksService = new MessageBookmarksService();
