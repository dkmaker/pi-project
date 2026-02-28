/**
 * @module schema/enums
 * @description All enum types for the project management framework.
 * Source of truth: FRAMEWORK/er-diagram.md
 *
 * Convention: Each enum is a TypeBox Union of Literals.
 * Use `Static<typeof EnumName>` to get the TS union type.
 * Values are lowercase_snake_case, matching the ER diagram exactly.
 */

import { Type } from '@sinclair/typebox';

// ─── Project-level enums ──────────────────────────────────────────

/** Overall project progress. Terminal states: complete, abandoned. */
export const ProjectStatus = Type.Union([
  Type.Literal('not_started'), Type.Literal('in_progress'), Type.Literal('complete'),
  Type.Literal('on_hold'), Type.Literal('abandoned'),
]);

/** Which lifecycle phase the project is in. Drives what work is permitted. */
export const ProjectStage = Type.Union([
  Type.Literal('uninitialised'), Type.Literal('phase_1'), Type.Literal('phase_2'),
  Type.Literal('phase_3'), Type.Literal('phase_4'), Type.Literal('complete'),
  Type.Literal('abandoned'), Type.Literal('on_hold'),
]);

/** Operational mode — what is happening right now. Read with stage on cold-start. */
export const ProjectMode = Type.Union([
  Type.Literal('normal'), Type.Literal('change_management'), Type.Literal('infeasibility_review'),
  Type.Literal('phase_gate'), Type.Literal('awaiting_specialist'),
]);

// ─── Goal / Milestone / Epic status enums ─────────────────────────

/** Goal progress. 'achieved' requires a GoalCompletionRecord. 'abandoned' requires AbandonmentRecord. */
export const GoalStatus = Type.Union([
  Type.Literal('not_started'), Type.Literal('in_progress'), Type.Literal('achieved'),
  Type.Literal('abandoned'),
]);

/** Milestone progress. 'reached' requires a MilestoneReviewRecord. */
export const MilestoneStatus = Type.Union([
  Type.Literal('pending'), Type.Literal('active'), Type.Literal('reached'),
  Type.Literal('abandoned'),
]);

/** Epic progress. 'complete' requires an EpicCompletionRecord. */
export const EpicStatus = Type.Union([
  Type.Literal('pending'), Type.Literal('active'), Type.Literal('complete'),
  Type.Literal('abandoned'),
]);

// ─── Task enums ───────────────────────────────────────────────────

/**
 * Task lifecycle status. Full transition rules in transitions.ts.
 * - pending: defined, not started
 * - active: currently being worked on
 * - blocked: has an explicit Blocker record
 * - needs_review: upstream pattern contract changed — must review before starting
 * - in_review: done, awaiting human review
 * - done: terminal — verified, committed, approved
 * - cancelled: terminal — won't do, requires rationale
 */
export const TaskStatus = Type.Union([
  Type.Literal('pending'), Type.Literal('active'), Type.Literal('blocked'),
  Type.Literal('needs_review'), Type.Literal('in_review'), Type.Literal('done'),
  Type.Literal('cancelled'),
]);

/** Task urgency. Affects execution ordering. */
export const Priority = Type.Union([
  Type.Literal('critical'), Type.Literal('high'), Type.Literal('medium'), Type.Literal('low'),
]);

/**
 * Who executes the task and how much autonomy the agent has.
 * - implement: agent executes end-to-end, human reviews after
 * - plan: agent produces plan, human gates before code
 * - research: agent investigates only, no code written
 * - human: requires human judgment, agent assists only
 * - specialist: routed to different agent/tool/model (see Specialist Routing in task.md)
 */
export const DelegationLevel = Type.Union([
  Type.Literal('implement'), Type.Literal('plan'), Type.Literal('research'),
  Type.Literal('human'), Type.Literal('specialist'),
]);

// ─── Resource enums ───────────────────────────────────────────────

/** Classification for tech stack entries. */
export const TechCategory = Type.Union([
  Type.Literal('language'), Type.Literal('runtime'), Type.Literal('framework'),
  Type.Literal('library'), Type.Literal('database'), Type.Literal('service'), Type.Literal('tool'),
]);

/** Whether a tech stack entry's documentation has been verified. Stale = needs re-check. */
export const VerificationStatus = Type.Union([
  Type.Literal('unverified'), Type.Literal('verified'), Type.Literal('stale'),
]);

/** What kind of resource a TaskResourceRef points to. */
export const ResourceType = Type.Union([
  Type.Literal('tech_stack'), Type.Literal('shared_doc'), Type.Literal('rule'), Type.Literal('convention'),
]);

// ─── Blocker / Dependency enums ───────────────────────────────────

/**
 * Why a task is blocked.
 * - dependency: waiting on another task
 * - decision: waiting on a human decision
 * - external: waiting on something outside the project
 * - resource: missing tool, access, or capability
 * - specialist_routing: needs specialist agent/model
 * - verification_failure: a verification attempt failed
 */
export const BlockerType = Type.Union([
  Type.Literal('dependency'), Type.Literal('decision'), Type.Literal('external'),
  Type.Literal('resource'), Type.Literal('specialist_routing'), Type.Literal('verification_failure'),
]);

/** hard = must complete before dependent can start. soft = preferred but not required. */
export const DependencyNature = Type.Union([
  Type.Literal('hard'), Type.Literal('soft'),
]);

// ─── Pattern Contract enums ───────────────────────────────────────

/**
 * Lifecycle of a pattern contract (interface/API established by a task).
 * - draft: being defined
 * - established: stable, downstream tasks can depend on it
 * - changed: modified — triggers needs_review on dependents
 * - superseded: replaced by another contract
 */
export const PatternContractStatus = Type.Union([
  Type.Literal('draft'), Type.Literal('established'), Type.Literal('changed'),
  Type.Literal('superseded'),
]);

/** Whether a pattern dependency is up-to-date with its contract. */
export const PatternReviewStatus = Type.Union([
  Type.Literal('current'), Type.Literal('needs_review'), Type.Literal('updated'),
]);

// ─── Verification enums ──────────────────────────────────────────

/** How correctness is verified. Each type has different evidence requirements. */
export const VerificationType = Type.Union([
  Type.Literal('documentation'), Type.Literal('research'), Type.Literal('testing'),
  Type.Literal('code_review'), Type.Literal('external_validation'),
]);

/** Outcome of a verification check. 'pending' = not yet attempted. */
export const VerificationResult = Type.Union([
  Type.Literal('passed'), Type.Literal('failed'), Type.Literal('partial'), Type.Literal('pending'),
]);

// ─── Tracking enums ──────────────────────────────────────────────

/** What triggered a work interval to start. */
export const WorkIntervalTrigger = Type.Union([
  Type.Literal('user_prompt'), Type.Literal('agent_continuation'), Type.Literal('command'),
]);

// ─── Session / Decision / Question enums ─────────────────────────

/** Decision lifecycle. Superseded decisions point to their replacement via superseded_by_id. */
export const DecisionStatus = Type.Union([
  Type.Literal('active'), Type.Literal('superseded'), Type.Literal('revisited'),
]);

/**
 * Question lifecycle.
 * - open: needs answer, may auto-generate blockers on affected tasks
 * - resolved: answered, may produce a Decision
 * - deferred: postponed with a condition
 * - dropped: no longer relevant
 */
export const QuestionStatus = Type.Union([
  Type.Literal('open'), Type.Literal('resolved'), Type.Literal('deferred'), Type.Literal('dropped'),
]);

/** Phase gate outcome. 'passed' = next phase may begin. 'not_passed' = gaps must be closed first. */
export const PhaseGateStatus = Type.Union([
  Type.Literal('passed'), Type.Literal('not_passed'),
]);

// ─── Risk enums ──────────────────────────────────────────────────

/** Probability assessment. Used with impact (free text) for risk prioritization. */
export const RiskLikelihood = Type.Union([
  Type.Literal('high'), Type.Literal('medium'), Type.Literal('low'),
]);

/**
 * Risk lifecycle.
 * - open: identified, being monitored
 * - mitigated: prevention measures in place
 * - realized: has occurred — becomes a Blocker on affected tasks
 * - accepted: human acknowledged, no further mitigation planned
 */
export const RiskStatus = Type.Union([
  Type.Literal('open'), Type.Literal('mitigated'), Type.Literal('realized'), Type.Literal('accepted'),
]);

// ─── Change management enums ─────────────────────────────────────

/** Change request lifecycle. Only 'approved' produces a ScopeChange. */
export const ChangeRequestStatus = Type.Union([
  Type.Literal('pending_review'), Type.Literal('approved'), Type.Literal('rejected'),
]);

/** Scope change application status. 'applied' = downstream entities updated. */
export const ScopeChangeStatus = Type.Union([
  Type.Literal('pending'), Type.Literal('applied'),
]);

/** What happens to completed work within an abandoned entity. */
export const AbandonmentDisposition = Type.Union([
  Type.Literal('retained'), Type.Literal('discarded'), Type.Literal('archived'),
]);
