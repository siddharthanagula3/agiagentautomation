/**
 * Folder Management Service
 * Handles CRUD operations for chat session folders
 */

import { supabase } from '@shared/lib/supabase-client';

export interface ChatFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  parentFolderId?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  sessionCount?: number; // Populated separately
}

interface DBChatFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  parent_folder_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

class FolderManagementService {
  /**
   * Get all folders for a user
   */
  async getUserFolders(userId: string): Promise<ChatFolder[]> {
    const { data, error } = await supabase
      .from('chat_folders')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[FolderService] Failed to load folders:', error);
      throw new Error(`Failed to load folders: ${error.message}`);
    }

    return (data || []).map(this.mapDBFolderToFolder);
  }

  /**
   * Get a specific folder by ID
   */
  async getFolder(folderId: string, userId?: string): Promise<ChatFolder | null> {
    let query = supabase
      .from('chat_folders')
      .select('*')
      .eq('id', folderId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('[FolderService] Failed to load folder:', error);
      return null;
    }

    if (!data) return null;

    return this.mapDBFolderToFolder(data);
  }

  /**
   * Create a new folder
   */
  async createFolder(
    userId: string,
    folderData: {
      name: string;
      color?: string;
      icon?: string;
      description?: string;
      parentFolderId?: string;
    }
  ): Promise<ChatFolder> {
    const { data, error } = await supabase
      .from('chat_folders')
      .insert({
        user_id: userId,
        name: folderData.name,
        color: folderData.color || 'gray',
        icon: folderData.icon || 'folder',
        description: folderData.description,
        parent_folder_id: folderData.parentFolderId,
        sort_order: 0, // New folders go to top by default
      })
      .select()
      .single();

    if (error) {
      console.error('[FolderService] Failed to create folder:', error);
      throw new Error(`Failed to create folder: ${error.message}`);
    }

    return this.mapDBFolderToFolder(data);
  }

  /**
   * Update folder properties
   */
  async updateFolder(
    folderId: string,
    updates: {
      name?: string;
      color?: string;
      icon?: string;
      description?: string;
      parentFolderId?: string;
      sortOrder?: number;
    },
    userId?: string
  ): Promise<void> {
    let query = supabase
      .from('chat_folders')
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.color && { color: updates.color }),
        ...(updates.icon && { icon: updates.icon }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.parentFolderId !== undefined && { parent_folder_id: updates.parentFolderId }),
        ...(updates.sortOrder !== undefined && { sort_order: updates.sortOrder }),
      })
      .eq('id', folderId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('[FolderService] Failed to update folder:', error);
      throw new Error(`Failed to update folder: ${error.message}`);
    }
  }

  /**
   * Delete a folder
   * Note: Sessions in the folder will be moved to root (folder_id = null)
   */
  async deleteFolder(folderId: string, userId?: string): Promise<void> {
    let query = supabase
      .from('chat_folders')
      .delete()
      .eq('id', folderId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      console.error('[FolderService] Failed to delete folder:', error);
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Move a session to a folder
   */
  async moveSessionToFolder(
    sessionId: string,
    folderId: string | null
  ): Promise<void> {
    const { error } = await supabase.rpc('move_session_to_folder', {
      p_session_id: sessionId,
      p_folder_id: folderId,
    });

    if (error) {
      console.error('[FolderService] Failed to move session:', error);
      throw new Error(`Failed to move session: ${error.message}`);
    }
  }

  /**
   * Get session count for a folder
   */
  async getFolderSessionCount(folderId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .eq('is_active', true);

    if (error) {
      console.error('[FolderService] Failed to count sessions:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get sessions in a folder
   */
  async getFolderSessions(folderId: string | null): Promise<string[]> {
    let query = supabase
      .from('chat_sessions')
      .select('id')
      .eq('is_active', true);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('[FolderService] Failed to load folder sessions:', error);
      return [];
    }

    return (data || []).map((s) => s.id);
  }

  /**
   * Reorder folders
   */
  async reorderFolders(
    folderOrders: Array<{ id: string; sortOrder: number }>,
    userId?: string
  ): Promise<void> {
    // Update each folder's sort order
    const updates = folderOrders.map(({ id, sortOrder }) => {
      let query = supabase
        .from('chat_folders')
        .update({ sort_order: sortOrder })
        .eq('id', id);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      return query;
    });

    const results = await Promise.all(updates);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('[FolderService] Failed to reorder folders:', errors);
      throw new Error('Failed to reorder some folders');
    }
  }

  /**
   * Get folder tree (nested structure)
   */
  async getFolderTree(userId: string): Promise<ChatFolder[]> {
    const allFolders = await this.getUserFolders(userId);

    // Build tree structure
    const folderMap = new Map<string, ChatFolder & { children: ChatFolder[] }>();
    const rootFolders: (ChatFolder & { children: ChatFolder[] })[] = [];

    // First pass: create map and add children property
    allFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build tree
    allFolders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parentFolderId) {
        const parent = folderMap.get(folder.parentFolderId);
        if (parent) {
          parent.children.push(folderWithChildren);
        } else {
          // Parent not found, treat as root
          rootFolders.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }

  /**
   * Map database folder to ChatFolder type
   */
  private mapDBFolderToFolder(dbFolder: DBChatFolder): ChatFolder {
    return {
      id: dbFolder.id,
      userId: dbFolder.user_id,
      name: dbFolder.name,
      color: dbFolder.color,
      icon: dbFolder.icon,
      description: dbFolder.description,
      parentFolderId: dbFolder.parent_folder_id,
      sortOrder: dbFolder.sort_order,
      createdAt: new Date(dbFolder.created_at),
      updatedAt: new Date(dbFolder.updated_at),
    };
  }
}

export const folderManagementService = new FolderManagementService();
