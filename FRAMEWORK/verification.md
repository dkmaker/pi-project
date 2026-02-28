# Entity: Verification

A **Verification** is a record that a task's approach, implementation, or output has been validated against some external source of truth — documentation, research, test results, or human review. It is the answer to: *"how do we know this is correct, not just done?"*

Verification is distinct from Acceptance Criteria. Acceptance Criteria defines *what* done looks like. Verification records *how* we confirmed it. A task can pass its own acceptance criteria and still be unverified if the approach hasn't been checked against authoritative sources.

This matters especially for AI-generated work, where the output may be plausible but wrong — hallucinated APIs, outdated patterns, subtle misuse of a library. Verification closes that gap.

---

## A Verification consists of

- **ID** — unique identifier, scoped to the task (e.g. V-001)
- **Type** — the kind of verification performed:
  - *Documentation* — checked against official docs, spec, or RFC. The agent or human read the relevant documentation and confirmed the approach is correct for the version in use.
  - *Research* — investigated via web search, community resources, or comparable implementations. Used when docs are insufficient or the question is about best practice rather than correctness.
  - *Testing* — the code was run, tests pass, behavior was observed. Not just "tests exist" — tests were executed and passed.
  - *Code Review* — a human reviewed the output and confirmed it meets standards. Used for sensitive or high-risk tasks.
  - *External Validation* — confirmed against a third-party system: an API responded correctly, a service accepted the integration, a third-party tool produced expected output.
- **Source** — where the verification came from: a URL, a file path, a tool name, or "human review by [name]"
- **Attempts** — an ordered list of verification attempts. A Verification is not a single result — it is a history of attempts. Each attempt contains:
  - *Attempt number* — sequential (1, 2, 3…)
  - *Result* — passed / failed / partial
  - *Performed By* — human or agent (with identifier)
  - *Date* — when this attempt was performed
  - *Notes* — what was checked, what was found, any caveats. Mandatory if result is failed or partial.
- **Current Result** — the result of the most recent attempt. This is the operative status. Prior attempts remain in the history.
- **Stale** — a flag set when the underlying source may have changed (e.g., a tech stack entry's version was upgraded after this verification was performed, or the verification's Research Date is older than 60 days). A stale verification is not invalid — it is a prompt to re-verify with a new attempt.

---

## Multiple Verifications per Task

A task can have multiple Verifications of different types. A task implementing a Stripe integration might have: one Documentation verification (checked against Stripe's API docs), one Testing verification (integration test passed), and one Research verification (confirmed the webhook signature approach against community best practice). Together they give high confidence.

A task with zero verifications is implicitly unverified — acceptable for low-risk work, a concern for anything touching auth, payments, security, or external integrations.

---

## Verification Status (aggregate across all Verifications on a task)

| Status | Meaning |
|---|---|
| Unverified | No Verifications recorded |
| Partially Verified | Some Verifications exist; at least one is partial or a relevant type is missing |
| Verified | At least one passed Verification of an appropriate type for the task's risk level |
| Verification Failed | At least one Verification has a current result of `failed`; task needs revision regardless of other statuses |
| Stale | All Verifications have passed on their most recent attempt, but one or more is marked Stale |

---

## Verification Failure Recovery Loop

**A failed Verification is a defined state with a mandatory recovery path — not a dead end.**

When a Verification's current result is `failed`:

1. **The task cannot move to `✅ Done`.** This is an invariant. A failed Verification blocks the Done transition regardless of whether Acceptance Criteria appear to be met.

2. **The task returns to `🔄 Active`.** This backward status transition is explicitly defined. A task may move from `👀 In Review` back to `🔄 Active` when verification fails. This is the only defined backward transition from `👀 In Review` other than a human review rejection (see [reference.md](reference.md)).

3. **A Blocker is created automatically.** When the failure is recorded, a Blocker must be created on the task with:
   - Type: Resource (the approach is the resource that needs correction)
   - Description: what specifically failed, which Verification ID failed, and what the source found wrong
   - Resolution Path: what needs to change for a new verification attempt to pass

4. **Relevant Subtasks are un-checked.** The Subtasks that correspond to the failed area are returned to not-done status. The agent re-enters the task at those Subtasks, not from the beginning. The Verification Notes (in the failed attempt) should be specific enough to identify which Subtasks need rework.

5. **The agent executes rework.** Working within the Subtask scope identified in step 4, the agent addresses the specific failure described in the Blocker. It does not re-implement the entire task unless the failure warrants it.

6. **Verification re-run.** After rework, a new attempt is added to the Verification's Attempts list. The same Verification entity is reused — the attempt history accumulates. A new Verification entity is not created.

7. **The Blocker is cleared** when the new attempt passes. The task proceeds to `✅ Done` (or back to `👀 In Review` if human sign-off is required).

**Repeated failures:** If a Verification fails three or more times on the same task, the agent must surface a Question to the human before attempting further rework. Repeated failure signals either a fundamental approach problem (requiring a Change Request or task redesign) or a misunderstanding of what "correct" means for this verification type. The human must weigh in — the agent cannot self-correct indefinitely.

---

## Verification in Phase 3

For tasks involving external integrations, security-sensitive code, or any approach flagged as requiring validation, a Verification record is pre-populated during Phase 3 (Task Research) with Type and Source — ready to be executed and marked passed/failed during Phase 4 (Implementation). The Attempts list starts empty — no result is recorded until the actual check is performed in Phase 4.

This means the executing agent knows it needs to verify, not just implement. It also means the pre-populated Verification has a Source already identified — the agent doesn't need to find the right docs during implementation.

See [lifecycle.md](lifecycle.md) for the full Phase 3 process.

---

## Stale Verifications

A Verification becomes Stale when:
- A Tech Stack Entry referenced in its Source has its version updated (see [reference.md](reference.md) for the Tech Stack Version Update process)
- The Research Date of the verification is older than 60 days (for Research and Documentation type verifications)
- A Scope Change (see [change-management.md](change-management.md)) modifies the approach the Verification was confirming

A Stale Verification must be re-verified before the task can be considered fully Verified. Re-verification adds a new attempt to the existing Verification entity. If the re-verification passes, the Stale flag is cleared. If it fails, the failure recovery loop above applies.
