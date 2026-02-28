# Entities: Task, Subtask & Delegation

---

## Entity: Task

A **Task** is the primary unit of work. It is atomic — it should be small enough to be done in one focused working session (minutes to a few hours), and specific enough that it has a clear done state.

A Task answers: *exactly what needs to happen, where in the codebase, and how do we know it's done?*

This is the entity most optimized for AI agent handoff. Every field exists because an agent operating cold needs it.

**A Task consists of:**

### Identity & Scheduling
- **ID** — unique, stable identifier (e.g. T-023). Used for cross-referencing everywhere.
- **Name** — short imperative phrase describing the action. "Wire filter store to ItemList component." Not "Filter stuff."
- **Epic** — the epic this task belongs to.
- **Status** — see [reference.md](reference.md) for all status values and transition rules.
- **Priority** — relative urgency within the epic. Critical / High / Medium / Low.
- **Estimate** — rough time estimate. Not for tracking velocity — for setting scope expectations. If a task estimate exceeds half a day, it should probably be split.
- **Delegation** — the explicit autonomy level for this task. See Delegation section below. This is a first-class field, set before work begins.

### Intent & Context
- **Goal** — 1–3 sentences: what this task achieves and why it exists *right now*. An agent reading only this field should understand the intent without needing the epic context.
- **Context** — everything an agent needs to execute this task cold: what already exists and where, what approach was decided and why, what NOT to do, relevant prior decisions. References to Project Resources go here by ID. This field is not optional.
- **Research Date** — the date on which the research embedded in the Context field was performed. Used to evaluate staleness: if a referenced Tech Stack Entry's version has changed since this date, or if more than 60 days have elapsed since this date, the Context should be re-verified before execution begins (see [verification.md](verification.md)).
- **Acceptance Criteria** — a checklist of observable, verifiable outcomes. Each item should be answerable yes/no. An agent should be able to check these against the code without human input.

### Scope & Location
- **Affected Files** — the specific files expected to be created, modified, or read. For each file: path and change type (create / modify / read-only / delete). Scopes the blast radius and tells the agent where to look. Does not need to be exhaustive but must cover primary locations.
- **Pattern Contracts** — patterns, interfaces, or structural decisions this task *establishes* that other tasks will rely on. See [relationships.md](relationships.md).

### Breakdown & Relationships
- **Subtasks** — ordered steps within this task. See Subtask entity below.
- **Blockers** — what prevents this task from starting or completing. See [relationships.md](relationships.md).
- **Dependencies** — sequencing relationships to other tasks. See [relationships.md](relationships.md).
- **Pattern Dependencies** — which patterns from upstream tasks this task relies on. See [relationships.md](relationships.md).
- **Attachments** — links to any external resources directly relevant to this specific task: a Figma frame, a specific API docs page, a GitHub issue, a Loom recording, or Specialist output (see Specialist Routing below). Distinct from Project Resources (which are global) — these are task-specific references.

### Verification
- **Verification** — how this task's approach or output was validated. See [verification.md](verification.md). A task may have multiple Verifications of different types, each with their own attempt history.

### Tracking
- **Notes** — freeform notes during execution: decisions made mid-task, things discovered, edge cases handled, Needs Review resolution records.
- **Work Log** — the time-series record of all agent work intervals on this task. See [tracking.md](tracking.md).
- **Completion Record** — filled in when status reaches Done. See [tracking.md](tracking.md).

---

## Entity: Subtask

A **Subtask** is a step inside a Task. It is not a full task — it doesn't need its own epic, context, or file map. It is a checklist item that helps break the task into discrete actions.

Subtasks exist for two reasons: to prevent an agent from trying to do everything at once, and to make it easy to resume a partially-completed task.

**A Subtask consists of:**

- **Description** — a single sentence describing one concrete action. Imperative. "Import useFilterStore in FilterBar.tsx." "Add filtering logic to ItemList." "Update tests to cover filtered state."
- **Status** — done / not done (binary, no intermediate states)
- **Notes** — optional: if something unexpected was found while doing this step, capture it here.

**What Subtasks are NOT:** They are not tasks in disguise. If a subtask needs its own context block, affected files, or blockers, it should be promoted to a Task.

---

## Delegation Model

Delegation is a first-class concept — not a note added later. Every task carries an explicit delegation level before work begins.

| Level | Who executes | What the agent does |
|---|---|---|
| Implement | Agent | Executes autonomously end-to-end. Human reviews output after. |
| Plan | Agent + Human gate | Produces a step-by-step plan for human review before touching any code. |
| Research | Agent | Investigates and returns findings only. No code written. Human decides. |
| Human | Human | Requires human judgment. Agent may assist but must not proceed autonomously. |
| Specialist | Routed | Better handled by a different agent, tool, or model. Surface to human for routing. |

If an agent encounters something mid-task that changes the appropriate delegation level, it surfaces this rather than proceeding.

---

## Specialist Routing Process

When a task has `Specialist` delegation — set in Phase 3 or escalated during Phase 4 — it follows a defined routing process rather than stopping at "surface to human."

**Step 1: Block the task.**
The task moves to `⛔ Blocked` with a Blocker of type `Specialist Routing`. The Blocker Description names the specialist capability required precisely: "Security audit of the OAuth token handling in T-034." "Design review of the onboarding flow for Epic 4." "ML model selection for the document classification pipeline." It does not say "needs specialist."

**Step 2: Human routing decision.**
The human decides which agent, tool, or person handles the task. This decision is recorded as a **Decision** entity with the routing rationale: why this specialist, what output is expected, what format the output should be in for the task to consume it.

**Step 3: Task remains Blocked.**
The task does not execute while the Specialist works. Its status stays `⛔ Blocked`. If the Specialist's work takes multiple sessions, the Blocker remains. The Session Log records the pending routing in its Next Actions or Pending Reviews section so it is not forgotten.

**Step 4: Specialist output arrives.**
When the Specialist returns their output, it is attached to the task as an **Attachment** with an explicit label identifying it as Specialist output (e.g., "Specialist output: security audit report from [tool/person], [date]").

**Step 5: Verification of Specialist output.**
A **Verification** record is created on the task:
- Type: External Validation
- Source: the Specialist's report or output (Attachment reference)
- The first attempt is recorded: passed (output is sufficient to proceed), partial (output raises further questions), or failed (output is insufficient or contradicts the task's approach)

**Step 6: Resume or escalate.**
- If Verification passed: the Blocker is cleared. The task returns to `🔄 Active` for the agent to integrate the Specialist's output, or directly to `👀 In Review` if the Specialist's output itself is the deliverable.
- If Verification is partial or failed: a new Question is created describing what is insufficient. The Blocker remains until the Question is resolved. The human may need to re-route or supplement the Specialist's work.
- If the Specialist's output raises new scope questions: a Change Request is initiated before the task resumes (see [change-management.md](change-management.md)).
