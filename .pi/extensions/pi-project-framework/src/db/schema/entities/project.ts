/**
 * @module schema/entities/project
 * @description Project root entity and its completion record.
 *
 * Project is the top-level container. Every other entity belongs to exactly one project.
 * On cold-start, read project.stage + project.mode first to determine what work is permitted.
 *
 * Relationships (as parent):
 *   → Goal, Milestone, Epic, SessionLog, Decision, Question, Risk,
 *     ChangeRequest, ScopeChange, AbandonmentRecord, TechStackEntry,
 *     SharedDocRef, Rule, Convention (all via project_id FK)
 *   → ProjectCompletionRecord (1:0..1, created when status=complete)
 *
 * Source: FRAMEWORK/er-diagram.md (PROJECT, PROJECT_COMPLETION_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { ProjectStatus, ProjectStage, ProjectMode } from '../enums';

export const ProjectSchema = Type.Object({
  id: Type.String(),
  /** Human-readable project name. */
  name: Type.String(),
  /** What the project aims to achieve — the north star. */
  vision: Type.String(),
  /** Explicitly excluded scope — what this project will NOT do. */
  non_goals: Type.String(),
  /** Description of the repository layout and key directories. */
  repository_map: Type.String(),
  /** Overall progress: not_started → in_progress → complete|on_hold|abandoned. */
  status: ProjectStatus,
  /** Current lifecycle phase. Drives what operations are permitted. */
  stage: ProjectStage,
  /** What is operationally happening right now within the current stage. */
  mode: ProjectMode,
});

export type Project = Static<typeof ProjectSchema>;

/**
 * Created exactly once when the project reaches status=complete.
 * Captures final assessment: goals achieved, cost, scope delta, learnings.
 * FK: project_id → Project.id (1:1)
 */
export const ProjectCompletionRecordSchema = Type.Object({
  id: Type.String(),
  project_id: Type.String(),
  /** ISO datetime when completion was confirmed. */
  completed_at: Type.String(),
  /** Who confirmed completion (human identifier). */
  confirmed_by: Type.String(),
  /** Per-goal assessment of achievement. */
  goals_assessment: Type.String(),
  /** Per-milestone review of what was reached vs slipped. */
  milestones_review: Type.String(),
  /** Summary of scope changes from original plan. */
  scope_delta: Type.String(),
  /** Total agent active time across all work intervals, in seconds. */
  total_active_seconds: Type.Number(),
  /** Estimated total cost across all work intervals. */
  total_estimated_cost: Type.Number(),
  /** How accurate were the original estimates? */
  estimate_accuracy_notes: Type.String(),
  /** Summary of key decisions made during the project. */
  key_decisions: Type.String(),
  /** Summary of risks: which were realized, mitigated, or accepted. */
  risks_summary: Type.String(),
  /** What should be done differently next time. */
  learnings: Type.String(),
});

export type ProjectCompletionRecord = Static<typeof ProjectCompletionRecordSchema>;
