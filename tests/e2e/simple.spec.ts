import { test, expect } from '@playwright/test';

test('Debug: Check if app loads', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser console ${msg.type()}: ${msg.text()}`);
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`Browser error: ${error.message}`);
  });

  // Navigate to the app
  await page.goto('/');

  // Wait a moment for any JavaScript to execute
  await page.waitForTimeout(2000);

  // Check what's actually on the page
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Page body HTML:', bodyHTML.substring(0, 500));

  // Try to find any element
  const appDiv = await page.locator('#app').count();
  console.log('Found #app elements:', appDiv);

  // Check if .keybard-app exists
  const keybardApp = await page.locator('.keybard-app').count();
  console.log('Found .keybard-app elements:', keybardApp);

  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

  // This test will fail but show us what's happening
  expect(keybardApp).toBeGreaterThan(0);
});