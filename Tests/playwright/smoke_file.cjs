const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = 'file:///D:/GitHub/URMS/dist/index.html';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'load' , timeout: 30000});
    const gridInfo = await page.evaluate(() => {
      const g = document.querySelector('.dashboard-grid');
      return g ? { exists: true, display: getComputedStyle(g).display } : { exists: false };
    });
    const cardCount = await page.evaluate(() => document.querySelectorAll('.floating-card').length);
    const headings = await page.evaluate(() => Array.from(document.querySelectorAll('.floating-card')).map(e=> (e.querySelector('h3')?.textContent||'').slice(0,60)));
    const titleColor = await page.evaluate(() => {
      const t = document.querySelector('.dashboard-title');
      return t ? getComputedStyle(t).color : null;
    });
    const screenshotPath = 'builds/screenshots/playwright-smoke-dist.png';
    try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch (e) {}
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const result = { url, gridInfo, cardCount, headings, titleColor, screenshot: screenshotPath };
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
