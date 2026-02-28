/**
 * @module config/config
 * @description Shared config manager for the project framework extension.
 *
 * On extension load or session start:
 *   1. Checks for `.project/` directory — creates if missing.
 *   2. Checks for `.project/config.yaml` — creates with defaults if missing.
 *   3. Loads config, deep-merges with defaults (new keys get defaults automatically).
 *   4. Writes back merged config (so new default keys appear in the file).
 *
 * The config is a singleton — call `getConfig(projectRoot)` from anywhere.
 * Config is also writable: call `updateConfig(projectRoot, patch)` to change
 * values and persist immediately.
 *
 * Related:
 *   - defaults.ts: default values and ProjectFrameworkConfig type
 *   - index.ts (extension entry): calls initConfig() on load
 *   - db/_DEBUG_TOOLS.ts: reads config for database paths (debug only — remove before production)
 *   - db/database.ts: uses config for dataDir, vectorDir, embedding settings
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse, stringify } from 'yaml';
import { DEFAULT_CONFIG } from './defaults';
import type { ProjectFrameworkConfig } from './defaults';

/** Re-export the config type for consumers. */
export type { ProjectFrameworkConfig } from './defaults';

/** Cached config instance. Null until first load. */
let cachedConfig: ProjectFrameworkConfig | null = null;

/** Cached project root. */
let cachedProjectRoot: string | null = null;

/** Path to the config file relative to project root. */
const CONFIG_RELATIVE_PATH = '.project/config.yaml';

/**
 * Get the resolved path to the config file.
 */
function configPath(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_RELATIVE_PATH);
}

/**
 * Deep-merge source into target. Source values override target.
 * Only merges plain objects — arrays and primitives are replaced.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const targetVal = target[key];
    const sourceVal = source[key];
    if (
      targetVal && sourceVal &&
      typeof targetVal === 'object' && !Array.isArray(targetVal) &&
      typeof sourceVal === 'object' && !Array.isArray(sourceVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }
  return result;
}

/**
 * Initialize and return the project config.
 *
 * - Creates `.project/` directory if missing.
 * - Creates `.project/config.yaml` with defaults if missing.
 * - Loads existing config and merges with defaults (fills new keys).
 * - Writes back the merged config so the file always has all keys.
 *
 * Safe to call multiple times — returns cached config after first load.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns The loaded and merged configuration.
 */
export function initConfig(projectRoot: string): ProjectFrameworkConfig {
  if (cachedConfig && cachedProjectRoot === projectRoot) {
    return cachedConfig;
  }

  const projectDir = path.join(projectRoot, '.project');
  const cfgPath = configPath(projectRoot);

  // Ensure .project/ exists
  fs.mkdirSync(projectDir, { recursive: true });

  let config: ProjectFrameworkConfig;

  if (fs.existsSync(cfgPath)) {
    // Load existing config
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const parsed = parse(raw) as Partial<ProjectFrameworkConfig> | null;

    // Merge with defaults (fills in any new keys)
    config = deepMerge(DEFAULT_CONFIG, parsed ?? {});
  } else {
    // First time — use defaults
    config = { ...DEFAULT_CONFIG };
  }

  // Always write back (ensures file exists and has all current keys)
  writeConfig(projectRoot, config);

  // Ensure .project/.gitignore exists with vector dir excluded
  ensureGitignore(projectRoot, config);

  cachedConfig = config;
  cachedProjectRoot = projectRoot;
  return config;
}

/**
 * Get the current config. Must call initConfig() first.
 * Throws if config hasn't been initialized.
 */
export function getConfig(): ProjectFrameworkConfig {
  if (!cachedConfig) {
    throw new Error('Config not initialized. Call initConfig(projectRoot) first.');
  }
  return cachedConfig;
}

/**
 * Update config with a partial patch. Deep-merges and persists immediately.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param patch - Partial config to merge in.
 * @returns The updated full config.
 */
export function updateConfig(
  projectRoot: string,
  patch: Partial<ProjectFrameworkConfig>,
): ProjectFrameworkConfig {
  const current = initConfig(projectRoot);
  const updated = deepMerge(current, patch);
  writeConfig(projectRoot, updated);
  cachedConfig = updated;
  return updated;
}

/**
 * Write config to disk as YAML.
 */
function writeConfig(projectRoot: string, config: ProjectFrameworkConfig): void {
  const cfgPath = configPath(projectRoot);
  const header = [
    '# Project Framework Configuration',
    '# Auto-generated — edit values as needed, new keys are added automatically.',
    '#',
    '# Docs: see FRAMEWORK/INDEX.md and src/config/defaults.ts for all options.',
    '',
  ].join('\n');
  const yaml = stringify(config, { lineWidth: 120 });
  fs.writeFileSync(cfgPath, header + yaml, 'utf8');
}

/**
 * Ensure `.project/.gitignore` exists and contains the vectors directory.
 * The vectors dir is derived data (regenerated on startup) and should not be committed.
 * Preserves any existing entries the user may have added.
 */
function ensureGitignore(projectRoot: string, config: ProjectFrameworkConfig): void {
  const gitignorePath = path.join(projectRoot, '.project', '.gitignore');

  // Compute the vector dir path relative to .project/
  // e.g. config.database.vector_dir = ".project/database/vectors" → "database/vectors/"
  const projectDirPrefix = '.project/';
  let vectorEntry = config.database.vector_dir;
  if (vectorEntry.startsWith(projectDirPrefix)) {
    vectorEntry = vectorEntry.slice(projectDirPrefix.length);
  }
  if (!vectorEntry.endsWith('/')) {
    vectorEntry += '/';
  }

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (content.includes(vectorEntry)) return; // Already present
    // Append
    const separator = content.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(gitignorePath, content + separator + vectorEntry + '\n', 'utf8');
  } else {
    const content = [
      '# Auto-generated by pi-project-framework',
      '# Vector indexes are derived data — regenerated on startup if missing.',
      vectorEntry,
      '',
    ].join('\n');
    fs.writeFileSync(gitignorePath, content, 'utf8');
  }
}

/**
 * Reset the cached config (for testing or re-initialization).
 */
export function resetConfigCache(): void {
  cachedConfig = null;
  cachedProjectRoot = null;
}
