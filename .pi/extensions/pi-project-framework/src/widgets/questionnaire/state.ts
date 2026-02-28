/**
 * @module widgets/questionnaire/state
 * @description Questionnaire widget state — all mutable state lives here.
 *
 * QuestionnaireState is the single source of truth for the widget's runtime state.
 * It tracks:
 * - Navigation: current tab, option cursor index
 * - Multi-select: checked options per question, comment drafts
 * - Editor focus: which input mode is active (freeText, customInput, comment)
 * - Collected answers: completed answers per question id
 *
 * State is mutated by input.ts (keyboard handling) and read by renderer.ts (display).
 * The run.ts wires them together and owns the state instance.
 *
 * Key invariant: only one editor mode can be active at a time
 * (freeTextMode, customInputMode, commentFocused are mutually exclusive).
 */

import type { NormalizedQuestion, QuestionAnswer, QuestionOption } from "./types";

export class QuestionnaireState {
	currentTab = 0;
	optionIndex = 0;

	/** multi_select: checked option indices per question */
	readonly checked = new Map<string, Set<number>>();
	/** multi_select: comment text per question */
	readonly comments = new Map<string, string>();
	/** multi_select: whether the comment editor is focused */
	commentFocused = false;

	/** free_text: whether the editor is focused */
	freeTextMode = false;
	/** single_choice "Type something…": whether editor is focused */
	customInputMode = false;
	/** Which question the custom input belongs to */
	customInputQuestionId: string | null = null;

	/** Collected answers so far */
	readonly answers = new Map<string, QuestionAnswer>();

	constructor(
		public readonly questions: NormalizedQuestion[],
		public readonly isMulti: boolean,
		public readonly totalTabs: number,
	) {}

	currentQuestion(): NormalizedQuestion | undefined {
		if (this.isMulti && this.currentTab === this.questions.length) return undefined;
		return this.questions[this.currentTab];
	}

	buildOptionsList(q: NormalizedQuestion): QuestionOption[] {
		const opts = [...q.options];
		if (q.allowOther) {
			opts.push({ value: "__other__", label: "Type something…" });
		}
		return opts;
	}

	allAnswered(): boolean {
		return this.questions.every((q) => this.answers.has(q.id));
	}

	saveAnswer(q: NormalizedQuestion, value: string, display: string, wasCustom: boolean, selectedValues?: string[], comment?: string) {
		this.answers.set(q.id, { id: q.id, type: q.type, value, display, wasCustom, selectedValues, comment });
	}

	/** Whether the editor component currently has focus. */
	isEditorActive(): boolean {
		return this.freeTextMode || this.customInputMode || this.commentFocused;
	}

	toggleChecked(questionId: string, index: number) {
		if (!this.checked.has(questionId)) this.checked.set(questionId, new Set());
		const set = this.checked.get(questionId)!;
		if (set.has(index)) {
			set.delete(index);
		} else {
			set.add(index);
		}
	}

	confirmMultiSelect(q: NormalizedQuestion): { value: string; display: string; values: string[]; comment?: string } | null {
		const set = this.checked.get(q.id) ?? new Set();
		const comment = this.comments.get(q.id);
		if (set.size === 0 && !comment) return null;

		const selectedOpts = [...set].sort().map((i) => q.options[i]);
		const values = selectedOpts.map((o) => o.value);
		const displayParts = selectedOpts.map((o) => o.label);
		let display = displayParts.join(", ");
		if (comment) {
			display += ` (${comment.length > 40 ? comment.slice(0, 37) + "…" : comment})`;
		}
		return { value: values.join(","), display, values, comment: comment || undefined };
	}
}
