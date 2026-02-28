/**
 * @module embedding/noop-adapter
 * @description No-op embedding adapter for fast tests that don't need real similarity.
 *
 * Returns 384-dimensional zero vectors instantly — no model download, no computation.
 * modelVersion = 0, which will never match CURRENT_EMBED_VER (config.ts), so
 * entities embedded with this adapter will always be considered stale in production.
 *
 * Implements: EmbeddingAdapter (embedding/adapter.ts)
 * Used by: test suites, Database with enableEmbeddings=false
 */

import type { EmbeddingAdapter } from './adapter';

export class NoopEmbeddingAdapter implements EmbeddingAdapter {
  /** Matches all-MiniLM-L6-v2 dimensionality for interface compatibility. */
  readonly dimensions = 384;

  /** Version 0 = no real embeddings. Always considered stale vs CURRENT_EMBED_VER. */
  readonly modelVersion = 0;

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  /** Returns a 384-dimensional zero vector. */
  async embed(_text: string): Promise<number[]> {
    return new Array(this.dimensions).fill(0);
  }

  /** Returns one 384-dimensional zero vector per input text. */
  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => new Array(this.dimensions).fill(0));
  }
}
