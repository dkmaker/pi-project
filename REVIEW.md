# Review: AI-Optimized Project Management Framework

**For:** Anyone who manages projects, works with developers, or has tried to use AI tools in a development context — and wondered why they keep losing the thread.

**Reading time:** 8–10 minutes

**Key:** 🤖 = AI agent action or responsibility · 👤 = Human action or responsibility · 🤝 = Both involved

---

## The Problem This Solves

You have probably seen this happen.

A developer (or an AI agent) starts on a task. They make good progress. Then the session ends — a break, a context switch, a new day. When they come back, they spend the first twenty minutes reconstructing what they were doing, why they made certain decisions, and what was left. Half the time they get it slightly wrong and build on a shaky reconstruction.

With an AI agent, this problem is dramatically worse. 🤖 An AI agent has no persistent memory between sessions. Every session starts completely cold. Without a system that has already captured project state, decisions, and intent in structured files, the agent is essentially starting from scratch — relying on 👤 the human to brief it again, every time. That briefing is always incomplete. Decisions made three sessions ago are forgotten. Patterns established in one part of the codebase are re-invented somewhere else. Questions that were deferred get answered differently the second time.

The result is inconsistency, rework, and 👤 a human who ends up spending more time managing the AI than the AI saves them.

**This framework is the answer to that problem.**

---

## The Core Idea

The framework's single rule is this:

> **Nothing lives in anyone's head or in chat history. Everything is written down.**

🤖 Every decision has a record with its rationale. 🤖 Every open question has an entry. 🤖 Every blocker is named. 🤖 Every pattern one piece of code establishes — that other pieces must follow — is declared. Every change to the plan goes through a defined process.

This sounds like bureaucracy. It isn't. It's the minimum information needed for 🤖 an AI agent to pick up a project cold and operate correctly — without 👤 the human having to re-explain everything.

The difference between this and a normal project management tool is that this is designed *for AI agents*, not for humans to track status in a dashboard. Every field exists because 🤖 an agent operating without context needs it. The structure is chosen to make machine-readable resumption fast and reliable.

---

## The Four Phases

Projects move through four stages. Each stage has a defined purpose, a defined output, and a gate that must be passed before the next stage begins. The gate is not a formality — it is a checklist 🤖 the agent reads before it does anything. If items are missing, 🤖 it stops and surfaces the gaps to 👤 the human.

### Phase 1 — Interview 🤝

Before any planning happens, 🤖 the AI has a structured conversation with 👤 the human. Not a form. Not a list of fields to fill in. A real conversation, led by 🤖 the AI, that starts with a single open question: *"Tell me what you want to build."*

🤖 The AI continues asking — one question at a time — until it can answer without ambiguity: What does this do? Who uses it? What does success look like? What is explicitly out of scope? What are the hard constraints? What technology does 👤 the human want to use?

As 👤 the answers emerge, 🤖 the AI is simultaneously researching — checking whether the mentioned technologies are current, surfacing known problems, flagging better alternatives for 👤 the human to consider. 🤖 Every technology decision is recorded with its rationale. 🤖 Every unresolved question becomes an explicit entry.

By the end of Phase 1, the project has a complete written definition. Not notes. Not a summary. 🤖 Structured entities written automatically: a Project record, Goals, Constraints, Tech Stack entries with documentation links, Conventions, a Risk Register, and an initial set of Decisions.

**Why this matters:** The interview is the difference between 🤖 an AI that works from a solid foundation and one that guesses at intent for the entire project. Guessing accumulates. A wrong assumption about scope in the first session can produce weeks of work in the wrong direction.

### Phase 2 — Planning 🤝

With the project definition solid, 🤖 the AI proposes the high-level structure: which major areas of work exist (called Epics), what the meaningful checkpoints are (Milestones), and how the goals map to the Epics. 👤 The human confirms, adjusts, or challenges each proposal.

This is deliberately high-altitude. No implementation details. No individual tasks. The question here is: what are we building, in what order, and why in that order?

🤖 The AI identifies dependencies between Epics — this auth system must exist before user profiles can be built — and makes those sequencing constraints explicit and written, not verbal understandings. 🤖 It identifies Infrastructure Epics: necessary work that doesn't map to a user-visible goal (like setting up deployment pipelines) but must be planned anyway.

🤝 Every Epic gets an explicit scope-in and scope-out. 🤖 The AI challenges vague scope statements. If something could be interpreted two ways, 👤 the human clarifies it now, not discovered as a conflict in implementation.

**Why this matters:** Scope ambiguity at the planning stage is cheap to fix. The same ambiguity discovered mid-implementation requires rework. This phase exists to move scope decisions left in time, where they cost the least.

### Phase 3 — Task Research 🤖

For each Epic, 🤖 the work is broken down into individual Tasks — discrete units of work, each completable in one focused session.

> **SAFe proposal:** The entity currently called a "Task" maps directly to what SAFe calls a **Story** — a user-facing unit of work with Acceptance Criteria, a goal statement, and a Completion Record. In SAFe, a "Task" is the smaller technical step *inside* a Story. Renaming accordingly removes ambiguity: everyone — human or AI — already has a strong shared understanding of what a Story is versus what a Task is. This also opens an optional **Feature** layer between Epic and Story, for grouping related Stories within a planning period when an Epic is large enough to warrant it.

🤖 Each Task gets a full brief written automatically: what it needs to accomplish, what already exists that it builds on, what approach was researched and decided, what files it will touch, what the observable criteria for being done look like. Critically, 🤖 every Task includes a **Research Date** — the date the technical approach was validated. If that date is more than 60 days old when the task is actually worked, 🤖 the agent checks whether the approach is still valid before writing a line of code.

> **SAFe proposal:** The 60-day threshold does not fit the reality of AI-agent-driven projects. All work is intended to be executed by agents, sessions are short, and a project moves from Phase 3 to Phase 4 in days — not months. A fixed calendar threshold is the wrong trigger. The right trigger is **event-based**: when a Tech Stack Entry records a version change, 🤖 a supporting validation agent automatically reviews every Story whose Research Date pre-dates that change and checks whether the Story's stated approach is still valid against the new version. This runs autonomously — no 👤 human involvement unless 🤖 the agent finds an actual conflict. Only a confirmed conflict (the approach no longer works, a breaking change was introduced, the library is deprecated) surfaces to 👤 the human as an Impediment on the affected Story. Everything else is handled and closed silently by 🤖 the agent. The Research Date therefore becomes a comparison point against Tech Stack Entry version history, not a countdown clock.

> **SAFe proposal:** Research-only Stories — where the output is a finding or recommendation rather than delivered code — have a precise SAFe name: a **Spike**. 🤖 A Spike runs as a bounded subagent with a defined token budget, has a defined question to answer, and produces a documented finding. This is distinct from the staleness check above: a Spike is planned work to resolve genuine technical uncertainty before a Story can be written. The staleness check is 🤖 an automated validation of already-researched work. They are different things and should not be conflated.

🤖 Tasks that establish patterns other Tasks must follow create **Pattern Contracts** — a declared interface that downstream work depends on. If that pattern later changes, 🤖 every dependent task is automatically flagged for review before it is started.

> **SAFe proposal:** Pattern Contracts correspond to what SAFe calls **Architectural Runway** — the technical foundations that future Stories depend on. Tasks that build this runway rather than deliver user-visible value are called **Enabler Stories** in SAFe. Naming them explicitly (Business Story vs Enabler Story) makes the intent of every work item visible immediately, which helps both 👤 the human prioritising the backlog and 🤖 the AI agent understanding what "done" means for each type.

🤖 Dependencies between tasks are mapped explicitly. A task cannot begin until everything it depends on is done. 🤖 The dependency graph is verified before Phase 3 closes.

**Why this matters:** A poorly-prepared task brief is one of the most common causes of 🤖 AI agent failure. The agent starts, encounters an ambiguity not resolved in the brief, makes an assumption, and builds something that doesn't fit. Phase 3 eliminates that by doing the thinking before the building starts — which is how experienced 👤 human engineers work, and how 🤖 AI agents need to work too.

### Phase 4 — Implementation 🤖 → 👤 Review

This is where code gets written. By this point, 🤖 the agent has everything it needs: a complete task brief, all dependencies mapped, all patterns declared, all decisions recorded. 🤖 The agent's job is execution and honest reporting.

🤖 The framework tracks implementation in real time. Every working session is recorded automatically — when it started, how long it ran, what model was used, how many tokens were consumed, what it cost. Not for surveillance — for calibration. When a task consistently takes longer than estimated, that informs how similar tasks are estimated in future. When certain task types are expensive, that informs which model to use for them.

When 🤖 a task is done, 🤖 a Completion Record is written automatically: what was actually built, what files were touched, what was learned. Then 👤 the human reviews it. There are four defined outcomes — Approved 👤, Accepted with Notes 👤, Minor Revision 👤, Significant Rework 👤 — each with a clear defined next state. No ambiguity about what "needs a small fix" actually means operationally.

---

## The Entities and Why Each One Exists

These are the things the framework keeps track of, and the reason each one is necessary.

### Session Log 🤖
The most recent Session Log entry is what 🤖 the AI reads first on every cold start. It contains: what task was being worked, exactly where work stopped (not "working on filters" — "the filter predicate on line 47 uses AND instead of OR, fix that next"), what questions were open, what needs to happen next. 🤖 The agent writes a new Session Log entry at the end of every session.

Without this, every session restart costs 15–30 minutes of reconstruction. With it, 🤖 the AI is operational in under a minute.

### Task 🤖 → 👤 Review
The primary unit of work. Each task is small enough for 🤖 the agent to complete in one session and carries a complete brief: goal, full context, research, acceptance criteria, affected files, subtasks. 🤖 An agent reading only a Task should know exactly what to do — no clarification needed. 👤 The human reviews the Completion Record when done.

> **SAFe proposal:** Rename **Task → Story**. In SAFe — and in common usage across Jira, Linear, GitHub, and Azure DevOps — a Story is the work unit that has a goal statement, Acceptance Criteria, and a Completion Record. A "Task" in those same tools means the smaller technical step inside a Story. The current entity is unambiguously a Story by that definition. Using the correct name means 👤 the human and 🤖 the AI agent share an existing, trained understanding of the entity without the framework needing to redefine common words. Additionally, SAFe recognises two Story subtypes worth naming explicitly: a **Business Story** (delivers user-visible value) and an **Enabler Story** (builds technical foundations that future Stories depend on). Making this distinction visible on every Story removes the need to explain why some Stories don't appear to do anything 👤 the user would notice.

### Subtask 🤖
An ordered checklist inside a Task. This exists because it allows 🤖 the agent to resume a half-done task precisely. "Subtask 3 of 7 done, stopped at subtask 4" is a complete resume point. Without subtasks, partial work is opaque to 🤖 the agent picking up cold.

> **SAFe proposal:** Rename **Subtask → Task**. In SAFe, a Task is exactly this: a concrete, ordered, binary-done technical step inside a Story. The rename flows directly from Story above — once the primary work unit is called a Story, its internal steps are correctly called Tasks. No behaviour changes; only the names align with what every tool and practitioner already calls them.

### Decision 🤝
A recorded choice with its rationale and the options that were rejected. 👤 The human makes the decision. 🤖 The agent records it immediately with full rationale and affected tasks. Six months later — or in the next session — "we chose this library because of X" is not useful. "We chose this library over Y and Z because of specific constraint A, and we rejected Y because of known issue B" gives 🤖 an agent the information to know whether to revisit the decision if circumstances change.

### Question 🤖 → 👤 Resolution
An open decision — something that needs an answer but doesn't have one yet. 🤖 Questions are created and tracked automatically because unresolved decisions are hidden blockers. 🤖 A question that stays open for more than three sessions automatically triggers an escalation: 🤖 the agent surfaces it at the next session start and requires 👤 the human to decide or explicitly defer.

If 🤖 a question is blocking a specific task, and that task becomes active while the question is still open, 🤖 a Blocker is automatically created on that task. The task cannot proceed until 👤 the human resolves the Question.

### Blocker 🤖 detects · 👤 or 🤖 resolves
Something preventing a task from moving forward. 🤖 Always typed (dependency, resource, decision, specialist needed) and always has an explicit resolution path recorded by the agent. 🤖 A blocker without a resolution path is a dead end masquerading as a status update — the agent will not accept one.

> **SAFe proposal:** Rename **Blocker → Impediment**. SAFe, Scrum, and virtually every agile tool use "Impediment" as the standard term for anything actively preventing work from proceeding. The rename also clarifies the Question–Blocker relationship: 🤖 a Question that is open and blocking a Story generates an **Impediment** on that Story automatically. 👤 Resolving the Question resolves the Impediment. This is the exact Impediment model SAFe uses — raised by 🤖 the team, owned by 👤 someone with authority to clear it, tracked until resolved. The concept is unchanged; the name becomes universally recognised.

### Pattern Contract 🤖
When 🤖 one task establishes an interface, data structure, or architectural pattern that other tasks will rely on, 🤖 that becomes a Pattern Contract automatically. 🤖 Other tasks declare Pattern Dependencies on it.

If the pattern changes — which happens — 🤖 every dependent task is automatically flagged ⚠️ Needs Review. 🤖 The agent cannot start those tasks until it has explicitly resolved whether the change affects them. This prevents the subtle, expensive bug class where a changed interface isn't noticed until late integration.

### Verification 🤖 runs · 👤 for human-required checks
Some tasks require more than "the code looks right." 🤖 An integration with an external API must actually work — the agent verifies it. A security-sensitive piece of code must be reviewed — 👤 the human verifies it. 🤖 Verification records track what type of verification was required, what the result was, and if it failed — what happened next. 🤖 Failed verifications enter a defined recovery loop automatically. They are not dead ends.

> **SAFe proposal:** SAFe splits this into two distinct concepts worth naming explicitly. **Acceptance Criteria** are the specific, observable conditions defined per Story that confirm the Story does what it was meant to do — 🤝 written before work starts, 🤖 checked by the agent when it ends. The **Definition of Done** is a consistent project-wide quality checklist (code reviewed, tests passing, no known regressions) that 🤖 the agent applies to every Story regardless of its individual criteria. The current Verification entity covers both. Making the split explicit helps 👤 the human understand which checks are unique to a specific Story and which are non-negotiable standards across all work.

### Risk 🤖 identifies · 👤 accepts or rejects
Any potential future problem identified during research or planning. 🤖 The agent identifies and records Risks in the Risk Register during Phases 1–3. 🤖 A realized risk becomes a Blocker on the relevant task automatically — it is not a surprise. 👤 An accepted risk is documented as a decision with rationale confirmed by the human.

### Change Request 👤 initiates · 🤖 processes
The mechanism for controlled change to things that have already been decided. Once a Goal, Epic, Milestone, or Constraint is established, it cannot be informally modified. 👤 The human raises a Change Request. 🤖 The agent creates the paper trail: what changed, why, what the downstream effects are. This prevents "scope creep by accident" — the project subtly expanding because no one formally noticed each individual change.

### Work Interval 🤖
A record of one continuous period of agent work on a task. 🤖 Automatically written by the system — the agent doesn't track its own time. Includes model, duration, token usage, estimated cost. Aggregated across a project, this answers: what has this project actually cost in AI time? Which epics are consuming the most 🤖 agent effort?

---

## What the Agent Gets Out of This

Put yourself in the position of 🤖 the AI agent. You start a session. You have no memory of previous sessions. You have no idea what was worked on, what decisions were made, what's currently broken, what the next step is.

With this framework, the first thing 🤖 you read tells you:
- What phase the project is in
- What mode it's currently in (normal work? a change is being reviewed? waiting for a specialist?)
- What task is active and exactly where work stopped
- What questions are open and which ones are escalating
- What needs review before you can start the next task

🤖 You load the active task and you have a complete brief. You know what files to look at. You know what patterns the code follows and where they're declared. You know what's already been decided and why. You know what you need to verify before marking the task done.

🤖 You can start immediately. You don't need to reconstruct. You don't need to ask 👤 the human to re-explain. You don't make assumptions based on incomplete information and build in the wrong direction.

That is the gap this framework closes — the gap between 👤 a human who knows a project deeply and 🤖 an AI that starts cold every single time.

---

## Feedback and Open Questions for Review

These are the things that seem solid and the things that warrant scrutiny:

### What seems well-designed

**The cold-start protocol is clear and complete.** The rule that Stage + Mode are always read first by 🤖 the agent, followed by the Session Log, followed by task context — this is a genuine solution to the reconstruction problem. It is specific enough to be implementable and testable.

**The Phase Completion Record gate is the right mechanism.** Making the gate a file 🤖 the next-phase agent reads — not 👤 a human click or a verbal agreement — closes the loop properly. The gate is either passed or it isn't.

> **SAFe proposal:** SAFe calls this an **Inspect and Adapt** event — a formal retrospective and gate at the end of each Program Increment. The output is a structured record of what was achieved, what gaps remain, and what changes are made before the next increment begins. Renaming "Phase Completion Record" to **Phase Gate Record** aligns with this concept and with the general term "phase gate" used across project management disciplines, making it immediately recognisable without needing explanation.

**Pattern Contract propagation is clever and necessary.** 🤖 Automatically flagging dependent tasks when an interface changes is not over-engineering — it is exactly the kind of invisible bug this class of system should prevent.

**Work Interval tracking being 🤖 extension-managed, not 🤖 agent-managed, is correct.** 🤖 An agent cannot know how long it ran. Having the surrounding system record it automatically is the right architecture.

**The Delegation model is practical.** Having explicit delegation levels per task — 🤖 Implement (autonomous), 🤝 Plan (gate before coding), 🤖 Research (findings only), 👤 Human (needs human judgment) — prevents 🤖 the AI from autonomously building something it should have paused on.

### Things that deserve scrutiny

**Phase 1 interview quality will determine everything downstream.** The entire framework depends on the Project entity being accurate. If 🤖 the interview produces a shallow or wrong project definition, all three subsequent phases build on a bad foundation. The framework states 🤖 the interview should surface real concerns and challenge assumptions — but how well 🤖 the AI actually does this depends heavily on how the interview is designed and how good the agent is at it. This is the highest-risk phase.

**The framework is relatively heavyweight for small projects.** 👤 A solo developer on a two-day prototype does not need a Risk Register, Change Requests, Pattern Contracts, or Phase Completion Records. The framework currently has no "lightweight mode." This is worth addressing — either with a minimal profile for small projects, or with clear guidance on which entities are optional at what scale.

> **SAFe proposal:** SAFe explicitly addresses this through its four configurations — **Essential SAFe** is the minimal viable version, dropping portfolio governance, multi-team coordination, and large-scale planning ceremonies. For 👤 solo developers and small projects, Essential SAFe is the reference point: keep Epics, Stories, Tasks, Acceptance Criteria, Impediments, and Risks — and treat everything else (Features, Phase Gate Records, Pattern Contracts, Change Requests) as optional layers that are added when the project is complex enough to need them. Defining a clear "Essential" profile for this framework — with explicit guidance on which entities are required vs optional at which project scale — would resolve the overhead concern directly.

**Question escalation after three sessions may be too slow.** If 🤖 a Question is blocking a task that 👤 the team needs to start in the next session, waiting three sessions before escalation is too long. There should probably be an "urgent" flag on Questions that 🤖 escalates immediately if the blocked task is high priority.

> **SAFe proposal:** SAFe handles this through the **Impediment** model directly — any Question that 🤖 generates an Impediment on an active Story is by definition urgent, because an active Story is in-flight work. 🤖 The Impediment does not wait for a session count; it surfaces immediately at session start as long as the blocked Story is active or next in priority. The three-session escalation threshold should remain for non-blocking Questions (general open decisions), while any Question that has 🤖 generated an Impediment on a Story should escalate on the next session regardless of age, requiring 👤 the human to act.

**The Specialist routing process is correct but may create long pauses.** When a task is escalated to 👤 a specialist — a security review, a design review — the task sits Blocked until 👤 the specialist returns output. There is no mechanism for 🤖 the system to pursue other work proactively while waiting. 👤 The human must notice the blocker, route the work, wait, and return the output. This could be a long gap. Worth considering whether the session log should have a "waiting for external" state that 🤖 the system surfaces more actively.

> **SAFe proposal:** SAFe handles this through the **Program Board** — a visual map of Stories, their dependencies, and their external blockers, reviewed at every planning session so nothing waits invisibly. At the scale of this framework, the equivalent is surfacing "waiting for external" as a distinct Mode state (alongside the existing `normal`, `change_management`, etc.), so it is the first thing both 👤 the human and 🤖 the agent see at session start. 🤖 The Session Log's Next Actions field should also be required to list any Stories currently blocked on external specialist output, with the date the routing was made, so the wait is never invisible across sessions.

**Verification staleness may be underweighted.** 🤖 A task researched today against a library's current API is solid. The same task researched later may be working against an outdated API. The 60-day staleness threshold is reasonable but arbitrary. For fast-moving ecosystems (ML libraries, cloud APIs) it may be far too long. Worth considering whether the staleness threshold should be configurable per Tech Stack Entry, not global.

> **SAFe proposal:** The 60-day threshold is the wrong model entirely for AI-agent-driven work — projects move too fast and sessions are too short for calendar time to be a meaningful signal. The correct model is **event-driven staleness**: 🤖 a Story's research is considered potentially stale only when a Tech Stack Entry it references records a version change after the Story's Research Date. When that event fires, 🤖 a supporting validation agent runs autonomously — it reads the Story's stated approach, checks it against the new version's changelog and documentation, and makes a determination. Three outcomes are possible, and only one reaches 👤 the human: (1) 🤖 no impact — agent closes the flag silently, (2) 🤖 context update needed — agent updates the Story's Context field directly and closes the flag, (3) 🤖 breaking conflict — agent raises an Impediment on the Story and surfaces it to 👤 the human with a specific description of what changed and why the approach no longer holds. 👤 The human only sees outcome 3. This is the correct human/agent split: everything that can be resolved autonomously is resolved by 🤖 the agent; only genuine conflicts that require a decision escalate to 👤 the human.

**The four human review outcomes are good — but Minor Revision scope control depends entirely on 👤 the human.** The framework says "🤖 the agent must not re-interpret or expand beyond the stated revision." That is a policy statement, not an enforcement mechanism. If 👤 the revision description is vague, 🤖 the agent may still expand. 👤 The revision scope should be written as a formal, bounded task brief before 🤖 the agent starts the revision — otherwise the same ambiguity problem that the framework solves in Phase 3 reappears at revision time.

> **SAFe proposal:** SAFe's equivalent is treating a revision as a new **Story** — even if it is small. 👤 Writing the revision scope as a bounded Story brief (with explicit Acceptance Criteria and affected files) before 🤖 the agent starts the revision work applies the same discipline Phase 3 requires for new work. This is not overhead for a significant revision; it is the minimum needed to prevent 🤖 the agent from interpreting "fix the layout" as license to refactor the entire component. The framework already has the Story Brief mechanism — it should require it for Minor Revisions as well as for new work.

---

## Overall Assessment

This is a well-structured solution to a real problem. The problem it solves — 🤖 AI agents losing context between sessions, making inconsistent decisions, and requiring constant 👤 human re-briefing — is not theoretical. It is the primary friction point in using 🤖 AI agents on any project longer than a single session.

The framework's approach of making everything explicit and file-resident is the right instinct. The entity model is thorough without being excessive (mostly). The phase structure matches how serious software projects actually work.

The biggest open risk is Phase 1 quality, and the biggest open design question is whether the framework can scale down gracefully for smaller projects. Both are solvable. Neither is a reason to not build this.

The right first question for review: **Is the framework solving the right problem for the projects you actually run?** If your projects are typically longer than a few sessions, involve decisions made over multiple conversations, and use 🤖 AI assistance for implementation — this framework addresses the friction you are already feeling, whether or not you have named it yet.

> **SAFe proposal — summary of all naming changes:** Across this review, a recurring theme is that the framework's private vocabulary creates unnecessary friction. The proposal is to adopt SAFe terminology as the shared contract between 👤 human and 🤖 AI agent — not the full enterprise SAFe ceremony structure, but the naming: **Story** (not Task), **Task** (not Subtask), **Impediment** (not Blocker), **Phase Gate Record** (not Phase Completion Record), **Spike** (for planned research-only Stories resolving genuine uncertainty — distinct from 🤖 the automated staleness validation which is an agent-run background check, not a Story type), **Enabler Story** (for technical foundation work), **Feature** (optional grouping layer between Epic and Story), **Acceptance Criteria** and **Definition of Done** (splitting what is currently called Verification). These names are already understood by every 👤 developer, every 🤖 AI agent trained on software development, and every project management tool in common use. Adopting them costs nothing and removes the need for any onboarding into the framework's terminology.
