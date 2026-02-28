/**
 * @module query/types
 * @description Type definitions for the query engine.
 *
 * Used by Query<T> (query-builder.ts) and sort helpers (sort.ts).
 */

/** Sort direction. */
export type SortDirection = 'asc' | 'desc';

/** Sort specification for multi-field sorting. */
export interface SortSpec<T> {
  /** Field to sort by. */
  field: keyof T;
  /** Sort direction: 'asc' (default) or 'desc'. */
  dir: SortDirection;
}
