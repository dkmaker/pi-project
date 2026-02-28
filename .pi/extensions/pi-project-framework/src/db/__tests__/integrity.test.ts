/**
 * @module __tests__/integrity.test
 * @description Phase 3: FK integrity validation tests.
 *
 * Tests that validateIntegrity() passes on valid data and catches orphan FKs.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Database } from '../database';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { NoopEmbeddingAdapter } from '../embedding/noop-adapter';
import { createSampleProject } from './__fixtures__/sample-project';

function createTestDb(): Database {
  return new Database({
    dataDir: '/tmp/unused',
    vectorDir: '/tmp/unused-vec',
    storage: new MemoryStorageAdapter(),
    embedding: new NoopEmbeddingAdapter(),
    enableEmbeddings: false,
  });
}

describe('FK integrity validation', () => {
  let db: Database;

  beforeEach(async () => {
    db = createTestDb();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('passes on valid sample project data', async () => {
    const data = createSampleProject();

    // Insert all data
    for (const p of data.projects) await db.projects.insert(p);
    for (const g of data.goals) await db.goals.insert(g);
    for (const m of data.milestones) await db.milestones.insert(m);
    for (const e of data.epics) await db.epics.insert(e);
    for (const t of data.tasks) await db.tasks.insert(t);
    for (const s of data.subtasks) await db.subtasks.insert(s);
    for (const sl of data.session_logs) await db.sessionLogs.insert(sl);
    for (const wi of data.work_intervals) await db.workIntervals.insert(wi);
    for (const cr of data.completion_records) await db.completionRecords.insert(cr);
    for (const tse of data.tech_stack_entries) await db.techStackEntries.insert(tse);
    for (const sdr of data.shared_doc_refs) await db.sharedDocRefs.insert(sdr);
    for (const r of data.rules) await db.rules.insert(r);
    for (const c of data.conventions) await db.conventions.insert(c);
    for (const gem of data.goal_epic_maps) await db.goalEpicMaps.insert(gem);
    for (const ed of data.epic_dependencies) await db.epicDependencies.insert(ed);
    for (const td of data.task_dependencies) await db.taskDependencies.insert(td);
    for (const ta of data.task_attachments) await db.taskAttachments.insert(ta);
    for (const tr of data.task_resource_refs) await db.taskResourceRefs.insert(tr);
    for (const b of data.blockers) await db.blockers.insert(b);
    for (const pc of data.pattern_contracts) await db.patternContracts.insert(pc);
    for (const pcv of data.pattern_contract_versions) await db.patternContractVersions.insert(pcv);
    for (const pd of data.pattern_dependencies) await db.patternDependencies.insert(pd);
    for (const v of data.verifications) await db.verifications.insert(v);
    for (const va of data.verification_attempts) await db.verificationAttempts.insert(va);
    for (const ph of data.phase_completion_records) await db.phaseCompletionRecords.insert(ph);
    for (const d of data.decisions) await db.decisions.insert(d);
    for (const q of data.questions) await db.questions.insert(q);
    for (const r of data.risks) await db.risks.insert(r);
    for (const cr of data.change_requests) await db.changeRequests.insert(cr);

    const report = db.validateIntegrity();
    if (!report.valid) {
      console.log('Violations:', JSON.stringify(report.violations, null, 2));
    }
    assert.ok(report.valid, `Expected no violations, got ${report.violations.length}`);
  });

  it('catches orphan FK — task with missing epic', async () => {
    const data = createSampleProject();
    await db.projects.insert(data.projects[0]);
    // Insert task WITHOUT its epic
    await db.tasks.insert(data.tasks[0]);

    const report = db.validateIntegrity();
    assert.ok(!report.valid);
    const taskViolations = report.violations.filter(v => v.fromCollection === 'tasks');
    assert.ok(taskViolations.length > 0);
  });

  it('catches orphan FK — subtask with missing task', async () => {
    // Insert subtask without task
    await db.subtasks.insert({
      id: 'orphan-sub', task_id: 'nonexistent', order_index: 0,
      description: 'Orphan', done: false, notes: '',
    });

    const report = db.validateIntegrity();
    assert.ok(!report.valid);
    assert.ok(report.violations.some(v =>
      v.fromCollection === 'subtasks' && v.missingId === 'nonexistent'
    ));
  });

  it('catches orphan FK — goal with missing project', async () => {
    await db.goals.insert({
      id: 'orphan-goal', project_id: 'nonexistent',
      statement: 'Orphan', status: 'not_started',
    });

    const report = db.validateIntegrity();
    assert.ok(!report.valid);
    assert.ok(report.violations.some(v =>
      v.fromCollection === 'goals' && v.missingId === 'nonexistent'
    ));
  });
});
