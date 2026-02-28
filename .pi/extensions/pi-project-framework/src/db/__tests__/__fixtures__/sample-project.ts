/**
 * @module __tests__/__fixtures__/sample-project
 * @description Complete realistic synthetic project with all 35 entity types.
 *
 * Creates a coherent project with proper FK relationships:
 * - 1 project, 2 goals, 1 milestone, 3 epics, 8 tasks, subtasks, blockers, etc.
 * - All FKs reference real entities in the dataset
 * - Used by Phase 3 integration tests
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

/** All data for a complete synthetic project, keyed by collection name. */
export interface SampleProjectData {
  projects: Project[];
  project_completion_records: ProjectCompletionRecord[];
  goals: Goal[];
  goal_completion_records: GoalCompletionRecord[];
  goal_epic_maps: GoalEpicMap[];
  tech_stack_entries: TechStackEntry[];
  shared_doc_refs: SharedDocRef[];
  rules: Rule[];
  conventions: Convention[];
  milestones: Milestone[];
  milestone_review_records: MilestoneReviewRecord[];
  epics: Epic[];
  epic_dependencies: EpicDependency[];
  epic_completion_records: EpicCompletionRecord[];
  tasks: Task[];
  subtasks: Subtask[];
  task_attachments: TaskAttachment[];
  task_resource_refs: TaskResourceRef[];
  blockers: Blocker[];
  task_dependencies: TaskDependency[];
  pattern_contracts: PatternContract[];
  pattern_contract_versions: PatternContractVersion[];
  pattern_dependencies: PatternDependency[];
  verifications: Verification[];
  verification_attempts: VerificationAttempt[];
  work_intervals: WorkInterval[];
  completion_records: CompletionRecord[];
  session_logs: SessionLog[];
  phase_completion_records: PhaseCompletionRecord[];
  decisions: Decision[];
  questions: Question[];
  risks: Risk[];
  change_requests: ChangeRequest[];
  scope_changes: ScopeChange[];
  abandonment_records: AbandonmentRecord[];
}

export function createSampleProject(): SampleProjectData {
  const P = 'proj-1';
  const G1 = 'goal-1', G2 = 'goal-2';
  const MS1 = 'ms-1';
  const E1 = 'epic-1', E2 = 'epic-2', E3 = 'epic-3';
  const T1 = 'task-1', T2 = 'task-2', T3 = 'task-3', T4 = 'task-4';
  const T5 = 'task-5', T6 = 'task-6', T7 = 'task-7', T8 = 'task-8';
  const SL1 = 'sl-1', SL2 = 'sl-2';
  const TSE1 = 'tse-1', TSE2 = 'tse-2';
  const PC1 = 'pc-1';
  const VER1 = 'ver-1', VER2 = 'ver-2';
  const DEC1 = 'dec-1';
  const Q1 = 'q-1';
  const RISK1 = 'risk-1';
  const CR1 = 'cr-1';

  return {
    projects: [{
      id: P, name: 'Widget Platform', vision: 'Build a widget management platform',
      non_goals: 'Mobile app', repository_map: 'src/, tests/', status: 'in_progress',
      stage: 'phase_4', mode: 'normal',
    }],

    project_completion_records: [],

    goals: [
      { id: G1, project_id: P, statement: 'Core widget CRUD operations', status: 'in_progress' },
      { id: G2, project_id: P, statement: 'Widget marketplace integration', status: 'not_started' },
    ],

    goal_completion_records: [],

    goal_epic_maps: [
      { goal_id: G1, epic_id: E1 },
      { goal_id: G1, epic_id: E2 },
      { goal_id: G2, epic_id: E3 },
    ],

    tech_stack_entries: [
      { id: TSE1, project_id: P, name: 'TypeScript', category: 'language', version: '5.4', purpose: 'Primary language', documentation_url: 'https://typescriptlang.org', project_specific_notes: 'Strict mode', verification_status: 'verified' },
      { id: TSE2, project_id: P, name: 'Node.js', category: 'runtime', version: '22', purpose: 'Runtime', documentation_url: 'https://nodejs.org', project_specific_notes: '', verification_status: 'verified' },
    ],

    shared_doc_refs: [
      { id: 'sdr-1', project_id: P, name: 'Architecture Doc', url_or_path: './docs/arch.md', description: 'System architecture', scope: 'project' },
    ],

    rules: [
      { id: 'rule-1', project_id: P, statement: 'No any types', rationale: 'Type safety', scope: 'global', enforcement: 'linter' },
    ],

    conventions: [
      { id: 'conv-1', project_id: P, name: 'File naming', description: 'kebab-case for files', rationale: 'Consistency', applies_to: 'all TypeScript files' },
    ],

    milestones: [
      { id: MS1, project_id: P, name: 'MVP Release', description: 'Core features complete', exit_criteria: 'All epics done, tests pass', target_date: '2026-04-01', status: 'active' },
    ],

    milestone_review_records: [],

    epics: [
      { id: E1, project_id: P, milestone_id: MS1, name: 'Data Layer', description: 'Build data access layer', scope_in: 'CRUD, validation', scope_out: 'Caching', acceptance_criteria: 'All repos work', status: 'active', is_infrastructure: true, constraint_or_resource_link: '', notes_learnings: '' },
      { id: E2, project_id: P, milestone_id: MS1, name: 'API Layer', description: 'REST API endpoints', scope_in: 'CRUD endpoints', scope_out: 'GraphQL', acceptance_criteria: 'API tests pass', status: 'pending', is_infrastructure: false, constraint_or_resource_link: '', notes_learnings: '' },
      { id: E3, project_id: P, milestone_id: MS1, name: 'Marketplace', description: 'Integration with marketplace', scope_in: 'Search, listing', scope_out: 'Payments', acceptance_criteria: 'Can list widgets', status: 'pending', is_infrastructure: false, constraint_or_resource_link: '', notes_learnings: '' },
    ],

    epic_dependencies: [
      { id: 'edep-1', requires_epic_id: E1, enables_epic_id: E2, nature: 'hard', gate_condition: 'Data layer must be complete' },
      { id: 'edep-2', requires_epic_id: E2, enables_epic_id: E3, nature: 'soft', gate_condition: 'API should be available' },
    ],

    epic_completion_records: [],

    tasks: [
      { id: T1, epic_id: E1, name: 'Define schemas', status: 'done', priority: 'critical', estimate: '4h', delegation: 'implement', goal_statement: 'Create TypeBox schemas', context: 'Foundation for data layer', research_date: '2026-01-10', acceptance_criteria: 'All schemas validate', affected_files: 'src/schema/', notes: 'Completed successfully' },
      { id: T2, epic_id: E1, name: 'Build repositories', status: 'active', priority: 'high', estimate: '6h', delegation: 'implement', goal_statement: 'CRUD for all entities', context: 'Uses schemas from T1', research_date: '2026-01-15', acceptance_criteria: 'All repos have CRUD', affected_files: 'src/repo/', notes: '' },
      { id: T3, epic_id: E1, name: 'Add query engine', status: 'pending', priority: 'medium', estimate: '3h', delegation: 'implement', goal_statement: 'Fluent query builder', context: 'After repos are done', research_date: '2026-01-15', acceptance_criteria: 'Query builder works', affected_files: 'src/query/', notes: '' },
      { id: T4, epic_id: E1, name: 'Integration tests', status: 'pending', priority: 'medium', estimate: '2h', delegation: 'implement', goal_statement: 'Test data layer', context: 'Final data layer task', research_date: '2026-01-15', acceptance_criteria: 'All tests pass', affected_files: 'tests/', notes: '' },
      { id: T5, epic_id: E2, name: 'Setup Express', status: 'pending', priority: 'high', estimate: '1h', delegation: 'implement', goal_statement: 'Configure Express server', context: 'API layer foundation', research_date: '2026-01-20', acceptance_criteria: 'Server starts', affected_files: 'src/api/', notes: '' },
      { id: T6, epic_id: E2, name: 'Widget endpoints', status: 'pending', priority: 'high', estimate: '4h', delegation: 'implement', goal_statement: 'CRUD endpoints for widgets', context: 'Main API endpoints', research_date: '2026-01-20', acceptance_criteria: 'All endpoints work', affected_files: 'src/api/widgets/', notes: '' },
      { id: T7, epic_id: E3, name: 'Marketplace client', status: 'pending', priority: 'medium', estimate: '3h', delegation: 'implement', goal_statement: 'HTTP client for marketplace API', context: 'External integration', research_date: '2026-01-25', acceptance_criteria: 'Can fetch listings', affected_files: 'src/marketplace/', notes: '' },
      { id: T8, epic_id: E3, name: 'Search integration', status: 'blocked', priority: 'low', estimate: '2h', delegation: 'research', goal_statement: 'Integrate marketplace search', context: 'Depends on marketplace client', research_date: '2026-01-25', acceptance_criteria: 'Search returns results', affected_files: 'src/marketplace/search/', notes: '' },
    ],

    subtasks: [
      { id: 'sub-1', task_id: T2, order_index: 0, description: 'Create base repository class', done: true, notes: '' },
      { id: 'sub-2', task_id: T2, order_index: 1, description: 'Create entity repositories', done: false, notes: '' },
      { id: 'sub-3', task_id: T2, order_index: 2, description: 'Add event emission', done: false, notes: '' },
      { id: 'sub-4', task_id: T1, order_index: 0, description: 'Define enums', done: true, notes: '' },
      { id: 'sub-5', task_id: T1, order_index: 1, description: 'Define entity schemas', done: true, notes: '' },
    ],

    task_attachments: [
      { id: 'ta-1', task_id: T1, label: 'ER Diagram', url_or_path: './FRAMEWORK/er-diagram.md', type: 'reference' },
      { id: 'ta-2', task_id: T7, label: 'Marketplace API Docs', url_or_path: 'https://marketplace.example/api', type: 'reference' },
    ],

    task_resource_refs: [
      { task_id: T1, resource_id: TSE1, resource_type: 'tech_stack' },
      { task_id: T2, resource_id: TSE1, resource_type: 'tech_stack' },
      { task_id: T5, resource_id: TSE2, resource_type: 'tech_stack' },
    ],

    blockers: [
      { id: 'blk-1', task_id: T8, description: 'Marketplace API not yet available', type: 'external', resolution_path: 'Wait for API access', resolved: false },
    ],

    task_dependencies: [
      { id: 'tdep-1', task_id: T3, requires_task_id: T2, nature: 'hard' },
      { id: 'tdep-2', task_id: T4, requires_task_id: T3, nature: 'hard' },
      { id: 'tdep-3', task_id: T6, requires_task_id: T5, nature: 'hard' },
      { id: 'tdep-4', task_id: T8, requires_task_id: T7, nature: 'hard' },
    ],

    pattern_contracts: [
      { id: PC1, establishing_task_id: T1, name: 'Schema Convention', current_version: 1, definition: 'All schemas use TypeBox, export Static types', status: 'established' },
    ],

    pattern_contract_versions: [
      { id: 'pcv-1', contract_id: PC1, version_number: 1, definition_at_version: 'All schemas use TypeBox, export Static types', changed_at: '2026-01-12T00:00:00Z', change_summary: 'Initial version', triggered_reviews_on: '' },
    ],

    pattern_dependencies: [
      { id: 'pd-1', task_id: T2, contract_id: PC1, source_task_id: T1, pattern_name: 'Schema Convention', locked_version: 1, expectation: 'Repos use TypeBox schemas', review_status: 'current', review_note: '' },
    ],

    verifications: [
      { id: VER1, task_id: T1, type: 'testing', source: 'unit tests', current_result: 'passed', stale: false },
      { id: VER2, task_id: T2, type: 'code_review', source: 'self review', current_result: 'pending', stale: false },
    ],

    verification_attempts: [
      { id: 'va-1', verification_id: VER1, attempt_number: 1, result: 'passed', performed_by: 'agent', date: '2026-01-12T00:00:00Z', notes: 'All schema tests pass' },
    ],

    work_intervals: [
      { id: 'wi-1', task_id: T1, session_log_id: SL1, started_at: '2026-01-10T10:00:00Z', ended_at: '2026-01-10T14:00:00Z', active_duration_seconds: 14400, model: 'claude-3.5-sonnet', provider: 'anthropic', tokens_in: 50000, tokens_out: 25000, estimated_cost: 0.25, trigger: 'user_prompt' },
      { id: 'wi-2', task_id: T2, session_log_id: SL2, started_at: '2026-01-15T09:00:00Z', ended_at: '2026-01-15T12:00:00Z', active_duration_seconds: 10800, model: 'claude-3.5-sonnet', provider: 'anthropic', tokens_in: 40000, tokens_out: 20000, estimated_cost: 0.20, trigger: 'user_prompt' },
    ],

    completion_records: [
      { id: 'cr-1', task_id: T1, completed_at: '2026-01-12T16:00:00Z', completed_by: 'agent', commit_reference: 'abc123', elapsed_seconds: 14400, total_active_seconds: 14400, total_cost: 0.25, model_summary: 'claude-3.5-sonnet', files_touched: 'src/schema/', lines_added: 500, lines_removed: 0, net_lines: 500, characters_changed: 25000, estimate_accuracy: 'On target', learnings: 'TypeBox is straightforward', review_outcome: 'approved', review_notes: '' },
    ],

    session_logs: [
      { id: SL1, project_id: P, entry_number: 1, timestamp: '2026-01-10T10:00:00Z', author: 'agent', is_phase_completion_record: false, exact_state: 'Starting schema definition', completed_this_session: 'Schema enums and entities', open_questions: 'None', next_actions: 'Build repositories', relevant_files: 'src/schema/', git_branch: 'main', git_last_commit: 'init', git_uncommitted_changes: 'schema files', pending_reviews: '' },
      { id: SL2, project_id: P, entry_number: 2, timestamp: '2026-01-15T09:00:00Z', author: 'agent', active_task_id: T2, is_phase_completion_record: false, exact_state: 'Building repository layer', completed_this_session: 'Base repository done', open_questions: 'None', next_actions: 'Finish entity repos', relevant_files: 'src/repo/', git_branch: 'main', git_last_commit: 'abc123', git_uncommitted_changes: 'repo files', pending_reviews: '' },
    ],

    phase_completion_records: [
      { id: 'phcr-1', session_log_id: SL1, phase_number: 1, phase_name: 'Interview', completed_at: '2026-01-05T00:00:00Z', output_checklist: 'Vision, goals, non-goals defined', open_questions: 'None', entry_condition_for_next: 'Ready', gate_status: 'passed', gate_failures: '' },
      { id: 'phcr-2', session_log_id: SL1, phase_number: 2, phase_name: 'Planning', completed_at: '2026-01-08T00:00:00Z', output_checklist: 'Milestones, epics defined', open_questions: 'None', entry_condition_for_next: 'Ready', gate_status: 'passed', gate_failures: '' },
      { id: 'phcr-3', session_log_id: SL1, phase_number: 3, phase_name: 'Decomposition', completed_at: '2026-01-09T00:00:00Z', output_checklist: 'Tasks decomposed', open_questions: 'None', entry_condition_for_next: 'Ready', gate_status: 'passed', gate_failures: '' },
    ],

    decisions: [
      { id: DEC1, project_id: P, title: 'Use TypeBox for schemas', date: '2026-01-05', context: 'Need schema validation library', decision: 'Use TypeBox', rationale: 'Bundled with pi, no extra deps', consequences: 'Must use TypeBox API', affected_task_ids: `${T1},${T2}`, status: 'active' },
    ],

    questions: [
      { id: Q1, project_id: P, description: 'Should we add caching to the data layer?', impact_entity_ids: E1, options: 'Yes, in-memory cache|No, premature optimization', owner: 'human', status: 'open', resolution: '', session_count: 2, escalation_flag: false, defer_until_condition: '' },
    ],

    risks: [
      { id: RISK1, project_id: P, description: 'JSONL may not scale past 10k records', likelihood: 'low', impact: 'Need to switch to SQLite', affected_entity_ids: `${E1},${T2}`, mitigation: 'Benchmark at 10k records', mitigation_task_id: T4, status: 'open', owner: 'agent', identified_at_phase: 'phase_2', last_reviewed: '2026-01-15', realization_notes: '' },
    ],

    change_requests: [
      { id: CR1, project_id: P, initiator: 'human', target_entity_type: 'epic', target_entity_id: E3, previous_state: 'Marketplace full integration', proposed_state: 'Marketplace read-only', rationale: 'Reduce scope for MVP', impact_analysis: 'Removes write endpoints', required_phase_reruns: 'none', status: 'pending_review', human_sign_off: '', rejection_rationale: '' },
    ],

    scope_changes: [],

    abandonment_records: [],
  };
}
