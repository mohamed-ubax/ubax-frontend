import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/admin/');

  // Expect the page title to contain the app name.
  await expect(page).toHaveTitle(/ubax-admin/i);
});
