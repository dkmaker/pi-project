/**
 * @module schema/entities/verification
 * @description Verification entities — confirming correctness, not just completion.
 *
 * A Verification is a check against an authoritative source. Each has an attempt
 * history (VerificationAttempt). The current_result reflects the latest attempt.
 *
 * Verification ≠ done. A task passing acceptance criteria is not verified.
 * Failed attempts trigger the Verification Failure Recovery Loop (FRAMEWORK/verification.md),
 * which creates a Blocker (type=verification_failure) and requires remediation.
 *
 * Stale verifications: When the source changes (e.g., tech stack version update),
 * stale is set to true. Must be re-verified before task can proceed.
 *
 * Relationships:
 *   verification.task_id → Task.id (many-to-one)
 *   verification_attempt.verification_id → Verification.id (many-to-one)
 *
 * Source: FRAMEWORK/er-diagram.md (VERIFICATION, VERIFICATION_ATTEMPT)
 */

import { Type, Static } from '@sinclair/typebox';
import { VerificationType, VerificationResult } from '../enums';

export const VerificationSchema = Type.Object({
  id: Type.String(),
  /** FK → Task.id. The task being verified. */
  task_id: Type.String(),
  /** How correctness is being verified. Different types have different evidence. */
  type: VerificationType,
  /** The authoritative source being verified against (doc URL, test suite, etc.). */
  source: Type.String(),
  /** Latest result: passed|failed|partial|pending. Reflects most recent attempt. */
  current_result: VerificationResult,
  /** True if the source has changed since last verification. Requires re-check. */
  stale: Type.Boolean(),
});

export type Verification = Static<typeof VerificationSchema>;

/**
 * A single attempt at verification. Attempts are immutable history.
 * The latest attempt's result should match the parent Verification.current_result.
 * attempt_number is 1-indexed.
 */
export const VerificationAttemptSchema = Type.Object({
  id: Type.String(),
  /** FK → Verification.id. */
  verification_id: Type.String(),
  /** 1-indexed attempt number. */
  attempt_number: Type.Number(),
  /** Result of this attempt. Note: 'pending' is not a valid attempt result — only on Verification. */
  result: Type.Union([Type.Literal('passed'), Type.Literal('failed'), Type.Literal('partial')]),
  /** Who performed this verification (agent identifier or "human"). */
  performed_by: Type.String(),
  /** ISO datetime of the attempt. */
  date: Type.String(),
  /** Observations, evidence, failure details. */
  notes: Type.String(),
});

export type VerificationAttempt = Static<typeof VerificationAttemptSchema>;
