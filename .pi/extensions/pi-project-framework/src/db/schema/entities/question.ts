/**
 * @module schema/entities/question
 * @description Questions capture uncertainty before it becomes a blocker.
 *
 * Open questions with impact_entity_ids auto-generate Blockers when affected
 * tasks go active. Questions age via session_count (incremented each session
 * they remain open). Escalation_flag is set when aging threshold is exceeded.
 *
 * Resolution may produce a Decision or a ScopeChange.
 *
 * Question is an EMBEDDABLE entity — fields description and options are
 * concatenated for semantic search.
 *
 * Relationships:
 *   question.project_id → Project.id (many-to-one)
 *   question.resulting_decision_id → Decision.id (nullable, if resolution produced a decision)
 *
 * Source: FRAMEWORK/er-diagram.md (QUESTION)
 */

import { Type, Static } from '@sinclair/typebox';
import { QuestionStatus } from '../enums';

export const QuestionSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** The question being asked. */
  description: Type.String(),
  /** Comma-separated entity IDs affected by this question. Used for auto-blocker generation. */
  impact_entity_ids: Type.String(),
  /** Possible answers or approaches being considered. */
  options: Type.String(),
  /** Who is responsible for answering (e.g., "human", agent id). */
  owner: Type.String(),
  /** open → resolved|deferred|dropped. deferred can reopen. See transitions.ts. */
  status: QuestionStatus,
  /** The answer, once resolved. */
  resolution: Type.String(),
  /** FK → Decision.id (nullable). If resolution produced a formal Decision. */
  resulting_decision_id: Type.Optional(Type.String()),
  /** Number of sessions this question has been open. Used for aging/escalation. */
  session_count: Type.Number(),
  /** True if aging threshold exceeded — surfaces question more prominently. */
  escalation_flag: Type.Boolean(),
  /** For deferred questions: condition that must be met before reopening. */
  defer_until_condition: Type.String(),
  /** Embedding staleness hash. Set by embedding system. */
  _embed_hash: Type.Optional(Type.String()),
  /** Embedding model version. */
  _embed_ver: Type.Optional(Type.Number()),
});

export type Question = Static<typeof QuestionSchema>;
