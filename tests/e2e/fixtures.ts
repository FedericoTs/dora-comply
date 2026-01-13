import { test as base, expect, Page } from '@playwright/test';

/**
 * E2E Test Fixtures
 *
 * Provides common helpers for dismissing dialogs, banners, and other UI elements
 * that may interfere with test interactions.
 */

/**
 * Dismiss cookie consent banner if visible
 * The banner appears at the bottom of the screen with z-index 100
 */
export async function dismissCookieConsent(page: Page) {
  // Multiple attempts to dismiss with escalating strategies
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // Check for cookie consent banner using multiple selectors
      const bannerSelectors = [
        '.fixed.bottom-0',
        '[class*="fixed"][class*="bottom-0"]',
        'div[class*="z-[100]"]',
        'div:has(button:has-text("Accept All"))',
      ];

      for (const selector of bannerSelectors) {
        const banner = page.locator(selector).first();
        if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
          // Find Accept button inside the banner
          const acceptButton = banner.getByRole('button', { name: /accept/i }).first();
          if (await acceptButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await acceptButton.click({ force: true });
            await page.waitForTimeout(500);
          }
        }
      }

      // Also try clicking any visible "Accept All" button anywhere on page
      const acceptAll = page.getByRole('button', { name: /accept all/i }).first();
      if (await acceptAll.isVisible({ timeout: 300 }).catch(() => false)) {
        await acceptAll.click({ force: true });
        await page.waitForTimeout(500);
      }

      // Try "Essential Only" as fallback
      const essentialOnly = page.getByRole('button', { name: /essential only/i }).first();
      if (await essentialOnly.isVisible({ timeout: 300 }).catch(() => false)) {
        await essentialOnly.click({ force: true });
        await page.waitForTimeout(500);
      }
    } catch {
      // Continue trying
    }

    // Check if any blocking overlay is gone
    const stillBlocking = await page.locator('.fixed.bottom-0, [class*="z-[100]"]')
      .filter({ has: page.getByRole('button', { name: /accept/i }) })
      .isVisible({ timeout: 300 }).catch(() => false);

    if (!stillBlocking) {
      break;
    }

    // Wait before next attempt
    await page.waitForTimeout(500);
  }
}

/**
 * Dismiss product tour/welcome dialog if visible
 */
export async function dismissProductTour(page: Page) {
  try {
    // Look for the welcome dialog - has a close button with × text
    const dialog = page.locator('dialog');
    if (await dialog.isVisible({ timeout: 1000 })) {
      // Try clicking the close button
      const closeButton = dialog.getByRole('button', { name: /close/i })
        .or(dialog.locator('button:has-text("×")'));

      if (await closeButton.first().isVisible({ timeout: 500 })) {
        await closeButton.first().click();
        await page.waitForTimeout(500);
        return;
      }
    }
  } catch {
    // Dialog not present, continue
  }
}

/**
 * Dismiss all blocking dialogs and banners
 */
export async function dismissAllDialogs(page: Page) {
  // Dismiss in order: product tour first (it's modal), then cookie consent
  await dismissProductTour(page);
  await dismissCookieConsent(page);

  // Double check - sometimes dialogs reappear
  await page.waitForTimeout(300);
  await dismissProductTour(page);
}

/**
 * Wait for page to be ready (loaded and dialogs dismissed)
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // Wait for dialogs to appear
  await dismissAllDialogs(page);
  await page.waitForTimeout(300); // Wait for UI to settle
}

/**
 * Navigate to a page and ensure it's ready
 * Includes retry logic for Next.js cold compilation issues
 */
export async function navigateAndWait(page: Page, url: string) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    await page.goto(url);

    // Check if we got a 404 (Next.js compilation might not be ready)
    const is404 = await page.locator('text=404').isVisible({ timeout: 1000 }).catch(() => false);

    if (!is404) {
      break;
    }

    // Wait and retry if we got 404 (give Next.js time to compile)
    if (attempts < maxAttempts) {
      await page.waitForTimeout(2000);
    }
  }

  await waitForPageReady(page);
}

/**
 * Navigate to a protected page with retry logic
 * Handles both auth redirects and compilation 404s
 */
export async function navigateToProtectedPage(page: Page, url: string, expectedPattern?: RegExp) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');

    // Check if we got a 404 (Next.js compilation might not be ready)
    const is404 = await page.locator('h1:has-text("404")').isVisible({ timeout: 2000 }).catch(() => false);

    if (!is404) {
      break;
    }

    // Wait and retry if we got 404
    if (attempts < maxAttempts) {
      console.log(`[Fixtures] Got 404 on ${url}, retrying (attempt ${attempts}/${maxAttempts})`);
      await page.waitForTimeout(3000);
    }
  }

  await waitForPageReady(page);

  // Verify we're on expected page if pattern provided
  if (expectedPattern && !expectedPattern.test(page.url())) {
    throw new Error(`Expected URL to match ${expectedPattern}, but got ${page.url()}`);
  }
}

/**
 * Extended test with auto-dismiss of dialogs
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Auto-dismiss dialogs after each navigation
    page.on('load', async () => {
      await page.waitForTimeout(1000);
      await dismissAllDialogs(page);
    });

    await use(page);
  },
});

export { expect };
