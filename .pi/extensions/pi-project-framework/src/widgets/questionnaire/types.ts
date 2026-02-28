/**
 * @module widgets/questionnaire/types
 * @description Public types and normalization for the questionnaire widget.
 *
 * Type hierarchy:
 * - QuestionDef: input from the LLM tool call (what the AI provides)
 * - NormalizedQuestion: internal form with guaranteed label, options, allowOther
 * - QuestionAnswer: output per question (what the user answered)
 * - QuestionnaireResult: final output (all answers + cancelled flag)
 *
 * normalize() converts QuestionDef[] → NormalizedQuestion[] with defaults applied.
 */

export type QuestionType = "single_choice" | "multi_select" | "free_text";

export interface QuestionOption {
	value: string;
	label: string;
	description?: string;
	/** If true, this option is flagged as recommended by the AI. */
	recommended?: boolean;
}

export interface QuestionDef {
	/** Unique id for this question (used as answer key). */
	id: string;
	/** Short label shown in the tab bar (defaults to Q1, Q2 …). */
	label?: string;
	/** The full question text displayed to the user. */
	prompt: string;
	/** Question type. */
	type: QuestionType;
	/** Options for single_choice / multi_select. Ignored for free_text. */
	options?: QuestionOption[];
	/** For single_choice: show an extra "Type something…" option. Default true. */
	allowOther?: boolean;
	/** For free_text: placeholder text in the editor. */
	placeholder?: string;
}

export interface QuestionAnswer {
	id: string;
	type: QuestionType;
	/** For single_choice: the selected value. For free_text: the text. For multi_select: comma-joined values. */
	value: string;
	/** Human-readable display of the answer. */
	display: string;
	/** true if the user typed a custom value via "Type something…" or free_text. */
	wasCustom: boolean;
	/** For multi_select: all selected values. */
	selectedValues?: string[];
	/** For multi_select: optional user comment on the selections. */
	comment?: string;
}

export interface QuestionnaireResult {
	answers: QuestionAnswer[];
	cancelled: boolean;
}

/** Internal normalized question — guaranteed label, options, allowOther. */
export interface NormalizedQuestion extends QuestionDef {
	label: string;
	options: QuestionOption[];
	allowOther: boolean;
}

export function normalize(questions: QuestionDef[]): NormalizedQuestion[] {
	return questions.map((q, i) => ({
		...q,
		label: q.label ?? `Q${i + 1}`,
		options: q.options ?? [],
		allowOther: q.type === "single_choice" ? (q.allowOther !== false) : false,
	}));
}
