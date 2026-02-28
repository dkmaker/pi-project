/**
 * @module db
 * @description Public API for the database module.
 *
 * Re-exports everything needed by consumers:
 *   - Database class and config
 *   - All entity types and schemas
 *   - All enums
 *   - Query builder
 *   - Storage and embedding adapter interfaces
 *   - Error classes
 */

// Database facade
export { Database } from './database';
export type { DatabaseConfig, IntegrityReport, IntegrityViolation, EmbeddingProgressCallback } from './types';
export { EntityNotFoundError, DuplicateIdError, InvalidTransitionError, ValidationError } from './types';

// All entity schemas and types (re-exported from schema)
export * from './schema/index';

// Query builder
export { Query } from './query/query-builder';

// Adapter interfaces
export type { StorageAdapter } from './storage/adapter';
export type { EmbeddingAdapter } from './embedding/adapter';

// Concrete adapters (for test/custom usage)
export { JsonlStorageAdapter } from './storage/jsonl-adapter';
export { MemoryStorageAdapter } from './storage/memory-adapter';
export { TransformersEmbeddingAdapter } from './embedding/transformers-adapter';
export { NoopEmbeddingAdapter } from './embedding/noop-adapter';

// Event bus
export { EventBus } from './repository/events';
export type { MutationEvent, MutationListener } from './repository/events';

// Search
export { SemanticSearch } from './search/semantic-search';
export type { SearchResult } from './search/types';
