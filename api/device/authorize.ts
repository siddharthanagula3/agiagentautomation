/**
 * Device Authorization API
 *
 * Handles the desktop app's OAuth device flow.
 * Desktop app → generate device_code + user_code → display QR
 * User opens https://agiworkforce.com/device-auth?user_code=XXXX
 * User approves → this endpoint marks the code as authorized
 * Desktop polls consume_device_authorization_tokens(device_code) for the session token
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase not configured');
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // POST: Approve device authorization
  if (req.method === 'POST') {
    const { user_code, access_token } = req.body || {};

    if (!user_code || !access_token) {
      res.status(400).json({ error: 'user_code and access_token are required' });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();

      // Verify the user's JWT
      const { data: { user }, error: authError } = await supabase.auth.getUser(access_token);
      if (authError || !user) {
        res.status(401).json({ error: 'Invalid or expired access token' });
        return;
      }

      // Find the device code matching this user code
      const { data: codeData, error: findError } = await supabase
        .from('device_authorization_codes')
        .select('*')
        .eq('user_code', user_code.toUpperCase())
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (findError || !codeData) {
        res.status(404).json({ error: 'Invalid or expired user code' });
        return;
      }

      // Authorize: set user_id on the code record
      const { error: updateError } = await supabase
        .from('device_authorization_codes')
        .update({ user_id: user.id })
        .eq('id', codeData.id);

      if (updateError) {
        console.error('[DeviceAuth] Failed to authorize:', updateError);
        res.status(500).json({ error: 'Authorization failed' });
        return;
      }

      res.status(200).json({ success: true, message: 'Device authorized successfully' });
    } catch (err) {
      console.error('[DeviceAuth] Error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  // GET: Check status of a device code
  if (req.method === 'GET') {
    const user_code = req.query.user_code as string;

    if (!user_code) {
      res.status(400).json({ error: 'user_code is required' });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('device_authorization_codes')
        .select('user_code, expires_at, user_id, is_used')
        .eq('user_code', user_code.toUpperCase())
        .maybeSingle();

      if (error || !data) {
        res.status(404).json({ error: 'Code not found' });
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        res.status(410).json({ error: 'Code expired' });
        return;
      }

      res.status(200).json({
        user_code: data.user_code,
        expires_at: data.expires_at,
        authorized: !!data.user_id,
        is_used: data.is_used,
      });
    } catch (err) {
      console.error('[DeviceAuth] Status check error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
