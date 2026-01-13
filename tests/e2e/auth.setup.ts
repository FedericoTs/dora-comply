import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

/**
 * Authentication Setup
 *
 * This runs once before all tests to create an authenticated session.
 * The session is saved to .auth/user.json and reused by other tests.
 *
 * REQUIRED: Set these environment variables before running E2E tests:
 * - E2E_TEST_EMAIL: Test user email (must exist in database)
 * - E2E_TEST_PASSWORD: Test user password
 *
 * Example:
 *   E2E_TEST_EMAIL=your-test@example.com E2E_TEST_PASSWORD=YourPassword123! npm run test:e2e
 */
setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  // Skip if no credentials provided
  if (!email || !password) {
    console.error('\n========================================');
    console.error('E2E TEST CREDENTIALS NOT PROVIDED');
    console.error('========================================');
    console.error('Please set environment variables:');
    console.error('  E2E_TEST_EMAIL=your-test@example.com');
    console.error('  E2E_TEST_PASSWORD=YourPassword123!');
    console.error('\nExample:');
    console.error('  E2E_TEST_EMAIL=test@example.com E2E_TEST_PASSWORD=Test123! npm run test:e2e');
    console.error('========================================\n');
    setup.skip();
    return;
  }

  console.log(`\n[E2E Auth] Starting authentication for ${email}`);

  // Go to login page
  console.log('[E2E Auth] Navigating to /login');
  await page.goto('/login');
  console.log(`[E2E Auth] Current URL: ${page.url()}`);

  // Accept cookies if banner appears
  const cookieButton = page.getByRole('button', { name: /accept/i });
  if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('[E2E Auth] Accepting cookie banner');
    await cookieButton.click();
    await page.waitForTimeout(500);
  }

  // Fill in credentials
  console.log('[E2E Auth] Filling in credentials');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Monitor network responses
  const responseHandler = (response: { url: () => string; status: () => number }) => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('auth') || !url.includes('_next')) {
      console.log(`[E2E Auth] Response: ${response.status()} ${url.substring(0, 100)}`);
    }
  };
  page.on('response', responseHandler);

  // Submit form and wait for navigation
  console.log('[E2E Auth] Clicking sign in button');

  // Use Promise.all to wait for both the click and the navigation
  try {
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 }),
      page.getByRole('button', { name: /sign in|log in/i }).click(),
    ]);
    console.log(`[E2E Auth] Navigation complete. URL: ${page.url()}`);
  } catch (navError) {
    console.error(`[E2E Auth] Navigation error: ${navError}`);

    // Take a screenshot and capture state
    const currentUrl = page.url();
    const pageContent = await page.content();

    console.error(`[E2E Auth] Current URL after error: ${currentUrl}`);
    console.error(`[E2E Auth] Page contains 404: ${pageContent.includes('404')}`);
    console.error(`[E2E Auth] Page contains error: ${pageContent.includes('Invalid') || pageContent.includes('error')}`);

    await page.screenshot({ path: 'tests/e2e/debug-nav-error.png' });
    console.error('[E2E Auth] Screenshot saved to tests/e2e/debug-nav-error.png');

    throw new Error(`Navigation failed after login - Current URL: ${currentUrl}`);
  }

  page.off('response', responseHandler);

  // Check current URL
  const currentUrl = page.url();
  console.log(`[E2E Auth] Final URL: ${currentUrl}`);

  // Handle 404 page
  if (currentUrl.includes('/404') || (await page.locator('text=404').isVisible().catch(() => false))) {
    console.error('[E2E Auth] Landed on 404 page!');
    await page.screenshot({ path: 'tests/e2e/debug-404.png' });
    throw new Error('Login succeeded but landed on 404 page');
  }

  // Check for authentication error
  const errorAlert = page.getByText(/invalid|error|failed|incorrect/i).first();
  if (await errorAlert.isVisible({ timeout: 1000 }).catch(() => false)) {
    const errorText = await errorAlert.textContent();
    console.error(`[E2E Auth] Login error: ${errorText}`);
    throw new Error(`Authentication failed: ${errorText}`);
  }

  // Handle MFA setup page for admin users
  if (currentUrl.includes('/mfa/setup')) {
    console.log('[E2E Auth] Landed on MFA setup page - skipping MFA for test user');

    // Check if there's a "Skip for now" button (for non-required MFA)
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('[E2E Auth] Clicking skip button');
      await skipButton.click();
      await page.waitForURL(/\/(dashboard|vendors|roi|incidents)/, { timeout: 10000 });
    } else {
      // MFA is required for this admin user - we need to handle this differently
      console.error('[E2E Auth] MFA is required for this user. Consider using a non-admin test user.');
      console.error('[E2E Auth] Alternatively, update the user role in the database to skip MFA requirement.');
      await page.screenshot({ path: 'tests/e2e/debug-mfa-required.png' });
      throw new Error('MFA setup required for admin user. Use a non-admin test user for E2E tests.');
    }
  }

  // Verify we're on a protected page
  const finalUrl = page.url();
  const isOnProtectedPage = /\/(dashboard|vendors|roi|incidents|onboarding|settings|documents|contracts)/.test(finalUrl);
  if (!isOnProtectedPage) {
    console.error(`[E2E Auth] Not on a protected page. URL: ${finalUrl}`);
    console.error(`[E2E Auth] Page title: ${await page.title()}`);
    await page.screenshot({ path: 'tests/e2e/debug-unexpected-page.png' });
    throw new Error(`Unexpected page after login: ${finalUrl}`);
  }

  // Wait for page to fully load
  console.log('[E2E Auth] Waiting for page to stabilize');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('[E2E Auth] Network did not go idle, continuing anyway');
  });

  // Verify we're logged in by checking for navigation/sidebar
  console.log('[E2E Auth] Checking for authenticated elements');
  // Use .first() to handle multiple matching elements (aside sidebar + nav elements)
  await expect(
    page.locator('aside').first()
  ).toBeVisible({ timeout: 10000 });

  // Save authenticated state
  console.log('[E2E Auth] Saving storage state');
  await page.context().storageState({ path: authFile });

  console.log(`\n✓ Authenticated as ${email}`);
  console.log(`  Final URL: ${currentUrl}\n`);
});
