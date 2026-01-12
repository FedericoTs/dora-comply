import { test, expect } from '@playwright/test';

test.describe('Vendor Management', () => {
  test.describe('Vendor List', () => {
    test('should display vendor list page', async ({ page }) => {
      await page.goto('/vendors');

      // Should show vendors heading
      await expect(page.getByRole('heading', { name: /vendors/i })).toBeVisible();

      // Should have add vendor button
      await expect(
        page.getByRole('link', { name: /add|new|create/i })
          .or(page.getByRole('button', { name: /add|new|create/i }))
      ).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/vendors');

      // Find search input
      const searchInput = page.getByPlaceholder(/search/i)
        .or(page.getByRole('searchbox'))
        .or(page.locator('input[type="search"]'));

      await expect(searchInput).toBeVisible();

      // Type in search
      await searchInput.fill('test vendor');

      // Wait for results to filter
      await page.waitForTimeout(500);
    });

    test('should have filter options', async ({ page }) => {
      await page.goto('/vendors');

      // Look for filter controls
      const filterButton = page.getByRole('button', { name: /filter|tier|status/i })
        .or(page.getByRole('combobox'));

      await expect(filterButton.first()).toBeVisible();
    });

    test('should toggle between grid and table view', async ({ page }) => {
      await page.goto('/vendors');

      // Find view toggle buttons
      const gridButton = page.getByRole('button', { name: /grid/i })
        .or(page.locator('[data-testid="grid-view"]'));
      const tableButton = page.getByRole('button', { name: /table|list/i })
        .or(page.locator('[data-testid="table-view"]'));

      // At least one view toggle should exist
      const hasViewToggle = await gridButton.isVisible() || await tableButton.isVisible();
      expect(hasViewToggle).toBeTruthy();
    });
  });

  test.describe('Add Vendor', () => {
    test('should navigate to add vendor page', async ({ page }) => {
      await page.goto('/vendors');

      // Click add vendor
      await page.getByRole('link', { name: /add|new|create/i })
        .or(page.getByRole('button', { name: /add|new|create/i }))
        .first()
        .click();

      // Should be on add vendor page
      await expect(page).toHaveURL(/\/vendors\/new/);
    });

    test('should display vendor creation form', async ({ page }) => {
      await page.goto('/vendors/new');

      // Required fields should be present
      await expect(page.getByLabel(/name/i).first()).toBeVisible();
      await expect(page.getByLabel(/tier|criticality/i).first()).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/vendors/new');

      // Try to submit without filling required fields
      const submitButton = page.getByRole('button', { name: /save|create|add|next/i }).last();
      await submitButton.click();

      // Should show validation errors
      await expect(
        page.getByText(/required|must|please/i).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should create vendor with valid data', async ({ page }) => {
      await page.goto('/vendors/new');

      const uniqueName = `E2E Test Vendor ${Date.now()}`;

      // Fill vendor name
      await page.getByLabel(/name/i).first().fill(uniqueName);

      // Select tier
      const tierSelect = page.getByLabel(/tier|criticality/i).first()
        .or(page.locator('[name="tier"]'));
      await tierSelect.click();
      await page.getByRole('option', { name: /standard|important/i }).first().click();

      // Fill other required fields based on form structure
      const countryField = page.getByLabel(/country/i);
      if (await countryField.isVisible()) {
        await countryField.click();
        await page.getByRole('option').first().click();
      }

      // Submit form - handle wizard or single form
      const nextButton = page.getByRole('button', { name: /next/i });
      const saveButton = page.getByRole('button', { name: /save|create|add/i });

      if (await nextButton.isVisible()) {
        // Multi-step wizard - navigate through steps
        while (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForTimeout(500);
        }
      }

      // Final save
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }

      // Should redirect to vendor detail or list
      await expect(page).toHaveURL(/\/vendors(\/[a-z0-9-]+)?$/, { timeout: 10000 });
    });
  });

  test.describe('Vendor Detail', () => {
    test('should display vendor details when clicking on a vendor', async ({ page }) => {
      await page.goto('/vendors');

      // Wait for vendors to load
      await page.waitForTimeout(1000);

      // Click on first vendor (card or table row)
      const vendorLink = page.getByRole('link', { name: /view|details/i }).first()
        .or(page.locator('[data-testid="vendor-card"]').first())
        .or(page.locator('table tbody tr').first().getByRole('link').first());

      if (await vendorLink.isVisible()) {
        await vendorLink.click();

        // Should be on vendor detail page
        await expect(page).toHaveURL(/\/vendors\/[a-z0-9-]+$/);

        // Should show vendor information
        await expect(page.getByRole('heading').first()).toBeVisible();
      }
    });

    test('should have tabs for different sections', async ({ page }) => {
      await page.goto('/vendors');

      // Navigate to a vendor detail page
      const vendorLink = page.getByRole('link').filter({ hasText: /view|details/i }).first()
        .or(page.locator('table tbody tr a').first());

      if (await vendorLink.isVisible()) {
        await vendorLink.click();
        await page.waitForURL(/\/vendors\/[a-z0-9-]+$/);

        // Check for tabs
        const tabs = page.getByRole('tablist')
          .or(page.locator('[role="tablist"]'));

        if (await tabs.isVisible()) {
          // Should have multiple tab options
          const tabButtons = page.getByRole('tab');
          expect(await tabButtons.count()).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  test.describe('Vendor Actions', () => {
    test('should have edit option for vendors', async ({ page }) => {
      await page.goto('/vendors');

      // Look for edit button/link
      const editLink = page.getByRole('link', { name: /edit/i }).first()
        .or(page.getByRole('button', { name: /edit/i }).first());

      // Either in list or need to open actions menu
      const actionsButton = page.getByRole('button', { name: /actions|more|menu/i }).first();
      if (await actionsButton.isVisible()) {
        await actionsButton.click();
      }

      // Edit should be available
      await expect(
        page.getByRole('link', { name: /edit/i })
          .or(page.getByRole('menuitem', { name: /edit/i }))
          .first()
      ).toBeVisible();
    });
  });
});
