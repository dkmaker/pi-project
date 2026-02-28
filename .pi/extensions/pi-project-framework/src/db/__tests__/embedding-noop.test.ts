/**
 * @module __tests__/embedding-noop.test
 * @description Phase 2: NoopEmbeddingAdapter + config tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NoopEmbeddingAdapter } from '../embedding/noop-adapter';
import { getEmbeddingText, computeEmbedHash, CURRENT_EMBED_VER, EMBEDDING_CONFIG } from '../embedding/config';

describe('NoopEmbeddingAdapter', () => {
  it('returns 384-dim zero vectors', async () => {
    const adapter = new NoopEmbeddingAdapter();
    await adapter.initialize();
    const vec = await adapter.embed('hello');
    assert.equal(vec.length, 384);
    assert.ok(vec.every(v => v === 0));
    await adapter.dispose();
  });

  it('embedBatch returns correct count', async () => {
    const adapter = new NoopEmbeddingAdapter();
    await adapter.initialize();
    const vecs = await adapter.embedBatch(['a', 'b', 'c']);
    assert.equal(vecs.length, 3);
    assert.equal(vecs[0].length, 384);
    await adapter.dispose();
  });

  it('has dimensions=384 and modelVersion=0', () => {
    const adapter = new NoopEmbeddingAdapter();
    assert.equal(adapter.dimensions, 384);
    assert.equal(adapter.modelVersion, 0);
  });
});

describe('Embedding config', () => {
  it('CURRENT_EMBED_VER is 1', () => {
    assert.equal(CURRENT_EMBED_VER, 1);
  });

  it('has config for 5 embeddable types', () => {
    assert.equal(Object.keys(EMBEDDING_CONFIG).length, 5);
    assert.ok('task' in EMBEDDING_CONFIG);
    assert.ok('decision' in EMBEDDING_CONFIG);
    assert.ok('risk' in EMBEDDING_CONFIG);
    assert.ok('session_log' in EMBEDDING_CONFIG);
    assert.ok('question' in EMBEDDING_CONFIG);
  });

  it('getEmbeddingText returns null for non-embeddable', () => {
    assert.equal(getEmbeddingText('epic', { name: 'test' }), null);
    assert.equal(getEmbeddingText('project', { name: 'test' }), null);
  });

  it('getEmbeddingText concatenates fields for task', () => {
    const text = getEmbeddingText('task', {
      name: 'Build feature', goal_statement: 'Implement X',
      context: 'Part of core', acceptance_criteria: 'Tests pass',
    });
    assert.equal(text, 'Build feature | Implement X | Part of core | Tests pass');
  });

  it('getEmbeddingText skips null fields', () => {
    const text = getEmbeddingText('task', {
      name: 'Build feature', context: 'Part of core',
    });
    assert.equal(text, 'Build feature | Part of core');
  });

  it('getEmbeddingText returns null when all fields empty', () => {
    assert.equal(getEmbeddingText('task', {}), null);
  });

  it('computeEmbedHash returns stable 8-char hex', () => {
    const h1 = computeEmbedHash('hello world');
    const h2 = computeEmbedHash('hello world');
    assert.equal(h1, h2);
    assert.equal(h1.length, 8);
    assert.match(h1, /^[0-9a-f]{8}$/);
  });

  it('computeEmbedHash differs for different input', () => {
    assert.notEqual(computeEmbedHash('hello'), computeEmbedHash('world'));
  });
});
