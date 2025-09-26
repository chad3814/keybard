// WebUSB Mock for testing without physical keyboard

export interface MockUSBDevice {
  vendorId: number;
  productId: number;
  productName: string;
  manufacturerName: string;
  serialNumber: string;
  opened: boolean;
  configuration: any;
  configurations: any[];

  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(configurationValue: number): Promise<void>;
  claimInterface(interfaceNumber: number): Promise<void>;
  releaseInterface(interfaceNumber: number): Promise<void>;
  transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
  controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
  controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>;
  forget(): Promise<void>;
}

export class MockVialKeyboard implements MockUSBDevice {
  vendorId = 0x1234;
  productId = 0x5678;
  productName = 'Mock Svalboard';
  manufacturerName = 'MockManufacturer';
  serialNumber = 'MOCK123456';
  opened = false;
  configuration = { configurationValue: 1 };
  configurations = [{ configurationValue: 1 }];

  // Mock keyboard state
  private keymap: number[][] = [];
  private macros: any[] = [];
  private settings: Map<string, number> = new Map([
    ['tapping_term', 200],
    ['tapping_toggle', 5],
    ['permissive_hold', 1],
    ['hold_on_other_key_press', 0],
    ['retro_tapping', 0],
    ['combo_term', 50],
  ]);

  constructor() {
    // Initialize with default keymap (16 layers, 10x6 matrix)
    for (let layer = 0; layer < 16; layer++) {
      this.keymap[layer] = new Array(60).fill(0x00);
    }

    // Set up some default keys on layer 0
    // Basic QWERTY layout simulation
    const qwertyKeys = [
      0x14, 0x1A, 0x08, 0x15, 0x17, 0x1C, // Q W E R T Y
      0x04, 0x16, 0x07, 0x09, 0x0A, 0x0B, // A S D F G H
      0x1D, 0x1B, 0x06, 0x19, 0x05, 0x11, // Z X C V B N
    ];

    for (let i = 0; i < qwertyKeys.length && i < 60; i++) {
      this.keymap[0]![i] = qwertyKeys[i]!;
    }
  }

  async open(): Promise<void> {
    this.opened = true;
  }

  async close(): Promise<void> {
    this.opened = false;
  }

  async selectConfiguration(configurationValue: number): Promise<void> {
    this.configuration = { configurationValue };
  }

  async claimInterface(interfaceNumber: number): Promise<void> {
    // Mock claim interface
  }

  async releaseInterface(interfaceNumber: number): Promise<void> {
    // Mock release interface
  }

  async transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult> {
    return {
      data: new DataView(new ArrayBuffer(length)),
      status: 'ok' as USBTransferStatus
    };
  }

  async transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult> {
    return {
      bytesWritten: data instanceof ArrayBuffer ? data.byteLength : (data as any).byteLength,
      status: 'ok' as USBTransferStatus
    };
  }

  async controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult> {
    const data = new ArrayBuffer(length);
    const view = new DataView(data);

    // Mock Vial protocol responses
    const request = setup.request;

    switch (request) {
      case 0x01: // Get Protocol Version
        view.setUint32(0, 0x00000006, true); // Vial protocol version 6
        break;

      case 0x02: // Get Keyboard ID
        view.setUint32(0, 0x12345678, true); // Mock keyboard ID
        view.setUint32(4, 0x90ABCDEF, true);
        break;

      case 0x03: // Get Size
        view.setUint8(0, 16); // 16 layers
        view.setUint8(1, 10); // 10 rows
        view.setUint8(2, 6);  // 6 columns
        view.setUint8(3, 50); // 50 macros
        view.setUint8(4, 50); // 50 combos
        view.setUint8(5, 50); // 50 tap dances
        view.setUint8(6, 30); // 30 key overrides
        break;

      case 0x04: // Get Keycode
        // Return keycode from our mock keymap
        const layer = (setup.value || 0) & 0xFF;
        const row = ((setup.value || 0) >> 8) & 0xFF;
        const col = ((setup.value || 0) >> 16) & 0xFF;
        const keyIndex = row * 6 + col;

        if (layer < this.keymap.length && keyIndex < this.keymap[layer]!.length) {
          view.setUint16(0, this.keymap[layer]![keyIndex]!, true);
        }
        break;

      case 0x05: // Get QMK Setting
        const settingId = setup.value || 0;
        const settingKey = this.getSettingKeyById(settingId);

        if (settingKey && this.settings.has(settingKey)) {
          view.setUint16(0, this.settings.get(settingKey)!, true);
        } else {
          view.setUint16(0, 0, true);
        }
        break;

      case 0x06: // Get Macro
        // Return empty macro for now
        view.setUint8(0, 0); // Empty macro
        break;

      default:
        // Unknown request, return zeros
        break;
    }

    return {
      data: view,
      status: 'ok' as USBTransferStatus
    };
  }

  async controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult> {
    if (!data) {
      return {
        bytesWritten: 0,
        status: 'ok' as USBTransferStatus
      };
    }

    const view = data instanceof DataView ? data : new DataView(data instanceof ArrayBuffer ? data : (data as any).buffer);
    const request = setup.request;

    switch (request) {
      case 0x07: // Set Keycode
        const layer = (setup.value || 0) & 0xFF;
        const row = ((setup.value || 0) >> 8) & 0xFF;
        const col = ((setup.value || 0) >> 16) & 0xFF;
        const keyIndex = row * 6 + col;
        const keycode = view.getUint16(0, true);

        if (layer < this.keymap.length && keyIndex < this.keymap[layer]!.length) {
          this.keymap[layer]![keyIndex] = keycode;
        }
        break;

      case 0x08: // Set QMK Setting
        const settingId = setup.value || 0;
        const settingKey = this.getSettingKeyById(settingId);
        const settingValue = view.getUint16(0, true);

        if (settingKey) {
          this.settings.set(settingKey, settingValue);
        }
        break;

      case 0x09: // Set Macro
        // Store macro data
        break;
    }

    return {
      bytesWritten: data instanceof ArrayBuffer ? data.byteLength : (data as any).byteLength,
      status: 'ok' as USBTransferStatus
    };
  }

  async forget(): Promise<void> {
    this.opened = false;
  }

  private getSettingKeyById(id: number): string | null {
    const settingMap: { [key: number]: string } = {
      0: 'tapping_term',
      1: 'tapping_toggle',
      2: 'permissive_hold',
      3: 'hold_on_other_key_press',
      4: 'retro_tapping',
      5: 'combo_term',
    };

    return settingMap[id] || null;
  }
}

export class MockUSB {
  private devices: MockUSBDevice[] = [];
  private pairedDevice: MockUSBDevice | null = null;

  constructor() {
    // Add a mock keyboard by default
    this.devices.push(new MockVialKeyboard());
  }

  async requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice> {
    // Simulate user selecting the first available device
    if (this.devices.length > 0) {
      this.pairedDevice = this.devices[0] || null;
      return this.pairedDevice as unknown as USBDevice;
    }

    throw new DOMException('No device selected', 'NotFoundError');
  }

  async getDevices(): Promise<USBDevice[]> {
    return this.pairedDevice ? [this.pairedDevice as unknown as USBDevice] : [];
  }

  addEventListener(type: string, listener: EventListener): void {
    // Mock event listener
  }

  removeEventListener(type: string, listener: EventListener): void {
    // Mock event listener
  }
}

// Function to install the mock into a page
export function installUSBMock() {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    (navigator as any).usb = new MockUSB();
  }
}

// Export for use in Playwright tests
export const usbMock = new MockUSB();