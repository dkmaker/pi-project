/**
 * @module schema/entities/epic
 * @description Epics are feature-level work packages containing Tasks.
 *
 * Each Epic belongs to one Project and one Milestone. Epics have explicit scope
 * boundaries (scope_in / scope_out) and acceptance criteria. An Epic can depend
 * on other Epics via EpicDependency records.
 *
 * Infrastructure Epics (is_infrastructure=true) exist for non-Goal work justified
 * by constraints or project resources (e.g., CI setup, tooling).
 *
 * Relationships:
 *   epic.project_id → Project.id (many-to-one)
 *   epic.milestone_id → Milestone.id (many-to-one)
 *   GoalEpicMap: epic_id ↔ goal_id (many-to-many via join table)
 *   Task.epic_id → Epic.id (many-to-one: an epic contains many tasks)
 *   EpicDependency: requires_epic_id / enables_epic_id → Epic.id
 *   EpicCompletionRecord.epic_id → Epic.id (1:0..1)
 *
 * Source: FRAMEWORK/er-diagram.md (EPIC, EPIC_DEPENDENCY, EPIC_COMPLETION_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { EpicStatus, DependencyNature } from '../enums';

export const EpicSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** FK → Milestone.id. Which milestone this epic contributes to. */
  milestone_id: Type.String(),
  /** Human-readable epic name. */
  name: Type.String(),
  /** What this epic is about. */
  description: Type.String(),
  /** What IS included in this epic's scope. */
  scope_in: Type.String(),
  /** What is explicitly EXCLUDED from this epic's scope. */
  scope_out: Type.String(),
  /** What must be true for this epic to be considered complete. */
  acceptance_criteria: Type.String(),
  /** pending → active → complete|abandoned. See transitions.ts. */
  status: EpicStatus,
  /** True if this epic is infrastructure (not directly serving a Goal). */
  is_infrastructure: Type.Boolean(),
  /** For infrastructure epics: what constraint or resource justifies this work. */
  constraint_or_resource_link: Type.String(),
  /** Accumulated learnings and notes during execution. */
  notes_learnings: Type.String(),
});

export type Epic = Static<typeof EpicSchema>;

/**
 * Dependency between two Epics.
 * requires_epic_id must complete before enables_epic_id can start (if nature=hard).
 */
export const EpicDependencySchema = Type.Object({
  id: Type.String(),
  /** FK → Epic.id. The epic that must complete first. */
  requires_epic_id: Type.String(),
  /** FK → Epic.id. The epic that is enabled by completion of the required epic. */
  enables_epic_id: Type.String(),
  /** hard = blocking, soft = preferred ordering. */
  nature: DependencyNature,
  /** What condition must be met for this dependency to be satisfied. */
  gate_condition: Type.String(),
});

export type EpicDependency = Static<typeof EpicDependencySchema>;

/**
 * Written when an epic reaches status=complete.
 * Captures what was built, what was cancelled, and what it cost.
 */
export const EpicCompletionRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → Epic.id (1:1). */
  epic_id: Type.String(),
  /** ISO datetime when completion was confirmed. */
  completed_at: Type.String(),
  /** Who confirmed completion. */
  confirmed_by: Type.String(),
  /** Per-criterion assessment of acceptance criteria. */
  acceptance_criteria_results: Type.String(),
  /** Scope changes from original epic definition. */
  scope_delta: Type.String(),
  /** Count of tasks that reached 'done'. */
  total_tasks_done: Type.Number(),
  /** Count of tasks that were cancelled. */
  total_tasks_cancelled: Type.Number(),
  /** Total agent active time in seconds across all tasks in this epic. */
  total_active_seconds: Type.Number(),
  /** Total estimated cost across all tasks in this epic. */
  total_estimated_cost: Type.Number(),
  /** Accumulated learnings from this epic. */
  notes_learnings: Type.String(),
});

export type EpicCompletionRecord = Static<typeof EpicCompletionRecordSchema>;
