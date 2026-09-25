import mongoose from 'mongoose';

/**
 * KbChunk — RAG knowledge base chunk.
 * Stores trusted FAQ chunks + future auto-ingested PDF/MD chunks.
 * For faq.md v1 we chunk by `## ` headings; each doc is ~800 chars.
 *
 * Embedding dims: qwen/qwen3-embedding-8b => 4096.
 * Retrieval: Atlas $vectorSearch (kb_vector_index) — production path;
 * keyword fallback remains for 429/missing-key/dim-mismatch.
 */
const kbChunkSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
      // e.g. "faq.md", "faq.json", "sources/faq.pdf"
      index: true,
    },
    sourceId: {
      type: String,
      required: true,
      trim: true,
      // stable id: hash or curated id like "pricing-quote"
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trusted: {
      type: Boolean,
      default: false,
      index: true,
    },
    boost: {
      type: Number,
      default: 1.0,
    },
    embedding: {
      type: [Number],
      default: undefined,
      select: false, // heavy; exclude by default
    },
    embeddingModel: {
      type: String,
      default: null,
    },
    dims: {
      type: Number,
      default: null,
    },
    version: {
      type: String,
      default: 'v1',
    },
  },
  {
    timestamps: true,
  }
);

// For future Atlas $vectorSearch filtering.
kbChunkSchema.index({ category: 1, trusted: 1 });

export default mongoose.models.KbChunk || mongoose.model('KbChunk', kbChunkSchema);
