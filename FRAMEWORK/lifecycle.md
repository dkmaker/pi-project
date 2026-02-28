# Project Lifecycle: The Four Phases

Before any implementation happens, a project goes through three structured phases that populate the entity model from scratch. Each phase has a clear entry condition, a defined output, and ends with a deliberate context reset before the next phase begins.

The context reset is not a technical detail — it is a first-class part of the process. By the time implementation starts, the agent's context contains only structured, validated knowledge — not the conversational residue of how that knowledge was gathered.

```
Phase 1: Project Interview     → Project entity + Project Resources
         [context reset]
Phase 2: Epic & Milestone Plan → Epics + Milestones + Goals structure
         [context reset]
Phase 3: Task Research         → Tasks + Subtasks + Dependencies + Pattern Contracts
         [context reset]
Phase 4: Implementation        → Work, tracked against the populated entity model
```

---

## Phase 1: Project Interview

### Purpose
Capture the human's intent and transform it from raw thought into structured, validated project entities. The output of this phase is a fully populated Project entity, all Project Resources, and a set of open Questions for anything that couldn't be resolved during the interview.

### Why an interview, not a form
A form produces shallow answers because humans fill in what the form asks for. A conversation surfaces what the human actually means — the interviewer can follow up on vague answers, challenge assumptions, notice contradictions, and ask "why" until the real requirement emerges. The AI is a better interviewer than a form because it understands context and can adapt its questions based on what it's heard.

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

**Entity creation:** As the interview progresses, the AI creates entities in real time using tool calls — not after the interview ends. When a goal is agreed on, it is written. When a tech stack entry is confirmed with its docs URL and project notes, it is written. When a constraint is stated, it is written. When a decision is made about an approach, a Decision record is created. When something cannot be resolved, a Question is created. By the end of the interview the entity model is populated, not waiting to be populated.

**Interview ends when:** The AI can produce a complete, internally consistent Project entity and all Project Resources with no unresolved contradictions. Open Questions are acceptable and expected — they are captured, not resolved by force.

### Output of Phase 1
- Project entity: Name, Vision, Goals, Non-Goals, Constraints, Repository Map
- All Project Resources: Tech Stack Entries (with versions and docs), Rules, Conventions, Shared Documentation References
- Initial set of Decisions (technology choices with rationale)
- Initial set of Questions (anything unresolved)
- Session Log updated as Phase 1 complete

### Context reset after Phase 1
The interview conversation — all the back-and-forth, the exploratory questions, the false starts — is no longer useful. The signal has been extracted into structured files. A context reset means the next phase starts with a fresh agent context that reads the structured output of Phase 1, not the conversation that produced it. The agent in Phase 2 reads `PROJECT.md` and Project Resources as its starting point, giving it clean, dense context rather than a long noisy conversation to reason over.

---

## Phase 2: Epic & Milestone Planning

### Purpose
Define the high-level structure of the work: which major feature areas need to exist (Epics), what the meaningful checkpoints are (Milestones), and how Goals map to Epics. This phase is strategic — it answers "what are we building in what order" without yet asking "how."

### Why a separate phase
Epics and Milestones require holistic thinking across the whole project. If you try to plan them while simultaneously decomposing tasks, you make local decisions that compromise the global structure. This phase is deliberately high-altitude — no implementation details, no file paths, no subtasks. Those come in Phase 3.

### The planning process

**Entry:** The agent reads the Phase 1 output: Project entity and all Resources. It does not have the interview conversation in context — only the structured result.

**Epic proposal:** The agent proposes an initial Epic structure based on the Goals and the tech stack. Each proposed Epic covers a coherent functional area. The agent presents these to the human for review — not as a finished plan but as a starting point. The human adds, removes, merges, or splits Epics. The agent explains the rationale for its proposed groupings: why these boundaries, what would break if this epic were merged with another.

**Scope definition per Epic:** For each agreed Epic, the agent works with the human to define Scope-In and Scope-Out explicitly. This is the most important output of this phase — clear scope boundaries prevent tasks in Phase 3 from sprawling. The agent actively challenges vague scope statements: *"You said 'notifications' is in scope for this epic — do you mean in-app, email, push, or all three? Each is a meaningful scope decision."*

**Milestone definition:** The agent identifies natural checkpoints in the Epic sequence — moments where the project is demonstrably more complete and something could be shipped or shown. It proposes Milestones as outcome states: *"After these three Epics, a user can complete the full core workflow end-to-end. That seems like a natural MVP milestone."* Milestones get Exit Criteria — observable facts, not tasks. Human confirms or adjusts.

**Web search during planning:** The agent uses web search to validate the Epic structure against known patterns for this type of project. For example: *"Projects of this type typically need an auth epic before a data epic because X — does your current ordering reflect that?"* This surfaces sequencing risks early, before tasks are defined.

**Goal-to-Epic mapping:** Each Goal is traced to the Epics that fulfil it. If a Goal has no Epics covering it, that is surfaced as a gap. If an Epic has no Goal it advances, that is a scope-creep signal.

### Output of Phase 2
All Epics with Name, Description, Scope-In, Scope-Out, contributing Goals, and assigned Milestone. All Milestones with Name, Description, Exit Criteria, and associated Epics. Session Log updated as Phase 2 complete.

### Context reset after Phase 2
Same reasoning as Phase 1. The planning conversation is noise. Phase 3 starts with a fresh agent that reads the structured Epic and Milestone definitions.

---

## Phase 3: Task Research & Decomposition

### Purpose
For each Epic, decompose the work into Tasks and Subtasks with full context, define all Pattern Contracts and Dependencies, research the specific technical approach for each task, and produce a task graph that is ready to execute without further investigation.

The output of this phase is the complete task model. When Phase 3 ends, the agent in Phase 4 should be able to pick up any task and execute it without needing to research, decide, or clarify — everything is already in the task's Context field.

### Why research during decomposition
Tasks written without research are guesses. A task that says "implement webhook signature verification" without having looked at the Stripe documentation is optimistic — the actual approach, the specific headers, the exact library methods, the gotchas around timing attacks — none of that is obvious. When an agent picks up that task in Phase 4, it has to research it then, mid-execution, with a user waiting. Phase 3 moves that research cost to a time when there's no execution pressure and the findings can be recorded durably in the task's Context field.

### The decomposition process

**One Epic at a time:** The agent works through Epics in their planned order, fully decomposing each one before moving to the next. This keeps context focused and ensures dependencies are visible — a task in Epic 3 that depends on a pattern established in Epic 1 is identifiable because Epic 1 is already decomposed.

**Task identification:** For each Epic, the agent identifies the discrete units of work — each a single focused session, each with a clear done state. It proposes the task list to the human. The human reviews for missing tasks, tasks that are too large (should be split), or tasks that shouldn't exist given the scope boundaries.

**Research per task:** For each confirmed task, the agent researches the specific approach:
- Web search for the relevant documentation, current best practice, known issues
- The research findings go directly into the task's Context field — not as a separate note, embedded as the working knowledge the executing agent will need
- If research reveals that the planned approach is wrong or outdated, the task is updated before it is finalised
- If research raises a meaningful decision (two valid approaches with real tradeoffs), a Question is created and the human decides — the decision and rationale are recorded

**Pattern Contracts:** When a task establishes an interface, data structure, or pattern that downstream tasks will rely on, a Pattern Contract is defined. The agent identifies these proactively: *"This task creates the filter store interface. Tasks T-026 and T-027 will consume it. Should we define a Pattern Contract here?"* The contract's Definition is written precisely enough to lock a version.

**Dependency mapping:** As tasks are defined, the agent builds the dependency graph. Hard dependencies (cannot start without) and soft dependencies (better to do after) are distinguished. If the dependency graph reveals a sequencing problem — a task that needs to come before another but was assigned to a later Epic — it is surfaced and resolved before Phase 3 ends.

**Verification planning:** For tasks involving external integrations, security-sensitive code, or any approach the agent flagged as requiring validation, a Verification record is pre-populated with Type and Source — ready to be executed and marked passed/failed during Phase 4. This means the executing agent in Phase 4 knows it needs to verify, not just implement.

**Subtask breakdown:** Each task gets its ordered Subtask list — concrete, imperative steps. Fine-grained enough to resume mid-task without re-reading the whole task.

**Acceptance Criteria:** Written last, after the research is done. This matters — acceptance criteria written before research are often wrong about what "done" means for a specific approach. After research, they can be precise and agent-verifiable.

### Output of Phase 3
Complete task graph for all Epics. All tasks have: Goal, Context (with embedded research), Acceptance Criteria, Affected Files, Subtasks, Delegation level, Pattern Contracts/Dependencies, pre-populated Verifications. All Dependencies mapped. All Questions from the decomposition resolved or recorded. Session Log updated as Phase 3 complete.

### Context reset after Phase 3
The decomposition conversation — all the research tangents, the task proposals and rejections, the back-and-forth on approach — is discarded. Phase 4 starts with a clean agent context loading the structured task model. The executing agent reads a task file and has everything it needs. It does not inherit the reasoning that produced it.

---

## Phase 4: Implementation

### Purpose
Execute the task graph. This phase has the most structured support from the entity model — every task is a complete brief, every dependency is mapped, every pattern contract is declared, every verification is pre-planned. The agent's job is execution and honest reporting, not discovery.

### Why this phase is different
In Phases 1–3 the primary mode is *gathering and structuring*. In Phase 4 the primary mode is *executing and recording*. The agent should spend almost no time researching or deciding — those costs were paid in Phase 3. If an agent in Phase 4 finds itself needing to make a significant architectural decision, that is a signal that Phase 3 was incomplete for that task, and the task should be paused, the decision captured, and the task context updated before continuing.

### The implementation loop

**Task selection:** The agent reads the Session Log to find the active task, or reads the Epic task tables to find the highest-priority Pending task with no unresolved blockers and no `⚠️ Needs Review` status.

**Context load:** The agent reads the task file fully before writing a single line of code. It resolves all Project Resource references in the Context field. It reads any Pattern Contracts it depends on to confirm the current version matches its Pattern Dependencies.

**Execution:** The agent implements the task per its Subtask list, checking off each subtask as it completes. Work Intervals are recorded automatically by the extension. If the agent encounters something that changes the scope, approach, or affects a Pattern Contract, it stops and surfaces this rather than proceeding — delegation level governs how much autonomy it has.

**Verification:** Tasks with pre-planned Verifications are verified before being marked Done — not after. Documentation verifications happen by reading the relevant docs. Testing verifications happen by running the tests. The agent records the result in the Verification record.

**Completion:** The agent calls the completion tool, which writes the Completion Record (output metrics, actual files touched, lines changed), aggregates the Work Log into total active time and cost, and updates the task status to Done. The Session Log is updated. Pattern Contracts established by this task are set to Established status.

**Review propagation:** If the implementation changed a Pattern Contract, the downstream tasks are flagged `⚠️ Needs Review` with the version diff populated. The Session Log records the Pending Reviews for the human to address.

**Human oversight:** After each task (or batch of tasks, depending on the human's preference), the human reviews the Completion Record — what was produced, what it cost, what changed. This is the oversight layer. It does not slow execution — it is asynchronous. The agent continues to the next task; the human reviews when ready.

---

## Why Context Resets Between Phases Are Non-Negotiable

Each phase reset serves the same purpose: the conversation that produced the structured output is noise once the output exists. Carrying it forward contaminates the agent's context with provisional thinking, rejected ideas, and exploratory back-and-forth that has been superseded by the decisions captured in structured files.

A Phase 4 agent that has the Phase 1 interview in its context window is a worse executor than one that starts clean with only the task file and project resources. The structured files are a better representation of project knowledge than the conversation that created them — more dense, more precise, and free of the ambiguity that conversation naturally carries.

The reset is also a quality gate. If the structured output of a phase is good enough to orient a fresh agent, the phase is done. If the fresh agent is confused or finds gaps, the phase needs more work before moving on. The reset surfaces incompleteness that would otherwise be papered over by conversational context.
