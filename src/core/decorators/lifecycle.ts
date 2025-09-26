/**
 * Lifecycle decorators to replace the initializer pattern
 */

import { EventBus, EventType } from '../events/EventBus';

// Metadata storage for decorated methods
const lifecycleMetadata = new Map<any, Map<string, Set<string>>>();

/**
 * Decorator for methods that should run on page load
 */
export function OnLoad(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  registerLifecycleMethod(target.constructor, 'load', propertyKey);
}

/**
 * Decorator for methods that should run on device connection
 */
export function OnConnected(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  registerLifecycleMethod(target.constructor, 'connected', propertyKey);
}

/**
 * Decorator for methods that should run on device disconnection
 */
export function OnDisconnected(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  registerLifecycleMethod(target.constructor, 'disconnected', propertyKey);
}

/**
 * Register a lifecycle method in metadata
 */
function registerLifecycleMethod(constructor: any, event: string, methodName: string): void {
  if (!lifecycleMetadata.has(constructor)) {
    lifecycleMetadata.set(constructor, new Map());
  }

  const classMetadata = lifecycleMetadata.get(constructor)!;

  if (!classMetadata.has(event)) {
    classMetadata.set(event, new Set());
  }

  classMetadata.get(event)!.add(methodName);
}

/**
 * Lifecycle manager to trigger decorated methods
 */
export class LifecycleManager {
  private static instance: LifecycleManager;
  private registeredInstances = new Set<any>();
  private eventBus: EventBus;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
  }

  public static getInstance(): LifecycleManager {
    if (!LifecycleManager.instance) {
      LifecycleManager.instance = new LifecycleManager();
    }
    return LifecycleManager.instance;
  }

  /**
   * Register an instance to receive lifecycle events
   */
  public register(instance: any): void {
    this.registeredInstances.add(instance);

    // If already loaded, trigger load event immediately
    if (document.readyState === 'complete') {
      this.triggerLifecycleEvent(instance, 'load');
    }
  }

  /**
   * Unregister an instance from lifecycle events
   */
  public unregister(instance: any): void {
    this.registeredInstances.delete(instance);
  }

  /**
   * Setup event listeners for lifecycle events
   */
  private setupEventListeners(): void {
    // Listen for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.triggerGlobalLifecycleEvent('load');
      });
    } else {
      // Already loaded
      setTimeout(() => this.triggerGlobalLifecycleEvent('load'), 0);
    }

    // Listen for device connection events
    this.eventBus.on(EventType.DEVICE_CONNECTED, () => {
      this.triggerGlobalLifecycleEvent('connected');
    });

    this.eventBus.on(EventType.DEVICE_DISCONNECTED, () => {
      this.triggerGlobalLifecycleEvent('disconnected');
    });
  }

  /**
   * Trigger a lifecycle event for all registered instances
   */
  private triggerGlobalLifecycleEvent(event: string): void {
    for (const instance of this.registeredInstances) {
      this.triggerLifecycleEvent(instance, event);
    }
  }

  /**
   * Trigger a lifecycle event for a specific instance
   */
  private triggerLifecycleEvent(instance: any, event: string): void {
    const constructor = instance.constructor;
    const classMetadata = lifecycleMetadata.get(constructor);

    if (!classMetadata || !classMetadata.has(event)) {
      return;
    }

    const methods = classMetadata.get(event)!;

    for (const methodName of methods) {
      if (typeof instance[methodName] === 'function') {
        try {
          instance[methodName].call(instance);
        } catch (error) {
          console.error(`Error in lifecycle method ${methodName}:`, error);
        }
      }
    }
  }
}

/**
 * Auto-register decorator for classes
 */
export function AutoRegister<T extends { new(...args: any[]): {} }>(constructor: T): T {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      LifecycleManager.getInstance().register(this);
    }
  };
}