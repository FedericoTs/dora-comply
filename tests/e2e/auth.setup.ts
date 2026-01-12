import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

/**
 * Authentication Setup
 *
 * This runs once before all tests to create an authenticated session.
 * The session is saved to .auth/user.json and reused by other tests.
 *
 * For CI, set these environment variables:
 * - E2E_TEST_EMAIL: Test user email
 * - E2E_TEST_PASSWORD: Test user password
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL || 'test@example.com';
  const password = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

  // Go to login page
  await page.goto('/login');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit form
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL(/\/(dashboard|vendors|roi|incidents)/, {
    timeout: 30000,
  });

  // Verify we're logged in by checking for dashboard elements
  await expect(
    page.getByRole('navigation').or(page.locator('[data-testid="sidebar"]'))
  ).toBeVisible();

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
