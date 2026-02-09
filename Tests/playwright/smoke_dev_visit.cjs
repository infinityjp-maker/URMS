const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = 'http://127.0.0.1:5173/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  // create a context with fixed viewport and DSF for deterministic rendering
  const context = await browser.newContext({ viewport: { width: 800, height: 1236 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleEvents = [];
  page.on('console', msg => consoleEvents.push({ type: msg.type(), text: msg.text() }));
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message || String(err)));
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // wait for client mount and async loads
    await page.waitForTimeout(2500);
    // wait for fonts to be ready to avoid font-substitution diffs
    try { await page.evaluate(() => document.fonts.ready); } catch (e) { }
    // disable animations/transitions which cause transient differences
    try { await page.addStyleTag({ content: `* { transition: none !important; animation: none !important; caret-color: transparent !important; }` }); } catch (e) { }
    // normalize viewport to baseline size to minimize diff due to viewport width/height
    try { await page.setViewportSize({ width: 800, height: 1236 }); } catch (e) { }

    const checks = await page.evaluate(() => {
      const bodyStyle = getComputedStyle(document.body);
      const hasCard = !!document.querySelector('.card') || !!document.querySelector('.floating-card');
      const hasButton = !!document.querySelector('button') || !!document.querySelector('.button-primary');
      const titleEls = Array.from(document.querySelectorAll('.card-title, .floating-card h3')).map(e => e.textContent.trim()).slice(0,10);
      const card = document.querySelector('.card') || document.querySelector('.floating-card');
      const cardStyle = card ? getComputedStyle(card) : null;
      return {
        bodyBg: bodyStyle.background || bodyStyle.backgroundColor,
        fontFamily: bodyStyle.fontFamily,
        hasCard,
        hasButton,
        titleEls,
        cardPadding: cardStyle ? cardStyle.padding : null,
        cardBoxShadow: cardStyle ? cardStyle.boxShadow : null
      };
    });

    fs.mkdirSync('builds/screenshots', { recursive: true });
    await page.screenshot({ path: 'builds/screenshots/playwright-dev.png', fullPage: true });

    const result = { url, checks, consoleEvents, pageErrors };
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
