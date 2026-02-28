/**
 * @module widgets/questionnaire/input
 * @description Keyboard input handling for the questionnaire widget.
 *
 * Routes raw keyboard data to state mutations. Input handling is split by context:
 * 1. Editor active (freeText/customInput/comment): delegate to editor, Esc exits
 * 2. Tab navigation (multi-question): Tab/←→ switch tabs
 * 3. Submit tab: Enter submits if all answered, Esc cancels
 * 4. Choice questions: ↑↓ navigate, Space toggles (multi_select), Enter confirms
 * 5. Free text: Enter opens editor
 *
 * Dependencies:
 * - InputDeps.state: QuestionnaireState (mutated in place)
 * - InputDeps.editor: shared Editor instance for text input
 * - InputDeps.refresh: triggers re-render after state change
 * - InputDeps.done: resolves the questionnaire promise with final result
 *
 * Uses pi-tui Key constants and matchesKey() for cross-platform key matching.
 */

import { Key, matchesKey } from "@mariozechner/pi-tui";
import type { QuestionnaireResult } from "./types";
import type { QuestionnaireState } from "./state";

export interface InputDeps {
	state: QuestionnaireState;
	editor: { handleInput(data: string): void; setText(text: string): void; getText?(): string };
	refresh: () => void;
	done: (result: QuestionnaireResult) => void;
}

export function handleInput(data: string, deps: InputDeps) {
	const { state, editor, refresh, done } = deps;

	const finish = (cancelled: boolean) => {
		done({ answers: Array.from(state.answers.values()), cancelled });
	};

	// ── Editor has focus ──
	if (state.isEditorActive()) {
		if (matchesKey(data, Key.escape)) {
			if (state.commentFocused) {
				// Save draft comment before leaving
				const q = state.currentQuestion();
				if (q) {
					const txt = editor.getText?.() ?? "";
					if (txt.trim()) state.comments.set(q.id, txt.trim());
				}
				state.commentFocused = false;
			} else {
				state.freeTextMode = false;
				state.customInputMode = false;
				state.customInputQuestionId = null;
			}
			editor.setText("");
			refresh();
			return;
		}
		editor.handleInput(data);
		refresh();
		return;
	}

	const q = state.currentQuestion();

	// ── Tab navigation (multi-question) ──
	if (state.isMulti) {
		if (matchesKey(data, Key.tab) || matchesKey(data, Key.right)) {
			state.currentTab = (state.currentTab + 1) % state.totalTabs;
			state.optionIndex = 0;
			state.commentFocused = false;
			refresh();
			return;
		}
		if (matchesKey(data, Key.shift("tab")) || matchesKey(data, Key.left)) {
			state.currentTab = (state.currentTab - 1 + state.totalTabs) % state.totalTabs;
			state.optionIndex = 0;
			state.commentFocused = false;
			refresh();
			return;
		}
	}

	// ── Submit tab ──
	if (state.isMulti && state.currentTab === state.questions.length) {
		if (matchesKey(data, Key.enter) && state.allAnswered()) {
			finish(false);
		} else if (matchesKey(data, Key.escape)) {
			finish(true);
		}
		return;
	}

	if (!q) return;

	// ── Free text: Enter opens editor ──
	if (q.type === "free_text") {
		if (matchesKey(data, Key.enter)) {
			state.freeTextMode = true;
			const existing = state.answers.get(q.id);
			editor.setText(existing?.value ?? "");
			refresh();
			return;
		}
		if (matchesKey(data, Key.escape)) {
			finish(true);
			return;
		}
		return;
	}

	const opts = state.buildOptionsList(q);
	// For multi_select: one extra index for the comment field
	const maxIndex = q.type === "multi_select" ? opts.length : opts.length - 1;

	// ── Arrow navigation ──
	if (matchesKey(data, Key.up)) {
		state.optionIndex = Math.max(0, state.optionIndex - 1);
		refresh();
		return;
	}
	if (matchesKey(data, Key.down)) {
		state.optionIndex = Math.min(maxIndex, state.optionIndex + 1);
		refresh();
		return;
	}

	// ── Multi-select: Space toggles ──
	if (q.type === "multi_select" && matchesKey(data, Key.space)) {
		if (state.optionIndex < opts.length) {
			state.toggleChecked(q.id, state.optionIndex);
			refresh();
			return;
		}
	}

	// ── Enter ──
	if (matchesKey(data, Key.enter)) {
		if (q.type === "single_choice") {
			const opt = opts[state.optionIndex];
			if (opt.value === "__other__") {
				state.customInputMode = true;
				state.customInputQuestionId = q.id;
				editor.setText("");
				refresh();
				return;
			}
			state.saveAnswer(q, opt.value, opt.label, false);
			advanceAfterAnswer(state, refresh, finish);
			return;
		}

		if (q.type === "multi_select") {
			// Comment field
			if (state.optionIndex === opts.length) {
				state.commentFocused = true;
				editor.setText(state.comments.get(q.id) ?? "");
				refresh();
				return;
			}
			// Confirm selection
			const result = state.confirmMultiSelect(q);
			if (!result) return;
			state.saveAnswer(q, result.value, result.display, false, result.values, result.comment);
			advanceAfterAnswer(state, refresh, finish);
			return;
		}
	}

	// ── Escape ──
	if (matchesKey(data, Key.escape)) {
		finish(true);
	}
}

function advanceAfterAnswer(state: QuestionnaireState, refresh: () => void, finish: (cancelled: boolean) => void) {
	if (!state.isMulti) {
		finish(false);
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
