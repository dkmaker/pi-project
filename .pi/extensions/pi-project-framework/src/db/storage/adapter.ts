/**
 * @module storage/adapter
 * @description Abstract storage adapter interface for entity persistence.
 *
 * Entity-agnostic — reads/writes named collections of JSON records.
 * Two implementations exist:
 *   - JsonlStorageAdapter (jsonl-adapter.ts): JSONL files with atomic writes, for production
 *   - MemoryStorageAdapter (memory-adapter.ts): in-memory Map, for tests
 *
 * Consumed by: BaseRepository (repository/base-repository.ts) — each repository
 * gets one StorageAdapter and calls loadCollection/saveCollection on it.
 *
 * Collection names match COLLECTION_NAMES from schema/index.ts (e.g. "tasks", "epics").
 */

export interface StorageAdapter {
  /** Load all records from a named collection. Returns [] if collection doesn't exist. */
  loadCollection(name: string): Promise<Record<string, unknown>[]>;

  /** Persist all records to a named collection. Overwrites existing data. */
  saveCollection(name: string, records: Record<string, unknown>[]): Promise<void>;

  /** Check whether a named collection exists in the backing store. */
  hasCollection(name: string): Promise<boolean>;

  /** List all collection names available in the backing store. */
  listCollections(): Promise<string[]>;

  /** Remove a collection entirely. No-op if it doesn't exist. */
  deleteCollection(name: string): Promise<void>;
}
