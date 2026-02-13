const { chromium } = require('playwright');
const fs = require('fs');
const { PNG } = require('pngjs');
const { stabilizePage, CLIP } = require('./stability_helpers.cjs');

// Wait for document body height to stabilize between checks
async function waitForStableHeight(page, duration = 500) {
  try {
    const last = await page.evaluate(() => document.body ? document.body.scrollHeight : null);
    await page.waitForTimeout(duration);
    const next = await page.evaluate(() => document.body ? document.body.scrollHeight : null);
    if (last !== next) {
      await page.waitForTimeout(duration);
    }
  } catch (e) {
    // ignore errors to avoid breaking the smoke flow
  }
}
const http = require('http');

function fetchJson(url, timeoutMs = 5000){
  return new Promise((resolve,reject)=>{
    const req = http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try{ resolve(JSON.parse(d)); }catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.abort();
      reject(new Error('fetchJson timeout'));
    });
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
    const disableCdp = process.env.DISABLE_CDP === '1';
    if (!disableCdp) {
      // retry CDP discovery multiple times to tolerate transient CI timing issues
      res = undefined;
      for (let attempt = 1; attempt <= 12; attempt++) {
        try {
          try { console.error('CDP_DISCOVERY_ATTEMPT', attempt, 'url=', process.env.CDP || 'http://127.0.0.1:9222/json/list'); } catch(e){}
          // use a slightly larger timeout for the list fetch
          res = await getTargetWebSocket();
          if (res) break;
        } catch (e) {
          try { console.error('CDP_DISCOVERY_FAILED', attempt, e && (e.message || e)); } catch(ex){}
        }
        // backoff (increasing)
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
      if (!res) {
        try { console.error('CDP_DISCOVERY_GAVE_UP'); } catch(e){}
      }
    } else {
      res = undefined;
      console.error('DISABLE_CDP=1, skipping CDP discovery');
    }
    const wsUrl = res && res.ws;
    // if the CDP target exposes a URL, prefer that as our canonical URL
    if (res && res.targetUrl) url = res.targetUrl;
    let browser;
    let connectedOverCDP = false;
    // connect to http CDP root for WebView2
    if (wsUrl) {
      const httpBase = wsUrl.replace(/^ws:/,'http:').replace(/\/devtools\/page.*$/, '');
      // attempt multiple connects to tolerate transient CDP start races
      for (let ctry = 1; ctry <= 8; ctry++) {
        try {
          try { console.error('CDP_CONNECT_ATTEMPT', ctry, httpBase); } catch(e){}
          browser = await chromium.connectOverCDP(httpBase);
          connectedOverCDP = true;
          break;
        } catch (e) {
          try { console.error('CDP_CONNECT_ERROR', ctry, e && (e.message || e)); } catch(ex){}
          browser = undefined;
          await new Promise(r => setTimeout(r, 1000 * ctry));
        }
      }
      if (!browser) try { console.error('CDP_CONNECT_GAVE_UP'); } catch(e){}
    }
    if (!browser) {
      try {
        browser = await chromium.launch({ args: ['--no-sandbox'] });
      } catch (e) {
        try { console.error('BROWSER_LAUNCH_ERROR', e && (e.message || e)); } catch(ex){}
        try { console.error('BROWSER_LAUNCH_STACK', (e && e.stack || '').slice(0,2000)); } catch(ex){}
        throw e;
      }
    }

    // find or create a page in the connected browser that matches our URL
    // Prefer creating a fresh context with a fixed viewport/deviceScaleFactor
    const VIEWPORT = { width: CLIP.width, height: CLIP.height };
    const DSF = 1;
    let context = null;
    let page = null;
    try {
      if (typeof browser.newContext === 'function') {
        context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF });
        if (context && typeof context.newPage === 'function') {
          page = await context.newPage();
          try { await page.goto(process.env.URL || preferUrl, { waitUntil: 'networkidle', timeout: 30000 }); } catch(e){}
        }
      }
    } catch(e) {
      console.error('NEW_CONTEXT_ERROR', e && (e.message || e));
      context = null;
      page = null;
    }
    // fallback: try to reuse existing pages if we couldn't create a fresh context/page
    if (!page) {
      const host = (process.env.URL || url).replace(/https?:\/\//, '');
      const tryPages = () => {
        const pages = [];
        for (const ctx of (browser.contexts() || [])){
          if (typeof ctx.pages === 'function') pages.push(...ctx.pages());
        }
        return pages;
      };
      let pages = tryPages();
      page = pages.find(p => (p.url()||'').includes(host) || (p.url()||'').includes('tauri.localhost')) || pages[0] || null;
      context = (browser.contexts() && browser.contexts()[0]) || context;
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
    const pageErrors = [];
    const internalErrors = [];
    page.on('console', msg => {
      try { consoleMessages.push({ type: msg.type(), text: msg.text(), location: msg.location ? msg.location() : null, ts: Date.now() }); } catch(e) { try { internalErrors.push(String(e && (e.message||e))); } catch(_){} }
    });
    page.on('pageerror', err => { try { pageErrors.push({ message: String(err && (err.message || err)), stack: (err && err.stack) ? String(err.stack).slice(0,2000) : null, ts: Date.now() }); } catch(e){ try{ internalErrors.push(String(e && (e.message||e))); }catch(_){} } );

    // screenshot for visual inspection
    const screenshotPath = 'builds/screenshots/playwright-smoke.png';
    try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch (e) { try{ internalErrors.push(String(e && (e.message||e))); }catch(_){} }

    // ensure page is fully loaded and fonts are ready before metrics/screenshot
    try {
      try { await page.waitForLoadState('domcontentloaded', { timeout: 5000 }); } catch (e) { try{ internalErrors.push('waitForLoadState(domcontentloaded): '+String(e && (e.message||e))); }catch(_){} }
      try { await page.waitForLoadState('load', { timeout: 5000 }); } catch (e) { try{ internalErrors.push('waitForLoadState(load): '+String(e && (e.message||e))); }catch(_){} }
      // retry networkidle a few times to increase stability
      for (let ni = 0; ni < 3; ni++) {
        try { await page.waitForLoadState('networkidle', { timeout: 2000 }); break; } catch (e) { try{ internalErrors.push('waitForLoadState(networkidle) attempt '+ni+': '+String(e && (e.message||e))); }catch(_){} await page.waitForTimeout(500); }
      try { await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()); } catch (e) { try{ internalErrors.push('fonts.ready: '+String(e && (e.message||e))); }catch(_){} }
      // small pause to let rendering settle
      try { await page.waitForTimeout(200); } catch (e) { try{ internalErrors.push('waitForTimeout(200): '+String(e && (e.message||e))); }catch(_){} }
      const pageMetrics = await page.evaluate(() => {
        return {
          scrollHeight: document.body ? document.body.scrollHeight : null,
          clientHeight: document.documentElement ? document.documentElement.clientHeight : (document.body ? document.body.clientHeight : null),
          fontsStatus: (window.document && document.fonts) ? document.fonts.status : 'no-font-api',
          devicePixelRatio: window.devicePixelRatio || 1,
          viewport: { width: window.innerWidth, height: window.innerHeight }
        };
      });
      console.error('PAGE_METRICS', JSON.stringify(pageMetrics));
    } catch (e) { try{ internalErrors.push('PAGE_METRICS_ERROR: '+String(e && (e.message||e))); }catch(_){} }

    // run centralized stabilization steps (viewport, fonts, DPR, disable animations)
    try { await stabilizePage(page); } catch (e) { try{ internalErrors.push('stabilizePage: '+String(e && (e.message||e))); }catch(_){} }

    // after stabilization, ensure network and fonts are settled before capture
    try { await page.waitForLoadState('networkidle'); } catch (e) { try{ internalErrors.push('after-stabilize waitForLoadState(networkidle): '+String(e && (e.message||e))); }catch(_){} }
    try { await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()); } catch (e) { try{ internalErrors.push('after-stabilize fonts.ready: '+String(e && (e.message||e))); }catch(_){} }
    try { await page.waitForTimeout(200); } catch (e) { try{ internalErrors.push('after-stabilize waitForTimeout(200): '+String(e && (e.message||e))); }catch(_){} }

    // Extract DOM snapshot and key computed styles to help CI-side diagnosis.
    // Keep the payload bounded to avoid huge artifacts.
    let domSnapshot = undefined;
    try {
      domSnapshot = await page.evaluate(() => {
        const sel = ['header','nav','.site-header','.app-header','.toolbar','.banner','.promo','main','.dashboard-grid','.floating-card','footer','body','html'];
        const elems = [];
        for (const s of sel) {
          try {
            const list = Array.from(document.querySelectorAll(s));
            for (const e of list) {
              try {
                const r = e.getBoundingClientRect();
                const cs = window.getComputedStyle(e);
                elems.push({ selector: s, tag: e.tagName, id: e.id || null, class: e.className || null, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, computed: { display: cs.display, width: cs.width, height: cs.height, margin: cs.margin, padding: cs.padding, fontFamily: cs.fontFamily, fontSize: cs.fontSize, color: cs.color, background: cs.background }, outer: (e.outerHTML || '').slice(0,2000) });
              } catch(e){}
            }
          } catch(e){}
        }
        const html = (document.documentElement && document.documentElement.outerHTML) ? document.documentElement.outerHTML.slice(0,200000) : null;
        return { html, elems };
      });
    } catch(e) { }

    // Optional: force platform font if requested (helpful for CI font-diff experiments)
    if (process.env.FORCE_SYSTEM_UI === '1'){
      try {
        await page.evaluate(() => {
          if (document && document.body && document.body.classList) document.body.classList.add('debug-force-system-ui');
        });
        console.error('FORCE_SYSTEM_UI: applied debug-force-system-ui class to body');
      } catch(e) { console.error('FORCE_SYSTEM_UI_ERROR', e && e.message); }
    }

    // If forcing system UI, aggressively disable loading of external webfonts
    // and inject an overriding font-family using common system fonts. This
    // attempts to eliminate font-file differences between CI runners.
    if (process.env.FORCE_SYSTEM_UI === '1') {
      try {
        await page.evaluate(() => {
          try {
            // Remove <link rel=preload as=font> and font file links
            Array.from(document.querySelectorAll('link[rel="preload"][as="font"], link[href$=".woff"], link[href$=".woff2"]')).forEach(n => n.remove());
          } catch (e) {}
          try {
            // Attempt to remove @font-face rules from same-origin stylesheets
            for (const ss of Array.from(document.styleSheets || [])){
              try {
                const rules = ss.cssRules || ss.rules;
                if (!rules) continue;
                for (let i = rules.length - 1; i >= 0; i--) {
                  const r = rules[i];
                  // 5 === CSSRule.FONT_FACE_RULE in most browsers
                  if (r && (r.type === 5 || (r.constructor && String(r.constructor).includes('FontFaceRule')))) {
                    try { ss.deleteRule(i); } catch(e) { /* ignore */ }
                  }
                }
              } catch (e) { /* ignore cross-origin or otherwise inaccessible sheets */ }
            }
          } catch (e) {}
          // Add a high-specificity override to force a stable system font stack.
          const css = `:root.debug-force-system-ui, :root.debug-force-system-ui * { font-family: Segoe UI, Roboto, \"Helvetica Neue\", \"Noto Sans\", Arial, sans-serif !important; -webkit-font-smoothing: antialiased !important; text-rendering: optimizeLegibility !important; }`;
          const s = document.createElement('style'); s.setAttribute('data-debug','force-system-ui'); s.textContent = css;
          (document.head || document.documentElement).appendChild(s);
        });
        console.error('FORCE_SYSTEM_UI: removed webfont links, attempted to strip @font-face, and injected font override');
      } catch(e) { console.error('FORCE_SYSTEM_UI_CSS_ERROR', e && e.message); }
    }

    // log the clip info we will use
    try { console.error('CLIP', JSON.stringify(CLIP)); } catch (e) { try{ internalErrors.push('CLIP log error: '+String(e && (e.message||e))); }catch(_){} }

    // Enforce viewport and fixed document height to avoid variable capture heights
    try {
      if (typeof page.setViewportSize === 'function') {
        try { await page.setViewportSize(VIEWPORT); console.error('VIEWPORT_SET', JSON.stringify(VIEWPORT)); } catch (e) { try{ internalErrors.push('setViewportSize VIEWPORT_SET: '+String(e && (e.message||e))); }catch(_){} }
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
    // Enforce CLIP cropping by default to ensure deterministic screenshot size
    // Set ENFORCE_CLIP=0 in env to allow fullPage fallback (not recommended for CI).
    let buf;
    const enforceClip = (process.env.ENFORCE_CLIP === '0') ? false : true;
    try {
      // ensure viewport and forced document size before capture
      try { await page.setViewportSize(VIEWPORT); } catch (e) { try{ internalErrors.push('setViewportSize before capture: '+String(e && (e.message||e))); }catch(_){} }
      try {
        await page.evaluate((w,h) => {
          try {
            document.documentElement.style.width = w + 'px';
            document.documentElement.style.height = h + 'px';
            document.body.style.width = w + 'px';
            document.body.style.height = h + 'px';
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.documentElement.style.boxSizing = 'border-box';
            document.body.style.boxSizing = 'border-box';
          } catch (e) {}
        }, CLIP.width, CLIP.height);
      } catch(e){}
      await page.waitForTimeout(120);

      // Additional stabilization waits to reduce flaky captures
      try { await page.waitForLoadState('networkidle'); } catch (e) { try{ internalErrors.push('post-stabilize waitForLoadState(networkidle): '+String(e && (e.message||e))); }catch(_){} }
      try { await page.waitForTimeout(1500); } catch (e) { try{ internalErrors.push('post-stabilize waitForTimeout(1500): '+String(e && (e.message||e))); }catch(_){} }
      try { await page.waitForSelector('.dashboard-grid', { state: 'visible', timeout: 2000 }); } catch (e) { try{ internalErrors.push('waitForSelector .dashboard-grid: '+String(e && (e.message||e))); }catch(_){} }
      try {
        await page.evaluate(() => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r) : setTimeout(r, 0))));
      } catch (e) { try{ internalErrors.push('requestIdleCallback wait: '+String(e && (e.message||e))); }catch(_){} }
      // Wait for frontend to set window.__pingOk === true if present; ignore if not defined
      let pingOk = false;
      try {
        try { await page.waitForFunction(() => (window && (window.__pingOk === true)), { timeout: 5000 }); } catch (e) { try{ internalErrors.push('waitForFunction(__pingOk): '+String(e && (e.message||e))); }catch(_){} }
        // Also wait for an explicit DOM marker that the frontend sets when ping succeeds
        try { await page.waitForSelector('[data-ux-ping="ok"]', { timeout: 7000 }); } catch (e) { try{ internalErrors.push('waitForSelector [data-ux-ping]: '+String(e && (e.message||e))); }catch(_){} }
        // And wait for an actual /ux-ping response to be observed by Playwright
        try { await page.waitForResponse(resp => resp.url().includes('/ux-ping') && resp.status() === 200, { timeout: 7000 }); } catch (e) { try{ internalErrors.push('waitForResponse(/ux-ping): '+String(e && (e.message||e))); }catch(_){} }
        // Wait specifically for a POST /ux-ping response so we can mark POST arrival
        let pingPostReceived = false;
        try {
          await page.waitForResponse(r => r.url().includes('/ux-ping') && r.request && r.request().method && r.request().method() === 'POST' && r.status() === 200, { timeout: 7000 });
          pingPostReceived = true;
        } catch (e) { try{ internalErrors.push('waitForResponse(/ux-ping POST): '+String(e && (e.message||e))); }catch(_){} }
        // Probe final pingOk value and scrollHeight for reporting
        try { pingOk = await page.evaluate(() => (window && (window.__pingOk === true)) ).catch(()=>false); } catch(e){ try{ internalErrors.push('probe pingOk final: '+String(e && (e.message||e))); }catch(_){} }
        try { result.pingPostReceived = pingPostReceived; } catch(e){ try{ internalErrors.push('attach pingPostReceived: '+String(e && (e.message||e))); }catch(_){} }
      } catch (e) { try{ internalErrors.push('waitFor ping markers: '+String(e && (e.message||e))); }catch(_){} }
      // Ensure DOM height is stable before screenshot
      try { await waitForStableHeight(page); } catch (e) { try{ internalErrors.push('waitForStableHeight: '+String(e && (e.message||e))); }catch(_){} }

      // Try clip capture up to 3 times to avoid intermittent failures; do not
      // fall back to fullPage when ENFORCE_CLIP=1 to keep height deterministic.
      let attempts = 0;
      while (attempts < 3) {
        try {
          buf = await page.screenshot({ clip: CLIP });
          fs.writeFileSync(screenshotPath, buf);
          break;
        } catch (e) {
          attempts++;
          console.error('SCREENSHOT_CLIP_ATTEMPT_ERROR', attempts, e && (e.message || e));
          try { await page.waitForTimeout(200 + attempts * 100); } catch(e){}
          try { await page.setViewportSize(VIEWPORT); } catch(e){}
        }
      }

      if (!buf) {
        if (enforceClip) {
          // If we must enforce CLIP, fail loudly so CI detects the issue.
          console.error('SCREENSHOT_CLIP_FAILED_ENFORCE');
        } else {
          try {
            buf = await page.screenshot({ fullPage: true });
            fs.writeFileSync(screenshotPath, buf);
            console.error('SCREENSHOT_FALLBACK_FULLPAGE');
          } catch (e2) {
            console.error('SCREENSHOT_ERROR', e2 && e2.message);
          }
        }
      }
    } catch (e) {
      console.error('SCREENSHOT_EXCEPTION', e && e.message);
    }

      // quick PNG size probe (reads width/height from IHDR)
    try {
      if (buf && buf.length > 24 && buf.slice(0,8).toString('hex') === '89504e470d0a1a0a'){
        let width = buf.readUInt32BE(16);
        let height = buf.readUInt32BE(20);
        console.error('SCREENSHOT_PNG_SIZE', width, height);
        // If PNG size doesn't match our CLIP, crop to CLIP to enforce deterministic height
        try {
          const targetW = CLIP.width;
          const targetH = CLIP.height;
          if (width !== targetW || height !== targetH) {
            try {
              const srcPng = PNG.sync.read(buf);
              const dstPng = new PNG({ width: targetW, height: targetH });
              for (let y = 0; y < targetH; y++) {
                const srcStart = (y * srcPng.width) * 4;
                const dstStart = (y * targetW) * 4;
                // copy only the left-most targetW pixels from each row (top-left anchored)
                srcPng.data.copy(dstPng.data, dstStart, srcStart, srcStart + targetW * 4);
              }
              const outBuf = PNG.sync.write(dstPng);
              fs.writeFileSync(screenshotPath, outBuf);
              buf = outBuf;
              width = targetW; height = targetH;
              console.error('SCREENSHOT_CROPPED_TO_CLIP', width, height);
            } catch (cropErr) {
              console.error('SCREENSHOT_CROP_FAILED', cropErr && cropErr.message);
            }
          }
        } catch (e) { console.error('CROP_CHECK_ERROR', e && e.message); }
      } else {
        console.error('SCREENSHOT_PNG_SIZE', 'not-png-or-too-small');
      }
      try { const stat = fs.statSync(screenshotPath); console.error('SCREENSHOT_FILE_BYTES', stat.size); } catch(e){}
    } catch (e) { console.error('PNG_PROBE_ERROR', e && e.message); }

    const result = { url, gridInfo, cardCount, headings, titleColor, screenshot: screenshotPath, consoleMessages };
    // attach collected logs and internal errors
    try { result.pageErrors = pageErrors; } catch(e){ try{ internalErrors.push('attach pageErrors: '+String(e && (e.message||e))); }catch(_){} }
    try { result.internalErrors = internalErrors; } catch(e){ /* ignore */ }
    // include collected DOM snapshot for diagnosis if available (bounded size)
    try { if (domSnapshot) result.domSnapshot = domSnapshot; } catch(e) {}
    // include DPR and viewport info for debugging
    try {
      const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
      const vp = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
      result.devicePixelRatio = dpr;
      result.viewport = vp;
    } catch (e) {}
    // Force URL from ENV to ensure CI-consistent output
    try {
      if (process.env.URL) result.url = process.env.URL;
      // Ensure DPR and viewport are present; try one more time before writing
      try {
        const dpr2 = await page.evaluate(() => window.devicePixelRatio || 1);
        const vp2 = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
        if (dpr2) result.devicePixelRatio = dpr2;
        if (vp2) result.viewport = vp2;
      } catch (e) {}
      // If we have the screenshot buffer, probe PNG IHDR for exact pixel dims
      try {
        if (buf && buf.length > 24 && buf.slice(0,8).toString('hex') === '89504e470d0a1a0a'){
          result.pngWidth = buf.readUInt32BE(16);
          result.pngHeight = buf.readUInt32BE(20);
        }
      } catch(e) {}
      try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch (e) { try{ internalErrors.push('mkdir screenshots: '+String(e && (e.message||e))); }catch(_){} }
      // Write both the standard smoke-result.json (used by normalization) and
      // a full metadata file that will not be rewritten by normalization.
      // enrich result with pingOk / scrollHeight / timestamp and success flag
        try { result.timestamp = Date.now(); } catch(e){}
        try {
          if (page) {
            try { result.pingOk = pingOk === true ? true : await page.evaluate(() => (window && (window.__pingOk === true))).catch(()=>false); } catch(e) { result.pingOk = false; }
            try { result.scrollHeight = await page.evaluate(() => document.body ? document.body.scrollHeight : null).catch(()=>null); } catch(e) { result.scrollHeight = null; }
            try { result.pingPostReceived = (typeof result.pingPostReceived !== 'undefined') ? result.pingPostReceived : false; } catch(e) { result.pingPostReceived = false; }
          }
        } catch(e) { try{ internalErrors.push('probe pingOk/scrollHeight: '+String(e && (e.message||e))); }catch(_){} }
        try { result.success = true; } catch(e){}
      try { fs.writeFileSync('builds/screenshots/smoke-result.json', JSON.stringify(result, null, 2), 'utf8'); console.error('WROTE', 'builds/screenshots/smoke-result.json'); } catch(e){ try{ internalErrors.push('write smoke-result.json: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/smoke-result.json', JSON.stringify(result, null, 2), 'utf8'); console.error('WROTE', 'builds/smoke-result.json'); } catch(e){ try{ internalErrors.push('write builds/smoke-result.json: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/screenshots/smoke-result.full.json', JSON.stringify(result, null, 2), 'utf8'); console.error('WROTE', 'builds/screenshots/smoke-result.full.json'); } catch(e){ try{ internalErrors.push('write smoke-result.full.json (screenshots): '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/smoke-result.full.json', JSON.stringify(result, null, 2), 'utf8'); console.error('WROTE', 'builds/smoke-result.full.json'); } catch(e){ try{ internalErrors.push('write builds/smoke-result.full.json: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/COMPARE_TARGET_HEIGHT', String(CLIP.height), 'utf8'); console.error('WROTE', 'builds/COMPARE_TARGET_HEIGHT', CLIP.height); } catch(e){}
      // Emit compact metrics to stderr so exec wrapper can always pick them up
      try { console.error('RESULT_META', JSON.stringify({ devicePixelRatio: result.devicePixelRatio, viewport: result.viewport })); } catch(e){}
    } catch(e){}
    console.log(JSON.stringify(result, null, 2));
    try { await browser.close(); } catch(e){}
    process.exit(0);
  } catch (err) {
    try { console.error('ERROR', err && (err.message || err)); } catch(e){ try{ internalErrors.push('final catch console.error: '+String(e && (e.message||e))); }catch(_){} }
    try { console.error('ERROR_STACK', (err && err.stack || '').slice(0,2000)); } catch(e){ try{ internalErrors.push('final catch stack log: '+String(e && (e.message||e))); }catch(_){} }
    // assemble a best-effort result object to write to disk for CI analysis
    try {
      const failResult = { success: false, error: (err && (err.message || String(err))) , errorStack: (err && err.stack) ? (err.stack||'').slice(0,2000) : null, url: url || process.env.URL || null, consoleMessages: consoleMessages || [], pageErrors: pageErrors || [], internalErrors: internalErrors || [], timestamp: Date.now() };
      try {
        if (page) {
          try { failResult.pingOk = await page.evaluate(() => (window && (window.__pingOk === true))).catch(()=>null); } catch(e) { failResult.pingOk = null; }
          try { failResult.scrollHeight = await page.evaluate(() => document.body ? document.body.scrollHeight : null).catch(()=>null); } catch(e) { failResult.scrollHeight = null; }
        }
      } catch(e) { try{ internalErrors.push('final probe pingOk: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.mkdirSync('builds/screenshots', { recursive: true }); } catch(e){ try{ internalErrors.push('final mkdir: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/screenshots/smoke-result.full.json', JSON.stringify(failResult, null, 2), 'utf8'); console.error('WROTE', 'builds/screenshots/smoke-result.full.json'); } catch(e){ try{ internalErrors.push('final write full.json: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/smoke-result.full.json', JSON.stringify(failResult, null, 2), 'utf8'); console.error('WROTE', 'builds/smoke-result.full.json'); } catch(e){ try{ internalErrors.push('final write builds/smoke-result.full.json: '+String(e && (e.message||e))); }catch(_){} }
      try { fs.writeFileSync('builds/screenshots/smoke-result.json', JSON.stringify(failResult, null, 2), 'utf8'); console.error('WROTE', 'builds/screenshots/smoke-result.json'); } catch(e){ try{ internalErrors.push('final write smoke-result.json: '+String(e && (e.message||e))); }catch(_){} }
    } catch (e) { try{ internalErrors.push('failed assembling final result: '+String(e && (e.message||e))); }catch(_){} }
    try { await browser.close(); } catch(e){ try{ internalErrors.push('browser.close failed: '+String(e && (e.message||e))); }catch(_){} }
    process.exit(2);
  }
})();
