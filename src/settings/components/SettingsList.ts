/**
 * Settings list component
 */

import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '@core/components/BaseComponent';
import { SettingsStore } from '@settings/state/SettingsStore';
import type { QMKSetting } from '@/types/kbinfo.types';
import './SettingControl';

/**
 * Settings list component for displaying all QMK settings
 */
@customElement('settings-list')
export class SettingsList extends BaseComponent {
  @property({ type: Object })
  store!: SettingsStore;

  @state()
  private settings: Record<string, QMKSetting> = {};

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private hasChanges = false;

  static override styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }

    h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .settings-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .instant-mode {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .instant-mode label {
      font-size: 14px;
      color: #666;
    }

    .instant-mode input[type="checkbox"] {
      cursor: pointer;
    }

    button {
      padding: 8px 16px;
      font-size: 14px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-save {
      background-color: #4caf50;
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background-color: #45a049;
    }

    .btn-revert {
      background-color: #f44336;
      color: white;
    }

    .btn-revert:hover:not(:disabled) {
      background-color: #da190b;
    }

    .btn-load {
      background-color: #2196f3;
      color: white;
    }

    .btn-load:hover:not(:disabled) {
      background-color: #0b79d0;
    }

    .settings-grid {
      display: grid;
      gap: 15px;
    }

    .settings-category {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 15px;
    }

    .category-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #555;
    }

    .settings-items {
      display: grid;
      gap: 10px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .error {
      background-color: #ffebee;
      color: #c62828;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-left: 5px;
    }

    .status-indicator.has-changes {
      background-color: #ff9800;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
      }
    }
  `;

  protected override setupReactions(): void {
    if (!this.store) return;

    // Observe settings changes
    this.observe(
      () => this.store.settings,
      (settings) => {
        this.settings = settings;
        this.requestUpdateFromReaction();
      },
      true
    );

    // Observe loading state
    this.observe(
      () => this.store.loading,
      (loading) => {
        this.loading = loading;
        this.requestUpdateFromReaction();
      },
      true
    );

    // Observe error state
    this.observe(
      () => this.store.error,
      (error) => {
        this.error = error;
        this.requestUpdateFromReaction();
      },
      true
    );

    // Observe changes
    this.observe(
      () => this.store.hasChanges,
      (hasChanges) => {
        this.hasChanges = hasChanges;
        this.requestUpdateFromReaction();
      },
      true
    );
  }

  private handleSave(): void {
    this.store.saveSettings();
  }

  private handleRevert(): void {
    this.store.revertSettings();
  }

  private handleLoad(): void {
    this.store.loadSettings();
  }

  private handleInstantModeToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked !== this.store.instantMode) {
      this.store.toggleInstantMode();
    }
  }

  private handleSettingChange(event: CustomEvent): void {
    const { id, value } = event.detail;
    this.store.setSetting(id, value);
  }

  private categorizeSettings(): Map<string, QMKSetting[]> {
    const categories = new Map<string, QMKSetting[]>();

    Object.values(this.settings).forEach(setting => {
      let category = 'General';

      if (setting.id.includes('tapping') || setting.id.includes('tap')) {
        category = 'Tapping';
      } else if (setting.id.includes('hold')) {
        category = 'Hold Behavior';
      } else if (setting.id.includes('combo')) {
        category = 'Combos';
      } else if (setting.id.includes('auto_shift')) {
        category = 'Auto Shift';
      } else if (setting.id.includes('oneshot')) {
        category = 'One Shot';
      } else if (setting.id.includes('mouse')) {
        category = 'Mouse Keys';
      }

      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(setting);
    });

    return categories;
  }

  override render(): TemplateResult {
    if (this.loading && Object.keys(this.settings).length === 0) {
      return html`
        <div class="loading">
          Loading settings...
        </div>
      `;
    }

    const categories = this.categorizeSettings();

    return html`
      ${this.error ? html`
        <div class="error">
          ${this.error}
        </div>
      ` : ''}

      <div class="settings-header">
        <h2>
          QMK Settings
          ${this.hasChanges ? html`
            <span class="status-indicator has-changes" title="Unsaved changes"></span>
          ` : ''}
        </h2>

        <div class="settings-actions">
          <div class="instant-mode">
            <input
              type="checkbox"
              id="instant-mode"
              .checked=${this.store?.instantMode || false}
              @change=${this.handleInstantModeToggle}
              ?disabled=${this.loading}
            />
            <label for="instant-mode">Instant Mode</label>
          </div>

          <button
            class="btn-load"
            @click=${this.handleLoad}
            ?disabled=${this.loading}
          >
            Load from Device
          </button>

          <button
            class="btn-revert"
            @click=${this.handleRevert}
            ?disabled=${!this.hasChanges || this.loading}
          >
            Revert
          </button>

          <button
            class="btn-save"
            @click=${this.handleSave}
            ?disabled=${!this.hasChanges || this.loading}
          >
            Save to Device
          </button>
        </div>
      </div>

      <div class="settings-grid">
        ${Array.from(categories.entries()).map(([category, settings]) => html`
          <div class="settings-category">
            <div class="category-title">${category}</div>
            <div class="settings-items">
              ${settings.map(setting => html`
                <setting-control
                  .setting=${setting}
                  .disabled=${this.loading}
                  @setting-change=${this.handleSettingChange}
                ></setting-control>
              `)}
            </div>
          </div>
        `)}
      </div>
    `;
  }
}