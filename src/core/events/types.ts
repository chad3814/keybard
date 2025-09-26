/**
 * Event type definitions
 */

// Re-export from EventBus for convenience
export { EventType } from './EventBus';
export type { EventPayloadMap } from './EventBus';
export type {
  DeviceConnectedPayload,
  DeviceDisconnectedPayload,
  DeviceErrorPayload,
  StateChangedPayload,
  UIKeyBindPayload,
  UIKeyBoundPayload,
  SystemMessagePayload
} from './EventBus';