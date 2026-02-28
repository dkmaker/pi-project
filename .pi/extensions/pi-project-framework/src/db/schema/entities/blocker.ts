/**
 * @module schema/entities/blocker
 * @description Blockers and task dependencies.
 *
 * A Blocker is an explicit record of why a Task cannot proceed. Every task in
 * status=blocked MUST have at least one unresolved Blocker record. When all
 * blockers are resolved, the task transitions blocked → active.
 *
 * TaskDependency defines execution ordering between tasks.
 * Hard dependencies must complete before the dependent can start.
 * Soft dependencies are preferred but not enforced.
 *
 * Relationships:
 *   blocker.task_id → Task.id (many-to-one: the blocked task)
 *   blocker.blocking_task_id → Task.id (many-to-one, nullable: the task causing the block)
 *   task_dependency.task_id → Task.id (the dependent task)
 *   task_dependency.requires_task_id → Task.id (the prerequisite task)
 *
 * Source: FRAMEWORK/er-diagram.md (BLOCKER, TASK_DEPENDENCY)
 */

import { Type, Static } from '@sinclair/typebox';
import { BlockerType, DependencyNature } from '../enums';

export const BlockerSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. The task that is blocked. */
  task_id: Type.String(),
  /** What the blocker is and why it prevents progress. */
  description: Type.String(),
  /** Category of blocker. Determines resolution path. */
  type: BlockerType,
  /** How this blocker can be resolved. */
  resolution_path: Type.String(),
  /** FK → Task.id (nullable). If type=dependency, the specific task causing the block. */
  blocking_task_id: Type.Optional(Type.String()),
  /** Whether this blocker has been resolved. */
  resolved: Type.Boolean(),
  /** ISO datetime when resolved. Null if still active. */
  resolved_at: Type.Optional(Type.String()),
});

export type Blocker = Static<typeof BlockerSchema>;

/**
 * Execution ordering between two tasks.
 * task_id depends on requires_task_id completing first (if nature=hard).
 */
export const TaskDependencySchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. The task that has the dependency. */
  task_id: Type.String(),
  /** FK → Task.id. The task that must complete first. */
  requires_task_id: Type.String(),
  /** hard = must complete before dependent starts. soft = preferred ordering. */
  nature: DependencyNature,
});

export type TaskDependency = Static<typeof TaskDependencySchema>;
