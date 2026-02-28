/**
 * @module query/query-builder
 * @description Fluent, composable, generic query builder.
 *
 * Operates on an in-memory array of records (lazy — source function called on execute).
 * Supports filtering, sorting, pagination, projection, aggregation.
 *
 * Usage:
 *   const results = new Query(() => repo.getAll())
 *     .whereEq('status', 'active')
 *     .sortBy('priority')
 *     .limit(10)
 *     .execute();
 *
 * Integrated into BaseRepository via `.query()` method (added after this step).
 *
 * Related:
 *   - operators.ts: filter predicate builders
 *   - sort.ts: comparator builders
 *   - types.ts: SortSpec type
 */

import { eq, ne, isIn, contains } from './operators';
import { buildComparator, buildMultiComparator } from './sort';
import type { SortSpec } from './types';

/**
 * Fluent query builder for in-memory record arrays.
 * All methods return a new Query (immutable chaining) except terminal methods.
 *
 * @typeParam T - Record type being queried
 */
export class Query<T> {
  /** Lazy data source — called once on first terminal operation. */
  private readonly source: () => T[];
  /** Accumulated filter predicates (ANDed). */
  private readonly filters: ((record: T) => boolean)[];
  /** Sort comparator, if any. */
  private readonly comparator: ((a: T, b: T) => number) | null;
  /** Max records to return. */
  private readonly limitN: number | null;
  /** Records to skip. */
  private readonly offsetN: number | null;
  /** Fields to project (select). Null = all fields. */
  private readonly selectFields: (keyof T)[] | null;

  constructor(
    source: () => T[],
    filters: ((record: T) => boolean)[] = [],
    comparator: ((a: T, b: T) => number) | null = null,
    limitN: number | null = null,
    offsetN: number | null = null,
    selectFields: (keyof T)[] | null = null,
  ) {
    this.source = source;
    this.filters = filters;
    this.comparator = comparator;
    this.limitN = limitN;
    this.offsetN = offsetN;
    this.selectFields = selectFields;
  }

  /** Clone with modifications. */
  private clone(overrides: Partial<{
    filters: ((record: T) => boolean)[];
    comparator: ((a: T, b: T) => number) | null;
    limitN: number | null;
    offsetN: number | null;
    selectFields: (keyof T)[] | null;
  }> = {}): Query<T> {
    return new Query<T>(
      this.source,
      overrides.filters ?? this.filters,
      overrides.comparator !== undefined ? overrides.comparator : this.comparator,
      overrides.limitN !== undefined ? overrides.limitN : this.limitN,
      overrides.offsetN !== undefined ? overrides.offsetN : this.offsetN,
      overrides.selectFields !== undefined ? overrides.selectFields : this.selectFields,
    );
  }

  /** Filter by arbitrary predicate. */
  where(predicate: (r: T) => boolean): Query<T> {
    return this.clone({ filters: [...this.filters, predicate] });
  }

  /** Filter: field === value. */
  whereEq<K extends keyof T>(field: K, value: T[K]): Query<T> {
    return this.where(eq<T, K>(field, value));
  }

  /** Filter: field !== value. */
  whereNe<K extends keyof T>(field: K, value: T[K]): Query<T> {
    return this.where(ne<T, K>(field, value));
  }

  /** Filter: field is one of values. */
  whereIn<K extends keyof T>(field: K, values: T[K][]): Query<T> {
    return this.where(isIn<T, K>(field, values));
  }

  /** Filter: String(field) contains substring. */
  whereContains<K extends keyof T>(field: K, substring: string): Query<T> {
    return this.where(contains<T, K>(field, substring));
  }

  /** Sort by a single field. */
  sortBy<K extends keyof T>(field: K, dir: 'asc' | 'desc' = 'asc'): Query<T> {
    return this.clone({ comparator: buildComparator<T>(field, dir) });
  }

  /** Sort by multiple fields (earlier fields take priority). */
  sortByMultiple(sorts: SortSpec<T>[]): Query<T> {
    return this.clone({ comparator: buildMultiComparator<T>(sorts) });
  }

  /** Limit the number of results. */
  limit(n: number): Query<T> {
    return this.clone({ limitN: n });
  }

  /** Skip the first n results. */
  offset(n: number): Query<T> {
    return this.clone({ offsetN: n });
  }

  /** Project to specific fields only. Returns a Query of the narrowed type. */
  select<K extends keyof T>(...fields: K[]): Query<Pick<T, K>> {
    // Cast is safe: we'll apply projection in execute()
    return this.clone({ selectFields: fields as (keyof T)[] }) as unknown as Query<Pick<T, K>>;
  }

  // ─── Terminal operations ───────────────────────────────────────

  /** Execute the query pipeline and return all matching records. */
  execute(): T[] {
    let results = this.source();

    // Apply filters
    for (const filter of this.filters) {
      results = results.filter(filter);
    }

    // Apply sort
    if (this.comparator) {
      results = results.slice().sort(this.comparator);
    }

    // Apply offset
    if (this.offsetN != null && this.offsetN > 0) {
      results = results.slice(this.offsetN);
    }

    // Apply limit
    if (this.limitN != null) {
      results = results.slice(0, this.limitN);
    }

    // Apply projection
    if (this.selectFields) {
      const fields = this.selectFields;
      results = results.map(r => {
        const projected: Record<string, unknown> = {};
        for (const f of fields) {
          projected[f as string] = r[f];
        }
        return projected as T;
      });
    }

    return results;
  }

  /** Return the first matching record, or undefined. */
  first(): T | undefined {
    return this.limit(1).execute()[0];
  }

  /** Count matching records. */
  count(): number {
    // Skip sort/select for count — just filter
    let results = this.source();
    for (const filter of this.filters) {
      results = results.filter(filter);
    }
    return results.length;
  }

  /** Check if any records match. */
  exists(): boolean {
    return this.count() > 0;
  }

  /** Group matching records by a field value. */
  groupBy<K extends keyof T>(field: K): Map<T[K], T[]> {
    const results = this.execute();
    const groups = new Map<T[K], T[]>();
    for (const r of results) {
      const key = r[field];
      const group = groups.get(key);
      if (group) {
        group.push(r);
      } else {
        groups.set(key, [r]);
      }
    }
    return groups;
  }

  /** Sum a numeric field across matching records. */
  sum<K extends keyof T>(field: K): number {
    const results = this.execute();
    let total = 0;
    for (const r of results) {
      const val = r[field];
      if (typeof val === 'number') total += val;
    }
    return total;
  }
}
