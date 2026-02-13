// Lightweight ping stub server used by CI Playwright smoke workflow
// Writes PING <timestamp> <METHOD> lines to /tmp/ux-ping.<runId>.log

const http = require('http');
const fs = require('fs');

const runId = process.env.GITHUB_RUN_ID || process.env.GITHUB_RUN_NUMBER || 'local';
const logPath = `/tmp/ux-ping.${runId}.log`;

function appendLog(line){
  try{
    fs.appendFileSync(logPath, line + '\n');
  }catch(e){
    // best-effort; ignore
  }
}

const server = http.createServer((req, res) => {
  // Add strict CORS headers so fetch/sendBeacon from the frontend succeeds
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  Object.entries(headers).forEach(([k,v])=>res.setHeader(k,v));
  const ts = new Date().toISOString();
  try {
    if (req.method === 'OPTIONS'){
      appendLog(`PING ${ts} OPTIONS`);
      res.writeHead(204);
      return res.end();
    }
    if (req.url && req.url.indexOf('/ux-ping') === 0){
      // Log method-specific lines; ensure POST is explicitly logged
      appendLog(`PING ${ts} ${req.method}`);
      if (req.method === 'POST') {
        console.log(`PING ${new Date().toISOString()} POST`);
      }
      res.writeHead(200, {'Content-Type':'text/plain'});
      res.end('ok');
      return;
    }
    res.writeHead(404);
    res.end('not found');
  } catch (e) {
    try{res.writeHead(500);}catch(_){}}
});

server.listen(8765, '127.0.0.1', () => {
  const msg = `ping server listening on 127.0.0.1:8765`;
  appendLog(msg);
  console.log(msg);
});
