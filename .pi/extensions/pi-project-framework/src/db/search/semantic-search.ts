/**
 * @module search/semantic-search
 * @description Vectra-backed semantic search with per-entity-type indexes.
 *
 * Creates one Vectra LocalIndex per embeddable entity type (task, decision, risk,
 * session_log, question). Supports upsert, remove, single-type search, and
 * cross-type search with score-based merging.
 *
 * Auto-sync: listens to EventBus mutations to keep indexes up-to-date at runtime.
 * Cold-start sync: handled by sync.ts (syncEmbeddings function).
 *
 * Related:
 *   - EmbeddingAdapter (embedding/adapter.ts): generates vectors
 *   - EMBEDDING_CONFIG (embedding/config.ts): which fields to embed
 *   - EventBus (repository/events.ts): mutation events for auto-sync
 *   - SearchResult (types.ts): result type
 */

import { LocalIndex } from 'vectra';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { EmbeddingAdapter } from '../embedding/adapter';
import { EMBEDDING_CONFIG, getEmbeddingText, computeEmbedHash, CURRENT_EMBED_VER } from '../embedding/config';
import type { EventBus, MutationEvent } from '../repository/events';
import type { SearchResult } from './types';

/** Map from entity type (e.g. "task") to its collection name (e.g. "tasks"). */
const ENTITY_TO_COLLECTION: Record<string, string> = {
  task: 'tasks',
  decision: 'decisions',
  risk: 'risks',
  session_log: 'session_logs',
  question: 'questions',
};

/** Reverse map: collection name → entity type. */
const COLLECTION_TO_ENTITY: Record<string, string> = Object.fromEntries(
  Object.entries(ENTITY_TO_COLLECTION).map(([k, v]) => [v, k])
);

/**
 * Semantic search engine backed by Vectra LocalIndex.
 *
 * One index per embeddable entity type, stored at `<vectorDir>/<entityType>/`.
 */
export class SemanticSearch {
  /** Base directory for vector indexes. */
  private readonly vectorDir: string;
  /** Embedding adapter for generating vectors. */
  private readonly embedding: EmbeddingAdapter;
  /** EventBus for auto-sync (optional). */
  private readonly events: EventBus | null;
  /** Per-entity-type Vectra indexes. */
  private indexes: Map<string, LocalIndex> = new Map();
  /** Whether initialized. */
  private initialized: boolean = false;
  /** Bound event listener for cleanup. */
  private eventListener: ((event: MutationEvent) => void) | null = null;

  constructor(vectorDir: string, embedding: EmbeddingAdapter, events?: EventBus) {
    this.vectorDir = vectorDir;
    this.embedding = embedding;
    this.events = events ?? null;
  }

  /**
   * Initialize: create/load Vectra indexes for all embeddable entity types.
   * Must be called before search/upsert operations.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.embedding.initialize();

    for (const entityType of Object.keys(EMBEDDING_CONFIG)) {
      const indexDir = path.join(this.vectorDir, entityType);
      fs.mkdirSync(indexDir, { recursive: true });
      const index = new LocalIndex(indexDir);
      if (!(await index.isIndexCreated())) {
        await index.createIndex();
      }
      this.indexes.set(entityType, index);
    }

    // Wire auto-sync
    if (this.events) {
      this.eventListener = (event: MutationEvent) => {
        this.handleEvent(event).catch(err => {
          console.warn(`[SemanticSearch] Auto-sync error: ${err.message}`);
        });
      };
      this.events.onAny(this.eventListener);
    }

    this.initialized = true;
  }

  /**
   * Search within a single entity type.
   * @param entityType - One of: task, decision, risk, session_log, question
   * @param queryText - Natural language query
   * @param k - Maximum results to return
   */
  async search(entityType: string, queryText: string, k: number = 10): Promise<SearchResult[]> {
    const index = this.indexes.get(entityType);
    if (!index) return [];

    const vector = await this.embedding.embed(queryText);
    const results = await index.queryItems(vector, k);

    return results.map(r => ({
      entityType,
      id: (r.item.metadata as Record<string, unknown>).id as string,
      score: r.score,
      text: (r.item.metadata as Record<string, unknown>).text as string,
    }));
  }

  /**
   * Search across all embeddable entity types, merged by score.
   * @param queryText - Natural language query
   * @param k - Maximum total results to return
   */
  async searchAll(queryText: string, k: number = 10): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    for (const entityType of this.indexes.keys()) {
      const results = await this.search(entityType, queryText, k);
      allResults.push(...results);
    }

    // Sort by score descending, limit to k
    allResults.sort((a, b) => b.score - a.score);
    return allResults.slice(0, k);
  }

  /**
   * Upsert an entity into its semantic search index.
   * Computes embedding text, generates vector, stores in Vectra.
   */
  async upsertEntity(entityType: string, id: string, record: Record<string, unknown>): Promise<void> {
    const index = this.indexes.get(entityType);
    if (!index) return;

    const text = getEmbeddingText(entityType, record);
    if (!text) return;

    const vector = await this.embedding.embed(text);
    await index.upsertItem({
      id,
      vector,
      metadata: { id, entityType, text },
    });
  }

  /**
   * Remove an entity from its semantic search index.
   */
  async removeEntity(entityType: string, id: string): Promise<void> {
    const index = this.indexes.get(entityType);
    if (!index) return;

    const item = await index.getItem(id);
    if (item) {
      await index.deleteItem(id);
    }
  }

  /**
   * Dispose: release embedding resources and detach event listeners.
   */
  async dispose(): Promise<void> {
    if (this.eventListener && this.events) {
      this.events.offAny(this.eventListener);
      this.eventListener = null;
    }
    this.indexes.clear();
    this.initialized = false;
  }

  /**
   * Handle a mutation event for auto-sync.
   * Only processes embeddable entity types.
   */
  private async handleEvent(event: MutationEvent): Promise<void> {
    const entityType = COLLECTION_TO_ENTITY[event.collection];
    if (!entityType) return; // Not an embeddable collection

    if (event.type === 'entity:deleted') {
      await this.removeEntity(entityType, event.id);
    } else {
      // inserted or updated
      const record = (event.current ?? event.record) as Record<string, unknown>;
      if (record) {
        await this.upsertEntity(entityType, event.id, record);
      }
    }
  }
}
