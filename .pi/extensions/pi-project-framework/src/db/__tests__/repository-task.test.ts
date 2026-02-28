/**
 * @module __tests__/repository-task.test
 * @description Phase 2: TaskRepository-specific methods — findByEpic, transition, findActive, etc.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { EventBus } from '../repository/events';
import { TaskRepository } from '../repository/repositories';
import { InvalidTransitionError } from '../repository/base-repository';
import { makeTask, resetCounter } from './__fixtures__/seed';

describe('TaskRepository — entity-specific methods', () => {
  let repo: TaskRepository;

  beforeEach(async () => {
    resetCounter();
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    repo = new TaskRepository(storage, events);
    await repo.load();

    await repo.insert(makeTask({ id: 't1', epic_id: 'e1', status: 'active', priority: 'high' }));
    await repo.insert(makeTask({ id: 't2', epic_id: 'e1', status: 'pending', priority: 'medium' }));
    await repo.insert(makeTask({ id: 't3', epic_id: 'e2', status: 'blocked', priority: 'high' }));
    await repo.insert(makeTask({ id: 't4', epic_id: 'e2', status: 'done', priority: 'low' }));
  });

  it('findByEpic returns tasks for that epic', () => {
    assert.equal(repo.findByEpic('e1').length, 2);
    assert.equal(repo.findByEpic('e2').length, 2);
    assert.equal(repo.findByEpic('e3').length, 0);
  });

  it('findByStatus returns correct tasks', () => {
    assert.equal(repo.findByStatus('active').length, 1);
    assert.equal(repo.findByStatus('pending').length, 1);
    assert.equal(repo.findByStatus('blocked').length, 1);
    assert.equal(repo.findByStatus('done').length, 1);
  });

  it('findActive returns active tasks', () => {
    const active = repo.findActive();
    assert.equal(active.length, 1);
    assert.equal(active[0].id, 't1');
  });

  it('findByPriority returns correct tasks', () => {
    assert.equal(repo.findByPriority('high').length, 2);
    assert.equal(repo.findByPriority('low').length, 1);
  });

  it('findBlocked returns blocked tasks', () => {
    const blocked = repo.findBlocked();
    assert.equal(blocked.length, 1);
    assert.equal(blocked[0].id, 't3');
  });
});

describe('TaskRepository.transition()', () => {
  let repo: TaskRepository;

  beforeEach(async () => {
    resetCounter();
    repo = new TaskRepository(new MemoryStorageAdapter(), new EventBus());
    await repo.load();
  });

  it('pending → active succeeds', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'pending' }));
    const result = await repo.transition('t1', 'active');
    assert.equal(result.status, 'active');
    assert.equal(repo.getById('t1')?.status, 'active');
  });

  it('active → in_review succeeds', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'active' }));
    const result = await repo.transition('t1', 'in_review');
    assert.equal(result.status, 'in_review');
  });

  it('in_review → done succeeds', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'in_review' }));
    const result = await repo.transition('t1', 'done');
    assert.equal(result.status, 'done');
  });

  it('pending → done throws InvalidTransitionError', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'pending' }));
    await assert.rejects(
      () => repo.transition('t1', 'done'),
      InvalidTransitionError,
    );
  });

  it('done → active throws (terminal state)', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'done' }));
    await assert.rejects(
      () => repo.transition('t1', 'active'),
      InvalidTransitionError,
    );
  });

  it('blocked → active succeeds', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'blocked' }));
    const result = await repo.transition('t1', 'active');
    assert.equal(result.status, 'active');
  });

  it('needs_review → pending succeeds', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'needs_review' }));
    const result = await repo.transition('t1', 'pending');
    assert.equal(result.status, 'pending');
  });

  it('in_review → active succeeds (revision)', async () => {
    await repo.insert(makeTask({ id: 't1', status: 'in_review' }));
    const result = await repo.transition('t1', 'active');
    assert.equal(result.status, 'active');
  });

  it('transition on missing ID throws', async () => {
    await assert.rejects(() => repo.transition('missing', 'active'));
  });
});

describe('TaskRepository.query()', () => {
  let repo: TaskRepository;

  beforeEach(async () => {
    repo = new TaskRepository(new MemoryStorageAdapter(), new EventBus());
    await repo.load();
    await repo.insert(makeTask({ id: 't1', status: 'active', priority: 'high', name: 'Alpha' }));
    await repo.insert(makeTask({ id: 't2', status: 'pending', priority: 'low', name: 'Beta' }));
    await repo.insert(makeTask({ id: 't3', status: 'active', priority: 'medium', name: 'Gamma' }));
  });

  it('query().whereEq filters', () => {
    const results = repo.query().whereEq('status', 'active').execute();
    assert.equal(results.length, 2);
  });

  it('query() chaining works', () => {
    const results = repo.query()
      .whereEq('status', 'active')
      .sortBy('name')
      .limit(1)
      .execute();
    assert.equal(results.length, 1);
    assert.equal(results[0].name, 'Alpha');
  });
});
