// Main Vial service - orchestrates keyboard communication and state
import { VialUSB, usbInstance } from './usb';
import { LE32, MSG_LEN } from './utils';
import type { KeyboardInfo } from '../types/vial.types';
import { XzReadableStream } from 'xz-decompress';
import { keyService } from './key.service';

// XZ decompression helper
async function decompress(buffer: ArrayBuffer): Promise<string> {
  try {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });

    const xzStream = new XzReadableStream(stream);
    const reader = xzStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const decoder = new TextDecoder();
    return decoder.decode(result);
  } catch (error) {
    console.error('XZ decompression failed:', error);
    console.error('Buffer size:', buffer.byteLength);
    console.error('Buffer preview:', new Uint8Array(buffer).slice(0, 32));
    throw error;
  }
}

export class VialService {
  private usb: VialUSB;

  constructor(usb: VialUSB) {
    this.usb = usb;
  }

  async init(_kbinfo: KeyboardInfo): Promise<void> {
    // Initialization hook for API setup
  }

  async load(kbinfo: KeyboardInfo): Promise<KeyboardInfo> {
    // Load keyboard information
    await this.getKeyboardInfo(kbinfo);

    // Load features (combos, macros, etc.)
    await this.getFeatures(kbinfo);

    // Get keymap for all layers
    await this.getKeyMap(kbinfo);

    return kbinfo;
  }

  async getKeyboardInfo(kbinfo: KeyboardInfo): Promise<KeyboardInfo> {
    // VIA Protocol version
    kbinfo.via_proto = await this.usb.send(VialUSB.CMD_VIA_GET_PROTOCOL_VERSION, [], {
      unpack: 'B>H',
      index: 1,
    });

    // Vial protocol and Keyboard ID
    const vial_kbid = await this.usb.sendVial(VialUSB.CMD_VIAL_GET_KEYBOARD_ID, [], {
      unpack: 'I<Q',
    });
    kbinfo.vial_proto = vial_kbid[0] as number;
    kbinfo.kbid = (vial_kbid[1] as bigint).toString();

    // Get compressed JSON payload
    const payload_size = await this.usb.sendVial(VialUSB.CMD_VIAL_GET_SIZE, [], {
      uint32: true,
      index: 0,
    });

    let block = 0;
    let sz = payload_size;
    const payload = new ArrayBuffer(payload_size);
    const pdv = new DataView(payload);
    let offset = 0;

    while (sz > 0) {
      const data = await this.usb.sendVial(VialUSB.CMD_VIAL_GET_DEFINITION, [...LE32(block)], {
        uint8: true,
      });

      for (let i = 0; i < MSG_LEN && offset < payload_size; i++) {
        pdv.setInt8(offset, data[i]);
        offset += 1;
      }
      sz = sz - MSG_LEN;
      block += 1;
    }

    // Decompress and parse JSON
    // Note: Original uses Int8Array spread, but we can pass buffer directly
    const decompressed = await decompress(payload);
    const payloadData = JSON.parse(decompressed);
    kbinfo.payload = payloadData;

    kbinfo.rows = payloadData.matrix.rows;
    kbinfo.cols = payloadData.matrix.cols;
    kbinfo.custom_keycodes = payloadData.customKeycodes;

    return kbinfo;
  }

  async getFeatures(kbinfo: KeyboardInfo): Promise<void> {
    // Get feature counts
    await this.usb.sendVial(VialUSB.CMD_VIAL_DYNAMIC_ENTRY_OP, []);

    const macro_count = await this.usb.send(VialUSB.CMD_VIA_MACRO_GET_COUNT, [], { index: 1 });

    const macros_size = await this.usb.send(VialUSB.CMD_VIA_MACRO_GET_BUFFER_SIZE, [], {
      unpack: 'B>H',
      index: 1,
    });

    // Store feature information in kbinfo
    (kbinfo as any).macro_count = macro_count;
    (kbinfo as any).macros_size = macros_size;
  }

  async getKeyMap(kbinfo: KeyboardInfo): Promise<void> {
    kbinfo.layers = await this.usb.send(VialUSB.CMD_VIA_GET_LAYER_COUNT, [], {
      uint8: true,
      index: 1,
    });

    if (!kbinfo.layers) {
      throw new Error('Failed to get layer count');
    }

    const size = kbinfo.layers * kbinfo.rows * kbinfo.cols;

    const alldata = await this.usb.getViaBuffer(
      VialUSB.CMD_VIA_KEYMAP_GET_BUFFER,
      size * 2,
      { uint16: true, slice: 2, bigendian: true, bytes: 2 }
    );

    kbinfo.keymap = [];

    for (let l = 0; l < kbinfo.layers; l++) {
      const layer: string[] = [];
      for (let r = 0; r < kbinfo.rows; r++) {
        for (let c = 0; c < kbinfo.cols; c++) {
          const offset = l * kbinfo.rows * kbinfo.cols + r * kbinfo.cols + c;
          const keycode = new DataView(alldata.buffer).getUint16(offset * 2, false);
          layer.push(keyService.stringify(keycode));
        }
      }
      kbinfo.keymap[l] = layer;
    }
  }

  async pollMatrix(kbinfo: KeyboardInfo): Promise<boolean[][]> {
    const data = await this.usb.send(VialUSB.CMD_VIA_GET_KEYBOARD_VALUE, [
      VialUSB.VIA_SWITCH_MATRIX_STATE,
    ]);
    const rowbytes = Math.ceil(kbinfo.cols / 8);
    let offset = 2;

    const kmpressed: boolean[][] = [];
    for (let row = 0; row < kbinfo.rows; row++) {
      const rowpressed: boolean[] = [];
      const coldata = data.slice(offset, offset + rowbytes);
      for (let col = 0; col < kbinfo.cols; col++) {
        const colbyte = Math.floor(col / 8);
        const colbit = 1 << (col % 8);
        rowpressed.push((coldata[colbyte] & colbit) !== 0);
      }
      offset += rowbytes;
      kmpressed.push(rowpressed);
    }
    return kmpressed;
  }

  // API methods for updating keyboard settings
  async updateKey(layer: number, row: number, col: number, keymask: number): Promise<void> {
    const BE16 = (num: number) => [(num >> 8) & 0xff, num & 0xff];
    await this.usb.send(VialUSB.CMD_VIA_SET_KEYCODE, [layer, row, col, ...BE16(keymask)]);
  }
}

export const vialService = new VialService(usbInstance);