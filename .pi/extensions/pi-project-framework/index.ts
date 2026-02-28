/**
 * @module pi-project-framework
 * @description Extension entry point for the AI-Optimized Project Management Framework.
 *
 * Registers:
 * - `prj_questionnaire` tool: LLM-callable interactive questionnaire widget.
 *   Supports single_choice, multi_select, and free_text question types.
 *   Single question → simple list UI. Multiple questions → tabbed interface with submit page.
 *
 * Architecture:
 * - This file is the ONLY file that interacts with the pi ExtensionAPI.
 * - The questionnaire widget lives in src/widgets/questionnaire/ (self-contained).
 * - The database module (src/db/) is an internal dependency — no tools registered here yet.
 *
 * DO NOT add database-related tool registrations here during the db module build.
 * Future work will add tools that consume the Database class from src/db/.
 *
 * Dependencies (pi-provided, no install needed):
 * - @mariozechner/pi-coding-agent: ExtensionAPI type
 * - @mariozechner/pi-tui: Text, truncateToWidth for tool rendering
 * - @sinclair/typebox: Type, for tool parameter schemas
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, truncateToWidth } from "@mariozechner/pi-tui";
import { runQuestionnaire, type QuestionDef, type QuestionnaireResult } from "./src/widgets/questionnaire/index";
import { registerDebugTools } from "./src/db/_DEBUG_TOOLS";
import { initConfig } from "./src/config/config";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {
	// ─── config initialization ──────────────────────────────────────
	const projectRoot = path.resolve(__dirname, '..', '..', '..');
	const config = initConfig(projectRoot);

	// ─── questionnaire tool — LLM-callable ──────────────────────────

	const QuestionOptionSchema = Type.Object({
		value: Type.String({ description: "Value returned when selected" }),
		label: Type.String({ description: "Display label" }),
		description: Type.Optional(Type.String({ description: "Hint shown below the label" })),
		recommended: Type.Optional(Type.Boolean({ description: "Flag this option as AI-recommended" })),
	});

	const QuestionSchema = Type.Object({
		id: Type.String({ description: "Unique question identifier" }),
		label: Type.Optional(Type.String({ description: "Short tab label (defaults to Q1, Q2…)" })),
		prompt: Type.String({ description: "Full question text" }),
		type: Type.Union(
			[Type.Literal("single_choice"), Type.Literal("multi_select"), Type.Literal("free_text")],
			{ description: "Question type" },
		),
		options: Type.Optional(Type.Array(QuestionOptionSchema, { description: "Options for choice questions" })),
		allowOther: Type.Optional(Type.Boolean({ description: "Show 'Type something…' option (single_choice, default true)" })),
		placeholder: Type.Optional(Type.String({ description: "Editor placeholder for free_text" })),
	});

	pi.registerTool({
		name: "prj_questionnaire",
		label: "Questionnaire",
		description:
			"Ask the user one or more questions interactively. Supports single_choice (pick one), multi_select (pick many), and free_text (type answer). For a single question shows a simple list; for multiple questions shows a tabbed interface with a submit page.",
		parameters: Type.Object({
			questions: Type.Array(QuestionSchema, { description: "Questions to ask" }),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (!ctx.hasUI) {
				return {
					content: [{ type: "text", text: "Error: UI not available (non-interactive mode)" }],
					details: { answers: [], cancelled: true } as QuestionnaireResult,
				};
			}

			const questions = params.questions as QuestionDef[];
			if (questions.length === 0) {
				return {
					content: [{ type: "text", text: "Error: No questions provided" }],
					details: { answers: [], cancelled: true } as QuestionnaireResult,
				};
			}

			const result = await runQuestionnaire(ctx, questions);

			if (result.cancelled) {
				return {
					content: [{ type: "text", text: "User cancelled the questionnaire." }],
					details: result,
				};
			}

			const answerLines = result.answers.map((a) => {
				const prefix = a.wasCustom ? "(wrote)" : "(selected)";
				let line = `${a.id} ${prefix}: ${a.display}`;
				if (a.comment) {
					line += ` [comment: ${a.comment}]`;
				}
				return line;
			});

			return {
				content: [{ type: "text", text: answerLines.join("\n") }],
				details: result,
			};
		},

		renderCall(args, theme) {
			const qs = (args.questions as any[]) ?? [];
			let text = theme.fg("toolTitle", theme.bold("questionnaire "));
			text += theme.fg("muted", `${qs.length} question${qs.length !== 1 ? "s" : ""}`);
			const labels = qs.map((q: any) => q.label || q.id).join(", ");
			if (labels) {
				text += theme.fg("dim", ` (${truncateToWidth(labels, 40)})`);
			}
			return new Text(text, 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as QuestionnaireResult | undefined;
			if (!details) {
				const t = result.content[0];
				return new Text(t?.type === "text" ? t.text : "", 0, 0);
			}
			if (details.cancelled) {
				return new Text(theme.fg("warning", "Cancelled"), 0, 0);
			}
			const lines = details.answers.map((a) => {
				const icon = theme.fg("success", "✓ ");
				const label = theme.fg("accent", a.id);
				const val = a.wasCustom ? `${theme.fg("dim", "(wrote) ")}${a.display}` : a.display;
				let line = `${icon}${label}: ${val}`;
				if (a.comment) {
					line += `\n   ${theme.fg("dim", "comment:")} ${theme.fg("muted", a.comment)}`;
				}
				return line;
			});
			return new Text(lines.join("\n"), 0, 0);
		},
	});

	// ─── ⚠️ DEBUG TOOLS — remove before production (see _DEBUG_TOOLS.ts) ───
	registerDebugTools(pi, projectRoot);
}
