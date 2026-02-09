const { chromium } = require('playwright');
const { CLIP } = require('./stability_helpers.cjs');
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
  try {
    const items = await fetchJson(listUrl);
    if (!Array.isArray(items) || items.length === 0) return null;
    let found = null;
    if (prefer) found = items.find(i => (i.url||'').includes(prefer));
    if (!found) found = items[0];
    return { ws: (found.webSocketDebuggerUrl || found.webSocketUrl || null), targetUrl: (found.url || null) };
  } catch (err) {
    // If CDP list fetch fails (ECONNREFUSED, network issue, etc.), return null
    // so caller can fall back to launching a local Playwright Chromium.
    return null;
  }
}

(async () => {
  console.log('DEBUG_ENV', { URL: process.env.URL, CDP: process.env.CDP });
    try{
    const res = await getTargetWebSocket();
    const wsUrl = res && res.ws;
    if (res && res.targetUrl) process.env.URL = res.targetUrl;
    let browser = null;
    if (wsUrl) {
      // try connecting to CDP; if it fails, we'll fall back to launching local chromium
      try {
        const httpBase = wsUrl.replace(/^ws:/, 'http:').replace(/\/devtools\/page.*$/, '');
        browser = await chromium.connectOverCDP(httpBase);
      } catch (e) {
        console.warn('CDP connect failed, falling back to local chromium:', e && e.message || e);
        browser = null;
      }
    }
    // If we couldn't obtain a CDP-connected browser, launch a local Playwright chromium
    if (!browser) {
      try {
        browser = await chromium.launch({ args: ['--no-sandbox'] });
      } catch (e) {
        throw new Error('could not obtain browser (CDP failed and local launch failed): ' + (e && e.message || e));
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
          const local = await chromium.launch({ args: ['--no-sandbox'] });
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
    // enforce fixed viewport and document height so CI captures are stable
    try{
      if (typeof page.setViewportSize === 'function'){
        await page.setViewportSize(VIEWPORT || { width: 800, height: 1236 });
      }
      try {
        await page.evaluate((w,h) => {
          try {
            document.documentElement.style.width = w + 'px';
            document.documentElement.style.height = h + 'px';
            document.body.style.width = w + 'px';
            document.body.style.height = h + 'px';
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
          } catch(e){}
        }, VIEWPORT.width, VIEWPORT.height);
      } catch (e) {}
    }catch(e){}
    // use explicit clip to guarantee output dimensions
    try {
      await page.screenshot({ path: outPath, clip: CLIP });
    } catch (e) {
      await page.screenshot({ path: outPath, fullPage: false });
    }
    console.log(JSON.stringify({ url: page.url(), applied: 'theme-future', screenshot: outPath }));
    try{ await browser.close(); }catch(e){}
    process.exit(0);
  }catch(e){ console.error('ERROR', e && e.message || e); process.exit(1); }
})();
