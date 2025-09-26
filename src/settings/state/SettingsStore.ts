/**
 * Settings/QMK store with MobX
 */

import { makeObservable, observable, action, computed } from 'mobx';
import { BaseStore } from '@core/state/BaseStore';
import type { QMKSetting } from '@/types/kbinfo.types';
import type { Result } from '@/types/index';
import { ok, err } from '@/types/index';

export interface SettingsState {
  settings: Record<string, QMKSetting>;
  committedSettings: Record<string, QMKSetting>;
  instantMode: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Store for QMK settings management
 */
export class SettingsStore extends BaseStore<SettingsState> {
  constructor() {
    super(
      {
        settings: {},
        committedSettings: {},
        instantMode: false,
        loading: false,
        error: null,
      },
      'settings'
    );

    makeObservable(this, {
      settings: computed,
      committedSettings: computed,
      instantMode: computed,
      loading: computed,
      error: computed,
      hasChanges: computed,
      changedSettings: computed,
      setLoading: action,
      setError: action,
      setSetting: action,
      setSettings: action,
      commitSettings: action,
      revertSettings: action,
      toggleInstantMode: action,
    });
  }

  /**
   * Get settings (for convenience)
   */
  public get settings(): Record<string, QMKSetting> {
    return this.state.settings;
  }

  /**
   * Get committed settings
   */
  public get committedSettings(): Record<string, QMKSetting> {
    return this.state.committedSettings;
  }

  /**
   * Check if instant mode is enabled
   */
  public get instantMode(): boolean {
    return this.state.instantMode;
  }

  /**
   * Check if loading
   */
  public get loading(): boolean {
    return this.state.loading;
  }

  /**
   * Get error message
   */
  public get error(): string | null {
    return this.state.error;
  }

  /**
   * Check if there are uncommitted changes
   */
  public get hasChanges(): boolean {
    const current = this.state.settings;
    const committed = this.state.committedSettings;

    // Check if any settings have different values
    for (const key in current) {
      if (current[key]?.value !== committed[key]?.value) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get list of changed settings
   */
  public get changedSettings(): string[] {
    const changed: string[] = [];
    const current = this.state.settings;
    const committed = this.state.committedSettings;

    for (const key in current) {
      if (current[key]?.value !== committed[key]?.value) {
        changed.push(key);
      }
    }

    return changed;
  }

  /**
   * Set loading state
   */
  public setLoading(loading: boolean): void {
    this.setState({ loading }, 'setLoading');
  }

  /**
   * Set error message
   */
  public setError(error: string | null): void {
    this.setState({ error }, 'setError');
  }

  /**
   * Update a single setting value
   */
  public setSetting(id: string, value: number | boolean): Result<void, string> {
    const setting = this.state.settings[id];

    if (!setting) {
      return err(`Setting ${id} not found`);
    }

    // Validate value based on type
    if (setting.type === 'number' && typeof value !== 'number') {
      return err(`Invalid value type for ${id}: expected number`);
    }

    if (setting.type === 'boolean' && typeof value !== 'boolean') {
      return err(`Invalid value type for ${id}: expected boolean`);
    }

    // Check range for numbers
    if (
      setting.type === 'number' &&
      typeof value === 'number' &&
      setting.min !== undefined &&
      setting.max !== undefined
    ) {
      if (value < setting.min || value > setting.max) {
        return err(`Value ${value} out of range [${setting.min}, ${setting.max}]`);
      }
    }

    // Update the setting
    const updatedSettings = {
      ...this.state.settings,
      [id]: {
        ...setting,
        value,
      },
    };

    this.setState({ settings: updatedSettings }, `setSetting:${id}`);

    // If instant mode, commit immediately
    if (this.state.instantMode) {
      this.commitSettings();
    }

    return ok(undefined);
  }

  /**
   * Bulk update settings
   */
  public setSettings(settings: Record<string, QMKSetting>): void {
    this.setState(
      {
        settings,
        committedSettings: { ...settings },
      },
      'setSettings'
    );
  }

  /**
   * Commit current settings
   */
  public commitSettings(): void {
    this.setState(
      {
        committedSettings: { ...this.state.settings },
      },
      'commitSettings'
    );

    this.commit(); // Mark store as clean
  }

  /**
   * Revert to committed settings
   */
  public revertSettings(): void {
    this.setState(
      {
        settings: { ...this.state.committedSettings },
      },
      'revertSettings'
    );
  }

  /**
   * Toggle instant mode
   */
  public toggleInstantMode(): void {
    this.setState(
      {
        instantMode: !this.state.instantMode,
      },
      'toggleInstantMode'
    );
  }

  /**
   * Load settings (placeholder for USB integration)
   */
  public async loadSettings(): Promise<Result<void, string>> {
    this.setLoading(true);
    this.setError(null);

    try {
      // TODO: Load from USB device
      // For now, create mock settings
      const mockSettings: Record<string, QMKSetting> = {
        tapping_term: {
          id: 'tapping_term',
          name: 'Tapping Term',
          type: 'number',
          value: 200,
          min: 50,
          max: 500,
          description: 'Time in ms to distinguish tap from hold',
        },
        tapping_toggle: {
          id: 'tapping_toggle',
          name: 'Tapping Toggle',
          type: 'number',
          value: 5,
          min: 1,
          max: 10,
          description: 'Number of taps to toggle layer',
        },
        permissive_hold: {
          id: 'permissive_hold',
          name: 'Permissive Hold',
          type: 'boolean',
          value: true,
          description: 'Allow hold behavior on tap-hold keys',
        },
        hold_on_other_key_press: {
          id: 'hold_on_other_key_press',
          name: 'Hold on Other Key Press',
          type: 'boolean',
          value: false,
          description: 'Trigger hold when another key is pressed',
        },
        retro_tapping: {
          id: 'retro_tapping',
          name: 'Retro Tapping',
          type: 'boolean',
          value: false,
          description: 'Send tap keycode on release if no other key pressed',
        },
        combo_term: {
          id: 'combo_term',
          name: 'Combo Term',
          type: 'number',
          value: 50,
          min: 10,
          max: 200,
          description: 'Time window for combo key detection',
        },
      };

      this.setSettings(mockSettings);
      this.setLoading(false);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load settings';
      this.setError(message);
      this.setLoading(false);
      return err(message);
    }
  }

  /**
   * Save settings (placeholder for USB integration)
   */
  public async saveSettings(): Promise<Result<void, string>> {
    if (!this.hasChanges && !this.state.instantMode) {
      return ok(undefined);
    }

    this.setLoading(true);
    this.setError(null);

    try {
      // TODO: Save to USB device
      // For now, just commit
      this.commitSettings();
      this.setLoading(false);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      this.setError(message);
      this.setLoading(false);
      return err(message);
    }
  }
}