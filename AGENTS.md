# AGENTS.md — Project Agent Guide

This file orients AI agents to the structure of this repository. Read it before doing anything else.

---

## Repository Structure

```
.
└── FRAMEWORK/          # AI-Optimized Project Management Framework (documentation only)
    ├── AGENTS.md       # Detailed file reference for agents — start here for framework questions
    ├── INDEX.md        # Framework entry point: design principles + entity hierarchy overview
    ├── lifecycle.md    # Four-phase lifecycle: Interview → Planning → Decomposition → Implementation
    ├── project.md      # Project, Goal, and Project Resource entity definitions
    ├── planning.md     # Milestone and Epic entity definitions
    ├── task.md         # Task, Subtask, and Delegation entity definitions
    ├── relationships.md# Dependency, Blocker, Pattern Contract, Pattern Dependency definitions
    ├── verification.md # Verification entity — how correctness is confirmed, not just doneness
    ├── tracking.md     # Work Interval, Completion Record, project-level cost/time summary
    ├── session-log.md  # Session Log, Decision, and Question entity definitions
    └── reference.md    # Quick-reference: status values, delegation levels, entity-consumer map
```

---

## What This Repository Contains

The `FRAMEWORK/` directory defines a **structured project management framework** designed for AI agents working alongside solo developers. It is a documentation system — it describes entities, relationships, and a lifecycle, not executable code.

The framework's core purpose: any agent should be able to resume any project cold, from the written files alone, with no chat history and no assumed context.

For a full description of each file and the framework's key concepts, see **[FRAMEWORK/AGENTS.md](FRAMEWORK/AGENTS.md)**.

---

## Quick-Start for Agents

1. **Read [FRAMEWORK/INDEX.md](FRAMEWORK/INDEX.md)** for the design principles and entity hierarchy.
2. **Read [FRAMEWORK/lifecycle.md](FRAMEWORK/lifecycle.md)** to understand the four phases and why context resets between them are non-negotiable.
3. **Read the entity files** relevant to the phase you're operating in:
   - Phase 1 (Interview): `project.md`, `session-log.md`
   - Phase 2 (Planning): `planning.md`
   - Phase 3 (Decomposition): `task.md`, `relationships.md`, `verification.md`
   - Phase 4 (Implementation): `tracking.md`, `session-log.md`, `reference.md`

---

## Critical Conventions

- **Nothing lives in chat history.** Every decision, question, blocker, and pattern is written to a file. If it isn't written, it doesn't exist.
- **Session Log is the cold-start anchor.** The first thing an implementing agent reads is the Session Log — it contains the active task, exact state, and priority-ordered next actions.
- **Pattern Contract changes propagate.** If an upstream task's interface changes, downstream tasks are flagged `⚠️ Needs Review` with an inline version diff. An agent must check its Pattern Dependencies before starting any task in that status.
- **Verification ≠ done.** A task passing its Acceptance Criteria is not the same as a task being verified. Verification confirms correctness against an authoritative source (docs, tests, human review). High-risk tasks require it.
- **Delegation level is non-negotiable mid-task.** If something arises that changes a task's appropriate delegation level, surface it — do not proceed autonomously past the boundary.
