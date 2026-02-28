# Entities: Session Log, Decision & Question

---

## Entity: Session Log

A **Session Log** is a snapshot of the project state at the end of a working session. It is the primary mechanism for context resumption — by humans returning to a project and by AI agents starting cold.

Unlike task notes (which are specific to a task), the Session Log is a project-wide snapshot. It is not a diary. It should be written with the assumption that the reader has never seen this project before but is technically competent. Every session ends with an update.

### A Session Log consists of

- **Timestamp** — when the session ended
- **Author** — human or agent name/identifier
- **Active Task** — the specific task being worked on, by ID. This is the answer to "what is currently being worked on" — it lives here, not in the Project entity.
- **Exact State** — the most specific possible description of where work stopped. Not "working on the filter" but "FilterBar emits tags correctly, ItemList receives them but the filtering predicate is wrong — it uses AND instead of OR across tags. Next: fix the predicate on line 47 of ItemList.tsx." This field makes or breaks cold-start speed.
- **Completed This Session** — list of tasks or subtasks finished, by ID
- **Open Questions** — decisions that arose and were deferred, with context
- **Next Actions** — ordered list of what to do next, by task ID, in priority order
- **Relevant Files Right Now** — the specific files currently in flux or relevant to the active task. Not a full index — just "what should the agent open first?"
- **Git State** — branch name, last commit hash and message, uncommitted changes
- **Pending Reviews** — any tasks whose status was changed to `⚠️ Needs Review` this session (from Pattern Contract changes or scope shifts), so the human knows to review them before those tasks are started

---

## Entity: Decision

A **Decision** is a recorded architectural, design, or process choice. Decisions are not work items — they are reasoning artifacts.

The value is not the decision itself but the reasoning. "We chose Zustand" tells you nothing useful six months later. "We chose Zustand over prop-drilling because filter state is consumed by three unrelated components, and we rejected Context because of re-render concerns" gives an agent the information needed to know whether to revisit it.

### A Decision consists of

- **Title** — short description of what was decided
- **Date** — when decided
- **Context** — what situation prompted this, what options were considered
- **Decision** — what was chosen
- **Rationale** — why this option over others
- **Consequences** — what this enables, what it forecloses, what debt it creates
- **Affected Tasks** — any tasks whose context or approach is influenced by this decision
- **Status** — active / superseded / revisited
- **Superseded By** — if overturned, which decision replaced it and why

---

## Entity: Question

A **Question** is an open decision — something that needs to be resolved but hasn't been yet. Unresolved decisions are a major source of hidden blockers.

A question is not a task. It might result in a task, a decision, a scope change, or nothing. But it must be captured so it doesn't disappear into conversation history.

### A Question consists of

- **Description** — what needs to be resolved, with enough context to answer it without additional knowledge
- **Impact** — what is blocked or uncertain until this is resolved (can reference Task IDs)
- **Options** — candidate answers, if known
- **Owner** — who is responsible for resolving this
- **Status** — open / resolved / deferred / dropped
- **Resolution** — once resolved: the answer and a reference to any resulting Decision
