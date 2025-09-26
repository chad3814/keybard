/**
 * Connection status component
 */

import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '@core/components/BaseComponent';
import { UsbDevice, ConnectionState } from '@core/usb/UsbDevice';
import { QmkService } from '@settings/services/QmkService';
import type { DeviceInfo } from '@core/protocols/base';

/**
 * Connection status component for USB device management
 */
@customElement('connection-status')
export class ConnectionStatus extends BaseComponent {
  @property({ type: Object })
  usbDevice!: UsbDevice;

  @property({ type: Object })
  qmkService!: QmkService;

  @state()
  private connectionState?: ConnectionState;

  @state()
  private deviceInfo?: DeviceInfo | null;

  @state()
  private protocolVersion?: { via: number; vial: number } | null;

  constructor() {
    super();
    // Initialize default values
    this.connectionState = ConnectionState.DISCONNECTED;
    this.deviceInfo = null;
    this.protocolVersion = null;
  }

  static override styles = css`
    :host {
      display: block;
    }

    .connection-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-dot.connected {
      background-color: #4caf50;
    }

    .status-dot.connecting {
      background-color: #ff9800;
      animation: blink 1s infinite;
    }

    .status-dot.disconnected {
      background-color: #9e9e9e;
      animation: none;
    }

    .status-dot.error {
      background-color: #f44336;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 currentColor;
      }
      70% {
        box-shadow: 0 0 0 10px transparent;
      }
      100% {
        box-shadow: 0 0 0 0 transparent;
      }
    }

    @keyframes blink {
      50% {
        opacity: 0.5;
      }
    }

    .status-text {
      font-size: 16px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .device-info {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .device-info h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .device-details {
      display: grid;
      gap: 8px;
    }

    .device-detail {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .device-detail-label {
      color: #666;
    }

    .device-detail-value {
      font-weight: 500;
      color: #333;
      font-family: monospace;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    button {
      flex: 1;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-connect {
      background-color: #2196f3;
      color: white;
    }

    .btn-connect:hover:not(:disabled) {
      background-color: #1976d2;
    }

    .btn-disconnect {
      background-color: #f44336;
      color: white;
    }

    .btn-disconnect:hover:not(:disabled) {
      background-color: #d32f2f;
    }

    .no-device {
      text-align: center;
      padding: 20px;
      color: #666;
    }

    .no-device-icon {
      font-size: 48px;
      margin-bottom: 10px;
      opacity: 0.3;
    }

    .no-device-text {
      font-size: 14px;
    }

    .protocol-info {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
    }

    .protocol-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 15px;
      padding: 10px;
      background: #fff9c4;
      border-radius: 4px;
      border-left: 3px solid #ffc107;
    }
  `;

  protected override setupReactions(): void {
    if (!this.usbDevice) return;

    // Monitor connection state changes
    this.observe(
      () => this.usbDevice.getState(),
      (state) => {
        this.connectionState = state;
        this.requestUpdateFromReaction();
      },
      true
    );

    if (this.qmkService) {
      // Monitor protocol version
      this.observe(
        () => this.qmkService.protocolVersion,
        (version) => {
          this.protocolVersion = version;
          this.requestUpdateFromReaction();
        },
        true
      );

      // Monitor device connection
      this.observe(
        () => this.qmkService.isConnected,
        (isConnected) => {
          if (isConnected && !this.deviceInfo) {
            // We're connected but don't have device info yet
            this.requestUpdateFromReaction();
          }
        },
        true
      );
    }
  }

  private async handleConnect(): Promise<void> {
    if (!this.qmkService) {
      const result = await this.usbDevice.connect();
      if (result.isOk()) {
        this.deviceInfo = result.value;
      } else {
        console.error('Connection failed:', result.error);
      }
    } else {
      const result = await this.qmkService.connect();
      if (!result.isOk()) {
        console.error('Connection failed:', result.error);
      }
    }
  }

  private async handleDisconnect(): Promise<void> {
    this.deviceInfo = null;
    this.protocolVersion = null;

    if (this.qmkService) {
      await this.qmkService.disconnect();
    } else {
      await this.usbDevice.disconnect();
    }
  }

  private renderDeviceInfo(): TemplateResult {
    if (!this.deviceInfo) {
      return html`
        <div class="no-device">
          <div class="no-device-icon">🔌</div>
          <div class="no-device-text">No device connected</div>
        </div>
      `;
    }

    return html`
      <div class="device-info">
        <h3>Device Information</h3>
        <div class="device-details">
          ${this.deviceInfo.manufacturerName ? html`
            <div class="device-detail">
              <span class="device-detail-label">Manufacturer:</span>
              <span class="device-detail-value">${this.deviceInfo.manufacturerName}</span>
            </div>
          ` : ''}

          ${this.deviceInfo.productName ? html`
            <div class="device-detail">
              <span class="device-detail-label">Product:</span>
              <span class="device-detail-value">${this.deviceInfo.productName}</span>
            </div>
          ` : ''}

          <div class="device-detail">
            <span class="device-detail-label">Vendor ID:</span>
            <span class="device-detail-value">0x${this.deviceInfo.vendorId.toString(16).toUpperCase().padStart(4, '0')}</span>
          </div>

          <div class="device-detail">
            <span class="device-detail-label">Product ID:</span>
            <span class="device-detail-value">0x${this.deviceInfo.productId.toString(16).toUpperCase().padStart(4, '0')}</span>
          </div>

          ${this.deviceInfo.serialNumber ? html`
            <div class="device-detail">
              <span class="device-detail-label">Serial:</span>
              <span class="device-detail-value">${this.deviceInfo.serialNumber}</span>
            </div>
          ` : ''}
        </div>

        ${this.protocolVersion ? html`
          <div class="protocol-info">
            <span class="protocol-badge">VIA v${this.protocolVersion.via}</span>
            <span class="protocol-badge">VIAL v${this.protocolVersion.vial}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  override render(): TemplateResult {
    const isConnected = this.connectionState === ConnectionState.CONNECTED;
    const isConnecting = this.connectionState === ConnectionState.CONNECTING;

    return html`
      <div class="connection-card">
        <div class="status-header">
          <div class="status-indicator">
            <div class="status-dot ${this.connectionState}"></div>
            <span class="status-text">${this.connectionState}</span>
          </div>
        </div>

        ${this.renderDeviceInfo()}

        <div class="actions">
          ${!isConnected ? html`
            <button
              class="btn-connect"
              @click=${this.handleConnect}
              ?disabled=${isConnecting}
            >
              ${isConnecting ? 'Connecting...' : 'Connect Device'}
            </button>
          ` : html`
            <button
              class="btn-disconnect"
              @click=${this.handleDisconnect}
            >
              Disconnect
            </button>
          `}
        </div>

        ${!isConnected ? html`
          <div class="help-text">
            Click "Connect Device" to select your keyboard from the browser's USB device list.
            Make sure your keyboard is connected and in bootloader mode if required.
          </div>
        ` : ''}
      </div>
    `;
  }
}