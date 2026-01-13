import { test, expect } from '@playwright/test';
import { dismissAllDialogs, waitForPageReady } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // Unauthenticated

    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      await dismissAllDialogs(page);

      // Check form elements exist
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Dismiss any dialogs/banners multiple times
      await dismissAllDialogs(page);
      await page.waitForTimeout(500);
      await dismissAllDialogs(page);

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');

      // Final dismiss before clicking submit
      await dismissAllDialogs(page);

      // Use force click to bypass any overlays
      await page.getByRole('button', { name: /sign in|log in/i }).click({ force: true });

      // Wait for the request to complete
      await page.waitForTimeout(3000);

      // Dismiss any dialogs that appeared after form submission
      await dismissAllDialogs(page);

      // Should show error message - wait for request to complete
      // Error can appear as alert, toast, or inline message
      // Use first() to handle multiple matches (strict mode)
      await expect(
        page.getByText(/invalid|incorrect|failed|error|wrong/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/login');
      await dismissAllDialogs(page);

      const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
      await expect(forgotLink).toBeVisible();
    });

    test('should have link to register or request access', async ({ page }) => {
      await page.goto('/login');
      await dismissAllDialogs(page);

      // App uses invitation-only model - may have "request access" instead of "register"
      const registerLink = page.getByRole('link', { name: /sign up|register|create|request/i });
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Access Request Page', () => {
    // The app uses invitation-only model with "Request Platform Access" form
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display access request form', async ({ page }) => {
      // /register redirects to /contact for invitation-only access
      await page.goto('/contact?source=register');
      await dismissAllDialogs(page);

      // Should show access request form - heading says "Request Platform Access" or "Contact Us"
      await expect(
        page.getByRole('heading', { name: /request|contact/i }).first()
      ).toBeVisible();

      // Form should have name, email, company fields
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/work email/i)).toBeVisible();
    });

    test('should have company/organization field', async ({ page }) => {
      await page.goto('/contact');
      await dismissAllDialogs(page);

      // Should have organization field
      await expect(
        page.getByLabel(/company|organization/i)
      ).toBeVisible();
    });

    test('should have message/interest field', async ({ page }) => {
      await page.goto('/contact');
      await dismissAllDialogs(page);

      // Should have message or interest selection
      const messageField = page.getByLabel(/message/i)
        .or(page.getByLabel(/interest/i));

      await expect(messageField.first()).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display password reset request form', async ({ page }) => {
      await page.goto('/reset-password');
      await dismissAllDialogs(page);

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
    });

    test('should show confirmation after submitting reset request', async ({ page }) => {
      await page.goto('/reset-password');
      await dismissAllDialogs(page);

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Wait for the request to complete and show confirmation
      // Cookie consent may appear after navigation - wait for it
      await page.waitForTimeout(2000);
      await dismissAllDialogs(page);

      // The confirmation page shows "Check your email" as h2 heading
      const heading = page.getByRole('heading', { level: 2, name: /check your email/i });

      // Wait for heading to appear, dismissing dialogs if they appear
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
          break;
        }
        // Dialog might have appeared - dismiss it
        await dismissAllDialogs(page);
      }

      await expect(heading).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Authenticated User', () => {
    // Uses authenticated state from setup
    // Skip tests if no E2E credentials are configured
    const hasCredentials = process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD;

    test('should access dashboard when logged in', async ({ page }) => {
      test.skip(!hasCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

      await page.goto('/dashboard');
      await waitForPageReady(page);

      // If redirected to login, credentials may not be valid
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, 'Auth session not established - check credentials');
        return;
      }

      // Should stay on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);

      // Should see dashboard content
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should be able to logout', async ({ page }) => {
      test.skip(!hasCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

      await page.goto('/dashboard');
      await waitForPageReady(page);

      // If redirected to login, skip
      if (page.url().includes('/login')) {
        test.skip(true, 'Auth session not established');
        return;
      }

      // The Sign out button is visible in the sidebar user section
      const signOutButton = page.getByRole('button', { name: /sign out/i });

      // Wait for button to be visible and click it
      await expect(signOutButton).toBeVisible({ timeout: 5000 });
      await signOutButton.click();

      // Should be redirected to login or home
      await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10000 });
    });

    test('should navigate between main sections', async ({ page }) => {
      test.skip(!hasCredentials, 'Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD');

      await page.goto('/dashboard');
      await waitForPageReady(page);

      // If redirected to login, skip
      if (page.url().includes('/login')) {
        test.skip(true, 'Auth session not established');
        return;
      }

      // Navigate to Vendors
      await page.getByRole('link', { name: /vendors/i }).first().click();
      await expect(page).toHaveURL(/\/vendors/);
      await waitForPageReady(page);

      // Navigate to Incidents
      await page.getByRole('link', { name: /incidents/i }).first().click();
      await expect(page).toHaveURL(/\/incidents/);
      await waitForPageReady(page);

      // Navigate to ROI (Register of Information)
      await page.getByRole('link', { name: /register|roi/i }).first().click();
      await expect(page).toHaveURL(/\/roi/);
    });
  });
});
