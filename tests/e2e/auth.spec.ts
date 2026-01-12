import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // Unauthenticated

    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Check form elements exist
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should show error message
      await expect(
        page.getByText(/invalid|incorrect|failed/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should have link to forgot password', async ({ page }) => {
      await page.goto('/login');

      const forgotLink = page.getByRole('link', { name: /forgot|reset/i });
      await expect(forgotLink).toBeVisible();
    });

    test('should have link to register', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /sign up|register|create/i });
      await expect(registerLink).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /sign up|register|create/i })).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.goto('/register');

      // Type a weak password
      await page.getByLabel(/password/i).first().fill('weak');

      // Should show strength indicator
      await expect(
        page.getByText(/weak|too short|strength/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/email/i).fill('notanemail');
      await page.getByLabel(/password/i).first().fill('ValidPassword123!');

      // Try to submit
      await page.getByRole('button', { name: /sign up|register|create/i }).click();

      // Should show validation error
      await expect(
        page.getByText(/valid email|invalid email/i)
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Password Reset', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('should display password reset request form', async ({ page }) => {
      await page.goto('/reset-password');

      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
    });

    test('should show confirmation after submitting reset request', async ({ page }) => {
      await page.goto('/reset-password');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByRole('button', { name: /reset|send/i }).click();

      // Should show confirmation message
      await expect(
        page.getByText(/check your email|sent|instructions/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Authenticated User', () => {
    // Uses authenticated state from setup

    test('should access dashboard when logged in', async ({ page }) => {
      await page.goto('/dashboard');

      // Should stay on dashboard (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard/);

      // Should see dashboard content
      await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should be able to logout', async ({ page }) => {
      await page.goto('/dashboard');

      // Find and click logout (might be in dropdown menu)
      const userMenu = page.getByRole('button', { name: /user|account|profile/i })
        .or(page.locator('[data-testid="user-menu"]'));

      if (await userMenu.isVisible()) {
        await userMenu.click();
      }

      // Click logout
      await page.getByRole('button', { name: /log out|sign out|logout/i })
        .or(page.getByRole('menuitem', { name: /log out|sign out/i }))
        .click();

      // Should be redirected to login or home
      await expect(page).toHaveURL(/\/(login|$)/);
    });

    test('should navigate between main sections', async ({ page }) => {
      await page.goto('/dashboard');

      // Navigate to Vendors
      await page.getByRole('link', { name: /vendors/i }).first().click();
      await expect(page).toHaveURL(/\/vendors/);

      // Navigate to Incidents
      await page.getByRole('link', { name: /incidents/i }).first().click();
      await expect(page).toHaveURL(/\/incidents/);

      // Navigate to ROI
      await page.getByRole('link', { name: /register|roi/i }).first().click();
      await expect(page).toHaveURL(/\/roi/);
    });
  });
});
