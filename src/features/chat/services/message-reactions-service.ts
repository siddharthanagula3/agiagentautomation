/**
 * Message Reactions Service
 * Handles CRUD operations for message reactions (emoji reactions on chat messages)
 */

import { supabase } from '@shared/lib/supabase-client';
import { logger } from '@shared/lib/logger';

/**
 * Standard emoji set for reactions
 */
export const REACTION_EMOJIS = [
  { emoji: '\u{1F44D}', label: 'Thumbs up' },
  { emoji: '\u{1F44E}', label: 'Thumbs down' },
  { emoji: '\u{2764}\u{FE0F}', label: 'Heart' },
  { emoji: '\u{1F604}', label: 'Smile' },
  { emoji: '\u{1F622}', label: 'Sad' },
  { emoji: '\u{1F389}', label: 'Celebrate' },
  { emoji: '\u{1F525}', label: 'Fire' },
  { emoji: '\u{1F440}', label: 'Eyes' },
] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number]['emoji'];

/**
 * Single reaction record from the database
 */
export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

/**
 * Aggregated reaction data for a message
 */
export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
  userReacted: boolean;
}

/**
 * All reactions for a message grouped by emoji
 */
export interface MessageReactionsSummary {
  messageId: string;
  reactions: ReactionSummary[];
}

/**
 * Database row types
 */
interface DBReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface DBAggregatedReaction {
  message_id: string;
  emoji: string;
  count: number;
  user_ids: string[];
  user_reacted: boolean;
}

class MessageReactionsService {
  /**
   * Add a reaction to a message
   */
  async addReaction(
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<MessageReaction> {
    const { data, error } = await supabase
      .from('message_reactions')
      .insert({
        user_id: userId,
        message_id: messageId,
        emoji,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate reaction gracefully
      if (error.code === '23505') {
        logger.debug('[Reactions] Reaction already exists', { messageId, emoji });
        throw new Error('You have already added this reaction');
      }
      logger.error('[Reactions] Failed to add reaction:', error);
      throw new Error(`Failed to add reaction: ${error.message}`);
    }

    return this.mapDBReactionToReaction(data);
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('emoji', emoji);

    if (error) {
      logger.error('[Reactions] Failed to remove reaction:', error);
      throw new Error(`Failed to remove reaction: ${error.message}`);
    }
  }

  /**
   * Toggle a reaction on a message (add if not exists, remove if exists)
   * Returns true if reaction was added, false if removed
   */
  async toggleReaction(
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<{ added: boolean; reaction?: MessageReaction }> {
    // Check if reaction exists
    const { data: existing } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (existing) {
      // Remove existing reaction
      await this.removeReaction(userId, messageId, emoji);
      return { added: false };
    } else {
      // Add new reaction
      const reaction = await this.addReaction(userId, messageId, emoji);
      return { added: true, reaction };
    }
  }

  /**
   * Get all reactions for a single message
   */
  async getReactions(messageId: string): Promise<ReactionSummary[]> {
    const { data, error } = await supabase.rpc('get_message_reactions', {
      message_ids: [messageId],
    });

    if (error) {
      logger.error('[Reactions] Failed to get reactions:', error);
      throw new Error(`Failed to get reactions: ${error.message}`);
    }

    return (data || [])
      .filter((r: DBAggregatedReaction) => r.message_id === messageId)
      .map((r: DBAggregatedReaction) => ({
        emoji: r.emoji,
        count: r.count,
        userIds: r.user_ids || [],
        userReacted: r.user_reacted || false,
      }));
  }

  /**
   * Get reactions for multiple messages (batch query for performance)
   */
  async getReactionsForMessages(
    messageIds: string[]
  ): Promise<Map<string, ReactionSummary[]>> {
    if (messageIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase.rpc('get_message_reactions', {
      message_ids: messageIds,
    });

    if (error) {
      logger.error('[Reactions] Failed to get reactions for messages:', error);
      throw new Error(`Failed to get reactions: ${error.message}`);
    }

    // Group reactions by message_id
    const reactionsMap = new Map<string, ReactionSummary[]>();

    for (const row of data || []) {
      const r = row as DBAggregatedReaction;
      const existing = reactionsMap.get(r.message_id) || [];
      existing.push({
        emoji: r.emoji,
        count: r.count,
        userIds: r.user_ids || [],
        userReacted: r.user_reacted || false,
      });
      reactionsMap.set(r.message_id, existing);
    }

    return reactionsMap;
  }

  /**
   * Check if user has reacted to a message with a specific emoji
   */
  async hasUserReacted(
    userId: string,
    messageId: string,
    emoji: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (error) {
      logger.error('[Reactions] Failed to check user reaction:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Get all user's reactions for a message
   */
  async getUserReactionsForMessage(
    userId: string,
    messageId: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('message_reactions')
      .select('emoji')
      .eq('user_id', userId)
      .eq('message_id', messageId);

    if (error) {
      logger.error('[Reactions] Failed to get user reactions:', error);
      return [];
    }

    return (data || []).map((r) => r.emoji);
  }

  /**
   * Remove all reactions from a message (admin function)
   */
  async clearMessageReactions(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId);

    if (error) {
      logger.error('[Reactions] Failed to clear reactions:', error);
      throw new Error(`Failed to clear reactions: ${error.message}`);
    }
  }

  /**
   * Get reaction count for a message
   */
  async getReactionCount(messageId: string): Promise<number> {
    const { count, error } = await supabase
      .from('message_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('message_id', messageId);

    if (error) {
      logger.error('[Reactions] Failed to count reactions:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Map database reaction row to MessageReaction interface
   */
  private mapDBReactionToReaction(dbReaction: DBReaction): MessageReaction {
    return {
      id: dbReaction.id,
      messageId: dbReaction.message_id,
      userId: dbReaction.user_id,
      emoji: dbReaction.emoji,
      createdAt: new Date(dbReaction.created_at),
    };
  }
}

export const messageReactionsService = new MessageReactionsService();
