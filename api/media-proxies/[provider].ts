/**
 * Dynamic Media Proxy Route
 * Handles all 3 media providers via a single Vercel serverless function.
 * Route: /api/media-proxies/:provider (e.g., openai-image-proxy, google-imagen-proxy)
 * Also handles: /.netlify/functions/media-proxies/:provider (via vercel.json rewrite)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Handler } from '@netlify/functions';
import { adaptHandler } from '../../lib/netlify-compat';
import { handler as openaiImageHandler } from '../../netlify/functions/media-proxies/openai-image-proxy';
import { handler as googleImagenHandler } from '../../netlify/functions/media-proxies/google-imagen-proxy';
import { handler as googleVeoHandler } from '../../netlify/functions/media-proxies/google-veo-proxy';

const handlers: Record<string, Handler> = {
  'openai-image-proxy': openaiImageHandler,
  'google-imagen-proxy': googleImagenHandler,
  'google-veo-proxy': googleVeoHandler,
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const provider = req.query.provider as string;
  const netlifyHandler = handlers[provider];
  if (!netlifyHandler) {
    res.status(404).json({ error: 'Unknown media provider', provider });
    return;
  }
  return adaptHandler(netlifyHandler)(req, res);
}
