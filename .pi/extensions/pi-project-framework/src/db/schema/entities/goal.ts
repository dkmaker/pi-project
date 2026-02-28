/**
 * @module schema/entities/goal
 * @description Goals define what the project aims to achieve.
 *
 * Goals are scope arbitration tools — when in doubt about whether something belongs,
 * check if it serves a Goal. Goals are connected to Epics via the GoalEpicMap join table
 * (many-to-many). A Goal's status is evaluated when contributing Epics complete or are abandoned.
 *
 * Relationships:
 *   goal.project_id → Project.id (many-to-one)
 *   GoalCompletionRecord.goal_id → Goal.id (1:0..1, created when status=achieved)
 *   GoalEpicMap: goal_id + epic_id (many-to-many join table, no own id)
 *
 * Source: FRAMEWORK/er-diagram.md (GOAL, GOAL_COMPLETION_RECORD, GOAL_EPIC_MAP)
 */

import { Type, Static } from '@sinclair/typebox';
import { GoalStatus } from '../enums';

export const GoalSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. Every goal belongs to exactly one project. */
  project_id: Type.String(),
  /** What this goal aims to achieve, in clear language. */
  statement: Type.String(),
  /** not_started → in_progress → achieved|abandoned. See transitions.ts. */
  status: GoalStatus,
});

export type Goal = Static<typeof GoalSchema>;

/**
 * Created when a goal reaches status=achieved. Captures the goal statement
 * at time of achievement (may have been refined via Change Requests).
 */
export const GoalCompletionRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → Goal.id (1:1). */
  goal_id: Type.String(),
  /** ISO datetime when achievement was confirmed. */
  achieved_at: Type.String(),
  /** Who confirmed the goal was achieved. */
  confirmed_by: Type.String(),
  /** Snapshot of the goal statement at time of achievement. */
  goal_statement_at_achievement: Type.String(),
  /** How was achievement evaluated? What evidence? */
  evaluation_notes: Type.String(),
});

export type GoalCompletionRecord = Static<typeof GoalCompletionRecordSchema>;

/**
 * Join table: Goal ↔ Epic (many-to-many).
 * An Epic may serve multiple Goals; a Goal may be served by multiple Epics.
 * Note: No own 'id' field — composite key is (goal_id, epic_id).
 */
export const GoalEpicMapSchema = Type.Object({
  /** FK → Goal.id. */
  goal_id: Type.String(),
  /** FK → Epic.id. */
  epic_id: Type.String(),
});

export type GoalEpicMap = Static<typeof GoalEpicMapSchema>;
