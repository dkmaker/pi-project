# Entities: Milestone & Epic

---

## Entity: Milestone

A **Milestone** is a meaningful checkpoint in the project timeline. It represents a state the project has reached, not a unit of work to be done. Milestones answer: *are we making progress toward something shippable or demonstrable?*

Milestones are coarse-grained and relatively stable. A project might have 3–8 milestones total. They are not sprints — they don't have fixed durations by default.

**A Milestone consists of:**

- **Name** — short label, e.g. "MVP", "Beta", "Public Launch"
- **Description** — what state the project is in when this milestone is reached. Written as a present-tense description: "The app is deployed, users can create accounts, and the core workflow is functional end-to-end."
- **Exit Criteria** — a checklist of conditions that must all be true for the milestone to be considered reached. These are observable facts, not tasks. They are the milestone's definition of done.
- **Target Date** — an approximate date or time horizon. Can be a range or quarter. Not a hard deadline unless the project has one.
- **Status** — pending / active / reached / abandoned
- **Associated Epics** — which epics must be complete (or sufficiently complete) to reach this milestone. This is the structural link between milestones and work.
- **Notes** — retrospective notes once reached: what slipped, what was cut, what changed.

**Relationship:** A Milestone does not *contain* Epics. It *references* them. Epics are defined independently and tagged to a Milestone.

---

## Entity: Epic

An **Epic** is a cohesive area of functionality — a meaningful feature or capability that requires multiple tasks to build. It is the unit of *intent* at the feature level.

An Epic answers: *what capability are we building, and what does it mean for that capability to be complete?*

Epics are stable enough to plan around but not permanent. A project might have 5–20 epics over its lifetime. An epic should be small enough that it's completable in a few weeks of focused work.

**An Epic consists of:**

- **Name** — short, descriptive. "User Authentication", "Item Filtering", "Email Notifications"
- **Description** — 2–5 sentences explaining what this epic is about, what user need it addresses, and why it exists. This is the "why" for everyone who works on tasks within it.
- **Scope — In** — what is explicitly included in this epic. Bullet list of capabilities.
- **Scope — Out** — what is explicitly excluded. This prevents tasks from growing unboundedly and clarifies where adjacent epics begin.
- **Milestone** — which milestone this epic contributes to.
- **Goals** — which project-level goals this epic advances.
- **Acceptance Criteria** — the observable conditions that define this epic as complete. Written from the perspective of the user or system, not as implementation tasks. An AI agent reviewing these should be able to determine if the epic is done or not.
- **Status** — pending / active / complete / abandoned
- **Tasks** — the list of tasks that implement this epic (defined separately, referenced here).
- **Notes / Learnings** — running notes on decisions made, scope changes, surprises encountered. This becomes valuable context for future epics in the same area.

**Relationship:** An Epic *contains* Tasks (as references). A Task belongs to exactly one Epic. An Epic belongs to one Milestone.
