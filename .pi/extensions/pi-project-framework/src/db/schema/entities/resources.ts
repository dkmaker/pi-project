/**
 * @module schema/entities/resources
 * @description Project-level shared resources: tech stack, docs, rules, conventions.
 *
 * These are referenced by Tasks via TaskResourceRef (task.ts).
 * Changes to stable resources (especially TechStackEntry versions) trigger a defined
 * cascade: verifications marked stale, tasks flagged, pattern contracts re-evaluated.
 * See FRAMEWORK/reference.md "Tech Stack Version Update Process".
 *
 * All four resource types: FK project_id → Project.id (many-to-one).
 *
 * Source: FRAMEWORK/er-diagram.md (TECH_STACK_ENTRY, SHARED_DOC_REF, RULE, CONVENTION)
 */

import { Type, Static } from '@sinclair/typebox';
import { TechCategory, VerificationStatus } from '../enums';

export const TechStackEntrySchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Technology name (e.g., "TypeScript", "Vectra"). */
  name: Type.String(),
  /** Classification: language|runtime|framework|library|database|service|tool. */
  category: TechCategory,
  /** Pinned version string (e.g., "5.4.2", "^3.8.1"). */
  version: Type.String(),
  /** Why this technology is in the stack. */
  purpose: Type.String(),
  /** Link to official docs. */
  documentation_url: Type.String(),
  /** Project-specific usage notes, gotchas, version change history. */
  project_specific_notes: Type.String(),
  /** Whether documentation accuracy has been verified. Stale after version updates. */
  verification_status: VerificationStatus,
});

export type TechStackEntry = Static<typeof TechStackEntrySchema>;

/**
 * Reference to shared documentation: design docs, API specs, external references.
 * Tasks reference these via TaskResourceRef to declare what docs they need.
 */
export const SharedDocRefSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Human-readable label. */
  name: Type.String(),
  /** URL or file path to the document. */
  url_or_path: Type.String(),
  /** What this document covers. */
  description: Type.String(),
  /** What part of the project this applies to (e.g., "all", "backend", "auth module"). */
  scope: Type.String(),
});

export type SharedDocRef = Static<typeof SharedDocRefSchema>;

/**
 * Project rules: hard constraints that must never be violated.
 * Unlike conventions (preferred patterns), rules are enforced.
 */
export const RuleSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** The rule itself, stated clearly. */
  statement: Type.String(),
  /** Why this rule exists. */
  rationale: Type.String(),
  /** Where the rule applies (e.g., "all code", "API endpoints", "database layer"). */
  scope: Type.String(),
  /** How this rule is enforced (e.g., "linter", "code review", "agent check"). */
  enforcement: Type.String(),
});

export type Rule = Static<typeof RuleSchema>;

/**
 * Project conventions: preferred patterns and practices.
 * Softer than rules — guidelines that should be followed unless there's good reason not to.
 */
export const ConventionSchema = Type.Object({
  id: Type.String(),
  /** FK → Project.id. */
  project_id: Type.String(),
  /** Convention name (e.g., "Named exports only"). */
  name: Type.String(),
  /** What the convention is and how to follow it. */
  description: Type.String(),
  /** Why this convention was adopted. */
  rationale: Type.String(),
  /** What code/files this applies to (e.g., "all TypeScript files", "API routes"). */
  applies_to: Type.String(),
});

export type Convention = Static<typeof ConventionSchema>;
