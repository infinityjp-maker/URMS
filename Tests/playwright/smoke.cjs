const { chromium } = require('playwright');
const fs = require('fs');
const { stabilizePage, CLIP } = require('./stability_helpers.cjs');
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
    // attempt to discover a CDP target, but continue if unavailable (fallback to local launch)
    let res;
    try {
      res = await getTargetWebSocket();
    } catch (e) {
      res = undefined;
    }
    const wsUrl = res && res.ws;
    // if the CDP target exposes a URL, prefer that as our canonical URL
    if (res && res.targetUrl) url = res.targetUrl;
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

    // gather some page metrics for debugging: scroll/client heights and font loading state
    try {
        const pageMetrics = await page.evaluate(() => {
          return {
            scrollHeight: document.body ? document.body.scrollHeight : null,
            clientHeight: document.documentElement ? document.documentElement.clientHeight : (document.body ? document.body.clientHeight : null),
            fontsStatus: (window.document && document.fonts) ? document.fonts.status : 'no-font-api',
            devicePixelRatio: window.devicePixelRatio || 1
          };
        });
      console.error('PAGE_METRICS', JSON.stringify(pageMetrics));
    } catch (e) { console.error('PAGE_METRICS_ERROR', e && e.message); }

    // run centralized stabilization steps (viewport, fonts, DPR, disable animations)
    try { await stabilizePage(page); } catch (e) { }

    // Optional: force platform font if requested (helpful for CI font-diff experiments)
    if (process.env.FORCE_SYSTEM_UI === '1'){
      try {
        await page.evaluate(() => {
          if (document && document.body && document.body.classList) document.body.classList.add('debug-force-system-ui');
        });
        console.error('FORCE_SYSTEM_UI: applied debug-force-system-ui class to body');
      } catch(e) { console.error('FORCE_SYSTEM_UI_ERROR', e && e.message); }
    }

    // log the clip info we will use
    try { console.error('CLIP', JSON.stringify(CLIP)); } catch (e) {}

    // Enforce viewport and fixed document height to avoid variable capture heights
    try {
      if (typeof page.setViewportSize === 'function') {
        try { await page.setViewportSize(VIEWPORT); console.error('VIEWPORT_SET', JSON.stringify(VIEWPORT)); } catch (e) {}
      }
      // force html/body sizes and hide overflow so clip is stable
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
        console.error('FORCED_DOC_SIZE', VIEWPORT.width, VIEWPORT.height);
      } catch (e) {}
    } catch (e) { console.error('ENFORCE_VIEWPORT_ERROR', e && e.message); }

    // take screenshot as buffer so we can inspect PNG header for size
    let buf;
    try {
      // primary: use explicit clip
      buf = await page.screenshot({ clip: CLIP });
      fs.writeFileSync(screenshotPath, buf);
    } catch (e) {
      console.error('SCREENSHOT_CLIP_ERROR', e && e.message);
      // fallback: try fullPage and then rely on CLIP being applied if Playwright supports it
      try {
        buf = await page.screenshot({ fullPage: true });
        fs.writeFileSync(screenshotPath, buf);
        console.error('SCREENSHOT_FALLBACK_FULLPAGE');
      } catch (e2) {
        console.error('SCREENSHOT_ERROR', e2 && e2.message);
      }
    }

    // quick PNG size probe (reads width/height from IHDR)
    try {
      if (buf && buf.length > 24 && buf.slice(0,8).toString('hex') === '89504e470d0a1a0a'){
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        console.error('SCREENSHOT_PNG_SIZE', width, height);
      } else {
        console.error('SCREENSHOT_PNG_SIZE', 'not-png-or-too-small');
      }
      try { const stat = fs.statSync(screenshotPath); console.error('SCREENSHOT_FILE_BYTES', stat.size); } catch(e){}
    } catch (e) { console.error('PNG_PROBE_ERROR', e && e.message); }

    const result = { url, gridInfo, cardCount, headings, titleColor, screenshot: screenshotPath, consoleMessages };
    console.log(JSON.stringify(result, null, 2));
    try { await browser.close(); } catch(e){}
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    process.exit(2);
  }
})();
