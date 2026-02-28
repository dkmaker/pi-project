# Questionnaire Widget — Agent Guide

A generic, reusable TUI questionnaire component for the pi-project-framework extension. Used anywhere the extension needs structured input from the user — the Phase 1 interview, phase gate checks, task clarifications, etc.

---

## What It Does

Presents the user with one or more questions in an interactive TUI widget (via `ctx.ui.custom()`). Supports three question types and returns structured answers.

| Type | Behavior | User interaction |
|------|----------|-----------------|
| `single_choice` | Pick one option from a list | ↑↓ navigate, Enter select. Optional "Type something…" opens an editor for a custom answer. |
| `multi_select` | Check one or more options | ↑↓ navigate, Space toggle ☑/☐, Enter confirm. Includes a 💬 Comment field at the bottom for annotating selections. |
| `free_text` | Type a free-form answer | Enter opens the editor, Enter again submits. |

**Single question** → shows a simple options list, confirms immediately on selection.  
**Multiple questions** → shows a tab bar with ■/□ progress, Tab/←→ to switch, plus a Submit tab with review page.

Options can be flagged `recommended: true` by the AI — shown as `★ recommended` in the UI.

---

## File Structure

```
questionnaire/
├── AGENTS.md        ← You are here
├── index.ts         ← Public exports (re-exports types + runQuestionnaire)
├── types.ts         ← All public types, interfaces, and normalize()
├── state.ts         ← QuestionnaireState class — all mutable state + state queries
├── input.ts         ← Keyboard input routing — maps keys to state transitions
├── renderer.ts      ← Builds TUI string[] output from state (pure read, no mutation)
└── run.ts           ← Glue — creates state + editor, wires input/render via ctx.ui.custom()
```

### Dependency flow

```
index.ts  ←  external callers import from here
  │
  └─► run.ts  (orchestrator)
        ├─► types.ts    (normalize)
        ├─► state.ts    (QuestionnaireState)
        ├─► input.ts    (handleInput)
        └─► renderer.ts (renderQuestionnaire)
```

- `types.ts` has no internal imports — it's the leaf.
- `state.ts` imports only from `types.ts`.
- `input.ts` imports from `types.ts` and `state.ts`.
- `renderer.ts` imports from `state.ts` (reads state, never mutates it).
- `run.ts` imports everything and wires them together.

---

## Key Types

### Input

```typescript
interface QuestionDef {
  id: string;            // unique key for the answer
  label?: string;        // tab bar label (defaults to Q1, Q2…)
  prompt: string;        // question text shown to user
  type: "single_choice" | "multi_select" | "free_text";
  options?: QuestionOption[];  // for choice types
  allowOther?: boolean;        // single_choice: show "Type something…" (default true)
  placeholder?: string;        // free_text: editor placeholder
}

interface QuestionOption {
  value: string;
  label: string;
  description?: string;   // hint shown below the label
  recommended?: boolean;  // AI-recommended flag → shows ★
}
```

### Output

```typescript
interface QuestionnaireResult {
  answers: QuestionAnswer[];
  cancelled: boolean;          // true if user pressed Esc
}

interface QuestionAnswer {
  id: string;
  type: QuestionType;
  value: string;               // the raw value(s)
  display: string;             // human-readable summary
  wasCustom: boolean;          // true if typed, not selected
  selectedValues?: string[];   // multi_select: all checked values
  comment?: string;            // multi_select: user's annotation
}
```

---

## How To Call It

```typescript
import { runQuestionnaire, type QuestionDef } from "./src/widgets/questionnaire/index";

const questions: QuestionDef[] = [
  { id: "name", prompt: "Project name?", type: "free_text" },
  {
    id: "env", prompt: "Target?", type: "single_choice",
    options: [
      { value: "web", label: "Web", recommended: true },
      { value: "cli", label: "CLI" },
    ],
  },
];

const result = await runQuestionnaire(ctx, questions);
if (!result.cancelled) {
  // result.answers has the structured data
}
```

---

## How To Modify

### Adding a new question type

1. Add the type string to `QuestionType` union in `types.ts`.
2. Add any new fields to `QuestionDef` and `QuestionAnswer` in `types.ts`.
3. Add state management (if needed) in `state.ts`.
4. Add key handling for the new type in `input.ts` — follow the existing `if (q.type === "...")` pattern.
5. Add rendering in `renderer.ts` — add a new `renderXxx()` function and call it from `renderQuestionnaire()`.
6. If the new type uses the editor, wire `editor.onSubmit` in `run.ts`.

### Changing the visual layout

All rendering lives in `renderer.ts`. Each section (tab bar, submit tab, free text, choice options, comment field, help line) is a separate function. Edit the one you need.

### Changing keyboard behavior

All key routing lives in `input.ts`. The `handleInput()` function checks editor focus first, then tab navigation, then per-question-type keys. State transitions call methods on `QuestionnaireState`.

### Adding new state

Add fields and methods to the `QuestionnaireState` class in `state.ts`. The renderer reads state but never mutates it. Input handling mutates state then calls `refresh()`.
