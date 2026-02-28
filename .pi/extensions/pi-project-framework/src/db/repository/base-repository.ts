/**
 * @module repository/base-repository
 * @description Generic base repository with CRUD, validation, and event emission.
 *
 * Provides typed access to a single collection backed by a StorageAdapter.
 * Validates all records against their TypeBox schema on load, insert, and update.
 * Emits MutationEvents via an EventBus on every write operation.
 *
 * Concrete repositories (repositories.ts) extend this to add entity-specific
 * query methods like findByEpic(), findByStatus(), transition(), etc.
 *
 * Related:
 *   - StorageAdapter (storage/adapter.ts): persistence backend
 *   - EventBus (events.ts): mutation pub/sub
 *   - SCHEMA_MAP (schema/index.ts): maps collection names to TypeBox schemas
 */

import type { TObject } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { StorageAdapter } from '../storage/adapter';
import type { EventBus } from './events';
import { Query } from '../query/query-builder';

/** Thrown when an entity with the requested ID does not exist. */
export class EntityNotFoundError extends Error {
  constructor(
    /** Collection name where the entity was expected. */
    public readonly collection: string,
    /** The ID that was not found. */
    public readonly entityId: string
  ) {
    super(`Entity not found: ${collection}/${entityId}`);
    this.name = 'EntityNotFoundError';
  }
}

/** Thrown when inserting an entity with an ID that already exists. */
export class DuplicateIdError extends Error {
  constructor(
    /** Collection name where the duplicate was found. */
    public readonly collection: string,
    /** The duplicate ID. */
    public readonly entityId: string
  ) {
    super(`Duplicate ID: ${collection}/${entityId}`);
    this.name = 'DuplicateIdError';
  }
}

/** Thrown when a status transition is not permitted by the transition table. */
export class InvalidTransitionError extends Error {
  constructor(
    /** Entity type (e.g. "task"). */
    public readonly entityType: string,
    /** Current status. */
    public readonly fromStatus: string,
    /** Requested status. */
    public readonly toStatus: string
  ) {
    super(`Invalid transition: ${entityType} ${fromStatus} → ${toStatus}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Thrown when a record fails TypeBox schema validation. */
export class ValidationError extends Error {
  constructor(
    /** Collection name. */
    public readonly collection: string,
    /** Validation error details. */
    public readonly errors: string[]
  ) {
    super(`Validation failed for ${collection}: ${errors.join('; ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration for BaseRepository construction.
 */
export interface RepositoryConfig<T> {
  /** Collection name (e.g. "tasks"). Used for storage and events. */
  collectionName: string;
  /** TypeBox schema for validation. */
  schema: TObject;
  /** Storage backend. */
  storage: StorageAdapter;
  /** Event bus for mutation notifications. */
  events: EventBus;
  /**
   * Function to extract the unique ID from a record.
   * Defaults to `(r) => r.id` for entities with an `id` field.
   * Override for composite-key entities (GoalEpicMap, TaskResourceRef).
   */
  getId: (record: T) => string;
}

/**
 * Generic base repository for a single entity collection.
 *
 * @typeParam T - The entity type (inferred from TypeBox schema Static<>)
 */
export class BaseRepository<T extends Record<string, unknown>> {
  /** Collection name for storage and events. */
  protected readonly collectionName: string;
  /** TypeBox schema for validation. */
  protected readonly schema: TObject;
  /** Storage backend. */
  protected readonly storage: StorageAdapter;
  /** Event bus. */
  protected readonly events: EventBus;
  /** ID extractor function. */
  protected readonly getId: (record: T) => string;

  /** In-memory record store, keyed by ID. */
  protected records: Map<string, T> = new Map();
  /** Whether data has been loaded from storage. */
  protected loaded: boolean = false;
  /** Tracks whether in-memory state has unsaved changes. */
  protected dirty: boolean = false;

  constructor(config: RepositoryConfig<T>) {
    this.collectionName = config.collectionName;
    this.schema = config.schema;
    this.storage = config.storage;
    this.events = config.events;
    this.getId = config.getId;
  }

  /**
   * Load all records from storage into memory.
   * Validates each record against the schema. Invalid records are skipped with a warning.
   */
  async load(): Promise<void> {
    const raw = await this.storage.loadCollection(this.collectionName);
    this.records.clear();
    for (const item of raw) {
      if (Value.Check(this.schema, item)) {
        const record = item as T;
        this.records.set(this.getId(record), record);
      } else {
        const errors = [...Value.Errors(this.schema, item)].map(e => `${e.path}: ${e.message}`);
        console.warn(`[${this.collectionName}] Skipping invalid record: ${errors.join('; ')}`);
      }
    }
    this.loaded = true;
    this.dirty = false;
  }

  /** Write all in-memory records to storage. */
  async flush(): Promise<void> {
    if (!this.dirty) return;
    const arr = Array.from(this.records.values()) as Record<string, unknown>[];
    await this.storage.saveCollection(this.collectionName, arr);
    this.dirty = false;
  }

  /** Get a record by ID, or undefined if not found. */
  getById(id: string): T | undefined {
    return this.records.get(id);
  }

  /** Get a record by ID, or throw EntityNotFoundError. */
  getByIdOrThrow(id: string): T {
    const record = this.records.get(id);
    if (!record) throw new EntityNotFoundError(this.collectionName, id);
    return record;
  }

  /** Get all records as an array. */
  getAll(): T[] {
    return Array.from(this.records.values());
  }

  /** Find all records matching a predicate. */
  find(predicate: (record: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /** Find the first record matching a predicate, or undefined. */
  findOne(predicate: (record: T) => boolean): T | undefined {
    for (const record of this.records.values()) {
      if (predicate(record)) return record;
    }
    return undefined;
  }

  /** Count records, optionally filtered by predicate. */
  count(predicate?: (record: T) => boolean): number {
    if (!predicate) return this.records.size;
    return this.find(predicate).length;
  }

  /**
   * Insert a new record. Validates, checks for duplicate ID, persists, emits event.
   * @returns The inserted record.
   */
  async insert(record: T): Promise<T> {
    this.validate(record);
    const id = this.getId(record);
    if (this.records.has(id)) {
      throw new DuplicateIdError(this.collectionName, id);
    }
    this.records.set(id, record);
    this.dirty = true;
    await this.flush();
    this.events.emit({
      type: 'entity:inserted',
      collection: this.collectionName,
      id,
      record,
      current: record,
    });
    return record;
  }

  /**
   * Update an existing record by merging a partial patch.
   * Validates the merged result. Persists and emits event.
   * @returns The updated record.
   */
  async update(id: string, patch: Partial<T>): Promise<T> {
    const existing = this.getByIdOrThrow(id);
    const merged = { ...existing, ...patch } as T;
    this.validate(merged);
    this.records.set(id, merged);
    this.dirty = true;
    await this.flush();
    this.events.emit({
      type: 'entity:updated',
      collection: this.collectionName,
      id,
      previous: existing,
      current: merged,
      record: merged,
    });
    return merged;
  }

  /**
   * Delete a record by ID. Throws if not found. Persists and emits event.
   */
  async delete(id: string): Promise<void> {
    const existing = this.getByIdOrThrow(id);
    this.records.delete(id);
    this.dirty = true;
    await this.flush();
    this.events.emit({
      type: 'entity:deleted',
      collection: this.collectionName,
      id,
      previous: existing,
    });
  }

  /** Create a fluent Query builder over all records in this repository. */
  query(): Query<T> {
    return new Query<T>(() => this.getAll());
  }

  /**
   * Validate a record against the schema. Throws ValidationError if invalid.
   */
  protected validate(record: T): void {
    if (!Value.Check(this.schema, record)) {
      const errors = [...Value.Errors(this.schema, record)].map(e => `${e.path}: ${e.message}`);
      throw new ValidationError(this.collectionName, errors);
    }
  }
}
