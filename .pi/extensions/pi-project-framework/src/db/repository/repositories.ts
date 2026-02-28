/**
 * @module repository/repositories
 * @description Concrete repository classes for all 35 entity types.
 *
 * Each repository extends BaseRepository<T> and adds entity-specific query methods
 * (e.g. findByEpic, findByStatus, transition). These methods are thin filters
 * over the in-memory record store.
 *
 * Two special repositories handle composite-key entities (no `id` field):
 *   - GoalEpicMapRepository: keyed by `${goal_id}:${epic_id}`
 *   - TaskResourceRefRepository: keyed by `${task_id}:${resource_id}:${resource_type}`
 *
 * TaskRepository.transition() validates against the transition table in
 * schema/transitions.ts before updating status.
 *
 * Related:
 *   - BaseRepository (base-repository.ts): CRUD + validation + events
 *   - Schema (schema/index.ts): TypeBox schemas and types
 *   - Transitions (schema/transitions.ts): status transition rules
 */

import type { TObject } from '@sinclair/typebox';
import type { StorageAdapter } from '../storage/adapter';
import type { EventBus } from './events';
import { BaseRepository, InvalidTransitionError } from './base-repository';
import { isValidTransition } from '../schema/transitions';

import {
  ProjectSchema, type Project,
  ProjectCompletionRecordSchema, type ProjectCompletionRecord,
  GoalSchema, type Goal,
  GoalCompletionRecordSchema, type GoalCompletionRecord,
  GoalEpicMapSchema, type GoalEpicMap,
  TechStackEntrySchema, type TechStackEntry,
  SharedDocRefSchema, type SharedDocRef,
  RuleSchema, type Rule,
  ConventionSchema, type Convention,
  MilestoneSchema, type Milestone,
  MilestoneReviewRecordSchema, type MilestoneReviewRecord,
  EpicSchema, type Epic,
  EpicDependencySchema, type EpicDependency,
  EpicCompletionRecordSchema, type EpicCompletionRecord,
  TaskSchema, type Task,
  SubtaskSchema, type Subtask,
  TaskAttachmentSchema, type TaskAttachment,
  TaskResourceRefSchema, type TaskResourceRef,
  BlockerSchema, type Blocker,
  TaskDependencySchema, type TaskDependency,
  PatternContractSchema, type PatternContract,
  PatternContractVersionSchema, type PatternContractVersion,
  PatternDependencySchema, type PatternDependency,
  VerificationSchema, type Verification,
  VerificationAttemptSchema, type VerificationAttempt,
  WorkIntervalSchema, type WorkInterval,
  CompletionRecordSchema, type CompletionRecord,
  SessionLogSchema, type SessionLog,
  PhaseCompletionRecordSchema, type PhaseCompletionRecord,
  DecisionSchema, type Decision,
  QuestionSchema, type Question,
  RiskSchema, type Risk,
  ChangeRequestSchema, type ChangeRequest,
  ScopeChangeSchema, type ScopeChange,
  AbandonmentRecordSchema, type AbandonmentRecord,
} from '../schema/index';

// ─── Helper ──────────────────────────────────────────────────────────

/** Standard config for id-based repositories. */
function idConfig<T extends Record<string, unknown>>(
  collectionName: string,
  schema: TObject,
  storage: StorageAdapter,
  events: EventBus,
) {
  return {
    collectionName,
    schema,
    storage,
    events,
    getId: (r: T) => (r as Record<string, unknown>).id as string,
  };
}

// ─── 1. ProjectRepository ────────────────────────────────────────────

export class ProjectRepository extends BaseRepository<Project> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Project>('projects', ProjectSchema, storage, events));
  }

  /** Get the current (usually only) project. Returns first record or undefined. */
  getCurrent(): Project | undefined {
    return this.getAll()[0];
  }
}

// ─── 2. ProjectCompletionRecordRepository ────────────────────────────

export class ProjectCompletionRecordRepository extends BaseRepository<ProjectCompletionRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<ProjectCompletionRecord>('project_completion_records', ProjectCompletionRecordSchema, storage, events));
  }

  /** Find completion record for a project. */
  findByProject(projectId: string): ProjectCompletionRecord | undefined {
    return this.findOne(r => r.project_id === projectId);
  }
}

// ─── 3. GoalRepository ───────────────────────────────────────────────

export class GoalRepository extends BaseRepository<Goal> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Goal>('goals', GoalSchema, storage, events));
  }

  findByProject(projectId: string): Goal[] { return this.find(r => r.project_id === projectId); }
  findByStatus(status: string): Goal[] { return this.find(r => r.status === status); }
}

// ─── 4. GoalCompletionRecordRepository ───────────────────────────────

export class GoalCompletionRecordRepository extends BaseRepository<GoalCompletionRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<GoalCompletionRecord>('goal_completion_records', GoalCompletionRecordSchema, storage, events));
  }

  findByGoal(goalId: string): GoalCompletionRecord | undefined {
    return this.findOne(r => r.goal_id === goalId);
  }
}

// ─── 5. GoalEpicMapRepository ────────────────────────────────────────
// Composite key: goal_id + epic_id (no `id` field)

export class GoalEpicMapRepository extends BaseRepository<GoalEpicMap> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super({
      collectionName: 'goal_epic_maps',
      schema: GoalEpicMapSchema,
      storage,
      events,
      getId: (r: GoalEpicMap) => `${r.goal_id}:${r.epic_id}`,
    });
  }

  findByGoal(goalId: string): GoalEpicMap[] { return this.find(r => r.goal_id === goalId); }
  findByEpic(epicId: string): GoalEpicMap[] { return this.find(r => r.epic_id === epicId); }
}

// ─── 6. TechStackEntryRepository ─────────────────────────────────────

export class TechStackEntryRepository extends BaseRepository<TechStackEntry> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<TechStackEntry>('tech_stack_entries', TechStackEntrySchema, storage, events));
  }

  findByProject(projectId: string): TechStackEntry[] { return this.find(r => r.project_id === projectId); }
  findByCategory(category: string): TechStackEntry[] { return this.find(r => r.category === category); }
}

// ─── 7. SharedDocRefRepository ───────────────────────────────────────

export class SharedDocRefRepository extends BaseRepository<SharedDocRef> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<SharedDocRef>('shared_doc_refs', SharedDocRefSchema, storage, events));
  }

  findByProject(projectId: string): SharedDocRef[] { return this.find(r => r.project_id === projectId); }
}

// ─── 8. RuleRepository ──────────────────────────────────────────────

export class RuleRepository extends BaseRepository<Rule> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Rule>('rules', RuleSchema, storage, events));
  }

  findByProject(projectId: string): Rule[] { return this.find(r => r.project_id === projectId); }
}

// ─── 9. ConventionRepository ─────────────────────────────────────────

export class ConventionRepository extends BaseRepository<Convention> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Convention>('conventions', ConventionSchema, storage, events));
  }

  findByProject(projectId: string): Convention[] { return this.find(r => r.project_id === projectId); }
}

// ─── 10. MilestoneRepository ─────────────────────────────────────────

export class MilestoneRepository extends BaseRepository<Milestone> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Milestone>('milestones', MilestoneSchema, storage, events));
  }

  findByProject(projectId: string): Milestone[] { return this.find(r => r.project_id === projectId); }
  findByStatus(status: string): Milestone[] { return this.find(r => r.status === status); }
}

// ─── 11. MilestoneReviewRecordRepository ─────────────────────────────

export class MilestoneReviewRecordRepository extends BaseRepository<MilestoneReviewRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<MilestoneReviewRecord>('milestone_review_records', MilestoneReviewRecordSchema, storage, events));
  }

  findByMilestone(milestoneId: string): MilestoneReviewRecord | undefined {
    return this.findOne(r => r.milestone_id === milestoneId);
  }
}

// ─── 12. EpicRepository ──────────────────────────────────────────────

export class EpicRepository extends BaseRepository<Epic> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Epic>('epics', EpicSchema, storage, events));
  }

  findByMilestone(milestoneId: string): Epic[] { return this.find(r => r.milestone_id === milestoneId); }
  findByProject(projectId: string): Epic[] { return this.find(r => r.project_id === projectId); }
  findByStatus(status: string): Epic[] { return this.find(r => r.status === status); }
}

// ─── 13. EpicDependencyRepository ────────────────────────────────────

export class EpicDependencyRepository extends BaseRepository<EpicDependency> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<EpicDependency>('epic_dependencies', EpicDependencySchema, storage, events));
  }

  /** Find epics that this epic requires (upstream dependencies). */
  findRequires(epicId: string): EpicDependency[] { return this.find(r => r.enables_epic_id === epicId); }
  /** Find epics that this epic enables (downstream dependents). */
  findEnables(epicId: string): EpicDependency[] { return this.find(r => r.requires_epic_id === epicId); }
}

// ─── 14. EpicCompletionRecordRepository ──────────────────────────────

export class EpicCompletionRecordRepository extends BaseRepository<EpicCompletionRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<EpicCompletionRecord>('epic_completion_records', EpicCompletionRecordSchema, storage, events));
  }

  findByEpic(epicId: string): EpicCompletionRecord | undefined {
    return this.findOne(r => r.epic_id === epicId);
  }
}

// ─── 15. TaskRepository ──────────────────────────────────────────────

export class TaskRepository extends BaseRepository<Task> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Task>('tasks', TaskSchema, storage, events));
  }

  findByEpic(epicId: string): Task[] { return this.find(r => r.epic_id === epicId); }
  findByStatus(status: string): Task[] { return this.find(r => r.status === status); }
  findActive(): Task[] { return this.findByStatus('active'); }
  findByPriority(priority: string): Task[] { return this.find(r => r.priority === priority); }
  findBlocked(): Task[] { return this.findByStatus('blocked'); }

  /**
   * Transition a task to a new status.
   * Validates against the transition table. Throws InvalidTransitionError if not allowed.
   */
  async transition(id: string, newStatus: string): Promise<Task> {
    const task = this.getByIdOrThrow(id);
    if (!isValidTransition('task', task.status, newStatus)) {
      throw new InvalidTransitionError('task', task.status, newStatus);
    }
    return this.update(id, { status: newStatus } as Partial<Task>);
  }
}

// ─── 16. SubtaskRepository ───────────────────────────────────────────

export class SubtaskRepository extends BaseRepository<Subtask> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Subtask>('subtasks', SubtaskSchema, storage, events));
  }

  findByTask(taskId: string): Subtask[] { return this.find(r => r.task_id === taskId); }
  /** Find subtasks for a task, ordered by order_index ascending. */
  findOrdered(taskId: string): Subtask[] {
    return this.findByTask(taskId).sort((a, b) => a.order_index - b.order_index);
  }
}

// ─── 17. TaskAttachmentRepository ────────────────────────────────────

export class TaskAttachmentRepository extends BaseRepository<TaskAttachment> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<TaskAttachment>('task_attachments', TaskAttachmentSchema, storage, events));
  }

  findByTask(taskId: string): TaskAttachment[] { return this.find(r => r.task_id === taskId); }
}

// ─── 18. TaskResourceRefRepository ───────────────────────────────────
// Composite key: task_id + resource_id + resource_type (no `id` field)

export class TaskResourceRefRepository extends BaseRepository<TaskResourceRef> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super({
      collectionName: 'task_resource_refs',
      schema: TaskResourceRefSchema,
      storage,
      events,
      getId: (r: TaskResourceRef) => `${r.task_id}:${r.resource_id}:${r.resource_type}`,
    });
  }

  findByTask(taskId: string): TaskResourceRef[] { return this.find(r => r.task_id === taskId); }
  findByResource(resourceId: string): TaskResourceRef[] { return this.find(r => r.resource_id === resourceId); }
}

// ─── 19. BlockerRepository ───────────────────────────────────────────

export class BlockerRepository extends BaseRepository<Blocker> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Blocker>('blockers', BlockerSchema, storage, events));
  }

  findByTask(taskId: string): Blocker[] { return this.find(r => r.task_id === taskId); }
  findUnresolved(): Blocker[] { return this.find(r => !r.resolved); }
  findByType(type: string): Blocker[] { return this.find(r => r.type === type); }
}

// ─── 20. TaskDependencyRepository ────────────────────────────────────

export class TaskDependencyRepository extends BaseRepository<TaskDependency> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<TaskDependency>('task_dependencies', TaskDependencySchema, storage, events));
  }

  /** Find what this task depends on (upstream). */
  findDependenciesOf(taskId: string): TaskDependency[] { return this.find(r => r.task_id === taskId); }
  /** Find what depends on this task (downstream). */
  findDependantsOf(taskId: string): TaskDependency[] { return this.find(r => r.requires_task_id === taskId); }
}

// ─── 21. PatternContractRepository ───────────────────────────────────

export class PatternContractRepository extends BaseRepository<PatternContract> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<PatternContract>('pattern_contracts', PatternContractSchema, storage, events));
  }

  findByTask(taskId: string): PatternContract[] { return this.find(r => r.establishing_task_id === taskId); }
  findByStatus(status: string): PatternContract[] { return this.find(r => r.status === status); }
}

// ─── 22. PatternContractVersionRepository ────────────────────────────

export class PatternContractVersionRepository extends BaseRepository<PatternContractVersion> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<PatternContractVersion>('pattern_contract_versions', PatternContractVersionSchema, storage, events));
  }

  findByContract(contractId: string): PatternContractVersion[] { return this.find(r => r.contract_id === contractId); }
  /** Find the latest version for a contract (highest version_number). */
  findLatest(contractId: string): PatternContractVersion | undefined {
    const versions = this.findByContract(contractId);
    if (versions.length === 0) return undefined;
    return versions.reduce((a, b) => ((a as Record<string, unknown>).version_number as number) > ((b as Record<string, unknown>).version_number as number) ? a : b);
  }
}

// ─── 23. PatternDependencyRepository ─────────────────────────────────

export class PatternDependencyRepository extends BaseRepository<PatternDependency> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<PatternDependency>('pattern_dependencies', PatternDependencySchema, storage, events));
  }

  findByTask(taskId: string): PatternDependency[] { return this.find(r => r.task_id === taskId); }
  findByContract(contractId: string): PatternDependency[] { return this.find(r => r.contract_id === contractId); }
  findNeedsReview(): PatternDependency[] { return this.find(r => r.review_status === 'needs_review'); }
}

// ─── 24. VerificationRepository ──────────────────────────────────────

export class VerificationRepository extends BaseRepository<Verification> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Verification>('verifications', VerificationSchema, storage, events));
  }

  findByTask(taskId: string): Verification[] { return this.find(r => r.task_id === taskId); }
  findStale(): Verification[] { return this.find(r => r.current_result === 'pending'); }
  findByResult(result: string): Verification[] { return this.find(r => r.current_result === result); }
}

// ─── 25. VerificationAttemptRepository ───────────────────────────────

export class VerificationAttemptRepository extends BaseRepository<VerificationAttempt> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<VerificationAttempt>('verification_attempts', VerificationAttemptSchema, storage, events));
  }

  findByVerification(verificationId: string): VerificationAttempt[] { return this.find(r => r.verification_id === verificationId); }
  /** Find the most recent attempt for a verification (by attempted_at descending). */
  findLatest(verificationId: string): VerificationAttempt | undefined {
    const attempts = this.findByVerification(verificationId);
    if (attempts.length === 0) return undefined;
    return attempts.reduce((a, b) => ((a as Record<string, unknown>).attempted_at as string) > ((b as Record<string, unknown>).attempted_at as string) ? a : b);
  }
}

// ─── 26. WorkIntervalRepository ──────────────────────────────────────

export class WorkIntervalRepository extends BaseRepository<WorkInterval> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<WorkInterval>('work_intervals', WorkIntervalSchema, storage, events));
  }

  findByTask(taskId: string): WorkInterval[] { return this.find(r => r.task_id === taskId); }
  findBySession(sessionId: string): WorkInterval[] { return this.find(r => r.session_log_id === sessionId); }
}

// ─── 27. CompletionRecordRepository ──────────────────────────────────

export class CompletionRecordRepository extends BaseRepository<CompletionRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<CompletionRecord>('completion_records', CompletionRecordSchema, storage, events));
  }

  findByTask(taskId: string): CompletionRecord | undefined {
    return this.findOne(r => r.task_id === taskId);
  }
}

// ─── 28. SessionLogRepository ────────────────────────────────────────

export class SessionLogRepository extends BaseRepository<SessionLog> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<SessionLog>('session_logs', SessionLogSchema, storage, events));
  }

  findByProject(projectId: string): SessionLog[] { return this.find(r => r.project_id === projectId); }
  /** Find the most recent session log (highest entry_number). */
  findLatest(): SessionLog | undefined {
    const all = this.getAll();
    if (all.length === 0) return undefined;
    return all.reduce((a, b) => a.entry_number > b.entry_number ? a : b);
  }
  findByEntryNumber(n: number): SessionLog | undefined {
    return this.findOne(r => r.entry_number === n);
  }
}

// ─── 29. PhaseCompletionRecordRepository ─────────────────────────────

export class PhaseCompletionRecordRepository extends BaseRepository<PhaseCompletionRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<PhaseCompletionRecord>('phase_completion_records', PhaseCompletionRecordSchema, storage, events));
  }

  findBySession(sessionId: string): PhaseCompletionRecord | undefined {
    return this.findOne(r => r.session_log_id === sessionId);
  }
  findByPhase(phaseNumber: number): PhaseCompletionRecord[] {
    return this.find(r => r.phase_number === phaseNumber);
  }
  /** Find the latest phase completion record with gate_status='passed'. */
  findLatestPassed(): PhaseCompletionRecord | undefined {
    const passed = this.find(r => r.gate_status === 'passed');
    if (passed.length === 0) return undefined;
    return passed.reduce((a, b) => a.phase_number > b.phase_number ? a : b);
  }
}

// ─── 30. DecisionRepository ──────────────────────────────────────────

export class DecisionRepository extends BaseRepository<Decision> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Decision>('decisions', DecisionSchema, storage, events));
  }

  findByProject(projectId: string): Decision[] { return this.find(r => r.project_id === projectId); }
  findActive(): Decision[] { return this.findByStatus('active'); }
  findByStatus(status: string): Decision[] { return this.find(r => r.status === status); }
}

// ─── 31. QuestionRepository ──────────────────────────────────────────

export class QuestionRepository extends BaseRepository<Question> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Question>('questions', QuestionSchema, storage, events));
  }

  findByProject(projectId: string): Question[] { return this.find(r => r.project_id === projectId); }
  findOpen(): Question[] { return this.find(r => r.status === 'open'); }
  findEscalated(): Question[] { return this.find(r => r.escalation_flag === true); }
}

// ─── 32. RiskRepository ──────────────────────────────────────────────

export class RiskRepository extends BaseRepository<Risk> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<Risk>('risks', RiskSchema, storage, events));
  }

  findByProject(projectId: string): Risk[] { return this.find(r => r.project_id === projectId); }
  findByStatus(status: string): Risk[] { return this.find(r => r.status === status); }
  findOpen(): Risk[] { return this.findByStatus('open'); }
}

// ─── 33. ChangeRequestRepository ─────────────────────────────────────

export class ChangeRequestRepository extends BaseRepository<ChangeRequest> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<ChangeRequest>('change_requests', ChangeRequestSchema, storage, events));
  }

  findByProject(projectId: string): ChangeRequest[] { return this.find(r => r.project_id === projectId); }
  findPending(): ChangeRequest[] { return this.find(r => r.status === 'pending_review'); }
}

// ─── 34. ScopeChangeRepository ───────────────────────────────────────

export class ScopeChangeRepository extends BaseRepository<ScopeChange> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<ScopeChange>('scope_changes', ScopeChangeSchema, storage, events));
  }

  findByProject(projectId: string): ScopeChange[] { return this.find(r => r.project_id === projectId); }
  findByChangeRequest(crId: string): ScopeChange | undefined {
    return this.findOne(r => r.change_request_id === crId);
  }
}

// ─── 35. AbandonmentRecordRepository ─────────────────────────────────

export class AbandonmentRecordRepository extends BaseRepository<AbandonmentRecord> {
  constructor(storage: StorageAdapter, events: EventBus) {
    super(idConfig<AbandonmentRecord>('abandonment_records', AbandonmentRecordSchema, storage, events));
  }

  findByProject(projectId: string): AbandonmentRecord[] { return this.find(r => r.project_id === projectId); }
  findByEntity(entityType: string, entityId: string): AbandonmentRecord | undefined {
    return this.findOne(r => r.entity_type === entityType && r.entity_id === entityId);
  }
}
