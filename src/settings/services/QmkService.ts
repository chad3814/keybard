/**
 * QMK protocol service for settings management
 */

import { makeObservable, observable, action } from 'mobx';
import { Result, ok, err } from '@/types/index';
import { EventBus, EventType } from '@core/events/EventBus';
import { UsbDevice } from '@core/usb/UsbDevice';
import { SettingsStore } from '@settings/state/SettingsStore';
import type { QMKSetting } from '@/types/kbinfo.types';
import {
  QmkCommand,
  QmkSettingId,
  QmkSettingValue,
  createGetSettingRequest,
  createSetSettingRequest,
  parseSettingResponse,
  createGetProtocolVersionRequest,
  parseProtocolVersionResponse,
} from '@settings/protocols/QmkProtocol';

/**
 * QMK service configuration
 */
export interface QmkServiceConfig {
  retryAttempts?: number;
  timeout?: number;
  autoConnect?: boolean;
}

/**
 * QMK service for managing device communication
 */
export class QmkService {
  private usbDevice: UsbDevice;
  private settingsStore: SettingsStore;
  private eventBus: EventBus;
  private config: Required<QmkServiceConfig>;

  @observable
  public isConnected: boolean = false;

  @observable
  public protocolVersion: { via: number; vial: number } | null = null;

  constructor(
    usbDevice: UsbDevice,
    settingsStore: SettingsStore,
    eventBus: EventBus,
    config?: QmkServiceConfig
  ) {
    this.usbDevice = usbDevice;
    this.settingsStore = settingsStore;
    this.eventBus = eventBus;
    this.config = {
      retryAttempts: config?.retryAttempts ?? 3,
      timeout: config?.timeout ?? 1000,
      autoConnect: config?.autoConnect ?? true,
    };

    makeObservable(this);

    // Listen for device events
    this.eventBus.on(EventType.DEVICE_CONNECTED, () => this.handleDeviceConnected());
    this.eventBus.on(EventType.DEVICE_DISCONNECTED, () => this.handleDeviceDisconnected());
  }

  /**
   * Initialize the service
   */
  @action
  public async initialize(): Promise<Result<void, string>> {
    if (this.config.autoConnect) {
      // Check for previously connected devices
      const devices = await UsbDevice.getDevices();
      if (devices.length > 0 && devices[0]) {
        const result = await this.usbDevice.reconnect(devices[0]);
        if (!result.isOk()) {
          return err(result.error);
        }
      }
    }

    return ok(undefined);
  }

  /**
   * Connect to a keyboard device
   */
  @action
  public async connect(): Promise<Result<void, string>> {
    // For HID devices, we can filter by usage page/usage or vendor/product IDs
    // QMK/Vial keyboards typically use standard keyboard usage (page 0x01, usage 0x06)
    const result = await this.usbDevice.connect([
      // We can add specific vendor/product filters here if needed
      // For now, let the user choose from any available HID device
    ]);

    if (!result.isOk()) {
      return err(result.error);
    }

    return ok(undefined);
  }

  /**
   * Disconnect from the device
   */
  @action
  public async disconnect(): Promise<void> {
    await this.usbDevice.disconnect();
  }

  /**
   * Load all settings from the device
   */
  @action
  public async loadSettings(): Promise<Result<void, string>> {
    if (!this.isConnected) {
      return err('Device not connected');
    }

    this.settingsStore.setLoading(true);

    try {
      // Get protocol version first
      const versionResult = await this.getProtocolVersion();
      if (!versionResult.isOk()) {
        this.settingsStore.setError(versionResult.error);
        this.settingsStore.setLoading(false);
        return err(versionResult.error);
      }

      // Load all settings
      const settings: Record<string, QMKSetting> = {};
      const settingDefinitions = this.getSettingDefinitions();

      for (const [id, definition] of Object.entries(settingDefinitions)) {
        const result = await this.getSetting(Number(id) as QmkSettingId);
        if (result.isOk()) {
          settings[definition.id] = {
            ...definition,
            value: result.value,
          };
        }
      }

      this.settingsStore.setSettings(settings);
      this.settingsStore.setLoading(false);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load settings';
      this.settingsStore.setError(message);
      this.settingsStore.setLoading(false);
      return err(message);
    }
  }

  /**
   * Save all changed settings to the device
   */
  @action
  public async saveSettings(): Promise<Result<void, string>> {
    if (!this.isConnected) {
      return err('Device not connected');
    }

    if (!this.settingsStore.hasChanges) {
      return ok(undefined);
    }

    this.settingsStore.setLoading(true);

    try {
      const changedSettings = this.settingsStore.changedSettings;

      for (const settingId of changedSettings) {
        const setting = this.settingsStore.settings[settingId];
        if (!setting) continue;

        // Find the QMK setting ID
        const qmkSettingId = this.getQmkSettingId(settingId);
        if (qmkSettingId === undefined) continue;

        const result = await this.setSetting(qmkSettingId, setting.value);
        if (!result.isOk()) {
          this.settingsStore.setError(result.error);
          this.settingsStore.setLoading(false);
          return err(result.error);
        }
      }

      this.settingsStore.commitSettings();
      this.settingsStore.setLoading(false);

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      this.settingsStore.setError(message);
      this.settingsStore.setLoading(false);
      return err(message);
    }
  }

  /**
   * Get a single setting from the device
   */
  private async getSetting(settingId: QmkSettingId): Promise<Result<QmkSettingValue, string>> {
    const request = createGetSettingRequest(settingId);
    if (!request.isOk()) {
      return err(request.error);
    }

    const response = await this.sendWithRetry(request.value);
    if (!response.isOk()) {
      return err(response.error);
    }

    const parsed = parseSettingResponse(response.value);
    if (!parsed.isOk()) {
      return err(parsed.error);
    }

    if (!parsed.value.success) {
      return err(`Failed to get setting ${settingId}`);
    }

    return ok(parsed.value.value);
  }

  /**
   * Set a single setting on the device
   */
  private async setSetting(
    settingId: QmkSettingId,
    value: QmkSettingValue
  ): Promise<Result<void, string>> {
    const request = createSetSettingRequest(settingId, value);
    if (!request.isOk()) {
      return err(request.error);
    }

    const response = await this.sendWithRetry(request.value);
    if (!response.isOk()) {
      return err(response.error);
    }

    const parsed = parseSettingResponse(response.value);
    if (!parsed.isOk()) {
      return err(parsed.error);
    }

    if (!parsed.value.success) {
      return err(`Failed to set setting ${settingId}`);
    }

    return ok(undefined);
  }

  /**
   * Get protocol version from device
   */
  private async getProtocolVersion(): Promise<Result<{ via: number; vial: number }, string>> {
    const request = createGetProtocolVersionRequest();

    const response = await this.sendWithRetry(request);
    if (!response.isOk()) {
      return err(response.error);
    }

    const parsed = parseProtocolVersionResponse(response.value);
    if (!parsed.isOk()) {
      return err(parsed.error);
    }

    this.protocolVersion = parsed.value;
    return ok(parsed.value);
  }

  /**
   * Send data with retry logic
   */
  private async sendWithRetry(data: ArrayBuffer): Promise<Result<ArrayBuffer, string>> {
    let lastError = '';

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      // Convert ArrayBuffer to Uint8Array for HID API
      const uint8Data = new Uint8Array(data);
      // HID reports use report ID 0 by default for raw HID
      const result = await this.usbDevice.sendAndReceive(0, uint8Data, this.config.timeout);
      if (result.isOk()) {
        // Convert response back to ArrayBuffer
        return ok(result.value.buffer as ArrayBuffer);
      }

      lastError = result.error;

      // Wait before retry
      if (attempt < this.config.retryAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }

    return err(`Failed after ${this.config.retryAttempts} attempts: ${lastError}`);
  }

  /**
   * Handle device connected event
   */
  @action
  private async handleDeviceConnected(): Promise<void> {
    this.isConnected = true;

    // Load settings automatically
    const result = await this.loadSettings();
    if (!result.isOk()) {
      console.error('Failed to load settings:', result.error);
    }
  }

  /**
   * Handle device disconnected event
   */
  @action
  private handleDeviceDisconnected(): void {
    this.isConnected = false;
    this.protocolVersion = null;
  }

  /**
   * Get setting definitions
   */
  private getSettingDefinitions(): Record<QmkSettingId, Omit<QMKSetting, 'value'>> {
    return {
      [QmkSettingId.TAPPING_TERM]: {
        id: 'tapping_term',
        name: 'Tapping Term',
        type: 'number',
        min: 50,
        max: 500,
        description: 'Time in ms to distinguish tap from hold',
      },
      [QmkSettingId.TAPPING_TOGGLE]: {
        id: 'tapping_toggle',
        name: 'Tapping Toggle',
        type: 'number',
        min: 1,
        max: 10,
        description: 'Number of taps to toggle layer',
      },
      [QmkSettingId.PERMISSIVE_HOLD]: {
        id: 'permissive_hold',
        name: 'Permissive Hold',
        type: 'boolean',
        description: 'Allow hold behavior on tap-hold keys',
      },
      [QmkSettingId.HOLD_ON_OTHER_KEY_PRESS]: {
        id: 'hold_on_other_key_press',
        name: 'Hold on Other Key Press',
        type: 'boolean',
        description: 'Trigger hold when another key is pressed',
      },
      [QmkSettingId.RETRO_TAPPING]: {
        id: 'retro_tapping',
        name: 'Retro Tapping',
        type: 'boolean',
        description: 'Send tap keycode on release if no other key pressed',
      },
      [QmkSettingId.COMBO_TERM]: {
        id: 'combo_term',
        name: 'Combo Term',
        type: 'number',
        min: 10,
        max: 200,
        description: 'Time window for combo key detection',
      },
      [QmkSettingId.TAP_CODE_DELAY]: {
        id: 'tap_code_delay',
        name: 'Tap Code Delay',
        type: 'number',
        min: 0,
        max: 100,
        description: 'Delay between tap press and release',
      },
      [QmkSettingId.TAP_HOLD_CAPS_DELAY]: {
        id: 'tap_hold_caps_delay',
        name: 'Tap Hold Caps Delay',
        type: 'number',
        min: 0,
        max: 500,
        description: 'Delay for tap-hold on Caps Lock',
      },
      [QmkSettingId.AUTO_SHIFT_TIMEOUT]: {
        id: 'auto_shift_timeout',
        name: 'Auto Shift Timeout',
        type: 'number',
        min: 50,
        max: 500,
        description: 'Hold time to trigger auto shift',
      },
      [QmkSettingId.AUTO_SHIFT_ENABLED]: {
        id: 'auto_shift_enabled',
        name: 'Auto Shift Enabled',
        type: 'boolean',
        description: 'Enable auto shift feature',
      },
      [QmkSettingId.AUTO_SHIFT_MODIFIERS]: {
        id: 'auto_shift_modifiers',
        name: 'Auto Shift Modifiers',
        type: 'boolean',
        description: 'Apply auto shift to modifier keys',
      },
      [QmkSettingId.ONESHOT_TIMEOUT]: {
        id: 'oneshot_timeout',
        name: 'Oneshot Timeout',
        type: 'number',
        min: 100,
        max: 5000,
        description: 'Time before oneshot modifier expires',
      },
      [QmkSettingId.ONESHOT_TAP_TOGGLE]: {
        id: 'oneshot_tap_toggle',
        name: 'Oneshot Tap Toggle',
        type: 'number',
        min: 1,
        max: 10,
        description: 'Taps to lock oneshot modifier',
      },
      [QmkSettingId.MOUSEKEY_DELAY]: {
        id: 'mousekey_delay',
        name: 'Mouse Key Delay',
        type: 'number',
        min: 0,
        max: 500,
        description: 'Delay before mouse movement starts',
      },
      [QmkSettingId.MOUSEKEY_INTERVAL]: {
        id: 'mousekey_interval',
        name: 'Mouse Key Interval',
        type: 'number',
        min: 10,
        max: 100,
        description: 'Time between mouse movements',
      },
      [QmkSettingId.MOUSEKEY_MAX_SPEED]: {
        id: 'mousekey_max_speed',
        name: 'Mouse Key Max Speed',
        type: 'number',
        min: 1,
        max: 20,
        description: 'Maximum mouse cursor speed',
      },
      [QmkSettingId.MOUSEKEY_TIME_TO_MAX]: {
        id: 'mousekey_time_to_max',
        name: 'Mouse Key Time to Max',
        type: 'number',
        min: 10,
        max: 100,
        description: 'Time to reach maximum speed',
      },
      [QmkSettingId.MOUSEKEY_WHEEL_DELAY]: {
        id: 'mousekey_wheel_delay',
        name: 'Mouse Wheel Delay',
        type: 'number',
        min: 0,
        max: 500,
        description: 'Delay before wheel movement starts',
      },
    };
  }

  /**
   * Get QMK setting ID from setting key
   */
  private getQmkSettingId(settingKey: string): QmkSettingId | undefined {
    const mapping: Record<string, QmkSettingId> = {
      'tapping_term': QmkSettingId.TAPPING_TERM,
      'tapping_toggle': QmkSettingId.TAPPING_TOGGLE,
      'permissive_hold': QmkSettingId.PERMISSIVE_HOLD,
      'hold_on_other_key_press': QmkSettingId.HOLD_ON_OTHER_KEY_PRESS,
      'retro_tapping': QmkSettingId.RETRO_TAPPING,
      'combo_term': QmkSettingId.COMBO_TERM,
      'tap_code_delay': QmkSettingId.TAP_CODE_DELAY,
      'tap_hold_caps_delay': QmkSettingId.TAP_HOLD_CAPS_DELAY,
      'auto_shift_timeout': QmkSettingId.AUTO_SHIFT_TIMEOUT,
      'auto_shift_enabled': QmkSettingId.AUTO_SHIFT_ENABLED,
      'auto_shift_modifiers': QmkSettingId.AUTO_SHIFT_MODIFIERS,
      'oneshot_timeout': QmkSettingId.ONESHOT_TIMEOUT,
      'oneshot_tap_toggle': QmkSettingId.ONESHOT_TAP_TOGGLE,
      'mousekey_delay': QmkSettingId.MOUSEKEY_DELAY,
      'mousekey_interval': QmkSettingId.MOUSEKEY_INTERVAL,
      'mousekey_max_speed': QmkSettingId.MOUSEKEY_MAX_SPEED,
      'mousekey_time_to_max': QmkSettingId.MOUSEKEY_TIME_TO_MAX,
      'mousekey_wheel_delay': QmkSettingId.MOUSEKEY_WHEEL_DELAY,
    };

    return mapping[settingKey];
  }
}