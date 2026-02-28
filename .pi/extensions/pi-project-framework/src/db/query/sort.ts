/**
 * @module query/sort
 * @description Comparator builders for the query engine.
 *
 * Builds sort comparator functions from field + direction specs.
 * Handles string, number, boolean, null/undefined values.
 */

import type { SortSpec } from './types';

/**
 * Build a comparator for a single field.
 * Handles mixed types by coercing to string for comparison when types differ.
 */
export function buildComparator<T>(field: keyof T, dir: 'asc' | 'desc'): (a: T, b: T) => number {
  const mult = dir === 'desc' ? -1 : 1;
  return (a: T, b: T) => {
    const va = a[field];
    const vb = b[field];
    if (va === vb) return 0;
    if (va == null) return 1 * mult;
    if (vb == null) return -1 * mult;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult;
    return String(va).localeCompare(String(vb)) * mult;
  };
}

/**
 * Build a composite comparator from multiple sort specs.
 * Earlier specs take priority; later specs break ties.
 */
export function buildMultiComparator<T>(sorts: SortSpec<T>[]): (a: T, b: T) => number {
  const comparators = sorts.map(s => buildComparator<T>(s.field, s.dir));
  return (a: T, b: T) => {
    for (const cmp of comparators) {
      const result = cmp(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}
