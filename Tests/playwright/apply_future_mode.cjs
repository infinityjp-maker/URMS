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
  const prefer = process.env.URL || null;
  const items = await fetchJson(listUrl);
  if (!Array.isArray(items) || items.length === 0) throw new Error('no cdp targets');
  let found = null;
  if (prefer) found = items.find(i => (i.url||'').includes(prefer));
  if (!found) found = items[0];
  return { ws: (found.webSocketDebuggerUrl || found.webSocketUrl || null), targetUrl: (found.url || null) };
}

(async () => {
  console.log('DEBUG_ENV', { URL: process.env.URL, CDP: process.env.CDP });
  // Small delay to allow CDP port to become available after launcher starts
  await new Promise((r) => setTimeout(r, 1000));
  try{
    // Attempt to obtain a CDP target and connect with retries (exponential backoff)
    const maxAttempts = parseInt(process.env.CDP_CONNECT_ATTEMPTS || '8', 10);
    let browser = null;
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++){
      try{
        const res = await getTargetWebSocket();
        const wsUrl = res && res.ws;
        if (!wsUrl) throw new Error('webSocketDebuggerUrl not found');
        if (res && res.targetUrl) process.env.URL = res.targetUrl;
        // prefer connecting to the http CDP root (works more reliably for WebView2)
        const httpBase = wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/page.*$/, '');
        browser = await chromium.connectOverCDP(httpBase);
        lastErr = null;
        break;
      }catch(err){
        lastErr = err;
        const backoff = Math.min(30000, 500 * Math.pow(2, attempt-1));
        console.warn(`connect attempt ${attempt} failed: ${err && err.message || err}; retrying after ${backoff}ms`);
        if (attempt === maxAttempts) break;
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    if (!browser){
      // If we couldn't connect over CDP after retries, fall back to launching a local chromium instance.
      console.warn('CDP connect failed after retries; attempting local chromium.launch() fallback');
      try{
        browser = await chromium.launch({ args: ['--no-sandbox', '--remote-debugging-port=9222'] });
      }catch(err){
        if (lastErr) throw lastErr; else throw err;
      }
    }

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

    const VIEWPORT = { width: 800, height: 1236 };
    const DSF = 1;
    let context = (browser.contexts() && browser.contexts()[0]) || null;
    if (!page) {
      if (!context && typeof browser.newContext === 'function') context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
      if (context){
        pages = (typeof context.pages === 'function') ? context.pages() : [];
        page = pages[0] || (typeof context.newPage === 'function' ? await context.newPage() : null);
      }
    }

    if (!page) {
      // Prefer creating a fresh context with fixed viewport in the connected browser
      try{
        if (typeof browser.newContext === 'function'){
          const forcedCtx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
          page = await forcedCtx.newPage();
          try { await page.goto(process.env.URL || 'http://localhost:1420/', { waitUntil: 'networkidle' }); } catch(e){}
        }
      }catch(e){ }
      if (!page){
        // last resort: launch a local browser and create a fixed-size context
          try{
          const local = await chromium.launch({ args: ['--no-sandbox', '--remote-debugging-port=9222'] });
          const localCtx = await local.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
          const localPage = await localCtx.newPage();
          await localPage.goto(process.env.URL || 'http://localhost:1420/', { waitUntil: 'networkidle' });
          page = localPage;
        }catch(e){
          throw new Error('could not obtain page to operate on: ' + e.message);
        }
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
    // ensure we capture the full document height in contexts where fullPage may be constrained
    try{
      const scrollHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight || 0, document.body.scrollHeight || 0));
      if (scrollHeight && typeof page.setViewportSize === 'function'){
        await page.setViewportSize({ width: 800, height: Math.max(600, scrollHeight) });
      }
    }catch(e){}
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(JSON.stringify({ url: page.url(), applied: 'theme-future', screenshot: outPath }));
    try{ await browser.close(); }catch(e){}
    process.exit(0);
  }catch(e){ console.error('ERROR', e && e.message || e); process.exit(1); }
})();
