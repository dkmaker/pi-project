/**
 * @module __tests__/schema.test
 * @description Phase 1: Schema validation tests.
 *
 * Verifies every TypeBox schema accepts valid data and rejects invalid data.
 * Uses seed fixtures for valid records.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Value } from '@sinclair/typebox/value';
import {
  ProjectSchema, ProjectCompletionRecordSchema,
  GoalSchema, GoalCompletionRecordSchema, GoalEpicMapSchema,
  TechStackEntrySchema, SharedDocRefSchema, RuleSchema, ConventionSchema,
  MilestoneSchema, MilestoneReviewRecordSchema,
  EpicSchema, EpicDependencySchema, EpicCompletionRecordSchema,
  TaskSchema, SubtaskSchema, TaskAttachmentSchema, TaskResourceRefSchema,
  BlockerSchema, TaskDependencySchema,
  PatternContractSchema, PatternContractVersionSchema, PatternDependencySchema,
  VerificationSchema, VerificationAttemptSchema,
  WorkIntervalSchema, CompletionRecordSchema,
  SessionLogSchema, PhaseCompletionRecordSchema,
  DecisionSchema, QuestionSchema, RiskSchema,
  ChangeRequestSchema, ScopeChangeSchema, AbandonmentRecordSchema,
  SCHEMA_MAP, COLLECTION_NAMES,
} from '../schema/index';
import {
  makeProject, makeProjectCompletionRecord, makeGoal, makeGoalCompletionRecord,
  makeGoalEpicMap, makeTechStackEntry, makeSharedDocRef, makeRule, makeConvention,
  makeMilestone, makeMilestoneReviewRecord, makeEpic, makeEpicDependency,
  makeEpicCompletionRecord, makeTask, makeSubtask, makeTaskAttachment,
  makeTaskResourceRef, makeBlocker, makeTaskDependency, makePatternContract,
  makePatternContractVersion, makePatternDependency, makeVerification,
  makeVerificationAttempt, makeWorkInterval, makeCompletionRecord,
  makeSessionLog, makePhaseCompletionRecord, makeDecision, makeQuestion,
  makeRisk, makeChangeRequest, makeScopeChange, makeAbandonmentRecord,
  resetCounter,
} from './__fixtures__/seed';

describe('Schema validation — valid records', () => {
  const cases: [string, unknown, unknown][] = [
    ['project', ProjectSchema, makeProject()],
    ['project_completion_record', ProjectCompletionRecordSchema, makeProjectCompletionRecord()],
    ['goal', GoalSchema, makeGoal()],
    ['goal_completion_record', GoalCompletionRecordSchema, makeGoalCompletionRecord()],
    ['goal_epic_map', GoalEpicMapSchema, makeGoalEpicMap()],
    ['tech_stack_entry', TechStackEntrySchema, makeTechStackEntry()],
    ['shared_doc_ref', SharedDocRefSchema, makeSharedDocRef()],
    ['rule', RuleSchema, makeRule()],
    ['convention', ConventionSchema, makeConvention()],
    ['milestone', MilestoneSchema, makeMilestone()],
    ['milestone_review_record', MilestoneReviewRecordSchema, makeMilestoneReviewRecord()],
    ['epic', EpicSchema, makeEpic()],
    ['epic_dependency', EpicDependencySchema, makeEpicDependency()],
    ['epic_completion_record', EpicCompletionRecordSchema, makeEpicCompletionRecord()],
    ['task', TaskSchema, makeTask()],
    ['subtask', SubtaskSchema, makeSubtask()],
    ['task_attachment', TaskAttachmentSchema, makeTaskAttachment()],
    ['task_resource_ref', TaskResourceRefSchema, makeTaskResourceRef()],
    ['blocker', BlockerSchema, makeBlocker()],
    ['task_dependency', TaskDependencySchema, makeTaskDependency()],
    ['pattern_contract', PatternContractSchema, makePatternContract()],
    ['pattern_contract_version', PatternContractVersionSchema, makePatternContractVersion()],
    ['pattern_dependency', PatternDependencySchema, makePatternDependency()],
    ['verification', VerificationSchema, makeVerification()],
    ['verification_attempt', VerificationAttemptSchema, makeVerificationAttempt()],
    ['work_interval', WorkIntervalSchema, makeWorkInterval()],
    ['completion_record', CompletionRecordSchema, makeCompletionRecord()],
    ['session_log', SessionLogSchema, makeSessionLog()],
    ['phase_completion_record', PhaseCompletionRecordSchema, makePhaseCompletionRecord()],
    ['decision', DecisionSchema, makeDecision()],
    ['question', QuestionSchema, makeQuestion()],
    ['risk', RiskSchema, makeRisk()],
    ['change_request', ChangeRequestSchema, makeChangeRequest()],
    ['scope_change', ScopeChangeSchema, makeScopeChange()],
    ['abandonment_record', AbandonmentRecordSchema, makeAbandonmentRecord()],
  ];

  for (const [name, schema, record] of cases) {
    it(`${name} accepts valid data`, () => {
      assert.ok(Value.Check(schema as any, record), `${name} should be valid`);
    });
  }
});

describe('Schema validation — invalid records', () => {
  it('rejects task with invalid status', () => {
    const bad = { ...makeTask(), status: 'invalid_status' };
    assert.ok(!Value.Check(TaskSchema, bad));
  });

  it('rejects task missing required field', () => {
    const { name, ...bad } = makeTask();
    assert.ok(!Value.Check(TaskSchema, bad));
  });

  it('rejects project with invalid stage', () => {
    const bad = { ...makeProject(), stage: 'invalid' };
    assert.ok(!Value.Check(ProjectSchema, bad));
  });

  it('rejects epic with invalid status', () => {
    const bad = { ...makeEpic(), status: 'invalid' };
    assert.ok(!Value.Check(EpicSchema, bad));
  });

  it('rejects subtask with string order_index', () => {
    const bad = { ...makeSubtask(), order_index: 'first' };
    assert.ok(!Value.Check(SubtaskSchema, bad));
  });

  it('rejects risk with invalid likelihood', () => {
    const bad = { ...makeRisk(), likelihood: 'extreme' };
    assert.ok(!Value.Check(RiskSchema, bad));
  });

  it('rejects blocker with number description', () => {
    const bad = { ...makeBlocker(), description: 123 };
    assert.ok(!Value.Check(BlockerSchema, bad));
  });

  it('rejects task_resource_ref with invalid resource_type', () => {
    const bad = { ...makeTaskResourceRef(), resource_type: 'database' };
    assert.ok(!Value.Check(TaskResourceRefSchema, bad));
  });
});

describe('Schema registry', () => {
  it('SCHEMA_MAP has 35 entries', () => {
    assert.equal(Object.keys(SCHEMA_MAP).length, 35);
  });

  it('COLLECTION_NAMES has 35 entries', () => {
    assert.equal(COLLECTION_NAMES.length, 35);
  });

  it('SCHEMA_MAP keys match COLLECTION_NAMES', () => {
    assert.deepEqual(Object.keys(SCHEMA_MAP).sort(), [...COLLECTION_NAMES].sort());
  });

  it('every SCHEMA_MAP entry is a valid TObject', () => {
    for (const [name, schema] of Object.entries(SCHEMA_MAP)) {
      assert.ok(schema.type === 'object', `${name} should be a TObject`);
      assert.ok(schema.properties, `${name} should have properties`);
    }
  });
});
