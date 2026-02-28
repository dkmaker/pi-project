/**
 * @module __tests__/__fixtures__/seed
 * @description Generates valid test data for all 35 entity types.
 *
 * Each make* function returns a minimal valid record. Pass overrides to customize.
 * Used by individual tests for isolated records and by sample-project.ts for
 * a full synthetic project.
 */

import type {
  Project, ProjectCompletionRecord, Goal, GoalCompletionRecord, GoalEpicMap,
  TechStackEntry, SharedDocRef, Rule, Convention,
  Milestone, MilestoneReviewRecord,
  Epic, EpicDependency, EpicCompletionRecord,
  Task, Subtask, TaskAttachment, TaskResourceRef,
  Blocker, TaskDependency,
  PatternContract, PatternContractVersion, PatternDependency,
  Verification, VerificationAttempt,
  WorkInterval, CompletionRecord,
  SessionLog, PhaseCompletionRecord,
  Decision, Question, Risk,
  ChangeRequest, ScopeChange, AbandonmentRecord,
} from '../../schema/index';

let counter = 0;
function uid(prefix: string = 'id'): string { return `${prefix}_${++counter}`; }

/** Reset counter (call between tests for predictable IDs). */
export function resetCounter(): void { counter = 0; }

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: uid('proj'), name: 'Test Project', vision: 'Build something great',
    non_goals: 'None', repository_map: 'src/', status: 'not_started',
    stage: 'uninitialised', mode: 'normal', ...overrides,
  };
}

export function makeProjectCompletionRecord(overrides: Partial<ProjectCompletionRecord> = {}): ProjectCompletionRecord {
  return {
    id: uid('pcr'), project_id: 'proj_1', completed_at: '2026-01-01T00:00:00Z',
    confirmed_by: 'human', goals_assessment: 'All achieved', milestones_review: 'All reached',
    scope_delta: 'None', total_active_seconds: 3600, total_estimated_cost: 10.0,
    estimate_accuracy_notes: 'Good', key_decisions: 'None', risks_summary: 'None', learnings: 'None',
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: uid('goal'), project_id: 'proj_1', statement: 'Achieve test goal', status: 'not_started',
    ...overrides,
  };
}

export function makeGoalCompletionRecord(overrides: Partial<GoalCompletionRecord> = {}): GoalCompletionRecord {
  return {
    id: uid('gcr'), goal_id: 'goal_1', achieved_at: '2026-01-01T00:00:00Z',
    confirmed_by: 'human', goal_statement_at_achievement: 'Achieve test goal',
    evaluation_notes: 'Done', ...overrides,
  };
}

export function makeGoalEpicMap(overrides: Partial<GoalEpicMap> = {}): GoalEpicMap {
  return { goal_id: 'goal_1', epic_id: 'epic_1', ...overrides };
}

export function makeTechStackEntry(overrides: Partial<TechStackEntry> = {}): TechStackEntry {
  return {
    id: uid('tse'), project_id: 'proj_1', name: 'TypeScript', category: 'language',
    version: '5.0', purpose: 'Primary language', documentation_url: 'https://typescriptlang.org',
    project_specific_notes: '', verification_status: 'unverified', ...overrides,
  };
}

export function makeSharedDocRef(overrides: Partial<SharedDocRef> = {}): SharedDocRef {
  return {
    id: uid('sdr'), project_id: 'proj_1', name: 'README', url_or_path: './README.md',
    description: 'Main readme', scope: 'project', ...overrides,
  };
}

export function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: uid('rule'), project_id: 'proj_1', statement: 'No any types',
    rationale: 'Type safety', scope: 'global', enforcement: 'linter', ...overrides,
  };
}

export function makeConvention(overrides: Partial<Convention> = {}): Convention {
  return {
    id: uid('conv'), project_id: 'proj_1', name: 'Naming', description: 'Use camelCase',
    rationale: 'Consistency', applies_to: 'all files', ...overrides,
  };
}

export function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: uid('ms'), project_id: 'proj_1', name: 'MVP', description: 'Minimum viable product',
    exit_criteria: 'Core features working', target_date: '2026-03-01', status: 'pending',
    ...overrides,
  };
}

export function makeMilestoneReviewRecord(overrides: Partial<MilestoneReviewRecord> = {}): MilestoneReviewRecord {
  return {
    id: uid('mrr'), milestone_id: 'ms_1', reached_at: '2026-03-01T00:00:00Z',
    confirmed_by: 'human', exit_criteria_results: 'All met', epics_on_time_vs_slipped: 'All on time',
    scope_delta: 'None', actual_ai_cost: 50.0, key_decisions: 'None', risks_realized: 'None',
    notes: '', ...overrides,
  };
}

export function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: uid('epic'), project_id: 'proj_1', milestone_id: 'ms_1', name: 'Core Module',
    description: 'Build core', scope_in: 'Core features', scope_out: 'UI',
    acceptance_criteria: 'Tests pass', status: 'pending', is_infrastructure: false,
    constraint_or_resource_link: '', notes_learnings: '', ...overrides,
  };
}

export function makeEpicDependency(overrides: Partial<EpicDependency> = {}): EpicDependency {
  return {
    id: uid('edep'), requires_epic_id: 'epic_1', enables_epic_id: 'epic_2',
    nature: 'hard', gate_condition: 'Must complete first', ...overrides,
  };
}

export function makeEpicCompletionRecord(overrides: Partial<EpicCompletionRecord> = {}): EpicCompletionRecord {
  return {
    id: uid('ecr'), epic_id: 'epic_1', completed_at: '2026-02-01T00:00:00Z',
    confirmed_by: 'human', acceptance_criteria_results: 'All met', scope_delta: 'None',
    total_tasks_done: 5, total_tasks_cancelled: 0, total_active_seconds: 7200,
    total_estimated_cost: 25.0, notes_learnings: '', ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: uid('task'), epic_id: 'epic_1', name: 'Implement feature',
    status: 'pending', priority: 'medium', estimate: '2h', delegation: 'implement',
    goal_statement: 'Build the feature', context: 'Part of core module',
    research_date: '2026-01-15', acceptance_criteria: 'Tests pass',
    affected_files: 'src/feature.ts', notes: '', ...overrides,
  };
}

export function makeSubtask(overrides: Partial<Subtask> = {}): Subtask {
  return {
    id: uid('sub'), task_id: 'task_1', order_index: 0, description: 'Step 1',
    done: false, notes: '', ...overrides,
  };
}

export function makeTaskAttachment(overrides: Partial<TaskAttachment> = {}): TaskAttachment {
  return {
    id: uid('ta'), task_id: 'task_1', label: 'Reference', url_or_path: './doc.md',
    type: 'reference', ...overrides,
  };
}

export function makeTaskResourceRef(overrides: Partial<TaskResourceRef> = {}): TaskResourceRef {
  return {
    task_id: 'task_1', resource_id: 'tse_1', resource_type: 'tech_stack', ...overrides,
  };
}

export function makeBlocker(overrides: Partial<Blocker> = {}): Blocker {
  return {
    id: uid('blk'), task_id: 'task_1', description: 'Waiting for API',
    type: 'external', resolution_path: 'Contact vendor', resolved: false, ...overrides,
  };
}

export function makeTaskDependency(overrides: Partial<TaskDependency> = {}): TaskDependency {
  return {
    id: uid('tdep'), task_id: 'task_2', requires_task_id: 'task_1', nature: 'hard',
    ...overrides,
  };
}

export function makePatternContract(overrides: Partial<PatternContract> = {}): PatternContract {
  return {
    id: uid('pc'), establishing_task_id: 'task_1', name: 'API Pattern',
    current_version: 1, definition: 'REST endpoints follow /api/v1/{resource}',
    status: 'draft', ...overrides,
  };
}

export function makePatternContractVersion(overrides: Partial<PatternContractVersion> = {}): PatternContractVersion {
  return {
    id: uid('pcv'), contract_id: 'pc_1', version_number: 1,
    definition_at_version: 'REST endpoints follow /api/v1/{resource}',
    changed_at: '2026-01-20T00:00:00Z', change_summary: 'Initial version',
    triggered_reviews_on: '', ...overrides,
  };
}

export function makePatternDependency(overrides: Partial<PatternDependency> = {}): PatternDependency {
  return {
    id: uid('pd'), task_id: 'task_2', contract_id: 'pc_1', source_task_id: 'task_1',
    pattern_name: 'API Pattern', locked_version: 1, expectation: 'Follows REST convention',
    review_status: 'current', review_note: '', ...overrides,
  };
}

export function makeVerification(overrides: Partial<Verification> = {}): Verification {
  return {
    id: uid('ver'), task_id: 'task_1', type: 'testing', source: 'unit tests',
    current_result: 'pending', stale: false, ...overrides,
  };
}

export function makeVerificationAttempt(overrides: Partial<VerificationAttempt> = {}): VerificationAttempt {
  return {
    id: uid('va'), verification_id: 'ver_1', attempt_number: 1, result: 'passed',
    performed_by: 'agent', date: '2026-01-25T00:00:00Z', notes: 'All tests pass',
    ...overrides,
  };
}

export function makeWorkInterval(overrides: Partial<WorkInterval> = {}): WorkInterval {
  return {
    id: uid('wi'), task_id: 'task_1', session_log_id: 'sl_1',
    started_at: '2026-01-20T10:00:00Z', ended_at: '2026-01-20T11:00:00Z',
    active_duration_seconds: 3600, model: 'claude-3.5-sonnet', provider: 'anthropic',
    tokens_in: 10000, tokens_out: 5000, estimated_cost: 0.05, trigger: 'user_prompt',
    ...overrides,
  };
}

export function makeCompletionRecord(overrides: Partial<CompletionRecord> = {}): CompletionRecord {
  return {
    id: uid('cr'), task_id: 'task_1', completed_at: '2026-01-25T12:00:00Z',
    completed_by: 'agent', commit_reference: 'abc123', elapsed_seconds: 7200,
    total_active_seconds: 3600, total_cost: 0.10, model_summary: 'claude-3.5-sonnet',
    files_touched: 'src/feature.ts', lines_added: 100, lines_removed: 10, net_lines: 90,
    characters_changed: 5000, estimate_accuracy: 'On target', learnings: 'None',
    review_outcome: 'approved', review_notes: '', ...overrides,
  };
}

export function makeSessionLog(overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: uid('sl'), project_id: 'proj_1', entry_number: 1,
    timestamp: '2026-01-20T10:00:00Z', author: 'agent',
    is_phase_completion_record: false, exact_state: 'Working on task_1',
    completed_this_session: 'Setup complete', open_questions: 'None',
    next_actions: 'Implement feature', relevant_files: 'src/',
    git_branch: 'main', git_last_commit: 'abc123', git_uncommitted_changes: 'None',
    pending_reviews: '', ...overrides,
  };
}

export function makePhaseCompletionRecord(overrides: Partial<PhaseCompletionRecord> = {}): PhaseCompletionRecord {
  return {
    id: uid('phcr'), session_log_id: 'sl_1', phase_number: 1, phase_name: 'Interview',
    completed_at: '2026-01-15T00:00:00Z', output_checklist: 'All items checked',
    open_questions: 'None', entry_condition_for_next: 'Ready for planning',
    gate_status: 'passed', gate_failures: '', ...overrides,
  };
}

export function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: uid('dec'), project_id: 'proj_1', title: 'Use TypeBox',
    date: '2026-01-10', context: 'Need schema validation',
    decision: 'Use TypeBox over Zod', rationale: 'Already bundled with pi',
    consequences: 'Must learn TypeBox API', affected_task_ids: 'task_1,task_2',
    status: 'active', ...overrides,
  };
}

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: uid('q'), project_id: 'proj_1', description: 'Should we use SQLite?',
    impact_entity_ids: 'task_1', options: 'Yes|No', owner: 'human',
    status: 'open', resolution: '', session_count: 1, escalation_flag: false,
    defer_until_condition: '', ...overrides,
  };
}

export function makeRisk(overrides: Partial<Risk> = {}): Risk {
  return {
    id: uid('risk'), project_id: 'proj_1', description: 'Model may be too slow',
    likelihood: 'medium', impact: 'Performance degradation',
    affected_entity_ids: 'task_1', mitigation: 'Use smaller model',
    status: 'open', owner: 'agent', identified_at_phase: 'phase_2',
    last_reviewed: '2026-01-15', realization_notes: '', ...overrides,
  };
}

export function makeChangeRequest(overrides: Partial<ChangeRequest> = {}): ChangeRequest {
  return {
    id: uid('chreq'), project_id: 'proj_1', initiator: 'human',
    target_entity_type: 'goal', target_entity_id: 'goal_1',
    previous_state: 'Build X', proposed_state: 'Build X and Y',
    rationale: 'Scope expansion', impact_analysis: 'Adds 2 tasks',
    required_phase_reruns: 'none', status: 'pending_review',
    human_sign_off: '', rejection_rationale: '', ...overrides,
  };
}

export function makeScopeChange(overrides: Partial<ScopeChange> = {}): ScopeChange {
  return {
    id: uid('sc'), change_request_id: 'chreq_1', project_id: 'proj_1',
    target_entity_type: 'goal', target_entity_id: 'goal_1',
    previous_state: 'Build X', new_state: 'Build X and Y',
    rationale: 'Approved expansion', triggered_by_type: 'change_request',
    triggered_by_id: 'chreq_1', downstream_impact: '2 new tasks',
    required_actions_checklist: 'Create tasks', human_sign_off: 'approved',
    status: 'pending', ...overrides,
  };
}

export function makeAbandonmentRecord(overrides: Partial<AbandonmentRecord> = {}): AbandonmentRecord {
  return {
    id: uid('abn'), project_id: 'proj_1', entity_type: 'task', entity_id: 'task_1',
    abandoned_at: '2026-02-01T00:00:00Z', rationale: 'No longer needed',
    state_at_abandonment: 'Was pending', disposition: 'discarded',
    impact_on_goals: 'None', human_sign_off: 'approved', ...overrides,
  };
}
