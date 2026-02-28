/**
 * @module schema
 * @description Schema registry — the single import point for all entity schemas.
 *
 * Exports:
 * - All TypeBox schemas (e.g., TaskSchema, EpicSchema) and their Static types
 * - All enums (e.g., TaskStatus, Priority)
 * - RELATIONSHIPS: FK map for integrity validation (48 relationships)
 * - TRANSITIONS + isValidTransition(): status transition rules
 * - SCHEMA_MAP: Record<collectionName, TObject> for generic/dynamic access (35 entries)
 * - COLLECTION_NAMES: ordered list of all collection names
 *
 * Entity count: 35 (matches FRAMEWORK/er-diagram.md)
 * Embeddable entities (have _embed_hash/_embed_ver): task, decision, risk, session_log, question
 *
 * Usage:
 *   import { TaskSchema, Task, SCHEMA_MAP, isValidTransition } from './schema';
 */

import { TObject } from '@sinclair/typebox';

// Re-export all enums
export * from './enums';

// Re-export all entity schemas and types
export { ProjectSchema, type Project, ProjectCompletionRecordSchema, type ProjectCompletionRecord } from './entities/project';
export { GoalSchema, type Goal, GoalCompletionRecordSchema, type GoalCompletionRecord, GoalEpicMapSchema, type GoalEpicMap } from './entities/goal';
export { TechStackEntrySchema, type TechStackEntry, SharedDocRefSchema, type SharedDocRef, RuleSchema, type Rule, ConventionSchema, type Convention } from './entities/resources';
export { MilestoneSchema, type Milestone, MilestoneReviewRecordSchema, type MilestoneReviewRecord } from './entities/milestone';
export { EpicSchema, type Epic, EpicDependencySchema, type EpicDependency, EpicCompletionRecordSchema, type EpicCompletionRecord } from './entities/epic';
export { TaskSchema, type Task, SubtaskSchema, type Subtask, TaskAttachmentSchema, type TaskAttachment, TaskResourceRefSchema, type TaskResourceRef } from './entities/task';
export { BlockerSchema, type Blocker, TaskDependencySchema, type TaskDependency } from './entities/blocker';
export { PatternContractSchema, type PatternContract, PatternContractVersionSchema, type PatternContractVersion, PatternDependencySchema, type PatternDependency } from './entities/pattern';
export { VerificationSchema, type Verification, VerificationAttemptSchema, type VerificationAttempt } from './entities/verification';
export { WorkIntervalSchema, type WorkInterval, CompletionRecordSchema, type CompletionRecord } from './entities/tracking';
export { SessionLogSchema, type SessionLog, PhaseCompletionRecordSchema, type PhaseCompletionRecord } from './entities/session';
export { DecisionSchema, type Decision } from './entities/decision';
export { QuestionSchema, type Question } from './entities/question';
export { RiskSchema, type Risk } from './entities/risk';
export { ChangeRequestSchema, type ChangeRequest, ScopeChangeSchema, type ScopeChange, AbandonmentRecordSchema, type AbandonmentRecord } from './entities/change';

// Re-export relationships and transitions
export { RELATIONSHIPS, type Relationship, type Cardinality } from './relationships';
export { TRANSITIONS, TASK_TRANSITIONS, GOAL_TRANSITIONS, MILESTONE_TRANSITIONS, EPIC_TRANSITIONS, PATTERN_CONTRACT_TRANSITIONS, RISK_TRANSITIONS, CHANGE_REQUEST_TRANSITIONS, SCOPE_CHANGE_TRANSITIONS, QUESTION_TRANSITIONS, DECISION_TRANSITIONS, isValidTransition, type Transition, type TransitionMap } from './transitions';

// Schema imports for SCHEMA_MAP
import { ProjectSchema } from './entities/project';
import { ProjectCompletionRecordSchema } from './entities/project';
import { GoalSchema, GoalCompletionRecordSchema, GoalEpicMapSchema } from './entities/goal';
import { TechStackEntrySchema, SharedDocRefSchema, RuleSchema, ConventionSchema } from './entities/resources';
import { MilestoneSchema, MilestoneReviewRecordSchema } from './entities/milestone';
import { EpicSchema, EpicDependencySchema, EpicCompletionRecordSchema } from './entities/epic';
import { TaskSchema, SubtaskSchema, TaskAttachmentSchema, TaskResourceRefSchema } from './entities/task';
import { BlockerSchema, TaskDependencySchema } from './entities/blocker';
import { PatternContractSchema, PatternContractVersionSchema, PatternDependencySchema } from './entities/pattern';
import { VerificationSchema, VerificationAttemptSchema } from './entities/verification';
import { WorkIntervalSchema, CompletionRecordSchema } from './entities/tracking';
import { SessionLogSchema, PhaseCompletionRecordSchema } from './entities/session';
import { DecisionSchema } from './entities/decision';
import { QuestionSchema } from './entities/question';
import { RiskSchema } from './entities/risk';
import { ChangeRequestSchema, ScopeChangeSchema, AbandonmentRecordSchema } from './entities/change';

export const SCHEMA_MAP: Record<string, TObject> = {
  project: ProjectSchema,
  project_completion_record: ProjectCompletionRecordSchema,
  goal: GoalSchema,
  goal_completion_record: GoalCompletionRecordSchema,
  goal_epic_map: GoalEpicMapSchema,
  tech_stack_entry: TechStackEntrySchema,
  shared_doc_ref: SharedDocRefSchema,
  rule: RuleSchema,
  convention: ConventionSchema,
  milestone: MilestoneSchema,
  milestone_review_record: MilestoneReviewRecordSchema,
  epic: EpicSchema,
  epic_dependency: EpicDependencySchema,
  epic_completion_record: EpicCompletionRecordSchema,
  task: TaskSchema,
  subtask: SubtaskSchema,
  task_attachment: TaskAttachmentSchema,
  task_resource_ref: TaskResourceRefSchema,
  blocker: BlockerSchema,
  task_dependency: TaskDependencySchema,
  pattern_contract: PatternContractSchema,
  pattern_contract_version: PatternContractVersionSchema,
  pattern_dependency: PatternDependencySchema,
  verification: VerificationSchema,
  verification_attempt: VerificationAttemptSchema,
  work_interval: WorkIntervalSchema,
  completion_record: CompletionRecordSchema,
  session_log: SessionLogSchema,
  phase_completion_record: PhaseCompletionRecordSchema,
  decision: DecisionSchema,
  question: QuestionSchema,
  risk: RiskSchema,
  change_request: ChangeRequestSchema,
  scope_change: ScopeChangeSchema,
  abandonment_record: AbandonmentRecordSchema,
};

export const COLLECTION_NAMES: string[] = Object.keys(SCHEMA_MAP);
