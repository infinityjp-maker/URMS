const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function ensureDirSync(p){ try{ fs.mkdirSync(p, { recursive: true }); } catch(e){} }
function safeWriteJsonSync(p,obj){ try{ ensureDirSync(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2),'utf8'); } catch(e){} }

(async ()=>{
  const url = process.env.URL || 'http://tauri.localhost:1420/';
  const out = { url, timestamp: Date.now(), gotoOk: false, fetchOk: false, errors: [] };
  let browser = null;
  try{
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1200 } });
    const page = await ctx.newPage();
    try{
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      out.gotoOk = true;
    } catch(e){ out.errors.push('goto:'+String(e)); }

    try{
      const res = await page.evaluate(async (u)=>{
        try{ const r = await fetch(u+'ux-ping'); const t = await r.text(); return { ok: r.ok, text: t }; } catch(e){ return { ok: false, err: String(e) }; }
      }, url.endsWith('/')?url:url+'/');
      out.fetchOk = !!(res && res.ok);
      out.fetchText = res && (res.text || res.err || null);
    } catch(e){ out.errors.push('fetch:'+String(e)); }

    try{ await page.close(); } catch(e){}
    try{ await ctx.close(); } catch(e){}
  } catch(e){ out.errors.push('browser:'+String(e)); }
  try{ if (browser) await browser.close(); } catch(e){}

  safeWriteJsonSync(path.join('builds','diagnostics','browser-preflight.json'), out);
  console.log('BROWSER_PREFLIGHT', JSON.stringify(out));
  process.exit(0);
})();
