# Build Plan: Database Module

**Date:** 2026-02-28  
**Depends on:** [RESEARCH-DATA-STORE.md](RESEARCH-DATA-STORE.md)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      TOOLS LAYER                        │
│  (pi extension tools: task-tool, epic-tool, risk-tool)  │
│                                                         │
│  Uses: db.tasks.findByEpic("EPIC-01")                  │
│        db.tasks.search("auth related", 5)               │
│        db.tasks.update("TASK-01", { status: "active" }) │
└──────────────────────┬──────────────────────────────────┘
                       │
          ─ ─ ─ ─ ─ ─ ▼ ─ ─ ─ ─ ─ ─
         │  DATABASE PUBLIC API (db)  │   ← One import, all tools use this
          ─ ─ ─ ─ ─ ─ ┬ ─ ─ ─ ─ ─ ─
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌────────┐    ┌──────────────┐    ┌────────────┐
│ Query  │    │  Repository  │    │  Semantic   │
│ Engine │    │   Layer      │    │  Search     │
│        │    │              │    │             │
│ where  │    │ CRUD per     │    │ embed()     │
│ sort   │    │ entity type  │    │ search()    │
│ select │    │ validate     │    │ sync        │
│ join   │    │ emit events  │    │ staleness   │
└───┬────┘    └──────┬───────┘    └──────┬──────┘
    │                │                   │
    │         ┌──────┼───────┐           │
    │         ▼      ▼       ▼           │
    │     ┌──────────────────────┐       │
    │     │   Schema Registry    │       │
    │     │   (Zod definitions)  │       │
    │     └──────────────────────┘       │
    │                │                   │
    ▼                ▼                   ▼
┌────────────────────────────────────────────┐
│         STORAGE ADAPTER (interface)         │  ← Swappable
├────────────────────────────────────────────┤
│ impl: JsonlStorageAdapter                  │  ← Default: JSONL files
│ impl: (future) SqliteStorageAdapter        │
│ impl: (future) MemoryStorageAdapter        │  ← For tests
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│       EMBEDDING ADAPTER (interface)         │  ← Swappable
├────────────────────────────────────────────┤
│ impl: TransformersEmbeddingAdapter         │  ← Default: local HF model
│ impl: (future) OpenAIEmbeddingAdapter      │
│ impl: (future) NoOpEmbeddingAdapter        │  ← For tests (skip vectors)
└────────────────────────────────────────────┘
```

---

## Module Breakdown — 8 Build Steps

### Step 1: Schema Registry

**What:** Zod schemas for all 30 entities, plus enum definitions, plus relationship metadata.

**Files:**
```
src/db/
  schema/
    enums.ts              # All enum types (status, priority, delegation, etc.)
    entities/
      project.ts          # ProjectSchema, ProjectCompletionRecordSchema
      goal.ts             # GoalSchema, GoalCompletionRecordSchema, GoalEpicMapSchema
      resources.ts        # TechStackEntrySchema, SharedDocRefSchema, RuleSchema, ConventionSchema
      milestone.ts        # MilestoneSchema, MilestoneReviewRecordSchema
      epic.ts             # EpicSchema, EpicDependencySchema, EpicCompletionRecordSchema
      task.ts             # TaskSchema, SubtaskSchema, TaskAttachmentSchema, TaskResourceRefSchema
      blocker.ts          # BlockerSchema, TaskDependencySchema
      pattern.ts          # PatternContractSchema, PatternContractVersionSchema, PatternDependencySchema
      verification.ts     # VerificationSchema, VerificationAttemptSchema
      tracking.ts         # WorkIntervalSchema, CompletionRecordSchema
      session.ts          # SessionLogSchema, PhaseCompletionRecordSchema
      decision.ts         # DecisionSchema, QuestionSchema
      risk.ts             # RiskSchema
      change.ts           # ChangeRequestSchema, ScopeChangeSchema, AbandonmentRecordSchema
    index.ts              # Re-exports everything, EntityType union, schema lookup map
    relationships.ts      # FK definitions: { entity, field, references: { entity, field } }[]
    transitions.ts        # Valid status transitions per entity (from reference.md table)
```

**Key design:**
```typescript
// enums.ts
export const TaskStatus = z.enum([
  'pending', 'active', 'blocked', 'needs_review', 'in_review', 'done', 'cancelled'
]);
export type TaskStatus = z.infer<typeof TaskStatus>;

// entities/task.ts
export const TaskSchema = z.object({
  id: z.string(),
  epic_id: z.string(),
  name: z.string(),
  status: TaskStatus,
  priority: Priority,
  estimate: z.string().optional(),
  delegation: DelegationLevel,
  goal_statement: z.string(),
  context: z.string().optional(),
  research_date: z.string().optional(),      // ISO date
  acceptance_criteria: z.string(),
  affected_files: z.string().optional(),
  notes: z.string().optional(),
  // Embedding tracking (injected by DB layer, not user-facing)
  _embed_hash: z.string().optional(),
  _embed_ver: z.number().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// relationships.ts
export const RELATIONSHIPS = [
  { from: 'task', field: 'epic_id', to: 'epic', field: 'id', cardinality: 'many-to-one' },
  { from: 'subtask', field: 'task_id', to: 'task', field: 'id', cardinality: 'many-to-one' },
  { from: 'goal_epic_map', field: 'goal_id', to: 'goal', field: 'id', cardinality: 'many-to-many' },
  { from: 'goal_epic_map', field: 'epic_id', to: 'epic', field: 'id', cardinality: 'many-to-many' },
  // ... all FKs from ER diagram
] as const;

// transitions.ts
export const TASK_TRANSITIONS: Transition[] = [
  { from: 'pending',      to: 'active',       precondition: 'all_hard_deps_satisfied' },
  { from: 'pending',      to: 'blocked',      precondition: null },
  { from: 'pending',      to: 'needs_review', precondition: null },
  { from: 'pending',      to: 'cancelled',    precondition: 'human_authorized' },
  { from: 'active',       to: 'in_review',    precondition: 'all_subtasks_done' },
  { from: 'active',       to: 'blocked',      precondition: null },
  { from: 'active',       to: 'cancelled',    precondition: 'human_authorized' },
  { from: 'blocked',      to: 'active',       precondition: 'blocker_resolved' },
  { from: 'blocked',      to: 'cancelled',    precondition: 'human_authorized' },
  { from: 'needs_review', to: 'pending',      precondition: 'review_record_written' },
  { from: 'in_review',    to: 'done',         precondition: 'human_approved' },
  { from: 'in_review',    to: 'active',       precondition: null },
];
```

**Test:** Unit tests validate all schemas parse valid data and reject invalid data. Transition table is exhaustive against reference.md.

---

### Step 2: Storage Adapter Interface + JSONL Implementation

**What:** Abstract storage interface that knows nothing about entity semantics. Just reads/writes collections of JSON records.

**Files:**
```
src/db/
  storage/
    adapter.ts            # StorageAdapter interface
    jsonl-adapter.ts      # JSONL file implementation
    memory-adapter.ts     # In-memory implementation (for tests)
```

**Interface:**
```typescript
// adapter.ts
export interface StorageAdapter {
  /** Load all records for a collection (entity type) */
  loadCollection(name: string): Promise<Record<string, unknown>[]>;
  
  /** Save all records for a collection (full rewrite) */
  saveCollection(name: string, records: Record<string, unknown>[]): Promise<void>;
  
  /** Check if a collection exists */
  hasCollection(name: string): Promise<boolean>;
  
  /** List all collection names */
  listCollections(): Promise<string[]>;
  
  /** Delete a collection */
  deleteCollection(name: string): Promise<void>;
}
```

**JSONL implementation:**
```typescript
// jsonl-adapter.ts
export class JsonlStorageAdapter implements StorageAdapter {
  constructor(private baseDir: string) {}
  
  async loadCollection(name: string): Promise<Record<string, unknown>[]> {
    const filePath = path.join(this.baseDir, `${name}.jsonl`);
    if (!await exists(filePath)) return [];
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
  
  async saveCollection(name: string, records: Record<string, unknown>[]): Promise<void> {
    const filePath = path.join(this.baseDir, `${name}.jsonl`);
    const tmpPath = filePath + '.tmp';
    const content = records.map(r => JSON.stringify(r)).join('\n') + '\n';
    await fs.writeFile(tmpPath, content);
    await fs.rename(tmpPath, filePath);  // Atomic
  }
}
```

**Memory implementation (tests):**
```typescript
export class MemoryStorageAdapter implements StorageAdapter {
  private collections = new Map<string, Record<string, unknown>[]>();
  // ... trivial Map-based implementation
}
```

**Test:** Round-trip test — save collection → load collection → records match. Atomic write test — crash mid-write doesn't corrupt. Empty collection returns [].

---

### Step 3: Embedding Adapter Interface + Local Implementation

**What:** Abstract embedding generation. Swappable between local model, remote API, or no-op.

**Files:**
```
src/db/
  embedding/
    adapter.ts                # EmbeddingAdapter interface
    transformers-adapter.ts   # @huggingface/transformers local implementation
    noop-adapter.ts           # Returns zero vectors (for tests / no-embedding mode)
    config.ts                 # Embedding model config, version tracking
```

**Interface:**
```typescript
// adapter.ts
export interface EmbeddingAdapter {
  /** Generate embedding vector for text */
  embed(text: string): Promise<number[]>;
  
  /** Batch embed multiple texts (more efficient for bulk operations) */
  embedBatch(texts: string[]): Promise<number[][]>;
  
  /** Number of dimensions the model produces */
  readonly dimensions: number;
  
  /** Model version identifier (for staleness tracking) */
  readonly modelVersion: number;
  
  /** Initialize / warm up the model (may download on first use) */
  initialize(): Promise<void>;
  
  /** Cleanup resources */
  dispose(): Promise<void>;
}
```

**Local implementation:**
```typescript
// transformers-adapter.ts
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

export class TransformersEmbeddingAdapter implements EmbeddingAdapter {
  private extractor: FeatureExtractionPipeline | null = null;
  readonly dimensions = 384;
  readonly modelVersion = 1;
  
  constructor(private modelName = 'sentence-transformers/all-MiniLM-L6-v2') {}
  
  async initialize() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
  }
  
  async embed(text: string): Promise<number[]> {
    await this.initialize();
    const output = await this.extractor!(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    // Process sequentially to avoid memory spikes; pipeline handles batching internally
    return Promise.all(texts.map(t => this.embed(t)));
  }
  
  async dispose() { this.extractor = null; }
}
```

**No-op implementation (tests):**
```typescript
export class NoOpEmbeddingAdapter implements EmbeddingAdapter {
  readonly dimensions = 384;
  readonly modelVersion = 0;
  async initialize() {}
  async embed(_text: string) { return new Array(384).fill(0); }
  async embedBatch(texts: string[]) { return texts.map(() => new Array(384).fill(0)); }
  async dispose() {}
}
```

**Config — which fields to embed per entity:**
```typescript
// config.ts
export const EMBEDDING_CONFIG: Record<string, { fields: string[]; separator: string }> = {
  task:        { fields: ['name', 'goal_statement', 'context', 'acceptance_criteria'], separator: ' | ' },
  decision:    { fields: ['title', 'context', 'decision', 'rationale'],               separator: ' | ' },
  risk:        { fields: ['description', 'impact', 'mitigation'],                     separator: ' | ' },
  session_log: { fields: ['exact_state', 'completed_this_session', 'next_actions'],    separator: ' | ' },
  question:    { fields: ['description', 'options'],                                   separator: ' | ' },
};

export function getEmbeddingText(entityType: string, record: Record<string, unknown>): string | null {
  const config = EMBEDDING_CONFIG[entityType];
  if (!config) return null; // Entity type not embedded
  return config.fields.map(f => record[f] ?? '').join(config.separator).trim() || null;
}
```

**Test:** Embedding adapter returns correct dimensions. Staleness detection works. NoOp returns zero vectors. Config produces expected concatenations.

---

### Step 4: Repository Layer (CRUD + Validation + Events)

**What:** One Repository class per entity type. Handles CRUD, schema validation, FK checks, transition validation, and emits mutation events.

**Files:**
```
src/db/
  repository/
    base-repository.ts    # Generic base: load, save, find, insert, update, delete
    repositories.ts       # All concrete repositories (thin wrappers adding entity-specific logic)
    events.ts             # Mutation event types
```

**Base repository:**
```typescript
// base-repository.ts
export class BaseRepository<T extends { id: string }> {
  protected records: Map<string, T> = new Map();
  
  constructor(
    protected collectionName: string,
    protected schema: z.ZodType<T>,
    protected storage: StorageAdapter,
    protected eventBus: EventBus,
  ) {}
  
  /** Load from storage into memory */
  async load(): Promise<void> {
    const raw = await this.storage.loadCollection(this.collectionName);
    this.records.clear();
    for (const record of raw) {
      const parsed = this.schema.parse(record);
      this.records.set(parsed.id, parsed);
    }
  }
  
  /** Flush all records to storage */
  async flush(): Promise<void> {
    const records = Array.from(this.records.values());
    await this.storage.saveCollection(this.collectionName, records as any[]);
  }
  
  // ─── READ ─────────────────────────────────
  
  getById(id: string): T | undefined {
    return this.records.get(id);
  }
  
  getByIdOrThrow(id: string): T {
    const record = this.records.get(id);
    if (!record) throw new EntityNotFoundError(this.collectionName, id);
    return record;
  }
  
  getAll(): T[] {
    return Array.from(this.records.values());
  }
  
  find(predicate: (record: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }
  
  findOne(predicate: (record: T) => boolean): T | undefined {
    return this.getAll().find(predicate);
  }
  
  count(predicate?: (record: T) => boolean): number {
    return predicate ? this.find(predicate).length : this.records.size;
  }
  
  // ─── WRITE (all write-through: memory + storage) ─────
  
  async insert(record: T): Promise<T> {
    const validated = this.schema.parse(record);
    if (this.records.has(validated.id)) {
      throw new DuplicateIdError(this.collectionName, validated.id);
    }
    this.records.set(validated.id, validated);
    await this.flush();
    this.eventBus.emit('entity:inserted', { collection: this.collectionName, record: validated });
    return validated;
  }
  
  async update(id: string, patch: Partial<T>): Promise<T> {
    const existing = this.getByIdOrThrow(id);
    const merged = { ...existing, ...patch };
    const validated = this.schema.parse(merged);
    this.records.set(id, validated);
    await this.flush();
    this.eventBus.emit('entity:updated', {
      collection: this.collectionName, id, previous: existing, current: validated
    });
    return validated;
  }
  
  async delete(id: string): Promise<void> {
    const existing = this.getByIdOrThrow(id);
    this.records.delete(id);
    await this.flush();
    this.eventBus.emit('entity:deleted', { collection: this.collectionName, id, record: existing });
  }
}
```

**Concrete repositories (examples of entity-specific logic):**
```typescript
// repositories.ts

export class TaskRepository extends BaseRepository<Task> {
  constructor(storage: StorageAdapter, eventBus: EventBus) {
    super('tasks', TaskSchema, storage, eventBus);
  }
  
  // ─── Relationship queries ────────────────
  findByEpic(epicId: string): Task[] {
    return this.find(t => t.epic_id === epicId);
  }
  
  findByStatus(status: TaskStatus): Task[] {
    return this.find(t => t.status === status);
  }
  
  findActive(): Task | undefined {
    return this.findOne(t => t.status === 'active');
  }
  
  findBlocked(): Task[] {
    return this.find(t => t.status === 'blocked');
  }
  
  findByPriority(priority: Priority): Task[] {
    return this.find(t => t.priority === priority);
  }
  
  // ─── Status transition with validation ────
  async transition(id: string, newStatus: TaskStatus): Promise<Task> {
    const task = this.getByIdOrThrow(id);
    const valid = TASK_TRANSITIONS.some(
      t => t.from === task.status && t.to === newStatus
    );
    if (!valid) {
      throw new InvalidTransitionError('task', task.status, newStatus);
    }
    return this.update(id, { status: newStatus } as Partial<Task>);
  }
}

export class EpicRepository extends BaseRepository<Epic> {
  constructor(storage: StorageAdapter, eventBus: EventBus) {
    super('epics', EpicSchema, storage, eventBus);
  }
  
  findByMilestone(milestoneId: string): Epic[] {
    return this.find(e => e.milestone_id === milestoneId);
  }
  
  findByStatus(status: EpicStatus): Epic[] {
    return this.find(e => e.status === status);
  }
}

// ... one per entity type, each adding relationship-specific query methods
```

**All repositories needed (30 entity types):**

| Repository | Entity | Key relationship methods |
|---|---|---|
| `ProjectRepository` | Project | `getCurrent()` (single project) |
| `ProjectCompletionRecordRepository` | ProjectCompletionRecord | `findByProject(projectId)` |
| `GoalRepository` | Goal | `findByProject(projectId)`, `findByStatus(status)` |
| `GoalCompletionRecordRepository` | GoalCompletionRecord | `findByGoal(goalId)` |
| `GoalEpicMapRepository` | GoalEpicMap | `findByGoal(goalId)`, `findByEpic(epicId)` |
| `TechStackEntryRepository` | TechStackEntry | `findByProject(projectId)`, `findByCategory(cat)` |
| `SharedDocRefRepository` | SharedDocRef | `findByProject(projectId)` |
| `RuleRepository` | Rule | `findByProject(projectId)` |
| `ConventionRepository` | Convention | `findByProject(projectId)` |
| `MilestoneRepository` | Milestone | `findByProject(projectId)`, `findByStatus(status)` |
| `MilestoneReviewRecordRepository` | MilestoneReviewRecord | `findByMilestone(milestoneId)` |
| `EpicRepository` | Epic | `findByMilestone(milestoneId)`, `findByStatus(status)` |
| `EpicDependencyRepository` | EpicDependency | `findRequires(epicId)`, `findEnables(epicId)` |
| `EpicCompletionRecordRepository` | EpicCompletionRecord | `findByEpic(epicId)` |
| `TaskRepository` | Task | `findByEpic(epicId)`, `findByStatus(status)`, `findActive()`, `transition()` |
| `SubtaskRepository` | Subtask | `findByTask(taskId)`, `findOrdered(taskId)` |
| `TaskAttachmentRepository` | TaskAttachment | `findByTask(taskId)` |
| `TaskResourceRefRepository` | TaskResourceRef | `findByTask(taskId)`, `findByResource(resourceId)` |
| `BlockerRepository` | Blocker | `findByTask(taskId)`, `findUnresolved()`, `findByType(type)` |
| `TaskDependencyRepository` | TaskDependency | `findDependenciesOf(taskId)`, `findDependantsOf(taskId)` |
| `PatternContractRepository` | PatternContract | `findByTask(taskId)`, `findByStatus(status)` |
| `PatternContractVersionRepository` | PatternContractVersion | `findByContract(contractId)`, `findLatest(contractId)` |
| `PatternDependencyRepository` | PatternDependency | `findByTask(taskId)`, `findByContract(contractId)`, `findNeedsReview()` |
| `VerificationRepository` | Verification | `findByTask(taskId)`, `findStale()`, `findByResult(result)` |
| `VerificationAttemptRepository` | VerificationAttempt | `findByVerification(verId)`, `findLatest(verId)` |
| `WorkIntervalRepository` | WorkInterval | `findByTask(taskId)`, `findBySession(sessionId)` |
| `CompletionRecordRepository` | CompletionRecord | `findByTask(taskId)` |
| `SessionLogRepository` | SessionLog | `findByProject(projectId)`, `findLatest()`, `findByEntryNumber(n)` |
| `PhaseCompletionRecordRepository` | PhaseCompletionRecord | `findBySession(sessionId)`, `findByPhase(phaseNumber)` |
| `DecisionRepository` | Decision | `findByProject(projectId)`, `findActive()`, `findByStatus(status)` |
| `QuestionRepository` | Question | `findByProject(projectId)`, `findOpen()`, `findEscalated()` |
| `RiskRepository` | Risk | `findByProject(projectId)`, `findByStatus(status)`, `findOpen()` |
| `ChangeRequestRepository` | ChangeRequest | `findByProject(projectId)`, `findPending()` |
| `ScopeChangeRepository` | ScopeChange | `findByProject(projectId)`, `findByChangeRequest(crId)` |
| `AbandonmentRecordRepository` | AbandonmentRecord | `findByProject(projectId)`, `findByEntity(type, id)` |

**Test:** Insert → getById returns it. Update validates schema. Invalid transition throws. FK queries return correct subsets.

---

### Step 5: Query Engine

**What:** Generic, composable query builder that works over any repository. Tools use this for flexible filtering, sorting, selecting.

**Files:**
```
src/db/
  query/
    query-builder.ts      # Fluent query API
    operators.ts          # Filter operators (eq, ne, gt, lt, in, contains, etc.)
    sort.ts               # Sort comparators
    types.ts              # Query types
```

**API:**
```typescript
// query-builder.ts
export class Query<T> {
  constructor(private source: () => T[]) {}
  
  where(predicate: WherePredicate<T>): Query<T> { ... }
  
  // Typed field-level filters
  whereEq<K extends keyof T>(field: K, value: T[K]): Query<T> { ... }
  whereIn<K extends keyof T>(field: K, values: T[K][]): Query<T> { ... }
  whereNe<K extends keyof T>(field: K, value: T[K]): Query<T> { ... }
  whereContains<K extends keyof T>(field: K, substring: string): Query<T> { ... }
  
  // Sorting
  sortBy<K extends keyof T>(field: K, direction?: 'asc' | 'desc'): Query<T> { ... }
  sortByMultiple(sorts: { field: keyof T; direction: 'asc' | 'desc' }[]): Query<T> { ... }
  
  // Pagination
  limit(n: number): Query<T> { ... }
  offset(n: number): Query<T> { ... }
  
  // Selection (pick fields)
  select<K extends keyof T>(...fields: K[]): Query<Pick<T, K>> { ... }
  
  // Execution
  execute(): T[] { ... }
  first(): T | undefined { ... }
  count(): number { ... }
  exists(): boolean { ... }
  
  // Aggregation
  groupBy<K extends keyof T>(field: K): Map<T[K], T[]> { ... }
  sum<K extends keyof T>(field: K): number { ... }
}

// Usage from tools:
const criticalBlockedTasks = db.tasks.query()
  .whereEq('status', 'blocked')
  .whereEq('priority', 'critical')
  .sortBy('name', 'asc')
  .execute();

const tasksByEpic = db.tasks.query()
  .whereIn('epic_id', ['EPIC-01', 'EPIC-02'])
  .groupBy('epic_id');

const recentSessions = db.sessionLogs.query()
  .sortBy('entry_number', 'desc')
  .limit(5)
  .execute();
```

**Test:** Filter, sort, limit, offset, select, groupBy all produce correct results. Chained queries compose correctly. Empty results return [].

---

### Step 6: Semantic Search Layer

**What:** Manages Vectra indexes, syncs embeddings from repository data, provides search API.

**Files:**
```
src/db/
  search/
    semantic-search.ts    # Main search manager
    sync.ts               # Embedding sync logic (staleness, bulk re-embed)
    types.ts              # Search result types
```

**API:**
```typescript
// semantic-search.ts
export class SemanticSearch {
  private indexes: Map<string, LocalIndex> = new Map();
  
  constructor(
    private baseDir: string,
    private embeddingAdapter: EmbeddingAdapter,
  ) {}
  
  async initialize(): Promise<void> {
    await this.embeddingAdapter.initialize();
    // Create/load Vectra indexes for each embeddable entity type
    for (const entityType of Object.keys(EMBEDDING_CONFIG)) {
      const idx = new LocalIndex(path.join(this.baseDir, entityType));
      if (!await idx.isIndexCreated()) await idx.createIndex();
      this.indexes.set(entityType, idx);
    }
  }
  
  /** Search across one entity type */
  async search(entityType: string, queryText: string, k: number): Promise<SearchResult[]> {
    const vector = await this.embeddingAdapter.embed(queryText);
    const index = this.indexes.get(entityType);
    if (!index) return [];
    const results = await index.queryItems(vector, k);
    return results.map(r => ({
      entityType,
      id: r.item.metadata.id as string,
      score: r.score,
      text: r.item.metadata.text as string,
    }));
  }
  
  /** Search across ALL embeddable entity types */
  async searchAll(queryText: string, k: number): Promise<SearchResult[]> {
    const results = await Promise.all(
      Object.keys(EMBEDDING_CONFIG).map(type => this.search(type, queryText, k))
    );
    return results.flat().sort((a, b) => b.score - a.score).slice(0, k);
  }
  
  /** Upsert a single entity's embedding */
  async upsertEntity(entityType: string, id: string, record: Record<string, unknown>): Promise<void> {
    const text = getEmbeddingText(entityType, record);
    if (!text) return;
    const vector = await this.embeddingAdapter.embed(text);
    const index = this.indexes.get(entityType)!;
    // Remove old if exists, then insert
    await index.deleteItem(id).catch(() => {});
    await index.insertItem({ id, vector, metadata: { id, type: entityType, text } });
  }
  
  /** Remove entity from index */
  async removeEntity(entityType: string, id: string): Promise<void> {
    await this.indexes.get(entityType)?.deleteItem(id).catch(() => {});
  }
}
```

**Sync logic:**
```typescript
// sync.ts — called on cold-start after all repositories loaded
export async function syncEmbeddings(
  repos: RepositoryMap,
  search: SemanticSearch,
  embeddingAdapter: EmbeddingAdapter,
): Promise<{ synced: number; skipped: number }> {
  let synced = 0, skipped = 0;
  
  for (const [entityType, config] of Object.entries(EMBEDDING_CONFIG)) {
    const repo = repos[entityType];
    for (const record of repo.getAll()) {
      const text = getEmbeddingText(entityType, record as any);
      if (!text) { skipped++; continue; }
      
      const hash = sha256(text).slice(0, 8);
      if (record._embed_hash === hash && record._embed_ver === embeddingAdapter.modelVersion) {
        skipped++;
        continue;
      }
      
      await search.upsertEntity(entityType, record.id, record as any);
      await repo.update(record.id, {
        _embed_hash: hash,
        _embed_ver: embeddingAdapter.modelVersion,
      } as any);
      synced++;
    }
  }
  return { synced, skipped };
}
```

**Test:** Embed + search returns relevant results. Staleness detection skips unchanged records. Model version bump triggers full re-embed. Empty index returns [].

---

### Step 7: Database Facade (The Public API)

**What:** Single entry point that wires everything together. This is what tools import.

**Files:**
```
src/db/
  database.ts             # Main Database class
  types.ts                # Shared types, errors
  index.ts                # Public exports
```

**API:**
```typescript
// database.ts
export interface DatabaseConfig {
  dataDir: string;                     // Where JSONL files live
  vectorDir: string;                   // Where Vectra indexes live
  storage?: StorageAdapter;            // Default: JsonlStorageAdapter
  embedding?: EmbeddingAdapter;        // Default: TransformersEmbeddingAdapter
  enableEmbeddings?: boolean;          // Default: true (set false for fast tests)
}

export class Database {
  // ─── Repositories (public, typed) ────────
  readonly projects: ProjectRepository;
  readonly projectCompletionRecords: ProjectCompletionRecordRepository;
  readonly goals: GoalRepository;
  readonly goalCompletionRecords: GoalCompletionRecordRepository;
  readonly goalEpicMap: GoalEpicMapRepository;
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
  
  // ─── Search ──────────────────────────────
  readonly search: SemanticSearch;
  
  // ─── Events ──────────────────────────────
  readonly events: EventBus;
  
  // ─── Lifecycle ───────────────────────────
  
  /** Initialize: load all data from storage, sync embeddings */
  async open(): Promise<void> {
    // 1. Load every repository from storage
    await Promise.all(this.allRepos.map(r => r.load()));
    
    // 2. Sync embeddings (if enabled)
    if (this.config.enableEmbeddings) {
      await this.search.initialize();
      const result = await syncEmbeddings(this.repoMap, this.search, this.embeddingAdapter);
      console.log(`Embeddings: ${result.synced} synced, ${result.skipped} up-to-date`);
    }
    
    // 3. Wire up auto-sync: when entities change, update embeddings
    this.events.on('entity:inserted', ({ collection, record }) => {
      if (collection in EMBEDDING_CONFIG) {
        this.search.upsertEntity(collection, record.id, record);
      }
    });
    this.events.on('entity:updated', ({ collection, id, current }) => {
      if (collection in EMBEDDING_CONFIG) {
        this.search.upsertEntity(collection, id, current);
      }
    });
    this.events.on('entity:deleted', ({ collection, id }) => {
      if (collection in EMBEDDING_CONFIG) {
        this.search.removeEntity(collection, id);
      }
    });
  }
  
  /** Close: dispose embedding model, flush pending writes */
  async close(): Promise<void> {
    await this.embeddingAdapter.dispose();
  }
  
  /** Validate all FK relationships across all loaded data */
  validateIntegrity(): IntegrityReport { ... }
}
```

**Usage from a pi extension tool:**
```typescript
// In a tool handler
const db = await getDatabase();  // Singleton, opened once

// Queries
const epic = db.epics.getByIdOrThrow('EPIC-01');
const tasks = db.tasks.findByEpic('EPIC-01');
const blocked = db.tasks.findBlocked();

// Fluent query
const urgentTasks = db.tasks.query()
  .whereEq('priority', 'critical')
  .whereIn('status', ['pending', 'active'])
  .sortBy('name')
  .execute();

// Semantic search
const related = await db.search.searchAll('authentication flow', 5);

// Mutations
await db.tasks.transition('TASK-01', 'active');
await db.blockers.insert({ id: 'BLK-05', task_id: 'TASK-01', ... });

// Cross-entity operations
const report = db.validateIntegrity();
```

**Test:** Open → close lifecycle works. All repositories accessible. Event-based embedding sync fires. Integrity validation catches orphan FKs.

---

### Step 8: Test Harness + Evaluation Tools

**What:** Test tools that exercise the full database module with realistic data. Verifies performance, correctness, and usability.

**Files:**
```
src/db/
  __tests__/
    schema.test.ts            # All Zod schemas: valid data passes, invalid rejects
    transitions.test.ts       # Status transition table: all valid transitions work, invalid throw
    storage-jsonl.test.ts     # JSONL adapter: round-trip, atomicity, empty collections
    storage-memory.test.ts    # Memory adapter: same tests, proves interface equivalence
    embedding-noop.test.ts    # NoOp adapter: correct dimensions, returns vectors
    embedding-local.test.ts   # Transformers adapter: real embeddings (integration test, slow)
    repository.test.ts        # Base repository: CRUD, validation, events
    repository-task.test.ts   # Task repository: findByEpic, findActive, transition
    repository-all.test.ts    # Every repository: entity-specific query methods
    query.test.ts             # Query builder: where, sort, limit, offset, select, groupBy
    search.test.ts            # Semantic search: upsert, search, staleness sync
    database.test.ts          # Full Database: open, query, mutate, close
    integrity.test.ts         # FK validation: catches orphans, missing refs
    performance.test.ts       # Benchmarks: load 1000 tasks, query, sort, search
    
  __fixtures__/
    seed.ts                   # Generate realistic test data for all 30 entity types
    sample-project.ts         # A complete project with ~50 tasks, 5 epics, etc.
```

**Seed data generator:**
```typescript
// seed.ts
export function generateTestProject(): DatabaseSeed {
  return {
    projects: [{ id: 'PROJ-01', name: 'Test Project', ... }],
    goals: [
      { id: 'GOAL-01', project_id: 'PROJ-01', statement: 'Build auth system', status: 'in_progress' },
      { id: 'GOAL-02', project_id: 'PROJ-01', statement: 'Build API layer', status: 'not_started' },
    ],
    milestones: [
      { id: 'MS-01', project_id: 'PROJ-01', name: 'MVP', status: 'active', ... },
    ],
    epics: [
      { id: 'EPIC-01', project_id: 'PROJ-01', milestone_id: 'MS-01', name: 'Authentication', status: 'active', ... },
      { id: 'EPIC-02', project_id: 'PROJ-01', milestone_id: 'MS-01', name: 'REST API', status: 'pending', ... },
    ],
    tasks: generateTasks(50),  // 50 tasks spread across epics
    subtasks: generateSubtasks(150),
    blockers: generateBlockers(10),
    // ... all 30 entity types
  };
}
```

**Performance benchmark:**
```typescript
// performance.test.ts
test('load 1000 tasks under 100ms', async () => {
  const db = createTestDatabase();
  await seedWith(db, { tasks: generateTasks(1000) });
  
  const start = performance.now();
  await db.open();
  const loadTime = performance.now() - start;
  
  expect(loadTime).toBeLessThan(100);
});

test('query filtered tasks under 5ms', async () => {
  const start = performance.now();
  const result = db.tasks.query()
    .whereEq('status', 'active')
    .whereEq('priority', 'critical')
    .sortBy('name')
    .execute();
  const queryTime = performance.now() - start;
  
  expect(queryTime).toBeLessThan(5);
});

test('semantic search under 50ms', async () => {
  const start = performance.now();
  const results = await db.search.searchAll('authentication', 10);
  const searchTime = performance.now() - start;
  
  expect(searchTime).toBeLessThan(50);
});
```

---

## Build Order & Dependencies

```
Step 1: Schema Registry
  │      (no deps — pure types)
  │
  ├──→ Step 2: Storage Adapters
  │      (no deps on schema — generic JSON)
  │
  ├──→ Step 3: Embedding Adapters
  │      (no deps on schema — generic text→vector)
  │
  ▼
Step 4: Repository Layer
  │      (depends on: Schema + Storage + EventBus)
  │
  ├──→ Step 5: Query Engine
  │      (depends on: Repository — operates on repo data)
  │
  ├──→ Step 6: Semantic Search
  │      (depends on: Embedding Adapter + Repository events)
  │
  ▼
Step 7: Database Facade
  │      (wires: Repos + Query + Search + Events)
  │
  ▼
Step 8: Tests & Evaluation
         (exercises everything)
```

**Steps 1, 2, 3 can be built in parallel** (no dependencies between them).  
**Steps 4, 5, 6 can partly overlap** (5 and 6 depend on 4, but not on each other).  
**Steps 7 and 8 are sequential** (7 first, then 8 tests it).

---

## File Tree Summary

```
src/db/
├── schema/
│   ├── enums.ts
│   ├── entities/
│   │   ├── project.ts
│   │   ├── goal.ts
│   │   ├── resources.ts
│   │   ├── milestone.ts
│   │   ├── epic.ts
│   │   ├── task.ts
│   │   ├── blocker.ts
│   │   ├── pattern.ts
│   │   ├── verification.ts
│   │   ├── tracking.ts
│   │   ├── session.ts
│   │   ├── decision.ts
│   │   ├── risk.ts
│   │   └── change.ts
│   ├── relationships.ts
│   ├── transitions.ts
│   └── index.ts
├── storage/
│   ├── adapter.ts
│   ├── jsonl-adapter.ts
│   └── memory-adapter.ts
├── embedding/
│   ├── adapter.ts
│   ├── transformers-adapter.ts
│   ├── noop-adapter.ts
│   └── config.ts
├── repository/
│   ├── base-repository.ts
│   ├── repositories.ts
│   └── events.ts
├── query/
│   ├── query-builder.ts
│   ├── operators.ts
│   ├── sort.ts
│   └── types.ts
├── search/
│   ├── semantic-search.ts
│   ├── sync.ts
│   └── types.ts
├── database.ts
├── types.ts
├── index.ts
└── __tests__/
    ├── schema.test.ts
    ├── transitions.test.ts
    ├── storage-jsonl.test.ts
    ├── storage-memory.test.ts
    ├── embedding-noop.test.ts
    ├── embedding-local.test.ts
    ├── repository.test.ts
    ├── repository-task.test.ts
    ├── repository-all.test.ts
    ├── query.test.ts
    ├── search.test.ts
    ├── database.test.ts
    ├── integrity.test.ts
    ├── performance.test.ts
    └── __fixtures__/
        ├── seed.ts
        └── sample-project.ts
```

**Total: ~35 source files, ~15 test files, 0 native dependencies.**
