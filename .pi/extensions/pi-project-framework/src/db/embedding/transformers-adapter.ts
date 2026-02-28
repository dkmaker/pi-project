/**
 * @module embedding/transformers-adapter
 * @description Production embedding adapter using @huggingface/transformers v3.
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, mean pooling, normalized).
 * Model files are cached at ~/.cache/huggingface/ (automatic, not committed to git).
 *
 * Lazy initialization: the model loads on first embed() call, not on construction.
 * This avoids blocking startup when embeddings aren't immediately needed.
 * Concurrent calls during init are safe — they await the same promise.
 *
 * Implements: EmbeddingAdapter (embedding/adapter.ts)
 * Used by: SemanticSearch (search/semantic-search.ts) in production mode
 */

import type { EmbeddingAdapter } from './adapter';

export class TransformersEmbeddingAdapter implements EmbeddingAdapter {
  /** all-MiniLM-L6-v2 output dimensionality. */
  readonly dimensions = 384;

  /** Increment when switching models to trigger re-embedding of all entities. */
  readonly modelVersion = 1;

  /** The loaded feature-extraction pipeline, or null before init. */
  private extractor: any = null;

  /** Deduplication: if init is in progress, subsequent callers await this promise. */
  private initPromise: Promise<void> | null = null;

  /**
   * Load the model. Safe to call multiple times — subsequent calls are no-ops.
   * Also called automatically by embed() on first invocation.
   */
  async initialize(): Promise<void> {
    if (this.extractor) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._load();
    return this.initPromise;
  }

  /** Internal: import @huggingface/transformers and create the pipeline. */
  private async _load(): Promise<void> {
    const { pipeline } = await import('@huggingface/transformers');
    this.extractor = await pipeline(
      'feature-extraction',
      'sentence-transformers/all-MiniLM-L6-v2',
      { dtype: 'fp32' } as any,
    );
  }

  /** Release the model and free memory. */
  async dispose(): Promise<void> {
    this.extractor = null;
    this.initPromise = null;
  }

  /**
   * Embed a single text string.
   * Lazy-initializes the model on first call.
   * @returns 384-dimensional normalized vector.
   */
  async embed(text: string): Promise<number[]> {
    await this.initialize();
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array).slice(0, this.dimensions);
  }

  /**
   * Embed multiple texts sequentially.
   * @returns Array of 384-dimensional normalized vectors, one per input text.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}
