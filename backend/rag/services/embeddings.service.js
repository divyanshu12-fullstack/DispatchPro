/**
 * embeddings.service.js — OpenRouter embeddings via qwen/qwen3-embedding-8b
 * OpenAI-compatible: POST /api/v1/embeddings
 * Ref: https://openrouter.ai/docs/api-reference/embeddings
 */

const OPENROUTER_BASE = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
const EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || 'qwen/qwen3-embedding-8b';
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'qwen/qwen3.7-flash';
// Fallback reasoning model; override via env. Keep cheap-ish for demo.
const CHAT_FALLBACK = 'openrouter/free';

function getApiKey() {
  const k = (process.env.OPENROUTER_API_KEY || '').trim();
  return k || null;
}

function openRouterHeaders() {
  const key = getApiKey();
  if (!key) throw new Error('OPENROUTER_API_KEY is not set. Add it to backend/.env');
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  // Optional but recommended by OpenRouter for ranking/analytics.
  if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
  if (process.env.OPENROUTER_APP_NAME) headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
  return headers;
}

/**
 * Embed a single text. Returns { embedding: number[], model, dims }.
 * Uses OpenRouter embeddings endpoint (OpenAI-compatible).
 */
export async function embedOne(text, { model = EMBED_MODEL } = {}) {
  const clean = String(text || '').trim();
  if (!clean) throw new Error('embedOne: empty text');
  const res = await fetch(`${OPENROUTER_BASE}/embeddings`, {
    method: 'POST',
    headers: openRouterHeaders(),
    body: JSON.stringify({ model, input: clean }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter embeddings failed ${res.status}: ${errText.slice(0, 800)}`);
  }
  const json = await res.json();
  // OpenAI shape: { data: [{ embedding: [...] }], model, usage }
  const vec = json?.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error(`OpenRouter embeddings: no embedding in response: ${JSON.stringify(json).slice(0, 800)}`);
  }
  return { embedding: vec, model: json?.model || model, dims: vec.length };
}

/**
 * Embed many texts sequentially (keeps simple; OpenRouter rate limits are low).
 * Batching via `input: string[]` is supported by some providers but not all;
 * sequential is safe for 8 FAQ chunks.
 */
export async function embedMany(texts, opts = {}) {
  const out = [];
  for (const t of texts) {
    const r = await embedOne(t, opts);
    out.push(r);
    // tiny pacing to avoid 429 on free tier
    await new Promise((r2) => setTimeout(r2, 120));
  }
  return out;
}

/**
 * Chat completion via OpenRouter (OpenAI-compatible).
 * @param {Array<{role:string,content:string}>} messages
 * @param {{model?:string, temperature?:number, maxTokens?:number}} opts
 */
export async function chatCompletion(messages, opts = {}) {
  const model = opts.model || CHAT_MODEL || CHAT_FALLBACK;
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 600,
  };
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: openRouterHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    // surface 401/429 clearly for operator
    throw new Error(`OpenRouter chat failed ${res.status}: ${errText.slice(0, 1200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error(`OpenRouter chat: no content in response: ${JSON.stringify(json).slice(0, 1000)}`);
  }
  return { content, model: json?.model || model, usage: json?.usage || null, raw: json };
}

export function getEmbedModel() {
  return EMBED_MODEL;
}
export function getChatModel() {
  return CHAT_MODEL;
}
export function hasOpenRouterKey() {
  return !!getApiKey();
}
