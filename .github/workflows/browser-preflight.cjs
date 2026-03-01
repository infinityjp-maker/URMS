const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function ensureDirSync(p){ try{ fs.mkdirSync(p, { recursive: true }); } catch(e){} }
function safeWriteJsonSync(p,obj){ try{ ensureDirSync(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2),'utf8'); } catch(e){} }

(async ()=>{
  const url = process.env.URL || 'http://tauri.localhost:1420/';
  const out = { url, timestamp: Date.now(), gotoOk: false, fetchOk: false, attempts: [], errors: [] };
  let browser = null;
  try{
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP tauri.localhost 127.0.0.1'] });
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1200 } });
    const page = await ctx.newPage();
    try{
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      out.gotoOk = true;
    } catch(e){ out.errors.push('goto:'+String(e)); }

    // From the browser context, try probing likely ux-ping endpoints directly (ports 8765, 8877),
    // and fallback to the static server (1420) only as a last resort. Record each attempt.
    try{
      const hostsToTry = ['127.0.0.1','tauri.localhost'];
      const portsToTry = [8765, 8877, 1420];
      for (const h of hostsToTry) {
        for (const p of portsToTry) {
          try {
            const target = `http://${h}:${p}/ux-ping`;
            const res = await page.evaluate(async (t) => {
              try {
                const r = await fetch(t, { method: 'GET' });
                const text = await r.text().catch(() => null);
                return { ok: r.ok, status: r.status, text };
              } catch (e) { return { ok: false, err: String(e) }; }
            }, target);
            out.attempts.push({ host: h, port: p, target, result: res });
            if (res && res.ok) { out.fetchOk = true; out.fetchText = res.text || null; break; }
          } catch (innerErr) {
            out.attempts.push({ host: h, port: p, error: String(innerErr) });
          }
        }
        if (out.fetchOk) break;
      }
    } catch(e){ out.errors.push('fetch:'+String(e)); }

    try{ await page.close(); } catch(e){}
    try{ await ctx.close(); } catch(e){}
  } catch(e){ out.errors.push('browser:'+String(e)); }
  try{ if (browser) await browser.close(); } catch(e){}

  safeWriteJsonSync(path.join('builds','diagnostics','browser-preflight.json'), out);
  console.log('BROWSER_PREFLIGHT', JSON.stringify(out));
  process.exit(0);
})();
