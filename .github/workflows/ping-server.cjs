const http = require('http');

const port = process.env.PORT || 8765;

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/ux-ping')) {
    console.log('PING');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(port, () => {
  console.log(`ping-server listening on ${port}`);
});

process.on('SIGINT', () => process.exit(0));
