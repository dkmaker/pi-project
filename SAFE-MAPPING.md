# SAFe Terminology Mapping

**Purpose:** Align the framework's entity naming with SAFe (Scaled Agile Framework) — the most widely adopted agile methodology in enterprise development. Using agreed, industry-standard terms means 👤 the human and 🤖 the AI agent share a common vocabulary without negotiation. When someone says "Epic," both sides already know what that means.

**Key:** 🤖 = AI agent action or responsibility · 👤 = Human action or responsibility · 🤝 = Both involved

---

## Why SAFe Terminology Matters Here

The current framework invents nothing new in terms of what projects need. It needs a way to express strategic goals, chunks of work, individual tasks, and the relationship between them. SAFe has already solved the naming problem — it is the dominant enterprise framework, taught in certifications, built into Jira, GitHub, Linear, and Azure DevOps, and understood by most developers and project managers.

Adopting SAFe naming does three things:

1. **Removes the vocabulary negotiation.** The AI agent already has deep training on SAFe terminology. A human who has worked in any software organization for more than a year likely knows what an Epic is. No one needs to learn the framework's private language.

2. **Enables tooling compatibility.** Jira, Linear, GitHub Projects, and Azure DevOps all use SAFe-aligned naming. Entities in this framework that map to those names can be exported, visualized, or synced with those tools without translation.

3. **Makes AI prompting more precise.** When you ask the agent to "check all open Stories in Epic E-04," the agent has strong prior knowledge of what that relationship looks like. Invented names have no such prior.

---

## The SAFe Hierarchy (What It Is)

SAFe organizes work across four levels. The framework only uses the bottom three — it is built for solo developers and small teams, so Portfolio-level constructs (multiple ARTs, Lean Portfolio Management, Value Streams across business units) don't apply. What does apply is:

```
Strategic
  └── Epic            — Large body of work spanning multiple sprints; maps to a business outcome
        └── Feature   — A deliverable chunk within one planning period; owned by one team
              └── Story (User Story) — Small, user-facing unit of value; completable in one sprint
                    └── Task          — Concrete technical step needed to complete a Story
```

Additionally SAFe defines these cross-cutting concepts that are directly relevant regardless of scale:

- **Enabler** — Work that doesn't deliver user value directly but enables future work (infrastructure, architecture, research)
- **Spike** — A time-boxed research or investigation task to reduce uncertainty
- **Acceptance Criteria** — The specific, observable conditions that define "done" for a Story or Feature
- **Definition of Done** — A consistent quality checklist applied to all work items
- **Iteration / Sprint** — A fixed time-box (typically 2 weeks) during which Stories are completed
- **PI (Program Increment)** — A larger planning horizon (8–12 weeks), used here loosely as a "phase of work"
- **Risk** — A potential future problem tracked in a Risk Register
- **Dependency** — A sequencing constraint between work items
- **Blocker** — Something actively preventing work from proceeding

---

## Current Framework → SAFe Name Mapping

### Direct Replacements

| Current Name | SAFe Name | Who acts | Notes |
|---|---|---|---|
| Epic | **Epic** | 👤 owns · 🤖 executes | ✅ Already aligned. Keep as-is. |
| Task | **Story** | 🤖 executes · 👤 reviews | The current "Task" maps to a SAFe Story — user-facing, completable in one session, has Acceptance Criteria. Rename to **Story**. |
| Subtask | **Task** | 🤖 checks off each step | In SAFe, a Task is a concrete technical step inside a Story. This is exactly what the current Subtask is. Rename to **Task**. |
| Milestone | **Milestone** | 👤 confirms reached · 🤖 evaluates criteria | SAFe uses Milestones within PI Planning. Keep as-is. |
| Goal | **Strategic Theme** (lightweight) | 👤 defines · 🤖 references | SAFe Strategic Themes are the top-level business objectives that Epics serve. For solo use, "Goal" is simpler and widely understood. **Recommendation: keep "Goal" but acknowledge the SAFe equivalent.** |
| Verification | **Acceptance Criteria check** + **Definition of Done check** | 🤖 runs · 👤 for human-required checks | Verifications in the current framework combine both concepts. Split them: Acceptance Criteria are per-Story; Definition of Done is a project-wide checklist. |
| Pattern Contract | **Architectural Runway / Enabler** | 🤖 declares · 🤖 propagates on change | When a Story establishes an interface others depend on, it is creating Architectural Runway. Pattern Contracts are the dependency declarations on that runway. No perfect SAFe equivalent — keep the name but explain it in SAFe terms. |
| Phase Completion Record | **PI Retrospective / Inspect and Adapt output** | 🤖 writes · 🤖 reads gate · 👤 confirms | The gate check at the end of each phase is equivalent to SAFe's Inspect and Adapt event output. Rename to **Phase Gate Record**. |
| Session Log | *(No direct SAFe equivalent)* | 🤖 writes at session end · 🤖 reads on cold-start | SAFe doesn't model individual agent sessions. Keep "Session Log" — it's specific to AI agent resumption and has no standard alternative. |
| Work Interval | *(No direct SAFe equivalent)* | 🤖 records automatically | SAFe doesn't track sub-session AI execution time. Keep "Work Interval." |
| Change Request | **Change Request** | 👤 initiates · 🤖 processes downstream | SAFe uses Change Requests for scope changes to committed work. ✅ Already aligned. |
| Scope Change | **Scope Change** | 👤 approves · 🤖 applies | ✅ Already aligned. |
| Decision | **Decision** | 👤 decides · 🤖 records with rationale | SAFe records decisions as Architectural Decision Records (ADRs). Can reference ADR format optionally. ✅ Keep as-is. |
| Question | **Impediment** (partial) | 🤖 creates · 🤖 escalates · 👤 resolves | An unresolved Question that blocks a Story is a SAFe Impediment. Questions that don't block anything are more like open items in a retrospective. **Recommendation: rename blocking Questions to Impediments when they generate a Blocker; keep "Question" for unresolved but non-blocking items.** |
| Blocker | **Impediment** | 🤖 detects and raises · 👤 or 🤖 clears | SAFe calls blockers Impediments. **Rename Blocker → Impediment.** Clears up the current Question/Blocker relationship (a Question that blocks generates an Impediment). |
| Risk | **Risk** | 🤖 identifies · 👤 accepts or rejects | ✅ Already aligned. SAFe PI Planning has a formal risk identification step with the same categories. |
| Delegation Level | **Work Item Type** (partial) | 👤 sets per Story · 🤖 enforces | SAFe distinguishes work item types (Enabler vs Business Feature) but doesn't have the same delegation model. Keep "Delegation" — it's agent-specific. |
| Project Resources | **Solution Context / Architectural Runway** | 👤 defines · 🤖 reads and references | Tech Stack, Rules, Conventions are part of the Solution's architectural context. Not a precise SAFe term. Keep "Project Resources." |

---

### The Critical Rename: Task → Story, Subtask → Task

This is the most impactful change and the one most worth making.

**Current state:** The framework calls its primary work unit a "Task." In SAFe, a Task is the smallest unit — a concrete technical step done by one developer, usually taking hours, not needing its own Acceptance Criteria.

**The problem:** When a human or AI agent hears "Task," they think of something small and technical. But the current framework's "Task" is actually a Story — it has a Goal statement (the user-facing intent), Acceptance Criteria, Affected Files, Delegation Level, Verifications, and a Completion Record. That is a Story with sub-steps, not a Task.

**The fix:**

| Old Name | New Name | Definition |
|---|---|---|
| Task | **Story** | A discrete unit of work with a clear user or system outcome, completable in one session. Has: Goal, Context, Acceptance Criteria, Affected Files, Pattern Contracts, Verifications, Delegation Level, Completion Record. |
| Subtask | **Task** | A concrete technical step inside a Story. Binary done/not-done. No Acceptance Criteria. Ordered. Used for resumption. |

**Why this matters:** Every developer knows Stories have Acceptance Criteria and Tasks don't. Every AI agent trained on software development knows the same. Using the correct names means the agent's existing knowledge works with the framework rather than against it.

---

### The Blocker → Impediment Rename

SAFe uses "Impediment" everywhere — in Scrum ceremonies, in Jira, in PI Planning risk boards. A Blocker is an Impediment. Renaming removes a custom term and replaces it with one that every practitioner already uses.

The relationship also clarifies: 🤖 a Question that blocks a Story generates an **Impediment** on that Story automatically. 🤖 The Impediment's resolution path points back to the Question. 👤 Resolving the Question resolves the Impediment. This is how SAFe Impediments work — 🤖 they are raised by the team and owned by 👤 someone with authority to resolve them.

---

### Introducing the Feature Layer

**The current framework has a gap:** it jumps from Epic directly to Story (currently called Task). SAFe puts a Feature layer between them.

For solo developers and small teams, the Feature layer is optional but valuable. A Feature answers: *"What does this deliverable chunk do, from the user's perspective, within this planning period?"* An Epic is too big to commit to completing this sprint. A Story is too small to represent a meaningful product increment. A Feature is the natural unit of a sprint or two-week period.

**When to use Features:**
- Epics that decompose into more than 4–5 Stories benefit from grouping those Stories into Features
- When you want to say "this week we're delivering the authentication feature" — that's a Feature
- When there are natural sub-groupings within an Epic that span 3–10 Stories

**When to skip Features:**
- Very small projects or Epics that only have 2–3 Stories
- Solo developers who find the extra layer overhead

**Recommendation:** Add Feature as an optional layer between Epic and Story. The framework works without it (Stories link directly to Epics) but supports it when needed.

---

### Enabler Stories (New)

SAFe's Enabler concept is directly applicable and currently missing from the framework by name. The framework has Infrastructure Epics — Epics that don't map to a Goal but serve a Constraint (like setting up CI/CD). The same concept applies at the Story level.

An **Enabler Story** is a Story that doesn't deliver direct user value but creates the technical foundation for future Stories. Examples:
- Setting up a test database
- Writing an API client that three future Stories will use
- Refactoring a module before adding new functionality to it

Enabler Stories follow the same structure as Business Stories but their Goal statement references the Constraint or Architectural requirement they serve, not a user-facing Goal.

**Adding this distinction makes the intent of every Story clear immediately.** A Business Story exists to deliver value. An Enabler Story exists to make future value delivery possible.

---

### Spike (New)

SAFe's Spike is a time-boxed investigation Story — not designed to produce deliverable code, but to produce a decision or finding. The current framework covers research under the Delegation Level "Research" — but that applies at the Story level, meaning a whole Story is designated as research-only.

A **Spike** is more specific: it is a discrete, time-boxed investigation with a defined question to answer and a defined output format (a finding, a recommendation, a prototype). When Phase 3 research reveals that a particular technical approach is uncertain, the right answer is a Spike Story, not a Research-delegated Story. The Spike has a token/time budget, a question ("Is library X viable for this use case?"), and a documented finding. If the finding is "yes," the Spike is done and the implementation Story proceeds. If "no," the Spike surfaces an alternative and the implementation Story is replanned.

**Important distinction:** A Spike is planned work to resolve genuine technical uncertainty before a Story can be written. It is not the same as a staleness validation check. Do not create a Spike when a Tech Stack version change triggers a context review — that is handled by an autonomous validation agent (see Research Date below), not by a planned Story. A Spike is only created when a question cannot be answered from existing knowledge and requires active investigation.

Since all work is executed by 🤖 AI agents, a Spike runs as 🤖 **a subagent with a bounded token budget** — not an open-ended exploration. 🤖 The output is a structured finding written to the Story file. 👤 The human is only involved if the finding requires a decision that changes scope or approach (which would generate a Question and, if scope-altering, a Change Request).

---

## Proposed Revised Entity Naming

```
Project
├── Stage: uninitialised | phase_1 | phase_2 | phase_3 | phase_4 | complete | abandoned | on_hold
├── Mode:  normal | change_management | infeasibility_review | phase_gate | awaiting_specialist
├── Goals  (SAFe equivalent: Strategic Themes)
├── Project Resources  (Tech Stack, Docs, Rules, Conventions)
├── Milestones
│   └── Epics  (unchanged)
│       ├── [Optional] Features  (NEW — grouping layer between Epic and Story)
│       └── Stories  (renamed from Task)
│           ├── Story Type: Business | Enabler | Spike  (NEW)
│           ├── Tasks  (renamed from Subtask — concrete technical steps)
│           ├── Impediments  (renamed from Blocker)
│           ├── Dependencies
│           ├── Pattern Contracts
│           ├── Pattern Dependencies
│           ├── Acceptance Criteria  (part of Story — same as before)
│           ├── Verifications  (unchanged)
│           └── Work Intervals  (unchanged — not a SAFe concept)
├── Risk Register  (unchanged — SAFe-aligned already)
├── Change Requests → Scope Changes  (unchanged — SAFe-aligned already)
└── Session Log  (unchanged — no SAFe equivalent)
    └── Phase Gate Records  (renamed from Phase Completion Record)

Decisions  (unchanged; SAFe calls these ADRs)
Questions  (unchanged for non-blocking; blocking Questions generate Impediments)
Impediments  (renamed from Blocker)
```

---

## What Stays Exactly as It Is

These entities are either already SAFe-aligned or have no standard equivalent and should not be forced into a SAFe name:

| Entity | Reason to Keep |
|---|---|
| Session Log | AI-agent-specific; no SAFe equivalent; too important to rename arbitrarily |
| Work Interval | AI-agent-specific; no SAFe equivalent |
| Pattern Contract | No precise SAFe equivalent; "Architectural Runway" is close but less precise |
| Pattern Dependency | No SAFe equivalent; keep |
| Delegation Level | Agent-autonomy model; SAFe has no equivalent |
| Exact State | AI-agent-specific; no SAFe equivalent |
| Research Date | AI-agent-specific; no SAFe equivalent; keep — but trigger model is event-based not time-based (see below) |
| Completion Record | SAFe has "Definition of Done" checks but not a per-Story Completion Record; keep |
| Goal | "Strategic Theme" is the SAFe equivalent but "Goal" is universally understood; keep |

---

## Research Date: Event-Based Staleness, Not a Calendar Threshold

The original framework used a 60-day calendar threshold on the Research Date field: if a Story's research was more than 60 days old, the agent re-validated it before starting. **This model is wrong for AI-agent-driven projects and should be replaced entirely.**

### Why the calendar model fails

All work in this framework is intended to be executed by AI agents. Projects move from Phase 3 to Phase 4 in days, not months. Sessions are short. A 60-day window will either never fire (the project is done before it triggers) or fire unnecessarily (the library hasn't actually changed, the threshold just elapsed). Calendar time is noise.

### The correct model: event-driven validation

A Story's research is considered potentially stale only when **a Tech Stack Entry it references records a version change after the Story's Research Date**. This is the only meaningful staleness signal.

When a Tech Stack Entry version is updated, a **validation agent** runs automatically in the background. It is not a Spike (which is planned investigative work). It is a bounded autonomous check with three possible outcomes:

| Outcome | What happened | Who handles it |
|---------|--------------|---------------|
| **No impact** | The change does not affect this Story's approach | 🤖 Validation agent closes the flag silently — 👤 human never sees it |
| **Context update** | The approach is still valid but a detail changed (e.g., a method was renamed, a parameter added) | 🤖 Validation agent updates the Story's Context field directly and closes the flag — 👤 human never sees it |
| **Breaking conflict** | The approach no longer works — breaking change, deprecation, incompatibility | 🤖 Validation agent raises an **Impediment** on the Story — surfaces to 👤 human for resolution |

**👤 The human only ever sees outcome 3.** Everything that can be resolved autonomously is resolved by 🤖 the agent. Only genuine conflicts requiring a decision escalate to 👤 the human.

### What this means for the Research Date field

The Research Date field is retained but its semantics change:

- It is no longer compared against today's date with a fixed threshold
- It is compared against the version history of each Tech Stack Entry the Story references
- The comparison is run by the validation agent when a Tech Stack Entry version is updated
- The Research Date therefore answers: "was this Story researched before or after the last version change in its dependencies?"

### Human / Agent escalation boundary

This model defines the escalation boundary explicitly:

- 🤖 **Agent resolves autonomously:** no impact checks, context-only updates, routine validation passes
- 🤖 **Agent escalates to 👤 human:** breaking conflicts only — with a specific Impediment that names the Tech Stack Entry, the version that changed, the Story affected, and exactly why the Story's stated approach no longer holds

This is the principle that applies across the entire framework: **only what genuinely requires 👤 human judgment reaches the human.** Everything else is handled by 🤖 supporting agents and closed without interruption.

---

## Summary of Changes

| Change | Old Name | New Name | Impact |
|---|---|---|---|
| **Rename** | Task | **Story** | High — primary work unit; update all docs, tools, IDs (T-xxx → S-xxx) |
| **Rename** | Subtask | **Task** | High — cascades from above |
| **Rename** | Blocker | **Impediment** | Medium — aligns with SAFe/Scrum standard |
| **Rename** | Phase Completion Record | **Phase Gate Record** | Low — clearer name, same concept |
| **Add** | *(missing)* | **Feature** (optional layer) | Medium — new optional grouping between Epic and Story |
| **Add** | *(missing)* | **Story Type: Business / Enabler / Spike** | Medium — makes intent explicit on every Story |
| **Clarify** | Verification | Split into Acceptance Criteria + DoD check | Low — clarifies which is per-Story vs project-wide |
| **Clarify** | Question → Blocker | Question → Impediment (when blocking) | Low — naming only, logic unchanged |
| **Redesign** | Research Date (60-day threshold) | **Event-based staleness** — triggered by Tech Stack version change, not calendar time; validated autonomously by agent; only breaking conflicts reach human | High — changes the trigger model and removes the calendar threshold entirely |

---

## SAFe Concepts Deliberately Not Adopted

These SAFe constructs exist but don't apply to solo/small-team development and would add overhead without value:

| SAFe Concept | Why Not Adopted |
|---|---|
| Agile Release Train (ART) | Multiple teams synchronizing delivery. Solo developer = one team. |
| Program Increment (PI) Planning | 2-day event with 50–125 people. Not applicable. The phases serve the same purpose at appropriate scale. |
| Capability | Work item spanning multiple ARTs. Single-team projects don't need this layer. |
| Value Stream | Enterprise-level construct for mapping end-to-end business value flows. |
| Lean Portfolio Management | Multi-portfolio budget governance. Not applicable to single projects. |
| Solution Train | Coordinates multiple ARTs. Not applicable. |
| WSJF (Weighted Shortest Job First) | SAFe's prioritization formula. Optional — can be adopted as a prioritization method for the Story backlog without needing a formal entity. |

---

## ID Scheme Update

With the rename of Task to Story and Subtask to Task:

| Entity | New ID Prefix | Example |
|---|---|---|
| Epic | `E-` | E-04 |
| Feature | `F-` | F-12 (when used) |
| Story | `S-` | S-023 |
| Task | `T-` | T-023-1 (scoped under Story) |
| Impediment | `IMP-` | IMP-007 |
| Decision | `D-` | D-012 |
| Question | `Q-` | Q-007 |
| Risk | `R-` | R-003 |
| Milestone | `M-` | M-02 |
| Session Log | `SL-` | SL-042 |
| Change Request | `CR-` | CR-005 |
| Phase Gate Record | `PGR-` | PGR-3 |

---

## One-Sentence Summary

**Use Story instead of Task, Task instead of Subtask, Impediment instead of Blocker — and add optional Feature grouping and explicit Story Types (Business / Enabler / Spike) — and the framework speaks the same language as every developer, every AI agent, and every project tool already in use.**
