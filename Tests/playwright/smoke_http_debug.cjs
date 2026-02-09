const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = 'http://localhost:5173/index.html';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const consoleEvents = [];
  page.on('console', msg => {
    consoleEvents.push({type: msg.type(), text: msg.text()});
  });
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message || String(err));
  });
  try {
    await page.goto(url, { waitUntil: 'load' , timeout: 30000});
    await page.waitForTimeout(3000);
    const gridInfo = await page.evaluate(() => {
      const g = document.querySelector('.dashboard-grid');
      return g ? { exists: true, display: getComputedStyle(g).display } : { exists: false };
    });
    const result = { url, gridInfo, consoleEvents, pageErrors };
    fs.mkdirSync('builds/screenshots', { recursive: true });
    const dbgShot = 'builds/screenshots/playwright-smoke-http-debug.png';
    if (process.env.ENFORCE_CLIP === '1' && require('./stability_helpers.cjs').CLIP) {
      await page.screenshot({ path: dbgShot, clip: require('./stability_helpers.cjs').CLIP });
    } else {
      await page.screenshot({ path: dbgShot, fullPage: true });
    }
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
