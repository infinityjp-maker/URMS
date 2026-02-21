const { chromium } = require('playwright');
const fs = require('fs');
const { CLIP, stabilizePage } = require('./stability_helpers.cjs');

(async () => {
  const url = process.env.URL || 'http://localhost:5173/';
  const out = 'builds/screenshots/playwright-future-mode.png';
  try {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: CLIP.width, height: CLIP.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
    // set future theme then reload
    try { await page.evaluate(() => localStorage.setItem('urms-theme','future')); } catch(e) {}
    await page.reload({ waitUntil: 'networkidle' }).catch(()=>{});
    await page.waitForTimeout(800);
    try { await stabilizePage(page); } catch (e) {}
    fs.mkdirSync('builds/screenshots', { recursive: true });
    if (process.env.ENFORCE_CLIP === '1' && CLIP) {
      await page.screenshot({ path: out, clip: CLIP });
    } else {
      await page.screenshot({ path: out, fullPage: true });
    }
    console.log(JSON.stringify({ url: page.url(), applied: 'theme-future', screenshot: out }));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    process.exit(2);
  }
})();
