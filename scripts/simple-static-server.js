const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.argv[2] ? parseInt(process.argv[2], 10) : 1420;
const root = path.resolve(__dirname, '..', 'dist');

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not Found');
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { send404(res); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { send404(res); return; }
    const stream = fs.createReadStream(file);
    const ext = path.extname(file).toLowerCase();
    const map = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
    res.setHeader('Content-Type', map[ext] || 'application/octet-stream');
    stream.pipe(res);
  });
});

server.listen(port, () => console.log(`static server serving ${root} on ${port}`));
process.on('SIGINT', () => process.exit(0));
