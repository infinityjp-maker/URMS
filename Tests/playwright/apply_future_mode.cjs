const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const url = process.env.URL || 'http://localhost:1420/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    // ensure localStorage is set before any script runs
    await page.addInitScript(() => {
      try { localStorage.setItem('urms-theme', 'future'); } catch(e) {}
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // wait a moment for theme to apply
    await page.waitForTimeout(400);

    const themeClasses = await page.evaluate(() => Array.from(document.body.classList));
    const applied = themeClasses.join(' ');

    try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch (e) {}
    const shot = 'builds/screenshots/playwright-future-mode.png';
    await page.screenshot({ path: shot, fullPage: true });

    console.log(JSON.stringify({ url, applied, screenshot: shot }, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
