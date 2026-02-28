/**
 * @module db/database
 * @description Database facade — single entry point for all database operations.
 *
 * Wires together repositories, query engine, semantic search, and storage.
 * Exposes all 35 repositories as typed readonly properties, plus search and events.
 *
 * Lifecycle: new Database(config) → open() → use → close()
 *
 * Related:
 *   - BaseRepository (repository/base-repository.ts): CRUD layer
 *   - repositories.ts: all 35 concrete repositories
 *   - SemanticSearch (search/semantic-search.ts): vector search
 *   - syncEmbeddings (search/sync.ts): cold-start sync
 *   - StorageAdapter (storage/adapter.ts): persistence
 *   - EmbeddingAdapter (embedding/adapter.ts): vector generation
 */

import type { StorageAdapter } from './storage/adapter';
import type { EmbeddingAdapter } from './embedding/adapter';
import { JsonlStorageAdapter } from './storage/jsonl-adapter';
import { TransformersEmbeddingAdapter } from './embedding/transformers-adapter';
import { NoopEmbeddingAdapter } from './embedding/noop-adapter';
import { EventBus } from './repository/events';
import { SemanticSearch } from './search/semantic-search';
import { syncEmbeddings } from './search/sync';
import { RELATIONSHIPS } from './schema/relationships';
import { SCHEMA_MAP } from './schema/index';
import type { DatabaseConfig, IntegrityReport, IntegrityViolation } from './types';
import type { BaseRepository } from './repository/base-repository';

import {
  ProjectRepository,
  ProjectCompletionRecordRepository,
  GoalRepository,
  GoalCompletionRecordRepository,
  GoalEpicMapRepository,
  TechStackEntryRepository,
  SharedDocRefRepository,
  RuleRepository,
  ConventionRepository,
  MilestoneRepository,
  MilestoneReviewRecordRepository,
  EpicRepository,
  EpicDependencyRepository,
  EpicCompletionRecordRepository,
  TaskRepository,
  SubtaskRepository,
  TaskAttachmentRepository,
  TaskResourceRefRepository,
  BlockerRepository,
  TaskDependencyRepository,
  PatternContractRepository,
  PatternContractVersionRepository,
  PatternDependencyRepository,
  VerificationRepository,
  VerificationAttemptRepository,
  WorkIntervalRepository,
  CompletionRecordRepository,
  SessionLogRepository,
  PhaseCompletionRecordRepository,
  DecisionRepository,
  QuestionRepository,
  RiskRepository,
  ChangeRequestRepository,
  ScopeChangeRepository,
  AbandonmentRecordRepository,
} from './repository/repositories';

/**
 * Maps SCHEMA_MAP entity type names to repository collection names.
 * Entity types use snake_case singular (e.g. "task"), collection names
 * use snake_case plural (e.g. "tasks").
 */
const ENTITY_TO_COLLECTION: Record<string, string> = {
  project: 'projects',
  project_completion_record: 'project_completion_records',
  goal: 'goals',
  goal_completion_record: 'goal_completion_records',
  goal_epic_map: 'goal_epic_maps',
  tech_stack_entry: 'tech_stack_entries',
  shared_doc_ref: 'shared_doc_refs',
  rule: 'rules',
  convention: 'conventions',
  milestone: 'milestones',
  milestone_review_record: 'milestone_review_records',
  epic: 'epics',
  epic_dependency: 'epic_dependencies',
  epic_completion_record: 'epic_completion_records',
  task: 'tasks',
  subtask: 'subtasks',
  task_attachment: 'task_attachments',
  task_resource_ref: 'task_resource_refs',
  blocker: 'blockers',
  task_dependency: 'task_dependencies',
  pattern_contract: 'pattern_contracts',
  pattern_contract_version: 'pattern_contract_versions',
  pattern_dependency: 'pattern_dependencies',
  verification: 'verifications',
  verification_attempt: 'verification_attempts',
  work_interval: 'work_intervals',
  completion_record: 'completion_records',
  session_log: 'session_logs',
  phase_completion_record: 'phase_completion_records',
  decision: 'decisions',
  question: 'questions',
  risk: 'risks',
  change_request: 'change_requests',
  scope_change: 'scope_changes',
  abandonment_record: 'abandonment_records',
};

/**
 * Database facade — the public API for all consumers.
 *
 * Usage:
 *   const db = new Database({ dataDir: '.project/database', vectorDir: '.project/database/vectors' });
 *   await db.open();
 *   const tasks = db.tasks.findActive();
 *   const results = await db.search.searchAll('authentication', 5);
 *   await db.close();
 */
export class Database {
  /** Event bus for mutation notifications. */
  readonly events: EventBus;
  /** Semantic search engine (null if embeddings disabled). */
  readonly search: SemanticSearch | null;

  // ─── All 35 repositories ───────────────────────────────────────
  readonly projects: ProjectRepository;
  readonly projectCompletionRecords: ProjectCompletionRecordRepository;
  readonly goals: GoalRepository;
  readonly goalCompletionRecords: GoalCompletionRecordRepository;
  readonly goalEpicMaps: GoalEpicMapRepository;
  readonly techStackEntries: TechStackEntryRepository;
  readonly sharedDocRefs: SharedDocRefRepository;
  readonly rules: RuleRepository;
  readonly conventions: ConventionRepository;
  readonly milestones: MilestoneRepository;
  readonly milestoneReviewRecords: MilestoneReviewRecordRepository;
  readonly epics: EpicRepository;
  readonly epicDependencies: EpicDependencyRepository;
  readonly epicCompletionRecords: EpicCompletionRecordRepository;
  readonly tasks: TaskRepository;
  readonly subtasks: SubtaskRepository;
  readonly taskAttachments: TaskAttachmentRepository;
  readonly taskResourceRefs: TaskResourceRefRepository;
  readonly blockers: BlockerRepository;
  readonly taskDependencies: TaskDependencyRepository;
  readonly patternContracts: PatternContractRepository;
  readonly patternContractVersions: PatternContractVersionRepository;
  readonly patternDependencies: PatternDependencyRepository;
  readonly verifications: VerificationRepository;
  readonly verificationAttempts: VerificationAttemptRepository;
  readonly workIntervals: WorkIntervalRepository;
  readonly completionRecords: CompletionRecordRepository;
  readonly sessionLogs: SessionLogRepository;
  readonly phaseCompletionRecords: PhaseCompletionRecordRepository;
  readonly decisions: DecisionRepository;
  readonly questions: QuestionRepository;
  readonly risks: RiskRepository;
  readonly changeRequests: ChangeRequestRepository;
  readonly scopeChanges: ScopeChangeRepository;
  readonly abandonmentRecords: AbandonmentRecordRepository;

  /** Storage adapter. */
  private readonly storage: StorageAdapter;
  /** Embedding adapter (if enabled). */
  private readonly embedding: EmbeddingAdapter | null;
  /** Whether embeddings are enabled. */
  private readonly embeddingsEnabled: boolean;
  /** Optional progress callback for embedding operations. */
  private readonly onEmbeddingProgress: import('./types').EmbeddingProgressCallback | undefined;
  /** All repositories as an array for bulk operations. */
  private readonly allRepos: BaseRepository<Record<string, unknown>>[];
  /** Map of collection name → repository for integrity checks. */
  private readonly reposByCollection: Map<string, BaseRepository<Record<string, unknown>>>;

  constructor(config: DatabaseConfig) {
    this.events = new EventBus();
    this.embeddingsEnabled = config.enableEmbeddings !== false;
    this.onEmbeddingProgress = config.onEmbeddingProgress;

    // Storage
    this.storage = config.storage ?? new JsonlStorageAdapter(config.dataDir);

    // Embedding
    if (this.embeddingsEnabled) {
      this.embedding = config.embedding ?? new TransformersEmbeddingAdapter();
      this.search = new SemanticSearch(config.vectorDir, this.embedding, this.events);
    } else {
      this.embedding = null;
      this.search = null;
    }

    // Instantiate all repositories
    const s = this.storage;
    const e = this.events;

    this.projects = new ProjectRepository(s, e);
    this.projectCompletionRecords = new ProjectCompletionRecordRepository(s, e);
    this.goals = new GoalRepository(s, e);
    this.goalCompletionRecords = new GoalCompletionRecordRepository(s, e);
    this.goalEpicMaps = new GoalEpicMapRepository(s, e);
    this.techStackEntries = new TechStackEntryRepository(s, e);
    this.sharedDocRefs = new SharedDocRefRepository(s, e);
    this.rules = new RuleRepository(s, e);
    this.conventions = new ConventionRepository(s, e);
    this.milestones = new MilestoneRepository(s, e);
    this.milestoneReviewRecords = new MilestoneReviewRecordRepository(s, e);
    this.epics = new EpicRepository(s, e);
    this.epicDependencies = new EpicDependencyRepository(s, e);
    this.epicCompletionRecords = new EpicCompletionRecordRepository(s, e);
    this.tasks = new TaskRepository(s, e);
    this.subtasks = new SubtaskRepository(s, e);
    this.taskAttachments = new TaskAttachmentRepository(s, e);
    this.taskResourceRefs = new TaskResourceRefRepository(s, e);
    this.blockers = new BlockerRepository(s, e);
    this.taskDependencies = new TaskDependencyRepository(s, e);
    this.patternContracts = new PatternContractRepository(s, e);
    this.patternContractVersions = new PatternContractVersionRepository(s, e);
    this.patternDependencies = new PatternDependencyRepository(s, e);
    this.verifications = new VerificationRepository(s, e);
    this.verificationAttempts = new VerificationAttemptRepository(s, e);
    this.workIntervals = new WorkIntervalRepository(s, e);
    this.completionRecords = new CompletionRecordRepository(s, e);
    this.sessionLogs = new SessionLogRepository(s, e);
    this.phaseCompletionRecords = new PhaseCompletionRecordRepository(s, e);
    this.decisions = new DecisionRepository(s, e);
    this.questions = new QuestionRepository(s, e);
    this.risks = new RiskRepository(s, e);
    this.changeRequests = new ChangeRequestRepository(s, e);
    this.scopeChanges = new ScopeChangeRepository(s, e);
    this.abandonmentRecords = new AbandonmentRecordRepository(s, e);

    // Build lookup structures
    this.allRepos = [
      this.projects, this.projectCompletionRecords, this.goals, this.goalCompletionRecords,
      this.goalEpicMaps, this.techStackEntries, this.sharedDocRefs, this.rules, this.conventions,
      this.milestones, this.milestoneReviewRecords, this.epics, this.epicDependencies,
      this.epicCompletionRecords, this.tasks, this.subtasks, this.taskAttachments,
      this.taskResourceRefs, this.blockers, this.taskDependencies, this.patternContracts,
      this.patternContractVersions, this.patternDependencies, this.verifications,
      this.verificationAttempts, this.workIntervals, this.completionRecords, this.sessionLogs,
      this.phaseCompletionRecords, this.decisions, this.questions, this.risks,
      this.changeRequests, this.scopeChanges, this.abandonmentRecords,
    ] as BaseRepository<Record<string, unknown>>[];

    this.reposByCollection = new Map();
    const repoEntries: [string, BaseRepository<Record<string, unknown>>][] = [
      ['projects', this.projects], ['project_completion_records', this.projectCompletionRecords],
      ['goals', this.goals], ['goal_completion_records', this.goalCompletionRecords],
      ['goal_epic_maps', this.goalEpicMaps], ['tech_stack_entries', this.techStackEntries],
      ['shared_doc_refs', this.sharedDocRefs], ['rules', this.rules], ['conventions', this.conventions],
      ['milestones', this.milestones], ['milestone_review_records', this.milestoneReviewRecords],
      ['epics', this.epics], ['epic_dependencies', this.epicDependencies],
      ['epic_completion_records', this.epicCompletionRecords], ['tasks', this.tasks],
      ['subtasks', this.subtasks], ['task_attachments', this.taskAttachments],
      ['task_resource_refs', this.taskResourceRefs], ['blockers', this.blockers],
      ['task_dependencies', this.taskDependencies], ['pattern_contracts', this.patternContracts],
      ['pattern_contract_versions', this.patternContractVersions],
      ['pattern_dependencies', this.patternDependencies], ['verifications', this.verifications],
      ['verification_attempts', this.verificationAttempts], ['work_intervals', this.workIntervals],
      ['completion_records', this.completionRecords], ['session_logs', this.sessionLogs],
      ['phase_completion_records', this.phaseCompletionRecords], ['decisions', this.decisions],
      ['questions', this.questions], ['risks', this.risks], ['change_requests', this.changeRequests],
      ['scope_changes', this.scopeChanges], ['abandonment_records', this.abandonmentRecords],
    ];
    for (const [name, repo] of repoEntries) {
      this.reposByCollection.set(name, repo as BaseRepository<Record<string, unknown>>);
    }
  }

  /**
   * Open the database: load all repositories, initialize search, sync embeddings.
   */
  async open(): Promise<void> {
    // Load all repositories from storage
    await Promise.all(this.allRepos.map(r => r.load()));

    // Initialize and sync search
    if (this.search) {
      this.onEmbeddingProgress?.({ phase: 'init' });
      await this.search.initialize();

      const embeddableRepos: Record<string, BaseRepository<Record<string, unknown>>> = {
        task: this.tasks as BaseRepository<Record<string, unknown>>,
        decision: this.decisions as BaseRepository<Record<string, unknown>>,
        risk: this.risks as BaseRepository<Record<string, unknown>>,
        session_log: this.sessionLogs as BaseRepository<Record<string, unknown>>,
        question: this.questions as BaseRepository<Record<string, unknown>>,
      };

      await syncEmbeddings(
        this.search,
        embeddableRepos,
        async (entityType, id, patch) => {
          const collName = ENTITY_TO_COLLECTION[entityType];
          if (!collName) return;
          const repo = this.reposByCollection.get(collName);
          if (!repo) return;
          await repo.update(id, patch);
        },
        this.onEmbeddingProgress,
      );

      this.onEmbeddingProgress?.({ phase: 'done' });
    }
  }

  /**
   * Close the database: dispose embedding adapter, clear events.
   */
  async close(): Promise<void> {
    if (this.search) {
      await this.search.dispose();
    }
    if (this.embedding) {
      await this.embedding.dispose();
    }
    this.events.clear();
  }

  /**
   * Validate FK integrity across all repositories.
   * Checks every relationship defined in RELATIONSHIPS against actual data.
   * @returns IntegrityReport with valid flag and list of violations.
   */
  validateIntegrity(): IntegrityReport {
    const violations: IntegrityViolation[] = [];

    for (const rel of RELATIONSHIPS) {
      const fromCollName = ENTITY_TO_COLLECTION[rel.from];
      const toCollName = ENTITY_TO_COLLECTION[rel.to];
      if (!fromCollName || !toCollName) continue;

      const fromRepo = this.reposByCollection.get(fromCollName);
      const toRepo = this.reposByCollection.get(toCollName);
      if (!fromRepo || !toRepo) continue;

      // Build a set of IDs in the target collection
      const targetIds = new Set(toRepo.getAll().map(r => r[rel.toField] as string));

      // Check each record in the source collection
      for (const record of fromRepo.getAll()) {
        const fkValue = record[rel.fromField] as string | undefined;

        // Skip nullable FKs that are null/undefined
        if (fkValue == null) {
          if ('nullable' in rel && rel.nullable) continue;
          // Non-nullable FK is null — that's a violation
          violations.push({
            fromCollection: fromCollName,
            fromId: (record.id as string) ?? 'unknown',
            fromField: rel.fromField,
            toCollection: toCollName,
            missingId: 'null',
          });
          continue;
        }

        if (!targetIds.has(fkValue)) {
          violations.push({
            fromCollection: fromCollName,
            fromId: (record.id as string) ?? 'unknown',
            fromField: rel.fromField,
            toCollection: toCollName,
            missingId: fkValue,
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
