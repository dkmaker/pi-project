/**
 * @module schema/entities/task
 * @description Tasks are the atomic unit of execution.
 *
 * A Task belongs to exactly one Epic. It has subtasks (ordered steps), attachments,
 * resource references, blockers, dependencies, pattern contracts/dependencies,
 * verifications, work intervals, and a completion record.
 *
 * Task is an EMBEDDABLE entity — fields name, goal_statement, context, and
 * acceptance_criteria are concatenated for semantic search. See embedding/config.ts.
 *
 * Relationships:
 *   task.epic_id → Epic.id (many-to-one)
 *   Subtask.task_id → Task.id (many-to-one)
 *   TaskAttachment.task_id → Task.id (many-to-one)
 *   TaskResourceRef.task_id → Task.id (many-to-one)
 *   Blocker.task_id → Task.id (many-to-one)
 *   TaskDependency.task_id / requires_task_id → Task.id (many-to-one)
 *   PatternContract.establishing_task_id → Task.id (many-to-one)
 *   PatternDependency.task_id → Task.id (many-to-one)
 *   Verification.task_id → Task.id (many-to-one)
 *   WorkInterval.task_id → Task.id (many-to-one)
 *   CompletionRecord.task_id → Task.id (1:0..1)
 *
 * Status transitions: see transitions.ts (TASK_TRANSITIONS)
 * Source: FRAMEWORK/er-diagram.md (TASK, SUBTASK, TASK_ATTACHMENT, TASK_RESOURCE_REF)
 */

import { Type, Static } from '@sinclair/typebox';
import { TaskStatus, Priority, DelegationLevel } from '../enums';

export const TaskSchema = Type.Object({
  id: Type.String(),
  /** FK → Epic.id. Every task belongs to exactly one epic. */
  epic_id: Type.String(),
  /** Short descriptive task name. */
  name: Type.String(),
  /** Current lifecycle status. See transitions.ts for valid transitions. */
  status: TaskStatus,
  /** Urgency: critical > high > medium > low. Affects execution ordering. */
  priority: Priority,
  /** Human-readable effort estimate (e.g., "2h", "1d", "small"). */
  estimate: Type.String(),
  /** Who executes and how much autonomy. See DelegationLevel enum. */
  delegation: DelegationLevel,
  /** What this task aims to achieve — its specific objective. */
  goal_statement: Type.String(),
  /** Background information the agent needs to execute this task. */
  context: Type.String(),
  /** ISO date when context/research was last validated. Staleness marker. */
  research_date: Type.String(),
  /** What must be true for this task to be considered done. */
  acceptance_criteria: Type.String(),
  /** Files this task will create or modify. */
  affected_files: Type.String(),
  /** Freeform notes: review records, revision notes, staleness markers. */
  notes: Type.String(),
  /** Embedding staleness: hash of last embedded text. Set by embedding system. */
  _embed_hash: Type.Optional(Type.String()),
  /** Embedding model version. If < CURRENT_EMBED_VER, needs re-embedding. */
  _embed_ver: Type.Optional(Type.Number()),
});

export type Task = Static<typeof TaskSchema>;

/**
 * Ordered step within a task. Agent checks these off as it progresses.
 * order_index determines execution sequence.
 */
export const SubtaskSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. */
  task_id: Type.String(),
  /** Execution order (0-based). */
  order_index: Type.Number(),
  /** What to do in this step. */
  description: Type.String(),
  /** Whether this subtask is complete. */
  done: Type.Boolean(),
  /** Any notes about execution or issues. */
  notes: Type.String(),
});

export type Subtask = Static<typeof SubtaskSchema>;

/**
 * File or link attached to a task — specialist output, reference material, etc.
 */
export const TaskAttachmentSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. */
  task_id: Type.String(),
  /** Human-readable label for this attachment. */
  label: Type.String(),
  /** URL or file path. */
  url_or_path: Type.String(),
  /** Attachment type (e.g., "specialist_output", "reference", "screenshot"). */
  type: Type.String(),
});

export type TaskAttachment = Static<typeof TaskAttachmentSchema>;

/**
 * Cross-reference from a Task to a Project Resource (tech stack entry, doc, rule, convention).
 * Declares what shared knowledge this task depends on.
 * Note: No own 'id' — composite key is (task_id, resource_id, resource_type).
 */
export const TaskResourceRefSchema = Type.Object({
  /** FK → Task.id. */
  task_id: Type.String(),
  /** ID of the referenced resource (TechStackEntry.id, SharedDocRef.id, etc.). */
  resource_id: Type.String(),
  /** Which resource collection: tech_stack|shared_doc|rule|convention. */
  resource_type: Type.Union([
    Type.Literal('tech_stack'), Type.Literal('shared_doc'),
    Type.Literal('rule'), Type.Literal('convention'),
  ]),
});

export type TaskResourceRef = Static<typeof TaskResourceRefSchema>;
