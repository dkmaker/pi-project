/**
 * @module schema/entities/tracking
 * @description Work intervals and task completion records.
 *
 * WorkInterval: Auto-recorded by the extension during agent execution.
 * Tracks wall-clock time, tokens, cost, and what triggered the interval.
 * One task may have many work intervals across multiple sessions.
 *
 * CompletionRecord: Written when a task reaches status=in_review.
 * Captures output metrics: files touched, lines changed, cost, learnings.
 * Cleared if task returns to active (revision). Re-written on re-completion.
 *
 * Relationships:
 *   work_interval.task_id → Task.id (many-to-one)
 *   work_interval.session_log_id → SessionLog.id (many-to-one)
 *   completion_record.task_id → Task.id (1:0..1)
 *
 * Source: FRAMEWORK/er-diagram.md (WORK_INTERVAL, COMPLETION_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { WorkIntervalTrigger } from '../enums';

export const WorkIntervalSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. */
  task_id: Type.String(),
  /** FK → SessionLog.id. Which session this interval belongs to. */
  session_log_id: Type.String(),
  /** ISO datetime when work started. */
  started_at: Type.String(),
  /** ISO datetime when work ended. */
  ended_at: Type.String(),
  /** Actual active time in seconds (may be less than wall-clock). */
  active_duration_seconds: Type.Number(),
  /** Model used (e.g., "claude-sonnet-4-20250514"). */
  model: Type.String(),
  /** Provider (e.g., "anthropic", "openai"). */
  provider: Type.String(),
  /** Input tokens consumed. */
  tokens_in: Type.Number(),
  /** Output tokens generated. */
  tokens_out: Type.Number(),
  /** Estimated cost in USD. */
  estimated_cost: Type.Number(),
  /** What triggered this interval: user_prompt|agent_continuation|command. */
  trigger: WorkIntervalTrigger,
});

export type WorkInterval = Static<typeof WorkIntervalSchema>;

/**
 * Task completion record — written when task enters in_review.
 * Cleared on revision (task returns to active). Re-written on re-completion.
 * Final version has review_outcome set by human during review.
 */
export const CompletionRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id (1:1). */
  task_id: Type.String(),
  /** ISO datetime when the task was completed. */
  completed_at: Type.String(),
  /** Who completed the task (agent id, updated with human approval on review). */
  completed_by: Type.String(),
  /** Git commit reference for the completed work. */
  commit_reference: Type.String(),
  /** Wall-clock seconds from first work interval to completion. */
  elapsed_seconds: Type.Number(),
  /** Sum of active_duration_seconds across all work intervals. */
  total_active_seconds: Type.Number(),
  /** Sum of estimated_cost across all work intervals. */
  total_cost: Type.Number(),
  /** Summary of models used (e.g., "claude-sonnet-4-20250514 (95%), gpt-4 (5%)"). */
  model_summary: Type.String(),
  /** Comma-separated list of files created or modified. */
  files_touched: Type.String(),
  /** Lines added. */
  lines_added: Type.Number(),
  /** Lines removed. */
  lines_removed: Type.Number(),
  /** Net line change (added - removed). */
  net_lines: Type.Number(),
  /** Total characters changed. */
  characters_changed: Type.Number(),
  /** How accurate was the original estimate? (e.g., "2x over", "on target"). */
  estimate_accuracy: Type.String(),
  /** What was learned during execution. Feeds into future task planning. */
  learnings: Type.String(),
  /** Human review outcome: approved|accepted_with_notes|minor_revision|significant_rework. */
  review_outcome: Type.String(),
  /** Human's review notes. For revisions, scopes the required changes. */
  review_notes: Type.String(),
});

export type CompletionRecord = Static<typeof CompletionRecordSchema>;
