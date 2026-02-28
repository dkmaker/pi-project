/**
 * @module schema/transitions
 * @description Status transition rules for all stateful entities.
 *
 * Source of truth: FRAMEWORK/reference.md (Task transitions) and individual
 * entity docs for Goal, Milestone, Epic, etc.
 *
 * Rules:
 * - Only transitions listed here are permitted. Unlisted = invalid.
 * - Terminal states (done, cancelled, complete, achieved, reached, superseded, rejected, applied)
 *   have no outgoing transitions.
 * - Backward transitions are explicitly defined and limited.
 * - Use isValidTransition(entityType, from, to) for runtime checks.
 *
 * The TaskRepository.transition() method uses these to validate before updating.
 */

export interface Transition {
  readonly from: string;
  readonly to: string;
}

export type TransitionMap = Record<string, readonly Transition[]>;

export const TASK_TRANSITIONS: readonly Transition[] = [
  { from: 'pending', to: 'active' },
  { from: 'pending', to: 'blocked' },
  { from: 'pending', to: 'needs_review' },
  { from: 'pending', to: 'cancelled' },
  { from: 'active', to: 'in_review' },
  { from: 'active', to: 'blocked' },
  { from: 'active', to: 'cancelled' },
  { from: 'blocked', to: 'active' },
  { from: 'blocked', to: 'cancelled' },
  { from: 'needs_review', to: 'pending' },
  { from: 'in_review', to: 'done' },
  { from: 'in_review', to: 'active' },
];

export const GOAL_TRANSITIONS: readonly Transition[] = [
  { from: 'not_started', to: 'in_progress' },
  { from: 'in_progress', to: 'achieved' },
  { from: 'in_progress', to: 'abandoned' },
  { from: 'not_started', to: 'abandoned' },
];

export const MILESTONE_TRANSITIONS: readonly Transition[] = [
  { from: 'pending', to: 'active' },
  { from: 'active', to: 'reached' },
  { from: 'active', to: 'abandoned' },
  { from: 'pending', to: 'abandoned' },
];

export const EPIC_TRANSITIONS: readonly Transition[] = [
  { from: 'pending', to: 'active' },
  { from: 'active', to: 'complete' },
  { from: 'active', to: 'abandoned' },
  { from: 'pending', to: 'abandoned' },
];

export const PATTERN_CONTRACT_TRANSITIONS: readonly Transition[] = [
  { from: 'draft', to: 'established' },
  { from: 'established', to: 'changed' },
  { from: 'changed', to: 'established' },
  { from: 'established', to: 'superseded' },
  { from: 'changed', to: 'superseded' },
];

export const RISK_TRANSITIONS: readonly Transition[] = [
  { from: 'open', to: 'mitigated' },
  { from: 'open', to: 'realized' },
  { from: 'open', to: 'accepted' },
  { from: 'mitigated', to: 'realized' },
  { from: 'accepted', to: 'realized' },
];

export const CHANGE_REQUEST_TRANSITIONS: readonly Transition[] = [
  { from: 'pending_review', to: 'approved' },
  { from: 'pending_review', to: 'rejected' },
];

export const SCOPE_CHANGE_TRANSITIONS: readonly Transition[] = [
  { from: 'pending', to: 'applied' },
];

export const QUESTION_TRANSITIONS: readonly Transition[] = [
  { from: 'open', to: 'resolved' },
  { from: 'open', to: 'deferred' },
  { from: 'open', to: 'dropped' },
  { from: 'deferred', to: 'open' },
  { from: 'deferred', to: 'dropped' },
];

export const DECISION_TRANSITIONS: readonly Transition[] = [
  { from: 'active', to: 'superseded' },
  { from: 'active', to: 'revisited' },
  { from: 'revisited', to: 'active' },
  { from: 'revisited', to: 'superseded' },
];

export const TRANSITIONS: TransitionMap = {
  task: TASK_TRANSITIONS,
  goal: GOAL_TRANSITIONS,
  milestone: MILESTONE_TRANSITIONS,
  epic: EPIC_TRANSITIONS,
  pattern_contract: PATTERN_CONTRACT_TRANSITIONS,
  risk: RISK_TRANSITIONS,
  change_request: CHANGE_REQUEST_TRANSITIONS,
  scope_change: SCOPE_CHANGE_TRANSITIONS,
  question: QUESTION_TRANSITIONS,
  decision: DECISION_TRANSITIONS,
};

export function isValidTransition(entityType: string, from: string, to: string): boolean {
  const transitions = TRANSITIONS[entityType];
  if (!transitions) return false;
  return transitions.some(t => t.from === from && t.to === to);
}
