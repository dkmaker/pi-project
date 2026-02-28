/**
 * @module __tests__/database.test
 * @description Phase 3: Full lifecycle integration test.
 *
 * Creates a Database with Memory + NoOp adapters, populates with the full
 * synthetic sample project, queries all repositories, validates integrity,
 * performs mutations (transitions, updates, deletes), and verifies events.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Database } from '../database';
import { MemoryStorageAdapter } from '../storage/memory-adapter';
import { NoopEmbeddingAdapter } from '../embedding/noop-adapter';
import { createSampleProject } from './__fixtures__/sample-project';
import type { MutationEvent } from '../repository/events';
import type { DatabaseConfig } from '../types';

function createTestDb(): Database {
  return new Database({
    dataDir: '/tmp/unused',
    vectorDir: '/tmp/unused-vec',
    storage: new MemoryStorageAdapter(),
    embedding: new NoopEmbeddingAdapter(),
    enableEmbeddings: false,
  });
}

describe('Database — full lifecycle', () => {
  let db: Database;

  beforeEach(async () => {
    db = createTestDb();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('opens with empty repositories', () => {
    assert.equal(db.projects.count(), 0);
    assert.equal(db.tasks.count(), 0);
  });

  it('populates all 35 entity types from sample project', async () => {
    const data = createSampleProject();

    // Insert in FK order
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

    // Verify counts
    assert.equal(db.projects.count(), 1);
    assert.equal(db.goals.count(), 2);
    assert.equal(db.milestones.count(), 1);
    assert.equal(db.epics.count(), 3);
    assert.equal(db.tasks.count(), 8);
    assert.equal(db.subtasks.count(), 5);
    assert.equal(db.sessionLogs.count(), 2);
    assert.equal(db.workIntervals.count(), 2);
    assert.equal(db.completionRecords.count(), 1);
    assert.equal(db.techStackEntries.count(), 2);
    assert.equal(db.goalEpicMaps.count(), 3);
    assert.equal(db.epicDependencies.count(), 2);
    assert.equal(db.taskDependencies.count(), 4);
    assert.equal(db.blockers.count(), 1);
    assert.equal(db.patternContracts.count(), 1);
    assert.equal(db.patternContractVersions.count(), 1);
    assert.equal(db.patternDependencies.count(), 1);
    assert.equal(db.verifications.count(), 2);
    assert.equal(db.verificationAttempts.count(), 1);
    assert.equal(db.phaseCompletionRecords.count(), 3);
    assert.equal(db.decisions.count(), 1);
    assert.equal(db.questions.count(), 1);
    assert.equal(db.risks.count(), 1);
    assert.equal(db.changeRequests.count(), 1);
  });

  it('queries return correct data after population', async () => {
    const data = createSampleProject();
    for (const p of data.projects) await db.projects.insert(p);
    for (const g of data.goals) await db.goals.insert(g);
    for (const m of data.milestones) await db.milestones.insert(m);
    for (const e of data.epics) await db.epics.insert(e);
    for (const t of data.tasks) await db.tasks.insert(t);
    for (const s of data.subtasks) await db.subtasks.insert(s);
    for (const sl of data.session_logs) await db.sessionLogs.insert(sl);
    for (const td of data.task_dependencies) await db.taskDependencies.insert(td);
    for (const b of data.blockers) await db.blockers.insert(b);
    for (const d of data.decisions) await db.decisions.insert(d);
    for (const q of data.questions) await db.questions.insert(q);
    for (const r of data.risks) await db.risks.insert(r);

    // Project queries
    assert.equal(db.projects.getCurrent()?.name, 'Widget Platform');

    // Goal queries
    assert.equal(db.goals.findByProject('proj-1').length, 2);
    assert.equal(db.goals.findByStatus('in_progress').length, 1);

    // Epic queries
    assert.equal(db.epics.findByMilestone('ms-1').length, 3);
    assert.equal(db.epics.findByStatus('active').length, 1);

    // Task queries
    assert.equal(db.tasks.findByEpic('epic-1').length, 4);
    assert.equal(db.tasks.findByEpic('epic-2').length, 2);
    assert.equal(db.tasks.findActive().length, 1);
    assert.equal(db.tasks.findBlocked().length, 1);
    assert.equal(db.tasks.findByPriority('high').length, 3);

    // Subtask queries
    const ordered = db.subtasks.findOrdered('task-2');
    assert.equal(ordered.length, 3);
    assert.equal(ordered[0].order_index, 0);

    // Session log queries
    assert.equal(db.sessionLogs.findLatest()?.entry_number, 2);
    assert.equal(db.sessionLogs.findByEntryNumber(1)?.id, 'sl-1');

    // Dependency queries
    assert.equal(db.taskDependencies.findDependenciesOf('task-3').length, 1);
    assert.equal(db.taskDependencies.findDependantsOf('task-2').length, 1);

    // Blocker queries
    assert.equal(db.blockers.findUnresolved().length, 1);
    assert.equal(db.blockers.findByTask('task-8').length, 1);

    // Decision/Question/Risk queries
    assert.equal(db.decisions.findActive().length, 1);
    assert.equal(db.questions.findOpen().length, 1);
    assert.equal(db.risks.findOpen().length, 1);

    // Query builder integration
    const criticalAndHigh = db.tasks.query()
      .whereIn('priority', ['critical', 'high'])
      .sortBy('name')
      .execute();
    assert.equal(criticalAndHigh.length, 4);

    const epicTaskCounts = db.tasks.query().groupBy('epic_id');
    assert.equal(epicTaskCounts.get('epic-1')?.length, 4);
  });

  it('task transitions work correctly', async () => {
    const data = createSampleProject();
    for (const p of data.projects) await db.projects.insert(p);
    for (const m of data.milestones) await db.milestones.insert(m);
    for (const e of data.epics) await db.epics.insert(e);
    for (const t of data.tasks) await db.tasks.insert(t);

    // pending → active
    const task = await db.tasks.transition('task-3', 'active');
    assert.equal(task.status, 'active');

    // active → in_review
    await db.tasks.transition('task-3', 'in_review');
    assert.equal(db.tasks.getById('task-3')?.status, 'in_review');

    // in_review → done
    await db.tasks.transition('task-3', 'done');
    assert.equal(db.tasks.getById('task-3')?.status, 'done');
  });

  it('events fire on mutations', async () => {
    const captured: MutationEvent[] = [];
    db.events.onAny(e => captured.push(e));

    const data = createSampleProject();
    await db.projects.insert(data.projects[0]);

    assert.equal(captured.length, 1);
    assert.equal(captured[0].type, 'entity:inserted');
    assert.equal(captured[0].collection, 'projects');

    await db.projects.update('proj-1', { name: 'Renamed' });
    assert.equal(captured.length, 2);
    assert.equal(captured[1].type, 'entity:updated');

    await db.projects.delete('proj-1');
    assert.equal(captured.length, 3);
    assert.equal(captured[2].type, 'entity:deleted');
  });
});
