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
Relationships, blockers, affected code, delegation intent, status transitions, change history, and failure recovery paths are all stated — never assumed. This is what separates an AI-optimized system from a human-memory-dependent one.

---

## Documents

### Process
| File | What it covers |
|---|---|
| [lifecycle.md](lifecycle.md) | The four phases: Interview → Planning → Decomposition → Implementation. Phase Completion Records and gates. Phase 4 bootstrap. Task Addition process. Infeasibility exit. Existing codebase onboarding. |

### Entities — Project Level
| File | Entities covered |
|---|---|
| [project.md](project.md) | Project (with Status and Project Completion Record), Goal (with status transition rules and Completion Record), Project Resource (Tech Stack, Docs, Rules, Conventions) |
| [planning.md](planning.md) | Milestone (with Completion Process and Milestone Review Record), Epic (with Completion Process, Epic Completion Record, Epic Dependencies, Infrastructure Epics) |
| [change-management.md](change-management.md) | Change Request, Scope Change |
| [risk.md](risk.md) | Risk entity, Risk Register, Risk status transitions |

### Entities — Task Level
| File | Entities covered |
|---|---|
| [task.md](task.md) | Task (with Research Date), Subtask, Delegation (with Specialist Routing process) |
| [relationships.md](relationships.md) | Dependency, Blocker, Pattern Contract (with status definitions and superseded behavior), Pattern Dependency, Needs Review Resolution Process |
| [verification.md](verification.md) | Verification (with attempt history, failure recovery loop, staleness) |
| [tracking.md](tracking.md) | Work Interval, Completion Record, Project-Level Time & Cost Summary |

### Reference
| File | What it covers |
|---|---|
| [session-log.md](session-log.md) | Session Log (cardinality, parallel work rules), Decision, Question (with aging and escalation) |
| [reference.md](reference.md) | Task status values and transition table, Human review outcomes, Delegation levels, Abandonment Records, Tech Stack Version Update process, Full relationship map, Entity-consumer table, Cross-reference index |

### Diagrams (Handover to Development)
| File | What it covers |
|---|---|
| [er-diagram.md](er-diagram.md) | Full entity-relationship diagram — all entities, fields, and relationships as a proposed database schema |
| [flowcharts.md](flowcharts.md) | All process flowcharts: **Flow 0 — Stage + Mode global tracker** (cold-start decision table), high-level lifecycle, per-phase detail, task execution, verification recovery, change management, specialist routing, epic/milestone/goal completion, question escalation, risk lifecycle, phase gate |

---

## Entity Hierarchy at a Glance

```
Project
├── Stage: uninitialised | phase_1 | phase_2 | phase_3 | phase_4 | complete | abandoned | on_hold
├── Mode:  normal | change_management | infeasibility_review | phase_gate | awaiting_specialist
├── Status: not started / in progress / complete / on hold / abandoned  ← coarse human-facing label
├── Goals (Status rules: not started → in progress → achieved / abandoned)
│   └── Goal Completion Record (when achieved)
├── Project Resources (Tech Stack, Docs, Rules, Conventions)
│   └── Tech Stack Entries (with Version Update process)
├── Milestones (with Milestone Review Record when reached)
│   └── references Epics
├── Epics (with Epic Completion Record when complete)
│   ├── Epic Dependencies (hard/soft, with Gate Conditions)  ← NEW
│   ├── Infrastructure Epics (linked to Constraints, not Goals)  ← NEW
│   └── Tasks
│       ├── Subtasks
│       ├── Blockers (types incl. Specialist Routing, Verification Failure)
│       ├── Dependencies          (sequencing)
│       ├── Pattern Contracts     (establishes patterns; draft/established/changed/superseded)
│       ├── Pattern Dependencies  (relies on patterns; with Needs Review Resolution)
│       ├── Verifications         (with attempt history and failure recovery loop)
│       ├── Work Intervals        (auto-recorded by extension)
│       └── Completion Record     (written at Done)
├── Risk Register  ← NEW
│   └── Risks (open / mitigated / realized → Blocker / accepted)
├── Change Requests → Scope Changes  ← NEW
└── Project Completion Record (when Status = complete)  ← NEW

Project live state
└── Session Log (ordered collection of entries; most recent = active)
    ├── Ordinary entries (per session)
    ├── Phase Completion Records (gates between phases)  ← NEW
    ├── → Active Task (singular) or Active Task Set (with restrictions)  ← clarified
    └── → Pending Reviews (tasks flagged needs-review)

Questions (with Session Count, Escalation Flag, auto-Blocker generation)
└── resolve into → Decisions or Scope Changes
    └── Decisions may affect Tasks (via Decision.AffectedTasks)
```

---

## The One Rule

**Nothing lives in anyone's head or in chat history.** Every decision has a Decision record with rationale. Every open question has a Question record. Every blocker is named. Every pattern a task establishes is declared. Every constraint is written down. Every change to a stable entity goes through a Change Request. Every risk is tracked. Every status transition has a defined trigger and required artifact.

This is what makes the system work for an AI agent operating cold — and for you returning to a project after two weeks away.
