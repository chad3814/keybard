/**
 * MobX configuration and setup
 */

import { configure } from 'mobx';

/**
 * Configure MobX with strict mode and other settings
 */
export function configureMobX(): void {
  configure({
    enforceActions: 'always',
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    observableRequiresReaction: true,
    disableErrorBoundaries: false,
  });
}

/**
 * Setup MobX development tools
 */
export function setupMobXDevTools(): void {
  // Check if we're in development mode (webpack will define this)
  if (typeof window !== 'undefined' && window.__KEYBARD_DEBUG__) {
    // MobX DevTools will auto-detect stores
    console.log('MobX DevTools enabled');
  }
}