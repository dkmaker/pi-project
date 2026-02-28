/**
 * @module embedding/config
 * @description Configuration for which entities and fields are embedded for semantic search.
 *
 * Only 5 entity types are embeddable: task, decision, risk, session_log, question.
 * These entities have optional `_embed_hash` and `_embed_ver` fields in their schemas
 * (see schema/entities/task.ts, decision.ts, risk.ts, session.ts, question.ts —
 * defined as `Type.Optional(Type.String())` and `Type.Optional(Type.Number())`).
 *
 * Staleness detection:
 *   - _embed_hash: SHA-256 (truncated to 8 hex chars) of the concatenated text.
 *     Changes when the source fields change → triggers re-embedding.
 *   - _embed_ver: matches CURRENT_EMBED_VER at time of embedding.
 *     Changes when the model changes → triggers re-embedding of all entities.
 *
 * Used by: SemanticSearch (search/semantic-search.ts), sync (search/sync.ts)
 * Source: RESEARCH-DATA-STORE.md (embedding decisions)
 */

import { createHash } from 'node:crypto';

/** Current embedding model version. Increment when switching models. */
export const CURRENT_EMBED_VER = 1;

/**
 * Per-entity-type configuration: which fields to concatenate for embedding text,
 * and the separator to join them with.
 */
export const EMBEDDING_CONFIG: Record<string, { fields: string[]; separator: string }> = {
  task:        { fields: ['name', 'goal_statement', 'context', 'acceptance_criteria'], separator: ' | ' },
  decision:    { fields: ['title', 'context', 'decision', 'rationale'],               separator: ' | ' },
  risk:        { fields: ['description', 'impact', 'mitigation'],                     separator: ' | ' },
  session_log: { fields: ['exact_state', 'completed_this_session', 'next_actions'],    separator: ' | ' },
  question:    { fields: ['description', 'options'],                                   separator: ' | ' },
};

/**
 * Build the text to embed for a given entity type and record.
 * Concatenates the configured fields with the separator.
 * Skips null/undefined fields. Non-string values are JSON-serialized.
 * @returns The embedding text, or null if the entity type is not embeddable
 *          or all configured fields are empty/missing.
 */
export function getEmbeddingText(entityType: string, record: Record<string, unknown>): string | null {
  const config = EMBEDDING_CONFIG[entityType];
  if (!config) return null;

  const parts: string[] = [];
  for (const field of config.fields) {
    const val = record[field];
    if (val != null) {
      parts.push(typeof val === 'string' ? val : JSON.stringify(val));
    }
  }

  return parts.length > 0 ? parts.join(config.separator) : null;
}

/**
 * Compute a stable hash for embedding staleness detection.
 * @returns 8-character hex string (SHA-256 truncated). Deterministic for same input.
 */
export function computeEmbedHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 8);
}
