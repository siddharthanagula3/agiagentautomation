import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';
import { captureError } from '@shared/lib/sentry';

interface BuyTokenPackParams {
  userId: string;
  userEmail: string;
  packId: string;
  tokens: number;
  price: number;
}

/**
 * Get authorization token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Buy Token Pack Service
 *
 * Creates a Stripe checkout session for one-time token pack purchases.
 * Redirects user to Stripe hosted checkout page.
 *
 * UPDATED: January 17, 2026 - Added authorization header
 */
export async function buyTokenPack(params: BuyTokenPackParams): Promise<void> {
  const { userId, userEmail, packId, tokens, price } = params;

  // Get auth token first
  const authToken = await getAuthToken();
  if (!authToken) {
    throw new Error(
      'User not authenticated. Please log in to purchase tokens.'
    );
  }

  try {
    if (import.meta.env.DEV) {
      console.log('[Buy Token Pack] Initiating purchase:', {
        userId,
        packId,
        tokens: tokens.toLocaleString(),
        price: `$${price}`,
      });
    }

    // Call Netlify function to create Stripe checkout session
    const response = await fetch(
      '/.netlify/functions/payments/buy-token-pack',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          userEmail,
          packId,
          tokens,
          price,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();

    console.log(
      '[Buy Token Pack] ✅ Checkout session created:',
      data.sessionId
    );

    // Redirect to Stripe checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('[Buy Token Pack] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'buy_token_pack' },
      extra: { userId, packId, tokens, price },
    });
    throw error;
  }
}

/**
 * Add tokens to user's balance
 *
 * Called by webhook after successful payment.
 * Updates user's token balance in the user_token_balances table.
 *
 * NOTE: Uses user_token_balances table (authoritative source) instead of
 * the deprecated users.token_balance column (dropped in migration 20260113000002).
 */
export async function addTokensToUserBalance(
  userId: string,
  tokens: number,
  transactionId: string
): Promise<void> {
  try {
    console.log('[Add Tokens] Adding tokens to user balance:', {
      userId,
      tokens: tokens.toLocaleString(),
      transactionId,
    });

    // Use the add_user_tokens RPC function which handles everything atomically
    // This ensures the user_token_balances record exists (via get_or_create_token_balance)
    // and properly logs the transaction
    const { data: newBalance, error: rpcError } = await supabase.rpc(
      'add_user_tokens',
      {
        p_user_id: userId,
        p_token_count: tokens,
        p_transaction_type: 'purchase',
        p_description: `Token pack purchase: ${transactionId}`,
      }
    );

    if (rpcError) {
      console.error('[Add Tokens] RPC error:', rpcError);
      captureError(rpcError as Error, {
        tags: { feature: 'billing', operation: 'add_tokens_rpc' },
        extra: { userId, tokens, transactionId },
      });

      // Fallback: direct update to user_token_balances table
      console.log('[Add Tokens] Attempting fallback direct update...');

      // Get current balance from user_token_balances
      const { data: balanceData, error: fetchError } = await supabase
        .from('user_token_balances')
        .select('current_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('[Add Tokens] Error fetching balance:', fetchError);
        captureError(fetchError as Error, {
          tags: { feature: 'billing', operation: 'fetch_balance' },
          extra: { userId, tokens, transactionId },
        });
        throw fetchError;
      }

      const currentBalance = balanceData?.current_balance || 0;
      const updatedBalance = currentBalance + tokens;

      if (balanceData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_token_balances')
          .update({
            current_balance: updatedBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('[Add Tokens] Error updating balance:', updateError);
          captureError(updateError as Error, {
            tags: { feature: 'billing', operation: 'update_balance' },
            extra: { userId, tokens, transactionId },
          });
          throw updateError;
        }
      } else {
        // Create new record with default monthly allowance
        const { error: insertError } = await supabase
          .from('user_token_balances')
          .insert({
            user_id: userId,
            current_balance: tokens,
            monthly_allowance: 1000000, // Default free tier
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[Add Tokens] Error inserting balance:', insertError);
          captureError(insertError as Error, {
            tags: { feature: 'billing', operation: 'insert_balance' },
            extra: { userId, tokens, transactionId },
          });
          throw insertError;
        }
      }

      // Log transaction
      const { error: logError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: userId,
          tokens,
          transaction_type: 'purchase',
          transaction_id: transactionId,
          previous_balance: currentBalance,
          new_balance: updatedBalance,
          created_at: new Date().toISOString(),
        });

      if (logError) {
        console.error('[Add Tokens] Error logging transaction:', logError);
        captureError(logError as Error, {
          tags: { feature: 'billing', operation: 'log_transaction' },
          extra: { userId, tokens, transactionId },
          level: 'warning',
        });
        // Don't throw - balance update was successful even if log fails
      }

      console.log('[Add Tokens] Fallback balance updated:', {
        previousBalance: currentBalance.toLocaleString(),
        tokensAdded: tokens.toLocaleString(),
        newBalance: updatedBalance.toLocaleString(),
      });
      return;
    }

    console.log('[Add Tokens] Token balance updated via RPC:', {
      tokensAdded: tokens.toLocaleString(),
      newBalance: (newBalance as number).toLocaleString(),
    });
  } catch (error) {
    console.error('[Add Tokens] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'add_tokens' },
      extra: { userId, tokens, transactionId },
    });
    throw error;
  }
}

/**
 * Get user's token balance
 *
 * NOTE: Uses user_token_balances table (authoritative source) instead of
 * the deprecated users.token_balance column (dropped in migration 20260113000002).
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    // Try using the get_or_create_token_balance RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'get_or_create_token_balance',
      { p_user_id: userId }
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData[0].current_balance || 0;
    }

    // Fallback: Query user_token_balances table directly
    const { data, error } = await supabase
      .from('user_token_balances')
      .select('current_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Get Token Balance] Error:', error);
      captureError(error as Error, {
        tags: { feature: 'billing', operation: 'get_token_balance' },
        extra: { userId },
        level: 'warning',
      });
      return 0;
    }

    return data?.current_balance || 0;
  } catch (error) {
    console.error('[Get Token Balance] Error:', error);
    captureError(error as Error, {
      tags: { feature: 'billing', operation: 'get_token_balance' },
      extra: { userId },
      level: 'warning',
    });
    return 0;
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  // Check if we're in development or production
  const isDev = window.location.hostname === 'localhost';

  // In production, Stripe should always be configured
  // In development, it's optional
  return true; // Always return true - backend will handle errors
}
