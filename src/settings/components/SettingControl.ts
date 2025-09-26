/**
 * Individual setting control component
 */

import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from '@core/components/BaseComponent';
import type { QMKSetting } from '@/types/kbinfo.types';

/**
 * Setting control component for individual QMK settings
 */
@customElement('setting-control')
export class SettingControl extends BaseComponent {
  @property({ type: Object })
  setting!: QMKSetting;

  @property({ type: Boolean })
  disabled = false;

  static override styles = css`
    :host {
      display: block;
    }

    .setting-control {
      display: flex;
      align-items: center;
      padding: 10px;
      background: white;
      border-radius: 4px;
      transition: box-shadow 0.2s;
    }

    .setting-control:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .setting-info {
      flex: 1;
      margin-right: 20px;
    }

    .setting-name {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .setting-description {
      font-size: 12px;
      color: #666;
    }

    .setting-input {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    input[type="number"] {
      width: 80px;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      text-align: center;
    }

    input[type="number"]:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    input[type="range"] {
      width: 150px;
    }

    input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #999;
      margin-top: 2px;
      width: 150px;
    }

    .current-value {
      font-size: 14px;
      font-weight: 500;
      color: #2196f3;
      min-width: 40px;
      text-align: right;
    }

    .setting-changed {
      animation: highlight 0.5s ease-in-out;
    }

    @keyframes highlight {
      0% { background-color: white; }
      50% { background-color: #fff3cd; }
      100% { background-color: white; }
    }

    .unit {
      font-size: 12px;
      color: #666;
      margin-left: 4px;
    }
  `;

  private handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value: number | boolean;

    if (this.setting.type === 'boolean') {
      value = target.checked;
    } else {
      value = parseInt(target.value, 10);

      // Validate against min/max
      if (this.setting.min !== undefined && value < this.setting.min) {
        value = this.setting.min;
        target.value = value.toString();
      }
      if (this.setting.max !== undefined && value > this.setting.max) {
        value = this.setting.max;
        target.value = value.toString();
      }
    }

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('setting-change', {
      detail: {
        id: this.setting.id,
        value
      },
      bubbles: true,
      composed: true
    }));

    // Add animation class
    this.shadowRoot?.querySelector('.setting-control')?.classList.add('setting-changed');
    setTimeout(() => {
      this.shadowRoot?.querySelector('.setting-control')?.classList.remove('setting-changed');
    }, 500);
  }

  private renderControl(): TemplateResult {
    if (this.setting.type === 'boolean') {
      return html`
        <input
          type="checkbox"
          .checked=${this.setting.value as boolean}
          @change=${this.handleChange}
          ?disabled=${this.disabled}
        />
      `;
    } else {
      const value = this.setting.value as number;
      const min = this.setting.min ?? 0;
      const max = this.setting.max ?? 100;
      const showRange = max - min <= 500;

      return html`
        <div class="setting-input">
          ${showRange ? html`
            <input
              type="range"
              .value=${value.toString()}
              min=${min}
              max=${max}
              @input=${this.handleChange}
              ?disabled=${this.disabled}
            />
            <div>
              <div class="range-labels">
                <span>${min}</span>
                <span>${max}</span>
              </div>
            </div>
          ` : ''}

          <input
            type="number"
            .value=${value.toString()}
            min=${min}
            max=${max}
            @change=${this.handleChange}
            ?disabled=${this.disabled}
          />

          <span class="current-value">
            ${value}${this.getUnit()}
          </span>
        </div>
      `;
    }
  }

  private getUnit(): string {
    const id = this.setting.id.toLowerCase();

    if (id.includes('term') || id.includes('timeout') || id.includes('delay')) {
      return html`<span class="unit">ms</span>` as unknown as string;
    }

    if (id.includes('speed')) {
      return html`<span class="unit">px/s</span>` as unknown as string;
    }

    return '';
  }

  override render(): TemplateResult {
    if (!this.setting) {
      return html``;
    }

    return html`
      <div class="setting-control">
        <div class="setting-info">
          <div class="setting-name">${this.setting.name}</div>
          ${this.setting.description ? html`
            <div class="setting-description">${this.setting.description}</div>
          ` : ''}
        </div>
        ${this.renderControl()}
      </div>
    `;
  }
}