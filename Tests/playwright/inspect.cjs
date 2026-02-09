const { chromium } = require('playwright');
(async () => {
  const url = process.env.URL || 'http://localhost:1420/';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    const bodyStart = await page.evaluate(() => document.body.innerHTML.slice(0, 2000));
    const topElements = await page.evaluate(() => Array.from(document.body.children).map(el => ({ tag: el.tagName, class: el.className, id: el.id })).slice(0, 40));
    const meta = await page.evaluate(() => ({ pathname: location.pathname, href: location.href }));
    console.log(JSON.stringify({ url, title, meta, topElements, bodyStart }, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    try { await browser.close(); } catch(e) {}
    process.exit(2);
  }
})();
