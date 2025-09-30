// Key service - keycode parsing and stringifying
import { CODEMAP, KEYMAP, KEYALIASES } from '../constants/keygen';
import type { KeyString, KeyMapEntry } from '../types/keymap';
import type { KeyboardInfo } from '../types/vial.types';

interface KeyParseDesc {
  type: 'layer' | 'macro' | 'tapdance' | 'key';
  mask?: string;
  idx?: number;
  str?: string;
  title?: string;
}

export class KeyService {
  public localization: string = 'english_us';

  /**
   * Update keymap with custom keycodes from keyboard
   */
  generateAllKeycodes(kbinfo: KeyboardInfo): void {
    // Populate USER00...USER63 keys as needed
    for (let i = 0; i < 64; i++) {
      const userkey = 'USER' + ('' + i).padStart(2, '0');
      const code = KEYMAP[userkey].code;
      if (kbinfo.custom_keycodes && kbinfo.custom_keycodes[i]) {
        const custom = kbinfo.custom_keycodes[i];
        KEYMAP[userkey] = {
          code,
          qmkid: custom.name,
          str: custom.shortName,
          title: custom.title,
        } as any;
        KEYMAP[custom.name] = {
          code,
          qmkid: custom.name,
          str: custom.shortName,
          title: custom.title,
        } as any;
        KEYALIASES[custom.name] = userkey;
      }
    }

    // Add 'type' and 'idx' to everything we can customize
    // 127 max macros
    for (let i = 0; i < 127; i++) {
      (KEYMAP['M' + i] as any).type = 'macro';
      (KEYMAP['M' + i] as any).idx = i;
    }

    // 32 max layers
    for (let i = 0; i < 32; i++) {
      for (const k of ['MO', 'DF', 'TG', 'TT', 'OSL', 'TO']) {
        const key = `${k}(${i})`;
        (KEYMAP[key] as any).type = 'layer';
        (KEYMAP[key] as any).subtype = k;
        (KEYMAP[key] as any).idx = i;
      }
    }

    // 255 tap dances
    for (let i = 0; i < 255; i++) {
      const key = `TD(${i})`;
      (KEYMAP[key] as any).type = 'tapdance';
      (KEYMAP[key] as any).idx = i;
    }
  }

  /**
   * Convert a keynum to a string. e.g: 0x0004 -> 'KC_A', 0x0104 -> "LCTRL(KC_A)"
   */
  stringify(keynum: number): KeyString {
    const modmask = keynum & 0xff00;
    const keyid = keynum & 0x00ff;

    if (modmask !== 0 && keyid in CODEMAP) {
      const kcstr = CODEMAP[keyid];
      const maskstr = CODEMAP[modmask];
      if (!maskstr) {
        return '0x' + keynum.toString(16).padStart(4, '0');
      }
      if (maskstr.match(/^(\w+)\(kc\)/)) {
        return maskstr.replace(/\(kc\)/, '(' + kcstr + ')');
      } else if (keyid === 0) {
        return maskstr;
      } else if (keynum in CODEMAP) {
        return CODEMAP[keynum];
      } else {
        return '0x' + keynum.toString(16).padStart(4, '0');
      }
    } else if (keynum in CODEMAP) {
      return CODEMAP[keynum];
    } else {
      return `0x${keynum.toString(16)}`;
    }
  }

  /**
   * Convert keystring to keynum. e.g: "KC_A" -> 0x0004, "LCTRL(KC_A)" -> 0x0104
   */
  parse(keystr: KeyString | number): number {
    if (!keystr || keystr === -1 || keystr === 0xff) {
      return 0xff;
    }

    if (typeof keystr === 'number') {
      return keystr;
    }

    if (keystr in KEYALIASES) {
      keystr = KEYALIASES[keystr];
    }

    if (keystr in KEYMAP) {
      return KEYMAP[keystr].code;
    }

    const match = keystr.match(/^(\w+)\((\w+)\)$/);
    if (match) {
      const cmask = KEYMAP[match[1] + '(kc)']?.code;
      if (cmask !== undefined) {
        let keypart = match[2];
        if (keypart === 'kc') {
          keypart = 'KC_NO';
        }
        if (keypart in KEYMAP) {
          const keymask = KEYMAP[keypart].code;
          return cmask + keymask;
        }
      }
    }

    return parseInt(keystr);
  }

  /**
   * Return a key definition for a given keystr
   */
  define(keystr: KeyString | number): KeyMapEntry | undefined {
    const orig = keystr;

    if (typeof keystr === 'string' && keystr.match(/^0x\w+$/)) {
      keystr = parseInt(keystr, 16);
    }

    if (typeof keystr === 'number' || (typeof keystr === 'string' && keystr.match(/^\d+$/))) {
      keystr = parseInt(keystr as string);
    }

    if (typeof keystr === 'number' && keystr in CODEMAP) {
      keystr = CODEMAP[keystr];
    }

    keystr = this.canonical(keystr as string);

    if (keystr in KEYMAP) {
      return KEYMAP[keystr];
    }

    console.log('Unknown keystr', orig, keystr);
    return undefined;
  }

  /**
   * Get canonical key string (resolve aliases)
   */
  canonical(keystr: KeyString): KeyString {
    if (keystr.match(/^0x/)) {
      return keystr;
    }
    if (keystr in KEYALIASES) {
      return KEYALIASES[keystr];
    }
    return keystr;
  }

  /**
   * Parse key description for UI display
   */
  parseDesc(keystr: KeyString): KeyParseDesc {
    if (keystr in KEYALIASES) {
      keystr = KEYALIASES[keystr];
    }

    let m;

    // Layers: MO(0) ... MO(15)
    m = keystr.match(/^(MO|DF|TG|TT|OSL|TO)\((\w+)\)$/);
    if (m) {
      return {
        type: 'layer',
        mask: m[1],
        idx: parseInt(m[2]),
      };
    }

    // Macros: M0 ... M50
    m = keystr.match(/^M(\d+)$/);
    if (m) {
      return {
        type: 'macro',
        mask: 'M',
        idx: parseInt(m[1]),
      };
    }

    // Tap Dances
    m = keystr.match(/^TD\((\d+)\)$/);
    if (m) {
      return {
        type: 'tapdance',
        mask: 'TD',
        idx: parseInt(m[1]),
      };
    }

    // HOLD-Tap keys
    m = keystr.match(/^(\w+)\((\w+)\)$/);
    if (m) {
      let mod = KEYMAP[m[1] + '(kc)'];
      if (!mod) {
        mod = KEYMAP[m[1]];
        if (mod && mod.qmkid in KEYALIASES) {
          const alias = KEYALIASES[mod.qmkid];
          mod = KEYMAP[alias];
        }
      } else if (mod && mod.qmkid in KEYALIASES) {
        const alias = KEYALIASES[mod.qmkid];
        mod = KEYMAP[alias];
      }
      if (mod) {
        let keypart = m[2];
        if (keypart === 'kc') {
          keypart = 'KC_NO';
        }
        const key = KEYMAP[keypart];
        if (key) {
          return {
            type: 'key',
            str: mod.str.replace(/\(kc\)/, '') + key.str,
            title: key.title,
          };
        }
      }
    }

    // Normal keys
    if (keystr in KEYMAP) {
      const key = KEYMAP[keystr];
      return {
        type: 'key',
        str: key.str,
        title: key.title,
      };
    }

    if (keystr.match(/^0x/)) {
      return {
        type: 'key',
        str: keystr,
      };
    }

    // Unknown
    return {
      type: 'key',
      str: '<span style="color: red; font-weight: bold;">?? BROKEN ??</span>',
      title: keystr,
    };
  }

  /**
   * Convert keymap integers to strings
   */
  stringifyKeymap(keymapint: number[][]): KeyString[][] {
    const ret: KeyString[][] = [];
    for (const layer of keymapint) {
      const l: KeyString[] = [];
      for (const key of layer) {
        if (key === 0xff) {
          l.push('-1');
        } else {
          l.push(this.stringify(key));
        }
      }
      ret.push(l);
    }
    return ret;
  }

  /**
   * Convert keymap strings to integers
   */
  parseKeymap(keymapstr: any[][][]): number[][] {
    const ret: number[][] = [];
    for (const layer of keymapstr) {
      const l: number[] = [];
      for (const row of layer) {
        for (const col of row) {
          if (!col) {
            l.push(0xff);
          } else if (col === 0xff) {
            l.push(0xff);
          } else {
            l.push(this.parse(col));
          }
        }
      }
      ret.push(l);
    }
    return ret;
  }

}

// Export singleton instance
export const keyService = new KeyService();