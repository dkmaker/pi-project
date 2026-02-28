# Entity: Verification

A **Verification** is a record that a task's approach, implementation, or output has been validated against some external source of truth — documentation, research, test results, or human review. It is the answer to: *"how do we know this is correct, not just done?"*

Verification is distinct from Acceptance Criteria. Acceptance Criteria defines *what* done looks like. Verification records *how* we confirmed it. A task can pass its own acceptance criteria and still be unverified if the approach hasn't been checked against authoritative sources.

This matters especially for AI-generated work, where the output may be plausible but wrong — hallucinated APIs, outdated patterns, subtle misuse of a library. Verification closes that gap.

---

## A Verification consists of

- **ID** — unique identifier, scoped to the task
- **Type** — the kind of verification performed:
  - *Documentation* — checked against official docs, spec, or RFC. The agent or human read the relevant documentation and confirmed the approach is correct for the version in use.
  - *Research* — investigated via web search, community resources, or comparable implementations. Used when docs are insufficient or the question is about best practice rather than correctness.
  - *Testing* — the code was run, tests pass, behavior was observed. Not just "tests exist" — tests were executed and passed.
  - *Code Review* — a human reviewed the output and confirmed it meets standards. Used for sensitive or high-risk tasks.
  - *External Validation* — confirmed against a third-party system: an API responded correctly, a service accepted the integration, a third-party tool produced expected output.
- **Source** — where the verification came from: a URL, a file path, a tool name, or "human review by [name]"
- **Result** — passed / failed / partial
  - *Passed* — the approach/output is confirmed correct against this source
  - *Failed* — the source contradicts the approach; the task needs revision
  - *Partial* — the source confirms some aspects but raises questions about others; notes explain what remains unresolved
- **Performed By** — human or agent (with identifier)
- **Date** — when this verification was performed. Verifications can become stale if dependencies upgrade or docs change.
- **Notes** — what was checked, what was found, any caveats. If partial or failed, this field is mandatory.
- **Stale** — a flag set when the underlying source may have changed (e.g., a tech stack entry's version was upgraded after this verification was performed). A stale verification is not invalid — it's a prompt to re-verify.

---

## Multiple Verifications per Task

A task can have multiple Verifications of different types. A task implementing a Stripe integration might have: one Documentation verification (checked against Stripe's API docs), one Testing verification (integration test passed), and one Research verification (confirmed the webhook signature approach against community best practice). Together they give high confidence.

A task with zero verifications is implicitly unverified — acceptable for low-risk work, a concern for anything touching auth, payments, security, or external integrations.

---

## Verification Status (aggregate across all verifications on a task)

| Status | Meaning |
|---|---|
| Unverified | No verifications recorded |
| Partially Verified | Some verifications exist; at least one is partial or a relevant type is missing |
| Verified | At least one passed verification of an appropriate type for the task's risk level |
| Verification Failed | At least one failed verification; task needs revision regardless of other statuses |
| Stale | All verifications passed but one or more is marked stale |

---

## Verification in Phase 3

For tasks involving external integrations, security-sensitive code, or any approach flagged as requiring validation, a Verification record is pre-populated during Phase 3 (Task Research) with Type and Source — ready to be executed and marked passed/failed during Phase 4 (Implementation). This means the executing agent knows it needs to verify, not just implement.

See [lifecycle.md](lifecycle.md) for the full Phase 3 process.
