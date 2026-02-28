# Project Lifecycle: The Four Phases

Before any implementation happens, a project goes through three structured phases that populate the entity model from scratch. Each phase has a clear entry condition, a defined output, a Phase Completion Record that gates the transition, and ends with a deliberate context reset before the next phase begins.

The context reset is not a technical detail — it is a first-class part of the process. By the time implementation starts, the agent's context contains only structured, validated knowledge — not the conversational residue of how that knowledge was gathered.

```
Phase 1: Project Interview     → Project entity + Project Resources
         [Phase Completion Record → gate check]
         [context reset]
Phase 2: Epic & Milestone Plan → Epics + Milestones + Goals structure
         [Phase Completion Record → gate check]
         [context reset]
Phase 3: Task Research         → Tasks + Subtasks + Dependencies + Pattern Contracts
         [Phase Completion Record → gate check]
         [context reset]
Phase 4: Implementation        → Work, tracked against the populated entity model
```

---

## Phase 1: Project Interview

### Purpose
Capture the human's intent and transform it from raw thought into structured, validated project entities. The output of this phase is a fully populated Project entity, all Project Resources, and a set of open Questions for anything that couldn't be resolved during the interview.

### Why an interview, not a form
A form produces shallow answers because humans fill in what the form asks for. A conversation surfaces what the human actually means — the interviewer can follow up on vague answers, challenge assumptions, notice contradictions, and ask "why" until the real requirement emerges. The AI is a better interviewer than a form because it understands context and can adapt its questions based on what it's heard.

### Greenfield vs. Existing Codebase

**The interview has two variants depending on whether the project starts from scratch or from an existing codebase.** The human's answer to the opening question determines which variant applies.

#### Greenfield variant (standard)
Follow the interview process described below in full.

#### Existing codebase variant (Onboarding)
If the human indicates they already have code, the interview is extended with an **onboarding phase** before proceeding to normal interview flow:

1. **Codebase ingestion.** The agent reads or receives a description of the existing codebase structure. It reverse-engineers a draft Repository Map, Tech Stack Entries (using the versions already in use, not ideal versions), and draft Conventions from the existing patterns. This produces a starting draft, not a final set — everything is provisional until confirmed by the human.

2. **Existing decisions surfaced.** Implicit decisions already baked into the codebase are surfaced as Decision records: "The existing code uses the repository pattern for database access — we are retaining this by convention." This makes previously invisible decisions visible and revisitable.

3. **Existing Pattern Contracts identified.** If the codebase has established interfaces or patterns that new work must conform to, these become Pattern Contracts declared on a designated "existing codebase" baseline entity. Downstream tasks can declare Pattern Dependencies on them.

4. **Technical debt as Risks.** Existing known problems or architectural weaknesses in the codebase are recorded as Risk entities (see [risk.md](risk.md)), not as Tasks to fix immediately. They are tracked, not assumed away.

5. **Conflict check.** The agent's validation pass (see below) must additionally check: do any existing patterns conflict with the project's stated Goals or Constraints? Any conflicts become Questions for the human to resolve before Phase 2 begins. A conflict left unresolved here will surface as a Blocker in Phase 4 — the earlier it is named, the cheaper it is to resolve.

6. **Return to standard flow.** Once the onboarding additions are made, the interview continues with the standard iterative narrowing, validation pass, and entity creation flow.

### The interview process

**Opening:** The AI starts with a single open question, not a list: *"Tell me what you want to build."* The human answers as loosely or precisely as they want. Everything else follows from that answer. This matters — starting with a list of fields to fill in produces a list of answers. Starting with an open question produces a narrative that contains far more signal.

**Iterative narrowing:** After the opening answer, the AI identifies the most important gap in its understanding and asks about that — one question at a time. Not five questions at once. Each answer informs the next question. The interview feels like a conversation, not a questionnaire. The AI continues until it can answer all of the following without ambiguity:
- What does this do and who uses it?
- What are the 3–5 outcomes that define success?
- What is explicitly out of scope?
- What are the hard constraints (technical, time, resource)?
- What technologies does the human want to use, and why?
- What does the human already have (existing code, services, accounts)?
- What is the target environment (web, mobile, API, CLI, etc.)?

**Web search during the interview:** When the human mentions a technology, library, or approach, the AI uses web search on the fly to:
- Confirm the current stable version and flag if the human mentioned an outdated one
- Pull the canonical documentation URL for the Tech Stack Entry
- Surface known gotchas or limitations relevant to the project's goals
- Identify whether there are better-suited alternatives the human may not be aware of — these are surfaced as Questions, not overrides

The human stays in control of all technology decisions. Web search informs, it does not decide. If research surfaces a meaningful alternative, the AI presents it as: *"I found that X is commonly used for this, which you mentioned, but Y has become the standard since version Z because of [reason]. Want to stick with X or consider Y?"* The human answers; the AI records the decision and rationale.

**Validation pass:** Before ending the interview, the AI reads back a structured summary of everything it has captured and challenges it:
- Do the goals conflict with each other?
- Does anything in the tech stack contradict the constraints?
- Are any goals likely unachievable given the stated constraints?
- Are there dependencies between goals that imply a specific milestone order?
- Is anything obviously missing — auth, storage, deployment, error handling — that hasn't been mentioned?

The human confirms, corrects, or adds. This is not a sign-off ceremony — it is a genuine challenge pass. The AI should surface real concerns, not just confirm what it heard.

**Infeasibility exit:** If the validation pass reveals that the project cannot be built as stated — constraints rule out all viable approaches, goals conflict irreconcilably, budget or time prohibits the stated scope — Phase 1 does not proceed to entity creation. Instead, an **Infeasibility Finding** is produced:
- The specific conflict is named (which Constraint contradicts which Goal, or which Goals conflict with each other)
- The options available are enumerated: relax Constraint X, drop Goal Y, reduce scope to Z
- The human is asked explicitly: revise the project definition, accept reduced scope, or stop?
- Human response determines next step:
  - *Revise* — Phase 1 continues with updated entities
  - *Reduced scope* — accepted via a Scope Change on the Goal or Constraint (see [change-management.md](change-management.md))
  - *Stop* — Project Status is set to `abandoned`, the Infeasibility Finding is recorded as the Project Completion Record, and the process ends. The work done in Phase 1 is not lost — it is documented analysis.

**Entity creation:** As the interview progresses, the AI creates entities in real time using tool calls — not after the interview ends. When a goal is agreed on, it is written. When a tech stack entry is confirmed with its docs URL and project notes, it is written. When a constraint is stated, it is written. When a decision is made about an approach, a Decision record is created. When something cannot be resolved, a Question is created. By the end of the interview the entity model is populated, not waiting to be populated.

**Interview ends when:** The AI can produce a complete, internally consistent Project entity and all Project Resources with no unresolved contradictions. Open Questions are acceptable and expected — they are captured, not resolved by force.

### Output of Phase 1
- Project entity: Name, Vision, Goals (each with Statement and Contributing Epics placeholder), Non-Goals, Constraints, Repository Map
- All Project Resources: Tech Stack Entries (with versions and docs), Rules, Conventions, Shared Documentation References
- Initial set of Decisions (technology choices with rationale)
- Initial set of Questions (anything unresolved)
- Risk Register initialized (any risks surfaced during interview, especially for existing codebases)
- Phase Completion Record written (see Phase Completion Records below)
- Session Log updated as Phase 1 complete

### Context reset after Phase 1
The interview conversation is no longer useful. The signal has been extracted into structured files. A context reset means the next phase starts with a fresh agent context that reads the structured output of Phase 1, not the conversation that produced it.

---

## Phase 2: Epic & Milestone Planning

### Purpose
Define the high-level structure of the work: which major feature areas need to exist (Epics), what the meaningful checkpoints are (Milestones), how Goals map to Epics, and which Epics depend on which. This phase is strategic — it answers "what are we building in what order" without yet asking "how."

### Why a separate phase
Epics and Milestones require holistic thinking across the whole project. If you try to plan them while simultaneously decomposing tasks, you make local decisions that compromise the global structure. This phase is deliberately high-altitude — no implementation details, no file paths, no subtasks.

### The planning process

**Entry:** The agent reads the Phase 1 Completion Record (gate status must be `passed`). It then reads the Project entity and all Resources. It does not have the interview conversation in context — only the structured result.

**Epic proposal:** The agent proposes an initial Epic structure based on the Goals and the tech stack. Each proposed Epic covers a coherent functional area. The agent presents these to the human for review — not as a finished plan but as a starting point. The agent explains the rationale for its proposed groupings: why these boundaries, what would break if this epic were merged with another.

**Infrastructure Epics:** The agent explicitly identifies whether any necessary work (CI/CD, test infrastructure, security hardening) does not map to a Goal. If so, it proposes Infrastructure Epics and links them to the Constraints or Rules they serve (see [planning.md](planning.md)). Infrastructure Epics are not optional — if the work must be done, it must be planned.

**Scope definition per Epic:** For each agreed Epic, the agent works with the human to define Scope-In and Scope-Out explicitly. The agent actively challenges vague scope statements.

**Epic Dependencies:** The agent identifies sequencing constraints between Epics and defines Epic Dependency entities (hard or soft, with Gate Conditions where appropriate). If auth must precede user data, that is a hard Epic Dependency — not a verbal understanding.

**Milestone definition:** The agent identifies natural checkpoints and proposes Milestones as outcome states with Exit Criteria — observable facts, not tasks. Human confirms or adjusts.

**Web search during planning:** The agent validates the Epic structure against known patterns for this type of project, surfacing sequencing risks early.

**Goal-to-Epic mapping:** Each Goal is traced to the Epics that fulfil it. If a Goal has no Epics covering it, that is surfaced as a gap. If an Epic has no Goal it advances (and is not an Infrastructure Epic with a Constraint link), that is a scope-creep signal.

### Output of Phase 2
All Epics with Name, Description, Scope-In, Scope-Out, contributing Goals (or Constraint link for Infrastructure), Epic Dependencies, and assigned Milestone. All Milestones with Name, Description, Exit Criteria, and associated Epics. Risk Register updated with any planning-phase risks. Phase Completion Record written. Session Log updated as Phase 2 complete.

### Context reset after Phase 2
Same reasoning as Phase 1. Phase 3 starts with a fresh agent that reads the structured Epic and Milestone definitions.

---

## Phase 3: Task Research & Decomposition

### Purpose
For each Epic, decompose the work into Tasks and Subtasks with full context, define all Pattern Contracts and Dependencies, research the specific technical approach for each task, and produce a task graph that is ready to execute without further investigation.

The output of this phase is the complete task model. When Phase 3 ends, the agent in Phase 4 should be able to pick up any task and execute it without needing to research, decide, or clarify — everything is already in the task's Context field.

### The decomposition process

**Entry:** The agent reads the Phase 2 Completion Record (gate status must be `passed`). It then reads all Epic and Milestone entities.

**One Epic at a time:** The agent works through Epics in their planned order (respecting Epic Dependencies), fully decomposing each one before moving to the next.

**Task identification:** For each Epic, the agent identifies discrete units of work and proposes the task list to the human.

**Research per task:** For each confirmed task, the agent researches the specific approach. The research findings go directly into the task's Context field with a **Research Date** recorded. If research reveals the planned approach is wrong or outdated, the task is updated before it is finalised.

**Pattern Contracts:** When a task establishes an interface, data structure, or pattern that downstream tasks will rely on, a Pattern Contract is defined. Status is set to `draft` — it moves to `established` when the task completes in Phase 4.

**Dependency mapping:** Hard and soft Dependencies are distinguished. If the dependency graph reveals a sequencing problem, it is resolved before Phase 3 ends.

**Verification planning:** For tasks involving external integrations, security-sensitive code, or any approach flagged as requiring validation, a Verification record is pre-populated with Type and Source (Attempts list starts empty). This means the executing agent knows it needs to verify.

**Risk identification:** Phase 3 research is the richest source of Risks. Every web search that surfaces a library limitation, integration gotcha, performance concern, or security consideration should result in a Risk record (see [risk.md](risk.md)), not a buried note in Task Context.

**Subtask breakdown:** Each task gets its ordered Subtask list — concrete, imperative steps fine-grained enough to resume mid-task.

**Acceptance Criteria:** Written last, after research is done — so they reflect actual implementation requirements, not assumptions.

### Output of Phase 3
Complete task graph for all Epics. All tasks have: Goal, Context (with Research Date), Acceptance Criteria, Affected Files, Subtasks, Delegation level, Pattern Contracts/Dependencies, pre-populated Verifications. All Dependencies mapped. All Epic Dependencies confirmed. Risk Register updated. All Questions from decomposition resolved or recorded. Phase Completion Record written. Session Log updated as Phase 3 complete.

### Context reset after Phase 3
The decomposition conversation is discarded. Phase 4 starts with a clean agent context loading the structured task model.

---

## Phase 4: Implementation

### Purpose
Execute the task graph. This phase has the most structured support from the entity model — every task is a complete brief, every dependency is mapped, every pattern contract is declared, every verification is pre-planned. The agent's job is execution and honest reporting, not discovery.

### Phase 4 Bootstrap (First Session)

The transition from Phase 3 to Phase 4 is a defined sequence, not an implied continuation. The first Phase 4 session follows this exact bootstrap protocol:

1. **Read the Phase 3 Completion Record.** Confirm gate status is `passed`. If not passed, Phase 4 cannot begin — surface the specific failed output checklist items to the human and return to Phase 3.

2. **Read the most recent Session Log entry.** Confirm Phase 3 is marked complete and there is no Active Task already (confirming this is the first Phase 4 session, not a resume).

3. **Read the Project entity** (Project, Goals, Constraints) for orientation. Not the full task graph — just the top-level intent. This takes 30 seconds and prevents the agent from operating without understanding what it's building.

4. **Read all Epic entities.** Get the task table for each Epic. Identify which Epics are Active vs Pending. Note all Epic Dependencies and their satisfaction status.

5. **Select the first Task.** Criteria in order:
   - Highest-priority Pending Task
   - In the earliest Epic whose hard Epic Dependencies are all satisfied
   - With no unresolved Blockers
   - With no `⚠️ Needs Review` status
   - With all hard Task Dependencies satisfied

6. **Load the selected Task fully.** Read: Context (and resolve all Project Resource references), Subtasks, Pattern Dependencies (and their source Pattern Contracts at current version), Affected Files, pre-populated Verification records.

7. **Check for Context staleness.** Compare the Task's Research Date against the current date and against any Tech Stack version changes since that date. If the Research Date is older than 60 days, or if a referenced Tech Stack Entry has been updated since the Research Date, flag the Context as potentially stale. Create a Research-type Verification attempt before proceeding, confirming the approach is still valid. If it is, proceed. If not, pause and update the Task Context before execution.

8. **Create the first Phase 4 Session Log entry.** Active Task: the selected Task ID. Exact State: "Beginning Phase 4, starting with [Task ID]: [Task Name]."

9. **Begin execution.**

**Resuming Phase 4 (subsequent sessions):** Do not run the bootstrap protocol again. Instead: read the most recent Session Log entry, find the Active Task (or Active Task Set), read the Exact State, and resume from that point. The distinction between first session and subsequent sessions is explicit — they have different entry sequences.

### The implementation loop

**Task selection:** The agent reads the Session Log to find the active task, or reads the Epic task tables to find the highest-priority Pending task with no unresolved blockers, no `⚠️ Needs Review` status, and all hard Dependencies and Epic Dependencies satisfied.

**Context load:** The agent reads the task file fully before writing a single line of code. It resolves all Project Resource references. It reads any Pattern Contracts it depends on to confirm the current version matches its Pattern Dependencies.

**Execution:** The agent implements the task per its Subtask list, checking off each subtask as it completes. Work Intervals are recorded automatically by the extension. If the agent encounters something that changes the scope, approach, or affects a Pattern Contract, it stops and surfaces this rather than proceeding.

**Verification:** Tasks with pre-planned Verifications are verified before being marked Done. The agent records the result as a Verification Attempt. If the result is `failed`, the Verification Failure Recovery Loop applies (see [verification.md](verification.md)).

**Completion:** The agent calls the completion tool, which writes the Completion Record, aggregates the Work Log, and updates the task status to `👀 In Review`. The Session Log is updated. Pattern Contracts established by this task are set to `established` status.

**Review propagation:** If the implementation changed a Pattern Contract, the downstream tasks are flagged `⚠️ Needs Review` with the version diff populated. The Session Log records the Pending Reviews.

**Human oversight:** After each task (or batch of tasks, depending on the human's preference), the human reviews the Completion Record. The four defined outcomes (Approved / Accepted with Notes / Minor Revision / Significant Rework) are defined in [reference.md](reference.md).

### Task Addition Process (Unplanned Task Discovery)

During Phase 4, an agent may discover that a necessary Task was not identified during Phase 3. This is a predictable, normal Phase 4 occurrence — not a framework failure. The defined process:

1. **Stop current task.** The agent pauses the active task before the gap causes it to proceed with incomplete foundations. The task's current Subtask state is preserved in the Session Log Exact State.

2. **Surface the gap.** The agent describes what work was found missing: what it is, why it is necessary, and which Epic and Goal it maps to (if it does). If it doesn't map to any existing Epic or Goal, a Change Request is required before proceeding (see [change-management.md](change-management.md)).

3. **Human confirms scope.** A Question is created: "Is [described work] in scope and should it be added as a Task to Epic X?" The human's answer is required before the Task is created. The answer is recorded as a Decision.

4. **Create the Task.** If confirmed in scope: the agent creates a complete Task entity — not a shortcut. All fields are populated: Context (with fresh research), Acceptance Criteria, Affected Files, Subtasks, Delegation level, any Pattern Contracts or Dependencies. This is the Phase 3 standard applied to a single new task.

5. **Wire Dependencies.** The new Task's Dependencies are connected to the existing graph: what does it require, what does it enable? If the new Task should logically precede the currently-paused task, the paused task receives a Blocker of type Dependency pointing to the new Task.

6. **Record why it was missed.** A Decision record is created: why this task was not discovered in Phase 3. This is a calibration record for future decompositions, not a blame record.

7. **Resume.** Once the new Task is created and positioned in the graph, the agent resumes the paused Task (if the new Task doesn't block it) or works the new Task first (if it does).

---

## Phase Completion Records

A **Phase Completion Record** is a specialized Session Log entry created as the final act of each phase. It is the gate that the next phase's agent reads before loading anything else. If the gate is not passed, the phase is not done — regardless of what the Session Log notes say.

### A Phase Completion Record consists of

- **Phase number and name**
- **Entry type** — Phase Completion Record (distinct from ordinary Session Log entries)
- **Completion timestamp**
- **Output checklist** — an explicit enumeration of what this phase was required to produce, with a confirmation status for each item:

  **Phase 1 checklist:**
  - [ ] Project entity: Name, Vision, Goals (all with Statements), Non-Goals, Constraints, Repository Map
  - [ ] All Goals have Contributing Epic placeholders (or are noted as awaiting Phase 2)
  - [ ] All Tech Stack Entries: Name, Category, Version, Purpose, Documentation URL recorded
  - [ ] All Rules and Conventions documented
  - [ ] All Decisions from interview recorded with rationale
  - [ ] All unresolved issues captured as Questions (not suppressed)
  - [ ] Risk Register initialized (even if empty)

  **Phase 2 checklist:**
  - [ ] All Epics: Name, Description, Scope-In, Scope-Out, Milestone, Goals (or Constraint link for Infrastructure Epics)
  - [ ] All Epic Dependencies defined (hard/soft, Gate Conditions where applicable)
  - [ ] All Milestones: Name, Description, Exit Criteria, Associated Epics
  - [ ] Every Goal maps to at least one Contributing Epic
  - [ ] Every Epic (non-Infrastructure) maps to at least one Goal
  - [ ] Every Infrastructure Epic links to at least one Constraint or Project Resource
  - [ ] No Epic without Scope-In and Scope-Out
  - [ ] Risk Register updated with any planning risks

  **Phase 3 checklist:**
  - [ ] All Tasks for all Epics defined and reviewed by human
  - [ ] Every Task has: Goal, Context (with Research Date), Acceptance Criteria, Affected Files, Subtasks, Delegation level
  - [ ] No Task has an empty Context field
  - [ ] All hard Dependencies mapped and sequencing verified
  - [ ] All Pattern Contracts declared with initial Definition
  - [ ] All Pattern Dependencies declared on consuming Tasks with Locked Version
  - [ ] Pre-populated Verification records for all high-risk Tasks
  - [ ] All Questions from decomposition resolved or recorded
  - [ ] Risk Register updated with all research-phase risks

- **Open Questions** — which Questions remain open at phase end. Not a failure — expected. Listed explicitly.
- **Entry condition for next phase** — the specific condition stated above for the next phase, and explicit confirmation that it is met.
- **Gate status** — **passed** / **not passed**
  - If not passed: which output checklist items failed, and what must happen before the gate opens. The phase is not complete.
  - If passed: the next phase may begin.

**The gate status is the authoritative signal.** The next phase agent reads the Phase Completion Record first. If gate status is `not passed`, the agent stops, surfaces the specific gaps to the human, and returns to the prior phase to close them. It does not proceed on the assumption that "close enough" is acceptable.

---

## Why Context Resets Between Phases Are Non-Negotiable

Each phase reset serves the same purpose: the conversation that produced the structured output is noise once the output exists. Carrying it forward contaminates the agent's context with provisional thinking, rejected ideas, and exploratory back-and-forth that has been superseded by the decisions captured in structured files.

A Phase 4 agent that has the Phase 1 interview in its context window is a worse executor than one that starts clean with only the task file and project resources. The structured files are a better representation of project knowledge than the conversation that created them — more dense, more precise, and free of the ambiguity that conversation naturally carries.

The reset is also a quality gate. If the structured output of a phase is good enough to orient a fresh agent, the phase is done. If the fresh agent is confused or finds gaps, the phase needs more work before moving on. The reset surfaces incompleteness that would otherwise be papered over by conversational context.
