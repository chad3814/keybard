/**
 * Global type definitions for KeyBard
 */

// WebUSB types are provided by @types/w3c-web-usb package
// No need to redefine Navigator interface

// Global application types
declare global {
  interface Window {
    __KEYBARD_DEBUG__?: boolean;
    __KEYBARD_VERSION__?: string;
  }
}

// Module declarations for assets
declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

export {};