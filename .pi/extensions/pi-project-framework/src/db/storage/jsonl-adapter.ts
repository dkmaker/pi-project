/**
 * @module storage/jsonl-adapter
 * @description JSONL file-based storage adapter for production use.
 *
 * Each collection maps to a `<baseDir>/<name>.jsonl` file — one JSON object per line,
 * newline-terminated. Embedded newlines in string values are safe because JSON.stringify
 * escapes them as `\n`.
 *
 * Write safety: all writes go to a `.tmp` file first, then `fs.rename()` atomically
 * replaces the original. This prevents data loss on crash mid-write.
 *
 * Used by: BaseRepository (repository/base-repository.ts) via StorageAdapter interface.
 * Data directory: `.project/database/` (committed to git — project state for cold-start).
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import type { StorageAdapter } from './adapter';

export class JsonlStorageAdapter implements StorageAdapter {
  /** Absolute path to the directory containing .jsonl files. */
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /** Resolve collection name to file path: `<baseDir>/<name>.jsonl`. */
  private filePath(name: string): string {
    return path.join(this.baseDir, `${name}.jsonl`);
  }

  /**
   * Load all records from a JSONL file.
   * Returns [] if the file doesn't exist or is empty.
   * Throws on malformed JSON lines.
   */
  async loadCollection(name: string): Promise<Record<string, unknown>[]> {
    const fp = this.filePath(name);
    let content: string;
    try {
      content = await fsp.readFile(fp, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }

    if (!content.trim()) return [];

    const records: Record<string, unknown>[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        records.push(JSON.parse(trimmed));
      }
    }
    return records;
  }

  /**
   * Write all records to a JSONL file atomically.
   * Creates the base directory if it doesn't exist.
   * Writes to `<file>.tmp` first, then renames over the target.
   */
  async saveCollection(name: string, records: Record<string, unknown>[]): Promise<void> {
    await fsp.mkdir(this.baseDir, { recursive: true });
    const fp = this.filePath(name);
    const tmpPath = `${fp}.tmp`;
    const content = records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
    await fsp.writeFile(tmpPath, content, 'utf-8');
    await fsp.rename(tmpPath, fp);
  }

  /** Check if the JSONL file exists on disk. */
  async hasCollection(name: string): Promise<boolean> {
    try {
      await fsp.access(this.filePath(name), fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /** List all collections by scanning for *.jsonl files in the base directory. */
  async listCollections(): Promise<string[]> {
    let entries: string[];
    try {
      entries = await fsp.readdir(this.baseDir);
    } catch (err: any) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    return entries
      .filter(e => e.endsWith('.jsonl'))
      .map(e => e.slice(0, -6));
  }

  /** Delete the JSONL file for a collection. No-op if the file doesn't exist. */
  async deleteCollection(name: string): Promise<void> {
    try {
      await fsp.unlink(this.filePath(name));
    } catch (err: any) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
  }
}
