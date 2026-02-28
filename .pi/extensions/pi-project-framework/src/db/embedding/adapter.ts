/**
 * @module embedding/adapter
 * @description Abstract embedding adapter interface for semantic search.
 *
 * Two implementations exist:
 *   - TransformersEmbeddingAdapter (transformers-adapter.ts): real embeddings via
 *     @huggingface/transformers with all-MiniLM-L6-v2 (384 dimensions)
 *   - NoopEmbeddingAdapter (noop-adapter.ts): zero vectors for fast tests
 *
 * Consumed by: SemanticSearch (search/semantic-search.ts) for embedding entity text.
 * Configuration of which entities/fields to embed: embedding/config.ts
 *
 * Lifecycle:
 *   1. Construct adapter
 *   2. Call initialize() (may load model — lazy or eager depending on impl)
 *   3. Call embed() / embedBatch() as needed
 *   4. Call dispose() on shutdown to release resources
 */

export interface EmbeddingAdapter {
  /** Generate an embedding vector for a single text string. */
  embed(text: string): Promise<number[]>;

  /** Generate embedding vectors for multiple texts. Order matches input order. */
  embedBatch(texts: string[]): Promise<number[][]>;

  /** Vector dimensionality (384 for all-MiniLM-L6-v2). */
  readonly dimensions: number;

  /**
   * Model version number. Incremented when the model changes.
   * Used with _embed_ver on entities to detect staleness.
   * 0 = noop adapter (no real embeddings).
   */
  readonly modelVersion: number;

  /** Load model / prepare resources. May be lazy (deferred to first embed call). */
  initialize(): Promise<void>;

  /** Release model resources and memory. */
  dispose(): Promise<void>;
}
