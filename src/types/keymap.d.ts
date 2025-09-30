// a KeyString is like KC_A for the A key
export type KeyString = string;

export type CodeMap = Record<number, KeyString>;

export type KeyMapEntry = {
    code: number;
    qmkid: KeyString;
    str: string;
    title: string;
};

export type KeyMap = Record<KeyString, KeyMapEntry>;

export type KeyAliases = Record<KeyString, KeyString>
