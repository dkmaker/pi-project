# ROADMAP.md — Project State & Direction

> **Purpose:** Cold-start reload file. Read this first to know what's done, what's next, and where everything lives.
>
> **Last updated:** 2026-02-28

---

## 1. What This Project Is

An AI-optimized project management framework (`FRAMEWORK/`) paired with a pi extension (`.pi/extensions/pi-project-framework/`) that gives AI agents the tools to execute the framework's lifecycle — interviews, planning, decomposition, and implementation — with zero chat-history dependency.

---

## 2. Completed

### 2.1 Framework Documentation (FRAMEWORK/)

All 15 entity/process specification files are written and stable:

| File | Covers |
|------|--------|
| `INDEX.md` | Design principles, entity hierarchy |
| `lifecycle.md` | 4-phase lifecycle, phase gates, bootstrap |
| `project.md` | Project, Goal, Resources |
| `planning.md` | Milestone, Epic, dependencies |
| `task.md` | Task, Subtask, Delegation, Specialist Routing |
| `relationships.md` | Dependency, Blocker, Pattern Contract |
| `verification.md` | Verification attempts, failure recovery |
| `tracking.md` | Work Interval, Completion Record |
| `session-log.md` | Session Log, Decision, Question |
| `change-management.md` | Change Request, Scope Change |
| `risk.md` | Risk entity, Risk Register |
| `reference.md` | Status transitions, delegation levels |
| `er-diagram.md` | Full Mermaid ER diagram |
| `flowcharts.md` | 17+ process flowcharts |
| `AGENTS.md` | Agent orientation guide |

### 2.2 Questionnaire Tool (`prj_questionnaire`)

- **Location:** `src/widgets/questionnaire/`
- **Status:** ✅ Complete and registered in `index.ts`
- Single-choice, multi-select, free-text question types
- Single question → simple list; multiple → tabbed UI with submit page

### 2.3 Database Module (`src/db/`)

- **Status:** ✅ Complete (all 11 build steps done — see `archive/deliverables/TRACKER-database-module.md`)
- TypeBox schemas for all 35+ framework entities
- JSONL storage adapter (`.project/database/`) + in-memory adapter for tests
- 35 concrete repositories with full CRUD + relationship enforcement
- Fluent query builder
- Vectra-backed semantic search (`embedding/` + `search/`)
- Status transition validation matching `reference.md` rules
- 251 tests passing (in `src/db/__tests__/`)
- Debug tools (`db_seed`, `db_query`) registered — marked for removal before production

### 2.4 Config System (`src/config/`)

- Shared YAML-based config management (`config.yaml`)

---

## 3. Next: Agent Harness & Pipeline System

### 3.1 The Problem

The framework defines ~17 distinct workflows (flowcharts.md): phase interviews, planning decomposition, task execution, verification loops, change management, risk assessment, needs-review resolution, etc. Each is a multi-step process with:
- Decision points (LLM reasoning)
- Human checkpoints (questionnaire prompts)
- Database reads/writes (repository calls)
- Status transitions (with preconditions)
- Conditional branching and loops

Building each as a one-off hardcoded flow won't scale. We need **a generalized harness** that can express and execute any of these agent pipelines.

### 3.2 Research Questions (to resolve before building)

1. **Pipeline representation:** How do we define a workflow? Options:
   - State machine (explicit states + transitions + handlers)
   - DAG of steps with conditional edges
   - Sequential pipeline with branch/loop primitives
   - Hybrid: state machine for high-level flow, sequential steps within each state

2. **Step abstraction:** What's the unit of work?
   - Each step = a function `(context) => StepResult`
   - StepResult signals: `next(data)`, `branch(target)`, `pause(reason)`, `fail(error)`, `complete(data)`
   - Steps can be: LLM prompt, human question, DB operation, validation check, composite (sub-pipeline)

3. **Human interaction model:** How do pauses/resumes work?
   - Pipeline hits a human checkpoint → serializes state → yields control
   - On resume: deserializes state → continues from checkpoint
   - Must survive context clears (state persisted to `.project/`)

4. **Context & memory:** What does the pipeline context hold?
   - Current entity IDs being operated on
   - Accumulated decisions/answers
   - Phase/mode from Project entity
   - Session log reference

5. **Error & recovery:** How do we handle failures mid-pipeline?
   - Step retry with backoff?
   - Rollback to last checkpoint?
   - Surface to human with state dump?

6. **Pi integration:** How does the harness surface to the LLM?
   - Register one meta-tool (`prj_run_pipeline`) that the LLM invokes with a pipeline name?
   - Or register per-workflow tools that internally use the harness?
   - Or the harness drives the LLM (harness calls LLM, not the other way around)?

### 3.3 Candidate Architecture (to validate)

```
src/agents/
├── harness/
│   ├── types.ts          # Step, StepResult, PipelineContext, PipelineDef
│   ├── runner.ts         # Execute a pipeline definition against a context
│   ├── state.ts          # Serialize/deserialize pipeline state for pause/resume
│   └── registry.ts       # Register and look up pipeline definitions
├── steps/                # Reusable step primitives
│   ├── llm.ts            # Send prompt to LLM, parse response
│   ├── question.ts       # Present questionnaire, await answer
│   ├── db-read.ts        # Query database
│   ├── db-write.ts       # Mutate database (with transition validation)
│   ├── validate.ts       # Check preconditions / gate conditions
│   └── log.ts            # Write to session log
├── pipelines/            # Concrete workflow definitions
│   ├── phase1-interview.ts
│   ├── phase4-bootstrap.ts
│   ├── task-execution.ts
│   ├── verification-loop.ts
│   ├── change-request.ts
│   ├── needs-review.ts
│   └── ...
└── index.ts              # Public API
```

### 3.4 Immediate Next Steps

1. **Research spike:** Read pi extension API capabilities (tool registration, LLM interaction patterns, event hooks) to determine what integration model is feasible
2. **Prototype the harness core:** `types.ts` + `runner.ts` with a trivial 3-step pipeline
3. **Validate pause/resume:** Can we serialize mid-pipeline state and resume after context clear?
4. **Build one real pipeline:** Phase 4 Bootstrap (well-defined in `lifecycle.md`, exercises DB + questions + state transitions)
5. **Iterate the abstraction:** Refine step types and context model based on what the first real pipeline needs

---

## 4. Backlog (after harness)

- [ ] Remove debug tools (`_DEBUG_TOOLS.ts`, test suite) — see AGENTS.md removal checklist
- [ ] Register production tools that expose DB operations through the harness
- [ ] Build remaining 16+ pipeline definitions
- [ ] Session log auto-management (cold-start resume logic)
- [ ] Vector search integration for contextual retrieval during pipelines
- [ ] Phase gate automation (completion record generation + validation)

---

## 5. Key Files for Context Reload

| Need to understand… | Read… |
|---|---|
| What the framework defines | `FRAMEWORK/INDEX.md` → linked files |
| Agent conventions & rules | `AGENTS.md` (root) |
| What's built & where | This file (§2) + `archive/deliverables/TRACKER-database-module.md` |
| Extension entry point | `.pi/extensions/pi-project-framework/index.ts` |
| DB public API | `src/db/database.ts` |
| All entity schemas | `src/db/schema/` |
| What to build next | This file (§3) |
