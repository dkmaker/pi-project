/**
 * @module search/sync
 * @description Cold-start bulk sync of embeddings.
 *
 * On startup, iterates all embeddable entities, compares _embed_hash and _embed_ver
 * against current values, and re-embeds stale records. Up-to-date records are skipped.
 *
 * Called by Database.open() after repositories are loaded and SemanticSearch is initialized.
 *
 * Related:
 *   - SemanticSearch (semantic-search.ts): upsert target
 *   - EMBEDDING_CONFIG (embedding/config.ts): field configuration
 *   - BaseRepository (repository/base-repository.ts): record source
 */

import { EMBEDDING_CONFIG, getEmbeddingText, computeEmbedHash, CURRENT_EMBED_VER } from '../embedding/config';
import type { SemanticSearch } from './semantic-search';
import type { BaseRepository } from '../repository/base-repository';
import type { EmbeddingProgressCallback } from '../types';

/**
 * Sync all embeddable entities to the semantic search index.
 *
 * For each embeddable entity type, checks every record:
 * - If _embed_hash matches current text hash AND _embed_ver matches CURRENT_EMBED_VER → skip
 * - Otherwise → re-embed and update _embed_hash/_embed_ver on the record
 *
 * @param search - Initialized SemanticSearch instance
 * @param repos - Map of entity type → repository (only embeddable types are processed)
 * @param updateRecord - Callback to update _embed_hash/_embed_ver on a record after re-embedding
 * @param onProgress - Optional callback for progress updates
 */
export async function syncEmbeddings(
  search: SemanticSearch,
  repos: Record<string, BaseRepository<Record<string, unknown>>>,
  updateRecord: (entityType: string, id: string, patch: Record<string, unknown>) => Promise<void>,
  onProgress?: EmbeddingProgressCallback,
): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;

  // Count total embeddable records to report progress
  let total = 0;
  for (const entityType of Object.keys(EMBEDDING_CONFIG)) {
    const repo = repos[entityType];
    if (repo) total += repo.count();
  }

  let current = 0;

  for (const entityType of Object.keys(EMBEDDING_CONFIG)) {
    const repo = repos[entityType];
    if (!repo) continue;

    const records = repo.getAll();
    for (const record of records) {
      current++;
      const text = getEmbeddingText(entityType, record);
      if (!text) {
        skipped++;
        continue;
      }

      const hash = computeEmbedHash(text);
      const currentHash = record._embed_hash as string | undefined;
      const currentVer = record._embed_ver as number | undefined;

      if (currentHash === hash && currentVer === CURRENT_EMBED_VER) {
        skipped++;
        continue;
      }

      // Re-embed
      onProgress?.({ phase: 'sync', current, total, entityType });
      await search.upsertEntity(entityType, record.id as string, record);
      await updateRecord(entityType, record.id as string, {
        _embed_hash: hash,
        _embed_ver: CURRENT_EMBED_VER,
      });
      synced++;
    }
  }

  return { synced, skipped };
}
