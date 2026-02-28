/**
 * @module schema/entities/pattern
 * @description Pattern contracts, versions, and dependencies.
 *
 * A PatternContract represents an interface/API/pattern established by a task.
 * Other tasks depend on it via PatternDependency. When a contract changes,
 * all dependent tasks are flagged needs_review with a version diff.
 *
 * This is the mechanism that propagates scope changes downstream automatically.
 *
 * Lifecycle: draft → established → changed → established (cycle) or → superseded.
 * Each change creates a PatternContractVersion for audit trail.
 *
 * Relationships:
 *   pattern_contract.establishing_task_id → Task.id (who created the pattern)
 *   pattern_contract.superseded_by_contract_id → PatternContract.id (nullable, replacement)
 *   pattern_contract_version.contract_id → PatternContract.id (version history)
 *   pattern_dependency.task_id → Task.id (the dependent task)
 *   pattern_dependency.contract_id → PatternContract.id (what it depends on)
 *
 * Source: FRAMEWORK/er-diagram.md (PATTERN_CONTRACT, PATTERN_CONTRACT_VERSION, PATTERN_DEPENDENCY)
 */

import { Type, Static } from '@sinclair/typebox';
import { PatternContractStatus, PatternReviewStatus } from '../enums';

export const PatternContractSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. The task that established this pattern/interface. */
  establishing_task_id: Type.String(),
  /** Human-readable contract name (e.g., "StorageAdapter interface"). */
  name: Type.String(),
  /** Current version number. Incremented on each change. */
  current_version: Type.Number(),
  /** The current contract definition (API signature, behavior description, etc.). */
  definition: Type.String(),
  /** draft → established → changed → established|superseded. See transitions.ts. */
  status: PatternContractStatus,
  /** FK → PatternContract.id (nullable). Points to the replacement contract if superseded. */
  superseded_by_contract_id: Type.Optional(Type.String()),
});

export type PatternContract = Static<typeof PatternContractSchema>;

/**
 * Immutable snapshot of a pattern contract at a specific version.
 * Created each time a contract is changed. Enables version diffs for review.
 */
export const PatternContractVersionSchema = Type.Object({
  id: Type.String(),
  /** FK → PatternContract.id. */
  contract_id: Type.String(),
  /** Version number at time of snapshot. */
  version_number: Type.Number(),
  /** Contract definition at this version. */
  definition_at_version: Type.String(),
  /** ISO datetime of the change. */
  changed_at: Type.String(),
  /** What changed from the previous version. */
  change_summary: Type.String(),
  /** Comma-separated task IDs that were flagged needs_review due to this change. */
  triggered_reviews_on: Type.String(),
});

export type PatternContractVersion = Static<typeof PatternContractVersionSchema>;

/**
 * A task's dependency on a pattern contract.
 * Tracks which version the task was designed against (locked_version) and
 * whether the contract has changed since (review_status).
 *
 * When review_status=needs_review, the task must run the Needs Review Resolution
 * Process before it can proceed. See FRAMEWORK/relationships.md.
 */
export const PatternDependencySchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. The task that depends on the pattern. */
  task_id: Type.String(),
  /** FK → PatternContract.id. The contract being depended on. */
  contract_id: Type.String(),
  /** The task that established the contract (denormalized for quick lookup). */
  source_task_id: Type.String(),
  /** Human-readable name of the pattern (denormalized). */
  pattern_name: Type.String(),
  /** Version of the contract this task was designed against. */
  locked_version: Type.Number(),
  /** What this task expects from the contract. */
  expectation: Type.String(),
  /** current = up-to-date, needs_review = contract changed, updated = review done. */
  review_status: PatternReviewStatus,
  /** Review notes: outcome of needs_review resolution, version diff, etc. */
  review_note: Type.String(),
});

export type PatternDependency = Static<typeof PatternDependencySchema>;
