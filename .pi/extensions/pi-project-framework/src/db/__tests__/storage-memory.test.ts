/**
 * @module __tests__/storage-memory.test
 * @description Phase 2: MemoryStorageAdapter tests.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorageAdapter } from '../storage/memory-adapter';

describe('MemoryStorageAdapter', () => {
  let adapter: MemoryStorageAdapter;

  beforeEach(() => { adapter = new MemoryStorageAdapter(); });

  it('returns [] for missing collection', async () => {
    assert.deepEqual(await adapter.loadCollection('tasks'), []);
  });

  it('round-trips records', async () => {
    const records = [{ id: '1', name: 'Task 1' }, { id: '2', name: 'Task 2' }];
    await adapter.saveCollection('tasks', records);
    const loaded = await adapter.loadCollection('tasks');
    assert.deepEqual(loaded, records);
  });

  it('deep copies on save and load (isolation)', async () => {
    const records = [{ id: '1', nested: { value: 'original' } }];
    await adapter.saveCollection('test', records);
    records[0].nested.value = 'modified';
    const loaded = await adapter.loadCollection('test');
    assert.equal((loaded[0] as any).nested.value, 'original');
  });

  it('hasCollection returns false then true', async () => {
    assert.equal(await adapter.hasCollection('x'), false);
    await adapter.saveCollection('x', []);
    assert.equal(await adapter.hasCollection('x'), true);
  });

  it('listCollections returns saved names', async () => {
    await adapter.saveCollection('a', []);
    await adapter.saveCollection('b', []);
    const list = await adapter.listCollections();
    assert.deepEqual(list.sort(), ['a', 'b']);
  });

  it('deleteCollection removes it', async () => {
    await adapter.saveCollection('x', [{ id: '1' }]);
    await adapter.deleteCollection('x');
    assert.equal(await adapter.hasCollection('x'), false);
    assert.deepEqual(await adapter.loadCollection('x'), []);
  });

  it('deleteCollection is no-op for missing', async () => {
    await adapter.deleteCollection('missing');
    // no throw
  });

  it('overwrites on save', async () => {
    await adapter.saveCollection('x', [{ id: '1' }]);
    await adapter.saveCollection('x', [{ id: '2' }]);
    const loaded = await adapter.loadCollection('x');
    assert.equal(loaded.length, 1);
    assert.equal((loaded[0] as any).id, '2');
  });
});
