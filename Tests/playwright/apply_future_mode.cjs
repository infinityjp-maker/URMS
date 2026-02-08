const { chromium } = require('playwright');
const http = require('http');
function fetchJson(url){
  return new Promise((resolve,reject)=>{
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try{ resolve(JSON.parse(d)); }catch(e){ reject(e); }
      });
    }).on('error', reject);
  });
}

async function getTargetWebSocket() {
  const listUrl = process.env.CDP || 'http://127.0.0.1:9222/json/list';
  const prefer = process.env.URL || 'http://tauri.localhost/';
  const items = await fetchJson(listUrl);
  if (!Array.isArray(items) || items.length === 0) throw new Error('no cdp targets');
  let found = items.find(i => (i.url||'').includes(prefer)) || items[0];
  return found.webSocketDebuggerUrl || found.webSocketUrl || null;
}

(async () => {
  console.log('DEBUG_ENV', { URL: process.env.URL, CDP: process.env.CDP });
  try{
    const wsUrl = await getTargetWebSocket();
    if (!wsUrl) throw new Error('webSocketDebuggerUrl not found');
    // try connecting with ws url first, fall back to http endpoint
    let browser;
    // prefer connecting to the http CDP root (works more reliably for WebView2)
    const httpBase = wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/page.*$/, '');
    browser = await chromium.connectOverCDP(httpBase);

    const host = (process.env.URL || 'http://tauri.localhost/').replace(/https?:\/\//, '');
    const tryPages = () => {
      const pages = [];
      for (const ctx of (browser.contexts() || [])){
        if (typeof ctx.pages === 'function') pages.push(...ctx.pages());
      }
      return pages;
    };

    let pages = tryPages();
    let page = pages[0];
    if (pages.length > 0){
      page = pages.find(p => (p.url()||'').includes(host) || (p.url()||'').includes('tauri.localhost')) || pages[0];
    }

    let context = (browser.contexts() && browser.contexts()[0]) || null;
    if (!page) {
      if (!context && typeof browser.newContext === 'function') context = await browser.newContext();
      if (context){
        pages = (typeof context.pages === 'function') ? context.pages() : [];
        page = pages[0] || (typeof context.newPage === 'function' ? await context.newPage() : null);
      }
    }

    if (!page) {
      // last resort: launch a local browser
      try{
        const local = await chromium.launch({ args: ['--no-sandbox'] });
        const localPage = await local.newPage();
        await localPage.goto(process.env.URL || 'http://localhost:1420/', { waitUntil: 'networkidle' });
        page = localPage;
      }catch(e){
        throw new Error('could not obtain page to operate on: ' + e.message);
      }
    }

    // ensure theme applied: set localStorage then reload
    try{
      await page.evaluate(() => { localStorage.setItem('urms-theme','future'); });
    }catch(e){}
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const outPath = 'builds/screenshots/playwright-future-mode.png';
    try { require('fs').mkdirSync('builds/screenshots', { recursive: true }); } catch(e){}
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(JSON.stringify({ url: page.url(), applied: 'theme-future', screenshot: outPath }));
    try{ await browser.close(); }catch(e){}
    process.exit(0);
  }catch(e){ console.error('ERROR', e && e.message || e); process.exit(1); }
})();
