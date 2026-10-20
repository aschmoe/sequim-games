// Local stand-in for nginx: serves dist/ and forwards /api to the scoreboard.
//   DB_PATH=/tmp/scores.db node server/server.js   (in one terminal)
//   node tools/dev-server.js                        (then open http://localhost:8080)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const DIST = path.join(__dirname, '..', 'dist'), API = Number(process.env.API_PORT) || 3100, PORT = Number(process.env.PORT) || 8080;
http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const up = http.request({ host: '127.0.0.1', port: API, path: req.url, method: req.method, headers: { ...req.headers, 'x-real-ip': req.socket.remoteAddress } },
      r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', () => { res.writeHead(502); res.end('scoreboard not running'); });
    return req.pipe(up);
  }
  const file = path.join(DIST, path.normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, ''));
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': target.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
