const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function ensureDirSync(p){ try{ fs.mkdirSync(p, { recursive: true }); } catch(e){} }
function safeWriteJsonSync(p,obj){ try{ ensureDirSync(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2),'utf8'); } catch(e){} }

(async ()=>{
  const out = { timestamp: Date.now(), envURL: process.env.URL || null, attempts: [] };
  let browser = null;
  try{
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP tauri.localhost 127.0.0.1','--disable-features=NetworkService,NetworkServiceInProcess'] });
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1200 } });
    const page = await ctx.newPage();
    out.console = [];
    page.on('console', msg => {
      try { out.console.push({ type: msg.type(), text: msg.text() }); } catch(e) { /* ignore */ }
    });

    // Attempt to load a CI preflight page (served from static server) to exercise same-origin context
    try {
      await page.goto('http://127.0.0.1:1420/ci-preflight.html', { waitUntil: 'load', timeout: 5000 }).catch(e => { out.navError = String(e); });
      try { out.pagePreflight = await page.evaluate(() => window.__ciPreflight || null); } catch(e) { out.pagePreflightEvalError = String(e); }
    } catch(e) { out.navException = String(e); }

    const hosts = ['tauri.localhost','127.0.0.1'];
    const ports = [1420,8765,8877];
    for(const h of hosts){
      for(const p of ports){
        const target = `http://${h}:${p}${(p===1420?'/':'/ux-ping')}`;
        try{
          const res = await page.evaluate(async (t)=>{
            try{
              const r = await fetch(t, { method: 'GET' });
              const text = await r.text().catch(()=>null);
              return { ok: r.ok, status: r.status, text: (text||null) };
            }catch(e){ return { ok: false, error: String(e) }; }
          }, target);
          out.attempts.push({ host: h, port: p, target, result: res });
        }catch(e){ out.attempts.push({ host: h, port: p, target, error: String(e) }); }
      }
    }

    // also attempt to resolve via JS DNS lookup if available (best-effort)
    try{
      const resolved = await page.evaluate(async ()=>{
        try{ return (await (await fetch('http://127.0.0.1:1420/')).text()).slice(0,200); } catch(e) { return String(e); }
      });
      out.localFetch = resolved ? (String(resolved).slice(0,200)) : null;
    }catch(e){ out.localFetchError = String(e); }

    try{ await page.close(); } catch(e){}
    try{ await ctx.close(); } catch(e){}
  }catch(e){ out.launchError = String(e); }
  try{ if (browser) await browser.close(); } catch(e){}
  safeWriteJsonSync(path.join('builds','diagnostics','browser-resolve.json'), out);
  console.log('BROWSER_RESOLVE', JSON.stringify(out));
  process.exit(0);
})();
