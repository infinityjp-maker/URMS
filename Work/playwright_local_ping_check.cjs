const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async ()=>{
  const results = { serverRequests: [], consoleMessages: [], pageErrors: [], domHasMarker: false, uxPingConsole: false, exceptions: [] };

  // start simple ping server on 127.0.0.1:8765
  const server = http.createServer((req, res) => {
    const { method, url, headers } = req;
    const record = { method, url, headers, ts: Date.now() };
    // handle CORS preflight
    if (method === 'OPTIONS'){
      const origin = req.headers.origin || '*';
      res.writeHead(204, {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
      });
      results.serverRequests.push(Object.assign({ event: 'options' }, record));
      return res.end();
    }

    if (method === 'POST'){
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        record.body = body;
        record.status = 200;
        results.serverRequests.push(record);
        console.log('[ping-server] POST', url, body.slice(0,100));
        const origin = req.headers.origin || '*';
        res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Credentials': 'true' });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    // For GET/HEAD
    results.serverRequests.push(record);
    console.log('[ping-server] %s %s', method, url);
    const origin = req.headers.origin || '*';
    res.writeHead(200, { 'Content-Type':'text/plain', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Credentials': 'true' });
    res.end('ok');
  });

  server.listen(8765, '127.0.0.1');
  console.log('ping-server listening on 127.0.0.1:8765');

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    page.on('console', msg => {
      try {
        const text = msg.text();
        results.consoleMessages.push({ type: msg.type(), text, ts: Date.now() });
        if (text && text.includes('[ux-ping-ok]')) results.uxPingConsole = true;
      } catch (e) { results.exceptions.push(String(e && e.message)); }
    });
    page.on('pageerror', err => { results.pageErrors.push(String(err && (err.message||err))); });
    page.on('response', resp => {
      try {
        const url = resp.url();
        if (url.includes('/ux-ping')){
          results.serverRequests.push({ event: 'response', url, status: resp.status(), ts: Date.now() });
        }
      } catch(e){ }
    });

    const target = 'http://localhost:3000/';
    console.log('navigating to', target);
    await page.goto(target, { waitUntil: 'networkidle', timeout: 30000 });

    // wait up to 10s for ping activity
    const waitMs = 10000;
    const start = Date.now();
    while (Date.now() - start < waitMs){
      // check DOM marker
      try {
        const has = await page.evaluate(() => !!(document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-ux-ping') === 'ok'));
        if (has) { results.domHasMarker = true; }
      } catch(e) { results.exceptions.push('dom-eval:'+String(e && e.message)); }
      // short sleep
      await new Promise(r => setTimeout(r, 250));
    }

    // give a moment for any late network events
    await page.waitForTimeout(500);

    // probe serverRequests for actual POST entries (method === 'POST')
    const postRequests = results.serverRequests.filter(r => r.method === 'POST');

    const out = {
      postOccurred: postRequests.length > 0,
      postSamples: postRequests.slice(0,5),
      consoleUxPing: results.uxPingConsole,
      domMarker: results.domHasMarker,
      consoleMessages: results.consoleMessages.slice(0,50),
      pageErrors: results.pageErrors,
      exceptions: results.exceptions
    };

    const outPath = path.join(process.cwd(), 'builds', 'local-ping-check.json');
    try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch(e){}
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('WROTE', outPath);
    console.log(JSON.stringify(out, null, 2));

    await browser.close();
  } catch (e){
    console.error('TEST_ERROR', String(e && (e.message||e)));
  } finally {
    try { server.close(); } catch(e){}
  }
  process.exit(0);
})();
