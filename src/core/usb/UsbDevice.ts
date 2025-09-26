/**
 * USB device connection and management
 */

import { Result, ok, err } from '@/types/index';
import { EventBus, EventType } from '@core/events/EventBus';
import type { DeviceInfo } from '@core/protocols/base';

/**
 * USB device filter for keyboard devices
 */
export interface UsbDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
}

/**
 * USB device connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * USB device wrapper
 */
export class UsbDevice {
  private device: USBDevice | null = null;
  private inEndpoint: USBEndpoint | null = null;
  private outEndpoint: USBEndpoint | null = null;
  private interfaceNumber: number | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private eventBus: EventBus;

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
   * Check if device is connected
   */
  public isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.device !== null;
  }

  /**
   * Request and connect to a USB device
   */
  public async connect(filters?: UsbDeviceFilter[]): Promise<Result<DeviceInfo, string>> {
    try {
      if (!navigator.usb) {
        return err('WebUSB not supported in this browser');
      }

      this.setState(ConnectionState.CONNECTING);

      // Request device from user
      const usbFilters = filters?.map(f => ({
        vendorId: f.vendorId,
        productId: f.productId,
        classCode: f.classCode,
        subclassCode: f.subclassCode,
        protocolCode: f.protocolCode,
      })) ?? [];

      const device = await navigator.usb.requestDevice({
        filters: usbFilters.length > 0 ? usbFilters : [
          { classCode: 0x03 }, // HID devices
        ],
      });

      // Open and configure device
      const result = await this.configureDevice(device);
      if (!result.isOk()) {
        this.setState(ConnectionState.ERROR);
        return err(result.error);
      }

      this.device = device;
      this.setState(ConnectionState.CONNECTED);

      // Get device info
      const deviceInfo: DeviceInfo = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName ?? undefined,
        manufacturerName: device.manufacturerName ?? undefined,
        serialNumber: device.serialNumber ?? undefined,
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
        productName: device.productName ?? undefined,
        manufacturerName: device.manufacturerName ?? undefined,
        serialNumber: device.serialNumber ?? undefined,
      });

      return ok(deviceInfo);
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      const message = error instanceof Error ? error.message : 'Failed to connect to device';
      return err(message);
    }
  }

  /**
   * Reconnect to a previously connected device
   */
  public async reconnect(device: USBDevice): Promise<Result<DeviceInfo, string>> {
    try {
      this.setState(ConnectionState.CONNECTING);

      const result = await this.configureDevice(device);
      if (!result.isOk()) {
        this.setState(ConnectionState.ERROR);
        return err(result.error);
      }

      this.device = device;
      this.setState(ConnectionState.CONNECTED);

      const deviceInfo: DeviceInfo = {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName ?? undefined,
        manufacturerName: device.manufacturerName ?? undefined,
        serialNumber: device.serialNumber ?? undefined,
        protocolVersion: {
          via: 0,
          vial: 0,
        },
      };

      this.eventBus.emit(EventType.DEVICE_CONNECTED, {
        device,
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName ?? undefined,
        manufacturerName: device.manufacturerName ?? undefined,
        serialNumber: device.serialNumber ?? undefined,
      });

      return ok(deviceInfo);
    } catch (error) {
      this.setState(ConnectionState.ERROR);
      const message = error instanceof Error ? error.message : 'Failed to reconnect to device';
      return err(message);
    }
  }

  /**
   * Disconnect from the device
   */
  public async disconnect(): Promise<Result<void, string>> {
    try {
      if (!this.device) {
        return ok(undefined);
      }

      if (this.interfaceNumber !== null) {
        await this.device.releaseInterface(this.interfaceNumber);
      }

      await this.device.close();

      this.device = null;
      this.inEndpoint = null;
      this.outEndpoint = null;
      this.interfaceNumber = null;
      this.setState(ConnectionState.DISCONNECTED);

      this.eventBus.emit(EventType.DEVICE_DISCONNECTED, {});

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect from device';
      return err(message);
    }
  }

  /**
   * Send data to the device
   */
  public async send(data: ArrayBuffer): Promise<Result<void, string>> {
    if (!this.isConnected()) {
      return err('Device not connected');
    }

    if (!this.device || this.outEndpoint === null) {
      return err('Device not properly configured');
    }

    try {
      const result = await this.device.transferOut(
        this.outEndpoint.endpointNumber,
        data
      );

      if (result.status !== 'ok') {
        return err(`Transfer failed with status: ${result.status}`);
      }

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send data';
      return err(message);
    }
  }

  /**
   * Receive data from the device
   */
  public async receive(length: number = 64): Promise<Result<ArrayBuffer, string>> {
    if (!this.isConnected()) {
      return err('Device not connected');
    }

    if (!this.device || this.inEndpoint === null) {
      return err('Device not properly configured');
    }

    try {
      const result = await this.device.transferIn(
        this.inEndpoint.endpointNumber,
        length
      );

      if (result.status !== 'ok') {
        return err(`Transfer failed with status: ${result.status}`);
      }

      if (!result.data) {
        return err('No data received');
      }

      return ok(result.data.buffer.slice(0) as ArrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to receive data';
      return err(message);
    }
  }

  /**
   * Send and receive data in one operation
   */
  public async sendAndReceive(
    data: ArrayBuffer,
    timeout: number = 1000
  ): Promise<Result<ArrayBuffer, string>> {
    const sendResult = await this.send(data);
    if (!sendResult.isOk()) {
      return err(sendResult.error);
    }

    // Add small delay to allow device to process
    await new Promise(resolve => setTimeout(resolve, 10));

    const receiveResult = await this.receive();
    if (!receiveResult.isOk()) {
      return err(receiveResult.error);
    }

    return ok(receiveResult.value);
  }

  /**
   * Get list of connected USB devices
   */
  public static async getDevices(): Promise<USBDevice[]> {
    if (!navigator.usb) {
      return [];
    }

    return navigator.usb.getDevices();
  }

  /**
   * Configure the USB device
   */
  private async configureDevice(device: USBDevice): Promise<Result<void, string>> {
    try {
      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find HID interface
      const interfaces = device.configuration?.interfaces ?? [];
      let hidInterface: USBInterface | undefined;

      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 0x03) { // HID class
            hidInterface = iface;
            break;
          }
        }
        if (hidInterface) break;
      }

      if (!hidInterface) {
        return err('No HID interface found');
      }

      this.interfaceNumber = hidInterface.interfaceNumber;
      await device.claimInterface(this.interfaceNumber);

      // Find endpoints
      const alternate = hidInterface.alternates[0];
      if (!alternate) {
        return err('No alternate interface found');
      }

      for (const endpoint of alternate.endpoints) {
        if (endpoint.direction === 'in') {
          this.inEndpoint = endpoint;
        } else if (endpoint.direction === 'out') {
          this.outEndpoint = endpoint;
        }
      }

      if (!this.inEndpoint || !this.outEndpoint) {
        return err('Required endpoints not found');
      }

      return ok(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to configure device';
      return err(message);
    }
  }

  /**
   * Set connection state and emit event
   */
  private setState(state: ConnectionState): void {
    this.state = state;
    this.eventBus.emit(EventType.CONNECTION_STATE_CHANGED, { state });
  }
}