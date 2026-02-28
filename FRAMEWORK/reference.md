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

## Task Status Transition Rules

Every status transition has a defined trigger, precondition, required artifact, and authorizing party. Transitions not listed here are not permitted.

| From | To | Trigger | Precondition | Required Artifact | Authorized By |
|---|---|---|---|---|---|
| ⏳ Pending | 🔄 Active | Agent begins work | All hard Dependencies satisfied; no unresolved Blockers; no `⚠️ Needs Review` status; Epic Dependencies satisfied | Session Log updated with Active Task | Agent |
| ⏳ Pending | ⛔ Blocked | Blocker identified | — | Blocker record created | Agent |
| ⏳ Pending | ⚠️ Needs Review | Upstream Pattern Contract changed or Scope Change | — | Pattern Dependency Review Note populated | Automatic (system) |
| ⏳ Pending | ❌ Cancelled | Task dropped from scope | — | Cancellation rationale recorded in Task Notes | Human |
| 🔄 Active | 👀 In Review | Agent completes implementation | All Subtasks checked; Verifications with current result `passed` (or no verifications required for this task's risk level) | Completion Record written; Work Log aggregated | Agent |
| 🔄 Active | ⛔ Blocked | Blocker discovered mid-task | — | Blocker record created | Agent |
| 🔄 Active | ❌ Cancelled | Task dropped during execution | — | Abandonment Record written; work-in-progress documented | Human |
| ⛔ Blocked | 🔄 Active | Blocker cleared | Blocker Resolution Path completed | Blocker marked resolved | Agent or Human |
| ⛔ Blocked | ❌ Cancelled | Task dropped while blocked | — | Abandonment Record written | Human |
| ⚠️ Needs Review | ⏳ Pending | Needs Review Resolution completed (any outcome) | Review Record written in Task Notes | Review Record in Notes; Pattern Dependency Review Status updated | Agent (confirmed by Human for Human-delegation tasks) |
| 👀 In Review | ✅ Done | Human approves | No failed Verifications | Approval logged in Completion Record | Human |
| 👀 In Review | 🔄 Active | Verification failed OR Human requests revision | — | Verification failure: Blocker created; Human revision: revision notes in Completion Record | Automatic (verification failure) or Human |
| ✅ Done | — | — | Done is terminal. Tasks do not leave Done. Corrective work is a new Task. | — | — |

**Note on backward transitions:** The only defined backward transitions are `👀 In Review → 🔄 Active` (verification failure or human revision request) and `⚠️ Needs Review → ⏳ Pending` (after review resolution). No other backward transitions are permitted. If a Done task needs rework, a new corrective Task is created.

---

## Human Review Outcomes

When a task is in `👀 In Review`, the human has four defined outcomes. Each has a defined next state and required artifact:

### Approved
- Task moves to `✅ Done`
- Approval logged in Completion Record (`Completed By` field updated to reflect human approval)
- This is the standard path

### Accepted with Notes
- Task moves to `✅ Done`
- Completion Record Learnings field is populated with the human's observation
- Used when output is acceptable but something should inform future tasks (e.g., a stylistic choice the human prefers to handle differently going forward)
- If the learning is project-wide, it may generate a new or updated Convention (Project Resource)

### Minor Revision Needed
- Task returns to `🔄 Active`
- Revision scope is explicitly bounded in the human's review notes — the agent must not re-interpret or expand beyond the stated revision
- Completion Record is cleared (the task is not done yet; the record will be re-written when the task completes again)
- Agent executes the revision; task cycles back through Verifications and returns to `👀 In Review`

### Significant Rework
Two variants depending on whether the work can be recovered:
- **Recoverable:** Task returns to `🔄 Active` with a Blocker record (Type: Resource) describing what was wrong and what must change. Completion Record cleared.
- **Fundamentally wrong:** The original task is marked `✅ Done` (it was completed as specified — the specification was the problem). A new corrective Task is created via the Task Addition process (see [lifecycle.md](lifecycle.md)). A Decision record explains why the original was accepted and what the correct approach is. The corrective Task captures the rework scope precisely.

**The distinction between the two significant-rework variants is important:** The original task's completion is accurate history. Creating a corrective task preserves the record of what was built and why it needed changing — rather than retroactively failing a task that was correctly executed against its specification.

---

## Delegation Levels

| Level | Who executes | What the agent does |
|---|---|---|
| Implement | Agent | Executes autonomously end-to-end. Human reviews output after. |
| Plan | Agent + Human gate | Produces a step-by-step plan for human review before touching any code. |
| Research | Agent | Investigates and returns findings only. No code written. Human decides. |
| Human | Human | Requires human judgment. Agent may assist but must not proceed autonomously. |
| Specialist | Routed | Better handled by a different agent, tool, or model. Full routing process defined in [task.md](task.md). |

If an agent encounters something mid-task that changes the appropriate delegation level, it surfaces this rather than proceeding.

---

## Abandonment Records

Any entity that reaches `abandoned` status — a Task, Epic, Milestone, or Goal — **must** have an Abandonment Record. Abandoned status without an Abandonment Record is invalid. The entity's status transition is not complete until the record is written and human sign-off is recorded.

**An Abandonment Record consists of:**

- **Entity reference** — type and ID of what was abandoned
- **Abandoned At** — timestamp
- **Rationale** — why. Mandatory, not optional. "Won't do" is not sufficient — it must state what changed that makes this entity no longer viable or desirable.
- **State at abandonment** — what was already complete within this entity at the time of abandonment:
  - For Tasks: which Subtasks were done, which were not; any partially-written code or artifacts
  - For Epics: which Tasks were Done, which were Pending or Active; what was already built
  - For Milestones: which Associated Epics were complete, which were not
  - For Goals: which Contributing Epics were complete, which were not
- **Disposition of completed work** — what happens to work already done within the abandoned entity:
  - *Retained* — the completed work will be used even without the rest of the entity (state why it's still valid)
  - *Discarded* — the completed work should be undone; a new Task may be needed to revert it (create that Task)
  - *Archived* — kept for reference but not active in the current codebase
- **Impact on Goals** — if the abandoned entity was the sole or primary contributor to a Goal, the Goal's status must be evaluated. If a Goal can no longer be achieved, it must also be abandoned (with its own Abandonment Record) or revised via a Change Request.
- **Human sign-off** — required. Abandonment is a scope decision, not a status update.

---

## Tech Stack Version Update Process

When a Tech Stack Entry's version must change mid-project (security patch, breaking library update, forced upgrade), this is a defined process — not an informal edit to the entry.

**Trigger:** Human or agent determines a version change is required.

**Steps:**
1. The Tech Stack Entry is updated: new version recorded, a change note added to Project-Specific Notes explaining what changed and why.
2. All Verifications whose Source references this Tech Stack Entry are marked **Stale** (see [verification.md](verification.md)).
3. All Tasks whose Context field references this Tech Stack Entry (by Resource ID) have their **Research Date** evaluated: if the Research Date predates the version change, the Task receives a staleness marker in its Notes: "Referenced Tech Stack Entry [name] has been updated to [new version] since this task's research was performed. Re-verify Context before executing."
4. All Pattern Contracts established by Tasks that heavily use this Tech Stack Entry are evaluated: if the version change is breaking (API changes, removed features, changed behavior), the contracts must be re-evaluated. If the contract's Definition references version-specific behavior that has changed, the contract is re-versioned (triggering the downstream `⚠️ Needs Review` cascade — see [relationships.md](relationships.md)).
5. A **Decision** record is created documenting the version change: what changed in the library, why the update was required, and what its downstream impact was (Verifications marked stale, Tasks flagged, Pattern Contracts re-versioned).
6. If the version change has Epic-level impact (breaks an entire integration approach), a **Change Request** is initiated (see [change-management.md](change-management.md)).

---

## Full Relationship Map

```
Project
├── has Status (not started / in progress / complete / on hold / abandoned)
├── has many Goals (each with status and Completion Record)
├── has many Milestones (each with Milestone Review Record when reached)
│   └── references many Epics
├── has many Epics (each with Epic Completion Record when complete)
│   ├── has many Epic Dependencies (to/from other Epics)
│   ├── contains many Tasks
│   └── has Acceptance Criteria
├── has many Project Resources
│   ├── Tech Stack Entries (with Version Update process)
│   ├── Shared Documentation References
│   ├── Rules
│   └── Conventions
├── has many Decisions
├── has many Questions (with aging and escalation)
├── has Risk Register (see risk.md)
└── has Project Completion Record (when Status = complete)

Task
├── belongs to one Epic
├── has Research Date (for context staleness evaluation)
├── has many Subtasks
├── has many Blockers (types: Dependency / Decision / External / Resource / Specialist Routing / Verification Failure)
├── has many Dependencies (to/from other Tasks)        ← sequencing
├── has many Pattern Contracts (establishes patterns)  ← upstream side
├── has many Pattern Dependencies (relies on patterns) ← downstream side
├── has many Verifications (each with attempt history) ← see verification.md
├── references many Project Resources
├── has many Attachments (task-specific links, Specialist output)
├── has one Delegation level (with Specialist Routing process for Specialist level)
├── has Affected Files
├── has many Work Intervals (auto-recorded by extension)
└── has one Completion Record (when Done)

Pattern Contract (on upstream Task)
├── Status: draft / established / changed / superseded (with defined transitions)
└── change or supersession triggers ⚠️ Needs Review on downstream Tasks
    └── with version diff in Pattern Dependency Review Note
        └── resolved via Needs Review Resolution Process (3 outcomes)

Change Management
├── Change Request → approved → Scope Change
│   └── Scope Change cascades: Tasks ⚠️ Needs Review, Verifications Stale,
│       Pattern Contracts re-versioned, Phase re-runs initiated
└── Change Request → rejected → Decision record

Risk Register
├── Risk → mitigated (prevention)
├── Risk → realized → Blocker on affected Tasks
└── Risk → accepted (human sign-off)

Project live state
└── Session Log (collection of entries, most recent = active)
    ├── → Active Task (singular) or Active Task Set (with restrictions)
    └── → Pending Reviews (tasks flagged needs-review)

Question (with Session Count and Escalation Flag)
├── Impact references Task IDs → auto-generates Blocker when Task goes Active
└── may resolve into → Decision or Scope Change
```

---

## Entity Consumer Map

| Entity | Primary Consumer | Primary Purpose |
|---|---|---|
| Project | Human + Agent (cold start) | Stable orientation: what & why |
| Goal | Human | Scope arbitration: does this belong? |
| Project Resource | Agent | Shared knowledge: tech stack, rules, conventions, docs |
| Milestone | Human | Progress checkpoints: are we on track? |
| Milestone Review Record | Human | Retrospective: what happened at this checkpoint? |
| Epic | Human + Agent | Feature intent + acceptance: what does done look like? |
| Epic Dependency | Agent | Epic sequencing: can this Epic's tasks start? |
| Epic Completion Record | Human | Retrospective: what was built and at what cost? |
| Infrastructure Epic | Agent + Human | Non-Goal work: justified by Constraints or Project Resources |
| Task | Agent | Atomic execution: exactly what, where, how verified |
| Subtask | Agent | Step sequencing within a task |
| Delegation | Agent | Autonomy boundary: how much should the agent do? |
| Blocker | Human + Agent | Surfacing what's stuck and why |
| Dependency | Agent | Execution sequencing |
| Pattern Contract | Human + Agent | Scope change propagation: what does this task establish? |
| Pattern Dependency | Agent | Expectation tracking: what does this task rely on? |
| Verification | Human + Agent | Confidence: is this correct, not just done? (with attempt history) |
| Work Interval | Extension (automatic) | Active time tracking: how long did the agent actually run? |
| Completion Record | Agent + Extension + Human | Output metrics: what was produced, what did it cost? |
| Session Log | Agent (cold start) | Resumption: exactly where we are right now |
| Decision | Human + Agent | Reasoning preservation: why we built it this way |
| Question | Human | Capturing uncertainty before it becomes a blocker |
| Change Request | Human | Proposing and approving changes to stable entities |
| Scope Change | Human + Agent | Audit trail: what changed, before/after, cascade map |
| Risk | Human + Agent | Potential future problems: monitored, mitigated, or accepted |
| Abandonment Record | Human | Documented scope removal with sign-off |
| Project Completion Record | Human | Final capstone: total cost, scope delta, learnings |

---

## Cross-Reference Index

| Topic | File |
|---|---|
| Project lifecycle phases, Phase Completion Records, Phase 4 bootstrap | [lifecycle.md](lifecycle.md) |
| Project entity, Goals (with status rules), Project Completion | [project.md](project.md) |
| Milestones (with completion process), Epics (with completion process, Epic Dependencies, Infrastructure Epics) | [planning.md](planning.md) |
| Task, Subtask, Delegation, Specialist Routing | [task.md](task.md) |
| Dependency, Blocker, Pattern Contract (with status definitions), Pattern Dependency, Needs Review Resolution | [relationships.md](relationships.md) |
| Verification (with attempt history, failure recovery loop, staleness) | [verification.md](verification.md) |
| Work Interval, Completion Record, Project-Level Cost Summary | [tracking.md](tracking.md) |
| Session Log (cardinality, parallel work), Decision, Question (aging, escalation) | [session-log.md](session-log.md) |
| Change Request, Scope Change | [change-management.md](change-management.md) |
| Risk entity, Risk Register, Risk transitions | [risk.md](risk.md) |
| Status transition table, Human review outcomes, Abandonment Records, Tech Stack Version Update | [reference.md](reference.md) |
