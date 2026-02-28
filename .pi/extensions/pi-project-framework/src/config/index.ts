/**
 * @module config
 * @description Public API for the config module.
 *
 * Re-exports everything consumers need:
 *   - initConfig(): call on extension load to ensure config exists
 *   - getConfig(): get the current config (after init)
 *   - updateConfig(): change and persist config values
 *   - ProjectFrameworkConfig: the full config type
 *   - DEFAULT_CONFIG: default values
 */

export { initConfig, getConfig, updateConfig, resetConfigCache } from './config';
export type { ProjectFrameworkConfig } from './config';
export { DEFAULT_CONFIG } from './defaults';
