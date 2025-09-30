// USB HID communication layer for Vial protocol
import { MSG_LEN, LE16 } from "./utils";
import type { USBSendOptions } from "../types/vial.types";

export class VialUSB {
  // Via+Vial command constants
  static readonly CMD_VIA_GET_PROTOCOL_VERSION = 0x01;
  static readonly CMD_VIA_GET_KEYBOARD_VALUE = 0x02;
  static readonly CMD_VIA_SET_KEYBOARD_VALUE = 0x03;
  static readonly CMD_VIA_GET_KEYCODE = 0x04;
  static readonly CMD_VIA_SET_KEYCODE = 0x05;
  static readonly CMD_VIA_LIGHTING_SET_VALUE = 0x07;
  static readonly CMD_VIA_LIGHTING_GET_VALUE = 0x08;
  static readonly CMD_VIA_LIGHTING_SAVE = 0x09;
  static readonly CMD_VIA_MACRO_GET_COUNT = 0x0c;
  static readonly CMD_VIA_MACRO_GET_BUFFER_SIZE = 0x0d;
  static readonly CMD_VIA_MACRO_GET_BUFFER = 0x0e;
  static readonly CMD_VIA_MACRO_SET_BUFFER = 0x0f;
  static readonly CMD_VIA_GET_LAYER_COUNT = 0x11;
  static readonly CMD_VIA_KEYMAP_GET_BUFFER = 0x12;
  static readonly CMD_VIA_VIAL_PREFIX = 0xfe;

  static readonly VIA_LAYOUT_OPTIONS = 0x02;
  static readonly VIA_SWITCH_MATRIX_STATE = 0x03;

  static readonly QMK_BACKLIGHT_BRIGHTNESS = 0x09;
  static readonly QMK_BACKLIGHT_EFFECT = 0x0a;
  static readonly QMK_RGBLIGHT_BRIGHTNESS = 0x80;
  static readonly QMK_RGBLIGHT_EFFECT = 0x81;
  static readonly QMK_RGBLIGHT_EFFECT_SPEED = 0x82;
  static readonly QMK_RGBLIGHT_COLOR = 0x83;

  static readonly VIALRGB_GET_INFO = 0x40;
  static readonly VIALRGB_GET_MODE = 0x41;
  static readonly VIALRGB_GET_SUPPORTED = 0x42;
  static readonly VIALRGB_SET_MODE = 0x41;

  static readonly CMD_VIAL_GET_KEYBOARD_ID = 0x00;
  static readonly CMD_VIAL_GET_SIZE = 0x01;
  static readonly CMD_VIAL_GET_DEFINITION = 0x02;
  static readonly CMD_VIAL_GET_ENCODER = 0x03;
  static readonly CMD_VIAL_SET_ENCODER = 0x04;
  static readonly CMD_VIAL_GET_UNLOCK_STATUS = 0x05;
  static readonly CMD_VIAL_UNLOCK_START = 0x06;
  static readonly CMD_VIAL_UNLOCK_POLL = 0x07;
  static readonly CMD_VIAL_LOCK = 0x08;
  static readonly CMD_VIAL_DYNAMIC_ENTRY_OP = 0x0e;

  static readonly DYNAMIC_VIAL_GET_NUMBER_OF_ENTRIES = 0x00;
  static readonly DYNAMIC_VIAL_TAP_DANCE_GET = 0x01;
  static readonly DYNAMIC_VIAL_TAP_DANCE_SET = 0x02;
  static readonly DYNAMIC_VIAL_COMBO_GET = 0x03;
  static readonly DYNAMIC_VIAL_COMBO_SET = 0x04;
  static readonly DYNAMIC_VIAL_KEY_OVERRIDE_GET = 0x05;
  static readonly DYNAMIC_VIAL_KEY_OVERRIDE_SET = 0x06;

  private device?: HIDDevice;
  private listener: (data: ArrayBuffer, ev: HIDInputReportEvent) => void =
    () => {};

  async open(filters: HIDDeviceFilter[]): Promise<boolean> {
    const devices = await navigator.hid.requestDevice({ filters });
    if (devices.length !== 1) return false;

    this.device = devices[0];
    if (!this.device.opened) {
      await this.device.open();
    }
    await this.initListener();
    return true;
  }

  async close(): Promise<void> {
    if (this.device) {
      if (this.handleEvent) {
        this.device.removeEventListener("inputreport", this.handleEvent);
        this.handleEvent = undefined;
      }
      await this.device.close();
      this.device = undefined;
    }
  }

  private handleEvent?: (ev: HIDInputReportEvent) => void;

  private async initListener(): Promise<void> {
    if (!this.device) return;
    const handleEvent = (ev: HIDInputReportEvent) => {
      if (this.listener) {
        const buffer = ev.data.buffer as ArrayBuffer;
        this.listener(buffer, ev);
      }
    };
    this.handleEvent = handleEvent;
    this.device.addEventListener("inputreport", handleEvent);
  }

  async send(
    cmd: number,
    args: number[],
    options: USBSendOptions = {}
  ): Promise<any> {
    if (!this.device) throw new Error("USB device not connected");

    const message = new Uint8Array(MSG_LEN);
    message[0] = cmd;
    for (let i = 0; i < args.length; i++) {
      message[i + 1] = args[i];
    }

    return new Promise((resolve) => {
      this.listener = (data: ArrayBuffer) => {
        const result = this.parseResponse(data, options);
        resolve(result);
      };
      this.device!.sendReport(0, message);
    });
  }

  async sendVial(
    cmd: number,
    args: number[],
    options: USBSendOptions = {}
  ): Promise<any> {
    return this.send(VialUSB.CMD_VIA_VIAL_PREFIX, [cmd, ...args], options);
  }

  private parseResponse(data: ArrayBuffer, options: USBSendOptions): any {
    const dv = new DataView(data);
    const u8 = new Uint8Array(data);

    if (options.unpack) {
      return this.unpackData(dv, options.unpack);
    }

    if (options.uint8) {
      // If index is specified, return single byte; otherwise return full array
      if (options.index !== undefined) {
        return u8[options.index];
      }
      return u8;
    }

    if (options.uint16) {
      const idx = options.index ?? 0;
      return dv.getUint16(idx, !options.bigendian);
    }

    if (options.uint32) {
      const idx = options.index ?? 0;
      return dv.getUint32(idx, !options.bigendian);
    }

    return u8;
  }

  private unpackData(dv: DataView, format: string): any[] {
    const results: any[] = [];
    let offset = 0;
    let littleEndian = true;

    if (format.includes("<")) littleEndian = true;
    if (format.includes(">")) littleEndian = false;

    const formatChars = format.replace(/[<>]/g, "");

    for (const char of formatChars) {
      switch (char) {
        case "B": // unsigned byte
          results.push(dv.getUint8(offset));
          offset += 1;
          break;
        case "H": // unsigned short
          results.push(dv.getUint16(offset, littleEndian));
          offset += 2;
          break;
        case "I": // unsigned int
          results.push(dv.getUint32(offset, littleEndian));
          offset += 4;
          break;
        case "Q": // unsigned long long
          results.push(dv.getBigUint64(offset, littleEndian));
          offset += 8;
          break;
      }
    }

    return results;
  }

  async getViaBuffer(
    cmd: number,
    size: number,
    options: USBSendOptions,
    checkComplete?: (data: Uint8Array) => boolean
  ): Promise<Uint8Array> {
    const buffer = new Uint8Array(size);
    let offset = 0;
    let chunkOffset = 0;

    while (offset < size) {
      const args = options.slice ? [...LE16(chunkOffset), 0, 0] : [];
      const data = await this.send(cmd, args, options);
      const chunk = new Uint8Array(data);
      const startIdx = options.slice ?? 0;

      for (let i = startIdx; i < chunk.length && offset < size; i++) {
        buffer[offset++] = chunk[i];
      }

      if (checkComplete && checkComplete(buffer)) {
        break;
      }

      chunkOffset += MSG_LEN - (options.slice ?? 0);
    }

    return buffer;
  }

  async pushViaBuffer(
    cmd: number,
    size: number,
    data: ArrayBuffer
  ): Promise<void> {
    const buffer = new Uint8Array(data);
    let offset = 0;
    let chunkOffset = 0;

    while (offset < size) {
      const chunk = new Uint8Array(MSG_LEN - 4);
      for (let i = 0; i < chunk.length && offset < size; i++) {
        chunk[i] = buffer[offset++];
      }

      await this.send(cmd, [...LE16(chunkOffset), ...chunk]);
      chunkOffset += chunk.length;
    }
  }

  async getDynamicEntries(
    dynamicCmd: number,
    count: number,
    options: USBSendOptions
  ): Promise<any[]> {
    const entries: any[] = [];
    for (let i = 0; i < count; i++) {
      const data = await this.sendVial(
        VialUSB.CMD_VIAL_DYNAMIC_ENTRY_OP,
        [dynamicCmd, i],
        options
      );
      entries.push(data);
    }
    return entries;
  }
}

export const usbInstance = new VialUSB();
