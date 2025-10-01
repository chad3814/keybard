import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { renderHook as rtlRenderHook, RenderHookOptions } from '@testing-library/react';
import { VialProvider } from '../../src/contexts/VialContext';
import type { KeyboardInfo } from '../../src/types/vial.types';
import { createTestKeyboardInfo } from '../fixtures/keyboard-info.fixture';
import { vi } from 'vitest';

// Mock context values
export interface MockVialContextValue {
  keyboard: KeyboardInfo | null;
  isConnected: boolean;
  connect: (filters?: HIDDeviceFilter[]) => Promise<boolean>;
  disconnect: () => Promise<void>;
  loadKeyboard: () => Promise<void>;
  updateKey: (layer: number, row: number, col: number, keymask: number) => Promise<void>;
}

// Default mock context value
export const createMockVialContextValue = (
  overrides?: Partial<MockVialContextValue>
): MockVialContextValue => ({
  keyboard: null,
  isConnected: false,
  connect: vi.fn().mockResolvedValue(true),
  disconnect: vi.fn().mockResolvedValue(undefined),
  loadKeyboard: vi.fn().mockResolvedValue(undefined),
  updateKey: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

// Mock provider for testing
export const MockVialProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<MockVialContextValue>;
}> = ({ children, value }) => {
  const mockValue = createMockVialContextValue(value);

  // We need to mock the actual context module
  const VialContext = React.createContext<MockVialContextValue | undefined>(undefined);

  return (
    <VialContext.Provider value={mockValue}>
      {children}
    </VialContext.Provider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  vialContextValue?: Partial<MockVialContextValue>;
}

export function render(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { vialContextValue, ...renderOptions } = options || {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (vialContextValue !== undefined) {
      return (
        <MockVialProvider value={vialContextValue}>
          {children}
        </MockVialProvider>
      );
    }
    return <VialProvider>{children}</VialProvider>;
  };

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom renderHook with providers
interface CustomRenderHookOptions<TProps> extends Omit<RenderHookOptions<TProps>, 'wrapper'> {
  vialContextValue?: Partial<MockVialContextValue>;
}

export function renderHook<TResult, TProps = {}>(
  hook: (props: TProps) => TResult,
  options?: CustomRenderHookOptions<TProps>
) {
  const { vialContextValue, ...renderOptions } = options || {};

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (vialContextValue !== undefined) {
      return (
        <MockVialProvider value={vialContextValue}>
          {children}
        </MockVialProvider>
      );
    }
    return <VialProvider>{children}</VialProvider>;
  };

  return rtlRenderHook(hook, { wrapper: Wrapper, ...renderOptions });
}

// Factory functions for common test scenarios
export const testScenarios = {
  // Disconnected state (default)
  disconnected: (): Partial<MockVialContextValue> => ({
    keyboard: null,
    isConnected: false
  }),

  // Connected with keyboard loaded
  connected: (): Partial<MockVialContextValue> => ({
    keyboard: createTestKeyboardInfo(),
    isConnected: true
  }),

  // Connecting state
  connecting: (): Partial<MockVialContextValue> => ({
    keyboard: null,
    isConnected: false,
    connect: vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    )
  }),

  // Loading keyboard state
  loading: (): Partial<MockVialContextValue> => ({
    keyboard: null,
    isConnected: true,
    loadKeyboard: vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )
  }),

  // Error state
  error: (): Partial<MockVialContextValue> => ({
    keyboard: null,
    isConnected: false,
    connect: vi.fn().mockRejectedValue(new Error('Connection failed')),
    loadKeyboard: vi.fn().mockRejectedValue(new Error('Load failed'))
  }),

  // With custom keyboard
  withKeyboard: (keyboard: KeyboardInfo): Partial<MockVialContextValue> => ({
    keyboard,
    isConnected: true
  })
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Export act for async operations
export { act } from '@testing-library/react';