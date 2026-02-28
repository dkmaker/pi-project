/**
 * @module __tests__/performance.test
 * @description Phase 3: Performance benchmarks.
 *
 * Targets:
 * - Load 1000 tasks from JSONL: < 100ms
 * - Query with filter + sort: < 5ms
 * - Semantic search 10 results (NoOp): < 50ms
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { JsonlStorageAdapter } from '../storage/jsonl-adapter';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { EventBus } from '../repository/events';
import { TaskRepository } from '../repository/repositories';
import { makeTask, resetCounter } from './__fixtures__/seed';

describe('Performance benchmarks', () => {
  it('load 1000 tasks from JSONL < 100ms', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-'));
    try {
      // Generate 1000 tasks and save as JSONL
      resetCounter();
      const tasks = Array.from({ length: 1000 }, (_, i) =>
        makeTask({ id: `task-${i}`, name: `Task ${i}`, priority: i % 2 === 0 ? 'high' : 'low' })
      );
      const adapter = new JsonlStorageAdapter(tmpDir);
      await adapter.saveCollection('tasks', tasks);

      // Measure load time
      const events = new EventBus();
      const repo = new TaskRepository(adapter, events);
      const start = performance.now();
      await repo.load();
      const elapsed = performance.now() - start;

      assert.equal(repo.count(), 1000);
      assert.ok(elapsed < 100, `Load took ${elapsed.toFixed(1)}ms, expected < 100ms`);
      console.log(`  → Load 1000 tasks: ${elapsed.toFixed(1)}ms`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('query with filter + sort on 1000 tasks < 5ms', async () => {
    resetCounter();
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    const repo = new TaskRepository(storage, events);
    await repo.load();

    // Insert 1000 tasks
    for (let i = 0; i < 1000; i++) {
      await repo.insert(
        makeTask({ id: `task-${i}`, name: `Task ${i}`, priority: ['critical', 'high', 'medium', 'low'][i % 4] as any, status: i % 5 === 0 ? 'active' : 'pending' })
      );
    }

    // Measure query time
    const start = performance.now();
    const results = repo.query()
      .whereEq('status', 'active')
      .sortBy('name')
      .limit(10)
      .execute();
    const elapsed = performance.now() - start;

    assert.ok(results.length <= 10);
    assert.ok(results.length > 0);
    assert.ok(elapsed < 5, `Query took ${elapsed.toFixed(1)}ms, expected < 5ms`);
    console.log(`  → Query + sort + limit: ${elapsed.toFixed(1)}ms (${results.length} results from 1000 tasks)`);
  });

  it('groupBy on 1000 tasks < 5ms', async () => {
    resetCounter();
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    const repo = new TaskRepository(storage, events);
    await repo.load();

    for (let i = 0; i < 1000; i++) {
      await repo.insert(
        makeTask({ id: `task-${i}`, epic_id: `epic-${i % 10}` })
      );
    }

    const start = performance.now();
    const groups = repo.query().groupBy('epic_id');
    const elapsed = performance.now() - start;

    assert.equal(groups.size, 10);
    assert.ok(elapsed < 5, `GroupBy took ${elapsed.toFixed(1)}ms, expected < 5ms`);
    console.log(`  → GroupBy: ${elapsed.toFixed(1)}ms (10 groups)`);
  });
});
