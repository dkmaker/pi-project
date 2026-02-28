/**
 * @module schema/relationships
 * @description Foreign key relationship map for all entities.
 *
 * Every FK from FRAMEWORK/er-diagram.md is represented here. Used by:
 * - Database.validateIntegrity() to check for orphan FKs
 * - Repository layer for relationship-aware queries
 * - Future: automatic cascade detection on entity changes
 *
 * Cardinality meanings:
 * - many-to-one: multiple 'from' records point to one 'to' record
 * - one-to-one: exactly one 'from' record per 'to' record (completion records, etc.)
 * - many-to-many: join table (GoalEpicMap), appears as two entries
 *
 * nullable=true: FK field is Optional — missing/undefined value is valid (not an orphan).
 */

export type Cardinality = 'many-to-one' | 'one-to-one' | 'many-to-many';

export interface Relationship {
  readonly from: string;
  readonly fromField: string;
  readonly to: string;
  readonly toField: string;
  readonly cardinality: Cardinality;
  readonly nullable?: true;
}

export const RELATIONSHIPS: readonly Relationship[] = [
  // Project children
  { from: 'goal', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'tech_stack_entry', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'shared_doc_ref', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'rule', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'convention', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'milestone', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'epic', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'epic', fromField: 'milestone_id', to: 'milestone', toField: 'id', cardinality: 'many-to-one' },
  { from: 'session_log', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'decision', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'question', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'risk', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'change_request', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'scope_change', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  { from: 'abandonment_record', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' },
  // Completion records (1:0-or-1)
  { from: 'project_completion_record', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'one-to-one' },
  { from: 'goal_completion_record', fromField: 'goal_id', to: 'goal', toField: 'id', cardinality: 'one-to-one' },
  { from: 'milestone_review_record', fromField: 'milestone_id', to: 'milestone', toField: 'id', cardinality: 'one-to-one' },
  { from: 'epic_completion_record', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'one-to-one' },
  { from: 'completion_record', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'one-to-one' },
  // Goal ↔ Epic (many-to-many)
  { from: 'goal_epic_map', fromField: 'goal_id', to: 'goal', toField: 'id', cardinality: 'many-to-many' },
  { from: 'goal_epic_map', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-many' },
  // Epic dependencies
  { from: 'epic_dependency', fromField: 'requires_epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' },
  { from: 'epic_dependency', fromField: 'enables_epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' },
  // Task belongs to Epic
  { from: 'task', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' },
  // Task children
  { from: 'subtask', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'task_attachment', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'task_resource_ref', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'blocker', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'task_dependency', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'task_dependency', fromField: 'requires_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'pattern_contract', fromField: 'establishing_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'pattern_dependency', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'pattern_dependency', fromField: 'contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one' },
  { from: 'pattern_contract_version', fromField: 'contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one' },
  { from: 'verification', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'verification_attempt', fromField: 'verification_id', to: 'verification', toField: 'id', cardinality: 'many-to-one' },
  { from: 'work_interval', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' },
  { from: 'work_interval', fromField: 'session_log_id', to: 'session_log', toField: 'id', cardinality: 'many-to-one' },
  // Session log specialization
  { from: 'phase_completion_record', fromField: 'session_log_id', to: 'session_log', toField: 'id', cardinality: 'one-to-one' },
  // Change management
  { from: 'scope_change', fromField: 'change_request_id', to: 'change_request', toField: 'id', cardinality: 'one-to-one' },
  // Cross-references (nullable FKs)
  { from: 'session_log', fromField: 'active_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'decision', fromField: 'superseded_by_id', to: 'decision', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'question', fromField: 'resulting_decision_id', to: 'decision', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'risk', fromField: 'mitigation_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'change_request', fromField: 'resulting_scope_change_id', to: 'scope_change', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'blocker', fromField: 'blocking_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one', nullable: true },
  { from: 'pattern_contract', fromField: 'superseded_by_contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one', nullable: true },
] as const;
