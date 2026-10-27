/*
  Vercel serverless function: POST /api/grade  { id, text }
  Grades one rewrite. Rules first, then Claude Haiku with the tested prompt,
  then the rule grader as fallback. Responds with the app's result shape
  (see lib/hybrid.js) so the browser treats every source the same way.

  Needs one environment variable in Vercel: ANTHROPIC_API_KEY.
  Without it, every request falls back to the rule grader and the app keeps working.
*/

import Anthropic from '@anthropic-ai/sdk';
import { SENTENCES } from '../src/sentences.js';
import { preCheck, fromModel, gradeLocally } from '../lib/hybrid.js';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA, userMessage, MODEL, EFFORT } from '../lib/grader-prompt.js';

const MAX_TEXT = 300;
const MODEL_TIMEOUT_MS = 8000;

/* Light rate limit per visitor: 30 checks a minute is far more than a learner needs. */
const WINDOW_MS = 60_000;
const LIMIT = 30;
const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > LIMIT;
};

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const readBody = (req) => {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let raw = typeof req.body === 'string' ? req.body : '';
    if (raw) { try { return resolve(JSON.parse(raw)); } catch { return resolve({}); } }
    req.on('data', (c) => { raw += c; if (raw.length > 10_000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
};

let client = null;
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: MODEL_TIMEOUT_MS });
  return client;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (limited(ip)) return send(res, 429, { error: 'Too many checks. Wait a minute and try again.' });

  const body = await readBody(req);
  const sentence = SENTENCES.find((s) => s.id === body.id);
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : '';
  if (!sentence || !text) return send(res, 400, { error: 'Send { id, text }.' });

  const sure = preCheck(text, sentence);
  if (sure) return send(res, 200, sure);

  const anthropic = getClient();
  if (anthropic) {
    try {
      const out = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 512,
        output_config: { effort: EFFORT, format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage(sentence.original, text) }]
      });
      if (out.stop_reason !== 'refusal') {
        const raw = out.content.find((b) => b.type === 'text')?.text ?? '';
        const result = fromModel(JSON.parse(raw), sentence, text);
        if (result) return send(res, 200, result);
      }
    } catch (err) {
      console.error('grade: model call failed, using rules', err?.status || '', err?.message || err);
    }
  }

  return send(res, 200, gradeLocally(text, sentence));
}
