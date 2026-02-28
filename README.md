# pi-project

> **An AI-Optimized Project Management Framework as a native Pi Coding Agent package.**

Install it. Start a project. Never lose context again.

```bash
pi install git:github.com/dkmaker/pi-project
```

---

## What Is This?

`pi-project` is a [Pi Coding Agent](https://github.com/badlogic/pi-mono) package that brings a fully structured, AI-native project management framework directly into your coding sessions. It was designed around a single principle:

**Nothing lives in chat history. Everything lives in files.**

Any AI agent — or human — should be able to pick up any project cold, from the written files alone, with no prior context and no assumptions. This package makes that happen automatically, at every touchpoint of your Pi session.

---

## What's Inside

The package is three things in one:

| Layer | What it does |
|-------|-------------|
| **Extension** | Hooks into Pi's session lifecycle, tool calls, and agent turns to actively maintain project state |
| **Skill** | A comprehensive SKILL.md giving any agent complete knowledge of the framework, all entities, all processes, and all available tools |
| **Subagent Pipelines** | Context-isolated agents for heavy work: interviews, decomposition, implementation, review, gate checks |

---

## The Framework

Projects move through four phases. Each phase produces structured files. Each phase ends with a gate check before the next begins.

```
Phase 1: Interview        → Project entity + Tech Stack + Goals + Resources
Phase 2: Epic Planning    → Epics + Milestones + Goal-to-Epic mapping
Phase 3: Task Research    → Full task graph with Context, Research Dates, Pattern Contracts
Phase 4: Implementation   → Execute against the entity model, tracked automatically
```

### Entity Hierarchy

```
Project
├── Stage: uninitialised | phase_1 | phase_2 | phase_3 | phase_4 | complete | abandoned | on_hold
├── Mode:  normal | change_management | infeasibility_review | phase_gate | awaiting_specialist
├── Goals
├── Project Resources (Tech Stack, Docs, Rules, Conventions)
├── Milestones → Epics → Tasks
│   ├── Subtasks (ordered checklist)
│   ├── Blockers (typed, with resolution paths)
│   ├── Dependencies (hard/soft)
│   ├── Pattern Contracts (draft → established → changed → superseded)
│   ├── Pattern Dependencies (with Needs Review propagation)
│   ├── Verifications (with attempt history + failure recovery loop)
│   └── Work Intervals ← written automatically by this extension
├── Risk Register
├── Change Requests → Scope Changes
└── Session Log (ordered, most recent = cold-start anchor)
    └── Phase Completion Records (gate status: passed | not passed)

Decisions  ·  Questions (with escalation at session 3+)
```

---

## What the Extension Does Automatically

### On every session start
- Reads `Project.stage` and `Project.mode` — the two fields that tell any agent where it is
- Injects the active task, Exact State, and open questions into the agent's context
- Surfaces escalated Questions (open for 3+ sessions) as visible warnings
- Sets a persistent status widget: `[phase_4 | normal | T-023]`

### During every agent turn
- Injects a compact framework state header so the agent stays oriented
- Watches file writes — warns when a file outside the active task's **Affected Files** scope is touched
- Watches Pattern Contract files — flags downstream tasks for `⚠️ Needs Review` when they change

### Automatically, every turn
- Records **Work Intervals** (`agent_start`/`agent_end`) — start time, end time, active duration, model, token counts, estimated cost — written to the task's Work Log without the agent needing to do anything

### On compaction
- Provides a custom compaction summary that preserves framework state (Active Task, Exact State, open Questions) so long sessions don't lose orientation

### On session end
- Prompts for Session Log update with current Exact State before exiting

---

## Slash Commands

All commands are prefixed `/prj-`.

| Command | Description |
|---------|-------------|
| `/prj-status` | Dashboard: stage, mode, active task, question count, pending reviews, cost summary |
| `/prj-tasks` | Task table for the active epic |
| `/prj-task <id>` | Full task detail: all fields, subtask checklist, blockers, verifications |
| `/prj-epic <id>` | Epic detail + full task list |
| `/prj-session` | Current Session Log: Active Task, Exact State, Next Actions |
| `/prj-questions` | Open Questions — escalated ones highlighted |
| `/prj-blockers` | All active Blockers across all tasks |
| `/prj-review` | Tasks in `⚠️ Needs Review` status with version diffs |
| `/prj-risks` | Risk Register |
| `/prj-decisions` | Decision log with rationale |
| `/prj-changes` | Change Requests and Scope Changes |
| `/prj-cost` | Time & cost summary by task, epic, and model |
| `/prj-init` | **Launch the Phase 1 interview** (interactive TUI widget) |
| `/prj-gate` | Run Phase Completion Record gate check for the current phase |
| `/prj-subagent <pipeline> [id]` | Launch a subagent pipeline |
| `/prj-compact` | Manually trigger a framework-aware compaction summary |

---

## LLM-Callable Tools

The agent uses these tools to interact with the framework. All have clean Pi UI rendering.

**Session:** `prj_session_start` · `prj_session_end` · `prj_phase_gate_check`

**Task lifecycle:** `prj_task_activate` · `prj_task_block` · `prj_task_complete` · `prj_task_review_outcome`

**Entities:** `prj_decision_record` · `prj_question_create` · `prj_question_resolve` · `prj_risk_add` · `prj_change_request` · `prj_verification_record`

**Patterns:** `prj_pattern_contract_update` · `prj_needs_review_resolve`

**Queries:** `prj_status_read` · `prj_task_read` · `prj_work_log_summary`

---

## Subagent Pipelines

Heavy work runs in context-isolated subagents, keeping the main session clean.

| Pipeline | What it does |
|----------|-------------|
| `implement <T-id>` | scout → planner → worker — full autonomous task execution |
| `decompose <E-id>` | Decompose an Epic into a full Task graph (Phase 3 assist) |
| `review <T-id>` | Review a completed task against its Completion Record |
| `gate-check` | Validate Phase Completion Record checklist — pass or fail with specifics |
| `risk-scan` | Scan all tasks and decisions for unrecorded risks |
| `stale-check` | Find tasks with Research Dates older than 60 days or stale Tech Stack references |

---

## The Interview

`/prj-init` launches a fully interactive Phase 1 interview — not a chat, not a form, but a structured TUI widget built directly into Pi:

- **Single-choice** questions with keyboard navigation
- **Multi-select** for categories (tech stack, non-goals, etc.)
- **Free-text** entry for open answers, vision, constraints
- **Tab bar** navigation across all interview topics with answered/unanswered indicators
- **Review page** before submission showing all answers
- After collection: a synthesis subagent writes all entity files in one isolated context pass — the main agent context is untouched

---

## Project File Layout

The framework stores all data in a `FRAMEWORK/` directory at your project root:

```
FRAMEWORK/
├── project.md          # Project entity: Stage, Mode, Goals, Constraints
├── planning.md         # Milestones and Epics
├── session-log.md      # Ordered session entries (most recent first — cold-start anchor)
├── tasks/
│   ├── T-001.md        # Full task files: all fields, subtasks, blockers, verifications
│   └── ...
├── work-log/
│   └── T-001.md        # Work Intervals (written by extension — not by agent)
├── decisions.md
├── questions.md
├── risks.md
├── changes.md
└── resources/
    ├── tech-stack.md
    ├── rules.md
    └── conventions.md
```

Everything is plain Markdown. Human-readable. AI-readable. No database, no lock-in.

---

## Design Documents

The full design and research document is at [`PI-FRAMEWORK-PACKAGE-DESIGN.md`](./PI-FRAMEWORK-PACKAGE-DESIGN.md). It contains:

- Complete Pi Extension API reference with real code examples
- Full `@mariozechner/pi-tui` component API (pulled from actual type definitions)
- Every framework entity mapped to its Pi hook
- All tool signatures and command definitions
- Build sequence (34 steps in 8 phases)
- Critical design decisions with rationale
- References to all Pi source files used as research

The framework specification itself lives in [`FRAMEWORK/`](./FRAMEWORK/) — 14 documents covering every entity, relationship, lifecycle phase, process flowchart, and ER diagram.

---

## Install

```bash
# Global install
pi install git:github.com/dkmaker/pi-project

# Project-scoped (auto-installs for teammates on startup) — recommended
pi install -l git:github.com/dkmaker/pi-project

# Try without installing
pi -e git:github.com/dkmaker/pi-project

# Pinned version
pi install git:github.com/dkmaker/pi-project@v1.0.0
```

---

## Status

**Early design / pre-implementation.** The framework specification and package design are complete. Implementation has not started.

See [`PI-FRAMEWORK-PACKAGE-DESIGN.md`](./PI-FRAMEWORK-PACKAGE-DESIGN.md) for the complete build plan.
