const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem('urms-theme', 'future'); } catch(e) {}
  });
  await page.goto('http://localhost:1420/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const outPath = 'builds/screenshots/playwright-future-mode.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(JSON.stringify({ url: page.url(), applied: 'theme-future', screenshot: outPath }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
