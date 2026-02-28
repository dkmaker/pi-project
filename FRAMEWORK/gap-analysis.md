# Framework Gap Analysis

A systematic review of the framework's current state against the goal: a fully defined, dead-end-free process that enables an AI agent and a human to take any project from raw idea to shipped output — with every handover, every edge case, and every failure path covered.

Gaps are grouped by severity. **Critical** means the framework has a genuine dead end — a state it can reach with no defined exit. **Structural** means a hole in the entity model or lifecycle that will cause ambiguity in practice. **Weak** means an area where the definition is incomplete enough that agents will interpret it inconsistently.

---

## Critical — Dead Ends

### 1. No Change Management Process

**The gap:** Projects change. Goals get revised, Epics get dropped, new requirements emerge mid-Phase 4. The framework handles task-level changes via Pattern Contracts (versioned, with downstream propagation). But it has no defined process for anything higher up the hierarchy: changing a Goal, adding or dropping an Epic, revising a Constraint, or a user deciding to pivot after Phase 2 is complete.

**Why it's a dead end:** If the user says "I want to add a new capability that wasn't in any Epic," or "this Goal is no longer relevant," there is nowhere to go. The framework will silently fail — the agent either makes up a process or does nothing.

**What's missing:** A **Change Request** concept — the formal entry point for any post-phase change to Goals, Epics, Milestones, or Constraints. It should define:
- What changed and why
- What entities are affected (with cascading impact analysis)
- Which phase(s) need to be partially re-run (e.g., a new Epic means Phase 3 must be run for that Epic; a changed Constraint may require Phase 2 revisit)
- Which Tasks are now Needs Review, Cancelled, or require new entries
- What the human must explicitly approve before the change takes effect

Without this, the framework is only defined for projects that never change — which is no project.

---

### 2. Verification Failure Has No Recovery Path

**The gap:** The Verification entity has a `failed` result status. The framework never defines what happens when a verification fails. There is no path out of a failed verification state.

**Why it's a dead end:** A task in `👀 In Review` with a failed Verification is stuck. The task can't go to `✅ Done`. It can't go back to `🔄 Active` (that's not defined). What gets rewritten — the task? A subtask? A whole new task? Nothing in the framework answers this.

**What's missing:** A defined **verification failure loop**: failed verification → task returns to Active with a Blocker record describing the failure and what needs rework → subtasks relevant to the failure are un-checked → agent executes rework → verification re-run. The Verification entity should support re-runs (a list of attempts, not a single result).

---

### 3. "Needs Review" Resolution Is Undefined

**The gap:** Pattern Contract changes flag downstream tasks `⚠️ Needs Review`. The framework describes the flagging mechanism in detail (version diffs, inline review notes). But it never defines what resolving a Needs Review looks like.

**Why it's a dead end:** An agent reading a task in `⚠️ Needs Review` knows *why* it was flagged (the version diff) but doesn't know what to *do*. Can the agent resolve it autonomously? Must the human approve? What are the possible outcomes — "nothing changed for me, proceed" or "update my Context and Acceptance Criteria"? What entity records that the review was done and what was decided?

**What's missing:** A defined **Needs Review resolution process** with explicit outcomes:
- `No impact` — the contract changed but doesn't affect this task's context or approach → task returns to Pending, Pattern Dependency review status set to `current`
- `Context update needed` — task's Context or Acceptance Criteria must be revised before proceeding → agent updates the task, human confirms, task returns to Pending
- `Significant rework` — the contract change fundamentally breaks this task's approach → task enters a mini-Phase-3 for re-decomposition
Each outcome should produce a record — who reviewed, what was decided, when.

---

### 4. Unplanned Task Discovery in Phase 4 Has No Entry Point

**The gap:** Phase 4 says: "If the agent finds itself needing to make a significant architectural decision, that is a signal Phase 3 was incomplete for that task — pause, capture the decision, update the task context before continuing." This covers decisions. It does not cover *missing tasks* — work that wasn't in Phase 3 at all but is revealed as necessary during implementation.

**Why it's a dead end:** An agent that discovers a necessary task with no entity, no Epic, no ID — has nowhere to put it. Should it create the task itself? Should it pause and call Phase 3 again? How does a new task get inserted into the existing task graph, with proper Dependencies and Pattern Contracts?

**What's missing:** A **Task Addition** process for Phase 4 — a lightweight mini-Phase-3 that can be triggered mid-implementation:
- Agent stops current task and surfaces the gap
- Human confirms the missing task is real and in scope
- Agent creates the task entity with full fields (not a shortcut — a proper brief)
- Dependencies are wired into the existing graph
- If the missing task should have come before the current task, the current task is paused with a Blocker
- A Decision record captures why this wasn't discovered in Phase 3

---

### 5. Epic Completion Is Never Defined

**The gap:** The Epic entity has Status (pending / active / complete / abandoned). There is no defined process for completing an Epic. The framework defines Task Done in detail (Completion Record, Verification, Completion tool call). Epics have nothing equivalent.

**Why it's a dead end:** When all Tasks in an Epic are Done, what happens? Does the Epic automatically become Complete? Does someone check its Acceptance Criteria? Who? The human? An agent? Is there a sign-off? What updates the Epic Status field?

**What's missing:** An **Epic Completion process**: when all Tasks in an Epic reach Done, the agent evaluates the Epic's Acceptance Criteria (observable, agent-verifiable — that's how they were written). If met, the agent flags the Epic for human review. Human confirms → Epic is marked Complete, Milestone association is noted, Notes/Learnings are written. If Acceptance Criteria are not met despite all tasks being Done, that gap must be named — new tasks, scope issue, or criteria revision.

---

### 6. Human Review Outcomes Are Undefined

**The gap:** `👀 In Review` status exists. Phase 4 mentions "human reviews the Completion Record after each task." This is described as asynchronous oversight — "the agent continues to the next task; the human reviews when ready." But the possible outcomes of a review are never defined.

**Why it's a dead end:** If a human reviews a Completion Record and finds a problem, what happens? The task is already marked Done. Does it go back to Active? Does a new task get created for rework? Is there a "rejected" status? The framework has no answer.

**What's missing:** Defined **review outcomes** for the `👀 In Review` state:
- `Approved` → status moves to `✅ Done`, review logged in Completion Record
- `Minor revision` → task returns to `🔄 Active` with specific revision notes, no new task needed
- `Significant rework` → task returns to Active or a new corrective task is created, with a Blocker record explaining what was wrong
- `Accepted with notes` → Done, but Learnings in Completion Record flag something for future tasks

---

### 7. Specialist Delegation Has No Routing Process

**The gap:** The Specialist delegation level is defined as "better handled by a different agent, tool, or model — surface to human for routing." Once surfaced, what happens? The framework doesn't say.

**Why it's a dead end:** A task with Specialist delegation stops. The human is informed. Then what? Does the task wait in Blocked status? Is it split — one Specialist sub-task, one normal task? What entity records the routing decision and the result? When the Specialist returns their output, how does it re-enter the task graph?

**What's missing:** A routing process: task moves to Blocked with a Blocker type of "Specialist routing." Human decides which agent/tool/person handles it. A Decision records the routing choice. When the routed entity returns output, it is recorded as a Verification or Attachment on the original task. Task returns to Active (or a new task is created to integrate the Specialist's output).

---

### 8. Phase Transition Has No Formal Handover Artifact

**The gap:** Each phase ends with "Session Log updated as Phase N complete." The context reset is described — discard the conversation, start fresh from the structured files. But there is no formal Phase Completion Record or Handover document that says: "Phase N is complete. Here is exactly what was produced. Here are the open Questions. Here is the entry condition for Phase N+1 and confirmation that it is met."

**Why it matters:** Without a formal handover, the context reset is informal. The Phase N+1 agent must infer that Phase N is done from the Session Log note. If Phase N output is incomplete or inconsistent, there's no gate that catches it before Phase N+1 begins. The reset becomes a quality assumption rather than a quality check.

**What's missing:** A **Phase Completion Record** entity — lightweight, created at the end of each phase. Fields: Phase number, completion timestamp, output checklist (all required entities created and internally consistent), open Questions (listed, not resolved by force), explicit confirmation that the entry condition for the next phase is met. This is the gate the next agent reads before loading anything else. If the gate is not passed, Phase N is not done.

---

## Structural — Entity and Model Gaps

### 9. No Epic-Level Dependencies

**The gap:** Tasks have formal Dependency entities (hard/soft, with sequencing logic). Epics do not. The lifecycle mentions "planned order" and "sequencing risks" during Phase 2, but there is no entity that says "Epic B cannot start until Epic A is complete (or until a specific Pattern Contract from Epic A is established)."

**Why it matters:** In practice, Epics absolutely depend on each other — auth must precede user data, a data layer must precede an API, an API must precede a frontend. These constraints exist but aren't structurally recorded. An agent selecting the next task to implement can't read "Epic 3 cannot start" — it can only read individual Task Dependencies, which may not fully capture the Epic-level gate.

**What's missing:** An **Epic Dependency** entity, analogous to Task Dependency. Fields: requires (Epic ID), enables (Epic ID), nature (hard/soft), rationale. Evaluated by agents when selecting which Epic's tasks to start next.

---

### 10. No Risk Entity

**The gap:** The framework captures Blockers (current obstacles that stop a task) and Questions (unresolved decisions). There is nothing for Risks — known potential future problems that haven't materialized yet and may not, but should be tracked and mitigated.

**Why it matters:** Risks identified during Phase 3 research ("if we use this approach, we risk X under Y conditions") currently have nowhere to live except buried in Task Context or Notes. They are invisible to the human, not escalatable, and not linked to the mitigation work that should be planned.

**What's missing:** A **Risk** entity. Fields: Description (what could go wrong), Likelihood, Impact, Affected entities (Task IDs, Epic IDs, Goals), Mitigation (what reduces the risk — may link to a Task or Decision), Status (open / mitigated / realized / accepted), Owner. Risks realized become Blockers. Risks mitigated close out. This entity is project-level, not task-level.

---

### 11. No Scope Change Entity (Distinct from Decision)

**The gap:** Decisions capture "why we chose X over Y." A Scope Change is different — it says "we are deliberately changing something that was previously decided, and here is the downstream impact." Currently there is no entity for this. Scope changes presumably become Decisions, but a Decision has no "what's affected" cascade or "what was the previous state" field.

**What's missing:** A **Scope Change** entity (or an extension of Decision for this case). Fields: what changed (reference to the entity — Goal, Epic, Constraint, Tech Stack Entry), previous state, new state, rationale, triggered by (Question ID, human decision, external event), downstream impact (list of affected Tasks, Epics, Pattern Contracts, Verifications), required actions (what must happen before work continues), human sign-off. Closely related to Change Management (Gap #1) — the Change Request produces a Scope Change on approval.

---

### 12. No Project Closure Definition

**The gap:** Individual tasks reach Done. Epics reach Complete. Milestones are Reached. "The project is done" is never formally defined. Is it when all Goals are Achieved? All Milestones Reached? All Tasks Done? Something else?

**What's missing:** A **Project Completion** definition and record. The Project entity should have Status. Its completion condition should be explicit (all Goals achieved, which requires all contributing Epics complete, which requires their Acceptance Criteria met). A Project Completion Record captures: final cost, total active AI time, estimate vs actual, what was cut vs scope, key decisions and their outcomes, learnings for next projects.

---

### 13. Goal Status Progression Is Unspecified

**The gap:** The Goal entity has status: not started / in progress / achieved. There is no defined rule for how Goal status changes. Who updates it? When? "In progress" — does that mean any Contributing Epic is Active? "Achieved" — is that when all Contributing Epics are Complete and their Acceptance Criteria are met?

**What's missing:** Explicit rules for Goal status transitions, evaluated automatically when Epic status changes. An agent completing an Epic should trigger a Goal status check: "Are all Contributing Epics now Complete? If yes, evaluate Goal Acceptance — does the observable outcome match the Goal Statement?"

---

### 14. Milestone Completion Has No Defined Process

**The gap:** Milestones have Exit Criteria (observable facts, not tasks). Milestones have Status. But the process for evaluating and marking a Milestone as Reached is undefined. Who does this? When?

**What's missing:** Milestone completion process: when all associated Epics reach Complete, the agent evaluates the Exit Criteria. Each criterion is checked (agent-verifiable) or flagged for human verification. If all pass → Milestone is marked Reached, a Milestone Review record is written (what was on time, what slipped, what was cut, actual vs estimated cost). If criteria are not met despite Epics being complete → gap is named (new task, scope issue, or criteria revision). Human confirms Milestone Reached.

---

### 15. Infrastructure / Cross-Cutting Tasks Have No Home

**The gap:** The framework requires every Task to belong to exactly one Epic, and every Epic to advance at least one Goal. But not all necessary work advances a user-facing Goal — DevOps setup, CI/CD pipelines, tooling configuration, performance optimization, security hardening. These are real tasks that need to be done but don't map cleanly to any Goal or Epic.

**What's missing:** Either a recognized **Infrastructure Epic** (a defined pattern for non-Goal-advancing work with its own rationale), or an explicit acknowledgment in the Epic entity that "supporting" epics may not have a direct Goal mapping, with rules for how they are scoped and justified (e.g., they must link to a Constraint rather than a Goal).

---

### 16. Session Log Cardinality Is Undefined

**The gap:** The framework says "the project has one active Session Log." Over a long project, there will be dozens or hundreds of sessions. Is the Session Log one ever-growing document? A rolling file with the most recent entry? A new document per session with a pointer chain?

**What's missing:** An explicit definition of Session Log cardinality and storage: is each session a new Session Log entity (with a pointer to the previous), or is it a growing log with a "current state" section at the top and history below? The cold-start behavior depends on this — an agent must know where to read.

---

## Weak — Incomplete Definitions

### 17. Interview Has No Termination Path for Infeasibility

The interview "ends when" the AI can produce a complete, consistent entity set. But what if the project is infeasible — the constraints rule out all approaches, the goals conflict irreconcilably, the budget prohibits the scope? There is no graceful exit or "infeasibility finding" path. The framework should define what happens when the interview reveals the project cannot be built as stated.

### 18. Existing Codebase Onboarding Is Not Addressed

The lifecycle assumes greenfield. Phase 1 asks "what do you already have?" but offers no process for ingesting an existing codebase. An existing project has implicit Pattern Contracts, undocumented conventions, an existing Tech Stack, and potentially years of undocumented decisions. There should be an **Onboarding variant of Phase 1** that covers reverse-engineering the entity model from existing work.

### 19. Questions Have No Aging or Escalation Mechanism

Questions can remain Open indefinitely. An Open Question that is blocking tasks but never gets resolved is an invisible blocker — it's not surfaced as a Blocker record, it doesn't change anything's status. There should be a defined relationship: an Open Question that references a Task ID and remains unresolved for N sessions (or explicitly when the Task becomes Active) should automatically generate a Blocker on that task.

### 20. Phase 3 Research Can Go Stale Before Phase 4 Executes

Research findings embedded in Task Context are static. Time passes between Phase 3 and Phase 4 execution of a given task. Library versions change, docs get updated, best practices shift. There is no mechanism to flag Task Context as potentially stale, or to trigger re-verification of Phase 3 research before execution. The Verification entity's `Stale` flag exists at the Verification level but not at the Task Context level.

### 21. The "Active Task" in Session Log Is Singular

Session Log has one Active Task pointer. A developer might legitimately have two things in flight — a Research delegation task running while waiting on a Blocker on an Implementation task. The framework should either explicitly restrict to one Active Task at a time (and explain why) or define how multiple active tasks are represented in the Session Log.

### 22. Pattern Contract "Superseded" vs "Changed" Is Not Distinguished

Pattern Contracts have both a `changed` and a `superseded` status. Changed is used when the definition updates in place (versioned history). But `superseded` — what does that mean? The contract no longer exists? Was replaced by a different contract? What happens to tasks whose Pattern Dependencies point to a superseded contract? This distinction needs a clear definition and a defined impact on downstream tasks.

### 23. Tech Stack Version Changes Mid-Project Have No Process

If a Tech Stack Entry's version must change during Phase 4 (security patch, breaking library change), this can invalidate Verifications and potentially affect Pattern Contracts. There is no defined process for updating a Tech Stack Entry and propagating the impact — which Verifications are now Stale, which tasks need review, which Pattern Contracts may need re-validation.

### 24. "Abandoned" Status Has No Required Documentation

Tasks, Epics, and Milestones can be Abandoned. The framework says Cancelled "always states why" (for Tasks), but Abandoned has no equivalent requirement. An abandoned Epic is a significant scope decision that should require: a rationale, a record of what was already done within it, what happens to its completed Tasks, whether any Goals it was the sole contributor to are now at risk, and human sign-off.

### 25. First Session of Phase 4 Has No Bootstrap Path

The Session Log is described as the cold-start anchor for Phase 4. But Phase 4 has no Session Log until its first session begins. The lifecycle defines Phase 3 ending with "Session Log updated as Phase 3 complete" — but what exactly does the Phase 4 agent read as its first action? The framework should define the Phase 4 bootstrap: read the Phase 3 Session Log note to confirm Phase 3 is done, then read the Epic task tables to select the first task. This transition should be explicit, not implied.

---

## Summary Table

| # | Gap | Severity | Category |
|---|---|---|---|
| 1 | No change management process | Critical | Lifecycle |
| 2 | Verification failure has no recovery path | Critical | Entity |
| 3 | Needs Review resolution is undefined | Critical | Process |
| 4 | Unplanned task discovery in Phase 4 | Critical | Lifecycle |
| 5 | Epic completion is never defined | Critical | Process |
| 6 | Human review outcomes are undefined | Critical | Process |
| 7 | Specialist delegation has no routing process | Critical | Entity |
| 8 | Phase transition has no formal handover artifact | Critical | Lifecycle |
| 9 | No Epic-level dependencies | Structural | Entity |
| 10 | No Risk entity | Structural | Entity |
| 11 | No Scope Change entity | Structural | Entity |
| 12 | No Project Closure definition | Structural | Lifecycle |
| 13 | Goal status progression is unspecified | Structural | Entity |
| 14 | Milestone completion has no defined process | Structural | Process |
| 15 | Infrastructure tasks have no home | Structural | Entity |
| 16 | Session Log cardinality is undefined | Structural | Entity |
| 17 | Interview has no infeasibility exit path | Weak | Lifecycle |
| 18 | Existing codebase onboarding not addressed | Weak | Lifecycle |
| 19 | Questions have no aging or escalation | Weak | Entity |
| 20 | Phase 3 research can go stale before Phase 4 | Weak | Process |
| 21 | Active Task is singular — parallel work excluded | Weak | Entity |
| 22 | Pattern Contract "superseded" vs "changed" undefined | Weak | Entity |
| 23 | Tech stack version changes mid-project undefined | Weak | Process |
| 24 | "Abandoned" status has no required documentation | Weak | Process |
| 25 | Phase 4 first session has no bootstrap path | Weak | Lifecycle |
