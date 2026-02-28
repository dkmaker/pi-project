# Entity: Project & Project Resources

---

## Entity: Project

The **Project** is the root container. It answers: *what are we building, for whom, and what does success look like at the highest level?*

A Project is not a task list or a status tracker. It is a stable document that changes only when the fundamental direction changes. If you're rewriting it every week, it's too detailed.

**A Project consists of:**

- **Name** — short identifier used everywhere else
- **Vision** — 2–4 sentences describing what this is and who it's for, written as if explaining to a smart stranger. This is the anchor that all scope decisions refer back to.
- **Goals** — a small set of outcome-based statements (not features) that define what "done" means for this project. Goals should be verifiable. "Users can sign up and log in" is a goal. "Build an auth system" is not.
- **Non-Goals** — explicitly what this project will *not* do. This is as important as Goals. It prevents scope creep and gives agents a boundary to operate within.
- **Constraints** — hard limits that cannot be negotiated: technical, legal, time, budget, or resource constraints. These differ from Non-Goals in that they are imposed, not chosen.
- **Repository Map** — a brief description of how the codebase is organized. Not exhaustive — just enough to orient someone unfamiliar with the repo. Where does the API live? Where are components? Where are tests?
- **Status** — not started / in progress / complete / on hold / abandoned
- **Stage** — the current lifecycle position of the project. Always current. See Project Stage below.
- **Mode** — the current operational mode, which may overlay the Stage. See Project Stage below.
- **Milestones** — a reference list of the project's major checkpoints (defined in [planning.md](planning.md)).
- **Epics** — a reference list of the major feature areas (defined in [planning.md](planning.md)).
- **Resources** — a reference list of Project Resources (defined below): tech stack entries, shared documentation, rules, and conventions that apply across all tasks.

**What a Project is NOT:**
It does not track current work. It does not change when a task completes. "What we're working on right now" lives in the Session Log ([session-log.md](session-log.md)), not here.

---

## Project Stage

**Stage** and **Mode** are the global position indicators. Together they answer: *where are we in the lifecycle right now, and what is happening?* Any agent cold-starting reads these two fields before anything else — they establish the frame for every other read.

### Stage values

Stage tracks which phase of the lifecycle the project is currently in.

| Stage | Meaning |
|---|---|
| `uninitialised` | Project record created but Phase 1 has not yet begun |
| `phase_1` | Phase 1 (Interview) in progress |
| `phase_2` | Phase 2 (Epic & Milestone Planning) in progress |
| `phase_3` | Phase 3 (Task Research & Decomposition) in progress |
| `phase_4` | Phase 4 (Implementation) in progress |
| `complete` | All completion conditions met; Project Completion Record written |
| `abandoned` | Project abandoned; Abandonment Record written |
| `on_hold` | Work paused; reason recorded in Session Log |

### Mode values

Mode tracks what is operationally happening *within* the current Stage. It is separate from Stage because special modes can overlay normal execution without changing which phase the project is in.

| Mode | Meaning |
|---|---|
| `normal` | Standard execution — the default for all Stages |
| `change_management` | A Change Request is open and under review; downstream work is paused until the Change Request resolves to approved or rejected |
| `infeasibility_review` | Phase 1 validation revealed a potential infeasibility; awaiting human decision before entities are finalised |
| `phase_gate` | A Phase Completion Record has been written but gate status is `not_passed`; the phase is not done and gaps must be closed before proceeding |
| `awaiting_specialist` | One or more tasks are Blocked on Specialist Routing; the project can continue on other tasks but the routing is pending |

### Stage transition rules

Stage transitions are triggered by specific events and are never implicit. An agent must update Stage explicitly when the triggering event occurs.

| From | To | Trigger |
|---|---|---|
| `uninitialised` | `phase_1` | Human initiates the interview |
| `phase_1` | `phase_2` | Phase 1 Completion Record gate status = `passed` and context reset occurs |
| `phase_2` | `phase_3` | Phase 2 Completion Record gate status = `passed` and context reset occurs |
| `phase_3` | `phase_4` | Phase 3 Completion Record gate status = `passed` and context reset occurs |
| `phase_4` | `complete` | All Project Completion conditions met and human confirms |
| Any | `abandoned` | Human decision to stop; Abandonment Record written |
| Any | `on_hold` | Human decision to pause; reason recorded in Session Log |
| `on_hold` | prior stage | Human decision to resume; Session Log updated |

### Mode transition rules

| From | To | Trigger |
|---|---|---|
| `normal` | `change_management` | A Change Request is created |
| `change_management` | `normal` | Change Request is approved (Scope Change applied) or rejected |
| `normal` | `infeasibility_review` | Phase 1 validation pass finds a conflict that may make the project infeasible |
| `infeasibility_review` | `normal` | Human decides to revise; entities updated; interview continues |
| `infeasibility_review` | `abandoned` | Human decides to stop |
| `normal` | `phase_gate` | Phase Completion Record written with gate status = `not_passed` |
| `phase_gate` | `normal` | Gaps closed; Phase Completion Record re-evaluated; gate status = `passed` |
| `normal` | `awaiting_specialist` | First Specialist Routing Blocker created |
| `awaiting_specialist` | `normal` | All Specialist Routing Blockers resolved |

### Stage + Mode as cold-start anchor

The Session Log is the detailed cold-start anchor for *what task is active and where exactly work stopped*. Stage + Mode are the structural cold-start anchor for *what kind of work is permitted right now*.

An agent reading Stage + Mode on cold-start knows immediately:
- `phase_4 / normal` → read Session Log → find Active Task → resume implementation loop
- `phase_4 / change_management` → read open Change Request → do not start new tasks → assist human with impact analysis and approval decision
- `phase_3 / phase_gate` → read Phase 3 Completion Record → identify failed checklist items → return to decomposition to close gaps
- `phase_1 / infeasibility_review` → read the Infeasibility Finding → await human decision
- `phase_2 / normal` → read Phase 1 output → continue Epic and Milestone planning

Without Stage + Mode, an agent must infer position from Phase Completion Records, Session Log notes, and open Change Requests — a fragile chain of inference that breaks if any one record is incomplete. Stage + Mode eliminate that inference.

---

## Entity: Goal

A **Goal** is an outcome that the project is trying to achieve. Goals belong to the Project level and are the primary lens through which scope decisions are made.

Goals are distinct from features. A goal describes *what the user or system can do*, not *how it's built*. They are the "why" behind epics.

**A Goal consists of:**

- **ID** — unique identifier (e.g. G-001)
- **Statement** — a single, clear sentence describing the outcome. Should be answerable with yes/no: "Can a user do X?" or "Does the system do Y?"
- **Status** — not started / in progress / achieved / abandoned
- **Contributing Epics** — which epics, when completed, fulfill this goal. This is the key relationship that connects high-level intent to actual work.
- **Completion Record** — written when the Goal reaches `achieved` (see Goal Completion Record below).

---

## Goal Status Transition Rules

Goal status transitions are evaluated automatically when Epic status changes, but the `achieved` transition requires agent evaluation and human confirmation. The rules are explicit and non-negotiable.

### not started → in progress
**Trigger:** The first Contributing Epic moves to `active` status.
**Who:** Automatic — no human action required.
**What happens:** Goal status updates to `in progress`. No other changes.

### in progress → achieved
**Trigger:** All Contributing Epics reach `complete` status.
**Who:** The agent evaluates the Goal Statement; human confirms.
**Process:**
1. The agent evaluates the Goal Statement as an observable, verifiable question ("Can a user do X?" → yes/no). If the answer requires checking code, querying a running system, or reviewing completed Epic output, the agent does so.
2. If the agent can confirm the Goal Statement is met: the Goal is flagged for human confirmation.
3. Human confirms → Goal Status moves to `achieved`, a **Goal Completion Record** is written (see below).
4. If the agent cannot confirm (evaluation requires user testing, visual review, or external verification): the specific unverifiable criteria are listed and presented to the human for manual confirmation. Goal does not move to `achieved` until human confirms.
5. If all Contributing Epics are complete but the Goal Statement is **not** met: this is a named gap. Resolution paths:
   - New Tasks via the Task Addition process (see [lifecycle.md](lifecycle.md))
   - Scope revision via Change Request (see [change-management.md](change-management.md))
   - Explicit scope acceptance by the human with documented rationale

### in progress → abandoned
**Trigger:** A Scope Change removes all Contributing Epics, or a Change Request changes the Goal Statement in a way that makes it unreachable within project constraints, or the human explicitly decides to drop the Goal.
**Who:** Human decision, recorded as a Scope Change.
**What happens:** Goal Status moves to `abandoned`. An Abandonment Record is written (see [reference.md](reference.md)). The Project status is re-evaluated — if an abandoned Goal was critical to the Project's Vision, a Change Request may be required at the Project level.

### Status regression
If a Scope Change removes a Contributing Epic from a Goal whose status was `in progress`, the Goal's status must be re-evaluated. If the remaining Contributing Epics no longer constitute sufficient coverage of the Goal Statement, the Goal may regress to `not started` or require a Change Request to redefine it.

### Goal Completion Record
Written when a Goal reaches `achieved`:
- **Achieved At** — timestamp
- **Confirmed By** — human identifier
- **Goal Statement** — the statement as it stood at achievement (may have been refined via Scope Changes)
- **Contributing Epics** — list of Epics that fulfilled this Goal
- **Evaluation notes** — how the Goal Statement was verified (agent evaluation, human confirmation, what was checked)

---

## Project Completion

**The project is complete when all of the following conditions are simultaneously true:**
1. All Goals are in `achieved` status (which requires all Contributing Epics to be `complete`)
2. All Milestones that are in scope (not abandoned) are in `reached` status
3. No Tasks in `🔄 Active`, `⛔ Blocked`, or `⚠️ Needs Review` status
4. All open Questions are in `resolved`, `deferred` (with documented rationale), or `dropped` (with documented rationale) status
5. All open Risks are in `mitigated`, `accepted` (with documented rationale), or `realized and resolved` status

When these conditions are met, the agent flags the project for human confirmation. Human confirms → Project Status moves to `complete`, and a **Project Completion Record** is written.

### Project Completion Record

The capstone document for the project. Fields:

- **Completed At** — timestamp
- **Confirmed By** — human identifier
- **Goals assessment** — for each Goal: achieved as originally stated / achieved with modifications (reference Scope Change IDs) / abandoned with rationale
- **Milestones review** — for each Milestone: reached on target / reached with slippage (what slipped and why) / abandoned (with rationale)
- **Scope delta** — structured comparison of what was in the original Phase 1/Phase 2 plan vs. what was actually built. What was cut (with Scope Change references), what was added (with Task Addition / Change Request references), what changed shape.
- **Total active AI time** — aggregated from all Work Intervals across all Tasks and all Sessions
- **Total estimated AI cost** — aggregated from all Work Interval costs across the project
- **Estimate accuracy** — comparison of Phase 3 estimates to actual Work Interval durations, by Epic. Not for blame — for calibrating future projects.
- **Key decisions** — the most consequential Decisions made during the project (by Decision ID), their outcomes, and whether they held up over the project's lifetime
- **Risks summary** — which Risks were realized and how they were resolved; which were successfully mitigated; which were accepted and carried
- **Learnings for future projects** — patterns, anti-patterns, estimation calibration notes, and structural observations that should inform how the next project is set up

---

## Entity: Project Resource

A **Project Resource** is a piece of shared knowledge that applies across the entire project — not to one task or one epic, but to any task that touches a relevant area. Resources are the project-level context that agents need to operate correctly and consistently.

Resources exist because repeating the same tech stack details, documentation links, or conventions inside every task is redundant and error-prone. Instead, a task references a resource by ID, and the resource carries the detail.

There are four kinds of Project Resource:

---

### 1. Tech Stack Entry

A specific technology, library, framework, or external service used in this project. Each entry is a first-class entity because agents need to reason about it: what version, how it's used, what the canonical docs are, what the conventions are for this project specifically.

**A Tech Stack Entry consists of:**

- **Name** — e.g. "Zustand", "PostgreSQL", "Stripe API"
- **Category** — language / runtime / framework / library / database / service / tool
- **Version** — the version in use. Specific, not "latest."
- **Purpose** — one sentence: why this is used and what problem it solves in this project
- **Documentation URL** — canonical docs. The agent reads this when working with it.
- **Project-Specific Notes** — how *this project* uses it, deviations from defaults, gotchas discovered. This is where "we use Zustand but only for shared cross-component state, not for local UI state" lives.
- **Verification Status** — whether this stack entry has been validated for the current version (see [verification.md](verification.md))

---

### 2. Shared Documentation Reference

A link to an external or internal document that multiple tasks may need: an API spec, a design system guide, a third-party integration guide, a company style guide. Not the content itself — the reference and why it matters.

**A Shared Documentation Reference consists of:**

- **Name** — short label
- **URL or Path** — where to find it
- **Description** — what it covers and when to consult it
- **Scope** — which areas of the project it applies to (e.g., "all frontend tasks", "anything touching the payments API")

---

### 3. Rule

A standing instruction that applies to all agent work on this project. Rules are stronger than conventions — they are non-negotiable constraints on how work gets done. "Never commit secrets to the repo." "All database writes must go through the repository layer." "All public API responses must match the OpenAPI spec."

**A Rule consists of:**

- **Statement** — the rule itself, in one sentence. Unambiguous.
- **Rationale** — why this rule exists. Agents that understand the why make better judgment calls at the edges.
- **Scope** — which parts of the codebase or which task types this rule applies to
- **Enforcement** — how this rule is verified: by convention, by CI, by code review, automatically

---

### 4. Convention

A preference or pattern that applies project-wide but is softer than a rule — a way of doing things that should be followed unless there's a good reason not to. File naming, error handling patterns, logging patterns, test structure.

**A Convention consists of:**

- **Name** — short label
- **Description** — what the convention is and a brief example
- **Rationale** — why this convention was chosen (so agents can evaluate exceptions intelligently)
- **Applies To** — which file types, layers, or contexts

---

## Relationship to Tasks

Any task can reference one or more Project Resources by ID in its Context field. This means the task stays lean — it says "see RESOURCE-003 for Stripe API conventions" rather than repeating them. The agent resolves the reference when it needs the detail.
