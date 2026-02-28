/**
 * @module schema/entities/decision
 * @description Decisions preserve reasoning — why something was built a certain way.
 *
 * Every significant choice should be a Decision record. If a decision is later
 * overturned, it's marked superseded (not deleted) with a pointer to the replacement.
 * This preserves the full reasoning chain.
 *
 * Decision is an EMBEDDABLE entity — fields title, context, decision, and rationale
 * are concatenated for semantic search.
 *
 * Relationships:
 *   decision.project_id → Project.id (many-to-one)
 *   decision.superseded_by_id → Decision.id (self-referential, nullable)
 *   Question.resulting_decision_id → Decision.id (nullable, when question resolution produces a decision)
 *
 * Source: FRAMEWORK/er-diagram.md (DECISION)
 */

import { Type, Static } from '@sinclair/typebox';
import { DecisionStatus } from '../enums';

export const DecisionSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Short descriptive title (e.g., "Use TypeBox over Zod"). */
  title: Type.String(),
  /** ISO date when the decision was made. */
  date: Type.String(),
  /** What situation or question led to this decision. */
  context: Type.String(),
  /** The decision itself — what was chosen. */
  decision: Type.String(),
  /** Why this option was chosen over alternatives. */
  rationale: Type.String(),
  /** Expected downstream effects of this decision. */
  consequences: Type.String(),
  /** Comma-separated task IDs affected by this decision. */
  affected_task_ids: Type.String(),
  /** active = current, superseded = replaced, revisited = being reconsidered. */
  status: DecisionStatus,
  /** FK → Decision.id (nullable). Points to the decision that replaced this one. */
  superseded_by_id: Type.Optional(Type.String()),
  /** Embedding staleness hash. Set by embedding system. */
  _embed_hash: Type.Optional(Type.String()),
  /** Embedding model version. */
  _embed_ver: Type.Optional(Type.Number()),
});

export type Decision = Static<typeof DecisionSchema>;
