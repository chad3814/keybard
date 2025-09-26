/**
 * HID Device communication handler
 * Uses WebHID API for keyboard communication
 */

/// <reference path="../../types/webhid.d.ts" />

import { EventBus, EventType } from '../events/EventBus';
import type { DeviceInfo } from '../protocols/base';
import { Result, ok, err } from '@/types/index';

/**
 * Connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * HID device filter for requestDevice
 */
export interface UsbDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

/**
 * HID Device class for WebHID communication
 */
export class UsbDevice {
  private device: HIDDevice | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private eventBus: EventBus;
  private listener: ((this: HIDDevice, ev: HIDInputReportEvent) => void) | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Request and connect to a HID device
   */
  public async connect(filters?: UsbDeviceFilter[]): Promise<Result<DeviceInfo, string>> {
    try {
      if (!('hid' in navigator)) {
        return err('WebHID not supported in this browser');
      }

      this.setState(ConnectionState.CONNECTING);

      // Convert filters to HID format
      const hidFilters = filters?.map(f => ({
        vendorId: f.vendorId,
        productId: f.productId,
        usagePage: f.usagePage,
        usage: f.usage,
      })) ?? [];

      // Request device from user
      const devices = await navigator.hid.requestDevice({
        filters: hidFilters.length > 0 ? hidFilters : [],
      });

      if (devices.length === 0) {
        this.setState(ConnectionState.DISCONNECTED);
        return err('No device selected');
      }

      const device = devices[0];
      if (!device) {
        this.setState(ConnectionState.DISCONNECTED);
        return err('No device available');
      }

      // Open the device
      if (!device.opened) {
        await device.open();
      }

      this.device = device;
      this.setState(ConnectionState.CONNECTED);

      // Set up input report listener
      this.setupListener();

      // Get device info
      const deviceInfo: DeviceInfo = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        manufacturerName: undefined, // HID doesn't provide manufacturer name directly
        serialNumber: undefined, // HID doesn't provide serial number directly
        protocolVersion: {
          via: 0, // Will be updated by protocol handler
          vial: 0,
        },
      };

      // Emit connected event
      this.eventBus.emit(EventType.DEVICE_CONNECTED, {
        device,
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
      });

      console.log('HID Device connected:', deviceInfo);
      return ok(deviceInfo);
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      const message = error instanceof Error ? error.message : 'Failed to connect to device';
      console.error('HID connection error:', message);
      return err(message);
    }
  }

  /**
   * Reconnect to a previously connected device
   */
  public async reconnect(device: HIDDevice): Promise<Result<DeviceInfo, string>> {
    try {
      this.setState(ConnectionState.CONNECTING);

      if (!device.opened) {
        await device.open();
      }

      this.device = device;
      this.setState(ConnectionState.CONNECTED);

      // Set up input report listener
      this.setupListener();

      const deviceInfo: DeviceInfo = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        manufacturerName: undefined,
        serialNumber: undefined,
        protocolVersion: {
          via: 0,
          vial: 0,
        },
      };

      this.eventBus.emit(EventType.DEVICE_CONNECTED, {
        device,
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
      });

      return ok(deviceInfo);
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      const message = error instanceof Error ? error.message : 'Failed to reconnect to device';
      return err(message);
    }
  }

  /**
   * Disconnect from current device
   */
  public async disconnect(): Promise<void> {
    if (this.device) {
      // Remove listener
      if (this.listener) {
        this.device.removeEventListener('inputreport', this.listener);
        this.listener = null;
      }

      // Close device
      if (this.device.opened) {
        await this.device.close();
      }

      this.device = null;
      this.setState(ConnectionState.DISCONNECTED);
      this.eventBus.emit(EventType.DEVICE_DISCONNECTED, {});
    }
  }

  /**
   * Send report to device
   */
  public async sendReport(reportId: number, data: Uint8Array): Promise<Result<void, string>> {
    if (!this.device || !this.device.opened) {
      return err('Device not connected');
    }

    try {
      // Cast to BufferSource for HID API
      await this.device.sendReport(reportId, data as BufferSource);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send report';
      return err(message);
    }
  }

  /**
   * Send feature report to device
   */
  public async sendFeatureReport(reportId: number, data: Uint8Array): Promise<Result<void, string>> {
    if (!this.device || !this.device.opened) {
      return err('Device not connected');
    }

    try {
      // Cast to BufferSource for HID API
      await this.device.sendFeatureReport(reportId, data as BufferSource);
      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send feature report';
      return err(message);
    }
  }

  /**
   * Receive feature report from device
   */
  public async receiveFeatureReport(reportId: number): Promise<Result<DataView, string>> {
    if (!this.device || !this.device.opened) {
      return err('Device not connected');
    }

    try {
      const report = await this.device.receiveFeatureReport(reportId);
      return ok(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to receive feature report';
      return err(message);
    }
  }

  /**
   * Send data and wait for response (mimics the original USB.send pattern)
   */
  public async sendAndReceive(
    reportId: number,
    data: Uint8Array,
    timeoutMs: number = 5000
  ): Promise<Result<Uint8Array, string>> {
    if (!this.device || !this.device.opened) {
      return err('Device not connected');
    }

    return new Promise((resolve) => {
      let timeoutHandle: number;
      let responseHandler: ((this: HIDDevice, ev: HIDInputReportEvent) => void) | null = null;

      // Set up response handler
      responseHandler = (event: HIDInputReportEvent) => {
        if (event.reportId === reportId || reportId === 0) {
          // Clear timeout
          clearTimeout(timeoutHandle);

          // Remove listener
          if (responseHandler && this.device) {
            this.device.removeEventListener('inputreport', responseHandler);
          }

          // Convert DataView to Uint8Array
          const responseData = new Uint8Array(event.data.buffer);
          resolve(ok(responseData));
        }
      };

      // Set timeout
      timeoutHandle = setTimeout(() => {
        if (responseHandler && this.device) {
          this.device.removeEventListener('inputreport', responseHandler);
        }
        resolve(err('Timeout waiting for response'));
      }, timeoutMs);

      // Add listener
      this.device!.addEventListener('inputreport', responseHandler);

      // Send the report
      this.device!.sendReport(reportId, data as BufferSource)
        .catch((error: Error) => {
          clearTimeout(timeoutHandle);
          if (responseHandler && this.device) {
            this.device.removeEventListener('inputreport', responseHandler);
          }
          const message = error instanceof Error ? error.message : 'Failed to send report';
          resolve(err(message));
        });
    });
  }

  /**
   * Get current device
   */
  public getDevice(): HIDDevice | null {
    return this.device;
  }

  /**
   * Get list of connected HID devices
   */
  public static async getDevices(): Promise<HIDDevice[]> {
    if (!('hid' in navigator)) {
      return [];
    }

    return navigator.hid.getDevices();
  }

  /**
   * Set up input report listener
   */
  private setupListener(): void {
    if (!this.device) return;

    // Remove old listener if exists
    if (this.listener) {
      this.device.removeEventListener('inputreport', this.listener);
    }

    // Create new listener
    this.listener = (event: HIDInputReportEvent) => {
      // Emit raw data event (add DATA_RECEIVED to EventType if needed)
      // For now, we'll just handle it internally
      // this.eventBus.emit(EventType.DATA_RECEIVED, {
      //   reportId: event.reportId,
      //   data: new Uint8Array(event.data.buffer),
      // });
    };

    // Add listener
    this.device.addEventListener('inputreport', this.listener);
  }

  /**
   * Update connection state
   */
  private setState(state: ConnectionState): void {
    this.state = state;
    this.eventBus.emit(EventType.CONNECTION_STATE_CHANGED, { state });
  }

  /**
   * Check for existing connections
   */
  public async checkExistingConnection(): Promise<Result<DeviceInfo | null, string>> {
    try {
      const devices = await UsbDevice.getDevices();

      if (devices.length > 0 && devices[0]) {
        // Try to reconnect to the first available device
        const device = devices[0];
        const result = await this.reconnect(device);
        if (result.isOk()) {
          return ok(result.value);
        }
      }

      return ok(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check existing connections';
      return err(message);
    }
  }
}