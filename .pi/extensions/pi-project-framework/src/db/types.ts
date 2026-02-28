/**
 * @module db/types
 * @description Shared error classes and types for the database module.
 *
 * Re-exports error classes from base-repository for convenience.
 * Defines DatabaseConfig and IntegrityReport.
 */

import type { StorageAdapter } from './storage/adapter';
import type { EmbeddingAdapter } from './embedding/adapter';

// Re-export error classes
export { EntityNotFoundError, DuplicateIdError, InvalidTransitionError, ValidationError } from './repository/base-repository';

/** Callback for embedding progress updates. */
export type EmbeddingProgressCallback = (info: {
  /** Current phase: 'init' (model loading), 'sync' (embedding records), 'done'. */
  phase: 'init' | 'sync' | 'done';
  /** Number of records embedded so far (sync phase only). */
  current?: number;
  /** Total records to embed (sync phase only). */
  total?: number;
  /** Entity type being embedded (sync phase only). */
  entityType?: string;
}) => void;

/** Configuration for Database construction. */
export interface DatabaseConfig {
  /** Directory for JSONL data files (e.g. ".project/database"). */
  dataDir: string;
  /** Directory for Vectra vector indexes (e.g. ".project/database/vectors"). */
  vectorDir: string;
  /** Storage backend override. Default: JsonlStorageAdapter(dataDir). */
  storage?: StorageAdapter;
  /** Embedding backend override. Default: TransformersEmbeddingAdapter. */
  embedding?: EmbeddingAdapter;
  /** Whether to enable semantic search. Default: true. */
  enableEmbeddings?: boolean;
  /** Optional callback for embedding progress (model init, sync progress, done). */
  onEmbeddingProgress?: EmbeddingProgressCallback;
}

/** A single FK integrity violation. */
export interface IntegrityViolation {
  /** Collection containing the record with the broken FK. */
  fromCollection: string;
  /** ID of the record with the broken FK. */
  fromId: string;
  /** Field name containing the broken FK. */
  fromField: string;
  /** Target collection that should contain the referenced record. */
  toCollection: string;
  /** The FK value that doesn't exist in the target collection. */
  missingId: string;
}

/** Result of validateIntegrity(). */
export interface IntegrityReport {
  /** Whether all FK references are valid. */
  valid: boolean;
  /** List of FK violations found. */
  violations: IntegrityViolation[];
}
