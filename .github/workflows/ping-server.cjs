const http = require('http');

const port = process.env.PORT || 8765;

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/ux-ping')) {
    console.log('PING');
    const body = JSON.stringify({ ok: true });
    res.writeHead(200, { 'Content-Type': 'application/json' });
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
