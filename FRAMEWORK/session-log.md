# Entities: Session Log, Decision & Question

---

## Entity: Session Log

A **Session Log** is a snapshot of the project state at the end of a working session. It is the primary mechanism for context resumption — by humans returning to a project and by AI agents starting cold.

Unlike task notes (which are specific to a task), the Session Log is a project-wide snapshot. It is not a diary. It should be written with the assumption that the reader has never seen this project before but is technically competent. Every session ends with an update.

---

## Session Log Cardinality and Storage

Each session produces a **new Session Log entry** — a self-contained record with all fields populated for that session. The Session Log is therefore an ordered collection of entries, not a single mutating document.

**The active Session Log is always the most recent entry.** Cold-start behavior reads only this entry — not the full history. The full collection serves as the project's running history and audit trail.

**Storage format:** A single file with the most recent entry at the top, separated from prior entries by a clear boundary marker (e.g., a horizontal rule and date heading). An agent reading the Session Log for cold-start reads from the top and stops at the first boundary marker — it does not need to scan the full history.

**Phase boundaries:** Each Phase Completion Record (see [lifecycle.md](lifecycle.md)) is a specialized Session Log entry that marks a phase boundary. The cold-start logic for the next phase reads the Phase Completion Record first (to confirm the prior phase passed its gate), then reads the most recent ordinary Session Log entry for the current active state.

**Cardinality rule:** There is exactly one Session Log file per project. Phase logs, decision logs, and task notes are separate entities. The Session Log is strictly the project-state snapshot.

---

## Session Log Entry Fields

### A Session Log entry consists of

- **Entry ID** — sequential identifier (e.g. SL-042). Allows cross-referencing specific sessions from Decision or Question records.
- **Timestamp** — when the session ended
- **Author** — human or agent name/identifier
- **Active Task** — the specific task being worked on, by ID. For parallel work, see Active Task Set below.
- **Exact State** — the most specific possible description of where work stopped. Not "working on the filter" but "FilterBar emits tags correctly, ItemList receives them but the filtering predicate is wrong — it uses AND instead of OR across tags. Next: fix the predicate on line 47 of ItemList.tsx." This field makes or breaks cold-start speed.
- **Completed This Session** — list of tasks or subtasks finished, by ID
- **Open Questions** — decisions that arose and were deferred, with context. Long-running open Questions (those flagged with escalation, see Question entity below) are marked distinctly.
- **Next Actions** — ordered list of what to do next, by task ID, in priority order
- **Relevant Files Right Now** — the specific files currently in flux or relevant to the active task. Not a full index — just "what should the agent open first?"
- **Git State** — branch name, last commit hash and message, uncommitted changes
- **Pending Reviews** — any tasks whose status was changed to `⚠️ Needs Review` this session (from Pattern Contract changes or scope shifts), so the human knows to review them before those tasks are started

---

## Active Task: Singular and Parallel Work

**The default is one Active Task.** A single Active Task is the primary model. Rationale: focus, cleaner status tracking, and reduced risk of incomplete context carry-over between tasks. An agent should resist adding secondary tasks to the Active Task Set unless there is a genuine, documented reason.

**When parallel work is legitimate**, the Session Log may use an **Active Task Set** — an ordered list of Task IDs with a designated primary task and secondary tasks, each with their own Exact State description.

**Restrictions on parallel work:**
- Secondary tasks in the Active Task Set may only be `Research` or `Human` delegation level. `Implement`-level tasks must be worked singularly.
- The Primary task is the task that would be worked next if only one task were active. It is listed first.
- Each task in the Active Task Set has its own Exact State entry, labeled by Task ID.
- The reason for parallel work must be stated in the Session Log Notes: e.g., "T-031 (Research) is running async while T-028 (Implement) is Blocked on Specialist Routing."

**Cold-start behavior with an Active Task Set:** The agent reads the Primary task's Exact State first, confirms the reason for parallel work, and decides whether to continue the parallel approach or resolve it (by completing the Research task or clearing the Blocker) before proceeding.

---

## Entity: Decision

A **Decision** is a recorded architectural, design, or process choice. Decisions are not work items — they are reasoning artifacts.

The value is not the decision itself but the reasoning. "We chose Zustand" tells you nothing useful six months later. "We chose Zustand over prop-drilling because filter state is consumed by three unrelated components, and we rejected Context because of re-render concerns" gives an agent the information needed to know whether to revisit it.

### A Decision consists of

- **ID** — unique identifier (e.g. D-012)
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

- **ID** — unique identifier (e.g. Q-007)
- **Description** — what needs to be resolved, with enough context to answer it without additional knowledge
- **Impact** — what is blocked or uncertain until this is resolved. References Task IDs, Epic IDs, or Risk IDs where relevant. This field drives escalation behavior (see below).
- **Options** — candidate answers, if known
- **Owner** — who is responsible for resolving this
- **Status** — open / resolved / deferred / dropped
- **Resolution** — once resolved: the answer and a reference to any resulting Decision or Scope Change
- **Session Count** — how many sessions this Question has been open. Incremented automatically at each session end if Status is still `open`.
- **Escalation Flag** — set when Session Count reaches 3 and Status is still `open`. An escalated Question appears in the Session Log's Open Questions section with a distinct marker.

---

## Question Aging and Escalation Rules

Questions may remain open across multiple sessions. However, an open Question that is blocking tasks or growing stale is an invisible problem without a mechanism to surface it.

### Automatic Blocker generation

A Question that references a Task ID in its Impact field AND that Task reaches `🔄 Active` status while the Question is still `open` must automatically generate a Blocker on that Task:
- Blocker Type: Decision
- Blocker Description: derived from the Question's Description — "Question Q-007 is unresolved: [Question Description]. This task cannot be completed until this is decided."
- Blocker Resolution Path: the Question's Owner and the Question ID. Resolving the Question resolves the Blocker.

This ensures an open Question never silently allows a Task to proceed when that Task's execution depends on the answer.

### Session count escalation

If a Question's Session Count reaches 3 with Status still `open`:
- The Escalation Flag is set
- The Question is marked distinctly in the Session Log's Open Questions section — it is not buried in the regular list
- The agent is required to surface the escalated Question to the human at the next session start: "Question Q-007 has been open for 3 sessions and has not been resolved. [Description]. Options: [Options]. It blocks [Task IDs]. Please decide or explicitly defer."

### Milestone boundary review

At each Milestone Completion check (see [planning.md](planning.md)), all open Questions are reviewed as part of the completion evaluation:
- Questions that are `open` but have no active Task Impact may remain open pending further context
- Questions that are `open` with Task Impact are escalated if not already flagged
- Questions that can be resolved given the completed Milestone's output should be resolved at this boundary — the Milestone Review Record notes which Questions were resolved by the Milestone's completion

### Deferred Questions

A Question may be set to `deferred` with a rationale and a re-evaluation trigger: "Defer until Epic 3 is complete — the approach will be clearer once the data layer is built." A deferred Question's Session Count does not increment. When the re-evaluation trigger condition is met, the Question returns to `open` status.
