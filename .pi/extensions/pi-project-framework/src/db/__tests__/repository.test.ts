/**
 * @module __tests__/repository.test
 * @description Phase 2: BaseRepository CRUD, validation, events, errors.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { EventBus } from '../repository/events';
import { TaskRepository } from '../repository/repositories';
import { EntityNotFoundError, DuplicateIdError, InvalidTransitionError, ValidationError } from '../repository/base-repository';
import { makeTask, resetCounter } from './__fixtures__/seed';
import type { MutationEvent } from '../repository/events';

describe('BaseRepository CRUD (via TaskRepository)', () => {
  let storage: MemoryStorageAdapter;
  let events: EventBus;
  let repo: TaskRepository;

  beforeEach(async () => {
    resetCounter();
    storage = new MemoryStorageAdapter();
    events = new EventBus();
    repo = new TaskRepository(storage, events);
    await repo.load();
  });

  it('starts empty', () => {
    assert.equal(repo.count(), 0);
    assert.deepEqual(repo.getAll(), []);
  });

  it('insert adds and persists', async () => {
    const task = makeTask({ id: 't1' });
    const result = await repo.insert(task);
    assert.equal(result.id, 't1');
    assert.equal(repo.count(), 1);
    assert.equal(repo.getById('t1')?.name, task.name);
  });

  it('insert rejects duplicate ID', async () => {
    await repo.insert(makeTask({ id: 't1' }));
    await assert.rejects(
      () => repo.insert(makeTask({ id: 't1' })),
      DuplicateIdError,
    );
  });

  it('insert rejects invalid data', async () => {
    const bad = { ...makeTask({ id: 't1' }), status: 'invalid' } as any;
    await assert.rejects(() => repo.insert(bad), ValidationError);
  });

  it('getByIdOrThrow throws for missing', () => {
    assert.throws(() => repo.getByIdOrThrow('missing'), EntityNotFoundError);
  });

  it('update merges and persists', async () => {
    await repo.insert(makeTask({ id: 't1', name: 'Original' }));
    const updated = await repo.update('t1', { name: 'Updated' });
    assert.equal(updated.name, 'Updated');
    assert.equal(repo.getById('t1')?.name, 'Updated');
  });

  it('update rejects invalid data', async () => {
    await repo.insert(makeTask({ id: 't1' }));
    await assert.rejects(
      () => repo.update('t1', { status: 'invalid' } as any),
      ValidationError,
    );
  });

  it('update throws for missing ID', async () => {
    await assert.rejects(
      () => repo.update('missing', { name: 'x' }),
      EntityNotFoundError,
    );
  });

  it('delete removes and persists', async () => {
    await repo.insert(makeTask({ id: 't1' }));
    await repo.delete('t1');
    assert.equal(repo.count(), 0);
    assert.equal(repo.getById('t1'), undefined);
  });

  it('delete throws for missing ID', async () => {
    await assert.rejects(() => repo.delete('missing'), EntityNotFoundError);
  });

  it('find filters correctly', async () => {
    await repo.insert(makeTask({ id: 't1', priority: 'high' }));
    await repo.insert(makeTask({ id: 't2', priority: 'low' }));
    await repo.insert(makeTask({ id: 't3', priority: 'high' }));
    const highs = repo.find(t => t.priority === 'high');
    assert.equal(highs.length, 2);
  });

  it('findOne returns first match or undefined', async () => {
    await repo.insert(makeTask({ id: 't1', priority: 'high' }));
    assert.ok(repo.findOne(t => t.priority === 'high'));
    assert.equal(repo.findOne(t => t.priority === 'critical'), undefined);
  });

  it('count with predicate', async () => {
    await repo.insert(makeTask({ id: 't1', priority: 'high' }));
    await repo.insert(makeTask({ id: 't2', priority: 'low' }));
    assert.equal(repo.count(t => t.priority === 'high'), 1);
    assert.equal(repo.count(), 2);
  });

  it('load from pre-populated storage', async () => {
    const adapter = new MemoryStorageAdapter();
    await adapter.saveCollection('tasks', [makeTask({ id: 't1' }), makeTask({ id: 't2' })]);
    const r = new TaskRepository(adapter, events);
    await r.load();
    assert.equal(r.count(), 2);
  });
});

describe('EventBus', () => {
  it('emits insert events', async () => {
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    const repo = new TaskRepository(storage, events);
    await repo.load();

    const captured: MutationEvent[] = [];
    events.on('entity:inserted', e => captured.push(e));

    await repo.insert(makeTask({ id: 't1' }));
    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'entity:inserted');
    assert.equal(captured[0].collection, 'tasks');
    assert.equal(captured[0].id, 't1');
  });

  it('emits update events with previous', async () => {
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    const repo = new TaskRepository(storage, events);
    await repo.load();

    await repo.insert(makeTask({ id: 't1', name: 'Old' }));

    const captured: MutationEvent[] = [];
    events.on('entity:updated', e => captured.push(e));

    await repo.update('t1', { name: 'New' });
    assert.equal(captured.length, 1);
    assert.equal((captured[0].previous as any).name, 'Old');
    assert.equal((captured[0].current as any).name, 'New');
  });

  it('emits delete events', async () => {
    const storage = new MemoryStorageAdapter();
    const events = new EventBus();
    const repo = new TaskRepository(storage, events);
    await repo.load();

    await repo.insert(makeTask({ id: 't1' }));

    const captured: MutationEvent[] = [];
    events.on('entity:deleted', e => captured.push(e));

    await repo.delete('t1');
    assert.equal(captured.length, 1);
    assert.equal(captured[0].id, 't1');
  });

  it('onAny captures all event types', async () => {
    const events = new EventBus();
    const captured: MutationEvent[] = [];
    events.onAny(e => captured.push(e));

    events.emit({ type: 'entity:inserted', collection: 'x', id: '1' });
    events.emit({ type: 'entity:updated', collection: 'x', id: '1' });
    events.emit({ type: 'entity:deleted', collection: 'x', id: '1' });
    assert.equal(captured.length, 3);
  });

  it('off removes listener', () => {
    const events = new EventBus();
    const captured: MutationEvent[] = [];
    const listener = (e: MutationEvent) => captured.push(e);
    events.on('entity:inserted', listener);
    events.off('entity:inserted', listener);
    events.emit({ type: 'entity:inserted', collection: 'x', id: '1' });
    assert.equal(captured.length, 0);
  });

  it('multiple listeners called in order', () => {
    const events = new EventBus();
    const order: number[] = [];
    events.on('entity:inserted', () => order.push(1));
    events.on('entity:inserted', () => order.push(2));
    events.emit({ type: 'entity:inserted', collection: 'x', id: '1' });
    assert.deepEqual(order, [1, 2]);
  });

  it('clear removes all listeners', () => {
    const events = new EventBus();
    const captured: MutationEvent[] = [];
    events.onAny(e => captured.push(e));
    events.clear();
    events.emit({ type: 'entity:inserted', collection: 'x', id: '1' });
    assert.equal(captured.length, 0);
  });
});
