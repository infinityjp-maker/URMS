const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = 'http://localhost:1420/';
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
    const cardCount = await page.evaluate(() => document.querySelectorAll('.floating-card').length);
    const headings = await page.evaluate(() => Array.from(document.querySelectorAll('.floating-card h3')).map(h=>h.textContent.trim()));
    const result = { url, gridInfo, cardCount, headings, consoleEvents, pageErrors };
    fs.mkdirSync('builds/screenshots', { recursive: true });
    await page.screenshot({ path: 'builds/screenshots/playwright-smoke-dev.png', fullPage: true });
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
