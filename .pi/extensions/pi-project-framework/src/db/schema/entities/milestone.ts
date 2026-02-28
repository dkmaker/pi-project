/**
 * @module schema/entities/milestone
 * @description Milestones are progress checkpoints for the human.
 *
 * Each Milestone groups Epics. When all associated Epics are complete (or abandoned
 * with rationale), the Milestone can be marked 'reached' — which requires writing
 * a MilestoneReviewRecord with exit criteria results and retrospective.
 *
 * Relationships:
 *   milestone.project_id → Project.id (many-to-one)
 *   Epic.milestone_id → Milestone.id (many-to-one: a milestone has many epics)
 *   MilestoneReviewRecord.milestone_id → Milestone.id (1:0..1)
 *
 * Source: FRAMEWORK/er-diagram.md (MILESTONE, MILESTONE_REVIEW_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { MilestoneStatus } from '../enums';

export const MilestoneSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Human-readable milestone name. */
  name: Type.String(),
  /** What this milestone represents. */
  description: Type.String(),
  /** What must be true for this milestone to be considered reached. */
  exit_criteria: Type.String(),
  /** Target date (ISO date string, e.g., "2026-03-15"). Informational, not enforced. */
  target_date: Type.String(),
  /** pending → active → reached|abandoned. See transitions.ts. */
  status: MilestoneStatus,
});

export type Milestone = Static<typeof MilestoneSchema>;

/**
 * Written when a milestone reaches status=reached.
 * Captures a retrospective: what happened, what slipped, what it cost.
 */
export const MilestoneReviewRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → Milestone.id (1:1). */
  milestone_id: Type.String(),
  /** ISO datetime when milestone was reached. */
  reached_at: Type.String(),
  /** Who confirmed the milestone. */
  confirmed_by: Type.String(),
  /** Per-criterion pass/fail assessment. */
  exit_criteria_results: Type.String(),
  /** Which epics were on time vs slipped. */
  epics_on_time_vs_slipped: Type.String(),
  /** Scope changes since the milestone was defined. */
  scope_delta: Type.String(),
  /** Actual AI cost to reach this milestone. */
  actual_ai_cost: Type.Number(),
  /** Key decisions made during this milestone. */
  key_decisions: Type.String(),
  /** Risks that were realized during this milestone. */
  risks_realized: Type.String(),
  /** Any other observations. */
  notes: Type.String(),
});

export type MilestoneReviewRecord = Static<typeof MilestoneReviewRecordSchema>;
