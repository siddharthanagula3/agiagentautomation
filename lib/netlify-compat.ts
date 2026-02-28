/**
 * Netlify-to-Vercel Compatibility Adapter
 *
 * Allows existing Netlify Function handlers to run on Vercel with zero code changes.
 * Each API route in api/ is a thin wrapper that calls the existing netlify handler.
 *
 * Usage:
 *   // api/llm-proxies/openai-proxy.ts
 *   import { handler } from '../../netlify/functions/llm-proxies/openai-proxy';
 *   import { adaptHandler } from '../utils/netlify-compat';
 *   export default adaptHandler(handler);
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

type NetlifyResponse = {
  statusCode: number;
  headers?: Record<string, string | number | boolean>;
  body?: string;
  isBase64Encoded?: boolean;
};

/**
 * Converts a Vercel request into a Netlify-compatible HandlerEvent.
 */
function toNetlifyEvent(req: VercelRequest): HandlerEvent {
  // Convert Vercel headers (IncomingHttpHeaders) to plain string record
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  // Convert body: Vercel auto-parses JSON; re-stringify for Netlify compat
  let body: string | null = null;
  if (req.body !== undefined && req.body !== null) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  // Convert query params
  const queryStringParameters: Record<string, string> = {};
  const multiValueQueryStringParameters: Record<string, string[]> = {};

  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        queryStringParameters[key] = value[0] ?? '';
        multiValueQueryStringParameters[key] = value;
      } else if (value !== undefined) {
        queryStringParameters[key] = value;
        multiValueQueryStringParameters[key] = [value];
      }
    }
  }

  const url = req.url ?? '/';
  const [path, query] = url.split('?');

  return {
    httpMethod: (req.method ?? 'GET').toUpperCase(),
    path: path ?? '/',
    headers,
    queryStringParameters,
    multiValueQueryStringParameters,
    body,
    isBase64Encoded: false,
    rawUrl: url,
    rawQuery: query ?? '',
  } as HandlerEvent;
}

/**
 * Sends a Netlify-style response via Vercel's res object.
 */
function sendNetlifyResponse(netlifyResponse: NetlifyResponse, res: VercelResponse): void {
  const { statusCode = 200, headers = {}, body = '' } = netlifyResponse;

  // Set headers
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, String(value));
  }

  // Send response
  res.status(statusCode).send(body);
}

/**
 * Wraps a Netlify handler to work as a Vercel API route.
 *
 * @param netlifyHandler - The exported `handler` from a Netlify Function
 * @returns Vercel-compatible default export function
 */
export function adaptHandler(netlifyHandler: Handler) {
  return async function vercelHandler(req: VercelRequest, res: VercelResponse): Promise<void> {
    try {
      const netlifyEvent = toNetlifyEvent(req);
      const netlifyContext: HandlerContext = {
        callbackWaitsForEmptyEventLoop: false,
        functionName: '',
        functionVersion: '',
        invokedFunctionArn: '',
        memoryLimitInMB: '',
        awsRequestId: '',
        logGroupName: '',
        logStreamName: '',
        getRemainingTimeInMillis: () => 30000,
      };

      const result = await netlifyHandler(netlifyEvent, netlifyContext);

      if (result) {
        sendNetlifyResponse(result, res);
      } else {
        res.status(200).send('');
      }
    } catch (error) {
      console.error('[Vercel Adapter] Handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
