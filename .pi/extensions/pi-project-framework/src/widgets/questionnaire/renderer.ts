/**
 * Questionnaire rendering — builds the TUI output lines.
 */

import { truncateToWidth } from "@mariozechner/pi-tui";
import type { QuestionnaireState } from "./state";

export interface RenderDeps {
	state: QuestionnaireState;
	theme: any;
	editor: { render(width: number): string[] };
}

export function renderQuestionnaire(width: number, deps: RenderDeps): string[] {
	const { state, theme, editor } = deps;
	const lines: string[] = [];
	const add = (s: string) => lines.push(truncateToWidth(s, width));

	// Top border
	add(theme.fg("accent", "─".repeat(width)));

	const q = state.currentQuestion();

	// Title
	if (state.isMulti) {
		const qNum = state.currentTab < state.questions.length ? state.currentTab + 1 : state.questions.length;
		add(theme.fg("accent", theme.bold(` QUESTIONNAIRE · ${qNum} of ${state.questions.length}`)));
	} else if (q) {
		add(theme.fg("accent", theme.bold(` QUESTION`)));
	}

	// Tab bar (multi only)
	if (state.isMulti) {
		renderTabBar(add, state, theme);
		lines.push("");
	}

	// Content area
	if (state.isMulti && state.currentTab === state.questions.length) {
		renderSubmitTab(add, lines, state, theme);
	} else if (q && q.type === "free_text") {
		renderFreeText(add, lines, q, state, theme, editor, width);
	} else if (q && (q.type === "single_choice" || q.type === "multi_select")) {
		renderChoiceQuestion(add, lines, q, state, theme, editor, width);
	}

	// Help & bottom border
	lines.push("");
	renderHelpLine(add, state, theme);
	add(theme.fg("accent", "─".repeat(width)));

	return lines;
}

// ── Tab bar ──────────────────────────────────────────────────────

function renderTabBar(add: (s: string) => void, state: QuestionnaireState, theme: any) {
	const tabs: string[] = [];
	for (let i = 0; i < state.questions.length; i++) {
		const isActive = i === state.currentTab;
		const isAnswered = state.answers.has(state.questions[i].id);
		const box = isAnswered ? "■" : "□";
		const lbl = state.questions[i].label;
		const text = ` ${box} ${lbl} `;
		const styled = isActive
			? theme.bg("selectedBg", theme.fg("text", text))
			: theme.fg(isAnswered ? "success" : "muted", text);
		tabs.push(styled);
	}
	const canSubmit = state.allAnswered();
	const isSubmitTab = state.currentTab === state.questions.length;
	const submitText = " ✓ Submit ";
	const submitStyled = isSubmitTab
		? theme.bg("selectedBg", theme.fg("text", submitText))
		: theme.fg(canSubmit ? "success" : "dim", submitText);
	tabs.push(submitStyled);
	add(` ${tabs.join(" ")}`);
}

// ── Submit tab ───────────────────────────────────────────────────

function renderSubmitTab(add: (s: string) => void, lines: string[], state: QuestionnaireState, theme: any) {
	add(theme.fg("accent", theme.bold(" Review & Submit")));
	lines.push("");
	for (const nq of state.questions) {
		const ans = state.answers.get(nq.id);
		const label = theme.fg("muted", ` ${nq.label}: `);
		if (ans) {
			const prefix = ans.wasCustom ? theme.fg("dim", "(wrote) ") : "";
			add(`${label}${prefix}${theme.fg("text", ans.display)}`);
			if (ans.comment) {
				add(`          ${theme.fg("dim", "comment: ")}${theme.fg("muted", ans.comment)}`);
			}
		} else {
			add(`${label}${theme.fg("warning", "— unanswered")}`);
		}
	}
	lines.push("");
	if (state.allAnswered()) {
		add(theme.fg("success", " Press Enter to submit"));
	} else {
		const missing = state.questions
			.filter((nq) => !state.answers.has(nq.id))
			.map((nq) => nq.label)
			.join(", ");
		add(theme.fg("warning", ` Unanswered: ${missing}`));
	}
}

// ── Free text ────────────────────────────────────────────────────

function renderFreeText(
	add: (s: string) => void, lines: string[],
	q: any, state: QuestionnaireState, theme: any,
	editor: { render(w: number): string[] }, width: number,
) {
	add(theme.fg("text", ` ${q.prompt}`));
	lines.push("");
	if (state.freeTextMode) {
		add(theme.fg("muted", " Your answer:"));
		for (const line of editor.render(width - 2)) {
			add(` ${line}`);
		}
		lines.push("");
		add(theme.fg("dim", " Enter to submit · Esc to go back"));
	} else {
		const existing = state.answers.get(q.id);
		if (existing) {
			add(` ${theme.fg("success", "✓ ")}${theme.fg("text", existing.display)}`);
			lines.push("");
		}
		add(theme.fg("dim", " Press Enter to type your answer"));
	}
}

// ── Choice question (single_choice / multi_select) ───────────────

function renderChoiceQuestion(
	add: (s: string) => void, lines: string[],
	q: any, state: QuestionnaireState, theme: any,
	editor: { render(w: number): string[] }, width: number,
) {
	add(theme.fg("text", ` ${q.prompt}`));
	if (q.type === "multi_select") {
		add(theme.fg("dim", "   (Space to toggle, Enter to confirm selection)"));
	}
	lines.push("");

	if (state.customInputMode) {
		renderCustomInput(add, lines, q, state, theme, editor, width);
		return;
	}

	const opts = state.buildOptionsList(q);
	const checkedSet = state.checked.get(q.id) ?? new Set();

	for (let i = 0; i < opts.length; i++) {
		const opt = opts[i];
		const isCursor = i === state.optionIndex && !state.commentFocused;
		const isOther = opt.value === "__other__";

		let prefix: string;
		if (q.type === "multi_select") {
			const mark = checkedSet.has(i) ? "☑" : "☐";
			prefix = isCursor ? theme.fg("accent", `> ${mark} `) : `  ${mark} `;
		} else {
			prefix = isCursor ? theme.fg("accent", "> ") : "  ";
		}

		const recBadge = opt.recommended ? theme.fg("success", " ★ recommended") : "";
		const label = isOther
			? theme.fg("muted", `${i + 1}. ${opt.label}`)
			: (isCursor ? theme.fg("accent", `${i + 1}. ${opt.label}`) + recBadge : theme.fg("text", `${i + 1}. ${opt.label}`) + recBadge);

		add(prefix + label);

		if (opt.description) {
			add(`     ${theme.fg("muted", opt.description)}`);
		}
	}

	// Comment field for multi_select
	if (q.type === "multi_select") {
		renderCommentField(add, lines, q, opts.length, state, theme, editor, width);
	}
}

// ── Custom input (single_choice "Type something…") ──────────────

function renderCustomInput(
	add: (s: string) => void, lines: string[],
	q: any, state: QuestionnaireState, theme: any,
	editor: { render(w: number): string[] }, width: number,
) {
	const opts = state.buildOptionsList(q);
	for (let i = 0; i < opts.length; i++) {
		const opt = opts[i];
		const isOther = opt.value === "__other__";
		const recBadge = opt.recommended ? theme.fg("dim", " ★") : "";
		if (isOther) {
			add(`  ${theme.fg("accent", `${i + 1}. ${opt.label} ✎`)}`);
		} else {
			add(`  ${theme.fg("dim", `${i + 1}. ${opt.label}`)}${recBadge}`);
		}
	}
	lines.push("");
	add(theme.fg("muted", " Your answer:"));
	for (const line of editor.render(width - 2)) {
		add(` ${line}`);
	}
	lines.push("");
	add(theme.fg("dim", " Enter to submit · Esc to cancel"));
}

// ── Comment field (multi_select) ─────────────────────────────────

function renderCommentField(
	add: (s: string) => void, lines: string[],
	q: any, optsLength: number,
	state: QuestionnaireState, theme: any,
	editor: { render(w: number): string[] }, width: number,
) {
	lines.push("");
	const isCursorOnComment = state.optionIndex === optsLength && !state.commentFocused;
	const commentPrefix = isCursorOnComment ? theme.fg("accent", "> ") : "  ";
	const commentLabel = isCursorOnComment
		? theme.fg("accent", "💬 Comment (optional)")
		: theme.fg("muted", "💬 Comment (optional)");

	if (state.commentFocused) {
		add(`  ${theme.fg("accent", "💬 Comment:")}`);
		for (const line of editor.render(width - 4)) {
			add(`   ${line}`);
		}
	} else {
		const existing = state.comments.get(q.id);
		if (existing) {
			add(`${commentPrefix}${commentLabel}: ${theme.fg("text", existing)}`);
		} else {
			add(`${commentPrefix}${commentLabel}`);
		}
	}
}

// ── Help line ────────────────────────────────────────────────────

function renderHelpLine(add: (s: string) => void, state: QuestionnaireState, theme: any) {
	if (state.commentFocused) {
		add(theme.fg("dim", " Enter to save comment & confirm · Esc to go back"));
		return;
	}
	if (state.freeTextMode || state.customInputMode) {
		return; // help is already rendered inline
	}

	const q = state.currentQuestion();
	let help: string;
	if (state.isMulti) {
		if (q?.type === "multi_select") {
			help = " Tab/←→ navigate · ↑↓ move · Space toggle · Enter confirm · Esc cancel";
		} else {
			help = " Tab/←→ navigate · ↑↓ select · Enter confirm · Esc cancel";
		}
	} else {
		if (q?.type === "multi_select") {
			help = " ↑↓ move · Space toggle · Enter confirm · Esc cancel";
		} else if (q?.type === "free_text") {
			help = " Enter to type · Esc cancel";
		} else {
			help = " ↑↓ navigate · Enter select · Esc cancel";
		}
	}
	add(theme.fg("dim", help));
}
