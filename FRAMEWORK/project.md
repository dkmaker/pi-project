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
- **Milestones** — a reference list of the project's major checkpoints (defined in [planning.md](planning.md)).
- **Epics** — a reference list of the major feature areas (defined in [planning.md](planning.md)).
- **Resources** — a reference list of Project Resources (defined below): tech stack entries, shared documentation, rules, and conventions that apply across all tasks.

**What a Project is NOT:**
It does not track current work. It does not change when a task completes. "What we're working on right now" lives in the Session Log ([session-log.md](session-log.md)), not here.

---

## Entity: Goal

A **Goal** is an outcome that the project is trying to achieve. Goals belong to the Project level and are the primary lens through which scope decisions are made.

Goals are distinct from features. A goal describes *what the user or system can do*, not *how it's built*. They are the "why" behind epics.

**A Goal consists of:**

- **Statement** — a single, clear sentence describing the outcome. Should be answerable with yes/no: "Can a user do X?" or "Does the system do Y?"
- **Status** — not started / in progress / achieved. A goal is only achieved when all epics and milestones that contribute to it are complete.
- **Contributing Epics** — which epics, when completed, fulfill this goal. This is the key relationship that connects high-level intent to actual work.

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
