import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://infinityjp-maker.github.io/URMS';

test.describe('Triage Dashboard E2E', () => {
  test('dashboard loads and basic features work', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1) Load index.html
    const resp = await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
    expect(resp).not.toBeNull();
    expect(resp!.status()).toBeLessThan(400);

    // 2) Fetch index.json and validate shape
    const idxResp = await page.request.get(`${BASE_URL}/reports/index.json`);
    expect(idxResp.ok()).toBeTruthy();
    const indexJson = await idxResp.json().catch(() => null);
    expect(indexJson).not.toBeNull();
    expect(indexJson).toHaveProperty('generatedAt');
    expect(indexJson).toHaveProperty('history');
    expect(Array.isArray(indexJson.history)).toBeTruthy();

    // 3) Verify links to latest summary / diff / llm summary exist on the page
    const summaryLink = page.locator('a[href*="reports/latest"], a[href*="latest.md"], a:has-text("Latest")').first();
    await expect(summaryLink).toBeVisible({ timeout: 5000 });

    const diffLink = page.locator('a[href*="diffs/"], a:has-text("diff")').first();
    await expect(diffLink).toBeVisible({ timeout: 5000 });

    const llmLink = page.locator('a[href*="llm"], button:has-text("LLM"), text=LLM').first();
    await expect(llmLink).toBeVisible({ timeout: 5000 });

    // 4) Toggle LLM summary if toggle exists
    const llmToggle = page.locator('[data-llm-toggle], .llm-toggle, button:has-text("LLM summary"), button:has-text("LLM")').first();
    if (await llmToggle.count() > 0) {
      await llmToggle.click();
      // after clicking, look for an element that contains llm result text
      const llmContent = page.locator('.llm-content, [data-llm-content], .llm-summary').first();
      await expect(llmContent).toBeVisible({ timeout: 5000 });
      // toggle back if possible
      try { await llmToggle.click(); } catch (e) { /* ignore */ }
    } else {
      throw new Error('LLM toggle not found on dashboard');
    }

    // 5) Open a diff viewer by clicking the diff link and ensure it renders
    await diffLink.click();
    // wait a short while for viewer to initialize
    await page.waitForTimeout(1500);
    const diffViewer = page.locator('#diff-viewer, .diff-viewer, [data-diff-viewer]').first();
    await expect(diffViewer).toBeVisible({ timeout: 5000 });

    // 6) Ensure no console errors were emitted during the scenario
    expect(consoleErrors.length).toBe(0);
  });
});
