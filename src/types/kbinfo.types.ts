/**
 * KBINFO type definitions
 * Core keyboard state structure
 */

export interface KeyLayout {
  rows: number;
  cols: number;
  keys: KeyPosition[];
}

export interface KeyPosition {
  row: number;
  col: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
}

export interface Macro {
  id: number;
  name?: string;
  actions: MacroAction[];
}

export interface MacroAction {
  type: 'down' | 'up' | 'tap' | 'delay' | 'text';
  keycode?: number;
  duration?: number;
  text?: string;
}

export interface TapDance {
  id: number;
  onTap?: number;
  onHold?: number;
  onDoubleTap?: number;
  onTapHold?: number;
  tappingTerm?: number;
}

export interface Combo {
  id: number;
  keys: number[];
  keycode: number;
  term?: number;
}

export interface KeyOverride {
  id: number;
  trigger: number;
  replacement: number;
  layers?: number;
  options?: number;
}

export interface QMKSetting {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'select';
  value: number | boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: number; label: string }>;
  description?: string;
}

export interface CustomKeycode {
  name: string;
  shortName: string;
  keycode: number;
  title?: string;
}

export interface KBInfoCosmetic {
  layerNames?: Record<string, string>;
  keyColors?: Record<string, string>;
  theme?: 'light' | 'dark';
}

export interface KBInfoExtra {
  version?: string;
  buildDate?: string;
  firmware?: string;
  protocol?: {
    via: number;
    vial: number;
  };
}

/**
 * Main KBINFO structure
 * Represents complete keyboard configuration state
 */
export interface KBINFO {
  // Matrix dimensions
  layers: number;
  rows: number;
  cols: number;

  // Layout definition
  keylayout: KeyLayout;

  // Keymap: [layer][position] = keycode
  keymap: number[][];

  // Features
  macro_count: number;
  macros: Macro[];

  tapdance_count: number;
  tapdances: TapDance[];

  combo_count: number;
  combos: Combo[];

  key_override_count: number;
  key_override_entries: KeyOverride[];

  // QMK Settings
  settings: Record<string, QMKSetting>;

  // Custom keycodes
  custom_keycodes: CustomKeycode[];

  // UI/Cosmetic data
  cosmetic?: KBInfoCosmetic;

  // Extra metadata
  extra?: KBInfoExtra;

  // Protocol versions
  via_proto: number;
  vial_proto: number;
}

/**
 * Default KBINFO values
 */
export const DEFAULT_KBINFO: Partial<KBINFO> = {
  layers: 16,
  rows: 10,
  cols: 6,
  keylayout: {
    rows: 10,
    cols: 6,
    keys: [],
  },
  keymap: [],
  macro_count: 50,
  macros: [],
  tapdance_count: 50,
  tapdances: [],
  combo_count: 50,
  combos: [],
  key_override_count: 30,
  key_override_entries: [],
  settings: {},
  custom_keycodes: [],
  via_proto: 9,
  vial_proto: 6,
};

/**
 * Change tracking
 */
export interface Change {
  type: 'key' | 'macro' | 'tapdance' | 'combo' | 'override' | 'setting';
  id: string;
  oldValue?: unknown;
  newValue?: unknown;
  timestamp: number;
}

export interface ChangeQueue {
  pending: Map<string, Change>;
  committed: Change[];
}

/**
 * Device connection state
 */
export interface DeviceState {
  connected: boolean;
  device?: USBDevice;
  vendorId?: number;
  productId?: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
}