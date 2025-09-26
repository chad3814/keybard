/**
 * KeyBard TypeScript Application Entry Point
 */

import { configureMobX } from '@core/state/configure';
import { SettingsStore } from '@settings/state/SettingsStore';
import { EventBus } from '@core/events/EventBus';
import { UsbDevice } from '@core/usb/UsbDevice';
import { QmkService } from '@settings/services/QmkService';
import { LifecycleManager } from '@core/lifecycle/LifecycleManager';

// Import components (registers them as custom elements)
import '@core/components/ConnectionStatus';
import '@settings/components/SettingsList';
import '@settings/components/SettingControl';

/**
 * Application class
 */
class KeyBardApp {
  private eventBus: EventBus;
  private settingsStore: SettingsStore;
  private usbDevice: UsbDevice;
  private qmkService: QmkService;
  private lifecycleManager: LifecycleManager;

  constructor() {
    // Configure MobX
    configureMobX();

    // Initialize core services
    this.eventBus = EventBus.getInstance();
    this.settingsStore = new SettingsStore();
    this.usbDevice = new UsbDevice(this.eventBus);
    this.qmkService = new QmkService(
      this.usbDevice,
      this.settingsStore,
      this.eventBus
    );
    this.lifecycleManager = LifecycleManager.getInstance();

    // Set up global debug access (if in dev mode)
    if (typeof window !== 'undefined') {
      // webpack will replace this at build time
      (window as any).__KEYBARD_DEBUG__ = true;
      (window as any).__KEYBARD__ = {
        app: this,
        stores: {
          settings: this.settingsStore,
        },
        services: {
          usb: this.usbDevice,
          qmk: this.qmkService,
        },
        eventBus: this.eventBus,
      };
    }
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    console.log('🎹 KeyBard TypeScript - Initializing...');

    try {
      // Trigger lifecycle events
      await this.lifecycleManager.triggerOnLoad();

      // Initialize QMK service (checks for existing connections)
      const result = await this.qmkService.initialize();
      if (!result.isOk()) {
        console.warn('QMK service initialization warning:', result.error);
      }

      // Mount UI components
      this.mountUI();

      console.log('✅ KeyBard TypeScript - Ready!');
    } catch (error) {
      console.error('❌ KeyBard initialization failed:', error);
      this.showError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Mount UI components to the DOM
   */
  private mountUI(): void {
    const root = document.getElementById('app');
    if (!root) {
      throw new Error('Root element #app not found');
    }

    // Create main layout
    root.innerHTML = `
      <div class="keybard-app">
        <header class="app-header">
          <h1>🎹 KeyBard</h1>
          <p class="subtitle">QMK/Vial Keyboard Configurator</p>
        </header>

        <main class="app-main">
          <div class="connection-section">
            <connection-status
              id="connection-status"
            ></connection-status>
          </div>

          <div class="settings-section">
            <settings-list
              id="settings-list"
            ></settings-list>
          </div>
        </main>

        <footer class="app-footer">
          <p>KeyBard TypeScript v0.1.0 | USB Status: <span id="usb-support">Checking...</span></p>
        </footer>
      </div>
    `;

    // Add styles
    this.injectStyles();

    // Wire up components with services
    const connectionStatus = document.getElementById('connection-status') as any;
    const settingsList = document.getElementById('settings-list') as any;

    if (connectionStatus) {
      connectionStatus.usbDevice = this.usbDevice;
      connectionStatus.qmkService = this.qmkService;
    }

    if (settingsList) {
      settingsList.store = this.settingsStore;
    }

    // Check USB support
    this.checkUSBSupport();
  }

  /**
   * Inject global styles
   */
  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #app {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .keybard-app {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .app-header {
        background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }

      .app-header h1 {
        font-size: 36px;
        margin-bottom: 10px;
      }

      .subtitle {
        opacity: 0.9;
        font-size: 16px;
      }

      .app-main {
        padding: 30px;
      }

      .connection-section {
        margin-bottom: 30px;
      }

      .settings-section {
        margin-bottom: 20px;
      }

      .app-footer {
        background: #f5f5f5;
        padding: 20px;
        text-align: center;
        font-size: 14px;
        color: #666;
      }

      #usb-support {
        font-weight: bold;
      }

      #usb-support.supported {
        color: #4caf50;
      }

      #usb-support.not-supported {
        color: #f44336;
      }

      .error-message {
        background: #ffebee;
        color: #c62828;
        padding: 15px;
        border-radius: 4px;
        margin: 20px;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Check WebHID support
   */
  private checkUSBSupport(): void {
    const statusElement = document.getElementById('usb-support');
    if (!statusElement) return;

    if ('hid' in navigator) {
      statusElement.textContent = 'Supported ✅';
      statusElement.className = 'supported';
    } else {
      statusElement.textContent = 'Not Supported ❌';
      statusElement.className = 'not-supported';
      this.showError('WebHID is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    const main = document.querySelector('.app-main');
    if (!main) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    main.insertBefore(errorDiv, main.firstChild);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const app = new KeyBardApp();
    await app.initialize();
  });
} else {
  // DOM already loaded
  const app = new KeyBardApp();
  app.initialize();
}

// Export for module usage
export { KeyBardApp };