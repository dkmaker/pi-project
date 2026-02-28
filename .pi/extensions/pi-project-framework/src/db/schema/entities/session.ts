/**
 * @module schema/entities/session
 * @description Session logs and phase completion records.
 *
 * SessionLog is the cold-start anchor. On Phase 4 resumption, the agent reads
 * the most recent session log entry to find: active task, exact state, and next actions.
 *
 * Each session log entry is either ordinary or a PhaseCompletionRecord (when
 * is_phase_completion_record=true). Phase completion records gate phase transitions —
 * a session note saying "phase N done" is NOT sufficient.
 *
 * SessionLog is an EMBEDDABLE entity — fields exact_state, completed_this_session,
 * and next_actions are concatenated for semantic search.
 *
 * Relationships:
 *   session_log.project_id → Project.id (many-to-one)
 *   session_log.active_task_id → Task.id (many-to-one, nullable)
 *   WorkInterval.session_log_id → SessionLog.id (many-to-one)
 *   PhaseCompletionRecord.session_log_id → SessionLog.id (1:0..1)
 *
 * Source: FRAMEWORK/er-diagram.md (SESSION_LOG, PHASE_COMPLETION_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { PhaseGateStatus } from '../enums';

export const SessionLogSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Monotonically increasing session number. Used for ordering and lookup. */
  entry_number: Type.Number(),
  /** ISO datetime when this session log was written. */
  timestamp: Type.String(),
  /** Who wrote this entry (agent id or "human"). */
  author: Type.String(),
  /** FK → Task.id (nullable). The task being worked on, or null between tasks. */
  active_task_id: Type.Optional(Type.String()),
  /** True if this session log doubles as a phase completion record. */
  is_phase_completion_record: Type.Boolean(),
  /** Precise description of where work stands right now. The resumption anchor. */
  exact_state: Type.String(),
  /** What was accomplished in this session. */
  completed_this_session: Type.String(),
  /** Unresolved questions surfaced during this session. */
  open_questions: Type.String(),
  /** What should happen next. Drives the next session's cold-start. */
  next_actions: Type.String(),
  /** Key files relevant to current state. */
  relevant_files: Type.String(),
  /** Current git branch. */
  git_branch: Type.String(),
  /** Most recent git commit hash. */
  git_last_commit: Type.String(),
  /** Description of uncommitted changes. */
  git_uncommitted_changes: Type.String(),
  /** Tasks currently in needs_review or in_review status. */
  pending_reviews: Type.String(),
  /** Embedding staleness hash. Set by embedding system. */
  _embed_hash: Type.Optional(Type.String()),
  /** Embedding model version. */
  _embed_ver: Type.Optional(Type.Number()),
});

export type SessionLog = Static<typeof SessionLogSchema>;

/**
 * Phase gate record. Written when a lifecycle phase completes.
 * gate_status=passed is required before the next phase can begin.
 * If gate_status=not_passed, Project.mode is set to phase_gate until gaps are closed.
 */
export const PhaseCompletionRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → SessionLog.id (1:1). Links to the session where this phase completed. */
  session_log_id: Type.String(),
  /** Which phase: 1 (Interview), 2 (Planning), 3 (Decomposition), 4 (Implementation). */
  phase_number: Type.Number(),
  /** Human-readable phase name. */
  phase_name: Type.String(),
  /** ISO datetime when phase was completed. */
  completed_at: Type.String(),
  /** Checklist of required outputs and whether they exist. */
  output_checklist: Type.String(),
  /** Questions still open at phase completion. */
  open_questions: Type.String(),
  /** What must be true for the next phase to begin. */
  entry_condition_for_next: Type.String(),
  /** passed = next phase may begin. not_passed = gaps must be closed. */
  gate_status: PhaseGateStatus,
  /** If not_passed: what specifically failed. */
  gate_failures: Type.String(),
});

export type PhaseCompletionRecord = Static<typeof PhaseCompletionRecordSchema>;
