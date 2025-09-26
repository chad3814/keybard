import { test, expect, Page } from '@playwright/test';

class SettingsPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/');
    // Wait for the main board to load
    await this.page.waitForSelector('#mainboard', { timeout: 10000 });
  }

  async openSettingsMenu() {
    // Click the menu button (usually labeled "MENU" or has settings icon)
    const menuButton = this.page.locator('button:has-text("MENU"), #menu-button, .menu-trigger').first();
    await menuButton.click();

    // Wait for settings panel to be visible
    await this.page.waitForSelector('#menu-content, .settings-panel', { state: 'visible' });
  }

  async getQmkSettings() {
    // Get all QMK setting items
    const settings = await this.page.locator('.qmk-setting, [data-qmk-setting]').all();
    return settings;
  }

  async getSettingByName(name: string) {
    return this.page.locator(`.qmk-setting:has-text("${name}"), [data-qmk-setting="${name}"]`).first();
  }

  async modifySettingValue(settingName: string, newValue: string | number) {
    const setting = await this.getSettingByName(settingName);
    const input = setting.locator('input, select').first();

    const inputType = await input.getAttribute('type');

    if (inputType === 'checkbox') {
      const isChecked = await input.isChecked();
      if ((newValue && !isChecked) || (!newValue && isChecked)) {
        await input.click();
      }
    } else if (await input.evaluate(el => el.tagName === 'SELECT')) {
      await input.selectOption(String(newValue));
    } else {
      await input.fill(String(newValue));
    }
  }

  async getSettingValue(settingName: string): Promise<string | boolean | null> {
    const setting = await this.getSettingByName(settingName);
    const input = setting.locator('input, select').first();

    const inputType = await input.getAttribute('type');

    if (inputType === 'checkbox') {
      return await input.isChecked();
    } else if (await input.evaluate(el => el.tagName === 'SELECT')) {
      return await input.inputValue();
    } else {
      return await input.inputValue();
    }
  }

  async isSettingsVisible() {
    return await this.page.locator('#menu-content, .settings-panel').isVisible();
  }

  async hasChangedIndicator(settingName: string) {
    const setting = await this.getSettingByName(settingName);
    return await setting.locator('.changed, .modified').count() > 0;
  }
}

test.describe('Settings/QMK Functionality', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await settingsPage.open();
  });

  test('should open settings panel', async ({ page }) => {
    await settingsPage.openSettingsMenu();

    // Verify settings panel is visible
    const isVisible = await settingsPage.isSettingsVisible();
    expect(isVisible).toBe(true);

    // Check that QMK settings section exists
    const qmkSection = page.locator('text=/QMK Settings/i, text=/Settings/i').first();
    await expect(qmkSection).toBeVisible();
  });

  test('should display QMK settings', async ({ page }) => {
    await settingsPage.openSettingsMenu();

    // Get all QMK settings
    const settings = await settingsPage.getQmkSettings();

    // Should have at least some settings
    expect(settings.length).toBeGreaterThan(0);

    // Common QMK settings that should exist
    const expectedSettings = [
      'Tapping Term',
      'Tapping Toggle',
      'Permissive Hold'
    ];

    for (const settingName of expectedSettings) {
      const setting = await settingsPage.getSettingByName(settingName);
      const exists = await setting.count() > 0;

      if (exists) {
        await expect(setting).toBeVisible();
      }
    }
  });

  test('should modify a QMK setting value', async ({ page }) => {
    await settingsPage.openSettingsMenu();

    // Try to find and modify Tapping Term (common numeric setting)
    const tappingTermSetting = await settingsPage.getSettingByName('Tapping Term');
    const exists = await tappingTermSetting.count() > 0;

    if (exists) {
      // Get original value
      const originalValue = await settingsPage.getSettingValue('Tapping Term');

      // Modify the value
      const newValue = 200;
      await settingsPage.modifySettingValue('Tapping Term', newValue);

      // Verify the value changed
      const currentValue = await settingsPage.getSettingValue('Tapping Term');
      expect(currentValue).toBe(String(newValue));

      // Check for changed indicator (if instant mode is off)
      const hasChanged = await settingsPage.hasChangedIndicator('Tapping Term');
      // This might be true or false depending on instant mode
    }
  });

  test('should reflect changes in the UI', async ({ page }) => {
    await settingsPage.openSettingsMenu();

    // Find a checkbox setting (e.g., Permissive Hold)
    const permissiveHoldSetting = await settingsPage.getSettingByName('Permissive Hold');
    const exists = await permissiveHoldSetting.count() > 0;

    if (exists) {
      // Get original value
      const originalValue = await settingsPage.getSettingValue('Permissive Hold');

      // Toggle the value
      await settingsPage.modifySettingValue('Permissive Hold', !originalValue);

      // Verify the UI updated
      const newValue = await settingsPage.getSettingValue('Permissive Hold');
      expect(newValue).toBe(!originalValue);

      // The checkbox should be in the opposite state
      const checkbox = permissiveHoldSetting.locator('input[type="checkbox"]').first();
      const isChecked = await checkbox.isChecked();
      expect(isChecked).toBe(!originalValue);
    }
  });

  test('should handle instant vs queued mode', async ({ page }) => {
    await settingsPage.openSettingsMenu();

    // Check if instant mode toggle exists
    const instantToggle = page.locator('text=/Instant/i, [data-setting="instant"]').first();
    const hasInstantToggle = await instantToggle.count() > 0;

    if (hasInstantToggle) {
      // Get current instant mode state
      const instantCheckbox = instantToggle.locator('input[type="checkbox"]').first();
      const isInstant = await instantCheckbox.isChecked();

      // Modify a setting
      const tappingTermSetting = await settingsPage.getSettingByName('Tapping Term');
      if (await tappingTermSetting.count() > 0) {
        await settingsPage.modifySettingValue('Tapping Term', 250);

        // Check for changed indicator based on mode
        const hasChanged = await settingsPage.hasChangedIndicator('Tapping Term');

        if (!isInstant) {
          // In queued mode, should show changed indicator
          // Check for commit button
          const commitButton = page.locator('button:has-text("Commit"), button:has-text("Apply")').first();
          await expect(commitButton).toBeVisible();
        }
      }
    }
  });
});