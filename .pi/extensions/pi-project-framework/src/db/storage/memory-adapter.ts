/**
 * @module storage/memory-adapter
 * @description In-memory storage adapter for tests.
 *
 * Stores collections in a Map<string, Record[]>. Data is lost when the adapter
 * is garbage collected. Deep-copies on read and write to prevent accidental
 * mutation of stored data (matching the isolation guarantees of the JSONL adapter).
 *
 * Used by: test suites that need fast, zero-I/O storage.
 * Implements: StorageAdapter (storage/adapter.ts)
 */

import type { StorageAdapter } from './adapter';

export class MemoryStorageAdapter implements StorageAdapter {
  private collections = new Map<string, Record<string, unknown>[]>();

  /** Returns a deep copy of the stored records, or [] if collection doesn't exist. */
  async loadCollection(name: string): Promise<Record<string, unknown>[]> {
    const data = this.collections.get(name);
    if (!data) return [];
    return JSON.parse(JSON.stringify(data));
  }

  /** Stores a deep copy of the records. */
  async saveCollection(name: string, records: Record<string, unknown>[]): Promise<void> {
    this.collections.set(name, JSON.parse(JSON.stringify(records)));
  }

  /** Check whether a collection has been saved. */
  async hasCollection(name: string): Promise<boolean> {
    return this.collections.has(name);
  }

  /** List all saved collection names. */
  async listCollections(): Promise<string[]> {
    return [...this.collections.keys()];
  }

  /** Remove a collection from the map. No-op if it doesn't exist. */
  async deleteCollection(name: string): Promise<void> {
    this.collections.delete(name);
  }
}
