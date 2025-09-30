// Type definitions for Vial keyboard configuration system

export interface KeyboardInfo {
  via_proto?: number;
  vial_proto?: number;
  kbid?: string;
  payload?: KeyboardPayload;
  rows: number;
  cols: number;
  layers?: number;
  custom_keycodes?: CustomKeycode[];
  keymap?: string[][];
  macros?: MacroData;
  combos?: ComboData;
  tapdance?: TapdanceData;
  key_overrides?: KeyOverrideData;
  qmk?: QMKSettings;
}

export interface KeyboardPayload {
  matrix: {
    rows: number;
    cols: number;
  };
  customKeycodes?: CustomKeycode[];
  layouts?: Record<string, KeyLayout>;
  lighting?: any;
}

export interface KeyLayout {
    col: number;
    color: string;
    decal: boolean;
    ghost: boolean;
    h: number;
    height2: number
    labels: string[];
    nub: boolean;
    profile: string;
    rotation_angle: number;
    rotation_x: number;
    rotation_y: number;
    row: number;
    sb: string;
    sm: string;
    st: string;
    stepped: boolean;
    text: string;
    textColor: string;
    textSize: number[];
    w: number;
    width2: number;
    x: number;
    x2: number;
    y: number;
    y2: number;
}

export interface CustomKeycode {
  name: string;
  title: string;
  shortName: string;
}

export interface MacroData {
  count?: number;
  size?: number;
  buffer?: Uint8Array;
}

export interface ComboData {
  count?: number;
  entries?: ComboEntry[];
}

export interface ComboEntry {
  keys: number[];
  output: number;
}

export interface TapdanceData {
  count?: number;
  entries?: TapdanceEntry[];
}

export interface TapdanceEntry {
  onTap?: number;
  onHold?: number;
  onDoubleTap?: number;
  onTapHold?: number;
  tappingTerm?: number;
}

export interface KeyOverrideData {
  count?: number;
  entries?: KeyOverrideEntry[];
}

export interface KeyOverrideEntry {
  trigger: number;
  replacement: number;
  layers: number;
  triggerMods: number;
  suppressedMods: number;
  options: number;
}

export interface QMKSettings {
  [key: string]: any;
}

export interface USBSendOptions {
  uint8?: boolean;
  uint16?: boolean;
  uint32?: boolean;
  index?: number;
  unpack?: string;
  bigendian?: boolean;
  slice?: number;
  bytes?: number;
}

export interface VialAPI {
  what: string;
  updateKey(layer: number, row: number, col: number, keymask: number): Promise<void>;
  updateMacros(kbinfo: KeyboardInfo): Promise<void>;
  updateTapdance(kbinfo: KeyboardInfo, tdid: number): Promise<void>;
  updateCombo(kbinfo: KeyboardInfo, cmbid: number): Promise<void>;
  updateKeyoverride(kbinfo: KeyboardInfo, koid: number): Promise<void>;
  updateQMKSetting(kbinfo: KeyboardInfo, qfield: string): Promise<void>;
}
