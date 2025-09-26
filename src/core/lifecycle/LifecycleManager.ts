/**
 * Lifecycle manager for decorator-based lifecycle events
 */

export type LifecycleCallback = () => void | Promise<void>;

interface LifecycleRegistration {
  target: any;
  method: string;
  callback: LifecycleCallback;
}

/**
 * Singleton lifecycle manager
 */
export class LifecycleManager {
  private static instance: LifecycleManager;
  private onLoadCallbacks: LifecycleRegistration[] = [];
  private onConnectedCallbacks: LifecycleRegistration[] = [];
  private isLoaded = false;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): LifecycleManager {
    if (!LifecycleManager.instance) {
      LifecycleManager.instance = new LifecycleManager();
    }
    return LifecycleManager.instance;
  }

  /**
   * Register an onLoad callback
   */
  public registerOnLoad(target: any, method: string, callback: LifecycleCallback): void {
    this.onLoadCallbacks.push({ target, method, callback });

    // If already loaded, trigger immediately
    if (this.isLoaded) {
      this.executeCallback(callback, target, method);
    }
  }

  /**
   * Register an onConnected callback
   */
  public registerOnConnected(target: any, method: string, callback: LifecycleCallback): void {
    this.onConnectedCallbacks.push({ target, method, callback });

    // If already connected, trigger immediately
    if (this.isConnected) {
      this.executeCallback(callback, target, method);
    }
  }

  /**
   * Trigger all onLoad callbacks
   */
  public async triggerOnLoad(): Promise<void> {
    if (this.isLoaded) {
      console.warn('OnLoad already triggered');
      return;
    }

    this.isLoaded = true;
    console.log(`Triggering ${this.onLoadCallbacks.length} onLoad callbacks`);

    for (const registration of this.onLoadCallbacks) {
      await this.executeCallback(registration.callback, registration.target, registration.method);
    }
  }

  /**
   * Trigger all onConnected callbacks
   */
  public async triggerOnConnected(): Promise<void> {
    this.isConnected = true;
    console.log(`Triggering ${this.onConnectedCallbacks.length} onConnected callbacks`);

    for (const registration of this.onConnectedCallbacks) {
      await this.executeCallback(registration.callback, registration.target, registration.method);
    }
  }

  /**
   * Trigger disconnect (resets connected state)
   */
  public triggerDisconnected(): void {
    this.isConnected = false;
    console.log('Device disconnected');
  }

  /**
   * Execute a lifecycle callback
   */
  private async executeCallback(
    callback: LifecycleCallback,
    target: any,
    method: string
  ): Promise<void> {
    try {
      const result = callback();
      if (result instanceof Promise) {
        await result;
      }
      console.log(`✓ Executed lifecycle: ${target.constructor.name}.${method}`);
    } catch (error) {
      console.error(`✗ Lifecycle error in ${target.constructor.name}.${method}:`, error);
    }
  }

  /**
   * Reset lifecycle state (mainly for testing)
   */
  public reset(): void {
    this.onLoadCallbacks = [];
    this.onConnectedCallbacks = [];
    this.isLoaded = false;
    this.isConnected = false;
  }
}