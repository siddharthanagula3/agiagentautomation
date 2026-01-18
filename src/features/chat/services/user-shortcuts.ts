import { supabase } from '@shared/lib/supabase-client';
import type { PromptShortcut } from '../components/PromptShortcuts';

export interface UserShortcut extends PromptShortcut {
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Shortcuts Service
 *
 * Allows users to create custom prompt shortcuts that persist in the database.
 * Integrated with the PromptShortcuts component.
 */

/**
 * Get all shortcuts for a user (combines default + custom)
 */
export async function getUserShortcuts(
  userId: string
): Promise<PromptShortcut[]> {
  try {
    const { data, error } = await supabase
      .from('user_shortcuts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[User Shortcuts] Error fetching shortcuts:', error);
      return [];
    }

    // Convert database format to PromptShortcut format
    return (
      data?.map((shortcut) => ({
        id: shortcut.id,
        label: shortcut.label,
        icon: () => null, // Custom shortcuts don't have icons
        prompt: shortcut.prompt,
        category: shortcut.category as
          | 'coding'
          | 'writing'
          | 'business'
          | 'analysis'
          | 'creative',
      })) || []
    );
  } catch (error) {
    console.error('[User Shortcuts] Error:', error);
    return [];
  }
}

/**
 * Create a new custom shortcut
 */
export async function createUserShortcut(
  userId: string,
  shortcut: {
    label: string;
    prompt: string;
    category: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  }
): Promise<PromptShortcut | null> {
  try {
    const { data, error } = await supabase
      .from('user_shortcuts')
      .insert({
        user_id: userId,
        label: shortcut.label,
        prompt: shortcut.prompt,
        category: shortcut.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[User Shortcuts] Error creating shortcut:', error);
      return null;
    }

    if (!data) {
      console.error(
        '[User Shortcuts] No data returned after creating shortcut'
      );
      return null;
    }

    return {
      id: data.id,
      label: data.label,
      icon: () => null,
      prompt: data.prompt,
      category: data.category,
    };
  } catch (error) {
    console.error('[User Shortcuts] Error:', error);
    return null;
  }
}

/**
 * Update an existing custom shortcut
 * SECURITY: Must verify user owns the shortcut
 */
export async function updateUserShortcut(
  userId: string,
  shortcutId: string,
  updates: {
    label?: string;
    prompt?: string;
    category?: 'coding' | 'writing' | 'business' | 'analysis' | 'creative';
  }
): Promise<boolean> {
  try {
    // SECURITY: Add user_id check to prevent unauthorized updates
    const { error } = await supabase
      .from('user_shortcuts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shortcutId)
      .eq('user_id', userId); // Only update if user owns the shortcut

    if (error) {
      console.error('[User Shortcuts] Error updating shortcut:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[User Shortcuts] Error:', error);
    return false;
  }
}

/**
 * Delete a custom shortcut
 * SECURITY: Must verify user owns the shortcut
 */
export async function deleteUserShortcut(
  userId: string,
  shortcutId: string
): Promise<boolean> {
  try {
    // SECURITY: Add user_id check to prevent unauthorized deletion
    const { error } = await supabase
      .from('user_shortcuts')
      .delete()
      .eq('id', shortcutId)
      .eq('user_id', userId); // Only delete if user owns the shortcut

    if (error) {
      console.error('[User Shortcuts] Error deleting shortcut:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[User Shortcuts] Error:', error);
    return false;
  }
}
