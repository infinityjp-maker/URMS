const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');

async function fetchJson(url, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('timeout')) });
  });
}

(async () => {
  const cdpUrl = 'http://127.0.0.1:9222/json/list';
  try {
    const list = await fetchJson(cdpUrl, 5000);
    if (!Array.isArray(list) || list.length === 0) {
      console.error('No inspectable targets found at', cdpUrl);
      process.exit(2);
    }
    // pick the first target that looks like our app
    const target = list.find(t => t.url && (t.url.includes('index.html') || t.title && t.title.includes('URMS'))) || list[0];
    const webSocketDebuggerUrl = target.webSocketDebuggerUrl || target.webSocketUrl || null;
    if (!webSocketDebuggerUrl) {
      console.error('No WebSocket debugger URL for target', target);
      process.exit(2);
    }

    // Connect to the browser-level CDP endpoint (not the page-level WS URL)
    const versionInfo = await fetchJson('http://127.0.0.1:9222/json/version', 2000).catch(()=>null);
    const browserEndpoint = (versionInfo && versionInfo.webSocketDebuggerUrl) ? versionInfo.webSocketDebuggerUrl.replace('/devtools/browser/', '/devtools/browser/') : 'http://127.0.0.1:9222';
    const browser = await chromium.connectOverCDP(browserEndpoint);
    const contexts = browser.contexts();
    let page = null;
    // Try to find an existing page that matches our target URL
    for (const ctx of contexts) {
      const pages = ctx.pages();
      for (const p of pages) {
        try {
          const href = await p.evaluate(() => location.href);
          if (href && (href.includes('index.html') || href.includes('tauri.localhost') || href.includes('localhost') || href.includes('tauri'))) {
            page = p;
            break;
          }
        } catch (e) {}
      }
      if (page) break;
    }
    // If we didn't find an existing page, create one and navigate to the target URL
    if (!page) {
      if (contexts.length) {
        page = contexts[0].pages()[0] || await contexts[0].newPage();
      } else {
        const ctx = await browser.newContext();
        page = await ctx.newPage();
        try { await page.goto(target.url, { waitUntil: 'load', timeout: 5000 }); } catch (e) {}
      }
    }

    // Inject runtime error/console capture early in the page so we can see module load failures
    try {
      await page.evaluate(() => {
        try {
          window.__PLAYWRIGHT_ERRORS = window.__PLAYWRIGHT_ERRORS || [];
          window.__PLAYWRIGHT_CONSOLE = window.__PLAYWRIGHT_CONSOLE || [];
          const pushError = function(type, payload) {
            try { window.__PLAYWRIGHT_ERRORS.push({ type: type, payload: payload && (payload.stack || payload.message || String(payload)) }); } catch(e){}
          };
          window.addEventListener('error', function(ev){ try { pushError('error', { message: ev && ev.message, filename: ev && ev.filename, lineno: ev && ev.lineno, colno: ev && ev.colno, error: ev && ev.error && (ev.error.stack || ev.error.message) }); } catch(e){} });
          window.addEventListener('unhandledrejection', function(ev){ try { pushError('unhandledrejection', ev && (ev.reason && (ev.reason.stack || ev.reason.message) || String(ev.reason))); } catch(e){} });
          ['error','warn','info','log','debug'].forEach(function(lvl) {
            try {
              const orig = console[lvl];
              console[lvl] = function() {
                const args = Array.prototype.slice.call(arguments);
                try { window.__PLAYWRIGHT_CONSOLE.push({ level: lvl, args: args.map(function(a){ try { return typeof a === 'string' ? a : JSON.stringify(a); } catch(e){ return String(a); } }) }); } catch(e){}
                if (typeof orig === 'function') try { orig.apply(console, args); } catch(e){}
              };
            } catch(e){}
          });
        } catch(e) {}
      });
    } catch(e) {}

    // Collect console and pageerror messages
    const consoleMessages = [];
    const pageErrors = [];
    page.on && page.on('console', m => consoleMessages.push({ type: m.type(), text: m.text() }));
    page.on && page.on('pageerror', e => pageErrors.push(String(e)));

    // Wait for the ready flag emitted by the app (window.__URMS_READY)
    const waitTimeout = 30000; // ms
    const pollInterval = 500; // ms
    let waited = 0;
    let readyFlag = null;
    while (waited < waitTimeout) {
      try {
        readyFlag = await page.evaluate(() => {
          try { return (window && (window.__URMS_READY !== undefined)) ? window.__URMS_READY : null; } catch (e) { return null; }
        }).catch(()=>null);
      } catch (e) { readyFlag = null; }
      if (readyFlag === true) break;
      await page.waitForTimeout(pollInterval);
      waited += pollInterval;
    }

    // After ready, give the app a moment to render the dashboard
    if (readyFlag === true) {
      await page.waitForTimeout(500);
    }

    // Wait for React to mount into #root (children present) before checking cards
    const rootWaitMax = 20000;
    const rootPoll = 400;
    let rootWaited = 0;
    let rootHasChildren = false;
    try {
      rootHasChildren = await page.evaluate(() => {
        try { const r = document.getElementById('root'); return !!(r && r.children && r.children.length > 0); } catch(e) { return false; }
      }).catch(()=>false);
    } catch(e) { rootHasChildren = false; }
    while (!rootHasChildren && rootWaited < rootWaitMax) {
      await page.waitForTimeout(rootPoll);
      rootWaited += rootPoll;
      try {
        rootHasChildren = await page.evaluate(() => {
          try { const r = document.getElementById('root'); return !!(r && r.children && r.children.length > 0); } catch(e) { return false; }
        }).catch(()=>false);
      } catch(e) { rootHasChildren = false; }
      // take an interim screenshot to help debugging if it pops in later
      if (rootHasChildren) {
        try { await page.screenshot({ path: `builds/screenshots/playwright-webview-root-${Date.now()}.png`, fullPage: true }).catch(()=>{}); } catch(e) {}
      }
    }

    // Try to find the dashboard grid (longer timeout after ready)
    await page.waitForSelector('.dashboard-grid', { timeout: 15000 }).catch(()=>null);

    // Extra retry loop for delayed card rendering
    let cardsFound = 0;
    const maxRetryMs = 20000;
    const retryInterval = 500;
    let waitedMs = 0;
    while (waitedMs < maxRetryMs) {
      try {
        cardsFound = await page.evaluate(() => document.querySelectorAll('.floating-card').length).catch(()=>0);
      } catch (e) { cardsFound = 0; }
      if (cardsFound > 0) break;
      await page.waitForTimeout(retryInterval);
      waitedMs += retryInterval;
    }

    // Gather multiple fallbacks for metrics after retry
    const gridInfo = await page.evaluate(() => {
      const g = document.querySelector('.dashboard-grid');
      return g ? { exists: true, display: getComputedStyle(g).display } : { exists: false };
    }).catch(e=>({exists:false,error:String(e)}));

    const cardCount = cardsFound || await page.evaluate(() => document.querySelectorAll('.floating-card').length).catch(()=>0);
    const headings = await page.evaluate(() => Array.from(document.querySelectorAll('.floating-card h3')).map(h=>h.textContent.trim())).catch(()=>[]);

    // Save artifacts
    fs.mkdirSync('builds/screenshots', { recursive: true });
    fs.mkdirSync('builds/playwright', { recursive: true });
    const shotPath = 'builds/screenshots/playwright-webview.png';
    await page.screenshot({ path: shotPath, fullPage: true }).catch(()=>{});
    // Save DOM snapshot
    const domHtml = await page.evaluate(() => document.documentElement.outerHTML).catch(()=>null);
    if (domHtml) fs.writeFileSync('builds/playwright/playwright-webview.html', domHtml, 'utf8');

    // Ensure readyFlag value is captured (may have been set during wait loop)
    if (readyFlag === null) {
      try { readyFlag = await page.evaluate(() => (window && (window.__URMS_READY !== undefined)) ? window.__URMS_READY : null).catch(()=>null); } catch(e) { readyFlag = null; }
    }
    // Additional diagnostics: document.readyState, loaded scripts, tauri bridge, navigator, fully-ready flag
    const diagnostics = await page.evaluate(() => {
      try {
        const scripts = Array.from(document.querySelectorAll('script')).map(s=>({src: s.getAttribute('src'), type: s.getAttribute('type')}));
        const readyState = document.readyState;
        const tauriPresent = !!(window && ((window.__TAURI__) || (window.invoke) || (window.__TAURI__ && typeof window.__TAURI__.invoke === 'function')));
        const fullyReady = (window && (window.__URMS_DASHBOARD_FULLY_READY !== undefined)) ? window.__URMS_DASHBOARD_FULLY_READY : null;
        const online = typeof navigator !== 'undefined' ? navigator.onLine : null;
        const rootChildren = (function(){ try { const r = document.getElementById('root'); return r ? (r.children? r.children.length : null) : null; } catch(e){ return null;} })();
        const pwErrors = (window && window.__PLAYWRIGHT_ERRORS) ? window.__PLAYWRIGHT_ERRORS.slice(0,50) : [];
        const pwConsole = (window && window.__PLAYWRIGHT_CONSOLE) ? window.__PLAYWRIGHT_CONSOLE.slice(0,200) : [];
        return { readyState, scripts, tauriPresent, fullyReady, online, rootChildren, pwErrors, pwConsole };
      } catch (e) { return { error: String(e) }; }
    }).catch(()=>({}));

    const ok = !!(gridInfo && gridInfo.exists && cardCount > 0 && headings && headings.length > 0);
    const out = { target, readyFlag, ok, diagnostics, gridInfo, cardCount, headings, screenshot: shotPath, console: consoleMessages, pageErrors };
    fs.writeFileSync('builds/playwright/playwright-webview.json', JSON.stringify(out, null, 2), 'utf8');
    console.log(JSON.stringify(out, null, 2));
    try { await browser.close(); } catch (e) {}
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err && err.message || err);
    process.exit(2);
  }
})();
