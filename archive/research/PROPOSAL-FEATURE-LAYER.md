# Proposal: Introducing the Feature Layer

**Status:** Proposal — not yet implemented. Requires review before any framework changes are made.

**The gap:** The framework currently jumps directly from Epic to Task (Story). There is nothing between them. This means one Epic can hold 20 Tasks with no grouping, no intermediate completion signal, no way to say "this chunk of the Epic is shippable on its own." The Feature layer fills that gap.

---

## The Problem in Concrete Terms

Take an Epic like **"User Authentication."** It might contain:

```
Epic: User Authentication
├── T-001  Set up auth database schema
├── T-002  Build registration endpoint
├── T-003  Build login endpoint
├── T-004  Implement JWT token issuance
├── T-005  Build password reset flow
├── T-006  Email verification on signup
├── T-007  Rate limiting on auth endpoints
├── T-008  Session management
├── T-009  OAuth integration (Google)
├── T-010  OAuth integration (GitHub)
├── T-011  Admin user management UI
└── T-012  Auth audit log
```

Right now, all 12 Tasks live flat in the Epic. There is no way to say:
- "Tasks 1–4 together constitute the core auth capability — when those are done, the app is functional"
- "Tasks 5–8 are the hardening layer — they come after core auth"
- "Tasks 9–12 are the OAuth and admin expansion — optional for MVP"

Without the Feature layer, the agent works Task by Task with no intermediate milestone inside the Epic. The human has no way to review a meaningful deliverable until the entire Epic is done. And if the Epic needs to be split across two planning periods, there is no natural cut point.

With Features:

```
Epic: User Authentication
├── Feature: Core Auth (F-001)
│   ├── S-001  Set up auth database schema
│   ├── S-002  Build registration endpoint
│   ├── S-003  Build login endpoint
│   └── S-004  Implement JWT token issuance
├── Feature: Auth Hardening (F-002)
│   ├── S-005  Build password reset flow
│   ├── S-006  Email verification on signup
│   ├── S-007  Rate limiting on auth endpoints
│   └── S-008  Session management
└── Feature: Extended Auth (F-003)
    ├── S-009  OAuth integration (Google)
    ├── S-010  OAuth integration (GitHub)
    ├── S-011  Admin user management UI
    └── S-012  Auth audit log
```

Now F-001 is a shippable increment. When it is done, the system is functional for the core use case. F-002 is the next logical step. F-003 is explicitly the expansion layer. The human can review F-001 as a unit. The agent has a clear intermediate completion target.

---

## Where Feature Sits in the Hierarchy

```
Project
└── Milestone
    └── Epic
        └── Feature  ← NEW (optional)
            └── Story  (currently Task)
                └── Task  (currently Subtask)
```

**The Feature layer is optional, not mandatory.** A Story that belongs to a small Epic with only 3–4 Stories can link directly to the Epic. The framework supports both patterns:

- `Story.Epic` — direct link, no Feature (small Epic, few Stories)
- `Story.Feature` → `Feature.Epic` — through a Feature (larger Epic, logical groupings)

A Story can only have one parent — either an Epic directly or a Feature. Not both.

---

## The Feature Entity — Proposed Fields

### Identity
- **ID** — `F-` prefix. e.g. `F-001`. Stable, unique across the project.
- **Name** — Short descriptive label. "Core Auth", "Auth Hardening", "Dashboard Filters". Not a sentence — a label. 3–5 words.
- **Type** — `Business` or `Enabler`. Business Features deliver something user-visible. Enabler Features build technical foundations (infrastructure, refactoring, tooling) that future Business Features depend on. Mirrors the Story Type distinction.

### Scope
- **Epic** — which Epic this Feature belongs to. A Feature belongs to exactly one Epic.
- **Description** — 2–4 sentences: what does this Feature deliver as a unit? What is the user-visible or system-level outcome when all its Stories are done? Written to be readable in isolation.
- **Scope — In** — what is explicitly included. Bullet list.
- **Scope — Out** — what is explicitly excluded. What does the next Feature pick up that this one stops short of?
- **Acceptance Criteria** — observable conditions that define this Feature as complete. Same standard as Epic Acceptance Criteria — agent-verifiable, yes/no. A Feature's AC sits between Epic-level AC (broad) and Story-level AC (specific). It answers: "is the user-visible capability fully working as a unit?"

### Scheduling and Priority
- **Status** — `pending` / `active` / `complete` / `abandoned`
- **Priority** — relative priority within the Epic. Determines which Feature the agent works first when multiple are pending. `Critical` / `High` / `Medium` / `Low`.
- **Milestone** — inherited from the parent Epic by default. Overridable if a Feature needs to be explicitly associated with a different Milestone (e.g. an Epic spans two Milestones and different Features target different ones).
- **Feature Dependencies** — which other Features this Feature depends on, within or across Epics. Same hard/soft distinction as Epic Dependencies. A Feature cannot become Active until its hard Feature Dependencies are complete.

### Stories
- **Stories** — the ordered list of Story IDs that belong to this Feature. Stories within a Feature are prioritised and sequenced the same way they currently are within an Epic — by Priority field and Dependency rules.

### Completion
- **Feature Completion Record** — written when Status reaches `complete`. Contains:
  - Completed At
  - Acceptance Criteria results (each criterion and verification result)
  - Stories completed vs cancelled
  - Total Active AI Time (sum of Work Intervals across all Stories in this Feature)
  - Total Estimated Cost
  - Scope delta (what changed from the original Feature definition)
  - Learnings (feeds back to Epic Notes/Learnings)

---

## How Features Fit Into Each Phase

### Phase 2 — Planning (where Features are introduced)

Currently Phase 2 produces: Epics, Milestones, Goal-to-Epic mapping.

**With Features, Phase 2 also produces an initial Feature structure for each Epic.**

The agent proposes Features for each Epic during Phase 2 planning — not the full Story breakdown (that is Phase 3) but the logical groupings within each Epic. This is a lightweight exercise:
- For each Epic, the agent identifies 2–5 natural sub-groupings
- Each grouping becomes a proposed Feature with a Name, Type (Business/Enabler), and a one-sentence Description
- Feature Dependencies between them (within the Epic) are identified
- The human confirms, adjusts, or collapses Features for small Epics

This adds one step to Phase 2 planning per Epic, but it produces something valuable: the human and agent agree on what a "shippable chunk" looks like within each Epic before decomposition begins.

**For small Epics** (the agent judges this during Phase 2 by scope): no Features are created. Stories link directly to the Epic. The agent notes "Epic E-02 is small enough to work without the Feature layer."

### Phase 3 — Decomposition (where Stories are assigned to Features)

Currently Phase 3 produces Stories per Epic.

**With Features, Phase 3 decomposes each Feature into Stories**, not each Epic directly into Stories.

The process is the same but scoped to Feature level:
- For each Feature: identify Stories, research each one, populate Context + Research Date + Acceptance Criteria + Affected Files + Tasks
- Story IDs reference their parent Feature: `S-001` belongs to `F-001` which belongs to `E-001`
- Feature Acceptance Criteria are validated against the resulting Story set — does the Stories collectively meet the Feature AC? If not, a Story is missing.

### Phase 4 — Implementation

Task selection logic gains one level:

1. Find the highest-priority Epic with satisfied Epic Dependencies
2. Within that Epic, find the highest-priority Feature with satisfied Feature Dependencies
3. Within that Feature, find the highest-priority Story with satisfied Story Dependencies and no unresolved Impediments
4. Load that Story fully and begin

Feature completion is triggered when all its Stories are Done — same pattern as Epic completion. A Feature Completion Record is written. The agent evaluates the Feature's Acceptance Criteria. The human reviews it as a unit. This is the "Sprint Review" moment that is currently missing from the framework.

---

## Feature Completion as the Sprint Review Substitute

This is the most valuable thing the Feature layer introduces.

Currently there is no natural point within Phase 4 where the human reviews a meaningful delivery increment. Individual Stories go through review (four outcomes: Approved / Accepted with Notes / Minor Revision / Significant Rework) but the human never gets to step back and assess "did this chunk of work deliver what we expected?"

**Feature completion is that moment.**

When a Feature's last Story is Done:
1. The agent evaluates the Feature's Acceptance Criteria
2. The agent writes a draft Feature Completion Record
3. The human reviews the Feature as a whole — not Story by Story, but the delivered capability as a unit
4. The human confirms or flags issues at the Feature level

This gives the human a regular, meaningful review rhythm without requiring ceremony. Features complete when they complete — not on a fixed schedule. But each completion is a real deliverable, not a process step.

---

## Feature Dependencies — Across Epics

Feature Dependencies can cross Epic boundaries. This is important.

Example: Epic E-02 (Item Filtering) has a Feature F-007 (Filter Persistence). Filter Persistence depends on F-003 (Data Layer), which belongs to Epic E-01. That cross-Epic dependency is currently only capturable as an Epic Dependency (E-02 depends on E-01). With Feature Dependencies, it can be more precise: F-007 depends on F-003 — the rest of E-02 can start as soon as E-01's Data Layer Feature is done, without waiting for all of E-01 to complete.

**This makes Epic Dependencies less blunt.** Many current hard Epic Dependencies would become soft Epic Dependencies with precise Feature Dependencies underneath — unlocking work earlier.

---

## What Changes in Existing Entities

### Story (currently Task)
One field change:
- `Epic` field becomes `Parent` — points to either a Feature ID or an Epic ID
- The agent resolves the parent chain to determine which Epic a Story ultimately belongs to

No other Story fields change.

### Epic
One addition:
- `Features` — list of Feature IDs belonging to this Epic (empty for small Epics without the Feature layer)
- `Tasks` field remains but becomes the fallback for Epics without Features — it lists Stories that link directly to the Epic

### Phase 2 Output Checklist (Phase Gate Record)
New item added:
- `[ ]` Feature groupings proposed and confirmed for each Epic (or Epic explicitly noted as Feature-free)

### Phase 3 Output Checklist
Updated item:
- `[ ]` All Stories for all Features defined and reviewed (not "all Tasks for all Epics")

### Reference.md — Task Selection Logic
Updated to include Feature layer in the selection sequence.

---

## ID Scheme

| Entity | Prefix | Example | Scoping |
|--------|--------|---------|---------|
| Epic | `E-` | `E-04` | Project-scoped |
| Feature | `F-` | `F-012` | Project-scoped |
| Story | `S-` | `S-023` | Project-scoped |
| Task | `T-` | `T-023-1` | Scoped under Story |

Feature IDs are project-scoped (not scoped under an Epic) so they can be referenced in cross-Epic Feature Dependencies without ambiguity.

---

## What Does Not Change

- Epic fields, Epic Completion process, Epic Completion Record — unchanged
- Story fields — unchanged except the `Epic` → `Parent` rename
- Task (Subtask) — unchanged
- Pattern Contracts and Pattern Dependencies — unchanged, still live at Story level
- Work Intervals — unchanged, still recorded per Story
- All other entities — unchanged

---

## When to Use Features, When to Skip

The agent makes this call during Phase 2 based on Epic scope:

| Epic size | Recommendation |
|-----------|---------------|
| 1–4 Stories | Skip Features. Stories link directly to Epic. |
| 5–9 Stories | Features optional. Use if there are natural groupings; skip if it all flows as one unit. |
| 10+ Stories | Features strongly recommended. The Epic is too large to work without intermediate structure. |

The human can always override — some 10-Story Epics are genuinely linear and don't benefit from grouping; some 4-Story Epics have two clearly distinct deliverables that should be reviewed separately.

---

## Summary

| Aspect | Current | With Feature Layer |
|--------|---------|-------------------|
| Hierarchy | Epic → Story → Task | Epic → Feature → Story → Task |
| Intermediate completion | None within an Epic | Feature Completion Record + AC evaluation |
| Human review rhythm | Per Story (granular) | Per Feature (meaningful delivery unit) |
| Dependency precision | Epic-level (blunt) | Feature-level (precise cross-Epic unlocking) |
| Phase 2 output | Epics + Milestones | Epics + Features + Milestones |
| Phase 3 scope | Per Epic | Per Feature |
| Sprint Review equivalent | Missing | Feature Completion event |
| Mandatory | N/A | No — optional per Epic based on size |

**One line:** A Feature is the unit of work you can show someone and say "this is done" — bigger than a Story, smaller than an Epic, and the natural rhythm point for review, cost tracking, and delivery confidence.
