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

function fetchJson(url, timeoutMs=3000){
  return new Promise((resolve,reject)=>{
    const req = http.get(url, res => {
      let d='';
      res.on('data', c => d += c);
      res.on('end', () => { try{ resolve(JSON.parse(d)); } catch(e){ resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => { req.abort(); resolve(null); });
  });
}

(async ()=>{
  const diag = [];
  const ports = [1420, 8765, 8877];
  for (const p of ports){
    const r = await probePort('127.0.0.1', p, 2000).catch(e=>({ port: p, tcp: false, err: String(e) }));
    try { const pj = await fetchJson(`http://127.0.0.1:${p}/ux-ping`, 2000); r.http = !!(pj && pj.ok); } catch(e){ r.http = false; }
    diag.push(r);
  }
  console.log('PRE_SMOKE_PROBES', JSON.stringify(diag));
  try { safeWriteJsonSync(path.join('builds','diagnostics','connectivity-preflight.json'), diag); } catch(e){ }
  process.exit(0);
})();
