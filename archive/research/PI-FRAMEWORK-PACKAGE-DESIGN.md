# Pi Framework Package — Full Design Document

> **Purpose of this document:** Complete, self-contained specification to build `pi-project-framework` from a cold context. Includes all research findings, Pi API references with real examples pulled from source, framework entity mapping, architecture decisions, and implementation notes. Read this before writing a single line of code.

---

## 1. What We Are Building

A **Pi package** (`pi-project-framework`) installable directly from GitHub:

```bash
pi install git:github.com/YOUR_ORG/pi-project-framework
# or project-scoped:
pi install -l git:github.com/YOUR_ORG/pi-project-framework
```

The package brings the **AI-Optimized Project Management Framework** (defined in `FRAMEWORK/`) to life as a first-class Pi capability. It contains:

| Layer | Contents |
|-------|----------|
| **Extension** | All hooks, tools, commands, subagent pipelines, interview widget |
| **Skill** | Master SKILL.md with complete framework knowledge |
| **package.json** | Pi package descriptor wiring everything together |

The framework source lives in `FRAMEWORK/` in any project that uses it. The package reads/writes those files. The package itself is framework-agnostic code — the `FRAMEWORK/` files are the project's data.

---

## 2. The Framework in One Page

Source: `FRAMEWORK/INDEX.md`, `FRAMEWORK/lifecycle.md`, `FRAMEWORK/AGENTS.md`

### Core Principle
**Nothing lives in chat history.** Every decision, blocker, question, pattern, risk, and scope change is written to a file. An AI agent must be able to resume any project cold from files alone.

### Entity Hierarchy
```
Project
├── Stage: uninitialised | phase_1 | phase_2 | phase_3 | phase_4 | complete | abandoned | on_hold
├── Mode:  normal | change_management | infeasibility_review | phase_gate | awaiting_specialist
├── Goals
├── Project Resources (Tech Stack, Docs, Rules, Conventions)
├── Milestones → Epics → Tasks
│   ├── Subtasks
│   ├── Blockers
│   ├── Dependencies
│   ├── Pattern Contracts  (establishes; status: draft/established/changed/superseded)
│   ├── Pattern Dependencies (relies on; with Needs Review propagation)
│   ├── Verifications (with attempt history + failure recovery loop)
│   └── Work Intervals ← written by extension via agent_start/agent_end hooks
├── Risk Register
├── Change Requests → Scope Changes
└── Session Log (ordered, most recent = cold-start anchor)
    └── Phase Completion Records (gate between phases; gate status: passed | not passed)

Questions (with Session Count, Escalation at count ≥ 3, auto-Blocker on Active tasks)
Decisions
```

### Four Phases
```
Phase 1: Interview        → Project entity + Resources
Phase 2: Epic Planning    → Epics + Milestones + Goals structure
Phase 3: Task Research    → Full task graph with Context + Research Date
Phase 4: Implementation   → Execute against entity model
```

Each phase ends with a **Phase Completion Record** (a special Session Log entry) with a gate checklist. The next phase reads the gate first — `gate status: passed` required, or it stops.

**Context resets between phases** are mandatory — conversation is noise once structured files exist.

### Cold-Start Protocol (what an agent does on session start)
1. Read `Project.stage` + `Project.mode` (first, always)
2. For Phase 4 resume: read most recent Session Log entry → Active Task + Exact State → resume
3. For Phase 4 first session: run Phase 4 Bootstrap (read PCR → read Project → read Epics → select task → load task fully → check Research Date staleness → create Session Log entry → begin)
4. For Phase 1/2/3: read the relevant Phase Completion Record to confirm prior phase passed

### Work Interval Recording (from `FRAMEWORK/tracking.md`)
> "A Work Interval is recorded **automatically by the extension** using the `agent_start` and `agent_end` hooks — not by the agent itself."

Fields: Interval ID, Session ID, Started At, Ended At, Active Duration, Model, Provider, Tokens In, Tokens Out, Estimated Cost, Trigger.

### Task Status Values
| Status | Meaning |
|--------|---------|
| ⏳ Pending | Defined, not started |
| 🔄 Active | Being worked on |
| ⛔ Blocked | Has explicit Blocker record |
| ⚠️ Needs Review | Upstream Pattern Contract changed |
| 👀 In Review | Done, awaiting human review |
| ✅ Done | Complete, verified, committed |
| ❌ Cancelled | Won't do — rationale recorded |

---

## 3. Pi Package System — How It Works

Source: Pi docs `packages.md`

### package.json structure
```json
{
  "name": "pi-project-framework",
  "version": "1.0.0",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills":     ["./skills"],
    "prompts":    ["./prompts"]
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*"
  }
}
```

- `extensions`, `skills`, `prompts`, `themes` paths support **globs** and `!exclusions`
- Core Pi packages go in `peerDependencies` with `"*"` — never in `dependencies`
- Tools are registered **inside extensions** via `pi.registerTool()` — not a top-level resource

### Install targets
```bash
pi install git:github.com/user/repo        # latest
pi install git:github.com/user/repo@v1.2   # pinned
pi install -l git:github.com/user/repo     # project-scoped (.pi/settings.json)
pi install ./local/path                    # local dev
pi -e git:github.com/user/repo             # try without installing
```

### Project-scoped install (recommended for this package)
Use `-l` so the package auto-installs for all teammates on project startup. Lives in `.pi/settings.json`.

---

## 4. Pi Extension API — Complete Reference

Source: Pi docs `extensions.md`, actual source at `/usr/lib/node_modules/@mariozechner/pi-coding-agent/`

### Entry Point
```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // register hooks, tools, commands here
}
```

### All Events (`pi.on(event, handler)`)

#### Session Events
```typescript
pi.on("session_start", async (event, ctx) => {
  // Fires once on startup. Read Project.stage + mode here.
  // Inject status widget, run cold-start protocol.
  ctx.ui.setStatus("framework", "[Phase 4 | Normal | T-023]");
});

pi.on("session_before_switch", async (event, ctx) => {
  // /new or /resume — can cancel: return { cancel: true, reason: "..." }
});

pi.on("session_shutdown", async (event, ctx) => {
  // Ctrl+C, Ctrl+D, SIGTERM. Prompt session log write.
});

pi.on("session_before_compact", async (event, ctx) => {
  // Return custom summary to preserve framework state through compaction:
  return { summary: buildFrameworkSummary() };
  // Without this, compaction loses Active Task / Exact State context.
});
```

#### Agent Events
```typescript
pi.on("before_agent_start", async (event, ctx) => {
  // After user submits prompt, before agent loop.
  // CAN inject messages and modify system prompt:
  return {
    messages: [{ role: "user", content: "## Framework State\n..." }],
    systemPrompt: event.systemPrompt + "\n\n" + frameworkConventions,
  };
});

pi.on("agent_start", async (event, ctx) => {
  // Record Work Interval start timestamp
  workIntervalStart = Date.now();
  workIntervalSessionId = ctx.sessionManager.getSessionId();
  workIntervalTrigger = "user-prompt";
});

pi.on("agent_end", async (event, ctx) => {
  // Record Work Interval end, calculate duration, write to task's Work Log
  const duration = Date.now() - workIntervalStart;
  const usage = ctx.getContextUsage(); // { tokens: number }
  await writeWorkInterval({
    startedAt: workIntervalStart,
    endedAt: Date.now(),
    activeDuration: duration,
    model: ctx.model,
    tokensIn: usage?.tokens ?? 0,
    // ... write to FRAMEWORK/work-log/{taskId}.md
  });
});

pi.on("turn_start", async (event, ctx) => { /* each LLM response cycle */ });
pi.on("turn_end",   async (event, ctx) => { });
```

#### Tool Events
```typescript
pi.on("tool_call", async (event, ctx) => {
  // Intercept ANY tool call. Block or allow.
  // event.toolName, event.args available
  
  // Example: warn when writing to file outside task's Affected Files
  if (event.toolName === "write" || event.toolName === "edit") {
    const path = event.args.path as string;
    const activeTask = await readActiveTask();
    if (activeTask && !isInAffectedFiles(path, activeTask)) {
      ctx.ui.notify(
        `⚠️ ${path} is not in T-${activeTask.id}'s Affected Files scope`,
        "warning"
      );
      // Don't block — just warn. Return nothing to allow.
    }
  }

  // Block: return { block: true, reason: "..." }
});

pi.on("tool_execution_start", async (event, ctx) => { });
pi.on("tool_execution_end",   async (event, ctx) => {
  // After a read/write completes — annotate with framework context
  if (event.toolName === "read") {
    const relatedTasks = await findTasksByFile(event.args.path);
    if (relatedTasks.length > 0) {
      // Could inject a message or just log
    }
  }
});
```

#### Other Events
```typescript
pi.on("context", async (event, ctx) => {
  // Fires before each LLM call. Modify/filter messages non-destructively.
  // Good for compact framework state header injection.
});

pi.on("model_select", async (event, ctx) => {
  // React to model changes — update Work Interval model field
});
```

### Registering Commands
```typescript
pi.registerCommand("prj-status", {
  description: "Show project dashboard: stage, mode, active task, open questions",
  getArgumentCompletions: (prefix) => [],
  handler: async (args, ctx) => {
    // Full dashboard rendering
    const state = await readProjectState();
    ctx.ui.notify(`Stage: ${state.stage} | Mode: ${state.mode}`, "info");
  },
});
```

### Registering Tools (LLM-callable)
```typescript
import { Type } from "@sinclair/typebox";

pi.registerTool({
  name: "prj_task_complete",
  label: "Complete Task",
  description: "Mark a task Done, write its Completion Record, aggregate Work Log. Call this when all subtasks are checked and verifications passed.",
  parameters: Type.Object({
    taskId: Type.String({ description: "Task ID, e.g. T-023" }),
    filesTouched: Type.Array(Type.String(), { description: "Actual files modified" }),
    linesAdded: Type.Number({ description: "Lines added" }),
    linesRemoved: Type.Number({ description: "Lines removed" }),
    learnings: Type.Optional(Type.String({ description: "Anything to feed back to Epic notes" })),
  }),
  execute: async (toolCallId, params, signal, onUpdate, ctx) => {
    // Write Completion Record, update task status, aggregate Work Log
    await writeCompletionRecord(params);
    return {
      content: [{ type: "text", text: `Task ${params.taskId} marked Done. Completion Record written.` }],
      details: {},
    };
  },
  renderCall(args, theme) {
    // How the tool call looks in Pi's UI
    return new Text(theme.fg("toolTitle", `Complete Task: ${args.taskId}`), 0, 0);
  },
  renderResult(result, opts, theme) {
    return new Text(theme.fg("success", "✓ " + result.content[0].text), 0, 0);
  },
});
```

### The `ctx` Object (ExtensionContext)
```typescript
ctx.model                          // current model name
ctx.sessionManager.getSessionId()  // UUID
ctx.sessionManager.getSessionName()
ctx.sessionManager.getCwd()        // working directory
ctx.sessionManager.getBranch()     // git branch entries
ctx.getContextUsage()              // { tokens: number } — last assistant usage
ctx.hasUI                          // boolean — false in non-interactive mode
ctx.ui.notify(msg, "info"|"warning"|"error")
ctx.ui.confirm(title, message)     // → Promise<boolean>
ctx.ui.select(title, options)      // → Promise<string | undefined>
ctx.ui.input(title, placeholder?, prefill?) // → Promise<string | undefined>
ctx.ui.setStatus(key, text)        // Persistent footer status entry
ctx.ui.setWidget(key, lines, placement?) // Widget above/below editor
ctx.ui.setHeader(lines)
ctx.ui.setFooter(lines)
ctx.ui.setEditorText(text)         // Pre-fill editor
ctx.ui.custom(factory, options?)   // Full custom TUI — see Section 5
ctx.modelRegistry.find(provider, model)
ctx.modelRegistry.getApiKey(model)
```

### Other `pi` Methods
```typescript
pi.registerShortcut(key, { handler })  // keyboard shortcut
pi.registerFlag(name, { handler })     // CLI flag
pi.setActiveTools(toolNames[])         // restrict available tools (e.g. plan mode)
pi.appendEntry(...)                    // persist state across restarts
```

---

## 5. The Custom TUI System — Complete Reference

Source: `/usr/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/@mariozechner/pi-tui/dist/index.d.ts` and `tui.d.ts`, plus the real working example at `examples/extensions/questionnaire.ts`

**This is NOT Ink/React.** It is `@mariozechner/pi-tui` — a custom class-based component system.

### Available Exports
```typescript
import {
  // Components
  Box, Container, Text, TruncatedText, Spacer, Markdown,
  SelectList, SettingsList, Input, Editor,
  Loader, CancellableLoader, Image,
  // Types
  type Component, type Focusable, type SelectItem,
  type EditorTheme, type SelectListTheme, type SettingsListTheme,
  // TUI
  TUI, CURSOR_MARKER,
  // Overlay types
  type OverlayOptions, type OverlayAnchor, type OverlayHandle,
  type SizeValue,
  // Keys
  Key, matchesKey, parseKey, isKeyRelease, isKeyRepeat,
  // Utils
  truncateToWidth, visibleWidth, wrapTextWithAnsi,
  // Fuzzy
  fuzzyFilter, fuzzyMatch,
} from "@mariozechner/pi-tui";
```

### Component Interface
```typescript
interface Component {
  render(width: number): string[];  // return array of strings, one per line
  handleInput?(data: string): void; // keyboard input (string, not Buffer)
  wantsKeyRelease?: boolean;        // true to receive key release events
  invalidate(): void;               // clear render cache
}
```

### Container
```typescript
// Renders children vertically in sequence
const container = new Container();
container.addChild(new Text("hello", 0, 0));
container.addChild(new Spacer()); // pushes things apart
container.render(width);          // string[]
container.invalidate();
container.removeChild(component);
container.clear();
container.children;               // Component[]
```

### Box
```typescript
// Container with padding + optional background
// constructor(paddingX?: number, paddingY?: number, bgFn?: (text: string) => string)
const box = new Box(1, 0, (t) => theme.bg("customMessageBg", t));
box.addChild(new Text("content", 0, 0));
box.setBgFn((t) => theme.bg("selectedBg", t)); // update bg
```

### Text
```typescript
// constructor(content: string, paddingLeft: number, paddingTop: number)
new Text("plain text", 0, 0)
new Text(theme.fg("accent", theme.bold("styled")), 1, 0)
// Padding: paddingLeft adds spaces before content, paddingTop adds blank lines above
```

### SelectList
```typescript
// constructor(items, visibleCount, themeCallbacks)
const list = new SelectList(
  items,                           // SelectItem[] — { value, label, description? }
  Math.min(items.length, 10),      // visible rows
  {
    selectedPrefix: (t) => theme.fg("accent", t),
    selectedText:   (t) => theme.fg("accent", t),
    description:    (t) => theme.fg("muted", t),
    scrollInfo:     (t) => theme.fg("dim", t),
    noMatch:        (t) => theme.fg("warning", t),
  }
);
list.onSelect = (item: SelectItem) => { /* item.value, item.label */ };
list.onCancel = () => { };
list.handleInput(data);            // pass keyboard data here
```

### Key Constants and Matching
```typescript
// Key constants
Key.up, Key.down, Key.left, Key.right
Key.enter, Key.return    // both work
Key.escape, Key.tab
Key.backspace, Key.delete
Key.space
Key.shift("tab")         // shift+tab
Key.ctrl("c")            // ctrl+c

// Matching
matchesKey(data, Key.enter)        // boolean
matchesKey(data, Key.escape)
matchesKey(data, Key.up)
```

### Editor (for free-text input)
```typescript
import { Editor, type EditorTheme } from "@mariozechner/pi-tui";

const editorTheme: EditorTheme = {
  borderColor: (s) => theme.fg("accent", s),
  selectList: {
    selectedPrefix: (t) => theme.fg("accent", t),
    selectedText:   (t) => theme.fg("accent", t),
    description:    (t) => theme.fg("muted", t),
    scrollInfo:     (t) => theme.fg("dim", t),
    noMatch:        (t) => theme.fg("warning", t),
  },
};
const editor = new Editor(tui, editorTheme);
editor.onSubmit = (value: string) => { /* handle submission */ };
editor.setText("");
editor.handleInput(data);
editor.render(width);              // string[]
```

### ctx.ui.custom() — Full Custom TUI
```typescript
// Signature:
const result = await ctx.ui.custom<T>(
  (tui, theme, keybindings, done) => Component,
  options?: {
    overlay?: boolean;
    overlayOptions?: OverlayOptions;
    onHandle?: (handle: OverlayHandle) => void;
  }
);

// OverlayOptions:
// {
//   width?: number | "50%"       — width in cols or percentage
//   minWidth?: number
//   maxHeight?: number | "50%"
//   anchor?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
//             "top-center" | "bottom-center" | "left-center" | "right-center"
//   offsetX?: number             — positive = right
//   offsetY?: number             — positive = down
//   row?: number | "25%"
//   col?: number | "50%"
//   margin?: number | { top?, right?, bottom?, left? }
//   visible?: (termWidth, termHeight) => boolean
// }

// OverlayHandle (via onHandle callback):
// handle.hide()                  — permanently remove
// handle.setHidden(boolean)      — temporarily hide/show
// handle.isHidden()              → boolean
```

### Real Working Example: Questionnaire (the actual source)
> File: `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/questionnaire.ts`

This is the canonical reference for building complex custom TUI components. Key patterns from it:

```typescript
const result = await ctx.ui.custom<QuestionnaireResult>((tui, theme, _kb, done) => {
  // 1. State lives in closure
  let currentTab = 0;
  let optionIndex = 0;
  let cachedLines: string[] | undefined;

  // 2. Editor for free text
  const editor = new Editor(tui, editorTheme);
  editor.onSubmit = (value) => { /* save + advance */ };

  // 3. Helper to force re-render
  function refresh() {
    cachedLines = undefined;
    tui.requestRender();
  }

  // 4. Input handler — routes keys to state changes
  function handleInput(data: string) {
    if (matchesKey(data, Key.escape)) { done({ cancelled: true }); return; }
    if (matchesKey(data, Key.up))     { optionIndex--; refresh(); return; }
    if (matchesKey(data, Key.down))   { optionIndex++; refresh(); return; }
    if (matchesKey(data, Key.tab))    { currentTab++; refresh(); return; }
    if (matchesKey(data, Key.enter))  { /* select / submit */ }
    editor.handleInput(data); refresh();  // delegate to editor
  }

  // 5. Render — build string[] from state
  function render(width: number): string[] {
    if (cachedLines) return cachedLines;
    const lines: string[] = [];
    const add = (s: string) => lines.push(truncateToWidth(s, width));
    
    add(theme.fg("accent", "─".repeat(width)));        // divider
    add(theme.fg("text", " Question text here"));       // text
    lines.push("");                                      // blank line
    // options loop...
    add(theme.fg("dim", " ↑↓ navigate • Enter select")); // help
    add(theme.fg("accent", "─".repeat(width)));
    
    cachedLines = lines;
    return lines;
  }

  // 6. Return component object
  return {
    render,
    invalidate: () => { cachedLines = undefined; },
    handleInput,
  };
});
```

### Tab Bar Pattern (from questionnaire.ts)
```typescript
// Build tab bar with styled active/inactive/answered states
const tabs: string[] = ["← "];
for (let i = 0; i < questions.length; i++) {
  const isActive   = i === currentTab;
  const isAnswered = answers.has(questions[i].id);
  const text = ` ${isAnswered ? "■" : "□"} ${questions[i].label} `;
  const styled = isActive
    ? theme.bg("selectedBg", theme.fg("text", text))
    : theme.fg(isAnswered ? "success" : "muted", text);
  tabs.push(`${styled} `);
}
add(` ${tabs.join("")}`);
```

### Theme Color Keys (observed from examples)
```typescript
theme.fg("accent", text)
theme.fg("text", text)
theme.fg("muted", text)
theme.fg("dim", text)
theme.fg("success", text)
theme.fg("warning", text)
theme.fg("error", text)
theme.fg("toolTitle", text)
theme.fg("toolOutput", text)
theme.bg("selectedBg", text)
theme.bg("customMessageBg", text)
theme.bold(text)
theme.strikethrough(text)
```

---

## 6. Subagent System — How It Works

Source: `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/index.ts`

Subagents spawn **separate `pi` processes** — fully context-isolated. This is the mechanism for keeping the main agent's context clean during heavy work (decomposition, implementation, review).

### Three Modes
```typescript
// Single
{ agent: "scout", task: "find all auth-related code" }

// Parallel (max 8 tasks, max 4 concurrent)
{ tasks: [
  { agent: "scout", task: "find auth code" },
  { agent: "scout", task: "find database schema" },
]}

// Chain — {previous} passes output between steps
{ chain: [
  { agent: "scout",   task: "find code relevant to {previous}" },
  { agent: "planner", task: "create implementation plan based on: {previous}" },
  { agent: "worker",  task: "implement according to plan: {previous}" },
]}
```

### Agent Definition Files
Markdown files in `agents/` directory with YAML frontmatter:
```markdown
---
name: worker
description: General-purpose agent, executes implementation tasks autonomously
model: claude-sonnet-4-5
---

You are a worker agent. Work autonomously to complete the assigned task.
Output a JSON object: { "result": "...", "summary": "..." }
```

Built-in agent types: `scout` (fast recon), `planner` (makes plans), `worker` (implements), `reviewer` (code review).

### Chain Pipelines
Defined as prompt template files in `prompts/`:
```markdown
# implement
scout → planner → worker
```

### How Spawning Works
```typescript
import { spawn } from "node:child_process";
// Each subagent = spawn("pi", ["--json", "--agent", agentFile, "--task", task])
// JSON mode captures structured output
// {previous} replaced with output of prior chain step
```

---

## 7. Framework → Pi Touchpoint Map

This is the core integration design. Every framework requirement maps to a Pi API touchpoint.

### 7.1 Session Start — Cold-Start Protocol

**Framework requirement** (`FRAMEWORK/AGENTS.md`): Agent reads `Project.stage` + `Project.mode` first. Then Session Log. Then loads active task context.

**Pi hook:** `session_start` + `before_agent_start`

```typescript
pi.on("session_start", async (event, ctx) => {
  const cwd = ctx.sessionManager.getCwd();
  const frameworkPath = path.join(cwd, "FRAMEWORK");
  
  if (!fs.existsSync(frameworkPath)) return; // not a framework project
  
  const state = await readProjectState(frameworkPath);
  
  // Status widget — always visible
  ctx.ui.setStatus("prj", `[${state.stage} | ${state.mode} | ${state.activeTaskId ?? "—"}]`);
  
  // Escalated question warnings
  const escalated = state.questions.filter(q => q.sessionCount >= 3 && q.status === "open");
  for (const q of escalated) {
    ctx.ui.notify(`⚠️ Question ${q.id} escalated (${q.sessionCount} sessions open): ${q.description}`, "warning");
  }
});

pi.on("before_agent_start", async (event, ctx) => {
  const state = await readProjectState(cwd);
  if (!state) return;
  
  // Inject compact framework state into every agent turn
  const header = buildFrameworkStateHeader(state); // markdown string
  return {
    messages: [{ role: "user", content: header }],
  };
});
```

### 7.2 Work Interval Tracking

**Framework requirement** (`FRAMEWORK/tracking.md`): "Recorded automatically by the extension using `agent_start` and `agent_end` hooks — not by the agent itself."

**Pi hooks:** `agent_start` + `agent_end`

```typescript
let intervalStart: number;
let intervalSessionId: string;

pi.on("agent_start", async (event, ctx) => {
  intervalStart = Date.now();
  intervalSessionId = ctx.sessionManager.getSessionId();
});

pi.on("agent_end", async (event, ctx) => {
  const activeTaskId = await readActiveTaskId(ctx.sessionManager.getCwd());
  if (!activeTaskId) return;
  
  const usage = ctx.getContextUsage();
  const duration = Date.now() - intervalStart;
  
  await appendWorkInterval(activeTaskId, {
    intervalId: generateId(),
    sessionId: intervalSessionId,
    startedAt: intervalStart,
    endedAt: Date.now(),
    activeDuration: duration,
    model: ctx.model ?? "unknown",
    tokensIn: usage?.tokens ?? 0,
    estimatedCost: calculateCost(ctx.model, usage?.tokens ?? 0),
    trigger: "user-prompt",
  });
});
```

### 7.3 Context Preservation Through Compaction

**Framework requirement:** After compaction, agent must still know Active Task, Exact State, open Questions.

**Pi hook:** `session_before_compact`

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  const state = await readProjectState(ctx.sessionManager.getCwd());
  if (!state) return;
  
  return {
    summary: buildFrameworkCompactionSummary(state),
    // Returns a markdown string that replaces the compacted context block
  };
});

function buildFrameworkCompactionSummary(state: ProjectState): string {
  return `
## Framework State (preserved through compaction)
- Stage: ${state.stage} | Mode: ${state.mode}
- Active Task: ${state.activeTaskId} — ${state.activeTaskName}
- Exact State: ${state.exactState}
- Open Questions: ${state.openQuestions.length} (${state.escalatedCount} escalated)
- Pending Reviews: ${state.pendingReviews.join(", ")}
- Next Actions: ${state.nextActions.join(", ")}
`;
}
```

### 7.4 File Scope Awareness

**Framework requirement:** Agent should stay within task's Affected Files scope. Pattern Contract changes must propagate `⚠️ Needs Review`.

**Pi hook:** `tool_call`

```typescript
pi.on("tool_call", async (event, ctx) => {
  const writingTools = ["write", "edit"];
  
  if (writingTools.includes(event.toolName)) {
    const filePath = event.args.path as string;
    const task = await readActiveTaskFull(cwd);
    
    if (task && !isAffectedFile(filePath, task.affectedFiles)) {
      ctx.ui.notify(
        `⚠️ ${path.basename(filePath)} not in ${task.id}'s Affected Files — confirm intentional`,
        "warning"
      );
    }
    
    // Check if this is a Pattern Contract file
    if (isPatternContractFile(filePath, task)) {
      ctx.ui.notify(
        `📋 Writing to Pattern Contract file — downstream tasks will need Needs Review check`,
        "warning"
      );
    }
  }
});
```

### 7.5 Session End — Log Update Prompt

**Pi hook:** `session_shutdown`

```typescript
pi.on("session_shutdown", async (event, ctx) => {
  if (!ctx.hasUI) return;
  const state = await readProjectState(cwd);
  if (!state || state.stage === "uninitialised") return;
  
  const shouldLog = await ctx.ui.confirm(
    "Session ending",
    "Update Session Log with current Exact State before exiting?"
  );
  // If yes: the agent should call prj_session_end tool, or we write a stub
});
```

---

## 8. All Slash Commands (`/prj-` prefix)

All commands use `pi.registerCommand("prj-<name>", {...})`.

| Command | Description |
|---------|-------------|
| `/prj-status` | Dashboard: stage, mode, active task, questions count, pending reviews, cost summary |
| `/prj-tasks` | Task table for active epic (ID, name, status, priority, estimate) |
| `/prj-task <id>` | Full task detail: all fields, subtask checklist, blockers, dependencies |
| `/prj-epic <id>` | Epic detail + full task list with statuses |
| `/prj-session` | Current Session Log entry (Active Task, Exact State, Next Actions) |
| `/prj-questions` | All open Questions; escalated ones highlighted |
| `/prj-blockers` | All active Blockers across all tasks |
| `/prj-review` | All tasks in ⚠️ Needs Review status |
| `/prj-risks` | Risk Register |
| `/prj-decisions` | Decision log |
| `/prj-changes` | Change Requests and Scope Changes |
| `/prj-cost` | Time & cost summary (aggregated Work Intervals by task, epic, model) |
| `/prj-init` | Launch Phase 1 interview (interactive widget + subagent pipeline) |
| `/prj-gate` | Run Phase Completion Record gate check for current phase |
| `/prj-subagent <pipeline> [taskId]` | Launch a subagent pipeline |
| `/prj-compact` | Manually trigger a framework-aware compaction summary |

---

## 9. All LLM-Callable Tools (`prj_*`)

All tools are registered via `pi.registerTool()`. The LLM calls these to interact with the framework. All have `renderCall` and `renderResult` for clean Pi UI display.

### Session Tools
```
prj_session_start(stage, mode, activeTaskId, exactState, nextActions[])
  → Creates new Session Log entry

prj_session_end(activeTaskId, exactState, completedThisSession[], nextActions[], openQuestions[], gitState)
  → Writes final Session Log entry

prj_phase_gate_check(phase)
  → Reads Phase Completion Record, validates all checklist items, reports pass/fail with specifics
```

### Task Lifecycle Tools
```
prj_task_activate(taskId)
  → Set task to 🔄 Active, validate preconditions (no blockers, dependencies met), update Session Log

prj_task_block(taskId, blockerType, description, resolutionPath)
  → Create Blocker record, set task to ⛔ Blocked

prj_task_complete(taskId, filesTouched[], linesAdded, linesRemoved, commitRef?, learnings?)
  → Mark task 👀 In Review, write Completion Record, aggregate Work Log
  → If task has Pattern Contracts: update status to 'established', propagate ⚠️ Needs Review to dependents

prj_task_review_outcome(taskId, outcome: "approved"|"accepted_with_notes"|"minor_revision"|"significant_rework", notes?)
  → Approved: ✅ Done
  → Accepted with Notes: ✅ Done + update Convention if project-wide learning
  → Minor Revision: back to 🔄 Active, bounded revision scope
  → Significant Rework: either back to Active with Blocker, or Done + new corrective Task
```

### Entity Creation Tools
```
prj_decision_record(title, context, decision, rationale, consequences, affectedTasks[])
  → Create Decision entity with D-XXX ID

prj_question_create(description, impact, options[], owner)
  → Create Question entity with Q-XXX ID, Impact must reference Task/Epic IDs where relevant

prj_question_resolve(questionId, resolution, resultingDecisionId?, resultingScopeChangeId?)
  → Resolve Question, close auto-generated Blockers if any exist

prj_risk_add(description, probability, impact, mitigation, affectedTasks[])
  → Add Risk to Risk Register

prj_change_request(title, description, scope, affectedEntities[], rationale)
  → Create Change Request (enters change_management mode)

prj_verification_record(taskId, verificationType, source, result: "passed"|"failed", notes)
  → Record Verification attempt. If failed: trigger Verification Failure Recovery Loop
```

### Pattern Contract Tools
```
prj_pattern_contract_update(taskId, contractId, newDefinition, changeDescription)
  → Update Pattern Contract, set status to 'changed'
  → Find all tasks with Pattern Dependencies on this contract
  → Set them to ⚠️ Needs Review with version diff populated
  → Return list of affected downstream tasks

prj_needs_review_resolve(taskId, outcome: "no_impact"|"context_update"|"significant_rework", notes)
  → Run Needs Review Resolution Process
  → no_impact: return to ⏳ Pending
  → context_update: update task Context, return to ⏳ Pending  
  → significant_rework: create new Task via Task Addition Process
```

### Query Tools
```
prj_status_read()
  → Full project state: stage, mode, active task, all task statuses, open questions, risks, cost

prj_task_read(taskId)
  → Full task entity: all fields, subtasks with done/not-done, blockers, dependencies, verifications

prj_work_log_summary(taskId?)
  → Aggregated Work Intervals for task or whole project: total time, cost, model breakdown
```

---

## 10. Interview System — Custom TUI Widget

### Architecture
The Phase 1 interview is the most complex interactive element. It runs as:
1. **Command** `/prj-init` triggers it
2. **Custom TUI widget** (`ctx.ui.custom()`) collects answers interactively
3. **Subagent pipeline** synthesizes answers into framework entity files (context-isolated)

### Widget Design
Based directly on the `questionnaire.ts` pattern. Extended for multi-select and progress.

```
┌──────────────────────────────────────────────────────────────────┐
│  ─────────────────────────────────────────────────────────────── │
│  PROJECT INTERVIEW · Phase 1 · 3 of 7                           │
│  [■ Vision] [■ Scope] [□ Target] [□ Stack] [□ Resources]        │
│  [□ Constraints] [□ Review] [✓ Submit]                          │
│                                                                  │
│  What is the target environment for this project?               │
│                                                                  │
│  > 1. Web application (browser)                                 │
│    2. Mobile app (iOS/Android)                                  │
│    3. API / Backend service only                                │
│    4. CLI tool                                                  │
│    5. Desktop application                                       │
│    6. Hybrid (select above + describe)                          │
│    7. Type something...                                         │
│                                                                  │
│  ↑↓ navigate · Enter select · Tab next · Esc cancel            │
│  ─────────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────────┘
```

### Multi-Select Widget
Pi's built-in `ctx.ui.select()` is single-choice only. For multi-select (e.g., "which tech categories apply?") we build a custom component using the same `ctx.ui.custom()` pattern but with a checkbox state map:

```typescript
// Multi-select state pattern
const checked = new Map<number, boolean>();
// Space = toggle, Enter = confirm selection, Esc = cancel
// Render: ☑ checked items, ☐ unchecked
// Confirm button at bottom: "[ Confirm X selected ]"
```

### Interview Question Definitions
Each phase has a defined question set in `interview/questions.ts`:

**Phase 1 Questions:**
```typescript
[
  {
    id: "vision", label: "Vision",
    prompt: "Tell me what you want to build.",
    type: "free_text"  // → Editor component
  },
  {
    id: "target_env", label: "Target",
    prompt: "What is the target environment?",
    type: "single_choice",
    options: ["Web app", "Mobile", "API/Backend", "CLI", "Desktop", "Other"]
  },
  {
    id: "tech_categories", label: "Stack",
    prompt: "Which technology categories does this project need? (select all that apply)",
    type: "multi_select",
    options: ["Frontend", "Backend", "Database", "Auth", "Storage", "Deployment/CI", "Mobile", "AI/ML"]
  },
  {
    id: "timeline", label: "Constraints",
    prompt: "What are the hard constraints? (time, budget, must-use tech)",
    type: "free_text"
  },
  // ... etc per lifecycle.md Phase 1 requirements
]
```

### Interview → Subagent Pipeline
After widget collects all answers:
```typescript
// Spawn synthesis subagent with answers as context
await runSubagentChain([
  { agent: "framework-interviewer", task: buildSynthesisPrompt(answers) },
  // Agent writes framework entities to disk:
  // FRAMEWORK/project.md (Project entity)
  // FRAMEWORK/tech-stack.md (Tech Stack entries)
  // FRAMEWORK/session-log.md (Phase 1 Session Log entry)
]);
// Main context untouched
```

---

## 11. Subagent Pipelines

### Framework-Specific Agents

| Agent | File | Model | Purpose |
|-------|------|-------|---------|
| `framework-scout` | `agents/framework-scout.md` | haiku/flash | Read framework files + active task, return compressed brief |
| `framework-planner` | `agents/framework-planner.md` | sonnet | Produce implementation plan for a task |
| `framework-worker` | `agents/framework-worker.md` | sonnet | Execute task autonomously |
| `framework-reviewer` | `agents/framework-reviewer.md` | sonnet | Review completed task against Completion Record |
| `framework-decomposer` | `agents/framework-decomposer.md` | sonnet | Decompose Epic into Tasks (Phase 3) |
| `framework-gate-checker` | `agents/framework-gate-checker.md` | haiku | Validate Phase Completion Record checklist |
| `framework-risk-scanner` | `agents/framework-risk-scanner.md` | haiku | Scan tasks/decisions for unrecorded risks |
| `framework-stale-checker` | `agents/framework-stale-checker.md` | haiku | Find tasks with stale Research Dates |
| `framework-interviewer` | `agents/framework-interviewer.md` | sonnet | Synthesize interview answers → entity files |

### Pipelines

| Pipeline | Chain | Trigger |
|----------|-------|---------|
| `implement` | scout → planner → worker | `/prj-subagent implement T-023` |
| `decompose` | scout → decomposer | `/prj-subagent decompose E-04` |
| `review` | reviewer | `/prj-subagent review T-023` |
| `gate-check` | gate-checker | `/prj-gate` |
| `risk-scan` | risk-scanner | `/prj-subagent risk-scan` |
| `stale-check` | stale-checker | `/prj-subagent stale-check` |
| `session-summary` | scout (summary mode) | session_shutdown |

---

## 12. The Skill File

Source: Pi docs `skills.md` — skills are Markdown files, progressively disclosed (name+description at startup, full content on demand via `read`).

**Location in package:** `skills/FRAMEWORK-SKILL.md`

### Skill Structure
```markdown
# pi-project-framework

Description: Complete AI-Optimized Project Management Framework. Covers the four-phase lifecycle (Interview → Planning → Decomposition → Implementation), all entity types, status transitions, cold-start protocol, dead-end handling, and all available tools and commands. Load this skill when working on any project managed with this framework.

## Cold-Start Protocol
[Stage + Mode decision table]
[Phase-specific entry sequence]

## Entity Reference
[All entities, all fields — condensed from 14 framework docs]

## Status Transitions
[Complete task status transition table from reference.md]

## Phase Completion Records
[All phase checklists]

## Dead-End Handling
- Infeasibility exit (Phase 1)
- Abandonment protocol (any entity)
- Blocked task resolution paths
- Verification failure recovery loop
- Question escalation + auto-Blocker generation

## Pattern Contract Propagation
[Full Needs Review process]

## Available Tools
[All prj_* tools with descriptions]

## Available Commands
[All /prj-* commands]

## Subagent Pipelines
[How to invoke, what each does]
```

---

## 13. Package File Structure

```
pi-project-framework/
├── package.json                    # pi package descriptor
├── tsconfig.json
├── README.md
│
├── extensions/
│   └── index.ts                   # Entry point — registers all hooks, tools, commands
│
├── src/
│   ├── hooks/
│   │   ├── session-start.ts       # Cold-start: detect project, read state, set status widget
│   │   ├── before-agent-start.ts  # Inject framework state header into every agent turn
│   │   ├── tool-intercept.ts      # File scope warnings, Pattern Contract watch
│   │   ├── work-interval.ts       # agent_start/end → Work Interval recording
│   │   ├── session-end.ts         # session_shutdown → prompt for Session Log update
│   │   └── compact-summary.ts     # session_before_compact → custom framework summary
│   │
│   ├── tools/
│   │   ├── session-tools.ts       # prj_session_start, prj_session_end, prj_phase_gate_check
│   │   ├── task-tools.ts          # prj_task_activate, prj_task_block, prj_task_complete, prj_task_review_outcome
│   │   ├── entity-tools.ts        # prj_decision_record, prj_question_*, prj_risk_add, prj_change_request, prj_verification_record
│   │   ├── pattern-tools.ts       # prj_pattern_contract_update, prj_needs_review_resolve
│   │   └── query-tools.ts         # prj_status_read, prj_task_read, prj_work_log_summary
│   │
│   ├── commands/
│   │   ├── dashboard.ts           # /prj-status
│   │   ├── tasks.ts               # /prj-tasks, /prj-task, /prj-epic
│   │   ├── session.ts             # /prj-session, /prj-questions, /prj-blockers, /prj-review
│   │   ├── tracking.ts            # /prj-cost
│   │   ├── process.ts             # /prj-risks, /prj-decisions, /prj-changes, /prj-gate, /prj-compact
│   │   ├── interview.ts           # /prj-init
│   │   └── subagent-cmd.ts        # /prj-subagent
│   │
│   ├── interview/
│   │   ├── orchestrator.ts        # Interview flow controller (coordinates widget + subagent)
│   │   ├── questions.ts           # Question definitions per phase (Phase 1 full set)
│   │   ├── widget.ts              # Custom TUI widget (tab bar, single-choice, multi-select, free-text)
│   │   ├── multi-select.ts        # Reusable multi-select TUI component
│   │   └── entity-writer.ts       # Transforms answered questions → framework markdown files
│   │
│   ├── subagents/
│   │   ├── runner.ts              # Pipeline runner (wraps subagent spawn logic)
│   │   ├── agents/
│   │   │   ├── framework-scout.md
│   │   │   ├── framework-planner.md
│   │   │   ├── framework-worker.md
│   │   │   ├── framework-reviewer.md
│   │   │   ├── framework-decomposer.md
│   │   │   ├── framework-gate-checker.md
│   │   │   ├── framework-risk-scanner.md
│   │   │   ├── framework-stale-checker.md
│   │   │   └── framework-interviewer.md
│   │   └── pipelines/
│   │       ├── implement.md
│   │       ├── decompose.md
│   │       ├── review.md
│   │       ├── gate-check.md
│   │       ├── risk-scan.md
│   │       └── stale-check.md
│   │
│   └── framework/
│       ├── reader.ts              # Parse all framework markdown files into typed objects
│       ├── writer.ts              # Write structured entities back to markdown files
│       ├── state.ts               # In-memory project state cache + invalidation
│       ├── id-gen.ts              # Generate T-XXX, D-XXX, Q-XXX, SL-XXX IDs
│       ├── pricing.ts             # Model pricing table for cost estimation
│       └── types.ts               # All TypeScript types matching framework entities
│
├── skills/
│   └── FRAMEWORK-SKILL.md         # Master skill — complete framework knowledge
│
└── prompts/
    └── framework-context.md       # Prompt template: inject when starting a framework session
```

---

## 14. Framework File Storage Convention

The package reads/writes files in `FRAMEWORK/` at the project's CWD. This structure mirrors the framework docs exactly:

```
FRAMEWORK/
├── project.md          # Project entity, Goals, Stage, Mode
├── planning.md         # Milestones, Epics
├── session-log.md      # Ordered session entries (most recent first)
├── tasks/
│   ├── T-001.md        # Individual task files
│   ├── T-002.md
│   └── ...
├── work-log/
│   └── T-001.md        # Work Intervals per task (written by extension)
├── decisions.md        # Decision entities
├── questions.md        # Question entities
├── risks.md            # Risk Register
├── changes.md          # Change Requests + Scope Changes
└── resources/
    ├── tech-stack.md
    ├── rules.md
    └── conventions.md
```

---

## 15. Implementation Order (Build Sequence)

When building from scratch, build in this order — each layer enables the next:

### Phase A — Foundation (no UI, pure I/O)
1. `src/framework/types.ts` — all TypeScript entity types
2. `src/framework/id-gen.ts` — ID generator
3. `src/framework/reader.ts` — parse markdown → typed objects
4. `src/framework/writer.ts` — typed objects → markdown
5. `src/framework/state.ts` — cache + CWD detection
6. `src/framework/pricing.ts` — cost calculation table

### Phase B — Core Extension Hooks
7. `src/hooks/work-interval.ts` — agent_start/end recording (validates reader/writer)
8. `src/hooks/session-start.ts` — cold-start protocol, status widget
9. `src/hooks/before-agent-start.ts` — framework state injection
10. `src/hooks/compact-summary.ts` — compaction preservation

### Phase C — Tools (LLM-callable)
11. `src/tools/query-tools.ts` — read-only first (prj_status_read, prj_task_read)
12. `src/tools/session-tools.ts` — session log management
13. `src/tools/task-tools.ts` — task lifecycle
14. `src/tools/entity-tools.ts` — decisions, questions, risks, changes, verifications
15. `src/tools/pattern-tools.ts` — Pattern Contract propagation

### Phase D — Commands (slash commands)
16. `src/commands/dashboard.ts` — /prj-status
17. `src/commands/tasks.ts` — /prj-tasks, /prj-task, /prj-epic
18. `src/commands/session.ts` — /prj-session, /prj-questions, /prj-blockers
19. `src/commands/tracking.ts` — /prj-cost
20. `src/commands/process.ts` — /prj-risks, /prj-decisions, /prj-changes, /prj-gate

### Phase E — Tool Intercepts and Warnings
21. `src/hooks/tool-intercept.ts` — file scope, Pattern Contract watch
22. `src/hooks/session-end.ts` — shutdown prompt

### Phase F — Subagents
23. `src/subagents/runner.ts` + agent .md files
24. `src/commands/subagent-cmd.ts` — /prj-subagent

### Phase G — Interview Widget
25. `src/interview/multi-select.ts` — standalone reusable component
26. `src/interview/widget.ts` — full interview TUI (builds on questionnaire.ts pattern)
27. `src/interview/questions.ts` — phase 1 question definitions
28. `src/interview/entity-writer.ts` — answers → files
29. `src/interview/orchestrator.ts` — coordinates widget + subagent
30. `src/commands/interview.ts` — /prj-init

### Phase H — Skill + Package Wiring
31. `skills/FRAMEWORK-SKILL.md` — master skill
32. `extensions/index.ts` — wire everything together
33. `package.json` — pi descriptor
34. `README.md` — install + usage docs

---

## 16. Key References

### Framework Source Files (in this repo, read these first)
- `FRAMEWORK/INDEX.md` — design principles + entity hierarchy overview
- `FRAMEWORK/lifecycle.md` — four phases, Phase Completion Records, Phase 4 bootstrap, Task Addition process
- `FRAMEWORK/task.md` — Task entity (all fields), Subtask, Delegation model
- `FRAMEWORK/session-log.md` — Session Log, Decision, Question (with aging/escalation)
- `FRAMEWORK/tracking.md` — Work Interval, Completion Record ← **extension writes these**
- `FRAMEWORK/reference.md` — status transitions, human review outcomes, delegation levels
- `FRAMEWORK/relationships.md` — Dependency, Blocker, Pattern Contract, Pattern Dependency
- `FRAMEWORK/verification.md` — Verification attempts, failure recovery loop
- `FRAMEWORK/project.md` — Project entity, Goals, Project Resources
- `FRAMEWORK/planning.md` — Milestones, Epics, Epic Dependencies
- `FRAMEWORK/change-management.md` — Change Request, Scope Change
- `FRAMEWORK/risk.md` — Risk entity, Risk Register
- `FRAMEWORK/er-diagram.md` — Full ER diagram as Mermaid
- `FRAMEWORK/flowcharts.md` — All process flowcharts (18 diagrams)
- `FRAMEWORK/AGENTS.md` — Agent orientation (critical conventions)

### Pi Source Files (installed, read for API details)
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/questionnaire.ts` — **canonical TUI widget example**
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/index.ts` — subagent implementation
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/commands.ts` — command registration
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/tools.ts` — tool registration
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/preset.ts` — SelectList usage
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/agents/` — agent .md format
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/@mariozechner/pi-tui/dist/index.d.ts` — full TUI exports
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/@mariozechner/pi-tui/dist/tui.d.ts` — TUI, Container, Component, OverlayOptions types
- `/usr/lib/node_modules/@mariozechner/pi-coding-agent/node_modules/@mariozechner/pi-tui/dist/components/box.d.ts` — Box component

### Pi Docs (at `/usr/lib/node_modules/@mariozechner/pi-coding-agent/docs/`)
- `extensions.md` — full extension API
- `packages.md` — package structure + install
- `skills.md` — skill format + discovery
- `tui.md` — TUI component patterns

---

## 17. Critical Design Decisions (with Rationale)

### D1: Custom TUI instead of built-in `ctx.ui.select()`
**Decision:** Build all interactive interview UI using `ctx.ui.custom()`.  
**Rationale:** `ctx.ui.select()` is single-choice only. The interview needs multi-select (tech categories, non-goals, etc.), tab navigation between questions, a submit page with answer review, and free-text entry. The `questionnaire.ts` example proves the full TUI pattern works and is the right base.  
**Reference:** `questionnaire.ts` — copy and extend its tab bar + Editor + option list pattern.

### D2: Subagent handles entity writing, not the main agent
**Decision:** Phase 1 interview synthesis, Phase 3 decomposition, and reviews run as context-isolated subagents.  
**Rationale:** These are high-context operations that would pollute the main agent's window. The framework explicitly calls for context resets between phases. Subagents provide natural isolation.  
**Reference:** `FRAMEWORK/lifecycle.md` — "The context reset is not a technical detail — it is a first-class part of the process."

### D3: Work Intervals written by extension, not agent
**Decision:** `agent_start`/`agent_end` hooks write Work Intervals; the agent only contributes output metrics (lines changed, files touched) via `prj_task_complete`.  
**Rationale:** Explicitly stated in `FRAMEWORK/tracking.md`: "The agent cannot know its own start time from inside a run."  
**Reference:** tracking.md "Who records what" table.

### D4: All framework state in `FRAMEWORK/` markdown files, no database
**Decision:** Parse/write plain markdown. No SQLite, no JSON state file.  
**Rationale:** The framework is designed to be human-readable and AI-readable directly. Files are the source of truth. The extension reads them fresh each time (with a short in-memory cache).  
**Tradeoff:** Parsing is slightly more complex. Use consistent heading + field conventions.

### D5: `/prj-` prefix for all commands
**Decision:** All slash commands are namespaced with `prj-`.  
**Rationale:** Prevents conflicts with Pi built-ins and other packages. Clear namespace for tab-completion grouping.

### D6: `session_before_compact` custom summary is non-optional
**Decision:** Always provide a framework-aware custom compaction summary.  
**Rationale:** Without it, a long implementation session will eventually compact and lose Active Task + Exact State context. This is the most subtle but critical reliability hook.

---

## 18. What the Installed Experience Looks Like

After `pi install -l git:github.com/YOUR_ORG/pi-project-framework`:

**On a fresh project (uninitialised):**
```
[Pi starts]
Status bar: [uninitialised | normal | —]
No other changes. User types:
> /prj-init
[Interview widget opens]
```

**On a Phase 4 project with active task T-023:**
```
[Pi starts]
Status bar: [phase_4 | normal | T-023]
Notification: "⚠️ Question Q-007 escalated (4 sessions): Which auth library..."
System prompt injected: "## Framework State\nStage: phase_4 | Active: T-023..."
Agent is immediately oriented.
```

**During implementation:**
```
Agent calls write("src/auth/token.ts", ...)
→ Extension checks: token.ts not in T-023 Affected Files
→ Warning toast: "⚠️ token.ts not in T-023's Affected Files — confirm intentional"
Agent continues or pauses.

Agent finishes task:
Agent calls prj_task_complete({ taskId: "T-023", filesTouched: [...], linesAdded: 47, ... })
→ Extension writes Completion Record
→ Extension marks T-023 as 👀 In Review
→ Extension checks Pattern Contracts — if any changed, flags downstream tasks ⚠️
→ Tool result: "T-023 marked In Review. Completion Record written. 2 downstream tasks flagged Needs Review."
```

**User reviews task:**
```
> /prj-task T-023
[Full task detail display]
> /prj-review
[Lists ⚠️ Needs Review tasks with version diffs]
```

**At session end:**
```
[Ctrl+C]
Extension: "Update Session Log before exiting? [Y/n]"
→ Y: agent calls prj_session_end with Exact State
→ Work Interval finalized and written
[Exit]
```
