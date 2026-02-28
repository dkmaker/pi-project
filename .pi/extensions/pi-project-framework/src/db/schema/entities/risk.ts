/**
 * @module schema/entities/risk
 * @description Risk records — potential future problems, tracked not assumed away.
 *
 * Every risk identified during research or planning becomes a Risk record in the
 * Risk Register. Risks are monitored across sessions. When a risk is realized,
 * it becomes a Blocker on affected tasks.
 *
 * Risk is an EMBEDDABLE entity — fields description, impact, and mitigation
 * are concatenated for semantic search.
 *
 * Relationships:
 *   risk.project_id → Project.id (many-to-one)
 *   risk.mitigation_task_id → Task.id (nullable, if a specific task handles mitigation)
 *
 * Source: FRAMEWORK/er-diagram.md (RISK)
 */

import { Type, Static } from '@sinclair/typebox';
import { RiskLikelihood, RiskStatus } from '../enums';

export const RiskSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** What could go wrong. */
  description: Type.String(),
  /** Probability assessment: high|medium|low. */
  likelihood: RiskLikelihood,
  /** What happens if this risk is realized. Severity description. */
  impact: Type.String(),
  /** Comma-separated entity IDs (tasks, epics) affected if realized. */
  affected_entity_ids: Type.String(),
  /** Prevention or mitigation strategy. */
  mitigation: Type.String(),
  /** FK → Task.id (nullable). Specific task that implements mitigation, if any. */
  mitigation_task_id: Type.Optional(Type.String()),
  /** open → mitigated|realized|accepted. See transitions.ts. */
  status: RiskStatus,
  /** Who is monitoring this risk (e.g., "human", agent id). */
  owner: Type.String(),
  /** Which phase this risk was identified in (e.g., "phase_2"). */
  identified_at_phase: Type.String(),
  /** ISO date of last review. */
  last_reviewed: Type.String(),
  /** If realized: what actually happened. Empty if not realized. */
  realization_notes: Type.String(),
  /** Embedding staleness hash. Set by embedding system. */
  _embed_hash: Type.Optional(Type.String()),
  /** Embedding model version. */
  _embed_ver: Type.Optional(Type.Number()),
});

export type Risk = Static<typeof RiskSchema>;
