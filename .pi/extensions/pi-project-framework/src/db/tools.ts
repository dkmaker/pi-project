/**
 * @module db/tools
 * @description Temporary debug tools for seeding and inspecting the database.
 *
 * Registers two tools:
 *   - db_seed: Populates the database with a complete synthetic test project
 *   - db_query: Inspects database contents — list collections, count, get by ID, find by field
 *
 * These are development/debug tools. Remove before production.
 *
 * Related:
 *   - Database (database.ts): the facade these tools operate on
 *   - sample-project.ts: the synthetic data source for seeding
 */

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from '@sinclair/typebox';
import { Database } from './database';
import { createSampleProject } from './__tests__/__fixtures__/sample-project';
import type { SampleProjectData } from './__tests__/__fixtures__/sample-project';
import type { EmbeddingProgressCallback } from './types';
import { getConfig } from '../config/config';
import * as path from 'node:path';
import * as fs from 'node:fs';

/** Shared database instance across tools. */
let db: Database | null = null;

/** Close and discard the current database instance (forces re-creation on next getDb). */
async function resetDb(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

/** Get or create the database instance, using paths from config. */
async function getDb(projectRoot: string, onEmbeddingProgress?: EmbeddingProgressCallback): Promise<Database> {
  if (db) return db;

  const config = getConfig();
  const dataDir = path.resolve(projectRoot, config.database.data_dir);
  const vectorDir = path.resolve(projectRoot, config.database.vector_dir);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(vectorDir, { recursive: true });

  db = new Database({
    dataDir,
    vectorDir,
    enableEmbeddings: config.embedding.enabled,
    onEmbeddingProgress,
  });
  await db.open();
  return db;
}

/**
 * Register temporary database debug tools on the given ExtensionAPI.
 *
 * @param pi - The pi extension API
 * @param projectRoot - Absolute path to the project root (for .project/database/)
 */
export function registerDbTools(pi: ExtensionAPI, projectRoot: string): void {

  // ─── db_seed: populate with sample project ─────────────────────

  pi.registerTool({
    name: 'db_seed',
    label: 'DB Seed',
    description: 'Seed the database with a complete synthetic test project (1 project, 2 goals, 1 milestone, 3 epics, 8 tasks, and all related entities). Clears existing data first.',
    parameters: Type.Object({}),

    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      try {
        // Reset db to ensure fresh instance with current config (incl. embeddings)
        await resetDb();

        // Clear existing JSONL files so we start fresh
        const config = getConfig();
        const dataDir = path.resolve(projectRoot, config.database.data_dir);
        const vectorDir = path.resolve(projectRoot, config.database.vector_dir);
        for (const f of fs.readdirSync(dataDir).filter(f => f.endsWith('.jsonl'))) {
          fs.unlinkSync(path.join(dataDir, f));
        }
        // Clear vector indexes
        if (fs.existsSync(vectorDir)) {
          fs.rmSync(vectorDir, { recursive: true, force: true });
          fs.mkdirSync(vectorDir, { recursive: true });
        }

        // Wire embedding progress to TUI status bar
        const statusKey = 'db-embed';
        const progressCb: EmbeddingProgressCallback = (info) => {
          if (info.phase === 'init') {
            ctx.ui?.setStatus(statusKey, '🧠 Loading embedding model…');
          } else if (info.phase === 'sync') {
            ctx.ui?.setStatus(statusKey, `🧠 Embedding ${info.entityType} ${info.current}/${info.total}`);
          } else if (info.phase === 'done') {
            ctx.ui?.setStatus(statusKey, '✅ Embeddings synced');
            // Clear after 3 seconds
            setTimeout(() => ctx.ui?.setStatus(statusKey, undefined), 3000);
          }
        };

        const database = await getDb(projectRoot, progressCb);
        const data = createSampleProject();

        // Insert in FK order
        const insertionOrder: [string, keyof SampleProjectData][] = [
          ['projects', 'projects'],
          ['goals', 'goals'],
          ['milestones', 'milestones'],
          ['epics', 'epics'],
          ['tasks', 'tasks'],
          ['subtasks', 'subtasks'],
          ['sessionLogs', 'session_logs'],
          ['workIntervals', 'work_intervals'],
          ['completionRecords', 'completion_records'],
          ['techStackEntries', 'tech_stack_entries'],
          ['sharedDocRefs', 'shared_doc_refs'],
          ['rules', 'rules'],
          ['conventions', 'conventions'],
          ['goalEpicMaps', 'goal_epic_maps'],
          ['epicDependencies', 'epic_dependencies'],
          ['epicCompletionRecords', 'epic_completion_records'],
          ['taskDependencies', 'task_dependencies'],
          ['taskAttachments', 'task_attachments'],
          ['taskResourceRefs', 'task_resource_refs'],
          ['blockers', 'blockers'],
          ['patternContracts', 'pattern_contracts'],
          ['patternContractVersions', 'pattern_contract_versions'],
          ['patternDependencies', 'pattern_dependencies'],
          ['verifications', 'verifications'],
          ['verificationAttempts', 'verification_attempts'],
          ['phaseCompletionRecords', 'phase_completion_records'],
          ['decisions', 'decisions'],
          ['questions', 'questions'],
          ['risks', 'risks'],
          ['changeRequests', 'change_requests'],
          ['scopeChanges', 'scope_changes'],
          ['abandonmentRecords', 'abandonment_records'],
          ['projectCompletionRecords', 'project_completion_records'],
          ['goalCompletionRecords', 'goal_completion_records'],
          ['milestoneReviewRecords', 'milestone_review_records'],
        ];

        const counts: Record<string, number> = {};
        for (const [repoProp, dataKey] of insertionOrder) {
          const records = data[dataKey] as any[];
          const repo = (database as any)[repoProp];
          if (!repo || !records) continue;
          for (const record of records) {
            await repo.insert(record);
          }
          if (records.length > 0) {
            counts[dataKey] = records.length;
          }
        }

        // Validate integrity
        const integrity = database.validateIntegrity();

        const lines = [
          '✅ Database seeded successfully!',
          '',
          'Entity counts:',
          ...Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`),
          '',
          `FK integrity: ${integrity.valid ? '✅ valid' : `⚠️ ${integrity.violations.length} violations`}`,
        ];

        if (!integrity.valid) {
          lines.push('Violations:');
          for (const v of integrity.violations.slice(0, 10)) {
            lines.push(`  ${v.fromCollection}.${v.fromField} → ${v.toCollection} (missing: ${v.missingId})`);
          }
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `❌ Seed failed: ${err.message}\n${err.stack}` }] };
      }
    },
  });

  // ─── db_query: inspect database contents ───────────────────────

  pi.registerTool({
    name: 'db_query',
    label: 'DB Query',
    description: 'Inspect database contents. Actions: "collections" (list all with counts), "all" (get all records in a collection), "get" (get record by ID), "find" (find records where field=value), "integrity" (run FK validation), "insert" (add record from JSON), "update" (patch record by ID), "delete" (remove record by ID).',
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal('collections'),
        Type.Literal('all'),
        Type.Literal('get'),
        Type.Literal('find'),
        Type.Literal('integrity'),
        Type.Literal('insert'),
        Type.Literal('update'),
        Type.Literal('delete'),
      ], { description: 'What to do' }),
      collection: Type.Optional(Type.String({ description: 'Collection name (e.g. "tasks", "epics"). Required for all/get/find/insert/update/delete.' })),
      id: Type.Optional(Type.String({ description: 'Record ID. Required for "get", "update", "delete".' })),
      field: Type.Optional(Type.String({ description: 'Field name to filter on. Required for "find".' })),
      value: Type.Optional(Type.String({ description: 'Field value to match. Required for "find".' })),
      data: Type.Optional(Type.String({ description: 'JSON string of record to insert, or partial patch for update.' })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        const database = await getDb(projectRoot);
        const { action, collection, id, field, value, data } = params as {
          action: string; collection?: string; id?: string; field?: string; value?: string; data?: string;
        };

        if (action === 'collections') {
          const repoMap = getRepoMap(database);
          const lines = ['Collections:\n'];
          for (const [name, repo] of Object.entries(repoMap)) {
            const count = repo.count();
            if (count > 0) {
              lines.push(`  ${name}: ${count} records`);
            }
          }
          const empty = Object.entries(repoMap).filter(([_, r]) => r.count() === 0).map(([n]) => n);
          if (empty.length > 0) {
            lines.push(`\n  Empty (${empty.length}): ${empty.join(', ')}`);
          }
          return { content: [{ type: 'text', text: lines.join('\n') }] };
        }

        if (action === 'integrity') {
          const report = database.validateIntegrity();
          if (report.valid) {
            return { content: [{ type: 'text', text: '✅ All FK references are valid.' }] };
          }
          const lines = [`⚠️ ${report.violations.length} FK violations:\n`];
          for (const v of report.violations) {
            lines.push(`  ${v.fromCollection}/${v.fromId}.${v.fromField} → ${v.toCollection} (missing: ${v.missingId})`);
          }
          return { content: [{ type: 'text', text: lines.join('\n') }] };
        }

        if (!collection) {
          return { content: [{ type: 'text', text: '❌ "collection" parameter required for this action.' }] };
        }

        const repoMap = getRepoMap(database);
        const repo = repoMap[collection];
        if (!repo) {
          return { content: [{ type: 'text', text: `❌ Unknown collection: "${collection}". Available: ${Object.keys(repoMap).join(', ')}` }] };
        }

        if (action === 'all') {
          const records = repo.getAll();
          return { content: [{ type: 'text', text: `${collection} (${records.length} records):\n\n${JSON.stringify(records, null, 2)}` }] };
        }

        if (action === 'get') {
          if (!id) return { content: [{ type: 'text', text: '❌ "id" parameter required for "get".' }] };
          const record = repo.getById(id);
          if (!record) return { content: [{ type: 'text', text: `No record found with id="${id}" in ${collection}.` }] };
          return { content: [{ type: 'text', text: `${collection}/${id}:\n\n${JSON.stringify(record, null, 2)}` }] };
        }

        if (action === 'find') {
          if (!field || value === undefined) {
            return { content: [{ type: 'text', text: '❌ "field" and "value" parameters required for "find".' }] };
          }
          const records = repo.find((r: any) => String(r[field]) === value);
          return { content: [{ type: 'text', text: `${collection} where ${field}="${value}" (${records.length} results):\n\n${JSON.stringify(records, null, 2)}` }] };
        }

        if (action === 'integrity') {
          const report = database.validateIntegrity();
          if (report.valid) {
            return { content: [{ type: 'text', text: '✅ All FK references are valid.' }] };
          }
          const lines = [`⚠️ ${report.violations.length} FK violations:\n`];
          for (const v of report.violations) {
            lines.push(`  ${v.fromCollection}/${v.fromId}.${v.fromField} → ${v.toCollection} (missing: ${v.missingId})`);
          }
          return { content: [{ type: 'text', text: lines.join('\n') }] };
        }

        if (action === 'insert') {
          if (!data) return { content: [{ type: 'text', text: '❌ "data" parameter required for "insert" (JSON string).' }] };
          const record = JSON.parse(data);
          const result = await repo.insert(record);
          return { content: [{ type: 'text', text: `✅ Inserted into ${collection}:\n\n${JSON.stringify(result, null, 2)}` }] };
        }

        if (action === 'update') {
          if (!id) return { content: [{ type: 'text', text: '❌ "id" parameter required for "update".' }] };
          if (!data) return { content: [{ type: 'text', text: '❌ "data" parameter required for "update" (JSON patch string).' }] };
          const patch = JSON.parse(data);
          const result = await repo.update(id, patch);
          return { content: [{ type: 'text', text: `✅ Updated ${collection}/${id}:\n\n${JSON.stringify(result, null, 2)}` }] };
        }

        if (action === 'delete') {
          if (!id) return { content: [{ type: 'text', text: '❌ "id" parameter required for "delete".' }] };
          await repo.delete(id);
          return { content: [{ type: 'text', text: `✅ Deleted ${collection}/${id}` }] };
        }

        return { content: [{ type: 'text', text: `❌ Unknown action: "${action}"` }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `❌ Query failed: ${err.message}` }] };
      }
    },
  });
}

/** Convert snake_case collection name to camelCase repository property name. */
function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Build a map of collection name → repository for dynamic access. */
function getRepoMap(database: Database): Record<string, any> {
  return {
    projects: database.projects,
    project_completion_records: database.projectCompletionRecords,
    goals: database.goals,
    goal_completion_records: database.goalCompletionRecords,
    goal_epic_maps: database.goalEpicMaps,
    tech_stack_entries: database.techStackEntries,
    shared_doc_refs: database.sharedDocRefs,
    rules: database.rules,
    conventions: database.conventions,
    milestones: database.milestones,
    milestone_review_records: database.milestoneReviewRecords,
    epics: database.epics,
    epic_dependencies: database.epicDependencies,
    epic_completion_records: database.epicCompletionRecords,
    tasks: database.tasks,
    subtasks: database.subtasks,
    task_attachments: database.taskAttachments,
    task_resource_refs: database.taskResourceRefs,
    blockers: database.blockers,
    task_dependencies: database.taskDependencies,
    pattern_contracts: database.patternContracts,
    pattern_contract_versions: database.patternContractVersions,
    pattern_dependencies: database.patternDependencies,
    verifications: database.verifications,
    verification_attempts: database.verificationAttempts,
    work_intervals: database.workIntervals,
    completion_records: database.completionRecords,
    session_logs: database.sessionLogs,
    phase_completion_records: database.phaseCompletionRecords,
    decisions: database.decisions,
    questions: database.questions,
    risks: database.risks,
    change_requests: database.changeRequests,
    scope_changes: database.scopeChanges,
    abandonment_records: database.abandonmentRecords,
  };
}
