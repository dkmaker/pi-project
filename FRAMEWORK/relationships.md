# Entities: Dependency, Blocker, Pattern Contract & Pattern Dependency

---

## Entity: Dependency

A **Dependency** is a directed sequencing relationship between two Tasks: one task cannot start (or meaningfully proceed) until another is complete. It is purely about *order of execution*, not about shared patterns or interfaces — that is Pattern Dependency's role.

**A Dependency consists of:**

- **Requires** — the task(s) that must be complete before this task can start
- **Enables** — the task(s) that are unblocked when this task completes (the inverse)
- **Nature** — hard (cannot start without it) or soft (better with it done first but not strictly required)

---

## Entity: Blocker

A **Blocker** is a specific, named obstacle that prevents a Task from being started or completed. "Blocked" as a task status means nothing without a corresponding Blocker describing exactly what and why.

Blockers must be explicit. Vague blockers ("waiting on stuff") are not allowed — they can't be resolved because they can't be understood.

**A Blocker consists of:**

- **Description** — exactly what is missing, broken, unclear, or waiting. One sentence minimum. "The backend export endpoint (T-019) does not exist yet." "The API key for SendGrid has not been provisioned." "The approach to pagination has not been decided."
- **Type** — one of:
  - *Dependency* — another task must complete first
  - *Decision* — a choice must be made before work can continue
  - *External* — waiting on something outside the project (API key, approval, third-party)
  - *Resource* — missing knowledge, access, or tool
  - *Specialist Routing* — the task requires a different agent, tool, or specialist; waiting for routing decision or specialist output (see Delegation section in [task.md](task.md))
  - *Verification Failure* — a Verification on this task has a `failed` result; rework is required before the task can proceed to Done
- **Resolution Path** — what needs to happen for this blocker to be cleared. Who decides. What action unblocks it.
- **Blocking Task** — if type is Dependency, which task ID is the prerequisite.

---

## Entity: Pattern Contract

A **Pattern Contract** is a declaration on a Task that says: *"the way I implement this will be relied upon by future tasks."* It names what is being established, which tasks depend on it, and maintains a full version history so that when something changes, downstream tasks can see exactly what changed — not just that something changed.

This exists to solve a specific problem: when a task's approach changes mid-implementation, the change can silently break the assumptions of future tasks that were written expecting a specific pattern, interface, or structure. Without an explicit contract, those future tasks only fail when someone tries to do them — often much later.

**A Pattern Contract consists of:**

- **Name** — short label for the pattern. "Filter store interface", "API response envelope shape", "Auth middleware signature"
- **Current Version** — the current version number of this contract (e.g. v1, v2). Incremented every time the contract's definition changes.
- **Definition** — the precise, current description of what this pattern establishes. This must be concrete enough to depend on: not "a filter store" but "a Zustand store at `src/stores/filter.ts` exposing `selectedTags: string[]`, `setTags(tags: string[]): void`, and `clearTags(): void`." This is the text downstream tasks lock their dependency to.
- **Version History** — an ordered list of all prior versions of this contract. Each history entry contains:
  - *Version number* — which version this was
  - *Definition at that version* — the full definition text as it stood then. Not a summary — the actual content, so a downstream task can compare exactly what it was depending on vs what exists now.
  - *Changed at* — timestamp of when this version was replaced
  - *Change summary* — a short human-readable description of what changed and why
  - *Triggered reviews on* — which downstream task IDs were flagged for review when this change was recorded
- **Downstream Tasks** — which task IDs depend on this pattern, and at which version each dependency was recorded. This is the registry that drives review propagation.
- **Status** — draft / established / changed / superseded

### Pattern Contract Status Definitions

Each status has a precise meaning and defined transition conditions:

| Status | Meaning | Can be depended upon? |
|---|---|---|
| draft | Declared, but the establishing task is not yet complete. The definition is provisional. | No — downstream tasks must not lock a dependency on a draft contract. |
| established | The establishing task is complete. The definition is live and authoritative. | Yes |
| changed | The contract has been updated at least once since establishment. It is still active — the current Definition is valid and dependable. Version History captures all prior versions. | Yes — lock to current version |
| superseded | The contract no longer exists as a standalone entity. Its responsibilities have been absorbed into a different Pattern Contract, or the pattern has been eliminated entirely. | No |

**Transitions:**

- `draft → established`: triggered when the task that declared the contract reaches `✅ Done`. Automatic — no human action required.
- `established → changed`: triggered when the contract's Definition is updated in place. The current definition is moved to Version History, the version number increments, and the new definition is written. All downstream tasks are flagged `⚠️ Needs Review`.
- `changed → changed`: each subsequent update follows the same process. The contract remains `changed` status; it does not revert to `established`.
- `established` or `changed → superseded`: this transition is **never automatic**. It requires an explicit triggering event — a Scope Change (see [change-management.md](change-management.md)) or a Decision record — and human sign-off. The superseding event must state what (if anything) replaces this contract.

**What `superseded` means for downstream tasks:**
All downstream tasks with a Pattern Dependency on a `superseded` contract are immediately flagged `⚠️ Needs Review`. The Review Note must state: "The pattern this task depended on has been superseded. [New contract name / 'No replacement exists']. Review whether this task's Context and approach are still valid." The Needs Review Resolution process (below) applies, with the specific possible outcome that the dependency assumption is entirely invalidated and the task's Context must be rewritten.

**When a Pattern Contract's definition changes (`established` or `changed → changed`):**
1. The current definition is moved into Version History with a change summary
2. The version number increments
3. The new definition is written
4. All downstream tasks are set to `⚠️ Needs Review`
5. Each downstream task's Pattern Dependency has its Review Status set to `needs-review` and is annotated with: the version it was written against, the current version, and a pointer to the Version History entry so the reviewer can read the exact diff

---

## Entity: Pattern Dependency

A **Pattern Dependency** is the inverse of a Pattern Contract — it lives on the *consuming* task and states which upstream pattern it relies on and what specifically it expects.

**A Pattern Dependency consists of:**

- **Source Task** — the task ID that establishes the pattern
- **Pattern Name** — the name of the Pattern Contract being relied on
- **Locked Version** — the version number of the Pattern Contract that was current when this dependency was written. This is the snapshot this task was authored against.
- **Expectation** — what specifically this task expects from that pattern at the locked version. Concrete, not vague. Must match the Definition text of the locked version.
- **Review Status** — current / needs-review / updated
- **Review Note** — populated automatically when status is set to `needs-review`: contains the locked version, the current contract version, and a pointer to the Version History entry describing exactly what changed between them.

---

## Needs Review Resolution Process

A task in `⚠️ Needs Review` status has had a Pattern Contract it depends on updated or superseded. The task knows *why* it was flagged (the version diff in the Review Note) but needs a defined process for what to *do*.

**Who performs the review:**
The delegation level of the task governs who reviews it:
- `Implement` or `Plan` delegation → the agent reviews the diff and determines the outcome, then flags the result for human awareness
- `Human` delegation → the agent surfaces the diff and the human decides the outcome
- `Research` or `Specialist` delegation → the agent reviews and surfaces findings; human confirms the outcome

**The three defined outcomes:**

### Outcome 1: No Impact
The contract changed, but the change does not affect this task's Context, Acceptance Criteria, or implementation approach.

- The task's Pattern Dependency Review Status is set to `current`
- The task returns to `⏳ Pending`
- A brief Review Record is appended to the task's Notes: who reviewed, which contract version they reviewed against, when, and the outcome decision ("no impact — [brief reason]")

### Outcome 2: Context Update Needed
The contract change affects what the task expects, but the fundamental approach remains valid. The task needs its Context or Acceptance Criteria revised.

- The agent (or human, depending on delegation) updates the task's Context field and/or Acceptance Criteria to reflect the new contract version
- The Pattern Dependency's Locked Version is updated to the current contract version
- The Pattern Dependency Review Status is set to `updated`
- The task returns to `⏳ Pending`
- A Review Record is appended to the task's Notes: who reviewed, what was changed, why

### Outcome 3: Significant Rework
The contract change invalidates the task's approach fundamentally. The task cannot proceed with its current definition.

- The task enters a lightweight re-decomposition: the Context is rewritten with a new approach, Subtasks may be revised, Acceptance Criteria are re-evaluated
- A Decision record is created explaining why the original approach was no longer viable
- If the task is at `Implement` or `Plan` delegation: the agent rewrites the task definition and flags it for human confirmation before the task returns to `⏳ Pending`
- If the task is at `Human` delegation: the agent surfaces the problem and the human drives the rewrite
- The Pattern Dependency Locked Version is updated; Review Status set to `updated`
- The task returns to `⏳ Pending` only after the human has confirmed the revised definition

**Each outcome must produce a Review Record** in the task's Notes. A task must never silently exit `⚠️ Needs Review` — the review must be traceable.

**Pattern Contract superseded:** When the upstream contract was superseded (not just changed), Outcome 3 is the minimum — the task's approach assumption about that pattern is entirely gone. If a replacement contract exists, the task's Pattern Dependency is re-pointed to the new contract at its current version. If no replacement exists, the task's Context must be rewritten without that dependency, and a Decision record must explain how the task's approach changes as a result.
