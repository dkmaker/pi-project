/**
 * @module __tests__/query.test
 * @description Phase 2: Query builder tests — all operators, chaining, edge cases.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Query } from '../query/query-builder';

interface Item { id: string; name: string; score: number; category: string; }

const data: Item[] = [
  { id: '1', name: 'Alpha', score: 90, category: 'A' },
  { id: '2', name: 'Beta', score: 80, category: 'B' },
  { id: '3', name: 'Gamma', score: 95, category: 'A' },
  { id: '4', name: 'Delta', score: 70, category: 'C' },
  { id: '5', name: 'Epsilon', score: 85, category: 'B' },
];

function q(): Query<Item> { return new Query(() => data); }

describe('Query — filters', () => {
  it('whereEq', () => {
    assert.equal(q().whereEq('category', 'A').count(), 2);
  });

  it('whereNe', () => {
    assert.equal(q().whereNe('category', 'A').count(), 3);
  });

  it('whereIn', () => {
    assert.equal(q().whereIn('category', ['A', 'B']).count(), 4);
  });

  it('whereContains', () => {
    assert.equal(q().whereContains('name', 'ta').count(), 2); // Beta, Delta
  });

  it('where with custom predicate', () => {
    assert.equal(q().where(r => r.score > 85).count(), 2);
  });

  it('chained filters AND together', () => {
    const results = q().whereEq('category', 'A').where(r => r.score > 92).execute();
    assert.equal(results.length, 1);
    assert.equal(results[0].name, 'Gamma');
  });
});

describe('Query — sorting', () => {
  it('sortBy ascending', () => {
    const results = q().sortBy('score').execute();
    assert.equal(results[0].score, 70);
    assert.equal(results[4].score, 95);
  });

  it('sortBy descending', () => {
    const results = q().sortBy('score', 'desc').execute();
    assert.equal(results[0].score, 95);
  });

  it('sortBy string field', () => {
    const results = q().sortBy('name').execute();
    assert.equal(results[0].name, 'Alpha');
    assert.equal(results[4].name, 'Gamma');
  });

  it('sortByMultiple', () => {
    const results = q().sortByMultiple([
      { field: 'category', dir: 'asc' },
      { field: 'score', dir: 'desc' },
    ]).execute();
    // A: Gamma(95), Alpha(90), then B: Epsilon(85), Beta(80), then C: Delta(70)
    assert.equal(results[0].name, 'Gamma');
    assert.equal(results[1].name, 'Alpha');
    assert.equal(results[2].name, 'Epsilon');
  });
});

describe('Query — pagination', () => {
  it('limit', () => {
    assert.equal(q().sortBy('score').limit(2).execute().length, 2);
  });

  it('offset', () => {
    const results = q().sortBy('score').offset(3).execute();
    assert.equal(results.length, 2);
    assert.equal(results[0].score, 90);
  });

  it('offset + limit', () => {
    const results = q().sortBy('score').offset(1).limit(2).execute();
    assert.equal(results.length, 2);
    assert.equal(results[0].score, 80);
    assert.equal(results[1].score, 85);
  });
});

describe('Query — projection', () => {
  it('select narrows fields', () => {
    const results = q().select('id', 'name').execute();
    assert.equal(results.length, 5);
    assert.ok('id' in results[0]);
    assert.ok('name' in results[0]);
    assert.ok(!('score' in results[0]));
    assert.ok(!('category' in results[0]));
  });
});

describe('Query — terminal operations', () => {
  it('first returns first match', () => {
    const result = q().whereEq('category', 'A').sortBy('score', 'desc').first();
    assert.equal(result?.name, 'Gamma');
  });

  it('first returns undefined for empty', () => {
    assert.equal(q().whereEq('category', 'Z').first(), undefined);
  });

  it('count', () => {
    assert.equal(q().count(), 5);
    assert.equal(q().whereEq('category', 'C').count(), 1);
  });

  it('exists', () => {
    assert.ok(q().whereEq('category', 'A').exists());
    assert.ok(!q().whereEq('category', 'Z').exists());
  });

  it('groupBy', () => {
    const groups = q().groupBy('category');
    assert.equal(groups.size, 3);
    assert.equal(groups.get('A')?.length, 2);
    assert.equal(groups.get('B')?.length, 2);
    assert.equal(groups.get('C')?.length, 1);
  });

  it('sum', () => {
    assert.equal(q().sum('score'), 90 + 80 + 95 + 70 + 85);
  });

  it('sum with filter', () => {
    assert.equal(q().whereEq('category', 'A').sum('score'), 90 + 95);
  });
});

describe('Query — empty data', () => {
  const empty = new Query<Item>(() => []);

  it('execute returns []', () => {
    assert.deepEqual(empty.execute(), []);
  });

  it('first returns undefined', () => {
    assert.equal(empty.first(), undefined);
  });

  it('count returns 0', () => {
    assert.equal(empty.count(), 0);
  });

  it('exists returns false', () => {
    assert.ok(!empty.exists());
  });

  it('groupBy returns empty Map', () => {
    assert.equal(empty.groupBy('category').size, 0);
  });

  it('sum returns 0', () => {
    assert.equal(empty.sum('score'), 0);
  });
});
