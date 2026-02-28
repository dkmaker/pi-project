/**
 * @module config/defaults
 * @description Default configuration values for the project framework.
 *
 * Every config key has a default defined here. When `.project/config.yaml` is
 * created for the first time, these defaults are written. When loaded, any
 * missing keys are filled in from defaults (forward-compatible — new config
 * keys added in future versions get their defaults automatically).
 *
 * Sections:
 *   - project: project-level metadata (name, auto-session logging)
 *   - database: data storage paths and behavior
 *   - embedding: semantic search model and sync settings
 *   - session: cold-start and session log behavior
 *   - delegation: autonomous operation limits
 *
 * Consumed by: ProjectConfig (config.ts)
 * Referenced by: Database (db/database.ts), tools (db/tools.ts), index.ts
 */

/** Full configuration shape with all sections. */
export interface ProjectFrameworkConfig {
  /** Project-level metadata and behavior. */
  project: {
    /** Human-readable project name. Written into Project entity on first init. */
    name: string;
    /** Auto-create session log entries on each agent session start. */
    auto_session_log: boolean;
  };

  /** Database storage configuration. */
  database: {
    /** Directory for JSONL data files, relative to project root. */
    data_dir: string;
    /** Directory for Vectra vector indexes, relative to project root. */
    vector_dir: string;
    /** Flush writes to disk after every mutation (true) or batch on close (false). */
    flush_on_write: boolean;
  };

  /** Semantic search / embedding configuration. */
  embedding: {
    /** Enable semantic search. If false, no model is loaded, search returns empty. */
    enabled: boolean;
    /** HuggingFace model identifier. */
    model: string;
    /** Vector dimensionality. Must match the model's output. */
    dimensions: number;
    /** Sync embeddings on startup (re-embed stale records). */
    sync_on_startup: boolean;
  };

  /** Session and cold-start behavior. */
  session: {
    /** Maximum session logs to keep in memory for quick access. 0 = all. */
    max_recent_sessions: number;
    /** Auto-detect git branch/commit on session start. */
    auto_git_info: boolean;
  };

  /** Delegation and autonomy limits. */
  delegation: {
    /** Default delegation level for new tasks. */
    default_level: string;
    /** Require human confirmation before task status transitions to done. */
    require_human_review: boolean;
  };
}

/** Default configuration. Written to `.project/config.yaml` on first init. */
export const DEFAULT_CONFIG: ProjectFrameworkConfig = {
  project: {
    name: 'Unnamed Project',
    auto_session_log: true,
  },

  database: {
    data_dir: '.project/database',
    vector_dir: '.project/database/vectors',
    flush_on_write: true,
  },

  embedding: {
    enabled: true,
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 384,
    sync_on_startup: true,
  },

  session: {
    max_recent_sessions: 0,
    auto_git_info: true,
  },

  delegation: {
    default_level: 'implement',
    require_human_review: true,
  },
};
