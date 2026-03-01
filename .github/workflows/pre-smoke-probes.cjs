const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

function ensureDirSync(p){ try{ fs.mkdirSync(p, { recursive: true }); } catch(e){} }
function safeWriteJsonSync(p,obj){ try{ ensureDirSync(path.dirname(p)); fs.writeFileSync(p, JSON.stringify(obj,null,2),'utf8'); } catch(e){} }

async function probePort(host, port, timeout=2000){
  return new Promise(res=>{
    const sock = net.createConnection({ host, port }, () => { sock.destroy(); res({ port, tcp: true }); });
    sock.on('error', e => { res({ port, tcp: false, err: String(e) }); });
    sock.setTimeout(timeout, () => { sock.destroy(); res({ port, tcp: false, err: 'timeout' }); });
  });
}

function fetchJsonOrText(url, timeoutMs=3000){
  return new Promise((resolve,reject)=>{
    const req = http.get(url, res => {
      let d='';
      res.on('data', c => d += c);
      res.on('end', () => {
        try{
          const j = JSON.parse(d);
          resolve(j);
        } catch(e){
          // accept plain text 'OK' as success
          const txt = (d||'').trim();
          if (txt === 'OK' || txt === 'ok') return resolve({ ok: true, text: txt });
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => { req.abort(); resolve(null); });
  });
}

(async ()=>{
  const diag = [];
  const ports = [1420, 8765, 8877];
  const hosts = ['127.0.0.1','tauri.localhost'];
  for (const p of ports){
    for (const h of hosts){
      const r = await probePort(h, p, 2000).catch(e=>({ host: h, port: p, tcp: false, err: String(e) }));
      try {
        const pathToCheck = (p === 1420) ? '/' : '/ux-ping';
        const pj = await fetchJsonOrText(`http://${h}:${p}${pathToCheck}`, 2000);
        r.http = !!(pj && pj.ok);
      } catch(e){ r.http = false; }
      r.host = h;
      diag.push(r);
    }
  }
  console.log('PRE_SMOKE_PROBES', JSON.stringify(diag));
  try { safeWriteJsonSync(path.join('builds','diagnostics','connectivity-preflight.json'), diag); } catch(e){ }
  process.exit(0);
})();
