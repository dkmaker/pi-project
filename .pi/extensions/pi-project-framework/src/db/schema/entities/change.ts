/**
 * @module schema/entities/change
 * @description Change management: change requests, scope changes, and abandonment records.
 *
 * ChangeRequest: Proposed modification to a stable entity (Goal, Epic, Milestone,
 * Constraint, TechStackEntry). Must be approved before downstream entities change.
 * Only approved requests produce a ScopeChange.
 *
 * ScopeChange: Audit trail of what changed, before/after states, and downstream impact.
 * Cascades: tasks flagged needs_review, verifications marked stale, etc.
 *
 * AbandonmentRecord: Required for any entity reaching 'abandoned' status.
 * Documents rationale, state at abandonment, disposition of completed work, and human sign-off.
 * Without an AbandonmentRecord, abandoned status is invalid.
 *
 * Relationships:
 *   change_request.project_id → Project.id (many-to-one)
 *   change_request.resulting_scope_change_id → ScopeChange.id (nullable, 1:0..1)
 *   scope_change.change_request_id → ChangeRequest.id (1:1)
 *   scope_change.project_id → Project.id (many-to-one)
 *   abandonment_record.project_id → Project.id (many-to-one)
 *
 * Source: FRAMEWORK/er-diagram.md (CHANGE_REQUEST, SCOPE_CHANGE, ABANDONMENT_RECORD)
 */

import { Type, Static } from '@sinclair/typebox';
import { ChangeRequestStatus, ScopeChangeStatus, AbandonmentDisposition } from '../enums';

export const ChangeRequestSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Who initiated the change request (human or agent id). */
  initiator: Type.String(),
  /** What type of entity is being changed (e.g., "goal", "epic", "tech_stack_entry"). */
  target_entity_type: Type.String(),
  /** ID of the entity being changed. */
  target_entity_id: Type.String(),
  /** Snapshot of the entity's current state (before change). */
  previous_state: Type.String(),
  /** What the entity should become. */
  proposed_state: Type.String(),
  /** Why this change is needed. */
  rationale: Type.String(),
  /** Assessment of downstream effects. */
  impact_analysis: Type.String(),
  /** Which phases need partial re-runs due to this change. */
  required_phase_reruns: Type.String(),
  /** pending_review → approved|rejected. See transitions.ts. */
  status: ChangeRequestStatus,
  /** Human approval record. Required for approval. */
  human_sign_off: Type.String(),
  /** If rejected: why. */
  rejection_rationale: Type.String(),
  /** FK → ScopeChange.id (nullable). Set when approved and scope change is created. */
  resulting_scope_change_id: Type.Optional(Type.String()),
});

export type ChangeRequest = Static<typeof ChangeRequestSchema>;

/**
 * Audit trail for an approved change. Records before/after state and
 * all downstream impacts that need to be executed.
 */
export const ScopeChangeSchema = Type.Object({
  id: Type.String(),
  /** FK → ChangeRequest.id. The approved request that produced this change. */
  change_request_id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** What type of entity was changed. */
  target_entity_type: Type.String(),
  /** ID of the changed entity. */
  target_entity_id: Type.String(),
  /** State before the change. */
  previous_state: Type.String(),
  /** State after the change. */
  new_state: Type.String(),
  /** Why the change was made. */
  rationale: Type.String(),
  /** What triggered this change (e.g., "change_request", "risk_realization"). */
  triggered_by_type: Type.String(),
  /** ID of the triggering entity. */
  triggered_by_id: Type.String(),
  /** Description of downstream effects (tasks flagged, verifications staled, etc.). */
  downstream_impact: Type.String(),
  /** Checklist of actions required to fully apply this change. */
  required_actions_checklist: Type.String(),
  /** Human sign-off confirming the change is applied. */
  human_sign_off: Type.String(),
  /** pending → applied. Applied means all downstream actions completed. */
  status: ScopeChangeStatus,
});

export type ScopeChange = Static<typeof ScopeChangeSchema>;

/**
 * Required for ANY entity reaching 'abandoned' status.
 * Abandoned status without this record is invalid.
 * See FRAMEWORK/reference.md "Abandonment Records" for full requirements.
 */
export const AbandonmentRecordSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Type of abandoned entity (e.g., "task", "epic", "milestone", "goal"). */
  entity_type: Type.String(),
  /** ID of the abandoned entity. */
  entity_id: Type.String(),
  /** ISO datetime of abandonment. */
  abandoned_at: Type.String(),
  /** Why this was abandoned. "Won't do" is not sufficient — must state what changed. */
  rationale: Type.String(),
  /** What was already completed within this entity at time of abandonment. */
  state_at_abandonment: Type.String(),
  /** What happens to completed work: retained|discarded|archived. */
  disposition: AbandonmentDisposition,
  /** If this was a sole contributor to a Goal, impact on that Goal. */
  impact_on_goals: Type.String(),
  /** Human sign-off. Required — abandonment is a scope decision. */
  human_sign_off: Type.String(),
});

export type AbandonmentRecord = Static<typeof AbandonmentRecordSchema>;
