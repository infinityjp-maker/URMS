const { chromium } = require('playwright');
const http = require('http');

async function fetchJson(url, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e){ reject(e) } });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('timeout')) });
  });
}

(async () => {
  try {
    const list = await fetchJson('http://127.0.0.1:9222/json/list', 5000);
    const target = list[0];
    const versionInfo = await fetchJson('http://127.0.0.1:9222/json/version', 2000).catch(()=>null);
    const browserEndpoint = (versionInfo && versionInfo.webSocketDebuggerUrl) ? versionInfo.webSocketDebuggerUrl : 'http://127.0.0.1:9222';
    const browser = await chromium.connectOverCDP(browserEndpoint);
    const contexts = browser.contexts();
    let page = contexts.length ? (contexts[0].pages()[0] || await contexts[0].newPage()) : await (await browser.newContext()).newPage();
    try { await page.goto(target.url, { waitUntil: 'load', timeout: 5000 }); } catch(e){}

    const info = await page.evaluate(() => {
      try {
        const ua = navigator.userAgent || null;
        const scripts = Array.from(document.querySelectorAll('script')).map(s=>({src:s.getAttribute('src'), type:s.getAttribute('type')}));
        // module injection test
        try {
          window.__MODULE_TEST = undefined;
          const s = document.createElement('script');
          s.type = 'module';
          s.textContent = "window.__MODULE_TEST = typeof document !== 'undefined' ? 'module-executed' : 'no';";
          document.head.appendChild(s);
        } catch(e) { }
        const moduleTest = typeof window.__MODULE_TEST !== 'undefined' ? window.__MODULE_TEST : null;
        return { ua, scripts, moduleTest };
      } catch(e) { return { error: String(e) } }
    }).catch(e=>({error:String(e)}));

    console.log(JSON.stringify({ target, info }, null, 2));
    try { await browser.close(); } catch(e){}
    process.exit(0);
  } catch (err) { console.error('ERROR', err && err.message || err); process.exit(2); }
})();
