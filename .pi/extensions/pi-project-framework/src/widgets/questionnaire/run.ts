/**
 * @module widgets/questionnaire/run
 * @description Questionnaire runner — orchestrates state, input, and renderer.
 *
 * This is the integration layer. It:
 * 1. Normalizes question definitions (applies defaults)
 * 2. Creates a QuestionnaireState instance
 * 3. Creates a shared pi-tui Editor for text input
 * 4. Wires editor.onSubmit to state transitions (custom input, comments, free text)
 * 5. Registers a ctx.ui.custom() widget that delegates:
 *    - render() → renderer.renderQuestionnaire()
 *    - handleInput() → input.handleInput()
 * 6. Returns a Promise<QuestionnaireResult> that resolves when done() is called
 *
 * The widget uses render caching (cachedLines) — invalidated on refresh().
 *
 * Requires ctx.hasUI === true. Returns { cancelled: true } if no UI or no questions.
 */

import { Editor, type EditorTheme } from "@mariozechner/pi-tui";
import type { QuestionDef, QuestionnaireResult, NormalizedQuestion } from "./types";
import { normalize } from "./types";
import { QuestionnaireState } from "./state";
import { handleInput } from "./input";
import { renderQuestionnaire } from "./renderer";

/**
 * Run a questionnaire and return the collected answers.
 *
 * @param ctx  ExtensionContext (or ExtensionCommandContext) with `ctx.ui.custom`.
 * @param questions  Array of question definitions.
 * @returns  QuestionnaireResult — check `.cancelled` before using `.answers`.
 */
export async function runQuestionnaire(
	ctx: { hasUI: boolean; ui: { custom: <T>(factory: any, opts?: any) => Promise<T> } },
	questions: QuestionDef[],
): Promise<QuestionnaireResult> {
	if (!ctx.hasUI) {
		return { answers: [], cancelled: true };
	}
	if (questions.length === 0) {
		return { answers: [], cancelled: true };
	}

	const normalized = normalize(questions);
	const isMulti = normalized.length > 1;
	const totalTabs = normalized.length + (isMulti ? 1 : 0);

	return ctx.ui.custom<QuestionnaireResult>((tui: any, theme: any, _kb: any, done: (r: QuestionnaireResult) => void) => {
		const state = new QuestionnaireState(normalized, isMulti, totalTabs);

		// Shared editor
		const editorTheme: EditorTheme = {
			borderColor: (s: string) => theme.fg("accent", s),
			selectList: {
				selectedPrefix: (t: string) => theme.fg("accent", t),
				selectedText: (t: string) => theme.fg("accent", t),
				description: (t: string) => theme.fg("muted", t),
				scrollInfo: (t: string) => theme.fg("dim", t),
				noMatch: (t: string) => theme.fg("warning", t),
			},
		};
		const editor = new Editor(tui, editorTheme);

		let cachedLines: string[] | undefined;

		function refresh() {
			cachedLines = undefined;
			tui.requestRender();
		}

		// Wire editor submit to state transitions
		editor.onSubmit = (value: string) => {
			const trimmed = value.trim();

			if (state.customInputMode && state.customInputQuestionId) {
				if (!trimmed) return;
				const q = state.questions.find((q) => q.id === state.customInputQuestionId)!;
				state.saveAnswer(q, trimmed, trimmed, true);
				state.customInputMode = false;
				state.customInputQuestionId = null;
				editor.setText("");
				advanceAfterAnswer();
			} else if (state.commentFocused) {
				const q = state.currentQuestion();
				if (!q) return;
				if (trimmed) state.comments.set(q.id, trimmed);
				state.commentFocused = false;
				editor.setText("");
				const result = state.confirmMultiSelect(q);
				if (result) {
					state.saveAnswer(q, result.value, result.display, false, result.values, result.comment);
				}
				advanceAfterAnswer();
			} else if (state.freeTextMode) {
				if (!trimmed) return;
				const q = state.currentQuestion();
				if (q) {
					state.saveAnswer(q, trimmed, trimmed.length > 60 ? trimmed.slice(0, 57) + "…" : trimmed, true);
					state.freeTextMode = false;
					editor.setText("");
					advanceAfterAnswer();
				}
			}
		};

		function advanceAfterAnswer() {
			if (!isMulti) {
				done({ answers: Array.from(state.answers.values()), cancelled: false });
				return;
			}
			if (state.currentTab < state.questions.length - 1) {
				state.currentTab++;
			} else {
				state.currentTab = state.questions.length;
			}
			state.optionIndex = 0;
			state.commentFocused = false;
			refresh();
		}

		return {
			render(width: number): string[] {
				if (cachedLines) return cachedLines;
				cachedLines = renderQuestionnaire(width, { state, theme, editor });
				return cachedLines;
			},
			invalidate: () => { cachedLines = undefined; },
			handleInput: (data: string) => {
				handleInput(data, { state, editor, refresh, done });
			},
		};
	});
}
