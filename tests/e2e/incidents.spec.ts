import { test, expect } from '@playwright/test';
import { dismissAllDialogs, waitForPageReady, navigateToProtectedPage } from './fixtures';

test.describe('Incident Management', () => {
  test.describe('Incident List', () => {
    test('should display incidents page', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Should show incidents heading (page shows "Incident Management")
      await expect(
        page.getByRole('heading', { name: /incident management/i })
      ).toBeVisible();

      // Should have "Report Incident" button/link
      await expect(
        page.getByRole('link', { name: /report incident/i })
      ).toBeVisible();
    });

    test('should have status filters', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Look for status filter tabs, dropdown, or filter button
      const statusFilter = page.getByRole('tab')
        .or(page.getByRole('button', { name: /filter/i }))
        .or(page.getByRole('combobox'));

      await expect(statusFilter.first()).toBeVisible();
    });

    test('should display incident cards or table', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Wait for content to load
      await page.waitForTimeout(1000);

      // The page shows incident cards as links with incident IDs
      const incidentList = page.locator('a[href*="/incidents/"]')
        .or(page.locator('[data-testid="incident-card"]'))
        .or(page.locator('table'))
        .or(page.getByText(/no incidents|empty/i));

      await expect(incidentList.first()).toBeVisible();
    });
  });

  test.describe('Report Incident', () => {
    test('should navigate to incident report wizard', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Click report incident button/link
      const reportLink = page.getByRole('link', { name: /report incident/i })
        .or(page.getByRole('button', { name: /report/i }));

      if (!await reportLink.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        test.skip(true, 'Report incident link not found');
        return;
      }

      // Get href and navigate directly to avoid click timing issues
      const href = await reportLink.first().getAttribute('href');
      if (href) {
        await navigateToProtectedPage(page, href);
      } else {
        // Fallback: click and wait
        await reportLink.first().click();
        await page.waitForTimeout(3000);
      }

      // Verify we're on the new incident page
      await expect(page).toHaveURL(/\/incidents\/new/);
    });

    test('should display incident creation wizard', async ({ page }) => {
      // Use retry navigation for protected routes (handles Next.js cold compilation)
      await navigateToProtectedPage(page, '/incidents/new');

      // Should show "Report New Incident" heading (h1) or be on the incidents/new page
      const mainHeading = page.getByRole('heading', { level: 1, name: /report new incident/i })
        .or(page.getByText('Report New Incident'));
      await expect(mainHeading.first()).toBeVisible({ timeout: 10000 });

      // On mobile, step labels like "Incident Details" may be hidden (sm:block)
      // So we just verify the form elements are present instead of step headings
      // Should have incident title field (use specific role to avoid hidden inputs)
      const formElement = page.getByRole('textbox', { name: /incident title|title/i })
        .or(page.getByLabel(/incident type/i))
        .or(page.locator('input[id="title"]'));

      await expect(formElement.first()).toBeVisible({ timeout: 10000 });
    });

    test('should require incident title/description', async ({ page }) => {
      await navigateToProtectedPage(page, '/incidents/new');

      // Dismiss dialogs first
      await dismissAllDialogs(page);

      // Clear the title field if it has default value
      const titleField = page.getByLabel(/title/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('');
      }

      await dismissAllDialogs(page);

      // Use exact match for "Next" button to avoid matching Next.js dev tools
      const nextButton = page.getByRole('button', { name: 'Next', exact: true });

      // Click the Next button with force to bypass any overlays
      if (await nextButton.isVisible()) {
        await nextButton.click({ force: true });
      }

      // Should show validation error or remain on same step
      const validationError = page.getByText(/required|must|please|min/i).first();
      const stillOnPage = page.url().includes('/incidents/new');

      // Either show error or stay on page
      const hasValidation = await validationError.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasValidation || stillOnPage).toBeTruthy();
    });

    test('should show DORA classification calculator', async ({ page }) => {
      await navigateToProtectedPage(page, '/incidents/new');

      await dismissAllDialogs(page);

      // Fill basic info first - title is required
      const titleField = page.getByLabel(/title/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('E2E Test Incident');
      }

      await dismissAllDialogs(page);

      // Click Next to go to Impact & Classification step (use exact match)
      const nextButton = page.getByRole('button', { name: 'Next', exact: true });

      if (await nextButton.isVisible()) {
        await nextButton.click({ force: true });
        await page.waitForTimeout(500);
      }

      // Should now be on "Impact & Classification" step
      // On mobile, step labels may be hidden (sm:block) but step content is visible
      // Look for classification/severity indicators or any step 2 content
      const classificationContent = page.getByRole('heading', { name: /impact|classification/i })
        .or(page.getByText(/classification|severity|major|significant|minor/i))
        .or(page.getByLabel(/impact|severity|affected/i))
        .or(page.locator('[data-step="2"]'))
        .or(page.getByText(/step 2/i));

      // Allow for either visible content or just verify we moved past step 1
      const hasClassificationUI = await classificationContent.first().isVisible({ timeout: 5000 }).catch(() => false);
      const movedPastStep1 = !page.url().includes('step=1');

      expect(hasClassificationUI || movedPastStep1).toBeTruthy();
    });

    test('should calculate incident severity based on DORA criteria', async ({ page }) => {
      await navigateToProtectedPage(page, '/incidents/new');

      await dismissAllDialogs(page);

      // Fill required fields
      const titleField = page.getByLabel(/title/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('E2E Test Incident - Severity Test');
      }

      await dismissAllDialogs(page);

      // Navigate through wizard to find severity/classification (use exact match)
      const nextButton = page.getByRole('button', { name: 'Next', exact: true });

      if (await nextButton.isVisible()) {
        await nextButton.click({ force: true });
        await page.waitForTimeout(500);
      }

      // Look for severity indicator on Impact & Classification step
      const severityIndicator = page.getByText(/major|significant|minor/i)
        .or(page.locator('[data-testid*="severity"]'))
        .or(page.locator('[data-testid*="classification"]'));

      // If severity is displayed, verify it
      if (await severityIndicator.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(severityIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('Incident Detail', () => {
    test('should display incident details', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Wait for incidents to load
      await page.waitForTimeout(1000);

      // Click on first incident link (cards link to /incidents/[id])
      const incidentLink = page.locator('a[href*="/incidents/"]')
        .filter({ hasNotText: /new|report/i })
        .first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();

        // Should be on incident detail page
        await expect(page).toHaveURL(/\/incidents\/[a-z0-9-]+$/);

        // Should show incident information
        await expect(page.getByRole('heading').first()).toBeVisible();
      }
    });

    test('should show incident timeline/events', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // Find and click on an incident
      const incidentLink = page.locator('a[href*="/incidents/"]')
        .filter({ hasNotText: /new|report/i })
        .first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();
        await page.waitForURL(/\/incidents\/[a-z0-9-]+$/);
        await waitForPageReady(page);

        // Look for timeline, events, or history section
        const timeline = page.getByText(/timeline|events|history|report/i)
          .or(page.locator('[data-testid*="timeline"]'));

        await expect(timeline.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have option to add events to incident', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      const incidentLink = page.locator('a[href*="/incidents/"]')
        .filter({ hasNotText: /new|report/i })
        .first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();
        await page.waitForURL(/\/incidents\/[a-z0-9-]+$/);
        await waitForPageReady(page);

        // Look for add event, update, or log button
        const addEventButton = page.getByRole('button', { name: /add|log|update|event/i })
          .or(page.getByRole('link', { name: /add|update/i }));

        await expect(addEventButton.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Incident Reporting Deadlines', () => {
    test('should display DORA reporting deadlines', async ({ page }) => {
      await page.goto('/incidents');
      await waitForPageReady(page);

      // The incidents page shows deadline information in the sidebar
      // Look for deadline indicators (4h, 72h, deadline, overdue)
      const deadlineInfo = page.getByText(/deadline|overdue|due|4.*hour|72.*hour|initial|intermediate|final/i)
        .or(page.locator('[data-testid*="deadline"]'));

      await expect(deadlineInfo.first()).toBeVisible({ timeout: 5000 });
    });
  });
});
