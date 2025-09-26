/**
 * Typed event bus for module communication
 */

// Event type definitions
export enum EventType {
  // Device events
  DEVICE_CONNECTED = 'device:connected',
  DEVICE_DISCONNECTED = 'device:disconnected',
  DEVICE_ERROR = 'device:error',
  CONNECTION_STATE_CHANGED = 'connection:state:changed',

  // State events
  STATE_CHANGED = 'state:changed',
  STATE_COMMITTED = 'state:committed',
  STATE_REVERTED = 'state:reverted',

  // UI events
  UI_KEY_BIND = 'ui:key:bind',
  UI_KEY_BOUND = 'ui:key:bound',
  UI_UPDATE_REQUEST = 'ui:update:request',

  // Settings events
  SETTINGS_LOADED = 'settings:loaded',
  SETTINGS_CHANGED = 'settings:changed',
  SETTINGS_SAVED = 'settings:saved',

  // Macro events
  MACRO_CREATED = 'macro:created',
  MACRO_UPDATED = 'macro:updated',
  MACRO_DELETED = 'macro:deleted',

  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_INFO = 'system:info',
}

// Event payload interfaces
export interface DeviceConnectedPayload {
  device: USBDevice;
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
}

export interface DeviceDisconnectedPayload {
  reason?: string;
}

export interface ConnectionStateChangedPayload {
  state: string;
}

export interface DeviceErrorPayload {
  error: Error;
  operation?: string;
}

export interface StateChangedPayload {
  type: string;
  id: string;
  oldValue?: any;
  newValue?: any;
}

export interface UIKeyBindPayload {
  layer: number;
  row: number;
  col: number;
  element: HTMLElement;
}

export interface UIKeyBoundPayload {
  layer: number;
  row: number;
  col: number;
  keycode: number;
}

export interface SystemMessagePayload {
  message: string;
  details?: any;
  stack?: string;
}

// Type mapping for events
export interface EventPayloadMap {
  [EventType.DEVICE_CONNECTED]: DeviceConnectedPayload;
  [EventType.DEVICE_DISCONNECTED]: DeviceDisconnectedPayload;
  [EventType.DEVICE_ERROR]: DeviceErrorPayload;
  [EventType.CONNECTION_STATE_CHANGED]: ConnectionStateChangedPayload;
  [EventType.STATE_CHANGED]: StateChangedPayload;
  [EventType.STATE_COMMITTED]: void;
  [EventType.STATE_REVERTED]: void;
  [EventType.UI_KEY_BIND]: UIKeyBindPayload;
  [EventType.UI_KEY_BOUND]: UIKeyBoundPayload;
  [EventType.UI_UPDATE_REQUEST]: void;
  [EventType.SETTINGS_LOADED]: Record<string, any>;
  [EventType.SETTINGS_CHANGED]: StateChangedPayload;
  [EventType.SETTINGS_SAVED]: void;
  [EventType.MACRO_CREATED]: { id: number };
  [EventType.MACRO_UPDATED]: { id: number };
  [EventType.MACRO_DELETED]: { id: number };
  [EventType.SYSTEM_ERROR]: SystemMessagePayload;
  [EventType.SYSTEM_WARNING]: SystemMessagePayload;
  [EventType.SYSTEM_INFO]: SystemMessagePayload;
}

// Generic event listener type
type EventListener<T> = (payload: T) => void;

/**
 * Event bus singleton for application-wide communication
 */
export class EventBus {
  private static instance: EventBus;
  private listeners = new Map<string, Set<EventListener<any>>>();
  private onceListeners = new Map<string, Set<EventListener<any>>>();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  public on<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<EventPayloadMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event once
   */
  public once<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<EventPayloadMap[K]>
  ): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }

    this.onceListeners.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends keyof EventPayloadMap>(
    event: K,
    listener: EventListener<EventPayloadMap[K]>
  ): void {
    this.listeners.get(event)?.delete(listener);
    this.onceListeners.get(event)?.delete(listener);
  }

  /**
   * Emit an event
   */
  public emit<K extends keyof EventPayloadMap>(
    event: K,
    payload: EventPayloadMap[K]
  ): void {
    // Call regular listeners
    const regularListeners = this.listeners.get(event);
    if (regularListeners) {
      for (const listener of regularListeners) {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }

    // Call once listeners and clear them
    const onceListenerSet = this.onceListeners.get(event);
    if (onceListenerSet) {
      const listenersToCall = Array.from(onceListenerSet);
      onceListenerSet.clear();

      for (const listener of listenersToCall) {
        try {
          listener(payload);
        } catch (error) {
          console.error(`Error in once listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  public listenerCount(event: string): number {
    const regularCount = this.listeners.get(event)?.size || 0;
    const onceCount = this.onceListeners.get(event)?.size || 0;
    return regularCount + onceCount;
  }
}

// Export singleton instance for convenience
export const eventBus = EventBus.getInstance();