/**
 * @module widgets/questionnaire
 * @description Generic interactive questionnaire widget — public entry point.
 *
 * This is the sole import target for questionnaire consumers. All internal
 * modules (state, input, renderer, run) are implementation details.
 *
 * Supports three question types:
 * - single_choice: pick one option from a list, optionally type a custom answer
 * - multi_select: toggle multiple options with optional comment
 * - free_text: open an inline editor to type a freeform answer
 *
 * For a single question, renders a simple list. For multiple questions, renders
 * a tabbed interface with per-question tabs and a final submit/review page.
 *
 * Usage:
 *   import { runQuestionnaire, type QuestionDef } from "./widgets/questionnaire";
 *   const result = await runQuestionnaire(ctx, questions);
 *   if (!result.cancelled) { // use result.answers }
 *
 * Requires ctx.hasUI === true (non-interactive mode returns cancelled immediately).
 */

export type { QuestionType, QuestionOption, QuestionDef, QuestionAnswer, QuestionnaireResult } from "./types";
export { runQuestionnaire } from "./run";
