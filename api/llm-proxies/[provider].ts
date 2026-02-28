/**
 * Dynamic LLM Proxy Route
 * Handles all 7 LLM providers via a single Vercel serverless function.
 * Route: /api/llm-proxies/:provider (e.g., openai-proxy, anthropic-proxy)
 * Also handles: /.netlify/functions/llm-proxies/:provider (via vercel.json rewrite)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Handler } from '@netlify/functions';
import { adaptHandler } from '../../lib/netlify-compat';
import { handler as openaiHandler } from '../../netlify/functions/llm-proxies/openai-proxy';
import { handler as anthropicHandler } from '../../netlify/functions/llm-proxies/anthropic-proxy';
import { handler as googleHandler } from '../../netlify/functions/llm-proxies/google-proxy';
import { handler as qwenHandler } from '../../netlify/functions/llm-proxies/qwen-proxy';
import { handler as perplexityHandler } from '../../netlify/functions/llm-proxies/perplexity-proxy';
import { handler as grokHandler } from '../../netlify/functions/llm-proxies/grok-proxy';
import { handler as deepseekHandler } from '../../netlify/functions/llm-proxies/deepseek-proxy';

const handlers: Record<string, Handler> = {
  'openai-proxy': openaiHandler,
  'anthropic-proxy': anthropicHandler,
  'google-proxy': googleHandler,
  'qwen-proxy': qwenHandler,
  'perplexity-proxy': perplexityHandler,
  'grok-proxy': grokHandler,
  'deepseek-proxy': deepseekHandler,
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const provider = req.query.provider as string;
  const netlifyHandler = handlers[provider];
  if (!netlifyHandler) {
    res.status(404).json({ error: 'Unknown LLM provider', provider });
    return;
  }
  return adaptHandler(netlifyHandler)(req, res);
}
