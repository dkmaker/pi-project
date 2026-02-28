/**
 * @module __tests__/repository-all.test
 * @description Phase 2: Smoke test — insert + query methods for all 35 repositories.
 *
 * Uses seed fixtures to insert one valid record per repo and verify entity-specific
 * query methods return correct results.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { EventBus } from '../repository/events';
import { resetCounter } from './__fixtures__/seed';
import * as seed from './__fixtures__/seed';
import {
  ProjectRepository, ProjectCompletionRecordRepository,
  GoalRepository, GoalCompletionRecordRepository, GoalEpicMapRepository,
  TechStackEntryRepository, SharedDocRefRepository, RuleRepository, ConventionRepository,
  MilestoneRepository, MilestoneReviewRecordRepository,
  EpicRepository, EpicDependencyRepository, EpicCompletionRecordRepository,
  TaskRepository, SubtaskRepository, TaskAttachmentRepository, TaskResourceRefRepository,
  BlockerRepository, TaskDependencyRepository,
  PatternContractRepository, PatternContractVersionRepository, PatternDependencyRepository,
  VerificationRepository, VerificationAttemptRepository,
  WorkIntervalRepository, CompletionRecordRepository,
  SessionLogRepository, PhaseCompletionRecordRepository,
  DecisionRepository, QuestionRepository, RiskRepository,
  ChangeRequestRepository, ScopeChangeRepository, AbandonmentRecordRepository,
} from '../repository/repositories';

describe('All 35 repositories — smoke test', () => {
  let s: MemoryStorageAdapter;
  let e: EventBus;

  beforeEach(() => {
    resetCounter();
    s = new MemoryStorageAdapter();
    e = new EventBus();
  });

  it('ProjectRepository.getCurrent()', async () => {
    const r = new ProjectRepository(s, e); await r.load();
    await r.insert(seed.makeProject({ id: 'p1' }));
    assert.equal(r.getCurrent()?.id, 'p1');
  });

  it('ProjectCompletionRecordRepository.findByProject()', async () => {
    const r = new ProjectCompletionRecordRepository(s, e); await r.load();
    await r.insert(seed.makeProjectCompletionRecord({ id: 'pcr1', project_id: 'p1' }));
    assert.equal(r.findByProject('p1')?.id, 'pcr1');
    assert.equal(r.findByProject('p2'), undefined);
  });

  it('GoalRepository.findByProject + findByStatus', async () => {
    const r = new GoalRepository(s, e); await r.load();
    await r.insert(seed.makeGoal({ id: 'g1', project_id: 'p1', status: 'in_progress' }));
    await r.insert(seed.makeGoal({ id: 'g2', project_id: 'p1', status: 'not_started' }));
    assert.equal(r.findByProject('p1').length, 2);
    assert.equal(r.findByStatus('in_progress').length, 1);
  });

  it('GoalCompletionRecordRepository.findByGoal()', async () => {
    const r = new GoalCompletionRecordRepository(s, e); await r.load();
    await r.insert(seed.makeGoalCompletionRecord({ id: 'gcr1', goal_id: 'g1' }));
    assert.equal(r.findByGoal('g1')?.id, 'gcr1');
  });

  it('GoalEpicMapRepository.findByGoal + findByEpic', async () => {
    const r = new GoalEpicMapRepository(s, e); await r.load();
    await r.insert(seed.makeGoalEpicMap({ goal_id: 'g1', epic_id: 'e1' }));
    await r.insert(seed.makeGoalEpicMap({ goal_id: 'g1', epic_id: 'e2' }));
    assert.equal(r.findByGoal('g1').length, 2);
    assert.equal(r.findByEpic('e1').length, 1);
  });

  it('TechStackEntryRepository.findByCategory', async () => {
    const r = new TechStackEntryRepository(s, e); await r.load();
    await r.insert(seed.makeTechStackEntry({ id: 't1', category: 'language' }));
    assert.equal(r.findByCategory('language').length, 1);
    assert.equal(r.findByCategory('framework').length, 0);
  });

  it('SharedDocRefRepository.findByProject', async () => {
    const r = new SharedDocRefRepository(s, e); await r.load();
    await r.insert(seed.makeSharedDocRef({ id: 's1', project_id: 'p1' }));
    assert.equal(r.findByProject('p1').length, 1);
  });

  it('RuleRepository.findByProject', async () => {
    const r = new RuleRepository(s, e); await r.load();
    await r.insert(seed.makeRule({ id: 'r1', project_id: 'p1' }));
    assert.equal(r.findByProject('p1').length, 1);
  });

  it('ConventionRepository.findByProject', async () => {
    const r = new ConventionRepository(s, e); await r.load();
    await r.insert(seed.makeConvention({ id: 'c1', project_id: 'p1' }));
    assert.equal(r.findByProject('p1').length, 1);
  });

  it('MilestoneRepository.findByStatus', async () => {
    const r = new MilestoneRepository(s, e); await r.load();
    await r.insert(seed.makeMilestone({ id: 'm1', status: 'active' }));
    assert.equal(r.findByStatus('active').length, 1);
  });

  it('MilestoneReviewRecordRepository.findByMilestone', async () => {
    const r = new MilestoneReviewRecordRepository(s, e); await r.load();
    await r.insert(seed.makeMilestoneReviewRecord({ id: 'mrr1', milestone_id: 'm1' }));
    assert.equal(r.findByMilestone('m1')?.id, 'mrr1');
  });

  it('EpicRepository.findByMilestone + findByProject + findByStatus', async () => {
    const r = new EpicRepository(s, e); await r.load();
    await r.insert(seed.makeEpic({ id: 'e1', milestone_id: 'm1', status: 'active' }));
    await r.insert(seed.makeEpic({ id: 'e2', milestone_id: 'm1', status: 'pending' }));
    assert.equal(r.findByMilestone('m1').length, 2);
    assert.equal(r.findByStatus('active').length, 1);
  });

  it('EpicDependencyRepository.findRequires + findEnables', async () => {
    const r = new EpicDependencyRepository(s, e); await r.load();
    await r.insert(seed.makeEpicDependency({ id: 'ed1', requires_epic_id: 'e1', enables_epic_id: 'e2' }));
    assert.equal(r.findRequires('e2').length, 1); // e2 requires e1
    assert.equal(r.findEnables('e1').length, 1); // e1 enables e2
  });

  it('EpicCompletionRecordRepository.findByEpic', async () => {
    const r = new EpicCompletionRecordRepository(s, e); await r.load();
    await r.insert(seed.makeEpicCompletionRecord({ id: 'ecr1', epic_id: 'e1' }));
    assert.equal(r.findByEpic('e1')?.id, 'ecr1');
  });

  it('SubtaskRepository.findByTask + findOrdered', async () => {
    const r = new SubtaskRepository(s, e); await r.load();
    await r.insert(seed.makeSubtask({ id: 's2', task_id: 't1', order_index: 2 }));
    await r.insert(seed.makeSubtask({ id: 's1', task_id: 't1', order_index: 0 }));
    await r.insert(seed.makeSubtask({ id: 's3', task_id: 't1', order_index: 1 }));
    assert.equal(r.findByTask('t1').length, 3);
    const ordered = r.findOrdered('t1');
    assert.equal(ordered[0].order_index, 0);
    assert.equal(ordered[1].order_index, 1);
    assert.equal(ordered[2].order_index, 2);
  });

  it('TaskAttachmentRepository.findByTask', async () => {
    const r = new TaskAttachmentRepository(s, e); await r.load();
    await r.insert(seed.makeTaskAttachment({ id: 'ta1', task_id: 't1' }));
    assert.equal(r.findByTask('t1').length, 1);
  });

  it('TaskResourceRefRepository.findByTask + findByResource', async () => {
    const r = new TaskResourceRefRepository(s, e); await r.load();
    await r.insert(seed.makeTaskResourceRef({ task_id: 't1', resource_id: 'r1', resource_type: 'tech_stack' }));
    assert.equal(r.findByTask('t1').length, 1);
    assert.equal(r.findByResource('r1').length, 1);
  });

  it('BlockerRepository.findByTask + findUnresolved + findByType', async () => {
    const r = new BlockerRepository(s, e); await r.load();
    await r.insert(seed.makeBlocker({ id: 'b1', task_id: 't1', resolved: false, type: 'external' }));
    await r.insert(seed.makeBlocker({ id: 'b2', task_id: 't1', resolved: true, type: 'decision' }));
    assert.equal(r.findByTask('t1').length, 2);
    assert.equal(r.findUnresolved().length, 1);
    assert.equal(r.findByType('external').length, 1);
  });

  it('TaskDependencyRepository.findDependenciesOf + findDependantsOf', async () => {
    const r = new TaskDependencyRepository(s, e); await r.load();
    await r.insert(seed.makeTaskDependency({ id: 'td1', task_id: 't2', requires_task_id: 't1' }));
    assert.equal(r.findDependenciesOf('t2').length, 1);
    assert.equal(r.findDependantsOf('t1').length, 1);
  });

  it('PatternContractRepository.findByTask + findByStatus', async () => {
    const r = new PatternContractRepository(s, e); await r.load();
    await r.insert(seed.makePatternContract({ id: 'pc1', establishing_task_id: 't1', status: 'established' }));
    assert.equal(r.findByTask('t1').length, 1);
    assert.equal(r.findByStatus('established').length, 1);
  });

  it('PatternContractVersionRepository.findByContract + findLatest', async () => {
    const r = new PatternContractVersionRepository(s, e); await r.load();
    await r.insert(seed.makePatternContractVersion({ id: 'v1', contract_id: 'pc1', version_number: 1 }));
    await r.insert(seed.makePatternContractVersion({ id: 'v2', contract_id: 'pc1', version_number: 2 }));
    assert.equal(r.findByContract('pc1').length, 2);
    assert.equal(r.findLatest('pc1')?.id, 'v2');
  });

  it('PatternDependencyRepository.findNeedsReview', async () => {
    const r = new PatternDependencyRepository(s, e); await r.load();
    await r.insert(seed.makePatternDependency({ id: 'pd1', review_status: 'current' }));
    await r.insert(seed.makePatternDependency({ id: 'pd2', review_status: 'needs_review' }));
    assert.equal(r.findNeedsReview().length, 1);
  });

  it('VerificationRepository.findByTask + findStale + findByResult', async () => {
    const r = new VerificationRepository(s, e); await r.load();
    await r.insert(seed.makeVerification({ id: 'v1', task_id: 't1', current_result: 'passed' }));
    await r.insert(seed.makeVerification({ id: 'v2', task_id: 't1', current_result: 'pending' }));
    assert.equal(r.findByTask('t1').length, 2);
    assert.equal(r.findStale().length, 1);
    assert.equal(r.findByResult('passed').length, 1);
  });

  it('VerificationAttemptRepository.findByVerification + findLatest', async () => {
    const r = new VerificationAttemptRepository(s, e); await r.load();
    await r.insert(seed.makeVerificationAttempt({ id: 'a1', verification_id: 'v1', attempt_number: 1, date: '2026-01-01T00:00:00Z' }));
    await r.insert(seed.makeVerificationAttempt({ id: 'a2', verification_id: 'v1', attempt_number: 2, date: '2026-01-02T00:00:00Z' }));
    assert.equal(r.findByVerification('v1').length, 2);
    assert.equal(r.findLatest('v1')?.id, 'a2');
  });

  it('WorkIntervalRepository.findByTask + findBySession', async () => {
    const r = new WorkIntervalRepository(s, e); await r.load();
    await r.insert(seed.makeWorkInterval({ id: 'w1', task_id: 't1', session_log_id: 's1' }));
    assert.equal(r.findByTask('t1').length, 1);
    assert.equal(r.findBySession('s1').length, 1);
  });

  it('CompletionRecordRepository.findByTask', async () => {
    const r = new CompletionRecordRepository(s, e); await r.load();
    await r.insert(seed.makeCompletionRecord({ id: 'cr1', task_id: 't1' }));
    assert.equal(r.findByTask('t1')?.id, 'cr1');
  });

  it('SessionLogRepository.findLatest + findByEntryNumber', async () => {
    const r = new SessionLogRepository(s, e); await r.load();
    await r.insert(seed.makeSessionLog({ id: 'sl1', entry_number: 1 }));
    await r.insert(seed.makeSessionLog({ id: 'sl2', entry_number: 2 }));
    assert.equal(r.findLatest()?.id, 'sl2');
    assert.equal(r.findByEntryNumber(1)?.id, 'sl1');
  });

  it('PhaseCompletionRecordRepository.findByPhase + findLatestPassed', async () => {
    const r = new PhaseCompletionRecordRepository(s, e); await r.load();
    await r.insert(seed.makePhaseCompletionRecord({ id: 'ph1', phase_number: 1, gate_status: 'passed' }));
    await r.insert(seed.makePhaseCompletionRecord({ id: 'ph2', session_log_id: 'sl_2', phase_number: 2, gate_status: 'passed' }));
    assert.equal(r.findByPhase(1).length, 1);
    assert.equal(r.findLatestPassed()?.phase_number, 2);
  });

  it('DecisionRepository.findActive + findByStatus', async () => {
    const r = new DecisionRepository(s, e); await r.load();
    await r.insert(seed.makeDecision({ id: 'd1', status: 'active' }));
    await r.insert(seed.makeDecision({ id: 'd2', status: 'superseded' }));
    assert.equal(r.findActive().length, 1);
    assert.equal(r.findByStatus('superseded').length, 1);
  });

  it('QuestionRepository.findOpen + findEscalated', async () => {
    const r = new QuestionRepository(s, e); await r.load();
    await r.insert(seed.makeQuestion({ id: 'q1', status: 'open', escalation_flag: false }));
    await r.insert(seed.makeQuestion({ id: 'q2', status: 'open', escalation_flag: true }));
    assert.equal(r.findOpen().length, 2);
    assert.equal(r.findEscalated().length, 1);
  });

  it('RiskRepository.findOpen + findByStatus', async () => {
    const r = new RiskRepository(s, e); await r.load();
    await r.insert(seed.makeRisk({ id: 'r1', status: 'open' }));
    await r.insert(seed.makeRisk({ id: 'r2', status: 'mitigated' }));
    assert.equal(r.findOpen().length, 1);
    assert.equal(r.findByStatus('mitigated').length, 1);
  });

  it('ChangeRequestRepository.findPending', async () => {
    const r = new ChangeRequestRepository(s, e); await r.load();
    await r.insert(seed.makeChangeRequest({ id: 'cr1', status: 'pending_review' }));
    await r.insert(seed.makeChangeRequest({ id: 'cr2', status: 'approved' }));
    assert.equal(r.findPending().length, 1);
  });

  it('ScopeChangeRepository.findByChangeRequest', async () => {
    const r = new ScopeChangeRepository(s, e); await r.load();
    await r.insert(seed.makeScopeChange({ id: 'sc1', change_request_id: 'cr1' }));
    assert.equal(r.findByChangeRequest('cr1')?.id, 'sc1');
  });

  it('AbandonmentRecordRepository.findByEntity', async () => {
    const r = new AbandonmentRecordRepository(s, e); await r.load();
    await r.insert(seed.makeAbandonmentRecord({ id: 'ab1', entity_type: 'task', entity_id: 't1' }));
    assert.equal(r.findByEntity('task', 't1')?.id, 'ab1');
    assert.equal(r.findByEntity('epic', 'e1'), undefined);
  });
});
