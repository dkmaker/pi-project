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
  - *Change summary* — a short human-readable description of what changed and why. "`setTags` renamed to `applyTags` and now accepts `Set<string>` instead of `string[]` after refactor for performance."
  - *Triggered reviews on* — which downstream task IDs were flagged for review when this change was recorded
- **Downstream Tasks** — which task IDs depend on this pattern, and at which version each dependency was recorded. This is the registry that drives review propagation.
- **Status** — draft / established / changed / superseded

**When a Pattern Contract's definition changes:**
1. The current definition is moved into Version History with a change summary
2. The version number increments
3. The new definition is written
4. All downstream tasks are set to `⚠️ Needs Review`
5. Each downstream task's Pattern Dependency has its Review Status set to `needs-review` and is annotated with: the version it was written against, the current version, and a pointer to the Version History entry so the reviewer can read the exact diff

This means a downstream task in `⚠️ Needs Review` state can answer: "I was written against v1. The contract is now v2. Here is exactly what v1 said. Here is exactly what v2 says. Here is the change summary. Do I need to update my context or approach?" That is a reviewable judgment, not a blind search.

**Relationship to Dependency:** A Dependency says "T-024 cannot start until T-023 is done." A Pattern Contract says "T-024 was written assuming T-023 establishes a specific interface — if that interface changed, T-024's context and possibly its implementation approach need review." These are orthogonal concerns. A task can have both.

---

## Entity: Pattern Dependency

A **Pattern Dependency** is the inverse of a Pattern Contract — it lives on the *consuming* task and states which upstream pattern it relies on and what specifically it expects.

**A Pattern Dependency consists of:**

- **Source Task** — the task ID that establishes the pattern
- **Pattern Name** — the name of the Pattern Contract being relied on
- **Locked Version** — the version number of the Pattern Contract that was current when this dependency was written. This is the snapshot this task was authored against.
- **Expectation** — what specifically this task expects from that pattern at the locked version. "Expects `useFilterStore` to expose `selectedTags: string[]` and `setTags(tags: string[]): void`." Concrete, not vague. This must match the Definition text of the locked version — it is the downstream task's own record of what it understood the contract to mean.
- **Review Status** — current / needs-review / updated
- **Review Note** — populated automatically when status is set to `needs-review`: contains the locked version, the current contract version, and a pointer to the Version History entry describing exactly what changed between them. This is what makes the review actionable — the reviewer sees the diff inline, not as a separate search.

**Why both directions matter:** The Pattern Contract on the upstream task says "I establish this at version N, these tasks depend on it." The Pattern Dependency on the downstream task says "I was written against version N and I expected exactly this." When the contract moves to version N+1, the downstream task's Review Note shows the precise before/after, and the reviewer can judge in seconds whether the change affects their task's context or approach — rather than hunting through notes and git history to reconstruct what changed.
