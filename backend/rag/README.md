# DispatchPro RAG — v1 (faq.md only, scalable foundation)

> **Current scope (as requested):** vector embeddings + chatbot **first**, using only `backend/data/faq.md` as source. The full automated ingestion pipeline (pdf-parse, recursive chunking, preview for PDFs/CSV/JSON) is deferred — this v1 is the minimal factory that proves the loop, on the `features` branch only.

## What exists now

```
backend/rag/
  models/KbChunk.js              — Mongo model { text, embedding[], source, trusted, boost, hash }
  services/embeddings.service.js — OpenRouter embeddings + chat (qwen/qwen3-embedding-8b + chat model)
  services/ai.service.js         — retrieve (Atlas $vectorSearch → keyword fallback) + LLM answer + guardrails
  routes/ai.routes.js            — POST /api/ai/chat (CUSTOMER/ADMIN/AGENT), POST /api/ai/ops (ADMIN only), GET /api/ai/retrieve (debug)
  scripts/ingestFaqMd.js         — parses faq.md by `## `, dedupes by sha1, writes rag/preview.json, embeds via OpenRouter
  scripts/createVectorIndex.js   — creates Atlas Vector Search index kb_vector_index (M0 ok)
  atlas/kb_vector_index.json     — Atlas index definition (cosine, 4096, filter category/trusted/source)
  preview.json                   — generated preview (5 chunks from faq.md, trusted:true boost:2)
```

- **Source of truth:** `backend/data/faq.md` — 5 sections (pricing, booking, tracking/OTP, failure/RTO, assignment). Each section = one RAG chunk, `trusted:true, boost:2.0` so curated FAQ always outranks future auto-chunks.
- **Embeddings:** OpenRouter `qwen/qwen3-embedding-8b` (4096 dims). Configured via `OPENROUTER_API_KEY` + `OPENROUTER_EMBED_MODEL` (default shown) in `backend/.env`. Chat uses `OPENROUTER_CHAT_MODEL` (e.g. `meta-llama/llama-3.1-8b-instruct`, override via env).
- **Retrieval:** **Atlas `$vectorSearch` (production, `kb_vector_index`, cosine, 4096d, filter on `category/trusted/source`)** — `numCandidates: max(topK*10,50)`, `limit: topK*3`, then Node re-ranks `boosted = score*boost + (trusted?0.02:0)`. Falls back to keyword overlap (stop-word filtered, stem-aware, title-weighted) when API key missing / 429 / index not ready — so `/api/ai/*` stays demo-able.
- **Guardrails:** never selects `deliveryOtpHash/passwordHash/otpHash`, redacts hashes in answers, role-scoped order context (customer sees own orders only), read-only (never dispatches or changes price).

## Setup

1. Add to `backend/.env` (see `backend/.env.example`):

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
# optional overrides
OPENROUTER_EMBED_MODEL=qwen/qwen3-embedding-8b
OPENROUTER_CHAT_MODEL=qwen/qwen3-32b
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=DispatchPro
```

Get a key at https://openrouter.ai/keys (free credits work). Server still boots without it, but answers will be `fallback-extractive`.

2. Install (no new deps — uses native `fetch`):

```bash
cd backend
npm install
```

3. Create Atlas Vector Index (once, M0 ready) + ingest:

```bash
npm run rag:index:create    # creates kb_vector_index on test.kbchunks (idempotent, waits READY)
npm run rag:index:check     # verify READY + queryable on all shards
npm run rag:ingest:dry      # preview only → backend/rag/preview.json
npm run rag:ingest:noembed  # upsert chunks to Mongo, skip embeddings (for testing without key)
npm run rag:ingest          # full: parse → upsert → embed via OpenRouter → update kb_chunks
```

Verify:

```bash
# in mongo shell or via node:
# db.kb_chunks.countDocuments() == 5
# db.kb_chunks.find({embedding:{$exists:true}}).count() == 5 after rag:ingest
```

4. Run server:

```bash
npm run dev
```

## API

All AI routes require `Authorization: Bearer <JWT>`.

### POST /api/ai/chat

Customer (or admin/agent) RAG chat. Body:

```json
{
  "query": "how to reschedule failed order?",
  "orderNumber": "LM-2026-000001" // optional, scoped to own orders
}
```

Success:

```json
{
  "success": true,
  "data": {
    "answer": "... grounded answer with sources ...",
    "sources": [{ "sourceId":"faqmd-ae1e5d7b", "title":"What if delivery fails? ...", "category":"failure", "trusted":true, "score":0.82 }],
    "model": "qwen/qwen3-32b",
    "usage": {...}
  }
}
```

If OpenRouter is down or key missing, `model: "fallback-extractive"` and answer is the top chunk verbatim (demo resilience).

Ownership: if `orderNumber` supplied, server checks `customer==req.user.id` or `ADMIN` — otherwise 403 and no data leaked.

### POST /api/ai/ops

Admin only. Same `query` body, optional `zone` hint. Returns live snapshot counts (`FAILED`, `RTO`, `CREATED`, `needsManualAttention`) alongside RAG answer.

### GET /api/ai/retrieve?q=how+reschedule&topK=3

Admin debug — no LLM cost, just Atlas `$vectorSearch` scores (`score` = cosine, `boostedScore` = score*boost+trusted). Verify index with `rag:index:check`.

## Production retrieval (M0 Atlas)

- **Atlas `$vectorSearch`** is now the production path — same Mongo you already use, no extra vector DB. Brute-force removed; server never loads full vectors.
- Proves embeddings → Atlas retrieval → LLM loop with a **trusted, tiny dataset** (5 chunks) — easy to evaluate interview Qs (price math, OTP, reschedule rules, leakage) before scaling.
- Keeps `faq.md` as the factory's first source; the same `sha1 + upsert + embed` path will later handle `rag/sources/*.pdf|*.csv|*.json` with recursive chunking (`["\n## ","\n\n",". "," "]`, ~800 chars, 150 overlap) without changing the retrieval/chat layer.

## Next (deferred)

- `backend/rag/sources/` drop zone + `ingest.js` CLI with pdf-parse, cleaning, recursive chunking, `preview.json` review → `embed.js` → Atlas `$vectorSearch` index (cosine, filter on `category,trusted`).
- Tools (live DB): `getMyOrder`, `getTimeline`, `explainQuote`, `stuckByZone`, `courierLoad` with role-scoped router.
- Frontend: `SupportChat.jsx` bubble (`/app`) + `OpsCopilotPanel.jsx` (`/admin`) with citations, feedback, rate-limit UI.
- Eval: `golden.json` (20 Qs) + `rag:eval` + `interview.md` update.

## Notes for interview

- Hybrid: curated `faq.md` (`trusted:true, boost:2.0`) + future auto-chunks — explains why curated always outranks.
- Why Atlas: same Mongo you already use, `$vectorSearch` + keyword hybrid later, no extra vector DB.
- Why `qwen/qwen3-embedding-8b` via OpenRouter: 4096 dims, strong multilingual + free/private alternative vs local Ollama trade-off; model dims abstracted in `KbChunk.dims`.
- Why tools vs RAG: price/OTP/status are live DB, never RAG — RAG is static FAQ only.
