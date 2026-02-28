# Entities: Work Interval, Completion Record & Project-Level Summary

---

## Entity: Work Interval

A **Work Interval** is one continuous period of active agent work on a task. A task accumulates a list of these over its lifetime — one per agent run that touched the task. Their sum is the task's total active AI time.

**Active time** is defined as the duration between the agent starting to process a prompt and the agent finishing its response. It excludes: the time a human spends reading output, deciding what to do next, writing their next message, or being away. This distinction matters because we want a metric that reflects actual AI execution effort, not wall-clock project duration.

**A Work Interval is recorded automatically by the extension** using the `agent_start` and `agent_end` hooks — not by the agent itself. The agent cannot know its own start time from inside a run. The extension timestamps both events and writes the interval to the task's Work Log when the run ends. The agent contributes the *output metrics* (what was produced), but not the timing.

### A Work Interval consists of

- **Interval ID** — unique identifier within the task's Work Log
- **Session ID** — the pi session this interval belongs to. Allows cross-referencing with session history.
- **Started At** — timestamp when `agent_start` fired for this run
- **Ended At** — timestamp when `agent_end` fired for this run
- **Active Duration** — ended-at minus started-at, in seconds. This is the billable/trackable unit.
- **Model** — the AI model used during this interval (e.g. "claude-sonnet-4-5", "gpt-4o"). Captured from session context.
- **Provider** — the model provider (e.g. "Anthropic", "OpenAI", "Google"). Captured from session context.
- **Tokens In** — input tokens consumed during this interval, from `ctx.getContextUsage()`
- **Tokens Out** — output tokens generated during this interval, from `ctx.getContextUsage()`
- **Estimated Cost** — calculated by the extension from token counts × known model pricing at time of run. Stored as a value + currency. Marked as estimated because pricing changes.
- **Trigger** — what initiated this work interval: user-prompt / agent-continuation / command. Helps distinguish exploratory human-directed turns from autonomous agent execution turns.

### Who records what

| What | Who | Why |
|---|---|---|
| Interval start/end timestamps | Extension (via `agent_start`/`agent_end` hooks) | The agent cannot know its own start time from inside a run |
| Token counts | Extension (via `ctx.getContextUsage()`) | Available in pi context, not something the agent self-reports |
| Estimated cost | Extension (tokens × known model pricing) | Calculated deterministically, not guessed |
| Lines/characters changed, files touched | Agent (via tool call at task end) | The agent knows what it just did — most accurate source |
| Commit reference, sign-off | Human | Only the human can verify this is correct |

### Active time vs elapsed time

A task worked 3 × 5-minute intervals over 3 days has **15 minutes of active time** and **3 days of elapsed time**. Both are meaningful and different. Active time lives in the Work Intervals. Elapsed time lives in the Completion Record.

---

## Entity: Completion Record

A **Completion Record** is written to a task when its status reaches Done. It captures what was actually produced — the output side of the task — distinct from what was planned (Acceptance Criteria) or how long it took (Work Log).

**The Completion Record is filled in collaboratively:** the agent contributes the output metrics, the extension contributes the aggregated time and cost from the Work Log, and the human contributes the sign-off and commit reference.

### A Completion Record consists of

- **Completed At** — timestamp when the task was marked Done
- **Completed By** — human / agent / both (most tasks are agent-implemented and human-reviewed)
- **Commit Reference** — the git commit hash or PR reference that contains this task's changes
- **Elapsed Time** — wall-clock time from first Work Interval start to completion. Calendar duration, not active duration.
- **Total Active Time** — sum of all Work Interval active durations for this task. The primary effort metric.
- **Total Cost** — sum of all Work Interval estimated costs. Gives a per-task AI cost figure.
- **Model Summary** — breakdown of which models contributed and what proportion of tokens/cost each represented. Useful when a task was worked across multiple sessions using different models.
- **Output Metrics** — what was actually produced:
  - *Files Touched* — the actual files modified (may differ from Affected Files if scope shifted during implementation)
  - *Lines Added* — total lines added across all touched files
  - *Lines Removed* — total lines removed across all touched files
  - *Net Lines* — added minus removed. A rough proxy for implementation size.
  - *Characters Changed* — total characters added + removed. More precise than lines for generated code.
- **Estimate Accuracy** — comparison of the original Estimate field against Total Active Time. Not for blame — for calibrating future estimates on similar tasks.
- **Learnings** — what should feed back into the Epic's notes or influence future task definitions. Optional but encouraged for anything non-trivial.

---

## Project-Level Time & Cost Summary

No separate entity is needed — this is a derived view calculated from all Work Intervals and Completion Records across all tasks. It is the primary oversight tool for the human.

**What can be calculated project-wide:**

- **Total Active AI Time** — sum of all Work Interval active durations across all tasks and sessions. The answer to "how much AI execution time has this project consumed?"
- **Total Estimated Cost** — sum of all Work Interval costs. The answer to "what has this project cost in AI API spend?"
- **Cost by Model / Provider** — breakdown of spend by model. Useful for evaluating whether cheaper models could handle certain task types.
- **Active Time by Epic** — which epics are consuming the most agent effort. Helps identify where complexity is actually concentrated vs where it was expected.
- **Active Time by Delegation Level** — how much time goes to autonomous implementation vs research vs planning. Informs delegation strategy.
- **Estimate vs Actual by Task** — pattern analysis across completed tasks. If estimates are consistently off by a factor for certain task types, that is a calibration signal.

This data lives in the Work Intervals and Completion Records of individual tasks. The project-level view is a query/aggregation over them, not a separately maintained entity.
