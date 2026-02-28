/**
 * @module __tests__/storage-jsonl.test
 * @description Phase 2: JsonlStorageAdapter tests.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { JsonlStorageAdapter } from '../storage/jsonl-adapter';

describe('JsonlStorageAdapter', () => {
  let tmpDir: string;
  let adapter: JsonlStorageAdapter;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonl-test-'));
    adapter = new JsonlStorageAdapter(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns [] for missing collection', async () => {
    assert.deepEqual(await adapter.loadCollection('tasks'), []);
  });

  it('round-trips records', async () => {
    const records = [{ id: '1', name: 'Task 1' }, { id: '2', name: 'Task 2' }];
    await adapter.saveCollection('tasks', records);
    const loaded = await adapter.loadCollection('tasks');
    assert.deepEqual(loaded, records);
  });

  it('creates JSONL file with one line per record', async () => {
    await adapter.saveCollection('test', [{ a: 1 }, { b: 2 }]);
    const content = fs.readFileSync(path.join(tmpDir, 'test.jsonl'), 'utf8');
    const lines = content.trim().split('\n');
    assert.equal(lines.length, 2);
    assert.deepEqual(JSON.parse(lines[0]), { a: 1 });
    assert.deepEqual(JSON.parse(lines[1]), { b: 2 });
  });

  it('handles special characters in values', async () => {
    const records = [{ id: '1', desc: 'line1\nline2', path: 'C:\\Users\\test' }];
    await adapter.saveCollection('test', records);
    const loaded = await adapter.loadCollection('test');
    assert.deepEqual(loaded, records);
  });

  it('handles unicode', async () => {
    const records = [{ id: '1', name: '日本語テスト 🚀' }];
    await adapter.saveCollection('test', records);
    const loaded = await adapter.loadCollection('test');
    assert.equal((loaded[0] as any).name, '日本語テスト 🚀');
  });

  it('hasCollection checks file existence', async () => {
    assert.equal(await adapter.hasCollection('x'), false);
    await adapter.saveCollection('x', []);
    assert.equal(await adapter.hasCollection('x'), true);
  });

  it('listCollections returns .jsonl files', async () => {
    await adapter.saveCollection('a', []);
    await adapter.saveCollection('b', []);
    fs.writeFileSync(path.join(tmpDir, 'not-jsonl.txt'), '');
    const list = await adapter.listCollections();
    assert.deepEqual(list.sort(), ['a', 'b']);
  });

  it('deleteCollection removes file', async () => {
    await adapter.saveCollection('x', [{ id: '1' }]);
    await adapter.deleteCollection('x');
    assert.equal(await adapter.hasCollection('x'), false);
  });

  it('overwrites atomically', async () => {
    await adapter.saveCollection('x', [{ id: '1' }]);
    await adapter.saveCollection('x', [{ id: '2' }, { id: '3' }]);
    const loaded = await adapter.loadCollection('x');
    assert.equal(loaded.length, 2);
  });

  it('handles empty collection save/load', async () => {
    await adapter.saveCollection('empty', []);
    const loaded = await adapter.loadCollection('empty');
    assert.deepEqual(loaded, []);
  });
});
