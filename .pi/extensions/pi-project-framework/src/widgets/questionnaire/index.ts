/**
 * Generic Questionnaire Widget — public entry point.
 *
 * Usage:
 *   import { runQuestionnaire, type QuestionDef } from "./widgets/questionnaire";
 *   const result = await runQuestionnaire(ctx, questions);
 */

export type { QuestionType, QuestionOption, QuestionDef, QuestionAnswer, QuestionnaireResult } from "./types";
export { runQuestionnaire } from "./run";
