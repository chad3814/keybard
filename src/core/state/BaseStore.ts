/**
 * Base MobX store class with common functionality
 */

import { observable, action, computed, toJS } from 'mobx';
import { EventBus, EventType } from '../events/EventBus';

export interface StoreState {
  [key: string]: any;
}

export interface HistoryEntry<T> {
  timestamp: number;
  state: T;
  action?: string;
}

/**
 * Abstract base class for MobX stores
 */
export abstract class BaseStore<T extends StoreState = StoreState> {
  @observable protected state: T;
  @observable protected history: HistoryEntry<T>[] = [];
  @observable protected historyIndex = -1;
  protected maxHistorySize = 50;
  @observable public isDirty = false;

  protected eventBus: EventBus;
  protected storeName: string;

  constructor(initialState: T, storeName: string) {
    this.state = initialState;
    this.storeName = storeName;
    this.eventBus = EventBus.getInstance();

    // Add initial state to history
    this.addToHistory('init');
  }

  /**
   * Get current state (computed for reactivity)
   */
  @computed
  public get currentState(): Readonly<T> {
    return this.state;
  }

  /**
   * Check if undo is available
   */
  @computed
  public get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  @computed
  public get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Update state with automatic history tracking
   */
  @action
  protected setState(updates: Partial<T>, actionName?: string): void {
    const oldState = toJS(this.state);

    this.state = {
      ...this.state,
      ...updates,
    };

    this.isDirty = true;
    this.addToHistory(actionName || 'update');

    // Emit state change event
    this.eventBus.emit(EventType.STATE_CHANGED, {
      type: this.storeName,
      id: actionName || 'unknown',
      oldValue: oldState,
      newValue: toJS(this.state),
    });
  }

  /**
   * Add current state to history
   */
  @action
  private addToHistory(actionName: string): void {
    // Remove any history after current index (for redo)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new entry
    this.history.push({
      timestamp: Date.now(),
      state: toJS(this.state),
      action: actionName,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    this.historyIndex = this.history.length - 1;
  }

  /**
   * Undo last action
   */
  @action
  public undo(): void {
    if (!this.canUndo) return;

    this.historyIndex--;
    const entry = this.history[this.historyIndex];

    if (entry) {
      this.state = { ...entry.state };
      this.eventBus.emit(EventType.STATE_REVERTED, undefined);
    }
  }

  /**
   * Redo next action
   */
  @action
  public redo(): void {
    if (!this.canRedo) return;

    this.historyIndex++;
    const entry = this.history[this.historyIndex];

    if (entry) {
      this.state = { ...entry.state };
      this.eventBus.emit(EventType.STATE_CHANGED, {
        type: this.storeName,
        id: 'redo',
        oldValue: undefined,
        newValue: toJS(this.state),
      });
    }
  }

  /**
   * Reset to initial state
   */
  @action
  public reset(): void {
    if (this.history.length > 0) {
      const initialEntry = this.history[0];

      if (initialEntry) {
        this.state = { ...initialEntry.state };
        this.historyIndex = 0;
        this.isDirty = false;
        this.eventBus.emit(EventType.STATE_REVERTED, undefined);
      }
    }
  }

  /**
   * Commit current state (mark as clean)
   */
  @action
  public commit(): void {
    this.isDirty = false;
    this.eventBus.emit(EventType.STATE_COMMITTED, undefined);
  }

  /**
   * Serialize state for persistence
   */
  public serialize(): string {
    return JSON.stringify(toJS(this.state));
  }

  /**
   * Hydrate state from serialized data
   */
  @action
  public hydrate(serialized: string): void {
    try {
      const parsed = JSON.parse(serialized) as T;
      this.setState(parsed, 'hydrate');
      this.isDirty = false;
    } catch (error) {
      console.error(`Failed to hydrate ${this.storeName} store:`, error);
    }
  }

  /**
   * Get plain JS version of state (for debugging/logging)
   */
  public toJS(): T {
    return toJS(this.state);
  }

  /**
   * Clear history
   */
  @action
  public clearHistory(): void {
    this.history = [{
      timestamp: Date.now(),
      state: toJS(this.state),
      action: 'current',
    }];
    this.historyIndex = 0;
  }
}