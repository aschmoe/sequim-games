// Scoreboard housekeeping, run inside the container:
//   docker exec sequim-api node admin.js list [event]
//   docker exec sequim-api node admin.js delete <id>
//   docker exec sequim-api node admin.js clear <event|all>
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(process.env.DB_PATH || './scores.db');
const [cmd, arg] = process.argv.slice(2);
const show = rows => console.table(rows.map(r => ({ ...r, at: new Date(r.at).toISOString().slice(0, 16) })));

if (cmd === 'list') {
  show(arg ? db.prepare('SELECT * FROM scores WHERE event = ? ORDER BY score DESC').all(arg)
           : db.prepare('SELECT * FROM scores ORDER BY event, score DESC').all());
} else if (cmd === 'delete' && arg) {
  console.log(`deleted ${db.prepare('DELETE FROM scores WHERE id = ?').run(arg).changes}`);
} else if (cmd === 'clear' && arg) {
  const r = arg === 'all' ? db.prepare('DELETE FROM scores').run() : db.prepare('DELETE FROM scores WHERE event = ?').run(arg);
  console.log(`deleted ${r.changes}`);
} else {
  console.log('usage: node admin.js list [event] | delete <id> | clear <event|all>');
}
