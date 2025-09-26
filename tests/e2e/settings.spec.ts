import { test, expect, Page } from '@playwright/test';

class SettingsPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/');
    // Wait for the app to load
    await this.page.waitForSelector('.keybard-app', { timeout: 10000 });
    // Wait for connection status component
    await this.page.waitForSelector('connection-status', { timeout: 10000 });
  }

  async connectDevice() {
    // Click connect button
    const connectButton = this.page.locator('button.btn-connect');
    if (await connectButton.isVisible()) {
      await connectButton.click();
      // In tests, we'll mock the USB device selection
      // Wait for connection state to change
      await this.page.waitForSelector('.status-dot.connected', { timeout: 5000 });
    }
  }

  async getQmkSettings() {
    // Get all setting control components
    const settings = await this.page.locator('setting-control').all();
    return settings;
  }

  async getSettingByName(name: string) {
    return this.page.locator(`setting-control:has(.setting-name:has-text("${name}"))`).first();
  }

  async modifySettingValue(settingName: string, newValue: string | number | boolean) {
    const setting = await this.getSettingByName(settingName);
    const settingControl = setting.locator('.setting-control').first();

    // Check if it's a boolean (checkbox) or number input
    const checkbox = setting.locator('input[type="checkbox"]');
    const numberInput = setting.locator('input[type="number"]');
    const rangeInput = setting.locator('input[type="range"]');

    if (await checkbox.count() > 0) {
      const isChecked = await checkbox.isChecked();
      if ((newValue && !isChecked) || (!newValue && isChecked)) {
        await checkbox.click();
      }
    } else if (await numberInput.count() > 0) {
      await numberInput.fill(String(newValue));
      // Trigger change event
      await numberInput.dispatchEvent('change');
    } else if (await rangeInput.count() > 0) {
      await rangeInput.fill(String(newValue));
      await rangeInput.dispatchEvent('input');
    }

    // Wait for the setting change animation
    await this.page.waitForTimeout(600);
  }

  async getSettingValue(settingName: string): Promise<string | boolean | null> {
    const setting = await this.getSettingByName(settingName);

    const checkbox = setting.locator('input[type="checkbox"]');
    const numberInput = setting.locator('input[type="number"]');
    const valueDisplay = setting.locator('.current-value');

    if (await checkbox.count() > 0) {
      return await checkbox.isChecked();
    } else if (await numberInput.count() > 0) {
      return await numberInput.inputValue();
    } else if (await valueDisplay.count() > 0) {
      const text = await valueDisplay.innerText();
      // Remove unit suffix if present
      return text.replace(/[a-z]+$/i, '').trim();
    }

    return null;
  }

  async saveSettings() {
    const saveButton = this.page.locator('button.btn-save');
    await saveButton.click();
    // Wait for save to complete
    await this.page.waitForTimeout(1000);
  }

  async revertSettings() {
    const revertButton = this.page.locator('button.btn-revert');
    await revertButton.click();
    // Wait for revert to complete
    await this.page.waitForTimeout(500);
  }

  async toggleInstantMode() {
    const instantModeCheckbox = this.page.locator('#instant-mode');
    await instantModeCheckbox.click();
    await this.page.waitForTimeout(200);
  }

  async isInstantModeEnabled(): Promise<boolean> {
    const instantModeCheckbox = this.page.locator('#instant-mode');
    return await instantModeCheckbox.isChecked();
  }

  async hasUnsavedChanges(): Promise<boolean> {
    // Check if the status indicator shows unsaved changes
    const indicator = this.page.locator('.status-indicator.has-changes');
    return await indicator.isVisible();
  }
}

// Mock WebUSB for testing
test.beforeEach(async ({ page }) => {
  // Mock the WebUSB API
  await page.addInitScript(() => {
    // Create mock USB device
    const mockDevice = {
      vendorId: 0x1234,
      productId: 0x5678,
      productName: 'Test Keyboard',
      manufacturerName: 'Test Manufacturer',
      serialNumber: '12345',
      opened: false,
      configuration: {
        interfaces: [{
          interfaceNumber: 0,
          alternates: [{
            interfaceClass: 0x03, // HID
            endpoints: [
              { direction: 'in', endpointNumber: 1 },
              { direction: 'out', endpointNumber: 2 }
            ]
          }]
        }]
      },
      open: async function() { this.opened = true; return Promise.resolve(); },
      close: async function() { this.opened = false; return Promise.resolve(); },
      selectConfiguration: async () => Promise.resolve(),
      claimInterface: async () => Promise.resolve(),
      releaseInterface: async () => Promise.resolve(),
      transferIn: async () => Promise.resolve({
        status: 'ok',
        data: new DataView(new ArrayBuffer(64))
      }),
      transferOut: async () => Promise.resolve({
        status: 'ok',
        bytesWritten: 64
      })
    };

    // Mock navigator.usb
    (window.navigator as any).usb = {
      getDevices: async () => [],
      requestDevice: async () => mockDevice
    };

    // Mark USB as supported
    console.log('WebUSB mock initialized');
  });
});

test.describe('Settings/QMK Functionality', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.open();
  });

  test('should display the application UI', async ({ page }) => {
    // Check that main UI elements are present
    await expect(page.locator('.keybard-app')).toBeVisible();
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('connection-status')).toBeVisible();
    await expect(page.locator('settings-list')).toBeVisible();

    // Check WebUSB support indicator
    const usbSupport = page.locator('#usb-support');
    await expect(usbSupport).toContainText('Supported');
  });

  test('should connect to a mock device', async ({ page }) => {
    // Check initial disconnected state
    const statusDot = page.locator('.status-dot');
    await expect(statusDot).toHaveClass(/disconnected/);

    // Click connect button
    const connectButton = page.locator('button.btn-connect');
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Should show connecting state briefly
    await expect(statusDot).toHaveClass(/connecting/);

    // Should eventually show connected
    await expect(statusDot).toHaveClass(/connected/, { timeout: 5000 });

    // Device info should be displayed
    await expect(page.locator('.device-info')).toBeVisible();
    await expect(page.locator('.device-detail-value').first()).toContainText('Test Manufacturer');
  });

  test('should display QMK settings', async ({ page }) => {
    // Settings should be loaded (from mock data in SettingsStore)
    await page.waitForSelector('setting-control', { timeout: 5000 });

    const settings = await settingsPage.getQmkSettings();
    expect(settings.length).toBeGreaterThan(0);

    // Check for specific settings categories
    await expect(page.locator('.category-title:has-text("Tapping")')).toBeVisible();
    await expect(page.locator('.category-title:has-text("Mouse Keys")')).toBeVisible();

    // Check for specific settings
    const tappingTerm = await settingsPage.getSettingByName('Tapping Term');
    await expect(tappingTerm).toBeVisible();
  });

  test('should modify a QMK setting value', async ({ page }) => {
    // Wait for settings to load
    await page.waitForSelector('setting-control', { timeout: 5000 });

    // Modify Tapping Term
    const initialValue = await settingsPage.getSettingValue('Tapping Term');
    expect(initialValue).toBeTruthy();

    const newValue = 250;
    await settingsPage.modifySettingValue('Tapping Term', newValue);

    // Verify the value changed
    const updatedValue = await settingsPage.getSettingValue('Tapping Term');
    expect(updatedValue).toBe(String(newValue));

    // Should show unsaved changes indicator
    await expect(page.locator('.status-indicator.has-changes')).toBeVisible();
  });

  test('should handle boolean settings', async ({ page }) => {
    // Wait for settings to load
    await page.waitForSelector('setting-control', { timeout: 5000 });

    // Toggle Permissive Hold
    const initialValue = await settingsPage.getSettingValue('Permissive Hold');
    expect(typeof initialValue).toBe('boolean');

    await settingsPage.modifySettingValue('Permissive Hold', !initialValue);

    const updatedValue = await settingsPage.getSettingValue('Permissive Hold');
    expect(updatedValue).toBe(!initialValue);
  });

  test('should handle instant vs queued mode', async ({ page }) => {
    // Wait for settings to load
    await page.waitForSelector('setting-control', { timeout: 5000 });

    // Check initial instant mode state
    const initialInstantMode = await settingsPage.isInstantModeEnabled();
    expect(typeof initialInstantMode).toBe('boolean');

    // Make a change in queued mode
    if (initialInstantMode) {
      await settingsPage.toggleInstantMode();
    }

    await settingsPage.modifySettingValue('Tapping Term', 300);

    // Should show unsaved changes
    await expect(page.locator('.status-indicator.has-changes')).toBeVisible();

    // Save button should be enabled
    const saveButton = page.locator('button.btn-save');
    await expect(saveButton).not.toBeDisabled();

    // Switch to instant mode
    await settingsPage.toggleInstantMode();

    // Make another change
    await settingsPage.modifySettingValue('Combo Term', 100);

    // In instant mode, changes should auto-save (no unsaved indicator after a moment)
    await page.waitForTimeout(1000);

    // Note: In real implementation, instant mode would immediately save
    // For now, the UI just tracks the mode
  });

  test('should revert unsaved changes', async ({ page }) => {
    // Wait for settings to load
    await page.waitForSelector('setting-control', { timeout: 5000 });

    // Get initial value
    const initialValue = await settingsPage.getSettingValue('Tapping Term');

    // Make a change
    await settingsPage.modifySettingValue('Tapping Term', 350);

    // Verify change indicator appears
    await expect(page.locator('.status-indicator.has-changes')).toBeVisible();

    // Click revert
    await settingsPage.revertSettings();

    // Value should be restored
    const revertedValue = await settingsPage.getSettingValue('Tapping Term');
    expect(revertedValue).toBe(initialValue);

    // Change indicator should disappear
    await expect(page.locator('.status-indicator.has-changes')).not.toBeVisible();
  });
});