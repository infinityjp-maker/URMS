const http = require('http');

const port = process.env.PORT || 8765;
// Allow configuring CORS origin via environment for safer production defaults
const CORS_ALLOW_ORIGIN = (process.env.CORS_ALLOW_ORIGIN && String(process.env.CORS_ALLOW_ORIGIN)) || '*';

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/ux-ping')) {
    console.log('PING');
    // Allow browser-based fetches from the UI (CORS)
    const body = JSON.stringify({ ok: true });
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (req.method === 'OPTIONS') {
      res.writeHead(204, headers);
      res.end();
      return;
    }
    res.writeHead(200, headers);
    res.end(body);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Bind to all interfaces so browser processes can reach the server
server.listen(port, '0.0.0.0', () => {
  console.log(`ping-server listening on ${port}`);
});

process.on('SIGINT', () => process.exit(0));
