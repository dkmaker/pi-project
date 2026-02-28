/**
 * @module query/operators
 * @description Filter operator helpers for the query engine.
 *
 * These return predicate functions suitable for Query.where().
 * Used internally by Query's whereEq/whereNe/whereIn/whereContains methods.
 */

/** Equality filter: field === value. */
export function eq<T, K extends keyof T>(field: K, value: T[K]): (record: T) => boolean {
  return (record: T) => record[field] === value;
}

/** Inequality filter: field !== value. */
export function ne<T, K extends keyof T>(field: K, value: T[K]): (record: T) => boolean {
  return (record: T) => record[field] !== value;
}

/** Greater-than filter: field > value. */
export function gt<T, K extends keyof T>(field: K, value: T[K]): (record: T) => boolean {
  return (record: T) => (record[field] as unknown) > (value as unknown);
}

/** Less-than filter: field < value. */
export function lt<T, K extends keyof T>(field: K, value: T[K]): (record: T) => boolean {
  return (record: T) => (record[field] as unknown) < (value as unknown);
}

/** Membership filter: field is one of the given values. */
export function isIn<T, K extends keyof T>(field: K, values: T[K][]): (record: T) => boolean {
  const set = new Set(values as unknown[]);
  return (record: T) => set.has(record[field] as unknown);
}

/** Substring filter: String(field) contains substring (case-sensitive). */
export function contains<T, K extends keyof T>(field: K, substring: string): (record: T) => boolean {
  return (record: T) => String(record[field]).includes(substring);
}
