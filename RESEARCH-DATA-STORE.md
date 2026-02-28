# Data Store Research — PI Extension for Project Management Framework

**Date:** 2026-02-28  
**Status:** Research Complete — Recommendation Ready

---

## Requirements Summary

| Requirement | Priority |
|---|---|
| Git-committable (meaningful diffs, mergeable) | **Critical** |
| Complex relational data model (~30 entities, rich relationships) | **Critical** |
| Embedding/vector search support | **High** |
| Fast reads for cold-start resumption | **High** |
| TypeScript/Node.js native | **Critical** |
| No external server or Docker dependency | **Critical** |
| Works within pi extension constraints (`appendEntry`, file I/O) | **Critical** |

---

## Options Evaluated

### ❌ Option 1: SQLite (+ sqlite-vec for embeddings)

| Aspect | Assessment |
|---|---|
| Query power | Excellent — full SQL, joins, indexes |
| Embeddings | Possible via `sqlite-vec` or `better-sqlite3` + custom |
| Git friendliness | **Terrible** — binary file, no meaningful diffs, merge conflicts on every change |
| Pi compatibility | Needs native bindings (`better-sqlite3`), which complicates extension distribution |

**Verdict:** Ruled out. Binary files are fundamentally incompatible with the "nothing lives outside written files" principle and git-centric workflow.

---

### ❌ Option 2: LanceDB (embedded vector DB)

| Aspect | Assessment |
|---|---|
| Vector search | Excellent — HNSW, hybrid search, sub-ms queries |
| Storage format | Proprietary columnar Lance format (binary) |
| Git friendliness | **Poor** — binary files, same merge problem as SQLite |
| JSONL export | No built-in; manual conversion required |
| Size | Heavy native dependency |

**Verdict:** Ruled out. Same binary-in-git problem. Over-engineered for our scale.

---

### ⚠️ Option 3: Vectra (JSON-file vector DB)

| Aspect | Assessment |
|---|---|
| Vector search | Good — in-memory brute-force, fast for small-medium datasets |
| Storage format | **JSON files** — `index.json` + per-item metadata files |
| Git friendliness | **Good** — text-based, diffable |
| TypeScript native | Yes, pure JS |
| Scale | RAM-bound; fine for project management data (hundreds to low thousands of records) |
| Maturity | Active (v0.12.3), 11 deps, MIT licensed |

**Verdict:** Strong candidate for the **vector/embedding layer only**. Not designed for relational data.

---

### ✅ Option 4: JSONL Files (Custom) + Vectra for Embeddings — **RECOMMENDED**

The hybrid approach that satisfies all requirements:

---

## Recommended Architecture

### Layer 1: JSONL Files — Relational Data Store

```
.project/
├── data/
│   ├── project.jsonl          # 1 record (the project itself)
│   ├── goals.jsonl
│   ├── milestones.jsonl
│   ├── epics.jsonl
│   ├── tasks.jsonl
│   ├── subtasks.jsonl
│   ├── blockers.jsonl
│   ├── dependencies.jsonl
│   ├── pattern-contracts.jsonl
│   ├── pattern-dependencies.jsonl
│   ├── verifications.jsonl
│   ├── work-intervals.jsonl
│   ├── completion-records.jsonl
│   ├── session-logs.jsonl
│   ├── decisions.jsonl
│   ├── questions.jsonl
│   ├── risks.jsonl
│   ├── change-requests.jsonl
│   ├── scope-changes.jsonl
│   └── abandonment-records.jsonl
├── vectors/
│   └── <vectra indexes per searchable entity>
└── schema/
    └── schema.json            # Entity definitions + validation rules
```

**Why JSONL (one JSON object per line):**

1. **Git diffs are line-level** — changing one task = one changed line in `tasks.jsonl`, clean diff
2. **Merge-friendly** — non-overlapping line changes auto-merge; conflicts are per-record, easy to resolve
3. **Human-readable** — can inspect/edit with any text editor
4. **No binary dependencies** — pure text, works everywhere
5. **Fast enough** — parse entire file into memory on load; for our scale (hundreds of records) this is sub-millisecond

**Each line is a self-contained JSON object:**
```jsonl
{"id":"TASK-001","epic_id":"EPIC-01","name":"Setup project","status":"done","priority":"high",...}
{"id":"TASK-002","epic_id":"EPIC-01","name":"Define schema","status":"active","priority":"medium",...}
```

### Layer 2: In-Memory Index — Fast Queries

On cold-start, load all JSONL files into memory and build indexes:

```typescript
// Conceptual API
class DataStore {
  // Primary indexes (Map<id, entity>)
  private tasks: Map<string, Task>;
  private epics: Map<string, Epic>;
  
  // Secondary indexes for relationships
  private tasksByEpic: Map<string, Set<string>>;    // epic_id → task_ids
  private blockersByTask: Map<string, Set<string>>;  // task_id → blocker_ids
  private depGraph: DirectedGraph<string>;           // dependency DAG
  
  // Load from disk
  async load(projectDir: string): Promise<void> {
    // Parse each JSONL file, populate maps + indexes
    // Validate foreign keys, build relationship indexes
  }
  
  // Write-through: update memory + append/rewrite JSONL
  async updateTask(id: string, patch: Partial<Task>): Promise<void> {
    // Update in-memory
    // Rewrite tasks.jsonl (atomic write via temp file + rename)
  }
  
  // Query
  getTasksByEpic(epicId: string): Task[] { ... }
  getBlockersForTask(taskId: string): Blocker[] { ... }
  getActiveTask(): Task | null { ... }
  getDependencyChain(taskId: string): Task[] { ... }
}
```

### Layer 3: Vectra — Embedding Search

Use Vectra for semantic search over entities that benefit from it:

```typescript
// Searchable entities: Tasks, Decisions, Session Logs, Risks
// Each gets a Vectra LocalIndex in .project/vectors/<entity>/

class SemanticSearch {
  private taskIndex: LocalIndex;
  private decisionIndex: LocalIndex;
  
  // Sync from JSONL data after changes
  async syncEntity(type: string, id: string, text: string, embedding: number[]) {
    await this.indexes[type].upsertItem({
      id,
      vector: embedding,
      metadata: { type, id, text }
    });
  }
  
  // Search
  async findSimilarTasks(query: number[], k: number): Promise<Task[]> {
    const results = await this.taskIndex.queryItems(query, k);
    return results.map(r => this.dataStore.getTask(r.item.metadata.id));
  }
}
```

---

## Performance Characteristics

| Operation | Expected Performance | Notes |
|---|---|---|
| Cold-start load (all JSONL) | **< 50ms** | Even with 1000+ records across all files |
| Single entity lookup | **< 0.1ms** | In-memory Map lookup |
| Relationship query | **< 1ms** | Pre-built secondary indexes |
| Write (update + flush) | **< 10ms** | Rewrite single JSONL file atomically |
| Vector search (Vectra) | **1-2ms** | In-memory brute force, fine for < 10k vectors |
| `git diff` | **Instant, readable** | Line-level changes only |
| `git merge` | **Usually automatic** | Conflicts only when same record changed on both sides |

---

## Design Decisions

### Why not one big JSON file?
- Changing any record rewrites the entire file → huge diffs
- Merge conflicts span the entire document structure
- JSONL isolates changes to individual lines

### Why not one JSON file per entity instance?
- Thousands of tiny files pollute `git status` and slow file systems
- JSONL is the sweet spot: one file per entity **type**, one line per **instance**

### Why not just use Vectra for everything?
- Vectra stores metadata per-item but has no relational query capability
- No foreign key validation, no secondary indexes, no transaction semantics
- It's a vector index, not a database

### Why rewrite entire JSONL file on mutation (vs. append-only)?
- Append-only requires compaction/garbage collection → complexity
- For our scale (< 1000 records per file), full rewrite is < 5ms
- Produces clean git state (no tombstones or duplicate IDs)

### How to handle atomic writes?
```typescript
// Write to temp file, then atomic rename
const tmpPath = filePath + '.tmp';
await fs.writeFile(tmpPath, lines.join('\n') + '\n');
await fs.rename(tmpPath, filePath);  // Atomic on same filesystem
```

---

## Git Integration Strategy

### .gitattributes
```
*.jsonl merge=union    # Auto-merge non-conflicting line additions
```

> **Note:** `merge=union` works well for append-heavy workloads. For entity updates (same line changed both sides), standard conflict markers appear and are trivially resolvable since each line is a complete JSON object.

### Embedding files (.project/vectors/)
- Vectra's `index.json` is JSON → git-diffable
- Per-item metadata files are small JSON → git-friendly
- Regenerable from JSONL data + embedding model → can `.gitignore` if desired
- Recommendation: **commit vectors** for offline cold-start without re-embedding; add to `.gitignore` only if repo size becomes an issue

---

## Schema Validation

```typescript
// schema.json defines entity shapes using JSON Schema or Zod
// Validated on load and before write

import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  epic_id: z.string(),
  name: z.string(),
  status: z.enum(['pending', 'active', 'blocked', 'needs_review', 'in_review', 'done', 'cancelled']),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  delegation: z.enum(['implement', 'plan', 'research', 'human', 'specialist']),
  goal_statement: z.string(),
  context: z.string().optional(),
  research_date: z.string().optional(),
  acceptance_criteria: z.string(),
  affected_files: z.string().optional(),
  notes: z.string().optional(),
});
```

---

## Embedding Model Strategy — Local Only (No Remote APIs)

### Model: `all-MiniLM-L6-v2` via `@huggingface/transformers`

| Property | Value |
|---|---|
| Package | `@huggingface/transformers` v3.8.1 (official, replaces `@xenova/transformers`) |
| Model | `sentence-transformers/all-MiniLM-L6-v2` |
| Dimensions | 384 |
| Max tokens | 256 (optimal < 128) |
| Model size | ~80MB ONNX (downloaded once, cached locally) |
| Runtime | ONNX Runtime (bundled), CPU-only, no GPU required |
| Latency | ~5-20ms per embedding on modern CPU |
| Cost | **Zero** — fully local, no API keys, no network |

### Why this model?

1. **Small & fast** — 384 dimensions is compact; Vectra stores each as ~1.5KB per vector (vs ~6KB for 1536-dim)
2. **Good quality** — strong sentence similarity performance, well-benchmarked
3. **Widely supported** — most examples/docs/tooling target this model
4. **Offline** — model downloaded once to `~/.cache/huggingface/`, runs entirely local

### Embedding Pipeline

```typescript
import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

let extractor: FeatureExtractionPipeline | null = null;

async function getEmbedding(text: string): Promise<number[]> {
  if (!extractor) {
    extractor = await pipeline(
      'feature-extraction',
      'sentence-transformers/all-MiniLM-L6-v2',
      { dtype: 'fp32' }
    );
  }
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}
```

### What Gets Embedded?

Not every entity needs embeddings. Only entities that benefit from **semantic search**:

| Entity | Embedded Text | Why |
|---|---|---|
| Task | `name + goal_statement + context + acceptance_criteria` | Find related tasks, semantic duplicate detection |
| Decision | `title + context + decision + rationale` | "What did we decide about X?" |
| Risk | `description + impact + mitigation` | "Any risks related to X?" |
| Session Log | `exact_state + completed_this_session + next_actions` | "When did we last work on X?" |
| Question | `description + options` | "Was this asked before?" |

Entities **NOT** embedded (pure relational lookup is sufficient):
- Project, Goal, Milestone, Epic (small count, navigated by ID/hierarchy)
- Subtask, Blocker, Dependency (navigated via parent Task)
- Work Interval, Completion Record (queried by task_id/time)
- Pattern Contract, Verification (queried by task_id)
- Change Request, Scope Change, Abandonment Record (rare, queried by ID)

### Tracking & Staleness

Every embedded entity gets two extra fields in its JSONL record:

```jsonl
{"id":"TASK-001","name":"...","_embed_hash":"a1b2c3","_embed_ver":1, ...}
```

| Field | Purpose |
|---|---|
| `_embed_hash` | SHA-256 of the concatenated text fields that were embedded (truncated to 8 chars) |
| `_embed_ver` | Embedding model version number (bumped when model changes) |

**Staleness detection on load:**

```typescript
const CURRENT_EMBED_VER = 1; // Bump when changing model or embedded fields

function isEmbeddingStale(record: any, currentText: string): boolean {
  const currentHash = sha256(currentText).slice(0, 8);
  return record._embed_hash !== currentHash 
      || record._embed_ver !== CURRENT_EMBED_VER;
}
```

**Re-embedding workflow:**

```
Cold Start Load
  ├─ Parse all JSONL files into memory
  ├─ Load Vectra indexes
  ├─ For each embeddable entity:
  │   ├─ Compute current text hash
  │   ├─ Compare to _embed_hash in record
  │   ├─ If stale OR missing from Vectra index:
  │   │   ├─ Generate new embedding (local model)
  │   │   ├─ Upsert into Vectra index
  │   │   └─ Update _embed_hash + _embed_ver in JSONL
  │   └─ If current: skip
  └─ Ready
```

**On entity mutation (write-through):**

```
Update Task
  ├─ Update in-memory Map
  ├─ Rewrite tasks.jsonl (atomic)
  ├─ If embedded fields changed:
  │   ├─ Generate new embedding
  │   ├─ Upsert Vectra index
  │   └─ Update _embed_hash + _embed_ver
  └─ Done
```

### Model Migration

When upgrading the embedding model (e.g., to a better/smaller one):

1. Bump `CURRENT_EMBED_VER` to `2`
2. On next cold start, **all** entities show as stale (`_embed_ver !== 2`)
3. Full re-embedding runs automatically (~5-20ms × number of entities)
4. For 500 entities: ~2.5-10 seconds one-time cost
5. Vectra indexes rebuilt in place, git commit captures new vectors

### Model Cache Location

```
~/.cache/huggingface/          # Default cache (shared across projects)
  └── sentence-transformers/
      └── all-MiniLM-L6-v2/    # ~80MB, downloaded once
```

Not committed to git. First run on a new machine downloads automatically.

---

## Dependencies

| Package | Purpose | Size | Native? |
|---|---|---|---|
| `vectra` | Vector search over JSON files | 529 KB | No (pure JS) |
| `zod` | Schema validation | ~60 KB | No |
| `@huggingface/transformers` | Local embedding generation (ONNX) | ~50 MB (with ONNX runtime) | WASM-based, no native compile |
| *(none else)* | JSONL parsing is trivial: `line.split('\n').map(JSON.parse)` | — | — |

**Total added dependencies: 3 packages, zero native bindings, fully offline.**

---

## Summary

| Requirement | Solution |
|---|---|
| Git-committable | ✅ JSONL text files — clean diffs, auto-mergeable |
| Complex relational model | ✅ In-memory indexes built from JSONL on load |
| Embeddings/vector search | ✅ Vectra (JSON-file-backed vector indexes) |
| Fast cold-start | ✅ Parse JSONL into Maps < 50ms |
| TypeScript native | ✅ Zero native dependencies |
| Pi extension compatible | ✅ Standard file I/O, no servers |
| Human-inspectable | ✅ Every record is readable JSON |

**Recommendation: Implement this JSONL + in-memory index + Vectra architecture.**
