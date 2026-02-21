const { chromium } = require('playwright');
const fs = require('fs');
const { CLIP } = require('./stability_helpers.cjs');
(async () => {
  const url = 'http://localhost:1420/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    // wait for dashboard grid
    await page.waitForSelector('.dashboard-grid', { timeout: 8000 });

    const cardCount = await page.$$eval('.floating-card', els => els.length);
    const headings = await page.$$eval('.floating-card h3', els => els.map(h => h.textContent.trim()));

    const expected = ['システム', 'ネットワーク', 'ログ'];
    const missing = expected.filter(h => !headings.includes(h));

    const screenshotPath = 'builds/screenshots/playwright-assert-dev.png';
    const jsonPath = 'builds/screenshots/playwright-assert-dev.json';
    fs.mkdirSync('builds/screenshots', { recursive: true });
    if (process.env.ENFORCE_CLIP === '1' && CLIP) {
      await page.screenshot({ path: screenshotPath, clip: CLIP });
    } else {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    const result = {
      url,
      ok: missing.length === 0 && cardCount > 0,
      cardCount,
      headings,
      missing,
      screenshot: screenshotPath
    };

    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));

    await browser.close();
    process.exit(result.ok ? 0 : 2);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
