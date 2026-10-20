// Sequim Games shared scoreboard. No dependencies: Node's http + built-in SQLite.
//   GET  /api/scores/<event>   -> { scores: [top 10] }
//   POST /api/scores/<event>   { id, name, score } -> { scores: [top 10] }
//   GET  /api/health
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT) || 3100;
const DB_PATH = process.env.DB_PATH || './scores.db';
const MAX_SCORE = 10_000_000;
const RATE = { posts: 30, windowMs: 10 * 60_000 }; // per IP

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS scores (
    id    TEXT PRIMARY KEY,           -- made by the phone, so a retried upload is not a duplicate
    event TEXT NOT NULL,
    name  TEXT NOT NULL,
    score INTEGER NOT NULL,
    at    INTEGER NOT NULL            -- ms since epoch, server clock
  );
  CREATE INDEX IF NOT EXISTS scores_board ON scores (event, score DESC, at);
`);
const topStmt = db.prepare('SELECT id, name, score, at FROM scores WHERE event = ? ORDER BY score DESC, at ASC LIMIT 10');
const insertStmt = db.prepare('INSERT OR IGNORE INTO scores (id, event, name, score, at) VALUES (?, ?, ?, ?, ?)');

// Any event id the game sends is accepted, so adding a game needs no server change.
const EVENT_RE = /^[a-z0-9-]{1,24}$/;
const ID_RE = /^[A-Za-z0-9_-]{8,40}$/;
const NAME_RE = /^[A-Z0-9!\- ]{1,10}$/;

const recent = new Map(); // ip -> timestamps of recent posts
function allowPost(ip) {
  const now = Date.now(), list = (recent.get(ip) || []).filter(t => now - t < RATE.windowMs);
  if (list.length >= RATE.posts) { recent.set(ip, list); return false; }
  list.push(now); recent.set(ip, list);
  if (recent.size > 5000) recent.clear();
  return true;
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req, limit = 2048) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/api/health') return send(res, 200, { ok: true });
    const m = url.pathname.match(/^\/api\/scores\/([^/]+)$/);
    if (!m) return send(res, 404, { error: 'not found' });
    const event = m[1];
    if (!EVENT_RE.test(event)) return send(res, 400, { error: 'bad event' });

    if (req.method === 'GET') return send(res, 200, { scores: topStmt.all(event) });

    if (req.method === 'POST') {
      // nginx is the only way in (the port is bound to 127.0.0.1) and it sets X-Real-IP
      if (!allowPost(req.headers['x-real-ip'] || req.socket.remoteAddress)) return send(res, 429, { error: 'slow down' });
      let b;
      try { b = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: 'bad body' }); }
      const name = typeof b?.name === 'string' ? b.name.trim().toUpperCase() : '';
      const { id, score } = b || {};
      if (typeof id !== 'string' || !ID_RE.test(id)) return send(res, 400, { error: 'bad id' });
      if (!NAME_RE.test(name)) return send(res, 400, { error: 'bad name' });
      if (!Number.isInteger(score) || score <= 0 || score > MAX_SCORE) return send(res, 400, { error: 'bad score' });
      insertStmt.run(id, event, name, score, Date.now());
      return send(res, 200, { scores: topStmt.all(event) });
    }
    send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: 'server error' });
  }
});

server.listen(PORT, () => console.log(`scoreboard listening on ${PORT}, db ${DB_PATH}`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { server.close(); db.close(); process.exit(0); });
