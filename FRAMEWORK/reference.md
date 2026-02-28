# Reference: Statuses, Delegation, Relationships & Entity Map

---

## Task Status Values

| Status | Meaning |
|---|---|
| ⏳ Pending | Defined, not started, no blocker |
| 🔄 Active | Currently being worked on |
| ⛔ Blocked | Cannot proceed — always has an explicit Blocker record |
| ⚠️ Needs Review | A Pattern Contract it depends on changed, or scope shifted — must be reviewed before starting |
| 👀 In Review | Done, awaiting human review or verification |
| ✅ Done | Complete, verified, committed |
| ❌ Cancelled | Won't do — always states why |

The `⚠️ Needs Review` status is the mechanism that propagates scope changes downstream. It is not a blocker (the task hasn't started) — it is a flag that the task's context or approach may be outdated before a single line is written.

---

## Delegation Levels

| Level | Who executes | What the agent does |
|---|---|---|
| Implement | Agent | Executes autonomously end-to-end. Human reviews output after. |
| Plan | Agent + Human gate | Produces a step-by-step plan for human review before touching any code. |
| Research | Agent | Investigates and returns findings only. No code written. Human decides. |
| Human | Human | Requires human judgment. Agent may assist but must not proceed autonomously. |
| Specialist | Routed | Better handled by a different agent, tool, or model. Surface to human for routing. |

If an agent encounters something mid-task that changes the appropriate delegation level, it surfaces this rather than proceeding.

---

## Full Relationship Map

```
Project
├── has many Goals
├── has many Milestones
│   └── references many Epics
├── has many Epics
│   ├── contains many Tasks
│   └── has Acceptance Criteria
├── has many Project Resources
│   ├── Tech Stack Entries
│   ├── Shared Documentation References
│   ├── Rules
│   └── Conventions
└── has many Decisions

Task
├── belongs to one Epic
├── has many Subtasks
├── has many Blockers
├── has many Dependencies (to/from other Tasks)        ← sequencing
├── has many Pattern Contracts (establishes patterns)  ← upstream side
├── has many Pattern Dependencies (relies on patterns) ← downstream side
├── has many Verifications
├── references many Project Resources
├── has many Attachments (task-specific links)
├── has one Delegation level
├── has Affected Files
├── has many Work Intervals (active time log)          ← recorded by extension
└── has one Completion Record (when Done)              ← agent + extension + human

Pattern Contract (on upstream Task)
└── change triggers ⚠️ Needs Review on downstream Tasks' Pattern Dependencies
    └── with version diff: locked version → current version + change summary

Project live state
└── has one active Session Log
    ├── → active Task
    └── → Pending Reviews (tasks flagged needs-review)

Question
└── may resolve into → Decision
    └── may affect Tasks (via Decision.AffectedTasks)
```

---

## Entity Consumer Map

| Entity | Primary Consumer | Primary Purpose |
|---|---|---|
| Project | Human + Agent (cold start) | Stable orientation: what & why |
| Goal | Human | Scope arbitration: does this belong? |
| Project Resource | Agent | Shared knowledge: tech stack, rules, conventions, docs |
| Milestone | Human | Progress checkpoints: are we on track? |
| Epic | Human + Agent | Feature intent + acceptance: what does done look like? |
| Task | Agent | Atomic execution: exactly what, where, how verified |
| Subtask | Agent | Step sequencing within a task |
| Delegation | Agent | Autonomy boundary: how much should the agent do? |
| Blocker | Human + Agent | Surfacing what's stuck and why |
| Dependency | Agent | Execution sequencing |
| Pattern Contract | Human + Agent | Scope change propagation: what does this task establish? |
| Pattern Dependency | Agent | Expectation tracking: what does this task rely on? |
| Verification | Human + Agent | Confidence: is this correct, not just done? |
| Work Interval | Extension (automatic) | Active time tracking: how long did the agent actually run? |
| Completion Record | Agent + Extension + Human | Output metrics: what was produced, what did it cost? |
| Session Log | Agent (cold start) | Resumption: exactly where we are right now |
| Decision | Human + Agent | Reasoning preservation: why we built it this way |
| Question | Human | Capturing uncertainty before it becomes a blocker |

---

## Cross-Reference Index

| Topic | File |
|---|---|
| Project lifecycle phases | [lifecycle.md](lifecycle.md) |
| Project entity, Goals, Resources | [project.md](project.md) |
| Milestones, Epics | [planning.md](planning.md) |
| Task, Subtask, Delegation | [task.md](task.md) |
| Dependency, Blocker, Pattern Contract, Pattern Dependency | [relationships.md](relationships.md) |
| Verification | [verification.md](verification.md) |
| Work Interval, Completion Record, Cost Summary | [tracking.md](tracking.md) |
| Session Log, Decision, Question | [session-log.md](session-log.md) |
