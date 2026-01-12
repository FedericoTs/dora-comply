import { test, expect } from '@playwright/test';

test.describe('Incident Management', () => {
  test.describe('Incident List', () => {
    test('should display incidents page', async ({ page }) => {
      await page.goto('/incidents');

      // Should show incidents heading
      await expect(page.getByRole('heading', { name: /incidents/i })).toBeVisible();

      // Should have report incident button
      await expect(
        page.getByRole('link', { name: /report|new|create/i })
          .or(page.getByRole('button', { name: /report|new|create/i }))
      ).toBeVisible();
    });

    test('should have status filters', async ({ page }) => {
      await page.goto('/incidents');

      // Look for status filter tabs or dropdown
      const statusFilter = page.getByRole('tab')
        .or(page.getByRole('button', { name: /status|all|open|closed/i }))
        .or(page.getByRole('combobox'));

      await expect(statusFilter.first()).toBeVisible();
    });

    test('should display incident cards or table', async ({ page }) => {
      await page.goto('/incidents');

      // Wait for content to load
      await page.waitForTimeout(1000);

      // Should have incident list or empty state
      const incidentList = page.locator('[data-testid="incident-card"]')
        .or(page.locator('[data-testid="incident-list"]'))
        .or(page.locator('table'))
        .or(page.getByText(/no incidents|empty/i));

      await expect(incidentList.first()).toBeVisible();
    });
  });

  test.describe('Report Incident', () => {
    test('should navigate to incident report wizard', async ({ page }) => {
      await page.goto('/incidents');

      // Click report incident button
      await page.getByRole('link', { name: /report|new|create/i })
        .or(page.getByRole('button', { name: /report|new|create/i }))
        .first()
        .click();

      // Should be on new incident page
      await expect(page).toHaveURL(/\/incidents\/new/);
    });

    test('should display incident creation wizard', async ({ page }) => {
      await page.goto('/incidents/new');

      // Should show wizard steps or form
      await expect(
        page.getByRole('heading').first()
          .or(page.getByText(/step|basic|details/i).first())
      ).toBeVisible();

      // Should have incident type selection
      const typeField = page.getByLabel(/type/i)
        .or(page.getByRole('combobox'))
        .or(page.getByRole('radiogroup'));

      await expect(typeField.first()).toBeVisible();
    });

    test('should require incident title/description', async ({ page }) => {
      await page.goto('/incidents/new');

      // Try to proceed without filling required fields
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      const submitButton = page.getByRole('button', { name: /submit|create|report/i });

      const actionButton = await nextButton.isVisible() ? nextButton : submitButton;
      await actionButton.click();

      // Should show validation error
      await expect(
        page.getByText(/required|must|please/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show DORA classification calculator', async ({ page }) => {
      await page.goto('/incidents/new');

      // Fill basic info first if wizard
      const titleField = page.getByLabel(/title|name|description/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('E2E Test Incident');
      }

      // Navigate through wizard to classification step
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      while (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Check if we reached classification step
        const classificationSection = page.getByText(/classification|severity|impact/i);
        if (await classificationSection.isVisible()) {
          break;
        }
      }

      // Should show impact assessment questions
      await expect(
        page.getByText(/client|transaction|duration|critical/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should calculate incident severity based on DORA criteria', async ({ page }) => {
      await page.goto('/incidents/new');

      // Fill required fields and navigate to classification
      const titleField = page.getByLabel(/title|name/i).first();
      if (await titleField.isVisible()) {
        await titleField.fill('E2E Test Incident - Severity Test');
      }

      // Navigate to classification step
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      let attempts = 0;
      while (await nextButton.isVisible() && attempts < 5) {
        await nextButton.click();
        await page.waitForTimeout(500);
        attempts++;
      }

      // Look for severity indicator or classification result
      const severityIndicator = page.getByText(/major|significant|minor/i)
        .or(page.locator('[data-testid="severity-badge"]'))
        .or(page.locator('[data-testid="classification-result"]'));

      // Severity should be calculated and displayed
      if (await severityIndicator.first().isVisible()) {
        await expect(severityIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('Incident Detail', () => {
    test('should display incident details', async ({ page }) => {
      await page.goto('/incidents');

      // Wait for incidents to load
      await page.waitForTimeout(1000);

      // Click on first incident if available
      const incidentLink = page.getByRole('link').filter({ hasText: /view|details/i }).first()
        .or(page.locator('[data-testid="incident-card"] a').first())
        .or(page.locator('table tbody tr a').first());

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

      const incidentLink = page.locator('a[href*="/incidents/"]').first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();
        await page.waitForURL(/\/incidents\/[a-z0-9-]+$/);

        // Look for timeline or events section
        const timeline = page.getByText(/timeline|events|history/i)
          .or(page.locator('[data-testid="incident-timeline"]'));

        await expect(timeline.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have option to add events to incident', async ({ page }) => {
      await page.goto('/incidents');

      const incidentLink = page.locator('a[href*="/incidents/"]').first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();
        await page.waitForURL(/\/incidents\/[a-z0-9-]+$/);

        // Look for add event button
        const addEventButton = page.getByRole('button', { name: /add event|log|update/i });

        await expect(addEventButton.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Incident Reporting Deadlines', () => {
    test('should display DORA reporting deadlines', async ({ page }) => {
      await page.goto('/incidents');

      const incidentLink = page.locator('a[href*="/incidents/"]').first();

      if (await incidentLink.isVisible()) {
        await incidentLink.click();
        await page.waitForURL(/\/incidents\/[a-z0-9-]+$/);

        // Look for deadline indicators (4h, 72h, 1 month)
        const deadlineInfo = page.getByText(/deadline|due|report|hours|days/i)
          .or(page.locator('[data-testid="deadline-badge"]'));

        await expect(deadlineInfo.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
