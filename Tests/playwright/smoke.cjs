const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { stabilizePage, CLIP } = require('./stability_helpers.cjs');

// Configuration
let DEFAULT_WAIT = process.env.DEFAULT_WAIT ? Number(process.env.DEFAULT_WAIT) : 30000; // ms - prefer >= 20000 for GitHub Actions
// FAST_SMOKE overrides to keep local runs quick (set FAST_SMOKE=1 to enable)
const FAST_SMOKE = process.env.FAST_SMOKE === '1';
if (FAST_SMOKE) {
  DEFAULT_WAIT = Math.min(DEFAULT_WAIT, 8000);
}
// Tunable retry counts (reduced when FAST_SMOKE)
const CDP_DISCOVERY_ATTEMPTS = FAST_SMOKE ? 3 : 12;
const CDP_CONNECT_RETRIES = FAST_SMOKE ? 3 : 8;
const NETWORKIDLE_TRIES = FAST_SMOKE ? 1 : 3;
const SCREENSHOT_ATTEMPTS = FAST_SMOKE ? 1 : 3;
const PRE_CAPTURE_MAX = FAST_SMOKE ? 1 : 3;
const CDP_BACKOFF_BASE = FAST_SMOKE ? 500 : 1500;
const GOTO_WAIT_BASE = FAST_SMOKE ? 200 : 500;
const SCREEN_DIR = 'screenshots';
const DIAG_DIR = 'builds/diagnostics';

// Basic helpers
function ensureDirSync(p) { try { fs.mkdirSync(p, { recursive: true }); } catch (e) { throw e; } }
function safeWriteJsonSync(p, obj) { try { ensureDirSync(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8'); return true; } catch (e) { throw e; } }
function pushInternalError(arr, msg) { try { if (!Array.isArray(arr)) return; arr.push(String(msg)); } catch (e) { /* swallow */ } }

const http = require('http');
const net = require('net');
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
    req.setTimeout(timeoutMs, () => { req.abort(); reject(new Error('fetchJson timeout')); });
  });
}

async function gotoWithRetry(page, url, attempts = 2, errs) {
  for (let i = 1; i <= attempts; i++) {
    try {
      console.log('GOTO_ATTEMPT', i, url);
      await page.goto(url, { waitUntil: (FAST_SMOKE ? 'domcontentloaded' : 'networkidle'), timeout: DEFAULT_WAIT });
      console.log('GOTO_SUCCESS', i, url);
      return;
    } catch (e) {
      if (Array.isArray(errs)) pushInternalError(errs, 'GOTO_ATTEMPT_FAILED: ' + String(e && (e.message || e)));
      if (i === attempts) {
        try {
          if (page && typeof page.content === 'function') {
            try {
              ensureDirSync(DIAG_DIR);
              const _html = await page.content();
              try { fs.writeFileSync(path.join(DIAG_DIR, 'nav-failure.html'), _html, 'utf8'); } catch(we){ if (Array.isArray(errs)) pushInternalError(errs, 'nav-failure-write failed: '+String(we)); }
            } catch(writeErr) { if (Array.isArray(errs)) pushInternalError(errs, 'nav-failure-content failed: '+String(writeErr)); }
          }
        } catch(helperErr){ if (Array.isArray(errs)) pushInternalError(errs, 'nav-failure helper failed: '+String(helperErr && (helperErr.message || helperErr))); }
        throw e;
      }
      await page.waitForTimeout(GOTO_WAIT_BASE * i);
    }
  }
}

async function getTargetWebSocket(){
  const listUrl = process.env.CDP || 'http://127.0.0.1:9222/json/list';
  const items = await fetchJson(listUrl, DEFAULT_WAIT);
  if (!Array.isArray(items) || items.length === 0) return null;
  const prefer = process.env.URL || null;
  let found = null;
  if (prefer) found = items.find(i => (i.url||'').includes(prefer));
  if (!found) found = items[0];
  return { ws: (found.webSocketDebuggerUrl || found.webSocketUrl || null), targetUrl: (found.url || null) };
}

async function waitForStableHeight(page, duration = 500) {
  const last = await page.evaluate(() => document.body ? document.body.scrollHeight : null);
  await page.waitForTimeout(duration);
  const next = await page.evaluate(() => document.body ? document.body.scrollHeight : null);
  if (last !== next) await page.waitForTimeout(duration);
}

(async () => {
  // Initialize shared state collectors early so any early catch can record
  const consoleMessages = [];
  const pageErrors = [];
  const internalErrors = [];
  const networkRequests = [];
  const networkResponses = [];

  // helper: save HTML + selected diagnostics immediately (used on timeouts/failures)
  async function saveDiagnosticsSnapshot(pageRef, label, errs) {
    try { ensureDirSync(DIAG_DIR); } catch (e) { if (Array.isArray(errs)) pushInternalError(errs, 'ensureDirSync diag failed: '+String(e)); }
    try {
      if (pageRef && typeof pageRef.content === 'function') {
        try { const html = await pageRef.content(); fs.writeFileSync(path.join(DIAG_DIR, label + '.html'), html, 'utf8'); } catch(e) { if (Array.isArray(errs)) pushInternalError(errs, 'saveDiagnosticsSnapshot html failed: '+String(e)); }
      }
    } catch (e) { if (Array.isArray(errs)) pushInternalError(errs, 'saveDiagnosticsSnapshot inner failed: '+String(e)); }
    try {
      safeWriteJsonSync(path.join(DIAG_DIR, label + '.consoleMessages.json'), consoleMessages || []);
      safeWriteJsonSync(path.join(DIAG_DIR, label + '.networkRequests.json'), networkRequests || []);
      safeWriteJsonSync(path.join(DIAG_DIR, label + '.networkResponses.json'), networkResponses || []);
    } catch (e) { if (Array.isArray(errs)) pushInternalError(errs, 'saveDiagnosticsSnapshot json failed: '+String(e)); }
  }

  // Prepare diagnostics dirs early
  try { ensureDirSync(SCREEN_DIR); } catch (e) { pushInternalError(internalErrors, 'ensureDirSync SCREEN_DIR failed: ' + String(e && (e.message || e))); }
  try { ensureDirSync(DIAG_DIR); } catch (e) { pushInternalError(internalErrors, 'ensureDirSync DIAG_DIR failed: ' + String(e && (e.message || e))); }

  // detection flags
  let domMarkerDetected = false;
  let consoleMarkerDetected = false;
  let pingOk = false; // will be finalized later as logical OR of signals
  let pingPostReceived = false;

  let result = {};

  try {
    // Ensure CI-run tests use the runner loopback explicitly and force IPv4 in CI
    if (process.env.GITHUB_ACTIONS === 'true') {
      process.env.URL = 'http://127.0.0.1:1420/';
    }
    let url = process.env.URL || 'http://localhost:1420/';
    let preferUrl = process.env.URL || 'http://tauri.localhost/';
    // Emit environment diagnostics so CI logs include the effective targets
    try { console.log('SMOKE_ENV', JSON.stringify({ URL: process.env.URL || null, url, preferUrl })); } catch (e) { /* noop */ }

    // Discover or launch browser
    let res;
    const disableCdp = process.env.DISABLE_CDP === '1';
    if (!disableCdp) {
      for (let attempt = 1; attempt <= CDP_DISCOVERY_ATTEMPTS; attempt++) {
          try { res = await getTargetWebSocket(); if (res) break; } catch (e) { pushInternalError(internalErrors, 'CDP_DISCOVERY_FAILED: ' + String(e && e.message)); }
          await new Promise(r => setTimeout(r, CDP_BACKOFF_BASE * attempt));
        }
        if (!res) pushInternalError(internalErrors, 'CDP_DISCOVERY_GAVE_UP');
      } else {
        pushInternalError(internalErrors, 'DISABLE_CDP=1, skipping CDP discovery');
    }

    const wsUrl = res && res.ws;
    if (res && res.targetUrl) url = res.targetUrl;
    // If a caller explicitly set URL in the environment, prefer that
    // over any discovered CDP target to avoid name-resolution surprises
    // (e.g. tauri.localhost -> ::1). This is a minimal, safe override.
    if (process.env.URL) {
      url = process.env.URL;
      // preferUrl may be used later as a fallback; keep it consistent
      // with the explicit environment setting.
      try { preferUrl = process.env.URL; } catch (e) { /* noop */ }
    }

    let browser;
    let connectedOverCDP = false;
    if (wsUrl) {
      const httpBase = wsUrl.replace(/^ws:/,'http:').replace(/\/devtools\/page.*$/, '');
      for (let ctry = 1; ctry <= CDP_CONNECT_RETRIES; ctry++) {
        try { browser = await chromium.connectOverCDP(httpBase); connectedOverCDP = true; break; } catch (e) { pushInternalError(internalErrors, 'CDP_CONNECT_ERROR: ' + String(e && e.message)); browser = undefined; await new Promise(r => setTimeout(r, 1000 * ctry)); }
      }
      if (!browser) pushInternalError(internalErrors, 'CDP_CONNECT_GAVE_UP');
    }

    if (!browser) {
      try { browser = await chromium.launch({ args: ['--no-sandbox', `--force-device-scale-factor=${process.env.DSF ? Number(process.env.DSF) : 1}`, '--host-resolver-rules=MAP tauri.localhost 127.0.0.1', '--disable-features=NetworkService,NetworkServiceInProcess', '--disable-dev-shm-usage', '--no-zygote', '--single-process'] }); } catch (e) { pushInternalError(internalErrors, 'BROWSER_LAUNCH_ERROR: ' + String(e && e.message)); pushInternalError(internalErrors, 'BROWSER_LAUNCH_STACK: ' + ((e && e.stack) || '').slice(0,2000)); throw e; }
    }

    const VIEWPORT = { width: CLIP.width, height: CLIP.height };
    const DSF = process.env.DSF ? Number(process.env.DSF) : 1;
    let context = null;
    let page = null;

    try {
      if (typeof browser.newContext === 'function') {
        context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF, colorScheme: 'light' });
        try {
          if (context && typeof context.addInitScript === 'function') {
            const ciInitCss = `html,body,#root{background:#ffffff!important;background-image:none!important;background-color:#ffffff!important;color:#222!important} *{background-image:none!important;background-color:transparent!important}`;
            await context.addInitScript({ content: `(() => { try { const css = ${JSON.stringify(ciInitCss)}; const s = document.createElement('style'); s.id = 'ci-init-style'; s.setAttribute('data-ci','1'); s.textContent = css; const h = document.head || document.documentElement; h.insertBefore(s, h.firstChild); } catch(e){} })()` });
          }
        } catch (e) { pushInternalError(internalErrors, 'ADD_INIT_SCRIPT_FAILED: '+String(e && e.message)); }
        if (context && typeof context.newPage === 'function') {
          page = await context.newPage();
          // Run connectivity probes from this Node process to capture reachability
          async function runConnectivityChecks(errs) {
            try {
              const probes = [];
              const ports = [1420, 8765, 8877];
              for (const p of ports) {
                const r = await new Promise(res => {
                  const sock = net.createConnection({ host: '127.0.0.1', port: p }, () => { sock.destroy(); res({ port: p, tcp: true }); });
                  sock.on('error', e => { res({ port: p, tcp: false, err: String(e) }); });
                  sock.setTimeout(2000, () => { sock.destroy(); res({ port: p, tcp: false, err: 'timeout' }); });
                }).catch(e => ({ port: p, tcp: false, err: String(e) }));
                probes.push(r);
                try {
                  const pj = await fetchJson(`http://127.0.0.1:${p}/ux-ping`, 3000).catch(e => null);
                  probes[probes.length-1].http = !!(pj && pj.ok);
                } catch (e) { probes[probes.length-1].http = false; }
              }
              try { safeWriteJsonSync(path.join(DIAG_DIR, 'connectivity-probes.json'), probes); } catch(e) { if (Array.isArray(errs)) pushInternalError(errs, 'connectivity-probes write failed: '+String(e && e.message)); }
              console.log('CONNECTIVITY_PROBES', JSON.stringify(probes));
              return probes;
            } catch (e) { if (Array.isArray(errs)) pushInternalError(errs, 'runConnectivityChecks failed: '+String(e && e.message)); return null; }
          }
          try { await runConnectivityChecks(internalErrors); } catch (e) { pushInternalError(internalErrors, 'connectivity check failed: '+String(e && e.message)); }
          const initialTarget = process.env.URL || preferUrl;
          try {
            await gotoWithRetry(page, initialTarget, 2, internalErrors);
          } catch (e) {
            pushInternalError(internalErrors, 'gotoWithRetry initial: '+String(e && e.message));
            try {
              // If connection refused to tauri.localhost/localhost, try loopback IP fallback
              if (initialTarget && (initialTarget.includes('tauri.localhost') || initialTarget.includes('localhost'))) {
                const alt = initialTarget.replace('tauri.localhost','127.0.0.1').replace('localhost','127.0.0.1');
                pushInternalError(internalErrors, 'Attempting fallback to '+alt);
                await gotoWithRetry(page, alt, 2, internalErrors);
              }
            } catch (e2) {
              pushInternalError(internalErrors, 'gotoWithRetry fallback failed: '+String(e2 && e2.message));
            }
          }
        }
      }
    } catch (e) { pushInternalError(internalErrors, 'NEW_CONTEXT_ERROR: ' + String(e && (e.message || e))); context = null; page = null; }

    if (!page) {
      const host = (process.env.URL || url).replace(/https?:\/\//, '');
      const tryPages = () => { const pages = []; for (const ctx of (browser.contexts() || [])){ if (typeof ctx.pages === 'function') pages.push(...ctx.pages()); } return pages; };
      let pages = tryPages();
      page = pages.find(p => (p.url()||'').includes(host) || (p.url()||'').includes('tauri.localhost')) || pages[0] || null;
      context = (browser.contexts() && browser.contexts()[0]) || context;
    }

    if (!page && connectedOverCDP && context && typeof context.newPage === 'function'){ page = await context.newPage(); try { await gotoWithRetry(page, process.env.URL || preferUrl, 2, internalErrors); } catch(e) { pushInternalError(internalErrors, 'gotoWithRetry CDP newPage: '+String(e && e.message)); } }

    if (!page){
      const local = await chromium.launch({ args: ['--no-sandbox', `--force-device-scale-factor=${DSF}`, '--host-resolver-rules=MAP tauri.localhost 127.0.0.1', '--disable-features=NetworkService,NetworkServiceInProcess', '--disable-dev-shm-usage', '--no-zygote', '--single-process'] });
      const localCtx = await local.newContext({ viewport: VIEWPORT, deviceScaleFactor: DSF, colorScheme: 'light' });
          try { if (localCtx && typeof localCtx.addInitScript === 'function') { const ciInitCss = `html,body,#root{background:#ffffff!important}`; await localCtx.addInitScript({ content: `(() => { try { const css = ${JSON.stringify(ciInitCss)}; const s = document.createElement('style'); s.id = 'ci-init-style'; s.setAttribute('data-ci','1'); s.textContent = css; const h = document.head || document.documentElement; h.insertBefore(s, h.firstChild); } catch(e){} })()` }); } } catch (e) { pushInternalError(internalErrors, 'ADD_INIT_SCRIPT_LOCAL_FAILED: '+String(e && e.message)); }
      page = await localCtx.newPage(); await gotoWithRetry(page, url, 2, internalErrors);
    }

    try { const purl = page.url && page.url(); if (purl) url = purl; } catch (e) { pushInternalError(internalErrors, 'page.url probe: '+String(e && e.message)); }

    // Inject normalization CSS and attempts to stabilize rendering
    try {
      const pageUrl = (typeof page.url === 'function') ? page.url() : (page.url || url);
      const notoCssUrl = new URL('assets/fonts/noto-local.css', pageUrl).toString();
      try { await page.addStyleTag({ url: notoCssUrl }); } catch(e) { pushInternalError(internalErrors, 'INJECT_NOTE_ADD_FAILED: '+String(e && e.message)); }

      const normCss = `:root{color-scheme: light !important} html,body{background:#ffffff !important; background-image: none !important; background-color: #ffffff !important; color:#222 !important}`;
      try { await page.addStyleTag({ content: normCss }); } catch(e) { pushInternalError(internalErrors, 'INJECT_NORM_FAILED: '+String(e && e.message)); }

      try { await page.evaluate(() => { try { const html = document.documentElement; if (html && html.className) html.className = html.className.split(/\s+/).filter(c => !/^theme-/.test(c)).join(' '); } catch(e) {} }); } catch(e) { pushInternalError(internalErrors, 'INJECT_REMOVE_THEME_FAILED: '+String(e && e.message)); }

      try { await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()); } catch(e) { pushInternalError(internalErrors, 'fonts.ready top: '+String(e && e.message)); }
      try { await page.waitForFunction(() => { try { const bg = getComputedStyle(document.documentElement).backgroundColor || getComputedStyle(document.body).backgroundColor || ''; return /rgb\(255,\s*255,\s*255\)/.test(bg) || /rgba\(255,\s*255,\s*255,\s*1/.test(bg); } catch(e){ return false; } }, { timeout: DEFAULT_WAIT }); } catch(e) { pushInternalError(internalErrors, 'WAIT_NORMALIZE_FAILED: '+String(e && e.message)); }

      try { await page.waitForTimeout(120); } catch(e) { pushInternalError(internalErrors, 'waitForTimeout(120) failed: '+String(e && e.message)); }
    } catch(e){ pushInternalError(internalErrors, 'inject noto css top-level: '+String(e && (e.message||e))); }

    // Attach listeners for diagnostics
    page.on('console', msg => { try { consoleMessages.push({ type: msg.type(), text: msg.text(), location: msg.location ? msg.location() : null, ts: Date.now() }); } catch(e) { pushInternalError(internalErrors, String(e && (e.message||e))); } });
    page.on('request', req => { try { const u = String((typeof req.url === 'function') ? req.url() : (req.url || '')); const m = (typeof req.method === 'function') ? req.method() : (req.method || null); const id = Date.now() + Math.floor(Math.random()*1000); networkRequests.push({ id, url: u, method: m, ts: Date.now(), resourceType: (typeof req.resourceType === 'function') ? req.resourceType() : (req.resourceType || null) }); if (u.indexOf('/ux-ping') !== -1 && m === 'POST') pingPostReceived = true; } catch (e) { pushInternalError(internalErrors, 'request-listener-error: ' + String(e && (e.message||e))); } });
    page.on('response', resp => { try { const u = String((typeof resp.url === 'function') ? resp.url() : (resp.url || '')); const status = (typeof resp.status === 'function') ? resp.status() : (resp.status || null); networkResponses.push({ url: u, status, ts: Date.now() }); } catch (e) { pushInternalError(internalErrors, 'response-listener-error: ' + String(e && (e.message||e))); } });
    // Extended: save response bodies for 400+ responses for diagnostics (best-effort)
    page.on('response', async resp => {
      try {
        const status = (typeof resp.status === 'function') ? resp.status() : (resp.status || null);
        if (status && status >= 400) {
          try {
            const url = (typeof resp.url === 'function') ? resp.url() : (resp.url || 'resp');
            const urlSafe = url.replace(/[:\\/\?&=#]/g, '_').slice(0,200);
            const body = await resp.body().catch(e => { pushInternalError(internalErrors, 'resp.body() failed: '+String(e && e.message)); return null; });
            if (body && body.length) {
              try { ensureDirSync(path.join(DIAG_DIR, 'response-bodies')); } catch(e) { pushInternalError(internalErrors, 'ensureDirSync response-bodies failed: '+String(e && e.message)); }
              try { fs.writeFileSync(path.join(DIAG_DIR, 'response-bodies', `${status}_${urlSafe}.bin`), body); } catch(e) { pushInternalError(internalErrors, 'write response body failed: '+String(e && e.message)); }
            }
          } catch(e) { pushInternalError(internalErrors, 'save response body overall failed: '+String(e && e.message)); }
        }
      } catch(e) { pushInternalError(internalErrors, 'response-body-listener error: '+String(e && e.message)); }
    });
    page.on('requestfailed', rf => { try { const u = String((typeof rf.url === 'function') ? rf.url() : (rf.url || '')); networkResponses.push({ url: u, failed: true, failureText: rf.failure ? (rf.failure().errorText || rf.failure()) : null, ts: Date.now() }); } catch (e) { pushInternalError(internalErrors, 'requestfailed-listener-error: ' + String(e && (e.message||e))); } });
    page.on('pageerror', err => { try { pageErrors.push({ message: String(err && (err.message || err)), stack: (err && err.stack) ? String(err.stack).slice(0,2000) : null, ts: Date.now() }); } catch (e) { pushInternalError(internalErrors, String(e && (e.message||e))); } });

    const screenshotPath = path.join(SCREEN_DIR, 'playwright-smoke.png');
    ensureDirSync(SCREEN_DIR);

    // Ensure page loaded and network/font readiness
    try {
      console.log('MARK: before waitForLoadState domcontentloaded');
      await page.waitForLoadState('domcontentloaded', { timeout: DEFAULT_WAIT }).catch(e => pushInternalError(internalErrors, 'waitForLoadState(domcontentloaded): '+String(e && (e.message||e))));
      console.log('MARK: after waitForLoadState domcontentloaded');
      console.log('MARK: before waitForLoadState load');
      await page.waitForLoadState('load', { timeout: DEFAULT_WAIT }).catch(e => pushInternalError(internalErrors, 'waitForLoadState(load): '+String(e && (e.message||e))));
      console.log('MARK: after waitForLoadState load');
      for (let ni = 0; ni < NETWORKIDLE_TRIES; ni++) { try { await page.waitForLoadState('networkidle', { timeout: DEFAULT_WAIT }); break; } catch (e) { pushInternalError(internalErrors, 'waitForLoadState(networkidle) attempt '+ni+': '+String(e && (e.message||e))); try { await saveDiagnosticsSnapshot(page, 'timeout-networkidle', internalErrors); } catch(snapErr){ pushInternalError(internalErrors, 'saveDiagnosticsSnapshot failed: '+String(snapErr && (snapErr.message||snapErr))); } await page.waitForTimeout(500); } }
      await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).catch(e => pushInternalError(internalErrors, 'fonts.ready: '+String(e && (e.message||e))));
      await page.waitForTimeout(200);
    } catch (e) { pushInternalError(internalErrors, 'PAGE_METRICS_ERROR: '+String(e && (e.message||e))); }

    try { console.log('MARK: before stabilizePage'); await stabilizePage(page); console.log('MARK: after stabilizePage'); } catch (e) { pushInternalError(internalErrors, 'stabilizePage: '+String(e && (e.message||e))); }

    try { await page.waitForLoadState('networkidle', { timeout: DEFAULT_WAIT }).catch(e => pushInternalError(internalErrors, 'after-stabilize waitForLoadState(networkidle): '+String(e && (e.message||e)))); } catch(e){ pushInternalError(internalErrors, 'after-stabilize waitForLoadState(networkidle) outer: '+String(e && (e.message||e))); }
    try { await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).catch(e => pushInternalError(internalErrors, 'after-stabilize fonts.ready: '+String(e && (e.message||e)))); } catch(e){ pushInternalError(internalErrors, 'after-stabilize fonts.ready outer: '+String(e && (e.message||e))); }
    try { await page.waitForTimeout(200); } catch(e) { pushInternalError(internalErrors, 'waitForTimeout(200) after-stabilize failed: '+String(e && (e.message||e))); }

    // Extract DOM snapshot (bounded)
    let domSnapshot = undefined;
    try {
      domSnapshot = await page.evaluate(() => {
        const sel = ['header','nav','.site-header','.app-header','.toolbar','.banner','.promo','main','.dashboard-grid','.floating-card','footer','body','html'];
        const elems = [];
        for (const s of sel) {
          try { const list = Array.from(document.querySelectorAll(s)); for (const e of list) { try { const r = e.getBoundingClientRect(); const cs = window.getComputedStyle(e); elems.push({ selector: s, tag: e.tagName, id: e.id || null, class: e.className || null, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, computed: { display: cs.display, width: cs.width, height: cs.height, margin: cs.margin, padding: cs.padding, fontFamily: cs.fontFamily, fontSize: cs.fontSize, color: cs.color, background: cs.background }, outer: (e.outerHTML || '').slice(0,2000) }); } catch(e){} }
          } catch(e){}
        }
        const html = (document.documentElement && document.documentElement.outerHTML) ? document.documentElement.outerHTML.slice(0,200000) : null;
        return { html, elems };
      });
    } catch (e) { pushInternalError(internalErrors, 'domSnapshot error: '+String(e && e.message)); }

    // pre-capture repaint attempts
    try {
      const maxAttempts = PRE_CAPTURE_MAX; let applied = false;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          try { await page.waitForLoadState('networkidle', { timeout: DEFAULT_WAIT }); } catch(e){ pushInternalError(internalErrors, 'pre-capture waitForLoadState(networkidle) failed: '+String(e && (e.message||e))); }
          await page.evaluate(() => {
            try {
              const id = 'ci-pre-capture-override';
              if (!document.getElementById(id)) {
                const s = document.createElement('style');
                s.id = id;
                s.setAttribute('data-ci','1');
                s.textContent = `html,body,#root{background:#ffffff!important;background-image:none!important;background-color:#ffffff!important;color:#222!important} *, *::before, *::after { transition: none !important; animation: none !important; }`;
                (document.head || document.documentElement).insertBefore(s, (document.head && document.head.firstChild));
              }
              void (document.body && document.body.offsetHeight);
              return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            } catch (e) {
              return null;
            }
          });
          await page.waitForTimeout(80);
          applied = true; break;
        } catch (e) {
          const msg = String(e && (e.message || e));
          if (msg && msg.indexOf('Execution context was destroyed') !== -1 && attempt < maxAttempts) { await page.waitForTimeout(200 * attempt); continue; }
          pushInternalError(internalErrors, 'pre-capture repaint attempt failed: '+msg); break;
        }
      }
      if (!applied) pushInternalError(internalErrors, 'pre-capture repaint: not applied after retries');
    } catch (e) { pushInternalError(internalErrors, 'pre-capture repaint fatal: ' + String(e && (e.message || e))); }

    // Readiness probes: DOM marker, console marker, window marker
    try {
      // DOM marker
      try { await page.waitForSelector('[data-ux-ping="ok"]', { timeout: DEFAULT_WAIT }); domMarkerDetected = true; } catch (e) { pushInternalError(internalErrors, 'waitForSelector [data-ux-ping]: '+String(e && (e.stack || e.message || e))); try { await saveDiagnosticsSnapshot(page, 'timeout-ux-ping', internalErrors); } catch(snapErr){ pushInternalError(internalErrors, 'saveDiagnosticsSnapshot failed: '+String(snapErr && (snapErr.message||snapErr))); } }

      // console marker
      try { await page.waitForEvent('console', { timeout: DEFAULT_WAIT, predicate: msg => { try { return (msg && typeof msg.text === 'function' && String(msg.text()).includes('[ux-ping-ok]')); } catch(e) { return false; } } }); consoleMarkerDetected = true; } catch (e) { pushInternalError(internalErrors, 'waitForEvent(console [ux-ping-ok]): '+String(e && (e.stack || e.message || e))); }

      // window marker
      try { pingOk = await page.evaluate(() => !!(window && (window.__pingOk === true))).catch(e => { pushInternalError(internalErrors, 'probe pingOk eval failed: '+String(e && (e.message||e))); return false; }); } catch(e) { pushInternalError(internalErrors, 'probe pingOk final: '+String(e && (e.stack || e.message || e))); }

    } catch (e) { pushInternalError(internalErrors, 'waitFor ping markers: '+String(e && (e.message||e))); }

    await waitForStableHeight(page).catch(e => pushInternalError(internalErrors, 'waitForStableHeight: '+String(e && (e.message||e))));

    // Capture screenshot (clip) with retries
    console.log('MARK: before screenshot flow');
    let buf;
    const enforceClip = (process.env.ENFORCE_CLIP === '0') ? false : true;
    try {
      try { await page.setViewportSize(VIEWPORT); } catch (e) { pushInternalError(internalErrors, 'setViewportSize before capture: '+String(e && (e.message||e))); }
      await page.waitForLoadState('networkidle', { timeout: DEFAULT_WAIT }).catch(e => pushInternalError(internalErrors, 'post-stabilize waitForLoadState(networkidle): '+String(e && (e.message||e))));
      try { await page.waitForTimeout(1500); } catch(e) { pushInternalError(internalErrors, 'waitForTimeout(1500) failed: '+String(e && (e.message||e))); }
      await page.waitForSelector('.dashboard-grid', { state: 'visible', timeout: DEFAULT_WAIT }).catch(e => pushInternalError(internalErrors, 'waitForSelector .dashboard-grid: '+String(e && (e.message||e))));

      let attempts = 0;
      while (attempts < SCREENSHOT_ATTEMPTS) {
        try {
          buf = await page.screenshot({ clip: CLIP });
          fs.writeFileSync(screenshotPath, buf);
          try {
            const fullBuf = await page.screenshot({ fullPage: true });
            try {
              fs.writeFileSync(path.join(SCREEN_DIR, 'playwright-smoke-full.png'), fullBuf);
            } catch(e) { pushInternalError(internalErrors, 'write full screenshot failed: '+String(e && e.message)); }
          } catch(e) { pushInternalError(internalErrors, 'fullPage screenshot failed: '+String(e && e.message)); }
          console.log('MARK: screenshot succeeded attempt', attempts+1);
          break;
        } catch (e) {
          attempts++;
          pushInternalError(internalErrors, 'SCREENSHOT_CLIP_ATTEMPT_ERROR: ' + String(e && (e.message || e)));
          await page.waitForTimeout(200 + attempts * 100);
          try { await page.setViewportSize(VIEWPORT); } catch(e) { pushInternalError(internalErrors, 'setViewportSize retry failed: '+String(e && e.message)); }
        }
      }
      if (!buf) {
        if (enforceClip) { pushInternalError(internalErrors, 'SCREENSHOT_CLIP_FAILED_ENFORCE'); } else { try { buf = await page.screenshot({ fullPage: true }); fs.writeFileSync(screenshotPath, buf); } catch (e2) { pushInternalError(internalErrors, 'SCREENSHOT_ERROR: ' + String(e2 && e2.message)); } }
    }
    } catch (e) { pushInternalError(internalErrors, 'SCREENSHOT_EXCEPTION: '+String(e && e.message)); }

    // PNG probe and crop to CLIP if necessary
    try {
      if (buf && buf.length > 24 && buf.slice(0,8).toString('hex') === '89504e470d0a1a0a'){
        let width = buf.readUInt32BE(16); let height = buf.readUInt32BE(20);
        const targetW = CLIP.width; const targetH = CLIP.height;
        if (width !== targetW || height !== targetH) {
              try { const srcPng = PNG.sync.read(buf); const dstPng = new PNG({ width: targetW, height: targetH }); for (let y = 0; y < targetH; y++) { const srcStart = (y * srcPng.width) * 4; const dstStart = (y * targetW) * 4; srcPng.data.copy(dstPng.data, dstStart, srcStart, srcStart + targetW * 4); } const outBuf = PNG.sync.write(dstPng); fs.writeFileSync(screenshotPath, outBuf); buf = outBuf; } catch (cropErr) { pushInternalError(internalErrors, 'SCREENSHOT_CROP_FAILED: '+String(cropErr && cropErr.message)); }
        }
      } else { pushInternalError(internalErrors, 'SCREENSHOT_PNG_SIZE: not-png-or-too-small'); }
    } catch (e) { pushInternalError(internalErrors, 'PNG_PROBE_ERROR: '+String(e && e.message)); }

    console.log('MARK: before assemble result');
    // Assemble result and write diagnostics
    try {
      result = { url, gridInfo: await page.evaluate(() => { const g = document.querySelector('.dashboard-grid'); return g ? { exists: true, display: getComputedStyle(g).display } : { exists: false }; }), cardCount: await page.evaluate(() => document.querySelectorAll('.floating-card').length), headings: await page.evaluate(() => Array.from(document.querySelectorAll('.floating-card')).map(e=> (e.querySelector('h3')?.textContent||'').slice(0,60))), titleColor: await page.evaluate(() => { const t = document.querySelector('.dashboard-title'); return t ? getComputedStyle(t).color : null; }), screenshot: screenshotPath };
    } catch (e) { pushInternalError(internalErrors, 'assemble basic result: '+String(e && e.message)); }

    try {
      result.pageErrors = pageErrors;
      result.internalErrors = internalErrors;
      if (domSnapshot) result.domSnapshot = domSnapshot;
      try { result.devicePixelRatio = await page.evaluate(() => window.devicePixelRatio || 1); } catch(e) { pushInternalError(internalErrors, 'devicePixelRatio probe failed: '+String(e && e.message)); result.devicePixelRatio = null; }
      try { result.viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })); } catch(e) { pushInternalError(internalErrors, 'viewport probe failed: '+String(e && e.message)); result.viewport = null; }
    } catch (e) { pushInternalError(internalErrors, 'attach meta: '+String(e && e.message)); }

    // Probe ux-ping endpoints (best-effort)
    try {
      const ports = [8765, 8877];
      for (const p of ports) {
        try {
          const u = `http://127.0.0.1:${p}/ux-ping`;
          const pj = await fetchJson(u, 20000).catch(e => { pushInternalError(internalErrors, 'ux-ping fetch failed: '+String(e && e.message)); return null; });
          if (pj && pj.ok) { console.log('UX_PING_OK', p, JSON.stringify(pj)); result.pingPostReceived = true; result.pingPort = p; break; }
        } catch (e) { pushInternalError(internalErrors, 'ux-ping probe failed port '+p+': '+String(e && (e.stack || e.message || e))); }
      }
    } catch (e) { pushInternalError(internalErrors, 'ux-ping probes overall failed: '+String(e && (e.stack || e.message || e))); }

    // Finalize pingOk decision: authoritative signals ORed
    try { const finalPing = !!(pingOk || domMarkerDetected || consoleMarkerDetected); result.pingOk = finalPing; result.domMarkerDetected = !!domMarkerDetected; result.consoleMarkerDetected = !!consoleMarkerDetected; result.pingPostReceived = !!pingPostReceived || !!result.pingPostReceived; result.timestamp = Date.now(); result.success = true; } catch (e) { pushInternalError(internalErrors, 'finalize pingOk: '+String(e && e.message)); }
    // If readiness failed, capture focused key-element HTML for faster inspection
    try {
      const finalPingCheck = !!(pingOk || domMarkerDetected || consoleMarkerDetected);
      if (!finalPingCheck) {
        try {
          if (typeof page !== 'undefined' && page) {
            const keyHtml = await page.evaluate(() => {
              const sel = ['header','main','.dashboard-grid','.floating-card','#root'];
              const o = {};
              for (const s of sel) {
                try { const n = document.querySelector(s); o[s] = n ? n.outerHTML.slice(0,200000) : null; } catch(e) { o[s] = null; }
              }
              return o;
            });
            try { safeWriteJsonSync(path.join(DIAG_DIR, 'readiness-key-html.json'), keyHtml); } catch(e) { pushInternalError(internalErrors, 'write readiness-key-html failed: '+String(e && e.message)); }
          }
        } catch(e) { pushInternalError(internalErrors, 'capture readiness-key-html failed: '+String(e && e.message)); }
      }
    } catch(e) { pushInternalError(internalErrors, 'readiness-key-html outer failed: '+String(e && e.message)); }

    // Write diagnostics in unified locations
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'consoleMessages.json'), consoleMessages || []); } catch(e){ pushInternalError(internalErrors, 'write consoleMessages: '+String(e && (e.message||e))); }
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'networkRequests.json'), networkRequests || []); } catch(e){ pushInternalError(internalErrors, 'write networkRequests: '+String(e && (e.message||e))); }
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'networkResponses.json'), networkResponses || []); } catch(e){ pushInternalError(internalErrors, 'write networkResponses: '+String(e && (e.message||e))); }
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'domSnapshot.json'), domSnapshot || null); } catch(e){ pushInternalError(internalErrors, 'write domSnapshot: '+String(e && (e.message||e))); }
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'smoke-result.json'), result); } catch(e){ pushInternalError(internalErrors, 'write smoke-result.json: '+String(e && (e.message||e))); }
    try { safeWriteJsonSync(path.join(DIAG_DIR, 'smoke-result.full.json'), result); } catch(e){ pushInternalError(internalErrors, 'write smoke-result.full.json: '+String(e && (e.message||e))); }

    // Also write compact markers for existing tooling that expects builds/
    try { fs.writeFileSync(path.join('builds','COMPARE_TARGET_HEIGHT'), String(CLIP.height), 'utf8'); } catch(e) { pushInternalError(internalErrors, 'write COMPARE_TARGET_HEIGHT failed: '+String(e && (e.message||e))); }

    console.log(JSON.stringify(result, null, 2));
    try { await browser.close(); } catch(e) { pushInternalError(internalErrors, 'browser.close failed: '+String(e && e.message)); }
    process.exitCode = 0; return;

  } catch (err) {
    pushInternalError(internalErrors, 'UNCAUGHT: ' + String(err && (err.message || err)));
    try { console.log('ERROR_STACK', (err && err.stack || '').slice(0,2000)); } catch(e) { pushInternalError(internalErrors, 'ERROR_STACK_PRINT_FAILED: '+String(e && (e.message||e))); }
    try {
      const failResult = { success: false, error: (err && (err.message || String(err))) , errorStack: (err && err.stack) ? (err.stack||'').slice(0,2000) : null, url: (typeof url !== 'undefined') ? url : (process.env.URL || null), consoleMessages: consoleMessages || [], pageErrors: pageErrors || [], internalErrors: internalErrors || [], timestamp: Date.now() };
      try {
        if (typeof page !== 'undefined' && page) {
          try { failResult.pingOk = await page.evaluate(() => (window && (window.__pingOk === true))); } catch(e) { pushInternalError(internalErrors, 'final probe pingOk eval failed: '+String(e && e.message)); failResult.pingOk = null; }
          try { failResult.scrollHeight = await page.evaluate(() => document.body ? document.body.scrollHeight : null); } catch(e) { pushInternalError(internalErrors, 'final probe scrollHeight failed: '+String(e && e.message)); failResult.scrollHeight = null; }
        }
      } catch(e) { pushInternalError(internalErrors, 'final probe pingOk: '+String(e && (e.message||e))); }
      ensureDirSync(DIAG_DIR);
      safeWriteJsonSync(path.join(DIAG_DIR, 'consoleMessages.json'), consoleMessages || []);
      safeWriteJsonSync(path.join(DIAG_DIR, 'networkRequests.json'), networkRequests || []);
      safeWriteJsonSync(path.join(DIAG_DIR, 'networkResponses.json'), networkResponses || []);
      safeWriteJsonSync(path.join(DIAG_DIR, 'domSnapshot.json'), domSnapshot || null);
      safeWriteJsonSync(path.join(DIAG_DIR, 'smoke-result.full.json'), failResult);
      safeWriteJsonSync(path.join(DIAG_DIR, 'smoke-result.json'), failResult);
      console.log(JSON.stringify(failResult, null, 2));
    } catch (e) { pushInternalError(internalErrors, 'final write failed: '+String(e && (e.message||e))); }
    try { await (typeof browser !== 'undefined' && browser ? browser.close() : Promise.resolve()); } catch(e) { pushInternalError(internalErrors, 'browser.close failed after error: '+String(e && e.message)); }
    process.exitCode = 2; return;
  }
})();
