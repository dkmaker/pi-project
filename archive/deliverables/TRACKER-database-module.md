# Database Module — Build Tracker

> **Cold-start instruction:** This file is the single source of truth for building the database module. Read it fully before writing any code. Reference files are listed where needed — read them for field-level detail, but this file contains all decisions, conventions, and step definitions.

---

## Context

**What:** An internal database module that provides typed CRUD, relational queries, semantic search, and schema validation for the ~30 entities defined in the project management framework.

**Why:** This is **foundation infrastructure**. Two temporary debug tools (`db_seed`, `db_query`) are registered for development/testing. Future work will build proper pi extension tools on top of the `Database` class this module exports.

**Where:** All files live under:
```
.pi/extensions/pi-project-framework/src/db/
```
The extension entry point is `.pi/extensions/pi-project-framework/index.ts` — it registers the `prj_questionnaire` tool, initializes the config system, and registers temporary db debug tools (`db_seed`, `db_query`).

---

## Existing Project State

```
.pi/extensions/pi-project-framework/
├── package.json                      # Deps: vectra, @huggingface/transformers, yaml
├── node_modules/                     # npm install'd (gitignored)
├── index.ts                          # Extension entry — questionnaire tool + config init + db tools
└── src/
    ├── config/                       # Shared config system (config.yaml management)
    │   ├── defaults.ts               # DEFAULT_CONFIG, ProjectFrameworkConfig type
    │   ├── config.ts                 # initConfig(), getConfig(), updateConfig(), .gitignore management
    │   └── index.ts                  # Re-exports
    ├── widgets/questionnaire/        # Existing UI widget (unrelated to db module)
    │   ├── index.ts
    │   ├── input.ts
    │   ├── renderer.ts
    │   ├── run.ts
    │   ├── state.ts
    │   └── types.ts
    └── db/
        ├── schema/                   # Step 1: 35 entity schemas, enums, relationships, transitions
        │   ├── enums.ts
        │   ├── entities/             # 14 entity files (project, goal, resources, milestone, epic, task, etc.)
        │   ├── relationships.ts      # 48 FK relationships
        │   ├── transitions.ts        # Status transition rules for 10 entity types
        │   └── index.ts              # Re-exports everything + SCHEMA_MAP (35 entries) + COLLECTION_NAMES
        ├── storage/                  # Step 2: StorageAdapter + JSONL/Memory implementations
        │   ├── adapter.ts            # StorageAdapter interface (5 methods)
        │   ├── jsonl-adapter.ts      # JSONL file impl (atomic writes via tmp+rename)
        │   └── memory-adapter.ts     # In-memory Map impl (deep copies, for tests)
        ├── embedding/                # Step 3: EmbeddingAdapter + Transformers/NoOp + config
        │   ├── adapter.ts            # EmbeddingAdapter interface (embed, embedBatch, init, dispose)
        │   ├── transformers-adapter.ts # all-MiniLM-L6-v2, 384-dim, lazy init
        │   ├── noop-adapter.ts       # Zero vectors, modelVersion=0, for tests
        │   └── config.ts             # EMBEDDING_CONFIG, getEmbeddingText(), computeEmbedHash()
        ├── repository/               # Step 4: BaseRepository + 35 concrete repositories
        │   ├── base-repository.ts    # Generic CRUD, validation, events, query() integration
        │   ├── events.ts             # EventBus (pub/sub for mutation events)
        │   └── repositories.ts       # All 35 concrete repositories with entity-specific queries
        ├── query/                    # Step 5: Fluent query builder
        │   ├── query-builder.ts      # Query<T>: where, sort, limit, offset, select, groupBy, sum
        │   ├── operators.ts          # eq, ne, gt, lt, isIn, contains
        │   ├── sort.ts              # buildComparator, buildMultiComparator
        │   └── types.ts             # SortDirection, SortSpec
        ├── search/                   # Step 6: Vectra-backed semantic search
        │   ├── semantic-search.ts    # SemanticSearch: per-type Vectra indexes, auto-sync via events
        │   ├── sync.ts              # syncEmbeddings(): cold-start bulk sync with progress callback
        │   └── types.ts             # SearchResult
        ├── database.ts               # Step 7: Database facade — wires everything, validateIntegrity()
        ├── types.ts                  # Shared types: DatabaseConfig, errors, EmbeddingProgressCallback
        ├── index.ts                  # Public re-exports
        ├── tools.ts                  # Temporary debug tools: db_seed, db_query (insert/update/delete/find)
        └── __tests__/                # Step 8: 251 tests, all passing
            ├── schema.test.ts        # Schema validation (47 tests)
            ├── transitions.test.ts   # Transition rules (65 tests)
            ├── storage-jsonl.test.ts  # JSONL adapter (9 tests)
            ├── storage-memory.test.ts # Memory adapter (8 tests)
            ├── embedding-noop.test.ts # NoOp adapter + config (12 tests)
            ├── repository.test.ts    # Base CRUD + EventBus (21 tests)
            ├── repository-task.test.ts # Task queries + transitions (19 tests)
            ├── repository-all.test.ts # All 35 repos smoke test (31 tests)
            ├── query.test.ts         # Query builder (25 tests)
            ├── database.test.ts      # Full lifecycle integration (5 tests)
            ├── integrity.test.ts     # FK validation (4 tests)
            ├── performance.test.ts   # Benchmarks (3 tests)
            └── __fixtures__/
                ├── seed.ts           # make*() factories for all 35 entity types
                └── sample-project.ts # Complete synthetic project (8 tasks, 3 epics, etc.)
```

- **No `tsconfig.json` needed** — pi runs TypeScript directly via built-in loader (jiti)
- **No build step** — raw `.ts` files, imported directly
- **Runtime data** lives under `.project/database/` (JSONL files, committed to git)
- **Vector indexes** live under `.project/database/vectors/` (gitignored, regenerated on startup)

---

## Conventions

### Dependencies
- Pi provides these at runtime (import directly, no install): `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@sinclair/typebox`
- Own deps go in `package.json` at `.pi/extensions/pi-project-framework/package.json` with `npm install`

### Schema library: TypeBox (NOT Zod)
The existing extension already uses `@sinclair/typebox` (pi-bundled). **Use TypeBox for all schemas.** Do not add Zod.

TypeBox equivalents:
```typescript
// Instead of z.object / z.string / z.enum:
import { Type, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const TaskStatus = Type.Union([
  Type.Literal('pending'), Type.Literal('active'), Type.Literal('blocked'),
  Type.Literal('needs_review'), Type.Literal('in_review'), Type.Literal('done'),
  Type.Literal('cancelled'),
]);

const TaskSchema = Type.Object({
  id: Type.String(),
  epic_id: Type.String(),
  name: Type.String(),
  status: TaskStatus,
  // ...
});

type Task = Static<typeof TaskSchema>;

// Validation:
Value.Check(TaskSchema, data);        // returns boolean
Value.Decode(TaskSchema, data);       // returns validated T or throws
Value.Errors(TaskSchema, data);       // returns iterator of errors
```

### Code style
- TypeScript, strict types, no `any` except in generic adapter boundaries
- Named exports (no default exports except extension entry point)
- Errors are custom classes extending `Error` (not thrown strings)
- Async where I/O is involved, sync for pure in-memory operations

### Data model source of truth
- **Entity fields + types:** [FRAMEWORK/er-diagram.md](FRAMEWORK/er-diagram.md) — read this for every schema
- **Status transitions:** [FRAMEWORK/reference.md](FRAMEWORK/reference.md) — read for transition table
- **Embedding decisions:** [RESEARCH-DATA-STORE.md](RESEARCH-DATA-STORE.md) — which entities get embedded, staleness tracking

---

## Status Overview

| Step | Name | Status | Blocked By |
|------|------|--------|------------|
| 0 | Project Setup | ✅ Done | — |
| 1 | Schema Registry | ✅ Done | 0 |
| 2 | Storage Adapters | ✅ Done | 0 |
| 3 | Embedding Adapters | ✅ Done | 0 |
| 4 | Repository Layer | ✅ Done | 1, 2 |
| 5 | Query Engine | ✅ Done | 4 |
| 6 | Semantic Search | ✅ Done | 3, 4 |
| 7 | Database Facade | ✅ Done | 4, 5, 6 |
| 8 | Tests & Evaluation | ✅ Done | 7 |

| 9 | Config System | ✅ Done | 0 |
| 10 | Debug Tools | ✅ Done | 7, 9 |

**Legend:** ⏳ Not Started · 🔄 In Progress · ✅ Done · ⛔ Blocked

---

## Step 9: Config System

**Status:** ✅ Done  
**Depends on:** Step 0

**What:** Shared config module that manages `.project/config.yaml` with auto-creation, defaults, and forward-compatible merging.

**Files created:**
```
src/config/
├── defaults.ts    # DEFAULT_CONFIG, ProjectFrameworkConfig type (5 sections)
├── config.ts      # initConfig(), getConfig(), updateConfig(), .gitignore management
└── index.ts       # Re-exports
```

**Config sections:** project, database, embedding, session, delegation.

**Behavior:**
- On extension load: checks `.project/` and `.project/config.yaml`, creates with defaults if missing
- Loads existing config, deep-merges with defaults (new keys auto-appear)
- Writes back merged config so file always has all current keys
- Creates `.project/.gitignore` excluding `database/vectors/` (embedding derived data)
- Singleton cache: `getConfig()` works anywhere after `initConfig()`

**Acceptance criteria:**
- [x] `.project/config.yaml` created with all defaults on first load
- [x] `.project/.gitignore` created with vectors dir excluded
- [x] Existing config merged with new defaults (forward-compatible)
- [x] `getConfig()` returns cached config after init
- [x] `updateConfig()` persists changes immediately
- [x] Database tools read paths from config instead of hardcoding

---

## Step 10: Debug Tools

**Status:** ✅ Done  
**Depends on:** Step 7 (Database), Step 9 (Config)

**What:** Temporary `db_seed` and `db_query` tools registered in the extension for development/testing.

**Files created:**
```
src/db/tools.ts    # registerDbTools() — db_seed + db_query
```

**`db_seed`:** Clears all data (JSONL + vectors), creates fresh Database with embeddings enabled, inserts complete synthetic project (35 entity types), validates FK integrity. Shows embedding progress in TUI status bar.

**`db_query`:** 7 actions:
- `collections` — list all with counts
- `all` — get all records in a collection
- `get` — get record by ID
- `find` — find records where field=value
- `integrity` — run FK validation
- `insert` — add record from JSON string
- `update` — patch record by ID from JSON string
- `delete` — remove record by ID

**Embedding progress:** Database accepts `onEmbeddingProgress` callback. During seed, status bar shows: `🧠 Loading embedding model…` → `🧠 Embedding task 3/13` → `✅ Embeddings synced` (auto-clears after 3s).

**Acceptance criteria:**
- [x] `db_seed` populates all entity types with valid FK integrity
- [x] `db_seed` produces real vectors for 5 embeddable types (13 records)
- [x] `db_query` reads, filters, and inspects all collections
- [x] `db_query` supports insert/update/delete mutations
- [x] Embedding progress shown in TUI status bar
- [x] Tools read config from `.project/config.yaml`

---

## Step 0: Project Setup

**Status:** ✅ Done  
**Depends on:** Nothing

**Actions:**
1. Create `package.json` at `.pi/extensions/pi-project-framework/package.json`:
```json
{
  "name": "pi-project-framework",
  "private": true,
  "dependencies": {
    "vectra": "^0.12.3",
    "@huggingface/transformers": "^3.8.1"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@sinclair/typebox": "*"
  }
}
```
2. Run `npm install` in the extension directory
3. Create directory structure:
```
src/db/
├── schema/
│   ├── enums.ts
│   ├── entities/
│   └── ...
├── storage/
├── embedding/
├── repository/
├── query/
├── search/
├── database.ts
├── types.ts
└── index.ts
```

**Acceptance criteria:**
- [ ] `package.json` exists, `npm install` succeeds
- [ ] `node_modules/vectra` and `node_modules/@huggingface/transformers` exist
- [ ] Directory skeleton created
- [ ] `import { Type } from '@sinclair/typebox'` resolves in any `.ts` file

---

## Step 1: Schema Registry

**Status:** ✅ Done  
**Depends on:** Step 0

**What:** TypeBox schemas for all 30 entities, shared enums, FK relationship map, status transition rules.  
**Read before starting:** [FRAMEWORK/er-diagram.md](FRAMEWORK/er-diagram.md) for every field, [FRAMEWORK/reference.md](FRAMEWORK/reference.md) for transitions.

**Files to create:**
```
src/db/schema/
├── enums.ts
├── entities/
│   ├── project.ts           # ProjectSchema, ProjectCompletionRecordSchema
│   ├── goal.ts              # GoalSchema, GoalCompletionRecordSchema, GoalEpicMapSchema
│   ├── resources.ts         # TechStackEntrySchema, SharedDocRefSchema, RuleSchema, ConventionSchema
│   ├── milestone.ts         # MilestoneSchema, MilestoneReviewRecordSchema
│   ├── epic.ts              # EpicSchema, EpicDependencySchema, EpicCompletionRecordSchema
│   ├── task.ts              # TaskSchema, SubtaskSchema, TaskAttachmentSchema, TaskResourceRefSchema
│   ├── blocker.ts           # BlockerSchema, TaskDependencySchema
│   ├── pattern.ts           # PatternContractSchema, PatternContractVersionSchema, PatternDependencySchema
│   ├── verification.ts      # VerificationSchema, VerificationAttemptSchema
│   ├── tracking.ts          # WorkIntervalSchema, CompletionRecordSchema
│   ├── session.ts           # SessionLogSchema, PhaseCompletionRecordSchema
│   ├── decision.ts          # DecisionSchema, QuestionSchema
│   ├── risk.ts              # RiskSchema
│   └── change.ts            # ChangeRequestSchema, ScopeChangeSchema, AbandonmentRecordSchema
├── relationships.ts
├── transitions.ts
└── index.ts
```

**Enums to define (enums.ts):**
```
ProjectStatus:    not_started | in_progress | complete | on_hold | abandoned
ProjectStage:     uninitialised | phase_1 | phase_2 | phase_3 | phase_4 | complete | abandoned | on_hold
ProjectMode:      normal | change_management | infeasibility_review | phase_gate | awaiting_specialist
GoalStatus:       not_started | in_progress | achieved | abandoned
MilestoneStatus:  pending | active | reached | abandoned
EpicStatus:       pending | active | complete | abandoned
TaskStatus:       pending | active | blocked | needs_review | in_review | done | cancelled
Priority:         critical | high | medium | low
DelegationLevel:  implement | plan | research | human | specialist
TechCategory:     language | runtime | framework | library | database | service | tool
VerificationStatus: unverified | verified | stale
BlockerType:      dependency | decision | external | resource | specialist_routing | verification_failure
DependencyNature: hard | soft
PatternContractStatus: draft | established | changed | superseded
VerificationType: documentation | research | testing | code_review | external_validation
VerificationResult: passed | failed | partial | pending
WorkIntervalTrigger: user_prompt | agent_continuation | command
DecisionStatus:   active | superseded | revisited
QuestionStatus:   open | resolved | deferred | dropped
RiskLikelihood:   high | medium | low
RiskStatus:       open | mitigated | realized | accepted
ChangeRequestStatus: pending_review | approved | rejected
ScopeChangeStatus: pending | applied
AbandonmentDisposition: retained | discarded | archived
PatternReviewStatus: current | needs_review | updated
PhaseGateStatus:  passed | not_passed
```

**Embeddable entities** — these get optional `_embed_hash: Type.Optional(Type.String())` and `_embed_ver: Type.Optional(Type.Number())`:
- `task`, `decision`, `risk`, `session_log`, `question`

**Relationships (relationships.ts):**
Every FK from er-diagram.md as a typed array:
```typescript
export const RELATIONSHIPS = [
  // Project children
  { from: 'goal', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'tech_stack_entry', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'shared_doc_ref', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'rule', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'convention', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'milestone', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'epic', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'epic', fromField: 'milestone_id', to: 'milestone', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'session_log', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'decision', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'question', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'risk', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'change_request', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'scope_change', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'abandonment_record', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'many-to-one' as const },
  // Completion records (1:0-or-1)
  { from: 'project_completion_record', fromField: 'project_id', to: 'project', toField: 'id', cardinality: 'one-to-one' as const },
  { from: 'goal_completion_record', fromField: 'goal_id', to: 'goal', toField: 'id', cardinality: 'one-to-one' as const },
  { from: 'milestone_review_record', fromField: 'milestone_id', to: 'milestone', toField: 'id', cardinality: 'one-to-one' as const },
  { from: 'epic_completion_record', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'one-to-one' as const },
  { from: 'completion_record', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'one-to-one' as const },
  // Goal ↔ Epic (many-to-many)
  { from: 'goal_epic_map', fromField: 'goal_id', to: 'goal', toField: 'id', cardinality: 'many-to-many' as const },
  { from: 'goal_epic_map', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-many' as const },
  // Epic children
  { from: 'epic_dependency', fromField: 'requires_epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'epic_dependency', fromField: 'enables_epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' as const },
  // Task belongs to Epic
  { from: 'task', fromField: 'epic_id', to: 'epic', toField: 'id', cardinality: 'many-to-one' as const },
  // Task children
  { from: 'subtask', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'task_attachment', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'task_resource_ref', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'blocker', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'task_dependency', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'task_dependency', fromField: 'requires_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'pattern_contract', fromField: 'establishing_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'pattern_dependency', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'pattern_dependency', fromField: 'contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'pattern_contract_version', fromField: 'contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'verification', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'verification_attempt', fromField: 'verification_id', to: 'verification', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'work_interval', fromField: 'task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const },
  { from: 'work_interval', fromField: 'session_log_id', to: 'session_log', toField: 'id', cardinality: 'many-to-one' as const },
  // Session log specialization
  { from: 'phase_completion_record', fromField: 'session_log_id', to: 'session_log', toField: 'id', cardinality: 'one-to-one' as const },
  // Change management
  { from: 'scope_change', fromField: 'change_request_id', to: 'change_request', toField: 'id', cardinality: 'one-to-one' as const },
  // Cross-references (nullable FKs)
  { from: 'session_log', fromField: 'active_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'decision', fromField: 'superseded_by_id', to: 'decision', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'question', fromField: 'resulting_decision_id', to: 'decision', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'risk', fromField: 'mitigation_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'change_request', fromField: 'resulting_scope_change_id', to: 'scope_change', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'blocker', fromField: 'blocking_task_id', to: 'task', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
  { from: 'pattern_contract', fromField: 'superseded_by_contract_id', to: 'pattern_contract', toField: 'id', cardinality: 'many-to-one' as const, nullable: true },
] as const;
```

**Transitions (transitions.ts):**
Task transitions (from reference.md):
```
pending      → active        (all hard deps satisfied, no blockers, no needs_review)
pending      → blocked       (blocker identified)
pending      → needs_review  (upstream pattern contract changed)
pending      → cancelled     (human authorized)
active       → in_review     (all subtasks done, verifications passed)
active       → blocked       (blocker discovered)
active       → cancelled     (human authorized)
blocked      → active        (blocker resolved)
blocked      → cancelled     (human authorized)
needs_review → pending       (review record written)
in_review    → done          (human approved)
in_review    → active        (verification failed or human revision)
```
Also define transitions for: GoalStatus, MilestoneStatus, EpicStatus, PatternContractStatus, RiskStatus, ChangeRequestStatus, ScopeChangeStatus, QuestionStatus, DecisionStatus. Derive from framework docs.

**index.ts exports:**
- All schemas and their `Static<>` types
- All enums
- `RELATIONSHIPS` array
- `TRANSITIONS` map
- `SCHEMA_MAP: Record<string, TObject>` for generic access
- `COLLECTION_NAMES: string[]` — ordered list of all collection names

**Acceptance criteria:**
- [ ] Every entity from er-diagram.md has a TypeBox schema with all fields
- [ ] Every enum value matches er-diagram.md exactly
- [ ] `_embed_hash` + `_embed_ver` on embeddable entities only
- [ ] `RELATIONSHIPS` covers every FK from er-diagram.md (including nullable)
- [ ] Task transitions match reference.md table exactly
- [ ] `SCHEMA_MAP` maps collection name → schema for all 30 entity types
- [ ] All schemas export inferred types (`type Task = Static<typeof TaskSchema>`)

---

## Step 2: Storage Adapters

**Status:** ✅ Done  
**Depends on:** Step 0

**What:** Abstract `StorageAdapter` interface + JSONL file implementation + in-memory implementation (for tests).  
**Entity-agnostic** — just reads/writes named collections of JSON records.

**Files to create:**
```
src/db/storage/
├── adapter.ts               # StorageAdapter interface
├── jsonl-adapter.ts         # JSONL file implementation (atomic writes via tmp+rename)
└── memory-adapter.ts        # In-memory Map-based implementation (for tests)
```

**Interface:**
```typescript
export interface StorageAdapter {
  loadCollection(name: string): Promise<Record<string, unknown>[]>;
  saveCollection(name: string, records: Record<string, unknown>[]): Promise<void>;
  hasCollection(name: string): Promise<boolean>;
  listCollections(): Promise<string[]>;
  deleteCollection(name: string): Promise<void>;
}
```

**JSONL adapter details:**
- Base directory passed to constructor
- Collection `"tasks"` maps to file `<baseDir>/tasks.jsonl`
- One JSON object per line, no trailing comma, newline-terminated
- Atomic writes: write to `<file>.tmp`, then `fs.rename()` over original
- Empty/missing file → return `[]`
- Handles embedded newlines in string values (JSON.stringify escapes them as `\n`)

**Memory adapter:** `Map<string, Record<string, unknown>[]>` — trivial, for tests.

**Acceptance criteria:**
- [ ] `StorageAdapter` interface defined with all 5 methods
- [ ] JSONL adapter: round-trip save → load returns identical records
- [ ] JSONL adapter: atomic writes (temp file + rename)
- [ ] JSONL adapter: missing collection returns `[]`
- [ ] JSONL adapter: handles special characters in values
- [ ] Memory adapter: same behavioral contract
- [ ] Both are interchangeable behind the interface

---

## Step 3: Embedding Adapters

**Status:** ✅ Done  
**Depends on:** Step 0

**What:** Abstract `EmbeddingAdapter` interface + local HuggingFace model + no-op for tests.

**Files to create:**
```
src/db/embedding/
├── adapter.ts               # EmbeddingAdapter interface
├── transformers-adapter.ts  # @huggingface/transformers, all-MiniLM-L6-v2, 384-dim
├── noop-adapter.ts          # Returns zero vectors (fast tests, no model download)
└── config.ts                # Which fields to embed per entity, hash helper, version constant
```

**Interface:**
```typescript
export interface EmbeddingAdapter {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  readonly dimensions: number;
  readonly modelVersion: number;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
```

**Transformers adapter:**
- Model: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions)
- Uses `@huggingface/transformers` v3 `pipeline('feature-extraction', ...)`
- Lazy init: model loads on first `embed()` call, not on construction
- Pooling: `mean`, normalize: `true`
- Model cached at `~/.cache/huggingface/` (automatic, not committed to git)

**NoOp adapter:**
- Returns `new Array(384).fill(0)` instantly
- `modelVersion = 0`
- For fast tests that don't need real similarity

**Config (config.ts):**
```typescript
export const CURRENT_EMBED_VER = 1;

export const EMBEDDING_CONFIG: Record<string, { fields: string[]; separator: string }> = {
  task:        { fields: ['name', 'goal_statement', 'context', 'acceptance_criteria'], separator: ' | ' },
  decision:    { fields: ['title', 'context', 'decision', 'rationale'],               separator: ' | ' },
  risk:        { fields: ['description', 'impact', 'mitigation'],                     separator: ' | ' },
  session_log: { fields: ['exact_state', 'completed_this_session', 'next_actions'],    separator: ' | ' },
  question:    { fields: ['description', 'options'],                                   separator: ' | ' },
};

export function getEmbeddingText(entityType: string, record: Record<string, unknown>): string | null;
export function computeEmbedHash(text: string): string;  // SHA-256 truncated to 8 chars
```

**Acceptance criteria:**
- [ ] Interface defined
- [ ] Transformers adapter returns 384-dim normalized vectors
- [ ] Transformers adapter lazy-inits (no model load on construction)
- [ ] NoOp adapter returns 384-dim zero vectors instantly
- [ ] `getEmbeddingText()` returns null for non-embeddable entity types
- [ ] `getEmbeddingText()` concatenates correct fields with separator
- [ ] `computeEmbedHash()` returns stable 8-char hex string

---

## Step 4: Repository Layer

**Status:** ✅ Done  
**Depends on:** Step 1 (schemas), Step 2 (storage)

**What:** Generic `BaseRepository<T>` with CRUD + validation + events, plus concrete repositories for all entity types with relationship-specific query methods.

**Files to create:**
```
src/db/repository/
├── base-repository.ts       # Generic base class
├── events.ts                # EventBus class + event types
└── repositories.ts          # All concrete repositories
```

**BaseRepository<T> provides:**
- `load()` — load from StorageAdapter, validate each record via TypeBox
- `flush()` — write all records to StorageAdapter
- `getById(id)` → `T | undefined`
- `getByIdOrThrow(id)` → `T` (throws `EntityNotFoundError`)
- `getAll()` → `T[]`
- `find(predicate)` → `T[]`
- `findOne(predicate)` → `T | undefined`
- `count(predicate?)` → `number`
- `insert(record)` → `T` (validate, check duplicate id, persist, emit event)
- `update(id, patch)` → `T` (merge, validate, persist, emit event)
- `delete(id)` → `void` (persist, emit event)
- `query()` → `Query<T>` (from Step 5 — add this method after Step 5)

**EventBus (events.ts):**
```typescript
type MutationEvent = {
  type: 'entity:inserted' | 'entity:updated' | 'entity:deleted';
  collection: string;
  id: string;
  record?: unknown;
  previous?: unknown;
  current?: unknown;
};
```

**All concrete repositories and their entity-specific methods:**

| # | Repository | Collection Name | Schema | Key Query Methods |
|---|---|---|---|---|
| 1 | `ProjectRepository` | `projects` | ProjectSchema | `getCurrent()` |
| 2 | `ProjectCompletionRecordRepository` | `project_completion_records` | ProjectCompletionRecordSchema | `findByProject(projectId)` |
| 3 | `GoalRepository` | `goals` | GoalSchema | `findByProject(projectId)`, `findByStatus(status)` |
| 4 | `GoalCompletionRecordRepository` | `goal_completion_records` | GoalCompletionRecordSchema | `findByGoal(goalId)` |
| 5 | `GoalEpicMapRepository` | `goal_epic_maps` | GoalEpicMapSchema | `findByGoal(goalId)`, `findByEpic(epicId)` |
| 6 | `TechStackEntryRepository` | `tech_stack_entries` | TechStackEntrySchema | `findByProject(projectId)`, `findByCategory(cat)` |
| 7 | `SharedDocRefRepository` | `shared_doc_refs` | SharedDocRefSchema | `findByProject(projectId)` |
| 8 | `RuleRepository` | `rules` | RuleSchema | `findByProject(projectId)` |
| 9 | `ConventionRepository` | `conventions` | ConventionSchema | `findByProject(projectId)` |
| 10 | `MilestoneRepository` | `milestones` | MilestoneSchema | `findByProject(projectId)`, `findByStatus(status)` |
| 11 | `MilestoneReviewRecordRepository` | `milestone_review_records` | MilestoneReviewRecordSchema | `findByMilestone(milestoneId)` |
| 12 | `EpicRepository` | `epics` | EpicSchema | `findByMilestone(milestoneId)`, `findByProject(projectId)`, `findByStatus(status)` |
| 13 | `EpicDependencyRepository` | `epic_dependencies` | EpicDependencySchema | `findRequires(epicId)`, `findEnables(epicId)` |
| 14 | `EpicCompletionRecordRepository` | `epic_completion_records` | EpicCompletionRecordSchema | `findByEpic(epicId)` |
| 15 | `TaskRepository` | `tasks` | TaskSchema | `findByEpic(epicId)`, `findByStatus(status)`, `findActive()`, `findByPriority(p)`, `findBlocked()`, `transition(id, newStatus)` |
| 16 | `SubtaskRepository` | `subtasks` | SubtaskSchema | `findByTask(taskId)`, `findOrdered(taskId)` |
| 17 | `TaskAttachmentRepository` | `task_attachments` | TaskAttachmentSchema | `findByTask(taskId)` |
| 18 | `TaskResourceRefRepository` | `task_resource_refs` | TaskResourceRefSchema | `findByTask(taskId)`, `findByResource(resourceId)` |
| 19 | `BlockerRepository` | `blockers` | BlockerSchema | `findByTask(taskId)`, `findUnresolved()`, `findByType(type)` |
| 20 | `TaskDependencyRepository` | `task_dependencies` | TaskDependencySchema | `findDependenciesOf(taskId)`, `findDependantsOf(taskId)` |
| 21 | `PatternContractRepository` | `pattern_contracts` | PatternContractSchema | `findByTask(taskId)`, `findByStatus(status)` |
| 22 | `PatternContractVersionRepository` | `pattern_contract_versions` | PatternContractVersionSchema | `findByContract(contractId)`, `findLatest(contractId)` |
| 23 | `PatternDependencyRepository` | `pattern_dependencies` | PatternDependencySchema | `findByTask(taskId)`, `findByContract(contractId)`, `findNeedsReview()` |
| 24 | `VerificationRepository` | `verifications` | VerificationSchema | `findByTask(taskId)`, `findStale()`, `findByResult(result)` |
| 25 | `VerificationAttemptRepository` | `verification_attempts` | VerificationAttemptSchema | `findByVerification(verId)`, `findLatest(verId)` |
| 26 | `WorkIntervalRepository` | `work_intervals` | WorkIntervalSchema | `findByTask(taskId)`, `findBySession(sessionId)` |
| 27 | `CompletionRecordRepository` | `completion_records` | CompletionRecordSchema | `findByTask(taskId)` |
| 28 | `SessionLogRepository` | `session_logs` | SessionLogSchema | `findByProject(projectId)`, `findLatest()`, `findByEntryNumber(n)` |
| 29 | `PhaseCompletionRecordRepository` | `phase_completion_records` | PhaseCompletionRecordSchema | `findBySession(sessionId)`, `findByPhase(phaseNumber)`, `findLatestPassed()` |
| 30 | `DecisionRepository` | `decisions` | DecisionSchema | `findByProject(projectId)`, `findActive()`, `findByStatus(status)` |
| 31 | `QuestionRepository` | `questions` | QuestionSchema | `findByProject(projectId)`, `findOpen()`, `findEscalated()` |
| 32 | `RiskRepository` | `risks` | RiskSchema | `findByProject(projectId)`, `findByStatus(status)`, `findOpen()` |
| 33 | `ChangeRequestRepository` | `change_requests` | ChangeRequestSchema | `findByProject(projectId)`, `findPending()` |
| 34 | `ScopeChangeRepository` | `scope_changes` | ScopeChangeSchema | `findByProject(projectId)`, `findByChangeRequest(crId)` |
| 35 | `AbandonmentRecordRepository` | `abandonment_records` | AbandonmentRecordSchema | `findByProject(projectId)`, `findByEntity(type, id)` |

**`TaskRepository.transition(id, newStatus)`:**
- Looks up valid transitions from `transitions.ts`
- Throws `InvalidTransitionError` if transition not allowed
- Calls `update()` if valid

**Acceptance criteria:**
- [ ] `BaseRepository` CRUD works with MemoryStorageAdapter
- [ ] Validation rejects invalid data on insert and update
- [ ] Events emitted on insert, update, delete
- [ ] `DuplicateIdError` on duplicate insert
- [ ] `EntityNotFoundError` on missing entity
- [ ] All 35 concrete repositories instantiate correctly
- [ ] `TaskRepository.transition()` validates against transition table
- [ ] All relationship query methods return correct filtered subsets
- [ ] EventBus supports multiple listeners

---

## Step 5: Query Engine

**Status:** ✅ Done  
**Depends on:** Step 4

**What:** Fluent, composable, generic query builder. Not entity-specific.

**Files to create:**
```
src/db/query/
├── query-builder.ts         # Query<T> class
├── operators.ts             # eq, ne, gt, lt, in, contains helpers
├── sort.ts                  # Comparator builders
└── types.ts                 # Types
```

**Query<T> API:**
```typescript
class Query<T> {
  where(predicate: (r: T) => boolean): Query<T>;
  whereEq<K extends keyof T>(field: K, value: T[K]): Query<T>;
  whereNe<K extends keyof T>(field: K, value: T[K]): Query<T>;
  whereIn<K extends keyof T>(field: K, values: T[K][]): Query<T>;
  whereContains<K extends keyof T>(field: K, substring: string): Query<T>;
  sortBy<K extends keyof T>(field: K, dir?: 'asc' | 'desc'): Query<T>;
  sortByMultiple(sorts: { field: keyof T; dir: 'asc' | 'desc' }[]): Query<T>;
  limit(n: number): Query<T>;
  offset(n: number): Query<T>;
  select<K extends keyof T>(...fields: K[]): Query<Pick<T, K>>;
  execute(): T[];
  first(): T | undefined;
  count(): number;
  exists(): boolean;
  groupBy<K extends keyof T>(field: K): Map<T[K], T[]>;
  sum<K extends keyof T>(field: K): number;
}
```

After this step, add `.query()` method to `BaseRepository`:
```typescript
query(): Query<T> {
  return new Query(() => this.getAll());
}
```

**Acceptance criteria:**
- [ ] All filter methods work correctly
- [ ] Sort works for string, number, date fields (asc and desc)
- [ ] Limit and offset paginate correctly
- [ ] Select returns narrowed objects
- [ ] GroupBy groups correctly
- [ ] Sum sums numeric fields
- [ ] Chaining composes correctly (where + sort + limit)
- [ ] Empty results handled ([], undefined, 0, false)
- [ ] Integrated into BaseRepository via `.query()`

---

## Step 6: Semantic Search

**Status:** ✅ Done  
**Depends on:** Step 3 (embedding adapters), Step 4 (repositories + events)

**What:** Vectra-backed semantic search with auto-sync from repository events.

**Files to create:**
```
src/db/search/
├── semantic-search.ts       # SemanticSearch class
├── sync.ts                  # syncEmbeddings() for cold-start bulk sync
└── types.ts                 # SearchResult type
```

**SemanticSearch API:**
- `initialize()` — create/load Vectra LocalIndex per embeddable entity type
- `search(entityType, queryText, k)` → `SearchResult[]`
- `searchAll(queryText, k)` → `SearchResult[]` (across all types, merged by score)
- `upsertEntity(entityType, id, record)` — embed text, store in Vectra
- `removeEntity(entityType, id)` — remove from Vectra

**SearchResult:**
```typescript
{ entityType: string; id: string; score: number; text: string }
```

**Sync (sync.ts):**
- On cold-start: iterate all embeddable entities, compare `_embed_hash` + `_embed_ver`, re-embed if stale
- On runtime: listen to EventBus `entity:inserted`/`entity:updated`/`entity:deleted`, auto-sync

**Vectra indexes stored at:** `<vectorDir>/<entityType>/` (one LocalIndex folder per embeddable type)

**Acceptance criteria:**
- [ ] Vectra indexes created for task, decision, risk, session_log, question
- [ ] upsert + search returns relevant results
- [ ] searchAll merges across types, sorted by score, limited to k
- [ ] Cold-start sync skips up-to-date records
- [ ] Cold-start sync re-embeds stale records (hash or version mismatch)
- [ ] Event-driven auto-sync fires on insert/update/delete
- [ ] Graceful when embeddings disabled (returns empty, no errors)

---

## Step 7: Database Facade

**Status:** ✅ Done  
**Depends on:** Step 4, Step 5, Step 6

**What:** Single `Database` class that wires everything. The public API for all future consumers.

**Files to create:**
```
src/db/
├── database.ts              # Database class
├── types.ts                 # Shared error classes (EntityNotFoundError, DuplicateIdError, InvalidTransitionError)
└── index.ts                 # Public exports
```

**DatabaseConfig:**
```typescript
{
  dataDir: string;                    // Where JSONL files live
  vectorDir: string;                  // Where Vectra indexes live
  storage?: StorageAdapter;           // Default: JsonlStorageAdapter(dataDir)
  embedding?: EmbeddingAdapter;       // Default: TransformersEmbeddingAdapter
  enableEmbeddings?: boolean;         // Default: true
}
```

**Database class exposes:**
- All 35 repositories as typed `readonly` properties (camelCase names: `tasks`, `epics`, `sessionLogs`, etc.)
- `search: SemanticSearch`
- `events: EventBus`
- `open()` — load all repos, init search, sync embeddings, wire auto-sync
- `close()` — dispose embedding adapter
- `validateIntegrity()` → `IntegrityReport` — check all FKs using RELATIONSHIPS array

**index.ts re-exports:**
- `Database`, `DatabaseConfig`
- All entity types (Task, Epic, etc.)
- All enums
- `Query` class
- `StorageAdapter`, `EmbeddingAdapter` interfaces
- Error classes

**Acceptance criteria:**
- [ ] `new Database(config)` → `open()` → repositories loaded → `close()` works
- [ ] All 35 repos accessible as typed properties
- [ ] Search works when enabled, graceful when disabled
- [ ] `validateIntegrity()` reports orphan FKs
- [ ] Works with Memory + NoOp adapters for fast test instantiation
- [ ] index.ts exports everything needed by consumers

---

## Step 8: Tests & Evaluation

**Status:** ✅ Done  
**Depends on:** Step 7

**What:** Test suite + seed data + performance benchmarks.

**Test runner:** Use Node.js built-in `node:test` + `node:assert` (zero dependencies). Run with `node --test src/db/__tests__/*.test.ts` (pi's jiti loader handles TypeScript).

**Files to create:**
```
src/db/__tests__/
├── schema.test.ts           # All TypeBox schemas: valid + invalid data
├── transitions.test.ts      # All valid transitions pass, all invalid throw
├── storage-jsonl.test.ts    # JSONL adapter: round-trip, atomic, edge cases
├── storage-memory.test.ts   # Memory adapter: same tests
├── embedding-noop.test.ts   # NoOp: dimensions, returns vectors
├── embedding-local.test.ts  # Transformers: real embeddings (slow, integration — skip in CI)
├── repository.test.ts       # Base repo CRUD, validation, events, errors
├── repository-task.test.ts  # Task: findByEpic, transition, findActive
├── repository-all.test.ts   # Smoke: insert + query methods for all 35 repos
├── query.test.ts            # Query builder: all operators, chaining
├── search.test.ts           # Semantic search: upsert, search, sync, staleness
├── database.test.ts         # Full lifecycle: open → mutate → query → search → close
├── integrity.test.ts        # FK validation: catches orphans
├── performance.test.ts      # Benchmarks
└── __fixtures__/
    ├── seed.ts              # Generate valid test data for all entity types
    └── sample-project.ts    # Complete realistic project (~50 tasks, 5 epics, etc.)
```

**Performance targets:**
- Load 1000 tasks from JSONL: < 100ms
- Query with filter + sort: < 5ms
- Semantic search 10 results (NoOp adapter): < 50ms

**Acceptance criteria:**
- [ ] All schema tests pass
- [ ] All transition tests pass
- [ ] Storage tests pass for both adapters
- [ ] Repository CRUD + query tests pass
- [ ] Query builder tests pass
- [ ] Search tests pass
- [ ] Full lifecycle test passes
- [ ] Integrity validation catches known violations
- [ ] Performance benchmarks meet targets
- [ ] Seed generator produces valid data for all 30 entity types

---

## File Tree (complete)

```
.pi/extensions/pi-project-framework/
├── package.json                          # NEW (Step 0)
├── node_modules/                         # Generated by npm install
├── index.ts                              # EXISTING — DO NOT MODIFY
└── src/
    ├── widgets/questionnaire/            # EXISTING — DO NOT MODIFY
    └── db/                               # ALL NEW
        ├── schema/
        │   ├── enums.ts                  # Step 1
        │   ├── entities/
        │   │   ├── project.ts            # Step 1
        │   │   ├── goal.ts               # Step 1
        │   │   ├── resources.ts          # Step 1
        │   │   ├── milestone.ts          # Step 1
        │   │   ├── epic.ts               # Step 1
        │   │   ├── task.ts               # Step 1
        │   │   ├── blocker.ts            # Step 1
        │   │   ├── pattern.ts            # Step 1
        │   │   ├── verification.ts       # Step 1
        │   │   ├── tracking.ts           # Step 1
        │   │   ├── session.ts            # Step 1
        │   │   ├── decision.ts           # Step 1
        │   │   ├── risk.ts               # Step 1
        │   │   └── change.ts             # Step 1
        │   ├── relationships.ts          # Step 1
        │   ├── transitions.ts            # Step 1
        │   └── index.ts                  # Step 1
        ├── storage/
        │   ├── adapter.ts                # Step 2
        │   ├── jsonl-adapter.ts          # Step 2
        │   └── memory-adapter.ts         # Step 2
        ├── embedding/
        │   ├── adapter.ts                # Step 3
        │   ├── transformers-adapter.ts   # Step 3
        │   ├── noop-adapter.ts           # Step 3
        │   └── config.ts                 # Step 3
        ├── repository/
        │   ├── base-repository.ts        # Step 4
        │   ├── events.ts                 # Step 4
        │   └── repositories.ts           # Step 4
        ├── query/
        │   ├── query-builder.ts          # Step 5
        │   ├── operators.ts              # Step 5
        │   ├── sort.ts                   # Step 5
        │   └── types.ts                  # Step 5
        ├── search/
        │   ├── semantic-search.ts        # Step 6
        │   ├── sync.ts                   # Step 6
        │   └── types.ts                  # Step 6
        ├── database.ts                   # Step 7
        ├── types.ts                      # Step 7
        ├── index.ts                      # Step 7
        └── __tests__/                    # Step 8
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

**Total: ~40 source files, ~12 test files, 2 fixture files**  
**Dependencies: vectra, @huggingface/transformers, yaml (+ pi-bundled: @sinclair/typebox)**  
**Native bindings: none**  
**Test runner:** `npx tsx --test src/db/__tests__/*.test.ts` (251 tests, ~1.5s)  
**Runtime data:** `.project/database/` (JSONL, committed) + `.project/database/vectors/` (gitignored)  
**Config:** `.project/config.yaml` (auto-created with defaults on extension load)
