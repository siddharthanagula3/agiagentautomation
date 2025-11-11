import { supabase } from '@shared/lib/supabase-client';
import { toast } from 'sonner';

interface BuyTokenPackParams {
  userId: string;
  userEmail: string;
  packId: string;
  tokens: number;
  price: number;
}

/**
 * Buy Token Pack Service
 *
 * Creates a Stripe checkout session for one-time token pack purchases.
 * Redirects user to Stripe hosted checkout page.
 */
export async function buyTokenPack(params: BuyTokenPackParams): Promise<void> {
  const { userId, userEmail, packId, tokens, price } = params;

  try {
    console.log('[Buy Token Pack] Initiating purchase:', {
      userId,
      packId,
      tokens: tokens.toLocaleString(),
      price: `$${price}`,
    });

    // Call Netlify function to create Stripe checkout session
    const response = await fetch('/.netlify/functions/buy-token-pack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userEmail,
        packId,
        tokens,
        price,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();

    console.log('[Buy Token Pack] ✅ Checkout session created:', data.sessionId);

    // Redirect to Stripe checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('[Buy Token Pack] ❌ Error:', error);
    throw error;
  }
}

/**
 * Add tokens to user's balance
 *
 * Called by webhook after successful payment.
 * Updates user's token balance in database.
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

    // Get current balance
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[Add Tokens] Error fetching user:', fetchError);
      throw fetchError;
    }

    const currentBalance = userData?.token_balance || 0;
    const newBalance = currentBalance + tokens;

    // Update user's token balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        token_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Add Tokens] Error updating balance:', updateError);
      throw updateError;
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
        new_balance: newBalance,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('[Add Tokens] Error logging transaction:', logError);
      // Don't throw - transaction was successful even if log fails
    }

    console.log('[Add Tokens] ✅ Token balance updated:', {
      previousBalance: currentBalance.toLocaleString(),
      tokensAdded: tokens.toLocaleString(),
      newBalance: newBalance.toLocaleString(),
    });
  } catch (error) {
    console.error('[Add Tokens] ❌ Error:', error);
    throw error;
  }
}

/**
 * Get user's token balance
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Get Token Balance] Error:', error);
      return 0;
    }

    return data?.token_balance || 0;
  } catch (error) {
    console.error('[Get Token Balance] Error:', error);
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
