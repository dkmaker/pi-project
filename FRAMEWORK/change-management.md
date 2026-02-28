# Entities: Change Request & Scope Change

These two entities together form the **Change Management process** — the formal pathway for any post-phase modification to the stable layer of the project (Goals, Epics, Milestones, Constraints, Tech Stack Entries). Without this process, the framework has no defined exit for "I want to change something that was already decided."

---

## Entity: Change Request

A **Change Request** is the formal entry point for any proposed change to a project-level entity after the phase in which that entity was defined. It is a proposal — it must be approved before any downstream change takes effect.

Change Requests exist because not all changes are equal. A minor wording clarification to a Goal is different from adding a new Epic or dropping a Constraint. Both need to be recorded and approved, but their downstream impact differs enormously. The Change Request captures the proposal and its impact before anything is changed, giving the human a clear picture of consequences before sign-off.

**Trigger conditions for a Change Request:**
- The human explicitly wants to revise a Goal, Epic, Milestone, or Constraint
- An agent discovers mid-Phase 4 that a requirement alters an Epic's scope
- A Question resolves in a way that contradicts an existing Goal or Constraint
- A Risk (see [risk.md](risk.md)) is realized and forces a scope decision
- A Tech Stack version change (see [reference.md](reference.md)) has breaking downstream impact that requires Epic or Task revision

**A Change Request consists of:**

- **ID** — unique identifier (e.g. CR-001)
- **Initiator** — human or agent identifier, and what triggered the request
- **Target entity** — which entity is proposed to change: type (Goal / Epic / Milestone / Constraint / Tech Stack Entry) and ID
- **Previous state** — a verbatim snapshot of the entity's relevant fields as they currently stand. This is the "before" record. It must be complete enough that the Scope Change entity (if approved) can reconstruct the diff without additional lookups.
- **Proposed state** — what the entity's fields would become if the request is approved. Same completeness requirement as Previous State.
- **Rationale** — why the change is warranted. Agents initiating a Change Request must provide reasoning, not just a diff. Humans may provide a brief statement.
- **Impact analysis** — a structured enumeration of what the change cascades to:
  - Which Tasks move to `⚠️ Needs Review` (and why)
  - Which Verifications become Stale (and which Tech Stack Entries or Pattern Contracts they depended on)
  - Which Pattern Contracts may be invalidated or need re-versioning
  - Which Phase(s) need partial re-execution:
    - New Epic → Phase 3 must run for that Epic
    - Revised Constraint → Phase 2 may need revisiting
    - Changed Goal → Phase 2 Epic-to-Goal mapping must be re-evaluated; Phase 3 Acceptance Criteria for affected Tasks may need revision
    - Removed Epic → Abandoned status process must run for all its Tasks
  - Which open Questions are resolved or newly opened by this change
- **Required phase re-runs** — explicit list of phases or sub-phases that must partially re-execute. "None" is a valid answer but must be stated explicitly, not assumed.
- **Status** — pending-review / approved / rejected
- **Human sign-off** — required before any change takes effect. The Change Request does not modify any entity — it only proposes. The Scope Change entity (below) is what makes the change real, and it is only created upon approval.
- **Rejection rationale** — if rejected: why, and what alternative (if any) is recommended. A rejected Change Request is a Decision record by another name — it documents what was considered and why it was not done.

**Change Request resolution:**
- **Approved** → a Scope Change entity is created immediately (see below). The Change Request status moves to `approved` and references the resulting Scope Change ID.
- **Rejected** → no downstream changes occur. The rejection rationale is recorded. If the triggering Question or Risk is still open, it must be re-examined via an alternative path.

---

## Entity: Scope Change

A **Scope Change** is the record that a project-level entity was actually changed. It is created only when a Change Request is approved. It is distinct from a Decision: a Decision records a choice made during planning; a Scope Change records a modification to something already decided, with explicit before/after state and a cascade map.

**A Scope Change consists of:**

- **ID** — unique identifier (e.g. SC-001)
- **Change Request reference** — the CR-ID that produced this Scope Change
- **Target entity** — the entity that changed (type and ID)
- **Previous state** — copied from the approved Change Request. The entity's verbatim field snapshot before the change.
- **New state** — the entity's fields as they now stand after the change is applied.
- **Rationale** — why the change was made (referenced from the Change Request; may be summarized)
- **Triggered by** — the specific event that initiated the Change Request: Question ID, Decision ID, Risk ID, human directive, or external event
- **Downstream impact** — the realized cascade, not just the predicted one. After the change is applied and downstream entities are updated, this field records what actually happened:
  - Tasks flagged `⚠️ Needs Review`: list of Task IDs
  - Verifications marked Stale: list of Verification IDs
  - Pattern Contracts re-versioned: list of Pattern Contract names and new versions
  - Phase re-runs initiated: which phases and what scope
- **Required actions checklist** — what must happen before work continues, as an explicit ordered list. Each item has a status (pending / complete). Work does not resume until all items are complete.
- **Human sign-off** — the approval reference from the Change Request, copied here for direct traceability
- **Status** — pending (approved, cascades not yet applied) / applied (all required actions complete and verified)

**A Scope Change is not complete until its Status reaches `applied`.** The transition from `pending` to `applied` requires all items in the Required Actions checklist to be marked complete. An agent checking whether it can resume work after a Scope Change must read the Scope Change Status — not just whether the Change Request was approved.

---

## The Change Management Flow

```
Trigger (human request / agent discovery / resolved Question / realized Risk)
  │
  ▼
Change Request created (by agent or human)
  │
  ├── Impact analysis written
  ├── Required phase re-runs identified
  │
  ▼
Human reviews and decides
  │
  ├── Rejected → rationale recorded → process ends
  │
  └── Approved → Scope Change entity created
                    │
                    ├── Target entity updated to new state
                    ├── Downstream cascades applied:
                    │     Tasks → ⚠️ Needs Review
                    │     Verifications → Stale
                    │     Pattern Contracts → re-versioned
                    │     Phase re-runs → initiated
                    │
                    ├── Required Actions checklist populated
                    │
                    └── Work resumes only when Status = applied
```

---

## Relationship to Other Entities

- A **Change Request** may be triggered by a **Question** (when resolution contradicts existing entities), a **Risk** (when a risk is realized), or a **Decision** (when a past decision needs revisiting).
- An approved Change Request produces a **Scope Change**, which may produce **⚠️ Needs Review** flags on Tasks (resolved via the Needs Review process in [relationships.md](relationships.md)).
- Scope Changes are part of the project's audit trail. They answer "why does this Epic look different from Phase 2?" with a complete before/after record.
- A Scope Change that drops an Epic triggers the **Abandonment Record** requirement for that Epic and all its Tasks (see [reference.md](reference.md)).
- A Scope Change that adds a new Epic triggers a **Phase 3 mini-run** for that Epic (see [lifecycle.md](lifecycle.md)).
