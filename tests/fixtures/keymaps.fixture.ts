import type { TestKeymap, TestCodemap, TestKeyaliases } from './types';

// Sample KEYMAP data - subset of common keys for testing
export const testKeymap: TestKeymap = {
  // Basic keys
  'KC_NO': { code: 0x00, qmkid: 'KC_NO', str: '', title: 'None' },
  'KC_A': { code: 0x04, qmkid: 'KC_A', str: 'A', title: 'A' },
  'KC_B': { code: 0x05, qmkid: 'KC_B', str: 'B', title: 'B' },
  'KC_C': { code: 0x06, qmkid: 'KC_C', str: 'C', title: 'C' },
  'KC_1': { code: 0x1e, qmkid: 'KC_1', str: '1', title: '1' },
  'KC_2': { code: 0x1f, qmkid: 'KC_2', str: '2', title: '2' },
  'KC_SPC': { code: 0x2c, qmkid: 'KC_SPC', str: 'Space', title: 'Space' },
  'KC_ENT': { code: 0x28, qmkid: 'KC_ENT', str: 'Enter', title: 'Enter' },
  'KC_ESC': { code: 0x29, qmkid: 'KC_ESC', str: 'Esc', title: 'Escape' },
  'KC_BSPC': { code: 0x2a, qmkid: 'KC_BSPC', str: 'BkSp', title: 'Backspace' },

  // Modifiers
  'KC_LSFT': { code: 0xe1, qmkid: 'KC_LSFT', str: 'LShift', title: 'Left Shift' },
  'KC_RSFT': { code: 0xe5, qmkid: 'KC_RSFT', str: 'RShift', title: 'Right Shift' },
  'KC_LCTL': { code: 0xe0, qmkid: 'KC_LCTL', str: 'LCtrl', title: 'Left Control' },
  'KC_RCTL': { code: 0xe4, qmkid: 'KC_RCTL', str: 'RCtrl', title: 'Right Control' },
  'KC_LALT': { code: 0xe2, qmkid: 'KC_LALT', str: 'LAlt', title: 'Left Alt' },
  'KC_RALT': { code: 0xe6, qmkid: 'KC_RALT', str: 'RAlt', title: 'Right Alt' },
  'KC_LGUI': { code: 0xe3, qmkid: 'KC_LGUI', str: 'LGui', title: 'Left GUI' },
  'KC_RGUI': { code: 0xe7, qmkid: 'KC_RGUI', str: 'RGui', title: 'Right GUI' },

  // Function keys
  'KC_F1': { code: 0x3a, qmkid: 'KC_F1', str: 'F1', title: 'F1' },
  'KC_F2': { code: 0x3b, qmkid: 'KC_F2', str: 'F2', title: 'F2' },
  'KC_F3': { code: 0x3c, qmkid: 'KC_F3', str: 'F3', title: 'F3' },
  'KC_F12': { code: 0x45, qmkid: 'KC_F12', str: 'F12', title: 'F12' },

  // Layer switching
  'TO(0)': { code: 0x5200, qmkid: 'TO(0)', str: 'TO(0)', title: 'Switch to layer 0', type: 'layer', idx: 0 },
  'TO(1)': { code: 0x5201, qmkid: 'TO(1)', str: 'TO(1)', title: 'Switch to layer 1', type: 'layer', idx: 1 },
  'MO(1)': { code: 0x5101, qmkid: 'MO(1)', str: 'MO(1)', title: 'Momentary layer 1', type: 'layer', idx: 1 },
  'MO(2)': { code: 0x5102, qmkid: 'MO(2)', str: 'MO(2)', title: 'Momentary layer 2', type: 'layer', idx: 2 },
  'TG(1)': { code: 0x5301, qmkid: 'TG(1)', str: 'TG(1)', title: 'Toggle layer 1', type: 'layer', idx: 1 },

  // Macro keys
  'M0': { code: 0x7700, qmkid: 'M0', str: 'M0', title: 'Macro 0', type: 'macro', idx: 0 },
  'M1': { code: 0x7701, qmkid: 'M1', str: 'M1', title: 'Macro 1', type: 'macro', idx: 1 },
  'M2': { code: 0x7702, qmkid: 'M2', str: 'M2', title: 'Macro 2', type: 'macro', idx: 2 },
  'M10': { code: 0x770a, qmkid: 'M10', str: 'M10', title: 'Macro 10', type: 'macro', idx: 10 },
  'M31': { code: 0x771f, qmkid: 'M31', str: 'M31', title: 'Macro 31', type: 'macro', idx: 31 },

  // Tap dance
  'TD0': { code: 0x7b00, qmkid: 'TD0', str: 'TD0', title: 'Tap Dance 0', type: 'tapdance', idx: 0 },
  'TD1': { code: 0x7b01, qmkid: 'TD1', str: 'TD1', title: 'Tap Dance 1', type: 'tapdance', idx: 1 },

  // Custom keycodes (USER keys)
  'USER00': { code: 0x7e00, qmkid: 'USER00', str: 'U00', title: 'User 00' },
  'USER01': { code: 0x7e01, qmkid: 'USER01', str: 'U01', title: 'User 01' },
  'USER02': { code: 0x7e02, qmkid: 'USER02', str: 'U02', title: 'User 02' },

  // Symbols
  'KC_EXLM': { code: 0x1e1e, qmkid: 'KC_EXLM', str: '!', title: 'Exclamation' },
  'KC_AT': { code: 0x1e1f, qmkid: 'KC_AT', str: '@', title: 'At' },
  'KC_HASH': { code: 0x1e20, qmkid: 'KC_HASH', str: '#', title: 'Hash' },
};

// Sample CODEMAP - reverse mapping from code to key name
export const testCodemap: TestCodemap = Object.entries(testKeymap).reduce((acc, [key, value]) => {
  acc[value.code] = key;
  return acc;
}, {} as TestCodemap);

// Sample KEYALIASES
export const testKeyaliases: TestKeyaliases = {
  // Common aliases
  'LSHIFT': 'KC_LSFT',
  'RSHIFT': 'KC_RSFT',
  'LCTRL': 'KC_LCTL',
  'RCTRL': 'KC_RCTL',
  'LALT': 'KC_LALT',
  'RALT': 'KC_RALT',
  'LGUI': 'KC_LGUI',
  'RGUI': 'KC_RGUI',
  'SPACE': 'KC_SPC',
  'RETURN': 'KC_ENT',
  'ENTER': 'KC_ENT',
  'ESCAPE': 'KC_ESC',
  'BACKSPACE': 'KC_BSPC',
  'BKSP': 'KC_BSPC',

  // Layer aliases
  'LAYER0': 'TO(0)',
  'LAYER1': 'TO(1)',
  'MO1': 'MO(1)',
  'MO2': 'MO(2)',

  // Custom key aliases (populated dynamically)
  'CUSTOM_0': 'USER00',
  'CUSTOM_1': 'USER01',
};

// Factory function to create custom keymaps
export const createTestKeymap = (customKeys: Partial<TestKeymap> = {}): TestKeymap => {
  return { ...testKeymap, ...(customKeys as TestKeymap)};
};

// Factory function to generate layer switching keys
export const generateLayerKeys = (layerCount: number): TestKeymap => {
  const layerKeys: TestKeymap = {};

  for (let i = 0; i < layerCount; i++) {
    // TO (switch to layer)
    layerKeys[`TO(${i})`] = {
      code: 0x5200 + i,
      qmkid: `TO(${i})`,
      str: `TO(${i})`,
      title: `Switch to layer ${i}`,
      type: 'layer',
      idx: i
    };

    // MO (momentary layer)
    layerKeys[`MO(${i})`] = {
      code: 0x5100 + i,
      qmkid: `MO(${i})`,
      str: `MO(${i})`,
      title: `Momentary layer ${i}`,
      type: 'layer',
      idx: i
    };

    // TG (toggle layer)
    layerKeys[`TG(${i})`] = {
      code: 0x5300 + i,
      qmkid: `TG(${i})`,
      str: `TG(${i})`,
      title: `Toggle layer ${i}`,
      type: 'layer',
      idx: i
    };
  }

  return layerKeys;
};

// Factory function to generate macro keys
export const generateMacroKeys = (macroCount: number): TestKeymap => {
  const macroKeys: TestKeymap = {};

  for (let i = 0; i < macroCount && i < 127; i++) {
    macroKeys[`M${i}`] = {
      code: 0x7700 + i,
      qmkid: `M${i}`,
      str: `M${i}`,
      title: `Macro ${i}`,
      type: 'macro',
      idx: i
    };
  }

  return macroKeys;
};

// Common keycode combinations for testing
export const commonKeyCombos = {
  // Modifier + key combinations
  shiftA: ['KC_LSFT', 'KC_A'],
  ctrlC: ['KC_LCTL', 'KC_C'],
  altTab: ['KC_LALT', 'KC_TAB'],
  cmdSpace: ['KC_LGUI', 'KC_SPC'],

  // Layer tap combinations
  layerTap: ['LT(1, KC_SPC)'], // Layer 1 when held, space when tapped
  modTap: ['MT(MOD_LSFT, KC_ESC)'], // Shift when held, escape when tapped

  // Common shortcuts
  copy: ['KC_LCTL', 'KC_C'],
  paste: ['KC_LCTL', 'KC_V'],
  undo: ['KC_LCTL', 'KC_Z'],
  selectAll: ['KC_LCTL', 'KC_A'],
};

// Export all as a combined fixture
export const keymapFixtures = {
  keymap: testKeymap,
  codemap: testCodemap,
  keyaliases: testKeyaliases,
  createTestKeymap,
  generateLayerKeys,
  generateMacroKeys,
  commonKeyCombos
};
