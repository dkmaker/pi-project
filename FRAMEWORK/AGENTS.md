# FRAMEWORK — File Reference for AI Agents

This directory defines an **AI-Optimized Project Management Framework** for solo developers. It describes a structured entity model and a four-phase lifecycle designed so that any AI agent can resume work cold — with no chat history, no assumed context — solely from the written files.

---

## Files at a Glance

| File | What it contains |
|---|---|
| [INDEX.md](INDEX.md) | Entry point. Explains the three design principles, lists all documents, and shows the full entity hierarchy. Start here. |
| [lifecycle.md](lifecycle.md) | The four-phase project lifecycle: Interview → Planning → Decomposition → Implementation. Explains what happens in each phase, what its outputs are, and why context resets between phases are mandatory. |
| [project.md](project.md) | Definitions of the **Project**, **Goal**, and **Project Resource** entities (Tech Stack Entry, Shared Documentation Reference, Rule, Convention). These are the root-level, stable, project-wide entities. |
| [planning.md](planning.md) | Definitions of the **Milestone** and **Epic** entities. Milestones are outcome checkpoints; Epics are cohesive functional areas made up of Tasks. |
| [task.md](task.md) | Definition of the **Task**, **Subtask**, and **Delegation** entities. Task is the primary unit of work and the entity most optimized for agent handoff — every field exists because a cold-starting agent needs it. |
| [relationships.md](relationships.md) | Definitions of **Dependency**, **Blocker**, **Pattern Contract**, and **Pattern Dependency**. Covers how tasks relate to each other, what blocks them, and how interface/pattern changes propagate downstream via versioned contracts. |
| [verification.md](verification.md) | Definition of the **Verification** entity. Records how a task's approach or output was validated (documentation, research, testing, code review, external validation) — the answer to "correct, not just done." |
| [tracking.md](tracking.md) | Definitions of **Work Interval**, **Completion Record**, and the derived project-level cost/time summary. Work Intervals are recorded automatically by the extension; Completion Records are written collaboratively by agent, extension, and human. |
| [session-log.md](session-log.md) | Definitions of **Session Log**, **Decision**, and **Question**. The Session Log is the primary resumption artifact — updated at the end of every working session with exact state, next actions, and pending reviews. Decisions preserve reasoning; Questions capture open items before they become blockers. |
| [reference.md](reference.md) | Quick-reference tables: all Task status values, all Delegation levels, an entity-consumer map (who uses each entity and for what), and the full relationship map in diagram form. |

---

## Entity Hierarchy

```
Project
├── Goals
├── Project Resources (Tech Stack Entries, Docs, Rules, Conventions)
├── Milestones
│   └── references Epics
└── Epics
    └── Tasks
        ├── Subtasks
        ├── Blockers
        ├── Dependencies          (sequencing)
        ├── Pattern Contracts     (establishes interfaces for downstream tasks)
        ├── Pattern Dependencies  (relies on interfaces from upstream tasks)
        ├── Verifications
        ├── Work Intervals        (recorded by extension automatically)
        └── Completion Record     (written when task reaches Done)

Project live state
└── Session Log
    ├── → active Task
    └── → Pending Reviews

Questions → resolve into → Decisions → affect Tasks
```

---

## The Four Phases

| Phase | What happens | Output |
|---|---|---|
| **1 · Interview** | AI interviews the human to extract intent; creates Project, Goals, Resources, initial Decisions and Questions | Populated Project entity + all Project Resources |
| **2 · Epic & Milestone Planning** | AI proposes and refines Epic structure and Milestones; maps Goals to Epics | All Epics with scope, all Milestones with exit criteria |
| **3 · Task Research & Decomposition** | AI decomposes each Epic into Tasks and Subtasks, researches each task's approach, maps Dependencies and Pattern Contracts, pre-populates Verifications | Complete, execution-ready task graph |
| **4 · Implementation** | AI executes tasks per the task graph; records Work Intervals, writes Completion Records, propagates Pattern Contract changes | Shipped work + full audit trail |

A deliberate **context reset** occurs between each phase: once structured output exists, the conversation that produced it is discarded. The next phase agent reads only the clean structured files — denser, more precise, free of exploratory noise.

---

## Key Concepts for Agents

**Zero-assumption resumability** — every entity carries enough context to be understood in isolation. "See chat history" is an anti-pattern this framework explicitly rejects.

**Pattern Contracts & propagation** — when a task changes an interface that downstream tasks depend on, those tasks are automatically flagged `⚠️ Needs Review` with an inline version diff, so reviewers see exactly what changed without hunting through history.

**Delegation levels** — every Task has an explicit delegation level (`Implement`, `Plan`, `Research`, `Human`, `Specialist`) set before work begins. If an agent encounters something mid-task that changes the appropriate level, it surfaces this rather than proceeding.

**Session Log as cold-start anchor** — at the start of any session, an agent reads the Session Log to find the active task, its exact state, and the priority-ordered next actions. This is the entry point for resumption.

**Verification ≠ Acceptance Criteria** — Acceptance Criteria defines what done looks like; Verification records how correctness was confirmed against an authoritative source. A task can pass its own criteria and still be unverified.
