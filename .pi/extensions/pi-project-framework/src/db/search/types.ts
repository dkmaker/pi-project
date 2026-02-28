/**
 * @module search/types
 * @description Type definitions for semantic search results.
 *
 * Used by SemanticSearch (semantic-search.ts) and sync (sync.ts).
 */

/** A single semantic search result with score and metadata. */
export interface SearchResult {
  /** Entity type (e.g. "task", "decision"). Matches EMBEDDING_CONFIG keys. */
  entityType: string;
  /** Entity ID. */
  id: string;
  /** Cosine similarity score (0–1, higher = more similar). */
  score: number;
  /** The embedded text that was matched. */
  text: string;
}
