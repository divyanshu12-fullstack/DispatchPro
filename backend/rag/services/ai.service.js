import crypto from 'crypto';
import KbChunk from '../models/KbChunk.js';
import { embedOne } from './embeddings.service.js';
import { chatCompletion } from './embeddings.service.js';

// ---------------------------------------------------------------------------
// Retrieval — Atlas $vectorSearch (production) + keyword fallback
// Keeps Qwen qwen/qwen3-embedding-8b pipeline unchanged; no reranker/hybrid.
// ---------------------------------------------------------------------------

/**
 * Keyword fallback scorer — used when embeddings are missing or OPENROUTER_API_KEY not set.
 * Simple token-overlap + trusted boost. Good enough for 5 FAQ chunks demo.
 */
const STOP = new Set(['what','when','where','which','while','how','why','who','whom','have','has','had','does','did','with','from','that','this','these','those','your','you','youre','about','into','their','there','been','also','will','would','could','should','there','then','than','them','they','still']);
function tokenizeQuery(q) {
  return [...new Set(String(q).toLowerCase().split(/\W+/).filter((w) => w.length >= 3 && !STOP.has(w)))];
}
function keywordScore(query, text) {
  const qTokens = tokenizeQuery(query);
  const tLower = String(text).toLowerCase();
  if (qTokens.length === 0) return 0;
  let hits = 0;
  for (const qt of qTokens) {
    if (tLower.includes(qt)) hits++;
    else {
      const stem = qt.slice(0, 5);
      if (stem.length >= 4 && tLower.includes(stem)) hits += 0.7;
    }
  }
  let phraseBonus = 0;
  for (const tok of qTokens) if (tLower.includes(tok)) phraseBonus += 0.05;
  return hits / qTokens.length + Math.min(phraseBonus, 0.3);
}

function keywordScoreWeighted(query, title, text) {
  // Title matches weigh 2x so "What if delivery fails? Can I reschedule?" wins for reschedule queries.
  const titleScore = keywordScore(query, title);
  const bodyScore = keywordScore(query, text);
  return titleScore * 1.2 + bodyScore;
}

async function retrieveWithVectors(query, topK, filter) {
  const { embedding: qVec } = await embedOne(query);

  // Atlas $vectorSearch — production path (M0 ok, index kb_vector_index, cosine, 4096d)
  // Over-fetch limit then re-apply boost/trusted in Node (Atlas cannot do boost math)
  const numCandidates = Math.max(topK * 10, 50);
  const limit = topK * 3;

  // Build Atlas filter (exact match on indexed filter fields)
  const atlasFilter = {};
  if (filter.category) atlasFilter.category = filter.category;

  const pipeline = [
    {
      $vectorSearch: {
        index: 'kb_vector_index',
        path: 'embedding',
        queryVector: qVec,
        numCandidates,
        limit,
        ...(Object.keys(atlasFilter).length ? { filter: atlasFilter } : {}),
      },
    },
    {
      $project: {
        source: 1,
        sourceId: 1,
        title: 1,
        category: 1,
        text: 1,
        hash: 1,
        trusted: 1,
        boost: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const docs = await KbChunk.aggregate(pipeline);
  if (!docs || docs.length === 0) return [];

  const scored = docs.map((d) => ({
    chunk: d,
    score: d.score ?? 0, // Atlas cosine 0-1
    boostedScore: (d.score ?? 0) * (d.boost ?? 1) + (d.trusted ? 0.02 : 0),
  }));
  scored.sort((a, b) => b.boostedScore - a.boostedScore);
  return scored.slice(0, topK);
}

async function retrieveWithKeywords(query, topK, filter) {
  const docs = await KbChunk.find(filter).select('trusted boost title category source sourceId text hash').lean();
  if (docs.length === 0) return [];
  const scored = docs.map((d) => {
    const raw = keywordScoreWeighted(query, d.title || '', d.text || '');
    const boosted = raw * (d.boost ?? 1) + (d.trusted ? 0.05 : 0);
    return { chunk: { ...d, embedding: undefined }, score: raw, boostedScore: boosted };
  });
  scored.sort((a, b) => b.boostedScore - a.boostedScore);
  return scored.slice(0, topK);
}

/**
 * Retrieve topK chunks for a query.
 * Tries vector search first; falls back to keyword overlap when:
 * - OPENROUTER_API_KEY missing, or
 * - no chunks have embeddings yet, or
 * - embedding call fails (429/network).
 * Boosts trusted chunks so curated faq.md always outranks auto-chunks.
 * Returns [{ chunk, score, boostedScore }]
 */
export async function retrieve(query, { topK = 3, category } = {}) {
  const clean = String(query || '').trim();
  if (!clean) return [];

  const filter = {};
  if (category) filter.category = category;

  try {
    const vecHits = await retrieveWithVectors(clean, topK, filter);
    if (vecHits.length > 0) return vecHits;
    // vectors empty (not embedded yet) -> fallback
    return await retrieveWithKeywords(clean, topK, filter);
  } catch (e) {
    // e.g. OPENROUTER_API_KEY not set or 429 — fallback so /api/ai/* stays demo-able
    console.warn(`[rag] vector retrieve failed, falling back to keywords: ${e.message?.slice(0, 200)}`);
    return await retrieveWithKeywords(clean, topK, filter);
  }
}

// ---------------------------------------------------------------------------
// Guardrails & prompt
// ---------------------------------------------------------------------------

const CUSTOMER_SYSTEM = `You are DispatchPro Assistant — helpful, concise, factual.
You answer delivery questions ONLY from the provided Knowledge Base context.
Rules:
- Never invent prices. If pricing is asked, explain the formula and say exact totals are in the order's pricing breakdown or /quote.
- Never reveal OTPs, password hashes, deliveryOtpHash, or other users' orders.
- Never change assignment or price; you are read-only.
- If the question is outside the context (e.g., unrelated topic), say you don't have that info and point to support.
- Cite sources by title when you use them.
- Keep tone friendly and simple, as if explaining to a first-time user.`;

const ADMIN_SYSTEM = `You are DispatchPro Ops Copilot — read-only assistant for ADMIN.
You help with stuck orders, courier load, and FAQ context.
- You may summarize aggregations but never expose OTPs/hashes or customer PII beyond what the admin already sees.
- Never assign couriers or change data; you are read-only in v1.
- Cite FAQ sources when relevant.`;

function buildUserPrompt(query, retrieved, extraContext = null) {
  const ctx =
    retrieved.length === 0
      ? '(No relevant FAQ context found.)'
      : retrieved
          .map(
            (r, i) =>
              `[${i + 1}] ${r.chunk.title || r.chunk.sourceId} (${r.chunk.category || 'general'}, trusted=${!!r.chunk.trusted}, score=${r.score.toFixed(3)})\n${r.chunk.text}`
          )
          .join('\n\n---\n\n');

  let prompt = `User question: ${query}\n\nKnowledge Base context:\n${ctx}`;
  if (extraContext) {
    prompt += `\n\nLive context (role-scoped, never hallucinate beyond this):\n${extraContext}`;
  }
  prompt += `\n\nAnswer in 4-7 sentences max unless a detailed example is requested. If you used context, list sources as bullet titles at end.`;
  return prompt;
}

function sanitizeAnswer(text) {
  // Redundant guard: strip anything that looks like an OTP/hash leak if model slips.
  let out = String(text || '');
  // Remove 6-digit OTP-like lines that claim to be a code — we never know OTPs in RAG.
  // Keep harmless; just ensure we don't echo deliveryOtpHash field name with values.
  out = out.replace(/deliveryOtpHash\s*[:=]\s*\S+/gi, '[redacted]');
  out = out.replace(/otpHash\s*[:=]\s*\S+/gi, '[redacted]');
  out = out.replace(/passwordHash\s*[:=]\s*\S+/gi, '[redacted]');
  return out.trim();
}

// ---------------------------------------------------------------------------
// Public: answer with RAG
// ---------------------------------------------------------------------------

export async function answerCustomer(query, { userId, orderContext = null } = {}) {
  const retrieved = await retrieve(query, { topK: 3 });
  const extra = orderContext ? `Order context for this customer:\n${orderContext}` : null;
  const messages = [
    { role: 'system', content: CUSTOMER_SYSTEM },
    { role: 'user', content: buildUserPrompt(query, retrieved, extra) },
  ];
  let res;
  try {
    res = await chatCompletion(messages, { temperature: 0.2, maxTokens: 700 });
  } catch (e) {
    // Fallback to extractive answer if LLM is down (demo resilience).
    const fallback =
      retrieved.length > 0
        ? `${retrieved[0].chunk.text.slice(0, 600)}`
        : "I don't have that info in the DispatchPro FAQ yet. Try /quote for price or /app for tracking.";
    return {
      answer: fallback,
      sources: retrieved.map((r) => ({
        sourceId: r.chunk.sourceId,
        title: r.chunk.title,
        category: r.chunk.category,
        trusted: r.chunk.trusted,
        score: Number(r.score.toFixed(4)),
      })),
      model: 'fallback-extractive',
      usage: null,
      error: e.message,
    };
  }

  return {
    answer: sanitizeAnswer(res.content),
    sources: retrieved.map((r) => ({
      sourceId: r.chunk.sourceId,
      title: r.chunk.title,
      category: r.chunk.category,
      trusted: r.chunk.trusted,
      score: Number(r.score.toFixed(4)),
    })),
    model: res.model,
    usage: res.usage,
  };
}

export async function answerOps(query) {
  const retrieved = await retrieve(query, { topK: 3 });
  // Ops live stats are injected by the route handler if needed; keep service pure RAG for now.
  const messages = [
    { role: 'system', content: ADMIN_SYSTEM },
    { role: 'user', content: buildUserPrompt(query, retrieved, null) },
  ];
  let res;
  try {
    res = await chatCompletion(messages, { temperature: 0.2, maxTokens: 700 });
  } catch (e) {
    const fallback =
      retrieved.length > 0
        ? `${retrieved[0].chunk.text.slice(0, 600)}`
        : 'No FAQ context matched. Check /admin/dispatch for stuck orders or /admin/agents for load.';
    return {
      answer: fallback,
      sources: retrieved.map((r) => ({
        sourceId: r.chunk.sourceId,
        title: r.chunk.title,
        category: r.chunk.category,
        trusted: r.chunk.trusted,
        score: Number(r.score.toFixed(4)),
      })),
      model: 'fallback-extractive',
      usage: null,
      error: e.message,
    };
  }
  return {
    answer: sanitizeAnswer(res.content),
    sources: retrieved.map((r) => ({
      sourceId: r.chunk.sourceId,
      title: r.chunk.title,
      category: r.chunk.category,
      trusted: r.chunk.trusted,
      score: Number(r.score.toFixed(4)),
    })),
    model: res.model,
    usage: res.usage,
  };
}

// ---------------------------------------------------------------------------
// Utility for ingest: hash + dedupe
// ---------------------------------------------------------------------------

export function sha1(text) {
  return crypto.createHash('sha1').update(String(text)).digest('hex');
}
