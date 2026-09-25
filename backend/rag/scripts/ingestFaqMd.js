/**
 * ingestFaqMd.js — Minimal v1 ingestion for faq.md
 * Chunks by `## ` headings, hashes, upserts to KbChunk, embeds via OpenRouter.
 *
 * Usage:
 *   npm run rag:ingest          # chunk + embed faq.md (needs OPENROUTER_API_KEY + MONGO_URI)
 *   npm run rag:ingest -- --dry # preview only, no DB, no embeddings
 *   npm run rag:ingest -- --no-embed  # write DB without embeddings (for testing)
 *
 * Reads backend/data/faq.md (ground truth, priority: high).
 * Output preview -> backend/rag/preview.json for review before embedding.
 * Each chunk is tagged trusted:true, boost:2.0 so curated FAQ always outranks auto-chunks.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB } from '../../config/db.js';
import KbChunk from '../models/KbChunk.js';
import { embedMany, getEmbedModel } from '../services/embeddings.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const FAQ_MD = path.join(ROOT, 'data', 'faq.md');
const PREVIEW = path.join(ROOT, 'rag', 'preview.json');

function sha1(s) {
  return crypto.createHash('sha1').update(String(s)).digest('hex');
}

function parseFaqMd(raw) {
  // Split by `## ` headings. Keep title + body per section.
  // faq.md has 5 sections: 1) pricing, 2) booking, 3) tracking/OTP, 4) failed/RTO, 5) assignment
  const lines = raw.split('\n');
  const chunks = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) chunks.push(current);
      const title = line.replace(/^##\s*\d+\)\s*/, '').replace(/^##\s*/, '').trim();
      current = { title, body: '' };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) chunks.push(current);

  // Clean each chunk: trim, collapse extra whitespace, keep semantic text.
  return chunks
    .map((c) => {
      const text = `${c.title}\n\n${c.body}`.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      // Category heuristic from title keywords
      const lower = c.title.toLowerCase();
      let category = 'general';
      if (lower.includes('price')) category = 'pricing';
      else if (lower.includes('book') || lower.includes('payment')) category = 'booking';
      else if (lower.includes('track') || lower.includes('otp')) category = 'tracking';
      else if (lower.includes('fail') || lower.includes('reschedule') || lower.includes('rto')) category = 'failure';
      else if (lower.includes('courier') || lower.includes('assignment') || lower.includes('created')) category = 'assignment';
      return {
        title: c.title,
        text,
        category,
      };
    })
    .filter((c) => c.text.length > 40);
}

async function main() {
  const args = process.argv.slice(2);
  const isDry = args.includes('--dry');
  const noEmbed = args.includes('--no-embed');

  if (!fs.existsSync(FAQ_MD)) {
    console.error(`[rag:ingest] Missing ${FAQ_MD}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(FAQ_MD, 'utf8');
  const parsed = parseFaqMd(raw);

  console.log(`[rag:ingest] Parsed ${parsed.length} chunks from faq.md`);
  parsed.forEach((c, i) => console.log(`  ${i + 1}. [${c.category}] ${c.title} — ${c.text.length} chars`));

  const preview = parsed.map((c) => {
    const hash = sha1(c.text);
    return {
      source: 'faq.md',
      sourceId: `faqmd-${hash.slice(0, 8)}`,
      title: c.title,
      category: c.category,
      text: c.text,
      hash,
      trusted: true,
      boost: 2.0,
      version: 'v1',
    };
  });

  // Always write preview for review.
  fs.mkdirSync(path.dirname(PREVIEW), { recursive: true });
  fs.writeFileSync(PREVIEW, JSON.stringify(preview, null, 2), 'utf8');
  console.log(`[rag:ingest] Preview written -> rag/preview.json (${preview.length} chunks)`);

  if (isDry) {
    console.log('[rag:ingest] --dry: skipping DB + embeddings. Done.');
    return;
  }

  await connectDB();

  // Upsert each chunk (dedup by hash).
  for (const p of preview) {
    await KbChunk.updateOne(
      { hash: p.hash },
      {
        $set: {
          source: p.source,
          sourceId: p.sourceId,
          title: p.title,
          category: p.category,
          text: p.text,
          hash: p.hash,
          trusted: p.trusted,
          boost: p.boost,
          version: p.version,
        },
      },
      { upsert: true }
    );
  }
  console.log(`[rag:ingest] Upserted ${preview.length} chunks to kb_chunks (hash deduped)`);

  if (noEmbed) {
    console.log('[rag:ingest] --no-embed: skipping embeddings. Run without flag to embed.');
    await mongoose.disconnect();
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[rag:ingest] OPENROUTER_API_KEY not set — chunks saved but not embedded. Set it in backend/.env and re-run.');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Embed: only chunks without embedding or with different model/dims.
  const toEmbed = await KbChunk.find({ hash: { $in: preview.map((p) => p.hash) } })
    .select('+embedding hash text')
    .lean();

  const missing = toEmbed.filter((d) => !Array.isArray(d.embedding) || d.embedding.length === 0);
  // If any chunk already embedded but with old model, re-embed is optional. For v1, only fill missing.
  console.log(`[rag:ingest] ${missing.length} chunks need embedding (of ${toEmbed.length}) via ${getEmbedModel()}`);

  if (missing.length === 0) {
    console.log('[rag:ingest] All chunks already embedded. Done.');
    await mongoose.disconnect();
    return;
  }

  // Embed sequentially (free-tier safe)
  for (const doc of missing) {
    console.log(`  embedding ${doc.hash.slice(0, 8)} (${doc.text.slice(0, 60).replace(/\n/g, ' ')}...)`);
    // Reuse embedMany with single entry for pacing, or direct import
    const { embedOne } = await import('../services/embeddings.service.js');
    const { embedding, model, dims } = await embedOne(doc.text);
    await KbChunk.updateOne({ _id: doc._id }, { $set: { embedding, embeddingModel: model, dims } });
    console.log(`    -> ${dims} dims (${model})`);
    await new Promise((r) => setTimeout(r, 150));
  }

  const count = await KbChunk.countDocuments();
  const embeddedCount = await KbChunk.countDocuments({ embedding: { $exists: true, $ne: [] } });
  console.log(`[rag:ingest] Done. kb_chunks total=${count}, embedded=${embeddedCount}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('[rag:ingest] fatal', e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
