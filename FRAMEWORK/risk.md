# Entity: Risk

A **Risk** is a known potential future problem that has not yet materialized. It is distinct from a Blocker (a current obstacle that stops a task) and a Question (an unresolved decision). A Risk says: *"this could go wrong under these conditions — here is what we know about it and what we're doing about it."*

Risks exist because problems identified during research — a library limitation, an integration gotcha, a performance uncertainty, a dependency on an external service — need a place to live that is not buried in a Task's Context or lost in session notes. A risk with no record cannot be monitored, escalated, or mitigated systematically.

---

## A Risk consists of

- **ID** — unique identifier (e.g. RISK-001)
- **Description** — what could go wrong, stated precisely. Not vague ("performance might be bad") but specific: "Under sustained load above 500 concurrent users, the current synchronous database query pattern in the Export Epic may exceed the 5-second response timeout. This has not been load tested."
- **Likelihood** — high / medium / low. Qualitative. Not a numerical probability — that would be false precision. Based on the agent's or human's judgment given what is known at the time of recording.
- **Impact** — what would happen to the project if this risk materialized. Should name specific consequences: scope impact (which Epics or Goals are affected), timeline impact, and whether it would trigger a Change Request.
- **Affected entities** — structured list of what is exposed to this risk:
  - Task IDs (specific tasks whose approach depends on the risk not materializing)
  - Epic IDs (entire feature areas that are exposed)
  - Goal IDs (outcomes that could be jeopardized)
  - Tech Stack Entry names (if the risk is tied to a specific dependency)
- **Mitigation** — what reduces the risk. This field is explicit about the mitigation approach:
  - If mitigation requires work: reference to the Task ID that performs it
  - If mitigation is a decision already made: reference to the Decision ID
  - If mitigation is a standing practice: reference to the Rule or Convention (Project Resource)
  - If no mitigation has been identified yet: state "unmitigated" — do not leave the field empty
- **Status** — one of:
  - *open* — risk is active and unmitigated or partially mitigated
  - *mitigated* — the mitigation is complete; the risk is no longer considered active
  - *realized* — the risk materialized. It becomes a Blocker on the affected Task(s). See transition process below.
  - *accepted* — the human has acknowledged the risk and deliberately chosen not to mitigate it. Must include rationale.
- **Owner** — who is responsible for monitoring this risk and escalating it if conditions change: a human name/role or an agent identifier
- **Identified At** — which phase and session this risk was first recorded
- **Last Reviewed** — when the risk was last evaluated (likelihood, impact, or status may change over time)

---

## Risk Status Transitions

**open → mitigated:**
Triggered when the mitigation task is complete (if mitigation was a Task) or when the mitigating Decision or Convention is confirmed in place. The agent marks the risk mitigated and records what the mitigation was. A mitigated risk stays in the record — it is not deleted. If conditions change, a mitigated risk may be reopened.

**open → realized:**
Triggered when the risk materializes — the predicted problem actually occurs. The transition process:
1. The Risk status moves to `realized`
2. A **Blocker** is automatically created on each affected Task, with:
   - Type: Resource or External (depending on the nature of the realized risk)
   - Description: derived from the Risk's Description, now stated as a current fact rather than a potential one
   - Resolution Path: the Risk's Mitigation field (if populated) becomes the starting point for the Blocker's Resolution Path
3. A **Change Request** may be required if the realized risk affects Epic scope, Goals, or Constraints (see [change-management.md](change-management.md))
4. The Session Log records the risk realization as a significant event

**open → accepted:**
Triggered by explicit human decision to carry the risk without mitigation. The Acceptance rationale is mandatory. An accepted risk remains visible and is reviewed at each Milestone boundary.

**realized → resolved:**
A realized risk (now a Blocker) follows the Blocker resolution process. Once the Blocker is cleared, the Risk is annotated with what actually happened and how it was resolved. The Risk does not move to `mitigated` — it was realized, not prevented. The annotation distinguishes "this risk was mitigated and never materialized" from "this risk materialized and was resolved."

---

## When Risks Are Identified

Risks should be recorded throughout the project, not only in a dedicated risk review session:

- **Phase 1 (Interview):** Risks surfaced during the validation pass — goals that conflict under certain conditions, constraints that may be unachievable, tech stack choices with known limitations
- **Phase 2 (Planning):** Risks identified during Epic sequencing — ordering dependencies that could block if an Epic runs over, Milestone Exit Criteria that depend on external factors
- **Phase 3 (Decomposition):** The richest phase for risk identification. Every web search during task research may surface risks: library limitations, deprecated APIs, integration gotchas, performance cliffs, security considerations. These go into Risk records, not buried in Task Context.
- **Phase 4 (Implementation):** Risks discovered during execution. An agent that encounters a concerning pattern mid-task — a library behaving unexpectedly, a third-party API with undocumented rate limits — must record a Risk before proceeding past the concern.

---

## Relationship to Other Entities

- Risks may **trigger Change Requests** (see [change-management.md](change-management.md)) when realized
- Realized risks become **Blockers** on Tasks (see [relationships.md](relationships.md))
- Risks link to **Mitigation Tasks** — a Task whose purpose is specifically to reduce a risk's likelihood or impact
- Risks are reviewed at **Milestone boundaries** as part of the Milestone Completion process (see [planning.md](planning.md))
- Accepted risks are reviewed at each Milestone to confirm acceptance is still appropriate given what has been learned
- The **Project Completion Record** (see [project.md](project.md)) includes a summary of risks that were realized during the project and how they were resolved

---

## Risk Register

All Risks for a project are maintained as a **Risk Register** — an ordered list by Risk ID. The Risk Register is a project-level entity, not task-level. It is read:
- At the start of each Phase (as part of the Phase Completion Record check)
- At Milestone boundaries (as part of Milestone completion evaluation)
- During Phase 4 task selection (to check whether any open Risk is now realized and has created a Blocker on the candidate task)
- At project closure (to record which risks materialized, which were mitigated, and which were carried)
