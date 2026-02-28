# Entities: Milestone & Epic

---

## Entity: Milestone

A **Milestone** is a meaningful checkpoint in the project timeline. It represents a state the project has reached, not a unit of work to be done. Milestones answer: *are we making progress toward something shippable or demonstrable?*

Milestones are coarse-grained and relatively stable. A project might have 3–8 milestones total. They are not sprints — they don't have fixed durations by default.

**A Milestone consists of:**

- **Name** — short label, e.g. "MVP", "Beta", "Public Launch"
- **Description** — what state the project is in when this milestone is reached. Written as a present-tense description: "The app is deployed, users can create accounts, and the core workflow is functional end-to-end."
- **Exit Criteria** — a checklist of conditions that must all be true for the milestone to be considered reached. These are observable facts, not tasks. They are the milestone's definition of done.
- **Target Date** — an approximate date or time horizon. Can be a range or quarter. Not a hard deadline unless the project has one.
- **Status** — pending / active / reached / abandoned
- **Associated Epics** — which epics must be complete (or sufficiently complete) to reach this milestone. This is the structural link between milestones and work.
- **Notes** — retrospective notes once reached: what slipped, what was cut, what changed.

**Relationship:** A Milestone does not *contain* Epics. It *references* them. Epics are defined independently and tagged to a Milestone.

---

## Milestone Completion Process

Milestone completion is triggered when all Associated Epics reach `complete`. It is not automatic — the agent evaluates Exit Criteria and the human confirms.

**Step 1: Exit Criteria evaluation.**
The agent evaluates each Exit Criterion in the checklist. Each criterion was written as an observable fact (not a task), so it is evaluatable:
- **Agent-verifiable criteria** — the agent checks and records a result (met / not met), with a brief note on how it was verified
- **Human-verification-required criteria** — criteria that require visual inspection, user testing, external confirmation, or judgment the agent cannot make are flagged explicitly and presented to the human as a checklist for manual confirmation. The agent does not assume these are met.

**Step 2: All criteria met → flag for human confirmation.**
The agent presents the completed evaluation to the human. Human reviews and confirms. On confirmation:
- Milestone Status moves to `reached`
- A **Milestone Review Record** is written (see below)
- Goal status is re-evaluated for all Goals whose Contributing Epics are now all complete (see [project.md](project.md))
- Open Risks (see [risk.md](risk.md)) are reviewed: accepted risks are re-confirmed or escalated; any remaining open risks with no affected active Tasks are noted in the Milestone Review Record

**Step 3: Criteria not all met despite Epics being complete.**
This is a named gap — not a silent failure. Three defined resolution paths:
- **New Tasks needed** — create additional Tasks via the Task Addition process (see [lifecycle.md](lifecycle.md)), which may reopen the relevant Epic
- **Criteria revision** — the criteria were wrong or over-specified; revise via a Change Request (see [change-management.md](change-management.md))
- **Explicit scope acceptance** — the human acknowledges the gap and accepts the Milestone as reached with a documented caveat. The caveat is mandatory; a Milestone cannot be silently accepted despite unmet criteria.

### Milestone Review Record

Written when a Milestone is confirmed reached. Fields:
- **Reached At** — timestamp
- **Confirmed By** — human identifier
- **Exit Criteria results** — each criterion and its verification result
- **Epics on time vs. slipped** — which Associated Epics completed within their planned scope and which ran over or were modified
- **Scope delta** — what was cut from this Milestone vs. the original plan (via Scope Changes or Abandonment), and what was added
- **Actual AI cost for Milestone scope** — sum of Work Interval costs across all Tasks in Associated Epics
- **Key decisions made during this Milestone** — Decision IDs with brief summaries
- **Risks realized** — any Risks (see [risk.md](risk.md)) that materialized during this Milestone's execution
- **Notes** — anything that should inform the next Milestone's planning

---

## Entity: Epic

An **Epic** is a cohesive area of functionality — a meaningful feature or capability that requires multiple tasks to build. It is the unit of *intent* at the feature level.

An Epic answers: *what capability are we building, and what does it mean for that capability to be complete?*

Epics are stable enough to plan around but not permanent. A project might have 5–20 epics over its lifetime. An epic should be small enough that it's completable in a few weeks of focused work.

**An Epic consists of:**

- **Name** — short, descriptive. "User Authentication", "Item Filtering", "Email Notifications"
- **Description** — 2–5 sentences explaining what this epic is about, what user need it addresses, and why it exists. This is the "why" for everyone who works on tasks within it.
- **Scope — In** — what is explicitly included in this epic. Bullet list of capabilities.
- **Scope — Out** — what is explicitly excluded. This prevents tasks from growing unboundedly and clarifies where adjacent epics begin.
- **Milestone** — which milestone this epic contributes to.
- **Goals** — which project-level goals this epic advances. For Infrastructure Epics (see below), this field may reference Constraints or Project Resources instead of Goals.
- **Epic Dependencies** — which other Epics this Epic depends on. See Epic Dependency entity below.
- **Acceptance Criteria** — the observable conditions that define this epic as complete. Written from the perspective of the user or system, not as implementation tasks. An AI agent reviewing these should be able to determine if the epic is done or not.
- **Status** — pending / active / complete / abandoned
- **Tasks** — the list of tasks that implement this epic (defined separately, referenced here).
- **Notes / Learnings** — running notes on decisions made, scope changes, surprises encountered. This becomes valuable context for future epics in the same area.

**Relationship:** An Epic *contains* Tasks (as references). A Task belongs to exactly one Epic. An Epic belongs to one Milestone.

---

## Epic Completion Process

Epic completion is triggered when all Tasks within the Epic reach `✅ Done`. It is not automatic — the agent evaluates Acceptance Criteria and the human confirms.

**Step 1: Acceptance Criteria evaluation.**
The agent evaluates each Acceptance Criterion. These were written to be observable and agent-verifiable (that standard was set in Phase 2):
- **Agent-verifiable criteria** — checked and result recorded (met / not met) with a brief verification note
- **Human-verification-required criteria** — flagged explicitly and presented to the human for manual confirmation

**Step 2: All criteria met → flag for human confirmation.**
Human reviews and confirms. On confirmation:
- Epic Status moves to `complete`
- An **Epic Completion Record** is written (see below)
- The Milestone completion check is triggered (see Milestone Completion Process above)
- Goal status is re-evaluated (see [project.md](project.md))

**Step 3: Criteria not all met despite Tasks being Done.**
Three defined resolution paths (same as Milestone, applied at Epic scope):
- **New Tasks** via Task Addition process (see [lifecycle.md](lifecycle.md))
- **Criteria revision** via Change Request
- **Explicit scope acceptance** with mandatory documentation

### Epic Completion Record

Written when an Epic is confirmed complete. Fields:
- **Completed At** — timestamp
- **Confirmed By** — human identifier
- **Acceptance Criteria results** — each criterion and its verification result
- **Scope delta** — what changed from the original Epic definition (Scope Changes, task additions, task cancellations)
- **Total Tasks** — count of Done / Cancelled tasks in the Epic
- **Total Active AI Time** — sum of Work Interval durations across all Tasks in the Epic
- **Total Estimated Cost** — sum of Work Interval costs across all Tasks in the Epic
- **Notes / Learnings** — what should inform future Epics in the same area. This populates the Epic's Notes/Learnings field.

---

## Entity: Epic Dependency

An **Epic Dependency** is a directed sequencing relationship between two Epics. It is the Epic-level equivalent of the Task Dependency entity, and exists because Epics absolutely depend on each other in practice — auth must precede user data, a data layer must precede an API — and these constraints must be structurally recorded, not left as implicit shared understanding.

**An Epic Dependency consists of:**

- **Requires** — the Epic ID that must reach a defined state before this Epic's Tasks can begin
- **Enables** — this Epic (the inverse of Requires, for the prerequisite Epic's record)
- **Nature** — hard or soft:
  - *Hard* — no Tasks in the dependent Epic can start until the prerequisite Epic is complete (or reaches its Gate Condition)
  - *Soft* — some Tasks in the dependent Epic may begin earlier, but the Epic should generally follow the prerequisite
- **Gate Condition** — for hard dependencies, what specifically must be true in the prerequisite Epic before the dependent Epic can start. This may be more specific than full Epic completion: "Epic 1's Pattern Contract for the auth interface must be Established" is a valid gate, meaning the dependent Epic's tasks can begin once that specific contract is live, even if Epic 1 is not yet fully complete.

**Epic Dependencies are evaluated during Phase 4 task selection.** An agent must not start tasks in an Epic whose hard Epic Dependencies are not satisfied. The task selection logic reads:
1. Are all hard Epic Dependencies for this Epic satisfied (prerequisite Epic complete, or Gate Condition met)?
2. If not, skip this Epic's tasks and select from an Epic whose dependencies are satisfied.

**Epic Dependencies are defined during Phase 2** (alongside Epic sequencing discussions) and updated during Phase 3 if the task-level dependency graph reveals inter-Epic constraints not visible at the Epic level. Any update to an Epic Dependency after Phase 2 must be recorded as a Scope Change (see [change-management.md](change-management.md)).

---

## Infrastructure Epics

Not all necessary work advances a user-facing Goal. DevOps setup, CI/CD pipelines, security hardening, developer tooling, and test infrastructure are real Epics that must be defined and tracked — but they do not map to Goals.

**An Infrastructure Epic is a recognized Epic pattern** with a modified justification requirement:

- An Infrastructure Epic does not require a Goal association. Instead, it **must** link to at least one of:
  - A **Constraint** (e.g., "CI/CD setup is required by the Constraint: all code must be continuously deployed")
  - A **Rule or Convention** (Project Resource) that the Epic establishes (e.g., "this Epic creates the test infrastructure that the Rule 'all public APIs must have integration tests' depends on")
- An Infrastructure Epic that cannot be linked to a Constraint or Project Resource it justifies is a scope-creep signal. It must be challenged: why does this work exist if it doesn't fulfill a Constraint or establish a Rule?

**Infrastructure Epics are identified during Phase 2** alongside functional Epics. They receive the same Scope-In/Scope-Out rigor, the same Acceptance Criteria, and follow the same Epic Completion process. They are not second-class Epics — they are a distinct category with a distinct justification model.

**Infrastructure Epics appear in Epic Dependencies** like any other Epic. A functional Epic that depends on test infrastructure being in place declares an Epic Dependency on the Infrastructure Epic, hard or soft as appropriate.
