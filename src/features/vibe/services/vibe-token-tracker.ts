/**
 * Vibe Token Tracker
 * Syncs token usage from tokenLogger to vibe_sessions table
 *
 * Created: Nov 18th 2025
 */

import { supabase } from '@shared/lib/supabase-client';
import { tokenLogger } from '@core/integrations/token-usage-tracker';

/**
 * Update vibe session with token usage
 * Uses the RPC function to increment token counters
 */
export async function updateVibeSessionTokens(
  sessionId: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_vibe_session_tokens', {
      p_session_id: sessionId,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost: cost,
    });

    if (error) {
      console.error(
        '[VibeTokenTracker] Failed to update session tokens:',
        error
      );
      throw error;
    }

    console.log(
      `[VibeTokenTracker] Updated session ${sessionId}: +${inputTokens} input, +${outputTokens} output, +$${cost.toFixed(6)} cost`
    );
  } catch (error) {
    console.error('[VibeTokenTracker] Error updating session tokens:', error);
    // Don't throw - this is a non-critical tracking operation
  }
}

/**
 * Get token usage summary for a session from tokenLogger
 */
export function getSessionTokenUsage(sessionId: string) {
  return tokenLogger.getRealtimeUsage(sessionId);
}

/**
 * Get session summary from tokenLogger
 */
export function getSessionSummary(sessionId: string) {
  return tokenLogger.getSessionSummary(sessionId);
}

/**
 * Clear session cache in tokenLogger
 */
export function clearSessionCache(sessionId: string) {
  tokenLogger.clearSessionCache(sessionId);
}
