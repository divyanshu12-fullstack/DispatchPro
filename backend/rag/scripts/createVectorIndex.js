/**
 * createVectorIndex.js — Creates Atlas Vector Search index kb_vector_index on kbchunks (test DB).
 * Works on M0 (free) — Atlas Search requires MongoDB 7+ which Atlas provides.
 * Idempotent: checks existing indexes first.
 *
 * Usage: node rag/scripts/createVectorIndex.js
 * Requires: MONGO_URI (same as server) + Atlas Search enabled (default on M0).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DEF_PATH = path.join(__dirname, '..', 'atlas', 'kb_vector_index.json');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');

  // Read index definition
  const def = JSON.parse(fs.readFileSync(INDEX_DEF_PATH, 'utf8'));
  const indexName = def.name || 'kb_vector_index';

  console.log(`[atlas] Connecting to ${uri.replace(/:\/\/.*@/, '://***@')}`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, maxPoolSize: 5 });

  const dbName = mongoose.connection.name || 'test';
  console.log(`[atlas] Connected DB: ${dbName} (host: ${mongoose.connection.host})`);

  // Determine actual collection name from model (mongoose pluralizes)
  const { default: KbChunk } = await import('../models/KbChunk.js');
  const collName = KbChunk.collection.name; // kbchunks
  console.log(`[atlas] Target collection: ${dbName}.${collName} index: ${indexName}`);

  const db = mongoose.connection.db;
  const collection = db.collection(collName);

  // Check existing search indexes via listSearchIndexes (Atlas only, fails gracefully on non-Atlas)
  let existing = [];
  try {
    // Requires Atlas Search — cursor API
    const cursor = await collection.listSearchIndexes();
    existing = await cursor.toArray();
    console.log(`[atlas] Existing search indexes: ${existing.map((i) => i.name).join(', ') || '(none)'}`);
  } catch (e) {
    console.warn(`[atlas] listSearchIndexes not available (maybe not Atlas or old driver): ${e.message}`);
  }

  const alreadyExists = existing.some((i) => i.name === indexName);
  if (alreadyExists) {
    console.log(`[atlas] Index ${indexName} already exists — skipping create. Waiting for READY...`);
  } else {
    console.log(`[atlas] Creating index ${indexName}...`);
    // Atlas createSearchIndexes command
    // Definition must be {name, type, definition:{fields:[...]}}
    const createCmd = {
      createSearchIndexes: collName,
      indexes: [
        {
          name: indexName,
          type: def.type || 'vectorSearch',
          definition: def.definition,
        },
      ],
    };
    try {
      const res = await db.command(createCmd);
      console.log(`[atlas] createSearchIndexes response:`, JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(`[atlas] createSearchIndexes failed:`, e.message);
      if (e.codeName) console.error(` codeName: ${e.codeName}`);
      if (e.errInfo) console.error(JSON.stringify(e.errInfo, null, 2));
      // If fails due to M0 limitation or already exists, surface guidance
      throw e;
    }
  }

  // Poll until READY (Atlas builds async)
  for (let i = 0; i < 30; i++) {
    try {
      const cursor = await collection.listSearchIndexes();
      const indexes = await cursor.toArray();
      const idx = indexes.find((x) => x.name === indexName);
      const status = idx?.status || idx?.queryable;
      console.log(`[atlas] poll ${i + 1}: status=${status ?? JSON.stringify(idx)?.slice(0, 200) ?? 'unknown'}`);
      if (status === 'READY' || idx?.queryable === true) {
        console.log(`[atlas] Index READY`);
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }

  await mongoose.disconnect();
  console.log('[atlas] Done');
}

main().catch(async (e) => {
  console.error('[atlas] fatal', e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
