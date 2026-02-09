const { chromium } = require('playwright');
const { CLIP } = require('./stability_helpers.cjs');
(async () => {
  const url = process.env.URL || 'http://localhost:1420/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('requestfailed', req => errors.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText }));
  page.on('response', async res => {
    if (res.status() >= 400) {
      errors.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
    }
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(JSON.stringify({ url, errors }, null, 2));
    const netShot = 'builds/screenshots/playwright-network.png';
    if (process.env.ENFORCE_CLIP === '1' && CLIP) {
      await page.screenshot({ path: netShot, clip: CLIP });
    } else {
      await page.screenshot({ path: netShot, fullPage: true });
    }
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch(e) {}
    process.exit(2);
  }
})();
