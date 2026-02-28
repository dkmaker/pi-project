/**
 * @module repository/events
 * @description EventBus for repository mutation events.
 *
 * Emits events on entity insert, update, and delete. Consumed by:
 *   - Semantic search (search/sync.ts) for auto-sync of embeddings
 *   - Database facade (database.ts) for integrity tracking
 *
 * Supports multiple listeners per event type. Listeners are called synchronously
 * in registration order.
 */

/** Discriminated union of all mutation event types. */
export interface MutationEvent {
  /** What happened: insert, update, or delete. */
  type: 'entity:inserted' | 'entity:updated' | 'entity:deleted';
  /** Collection name (e.g. "tasks", "epics"). */
  collection: string;
  /** Entity ID (or composite key string for keyless entities). */
  id: string;
  /** The inserted or updated record. Undefined for deletes. */
  record?: unknown;
  /** Previous state before update. Undefined for inserts/deletes. */
  previous?: unknown;
  /** Current state after mutation. Undefined for deletes. */
  current?: unknown;
}

/** Callback signature for mutation event listeners. */
export type MutationListener = (event: MutationEvent) => void;

/**
 * Simple pub/sub event bus for repository mutations.
 *
 * Usage:
 *   const bus = new EventBus();
 *   bus.on('entity:inserted', (e) => console.log(e));
 *   bus.emit({ type: 'entity:inserted', collection: 'tasks', id: '1', record: {...} });
 */
export class EventBus {
  /** Map of event type → ordered list of listeners. */
  private listeners: Map<string, MutationListener[]> = new Map();

  /** Register a listener for a specific event type. */
  on(type: MutationEvent['type'], listener: MutationListener): void {
    const list = this.listeners.get(type);
    if (list) {
      list.push(listener);
    } else {
      this.listeners.set(type, [listener]);
    }
  }

  /** Remove a previously registered listener. */
  off(type: MutationEvent['type'], listener: MutationListener): void {
    const list = this.listeners.get(type);
    if (!list) return;
    const idx = list.indexOf(listener);
    if (idx >= 0) list.splice(idx, 1);
  }

  /** Register a listener for ALL event types. */
  onAny(listener: MutationListener): void {
    this.on('entity:inserted', listener);
    this.on('entity:updated', listener);
    this.on('entity:deleted', listener);
  }

  /** Remove a listener from ALL event types. */
  offAny(listener: MutationListener): void {
    this.off('entity:inserted', listener);
    this.off('entity:updated', listener);
    this.off('entity:deleted', listener);
  }

  /** Emit an event to all registered listeners of that type. */
  emit(event: MutationEvent): void {
    const list = this.listeners.get(event.type);
    if (!list) return;
    for (const listener of list) {
      listener(event);
    }
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners.clear();
  }
}
