# AI-Optimized Project Management Framework
### For Solo Developers · Repository-Centric · AI Agent-Ready

---

## Design Principles

Three principles shape every decision in this framework:

**1. Zero-assumption resumability.**
Any entity must carry enough context that a human or AI agent with no prior knowledge can understand it in isolation. "See chat history" or "you know what I mean" are anti-patterns.

**2. Progressive detail.**
Entities at the top of the hierarchy (Project, Epic) are coarse and stable. Entities at the bottom (Task, Subtask) are fine-grained and change often. Don't force detail where it doesn't yet exist.

**3. Explicit over implicit.**
Relationships, blockers, affected code, and delegation intent are all stated — never assumed. This is what separates an AI-optimized system from a human-memory-dependent one.

---

## Documents

### Process
| File | What it covers |
|---|---|
| [lifecycle.md](lifecycle.md) | The four phases: Interview → Planning → Decomposition → Implementation, and why context resets between them are non-negotiable |

### Entities — Project Level
| File | Entities covered |
|---|---|
| [project.md](project.md) | Project, Goal, Project Resource (Tech Stack, Docs, Rules, Conventions) |
| [planning.md](planning.md) | Milestone, Epic |

### Entities — Task Level
| File | Entities covered |
|---|---|
| [task.md](task.md) | Task, Subtask, Delegation |
| [relationships.md](relationships.md) | Dependency, Blocker, Pattern Contract, Pattern Dependency |
| [verification.md](verification.md) | Verification |
| [tracking.md](tracking.md) | Work Interval, Completion Record, Project-Level Time & Cost Summary |

### Reference
| File | What it covers |
|---|---|
| [session-log.md](session-log.md) | Session Log, Decision, Question |
| [reference.md](reference.md) | Task status values, Delegation levels, Entity-consumer table, Full relationship map |

---

## Entity Hierarchy at a Glance

```
Project
├── Goals
├── Project Resources (Tech Stack, Docs, Rules, Conventions)
├── Milestones
│   └── references Epics
└── Epics
    └── Tasks
        ├── Subtasks
        ├── Blockers
        ├── Dependencies          (sequencing)
        ├── Pattern Contracts     (establishes patterns for downstream)
        ├── Pattern Dependencies  (relies on patterns from upstream)
        ├── Verifications
        ├── Work Intervals        (auto-recorded by extension)
        └── Completion Record     (written at Done)

Project live state
└── Session Log
    ├── → active Task
    └── → Pending Reviews

Questions → resolve into → Decisions → affect Tasks
```

---

## The One Rule

**Nothing lives in anyone's head or in chat history.** Every decision has a Decision record with rationale. Every open question has a Question record. Every blocker is named. Every pattern a task establishes is declared. Every constraint is written down. This is what makes the system work for an AI agent operating cold — and for you returning to a project after two weeks away.
