const { chromium } = require('playwright');
const fs = require('fs');
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

async function getTargetWebSocket(){
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
  try {
    let url = process.env.URL || 'http://localhost:1420/';
    const preferUrl = process.env.URL || 'http://tauri.localhost/';
    const disableCdp = process.env.DISABLE_CDP && String(process.env.DISABLE_CDP) === '1';
    let res = null;
    let wsUrl = null;
      if (disableCdp) {
        console.error('DISABLE_CDP=1 -> skipping CDP target fetch');
      } else {
      try {
        res = await getTargetWebSocket();
        wsUrl = res && res.ws;
        // if the CDP target exposes a URL, prefer that as our canonical URL
        if (res && res.targetUrl) url = res.targetUrl;
      } catch (e) {
        console.log('CDP target not available, continuing without CDP:', e && e.message);
      }
    }
    let browser;
    let connectedOverCDP = false;
    // connect to http CDP root for WebView2
    if (wsUrl) {
      const httpBase = wsUrl.replace(/^ws:/,'http:').replace(/\/devtools\/page.*$/, '');
      try { browser = await chromium.connectOverCDP(httpBase); connectedOverCDP = true; } catch(e) { browser = undefined; }
    }
    if (!browser) browser = await chromium.launch({ args: ['--no-sandbox'] });

    // find or create a page in the connected browser that matches our URL
    const host = (process.env.URL || url).replace(/https?:\/\//, '');
    const tryPages = () => {
      const pages = [];
      for (const ctx of (browser.contexts() || [])){
        if (typeof ctx.pages === 'function') pages.push(...ctx.pages());
      }
      return pages;
    };
    let pages = tryPages();
    let page = pages.find(p => (p.url()||'').includes(host) || (p.url()||'').includes('tauri.localhost')) || pages[0];
    let context = (browser.contexts() && browser.contexts()[0]) || null;
    const VIEWPORT = { width: 800, height: 1236 };
    const DSF = 1;
    if (!page){
      // Prefer creating a fresh context with fixed viewport when possible (even if browser has existing contexts)
      if (typeof browser.newContext === 'function') context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
      if (context){
        pages = (typeof context.pages === 'function') ? context.pages() : [];
        page = pages[0] || null;
      }
    }

    // If we have a CDP-connected browser and no existing page, create one in that browser and navigate
    if (!page && connectedOverCDP && context && typeof context.newPage === 'function'){
      page = await context.newPage();
      try { await page.goto(process.env.URL || preferUrl, { waitUntil: 'networkidle', timeout: 30000 }); } catch(e) {}
    }

    if (!page){
      // fallback: create a local browser page and navigate
      const local = await chromium.launch({ args: ['--no-sandbox'] });
      const localCtx = await local.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
      page = await localCtx.newPage();
      await page.goto(url, { waitUntil: 'networkidle' , timeout: 30000});
    }

    // If we found/created a page from the WebView/CDP, prefer its URL for checks
    try { const purl = page.url && page.url(); if (purl) url = purl; } catch(e) {}

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

    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));

    // screenshot for visual inspection
    const screenshotPath = 'builds/screenshots/playwright-smoke.png';
    try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch (e) {}
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const result = { url, gridInfo, cardCount, headings, titleColor, screenshot: screenshotPath, consoleMessages };
    console.log(JSON.stringify(result, null, 2));
    try { await browser.close(); } catch(e){}
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    process.exit(2);
  }
})();
