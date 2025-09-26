/**
 * Base component class with MobX integration
 */

import { LitElement } from 'lit';
import { reaction, IReactionDisposer } from 'mobx';

/**
 * Base class for Lit components with MobX integration
 */
export abstract class BaseComponent extends LitElement {
  private reactions: IReactionDisposer[] = [];

  /**
   * Connect to MobX reactions
   */
  override connectedCallback(): void {
    super.connectedCallback();
    this.setupReactions();
  }

  /**
   * Disconnect MobX reactions
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.disposeReactions();
  }

  /**
   * Setup MobX reactions (override in subclasses)
   */
  protected setupReactions(): void {
    // Override in subclasses to set up reactions
  }

  /**
   * Add a reaction that will be automatically disposed
   */
  protected addReaction(disposer: IReactionDisposer): void {
    this.reactions.push(disposer);
  }

  /**
   * Create and add a reaction
   */
  protected observe<T>(
    expression: () => T,
    effect: (value: T) => void,
    fireImmediately = false
  ): void {
    const disposer = reaction(expression, effect, { fireImmediately });
    this.addReaction(disposer);
  }

  /**
   * Dispose all reactions
   */
  private disposeReactions(): void {
    this.reactions.forEach(dispose => dispose());
    this.reactions = [];
  }

  /**
   * Request an update (can be called from MobX reactions)
   */
  protected requestUpdateFromReaction(): void {
    this.requestUpdate();
  }
}