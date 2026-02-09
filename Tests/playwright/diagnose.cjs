const { chromium } = require('playwright');
(async () => {
  const url = process.env.URL || 'http://localhost:1420/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => logs.push({type: 'pageerror', text: err.message}));
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const overlayText = await page.evaluate(() => {
      const el = document.querySelector('vite-error-overlay') || document.querySelector('.vite-error-overlay');
      return el ? el.innerText.slice(0,2000) : null;
    });
    const rootHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML || null);
    const rootChildren = await page.evaluate(() => Array.from(document.getElementById('root')?.children||[]).map(e => ({tag:e.tagName, class:e.className})).slice(0,40));
    const result = { url, overlayText, rootHTMLSnippet: rootHTML ? rootHTML.slice(0,2000) : null, rootChildren, logs };
    console.log(JSON.stringify(result, null, 2));
    await page.screenshot({ path: 'builds/screenshots/playwright-diagnose.png', fullPage: true });
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch(e) {}
    process.exit(2);
  }
})();
