# SAFe → Framework: Coverage Map

**Purpose:** Walk every SAFe concept and ask: does our framework cover it? How? What is missing, what is different by design, and what is a gap that needs to be addressed.

Read this from a SAFe practitioner's perspective — you know SAFe, you are evaluating whether this framework gives you the equivalent coverage.

Legend:
- ✅ **Covered** — the framework has this, under the same or equivalent name
- 🔄 **Covered differently** — the framework addresses the concept but under a different model or name
- ⚠️ **Partial** — the framework has something here but it is incomplete or implicit
- ❌ **Missing** — SAFe defines this; the framework does not have it at all
- 🚫 **Deliberately excluded** — SAFe defines this at enterprise scale; excluded by design for solo/small-team use

---

## Work Item Hierarchy

### Portfolio Epic
The highest SAFe level — a large strategic initiative requiring investment analysis, spanning multiple PIs, owned by the portfolio.

**Status: 🚫 Deliberately excluded**
The framework has no portfolio layer. A single project is the top of the hierarchy. If a human runs multiple projects, each is independent. There is no construct for cross-project strategic investment governance.

> ❌ **Gap to flag:** If a user ever needs to manage two related projects as a coordinated programme, there is no entity for it. No "Programme" or "Portfolio" level exists. This is a known, intentional limit of the current scope — but worth naming so it is a conscious boundary, not an accidental one.

---

### Solution Epic / Programme Epic
SAFe's mid-tier epic, spanning multiple ARTs but below Portfolio.

**Status: 🚫 Deliberately excluded**
Same reasoning as Portfolio Epic. No multi-team coordination layer exists. Single ART assumption throughout.

---

### Epic
A large body of work spanning multiple iterations, delivering a business outcome, owned by a product manager, decomposed into Features or Stories.

**Status: ✅ Covered**
The framework has Epics. They have Name, Description, Scope-In, Scope-Out, Milestone assignment, contributing Goals, and Epic Dependencies (hard/soft with Gate Conditions). Infrastructure Epics exist for work that serves a Constraint rather than a Goal — directly equivalent to SAFe's Enabler Epics.

> ⚠️ **Partial gap:** SAFe Epics have a formal **Lean Business Case** — a documented hypothesis of expected business outcomes and a minimum viable product definition used to get portfolio approval before the Epic is funded. The framework's Epic has Scope-In/Scope-Out and Goal references but no explicit hypothesis or MVP definition field. For a solo developer this is often unnecessary, but for any project with a budget stakeholder, the missing MVP hypothesis means there is no formal point at which the Epic's value assumption is stated and later validated.

> ❌ **Missing:** SAFe has **Epic Kanban** — a visual board tracking Epics from Funnel → Analysing → Portfolio Backlog → Implementing → Done. The framework has Stage and Mode on the Project, and task statuses at the Story level, but no equivalent board-level flow state for Epics themselves. An Epic in the framework is either pending or active — there is no funnel or analysis state before it enters the plan.

---

### Capability
A work item at the Solution level — larger than a Feature, requiring multiple ARTs, decomposed into Features.

**Status: 🚫 Deliberately excluded**
Single-team assumption. No multi-ART coordination required.

---

### Feature
A deliverable chunk of functionality completable within one PI by one team. Groups related Stories. Bridges Epic and Story.

**Status: ⚠️ Partial — proposed but not yet implemented**
The framework currently jumps directly from Epic to Story (currently called Task). The Feature layer has been proposed in `SAFE-MAPPING.md` as an optional grouping, but it does not yet exist as a defined entity with its own fields.

> ❌ **Missing fields if Feature is added:** SAFe Features have: Name, Benefits Hypothesis, Acceptance Criteria (including non-functional requirements), a Business/Enabler classification, and a Program Kanban state. None of these are currently defined for the proposed Feature entity.

> ❌ **Missing:** SAFe has a **Program Backlog** — a prioritised, ordered list of Features ready for PI Planning. The framework has no equivalent backlog artefact at the Feature level. Story priority exists per Epic, but there is no cross-Epic prioritised Feature queue.

---

### Story (User Story)
The primary team-level work unit. User-facing, completable in one sprint, written in "As a / I want / So that" format, with Acceptance Criteria.

**Status: ✅ Covered** *(currently named "Task" — rename to Story proposed)*
The framework's Task/Story entity is well-developed: Goal, Context, Research Date, Acceptance Criteria, Affected Files, Subtasks/Tasks, Dependencies, Pattern Contracts, Verifications, Delegation Level, Work Log, Completion Record.

> ⚠️ **Partial gap:** SAFe Stories are formally written in user-story format: *"As a [user], I want [function], so that [purpose]."* The framework's Goal field covers intent but does not enforce or suggest this format. For a solo developer writing code for themselves this is minor. For any project with actual users or stakeholders, the format matters because it forces the author to name who benefits and why — which prevents purely technical Stories that have no stated user value.

> ⚠️ **Partial gap:** SAFe distinguishes **Business Stories** (deliver user value) from **Enabler Stories** (build technical foundations). The framework has Infrastructure Epics at the Epic level but no equivalent Story-level type field. A Story that writes internal plumbing looks identical to a Story that ships a user feature. Story Type (Business / Enabler / Spike) has been proposed but not implemented.

---

### Task
The smallest SAFe unit — a concrete technical step inside a Story, done by one person, usually hours, no Acceptance Criteria.

**Status: ✅ Covered** *(currently named "Subtask" — rename to Task proposed)*
The framework's Subtask is exactly this: ordered, binary done/not-done, no separate Acceptance Criteria, used for resumption tracking.

---

### Spike
A time-boxed investigation Story producing a finding, not deliverable code. Has a defined question, a time/token budget, and a structured output.

**Status: ⚠️ Partial — named and defined in SAFE-MAPPING.md, not yet implemented as a Story Type**
The framework covers research through Delegation Level "Research" on a Story, but a Spike is more specific: bounded, question-driven, output-defined. Proposed as a Story Type (alongside Business and Enabler) but not yet a formal entity field.

> ❌ **Missing:** No formal Spike output format defined. SAFe Spikes produce a structured finding that either confirms an approach (Story proceeds) or rejects it (Story replanned). The framework has no defined schema for what a Spike's output document looks like or where it is stored.

---

## Planning Constructs

### Program Increment (PI)
An 8–12 week planning and delivery timebox. The heartbeat of SAFe. All ARTs synchronise to the same PI cadence.

**Status: 🔄 Covered differently**
The framework's four Phases serve a similar purpose — a structured planning horizon with a defined output and a gate before the next begins. Phase 3 produces the full task graph before Phase 4 begins, which is analogous to PI Planning producing committed Features before an increment begins.

> ⚠️ **Different model:** SAFe PIs are repeating — at the end of one PI, the next is immediately planned. The framework's phases are linear and one-time per project. There is no concept of "what is the next PI?" once implementation is underway. Long projects with many Epics have no re-planning checkpoint within Phase 4 — the entire phase runs until all Epics are done. 

> ❌ **Missing:** For projects spanning more than one natural planning horizon, there is no mechanism to pause Phase 4, review progress, and replan the remaining Epics with updated priorities. This is what SAFe PI boundaries provide. The framework has Change Requests for scope changes and the Risk Register for emerging risks, but no structured re-planning event within Phase 4.

### PI Planning
The 2-day event where all teams plan the next PI together — setting objectives, identifying dependencies, negotiating commitments.

**Status: 🚫 Deliberately excluded** *(at enterprise scale)*

The framework's Phase 2 (Epic/Milestone planning) and Phase 3 (Task Research/Decomposition) together serve the same purpose for a solo developer: structured planning with explicit outputs before implementation begins. The interview-to-planning-to-decomposition sequence is PI Planning compressed to fit one agent and one human.

> ⚠️ **Different model:** SAFe PI Planning is collaborative and multi-team. The framework's equivalent is sequential and solo. The dependency identification and commitment negotiation that PI Planning surfaces through team interaction must instead be surfaced by the agent during decomposition. The agent has to simulate the cross-team visibility that PI Planning provides by reading the full task graph and identifying conflicts explicitly.

### Program Increment Objectives
SMART goals that each team commits to for the PI. Used to measure PI success.

**Status: ❌ Missing**
The framework has Goals (project-level) and Acceptance Criteria (story-level) but no mid-level PI Objective — a committed statement of what will be delivered in this planning period. Milestones come closest but they define completion states, not commitments to deliver specific outcomes within a timeframe.

> ❌ **Gap to flag:** For any project where the human wants to set a "what we commit to delivering this week/sprint" target, there is no entity for it. The closest is a Milestone's Exit Criteria, but that is an outcome statement, not a delivery commitment for a bounded period.

### Iteration / Sprint
A 1–2 week team-level timebox within a PI. Stories are committed to, executed, and demonstrated within an iteration.

**Status: ❌ Missing**
The framework has no Sprint or Iteration concept. Work is organised by Epic and Story, but there is no time-boxing within Phase 4. There is no mechanism to say "these 5 Stories are the commitment for this two-week period."

> ❌ **Gap to flag:** Without iteration structure, there is no natural rhythm for review, retrospective, or re-prioritisation within Phase 4. The framework tracks individual Story completion but has no concept of a delivery cadence or a point at which the human reviews the batch of completed work and adjusts priorities for the next batch. The Session Log partially compensates (it records what was done per session) but it is not equivalent to a Sprint Review.

### Iteration Planning
The team-level planning event at the start of each sprint — selecting Stories, breaking them into Tasks, committing to the sprint goal.

**Status: ❌ Missing**
No equivalent ceremony or structured process exists within Phase 4. The agent picks the next Story based on priority and dependency rules and starts — there is no planning step for each work period.

---

## Quality and Completion

### Acceptance Criteria
Specific, observable conditions per Story or Feature that define when it is complete. Written before work starts. Checked when work ends.

**Status: ✅ Covered**
The framework's Story entity has Acceptance Criteria as a named field — a checklist of observable, yes/no verifiable outcomes. An agent should be able to check these against the code without human input.

> ⚠️ **Partial gap:** SAFe requires Acceptance Criteria to include **non-functional requirements** (performance, security, accessibility) explicitly, not just functional behaviour. The framework's Acceptance Criteria field is not structured to prompt for non-functional requirements. A Story about an API endpoint might have functional criteria ("returns 200 with correct payload") but miss non-functional ones ("responds within 200ms under load") unless the author thinks to include them.

### Definition of Done (DoD)
A project-wide quality checklist applied uniformly to every Story. Not specific to individual Stories. Covers code review, test coverage, documentation, deployment readiness.

**Status: ❌ Missing**
The framework has per-Story Verifications and Acceptance Criteria but no project-wide Definition of Done as a separate, reusable entity. Every Story defines its own done criteria in isolation.

> ❌ **Gap to flag:** Without a DoD, each Story independently defines its quality bar. Two Stories in the same project might have different standards for code review, test coverage, or documentation. A DoD enforces a floor across all Stories and is the mechanism that prevents quality drift as a project progresses. The framework should have a DoD as a Project Resource — a checklist that is always appended to Story completion, separate from Story-specific Acceptance Criteria.

### Inspect and Adapt (I&A)
SAFe's end-of-PI retrospective and re-planning event. Reviews PI performance, identifies systemic problems, and produces improvement stories for the next PI.

**Status: 🔄 Covered differently**
Phase Gate Records (currently "Phase Completion Records") serve this function at phase boundaries. They review what the phase produced against its checklist, identify gaps, and gate the next phase.

> ⚠️ **Partial gap:** SAFe I&A explicitly produces **improvement backlog items** — new Stories specifically for addressing process or quality problems found in the retrospective. Phase Gate Records document gaps and gate status but do not produce improvement Stories. If a Phase Gate identifies a problem, there is no defined process for creating a Story to fix it.

---

## Risk and Dependency Management

### Risk
A potential future problem. SAFe PI Planning has a formal risk identification session with five categories: Resolved, Owned, Accepted, Mitigated, Roam.

**Status: ✅ Covered**
The framework has a Risk Register with Risk entities tracking probability, impact, mitigation, and status (open / mitigated / realized → Impediment / accepted). Matches SAFe's intent.

> ⚠️ **Partial gap:** SAFe's **ROAM** model (Resolved / Owned / Accepted / Mitigated) is a specific categorisation used during PI Planning to triage risks in a structured session. The framework's Risk status transitions are similar but not labelled with ROAM terminology. Minor alignment opportunity.

### Dependency
A sequencing constraint between work items. In SAFe, cross-team dependencies are the primary concern — one team cannot start until another delivers.

**Status: ✅ Covered**
The framework has hard and soft Dependencies between Stories and Epic Dependencies between Epics. Dependencies gate Story status transitions — a Story cannot become Active until its hard Dependencies are Done.

> ⚠️ **Partial gap:** SAFe tracks dependencies on the **Program Board** — a physical or digital board where dependency arrows between teams are visually mapped. The framework has dependency records but no visualisation or board artefact. For complex dependency graphs, the absence of a visual map makes it harder to spot circular dependencies or critical path bottlenecks without reading individual entity files.

### Impediment (Blocker)
Something actively preventing a team from proceeding. Owned by the Scrum Master or RTE. Has a resolution owner and path.

**Status: ✅ Covered** *(currently named "Blocker" — rename to Impediment proposed)*
The framework's Blocker/Impediment is typed (Dependency, Resource, Decision, Specialist Routing, Verification Failure), always has a Resolution Path, and gates Story status transitions. A Story cannot be Active with an unresolved Impediment.

---

## Change Management

### Change Request
A formal request to change committed scope — a Goal, Epic, Milestone, or Constraint — after it has been established.

**Status: ✅ Covered**
The framework has Change Requests and Scope Changes as distinct entities. Stable entities cannot be informally modified — a Change Request is required. This maps directly to SAFe's change control for committed PI scope.

### Scope Change
The approved modification to a committed entity, produced when a Change Request is approved.

**Status: ✅ Covered**
Scope Changes are a distinct entity from Change Requests. Approval is required before any downstream entity is modified. The framework's Mode field includes `change_management` — when a Change Request is active, the project mode signals this to the agent.

---

## Roles and Governance

### Product Owner
Owns the Story backlog for one team. Writes and prioritises Stories. Defines Acceptance Criteria.

**Status: 🔄 Covered differently**
The human is the Product Owner. The framework does not model roles as separate entities — the human owns all product decisions. The agent surfaces prioritised work but the human makes final backlog decisions through Question resolution, Phase Gate Reviews, and Story review outcomes.

> ⚠️ **Partial gap:** There is no formal mechanism for the human to set or update Story priority within Phase 4 outside of a Change Request. If the human wants to reprioritise the remaining backlog mid-phase without changing scope, there is no lightweight entity for it. A priority adjustment is implicitly a scope change even if nothing is added or removed.

### Product Manager
Owns the Feature backlog for the ART. Defines Features, priorities them in the Program Backlog, facilitates PI Planning.

**Status: 🔄 Covered differently**
Covered by the human, the same as Product Owner. No separation of role required at solo/small-team scale.

### Scrum Master / RTE
Facilitates ceremonies, removes impediments, coaches the team.

**Status: 🔄 Covered differently**
The AI agent plays the Scrum Master role — it surfaces Impediments, enforces status transition rules, runs the cold-start protocol, and keeps the project moving. The agent does not facilitate ceremonies (there are none) but it does enforce process.

### Epic Owner
Defines an Epic's hypothesis and benefits, facilitates its implementation at the portfolio level.

**Status: ❌ Missing by name**
The human owns all Epics. There is no Epic Owner field or role assignment on the Epic entity. For solo use this is fine. If a project involves multiple stakeholders where different people own different Epics, there is no ownership model.

> ❌ **Gap to flag:** No ownership or assignment model exists anywhere in the framework. Every entity is implicitly owned by the single human. Any project involving more than one human stakeholder has no way to record who owns what.

---

## Backlog Management

### Portfolio Backlog
The prioritised list of approved Epics awaiting implementation.

**Status: 🚫 Deliberately excluded**
No portfolio layer.

### Program Backlog
The prioritised list of Features ready for PI Planning, owned by the Product Manager.

**Status: ❌ Missing**
The framework has no Program Backlog artefact. Epics have a task table (Story list) but there is no cross-Epic, priority-ordered queue of Features or Stories that represents "what is ready to be worked next." Story selection in Phase 4 is driven by dependency rules and priority within an Epic, but there is no backlog view across all Epics.

> ❌ **Gap to flag:** Without a cross-Epic backlog, the agent selects the next Story by reading each Epic's task list in order. There is no way for the human to pull a Story forward from a lower-priority Epic without creating a formal Change Request. A lightweight backlog reprioritisation mechanism is missing.

### Team Backlog
The prioritised list of Stories for one team's current iteration.

**Status: ❌ Missing**
No Sprint/Iteration concept means no Team Backlog in the SAFe sense. Stories within each Epic have a priority field but there is no unified, ordered, iteration-scoped list of committed work.

---

## Ceremonies and Cadence

### PI Planning
*(Covered above — Deliberately excluded at enterprise scale, addressed by Phases 2 and 3)*

### Sprint Planning / Iteration Planning

**Status: ❌ Missing**
*(Covered above — no iteration structure within Phase 4)*

### Daily Standup
A daily synchronisation event: what did you do, what will you do, what is blocking you.

**Status: 🚫 Deliberately excluded**
AI agents do not need a daily standup. The Session Log's Exact State field is the agent's equivalent of a standup answer — it records exactly where work is at the end of every session. The next session reads it and resumes. The human can read the Session Log at any time for the equivalent of a standup update.

### Sprint Review / System Demo
Demonstration of completed work at the end of each iteration to stakeholders.

**Status: ❌ Missing**
The framework has a Story Review process (four outcomes: Approved, Accepted with Notes, Minor Revision, Significant Rework) but it is per Story, not per iteration batch. There is no ceremony or artefact for "here is everything completed this week, review it as a set."

> ❌ **Gap to flag:** For projects with stakeholders who want a regular view of progress, there is no batch review mechanism. The human must check individual Story Completion Records. A lightweight "Sprint Review" artefact — a generated summary of Stories completed since the last review, with their Completion Records — would address this without adding ceremony overhead.

### Retrospective
End-of-sprint reflection: what worked, what didn't, what to improve.

**Status: ❌ Missing**
The framework has no Retrospective entity or ceremony. Phase Gate Records include a gate check but not a process reflection. Individual Story Completion Records have a Learnings field, but there is no aggregation of learnings into process improvements.

> ❌ **Gap to flag:** Learnings captured per Story currently have no destination. They are written into the Completion Record but there is no process to review them periodically and produce improvements to conventions, patterns, or delegation rules. A Retrospective artefact — even a lightweight one generated by an agent summarising recent Learnings fields — would close this gap.

---

## Lean and Flow Concepts

### Value Stream
An end-to-end sequence of activities that delivers a business solution. SAFe funds Value Streams, not projects.

**Status: 🚫 Deliberately excluded**
Single project, single team. Value Streams apply when multiple products or teams contribute to a business outcome.

### Lean Business Case
A formal hypothesis document for an Epic — expected outcomes, MVP definition, cost estimate — used to get portfolio approval.

**Status: ❌ Missing**
*(Flagged above under Epic)*

### WSJF (Weighted Shortest Job First)
SAFe's prioritisation formula: (Business Value + Time Criticality + Risk Reduction) / Job Duration. Used to sequence the Program Backlog.

**Status: ❌ Missing as a formal mechanism**
Stories have a Priority field (Critical / High / Medium / Low) but no weighted formula. The agent selects Stories by dependency satisfaction + priority within Epic, not by a calculated score across Epics.

> ⚠️ **Optional gap:** WSJF is not required, but for a project with many Stories across many Epics where the human wants to maximise value delivery, a WSJF score on each Story would give the agent a precise cross-Epic prioritisation signal. Currently the agent cannot compare the relative urgency of a Medium-priority Story in Epic 2 against a High-priority Story in Epic 5 — it just follows Epic order and priority tiers.

### Architectural Runway
The existing code, infrastructure, and technical foundations that allow future Features to be delivered without architectural rework.

**Status: 🔄 Covered differently**
The framework covers this through Pattern Contracts and Enabler Stories (proposed). When a Story establishes an interface or infrastructure that downstream Stories depend on, it declares a Pattern Contract. Downstream Stories declare Pattern Dependencies on it. This is the framework's equivalent of building and consuming Architectural Runway.

> ⚠️ **Partial gap:** SAFe tracks the overall Architectural Runway level as a programme-wide concern — is there enough runway ahead of the Feature pipeline? The framework has no aggregate view of runway health. It tracks individual Pattern Contracts but not whether the total runway is sufficient for the planned Features ahead.

---

## AI-Agent-Specific Gaps (No SAFe Equivalent — Framework Must Define These)

These are things SAFe does not address because SAFe was not designed for AI agents. The framework must define them itself. They are listed here to make the boundary explicit.

| Concept | Framework Status | Gap |
|---|---|---|
| **Session Log** | ✅ Defined | No gap — unique to AI agents |
| **Exact State** | ✅ Defined | No gap — unique to AI agents |
| **Work Interval** | ✅ Defined | No gap — unique to AI agents |
| **Research Date + event-based staleness** | ✅ Defined (event model) | No gap — unique to AI agents |
| **Delegation Level** | ✅ Defined | No gap — unique to AI agents |
| **Cold-start protocol** | ✅ Defined | No gap — unique to AI agents |
| **Completion Record** | ✅ Defined | No gap — unique to AI agents |
| **Pattern Contract propagation** | ✅ Defined | No gap — unique to AI agents |
| **Subagent pipelines** | ✅ Defined in package design | Not yet in framework docs — gap between design doc and framework spec |
| **Human/agent escalation boundary** | ⚠️ Partially defined | Defined for staleness validation; needs to be stated as a universal principle across all framework processes, not just Research Date handling |
| **Token budget tracking** | ❌ Missing | Work Intervals track token counts but there is no mechanism to set or enforce a token budget on a Spike or any bounded investigation. The budget exists conceptually but has no entity field. |

---

## Summary: What SAFe Has That the Framework Does Not

| SAFe Concept | Status | Priority to Address |
|---|---|---|
| Definition of Done (project-wide) | ❌ Missing | **High** — quality drift risk without it |
| Iteration / Sprint structure | ❌ Missing | **High** — no delivery cadence within Phase 4 |
| Program Backlog (cross-Epic ordered queue) | ❌ Missing | **Medium** — agent prioritisation is limited without it |
| Sprint Review (batch review artefact) | ❌ Missing | **Medium** — no stakeholder progress view |
| Retrospective artefact | ❌ Missing | **Medium** — Learnings have no destination |
| PI Objectives (period commitments) | ❌ Missing | **Medium** — no commitment-level construct within Phase 4 |
| Re-planning checkpoint within Phase 4 | ❌ Missing | **Medium** — long projects have no structured re-plan |
| Lean Business Case / Epic MVP hypothesis | ⚠️ Partial | **Low** — relevant when there is a budget stakeholder |
| Epic Kanban states | ⚠️ Partial | **Low** — Epic has no funnel/analysis states |
| Feature entity (with full fields) | ⚠️ Partial | **Low** — proposed but not defined |
| Ownership / assignment model | ❌ Missing | **Low** — only matters for multi-stakeholder projects |
| Non-functional requirements in AC | ⚠️ Partial | **Low** — not prompted, but possible to include |
| WSJF prioritisation formula | ❌ Missing | **Low** — optional; Priority field partially covers this |
| Token budget field on Spike | ❌ Missing | **Low** — conceptual only, not an entity field |
| Universal human/agent escalation principle | ⚠️ Partial | **Low** — stated for staleness, not generalised |
