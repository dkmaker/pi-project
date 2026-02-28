/**
 * @module __tests__/transitions.test
 * @description Phase 1: Transition rule tests.
 *
 * Verifies all valid transitions pass and invalid transitions are rejected.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTransition, TRANSITIONS,
  TASK_TRANSITIONS, GOAL_TRANSITIONS, MILESTONE_TRANSITIONS, EPIC_TRANSITIONS,
  PATTERN_CONTRACT_TRANSITIONS, RISK_TRANSITIONS, CHANGE_REQUEST_TRANSITIONS,
  SCOPE_CHANGE_TRANSITIONS, QUESTION_TRANSITIONS, DECISION_TRANSITIONS,
} from '../schema/transitions';

describe('Transitions — valid', () => {
  const allTransitions: [string, readonly { from: string; to: string }[]][] = [
    ['task', TASK_TRANSITIONS],
    ['goal', GOAL_TRANSITIONS],
    ['milestone', MILESTONE_TRANSITIONS],
    ['epic', EPIC_TRANSITIONS],
    ['pattern_contract', PATTERN_CONTRACT_TRANSITIONS],
    ['risk', RISK_TRANSITIONS],
    ['change_request', CHANGE_REQUEST_TRANSITIONS],
    ['scope_change', SCOPE_CHANGE_TRANSITIONS],
    ['question', QUESTION_TRANSITIONS],
    ['decision', DECISION_TRANSITIONS],
  ];

  for (const [entityType, transitions] of allTransitions) {
    for (const t of transitions) {
      it(`${entityType}: ${t.from} → ${t.to} is valid`, () => {
        assert.ok(isValidTransition(entityType, t.from, t.to));
      });
    }
  }
});

describe('Transitions — invalid', () => {
  const invalidCases: [string, string, string][] = [
    ['task', 'done', 'active'],
    ['task', 'cancelled', 'active'],
    ['task', 'pending', 'done'],
    ['task', 'active', 'pending'],
    ['task', 'blocked', 'done'],
    ['goal', 'achieved', 'in_progress'],
    ['goal', 'abandoned', 'not_started'],
    ['milestone', 'reached', 'active'],
    ['epic', 'complete', 'active'],
    ['pattern_contract', 'superseded', 'established'],
    ['risk', 'realized', 'open'],
    ['change_request', 'approved', 'pending_review'],
    ['change_request', 'rejected', 'approved'],
    ['scope_change', 'applied', 'pending'],
    ['question', 'resolved', 'open'],
    ['question', 'dropped', 'open'],
    ['decision', 'superseded', 'active'],
  ];

  for (const [entityType, from, to] of invalidCases) {
    it(`${entityType}: ${from} → ${to} is invalid`, () => {
      assert.ok(!isValidTransition(entityType, from, to));
    });
  }
});

describe('Transitions — unknown entity type', () => {
  it('returns false for unknown entity type', () => {
    assert.ok(!isValidTransition('widget', 'active', 'done'));
  });
});

describe('Transitions — TRANSITIONS map', () => {
  it('has 10 entity types', () => {
    assert.equal(Object.keys(TRANSITIONS).length, 10);
  });
});
