# AGENTS.md — Project Agent Guide

This file orients AI agents to the structure of this repository. Read it before doing anything else.

---

## Repository Structure

```
.
├── archive/
│   └── deliverables/   # Completed build trackers and delivery records
│       └── TRACKER-database-module.md  # ✅ Database module build tracker (all 11 steps done)
└── FRAMEWORK/          # AI-Optimized Project Management Framework (documentation only)
    ├── AGENTS.md       # This file — agent orientation and critical conventions
    ├── INDEX.md        # Framework entry point: design principles + entity hierarchy overview
    ├── lifecycle.md    # Four-phase lifecycle, Phase Completion Records, Phase 4 bootstrap,
    │                   # Task Addition process, Infeasibility exit, Onboarding variant
    ├── project.md      # Project (with Status + Completion Record), Goal (with transition rules),
    │                   # Project Resources (Tech Stack, Docs, Rules, Conventions)
    ├── planning.md     # Milestone (with Completion Process + Review Record),
    │                   # Epic (with Completion Process, Epic Dependencies, Infrastructure Epics)
    ├── change-management.md  # Change Request and Scope Change entities
    ├── risk.md         # Risk entity, Risk Register, Risk status transitions
    ├── task.md         # Task (with Research Date), Subtask, Delegation (with Specialist Routing)
    ├── relationships.md# Dependency, Blocker, Pattern Contract (with status definitions),
    │                   # Pattern Dependency, Needs Review Resolution Process
    ├── verification.md # Verification (with attempt history, failure recovery loop, staleness)
    ├── tracking.md     # Work Interval, Completion Record, project-level cost/time summary
    ├── session-log.md  # Session Log (cardinality + parallel work), Decision, Question (aging)
    ├── reference.md    # Status transition table, Human review outcomes, Delegation levels,
    │                   # Abandonment Records, Tech Stack Version Update, relationship map
    ├── er-diagram.md   # Mermaid ER diagram — full database schema, all entities and relationships
    └── flowcharts.md   # All process flowcharts — high-level lifecycle + 17 dedicated workflow diagrams
```

---

## What This Repository Contains

The `FRAMEWORK/` directory defines a **structured project management framework** designed for AI agents working alongside solo developers. It is a documentation system — it describes entities, relationships, and a lifecycle, not executable code.

The framework's core purpose: any agent should be able to resume any project cold, from the written files alone, with no chat history and no assumed context.

---

## Quick-Start for Agents

1. **Read [FRAMEWORK/INDEX.md](FRAMEWORK/INDEX.md)** for the design principles and entity hierarchy.
2. **Read [FRAMEWORK/lifecycle.md](FRAMEWORK/lifecycle.md)** to understand the four phases, Phase Completion Records, and the Phase 4 bootstrap sequence.
3. **Read the entity files** relevant to the phase you're operating in:
   - Phase 1 (Interview): `project.md`, `session-log.md`, `change-management.md`, `risk.md`
   - Phase 2 (Planning): `planning.md`, `change-management.md`, `risk.md`
   - Phase 3 (Decomposition): `task.md`, `relationships.md`, `verification.md`, `risk.md`
   - Phase 4 (Implementation): `tracking.md`, `session-log.md`, `reference.md`, `verification.md`

---

## Implementation Structure

All implementation code lives under `.pi/extensions/pi-project-framework/`:

```
.pi/extensions/pi-project-framework/
├── package.json          # Own deps: vectra, @huggingface/transformers
├── index.ts              # Extension entry point
└── src/
    ├── config/           # Shared config system (config.yaml management)
    ├── widgets/          # UI widgets (questionnaire)
    └── db/               # Database module
        ├── schema/       # TypeBox schemas, enums, relationships, transitions
        ├── storage/      # StorageAdapter interface + JSONL/Memory implementations
        ├── embedding/    # EmbeddingAdapter interface + Transformers/NoOp implementations
        ├── repository/   # BaseRepository + 35 concrete repositories
        ├── query/        # Fluent query builder
        ├── search/       # Vectra-backed semantic search
        ├── database.ts   # Database facade (public API)
        ├── types.ts      # Shared error classes
        ├── index.ts      # Public re-exports
        ├── _DEBUG_TOOLS.ts           # ⚠️ DEBUG — remove before production
        └── __tests__/               # Test suite (251 tests)
            └── __fixtures__/        # Test data factories + sample project
```

**Build tracker:** [archive/deliverables/TRACKER-database-module.md](archive/deliverables/TRACKER-database-module.md) — completed database module build tracker (all steps done).

---

## Debug / Development Tools

⚠️ **The following files are temporary debug tools and MUST be removed before production:**

| File | What it contains | Removal steps |
|------|-----------------|---------------|
| `src/db/_DEBUG_TOOLS.ts` | `db_seed` and `db_query` pi tools for seeding and inspecting the database | Delete this file |
| `index.ts` lines | `import { registerDebugTools }` and `registerDebugTools(pi, projectRoot)` call | Remove the import and the call |
| `src/db/__tests__/` | 251 tests + fixture factories + sample project data | Delete entire directory (test fixtures are also consumed by `_DEBUG_TOOLS.ts`) |

**How to remove all debug tooling in one pass:**
1. Delete `src/db/_DEBUG_TOOLS.ts`
2. Delete `src/db/__tests__/` directory
3. In `index.ts`: remove the `import { registerDebugTools }` line and the `registerDebugTools(pi, projectRoot)` call
4. Commit — the extension will run with only production tools (`prj_questionnaire` + future framework tools)

---

## Runtime Environment

- **No `tsconfig.json`** — pi runs TypeScript directly via jiti loader.
- **No build step** — raw `.ts` files, imported directly.
- **Node.js strip-only TS mode** — TypeScript parameter properties (`constructor(private x: string)`) are NOT supported. Declare fields explicitly and assign in constructor body.
- **`import type`** — use `import type { X }` for interfaces/types that have no runtime value. Regular `import { X }` on a type-only module causes `ERR_MODULE_NOT_FOUND` at runtime.
- **No `.js` extensions in imports** — use `import { X } from './foo'` not `'./foo.js'`.

### Dependencies

- **Pi-provided (import directly, no install):** `@mariozechner/pi-coding-agent`, `@mariozechner/pi-tui`, `@sinclair/typebox`
- **Own deps** go in `package.json` at `.pi/extensions/pi-project-framework/package.json`
- **Schema library:** TypeBox only (NOT Zod). Use `Type.Object()`, `Static<>`, `Value.Check()`.

### Data locations

- **Runtime data:** `.project/database/` (JSONL files, committed to git — project state for cold-start)
- **Vector indexes:** `.project/database/vectors/` (gitignored, regenerated on startup)

---

## Code Quality

- **All TypeScript files must have JSDoc documentation optimized for AI readability.** This includes:
  - **Module-level `@module` + `@description`** at the top of every file: what this file contains, why it exists, and source references to FRAMEWORK docs where applicable.
  - **Entity/class/interface-level JSDoc**: what it represents, when it's created, lifecycle notes, and key behavioral rules (e.g., "abandoned status without AbandonmentRecord is invalid").
  - **Relationship context**: FK targets, cardinality, nullable semantics — so an agent reading the schema knows the full graph without cross-referencing.
  - **Field-level JSDoc** on every non-obvious field: what it means, expected format (e.g., "ISO datetime", "comma-separated IDs"), cross-references to related entities.
  - **Method-level JSDoc** on every public method: what it does, what it returns, edge cases (e.g., "returns [] if collection doesn't exist").
  - **Behavioral notes** where logic is non-obvious: invariants, constraints, what happens when values change.
  - **Cross-references** to consuming/implementing files so an agent can trace dependencies without grep.

- **Documentation is for cold-start agents.** An agent with no chat history should be able to read any file and understand what it does, what it connects to, and what rules govern it — without reading any other file first.

- **Project data lives under `.project/`.** All runtime data, configuration, and project state files are stored under the `.project/` directory at the project root. This is committed to git (it IS the project state for cold-start resumption). Exception: `.project/database/vectors/` is gitignored — vectors are derived data, regenerated on startup if missing.

---

## Critical Conventions

- **Nothing lives in chat history.** Every decision, question, blocker, pattern, risk, and scope change is written to a file. If it isn't written, it doesn't exist.

- **Stage + Mode are the first thing an agent reads on cold-start.** `Project.stage` says which phase the project is in (`uninitialised / phase_1 / phase_2 / phase_3 / phase_4 / complete / abandoned / on_hold`). `Project.mode` says what is operationally happening right now (`normal / change_management / infeasibility_review / phase_gate / awaiting_specialist`). Together they determine what work is permitted and where to look next — before reading the Session Log, before reading any task. See the cold-start decision table in `flowcharts.md` Flow 0 and the full definition in `project.md`.

- **Phase Completion Records gate phase transitions.** Before starting any phase, the agent reads the prior phase's Completion Record and confirms gate status is `passed`. A Session Log note saying "Phase N done" is not sufficient — the gate record is the authority. When a gate fails, Mode is set to `phase_gate` until gaps are closed.

- **Session Log is the cold-start anchor.** For Phase 4 resumptions (not the first session), the agent reads the most recent Session Log entry — Active Task and Exact State — and resumes from there. For the first Phase 4 session, the agent runs the Phase 4 Bootstrap sequence (see `lifecycle.md`).

- **Pattern Contract changes propagate.** If an upstream task's interface changes, downstream tasks are flagged `⚠️ Needs Review` with an inline version diff. An agent must run the Needs Review Resolution Process (in `relationships.md`) before starting any task in that status. The three outcomes — No Impact, Context Update, Significant Rework — each have a defined next state and a required Review Record.

- **Verification ≠ done.** A task passing its Acceptance Criteria is not the same as a task being verified. Verification confirms correctness against an authoritative source. Verification has an attempt history — a failed attempt triggers the Verification Failure Recovery Loop (in `verification.md`), not a dead end.

- **Status transitions are defined.** Every Task status transition has a trigger, precondition, required artifact, and authorizing party. See the full transition table in `reference.md`. Transitions not in the table are not permitted. Backward transitions (`👀 In Review → 🔄 Active`) are explicitly defined and limited.

- **Delegation level is non-negotiable mid-task.** If something arises that changes a task's appropriate delegation level, surface it — do not proceed autonomously past the boundary. For Specialist delegation, follow the full Specialist Routing process in `task.md`.

- **Changes to stable entities go through Change Requests.** If a Goal, Epic, Milestone, Constraint, or Tech Stack Entry needs to change after its defining phase, a Change Request must be created and approved before any downstream entity is modified. See `change-management.md`.

- **Abandonment requires a record.** Any entity reaching `abandoned` status (Task, Epic, Milestone, Goal) must have an Abandonment Record with rationale, state at abandonment, disposition of completed work, and human sign-off. The status transition is not complete without it. See `reference.md`.

- **Unplanned task discovery is a defined process.** If an agent discovers a missing Task during Phase 4, it stops, surfaces the gap, gets human confirmation, creates a full Task entity, and wires it into the dependency graph. It does not improvise or create shortcuts. See the Task Addition Process in `lifecycle.md`.

- **Risks are tracked, not assumed away.** Any potential future problem identified during research or planning is a Risk record in the Risk Register — not a buried note in Task Context. Realized risks become Blockers. See `risk.md`.
