// ===== engine: screen, text, drawing, input, audio, scores =====
const W = 320, H = 180;
const screenEl = document.getElementById('screen');
const ctx = screenEl.getContext('2d');
ctx.imageSmoothingEnabled = false;

// size to the box the page actually has, which inside an embed can be smaller than the window
function fitScreen() {
  const b = document.body, de = document.documentElement;
  const bw = Math.min(b.clientWidth || innerWidth, de.clientWidth || innerWidth, innerWidth);
  const bh = Math.min(b.clientHeight || innerHeight, de.clientHeight || innerHeight, innerHeight);
  const s = Math.min(bw / W, bh / H);
  screenEl.style.width = Math.floor(W * s) + 'px';
  screenEl.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', fitScreen); fitScreen();
try { new ResizeObserver(fitScreen).observe(document.body); } catch (_) {}

// --- crisp bitmap text (thresholded web fonts, cached per string) ---
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
const textCache = new Map();
const measureCtx = document.createElement('canvas').getContext('2d');
function textBitmap(s, col, f, size) {
  const key = s + '|' + col + '|' + f + '|' + size;
  let b = textCache.get(key);
  if (b) return b;
  if (textCache.size > 800) textCache.clear();
  const font = `${size}px ${f === 's' ? '"Silkscreen"' : '"Press Start 2P"'}, monospace`;
  measureCtx.font = font;
  b = document.createElement('canvas');
  b.width = Math.ceil(measureCtx.measureText(s).width) + 2; b.height = size + 6;
  const x = b.getContext('2d', { willReadFrequently: true });
  x.font = font; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(s, 1, 1);
  const d = x.getImageData(0, 0, b.width, b.height), p = d.data, [r, g, bl] = hex(col);
  for (let i = 0; i < p.length; i += 4) { p[i + 3] = p[i + 3] > 110 ? 255 : 0; p[i] = r; p[i + 1] = g; p[i + 2] = bl; }
  x.putImageData(d, 0, 0);
  textCache.set(key, b);
  return b;
}
function T(c, s, x, y, col, o = {}) {
  const b = textBitmap(String(s), col, o.f, o.size || 8);
  let dx = x; if (o.a === 'c') dx = x - b.width / 2; else if (o.a === 'r') dx = x - b.width;
  c.drawImage(b, Math.round(dx) - 1, Math.round(y) - 1);
  return b.width - 2;
}
function TS(c, s, x, y, col, sh, o = {}) { T(c, s, x + 1, y + 1, sh, o); return T(c, s, x, y, col, o); }
function TO(c, s, x, y, col, out, sh, o = {}) {
  if (sh) T(c, s, x + 2, y + 2, sh, o);
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) T(c, s, x + a, y + b, out, o);
  return T(c, s, x, y, col, o);
}

// --- pixel drawing helpers ---
function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); }
function box(c, x, y, w, h, fill, border, bw = 1) { R(c, x, y, w, h, border); R(c, x + bw, y + bw, w - 2 * bw, h - 2 * bw, fill); }
function disc(c, cx, cy, r, col) { c.fillStyle = col; cx = Math.round(cx); cy = Math.round(cy); for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y + r * .6)); c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } }
function line(c, x0, y0, x1, y1, col) { c.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1); }
function blit(c, img, x, y, s = 1, flip = false) {
  x = Math.round(x); y = Math.round(y);
  if (flip) { c.save(); c.translate(x + img.width * s, y); c.scale(-1, 1); c.drawImage(img, 0, 0, img.width * s, img.height * s); c.restore(); }
  else c.drawImage(img, x, y, img.width * s, img.height * s);
}
function blitRot(c, img, cx, cy, ang) { c.save(); c.translate(Math.round(cx), Math.round(cy)); c.rotate(ang); c.drawImage(img, -img.width / 2, -img.height / 2); c.restore(); }
function bands(c, cols, hs, y = 0) { cols.forEach((col, i) => { R(c, 0, y, W, hs[i], col); y += hs[i]; }); return y; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inRect = (p, x, y, w, h) => p.x >= x && p.x < x + w && p.y >= y && p.y < y + h;

// --- input: pointers (touch + mouse) and keys, read per frame ---
const Input = {
  ptrs: new Map(), keys: new Set(), pressed: new Set(), taps: [], swipes: [], downs: [], ups: [],
  toGame(e) { const r = screenEl.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; },
  held(fn) { for (const p of this.ptrs.values()) if (!p.ui && fn(p)) return true; return false; },
  key(...codes) { return codes.some(k => this.keys.has(k)); },
  keyPressed(...codes) { return codes.some(k => this.pressed.has(k)); },
  tapIn(x, y, w, h) { const i = this.taps.findIndex(t => inRect(t, x, y, w, h)); if (i < 0) return false; this.taps.splice(i, 1); return true; },
  endFrame() { this.taps = []; this.swipes = []; this.downs = []; this.ups = []; this.pressed.clear(); },
};
// No preventDefault here: it would stop a click from focusing the page, and when the game
// runs inside a frame (the artifact viewer, an embed) the keyboard would never reach it.
screenEl.addEventListener('pointerdown', e => {
  Sound.unlock();
  try { window.focus(); screenEl.focus({ preventScroll: true }); } catch (_) {}
  try { screenEl.setPointerCapture(e.pointerId); } catch (_) {}
  const g = Input.toGame(e);
  const ui = Shell.isUiPoint(g);
  Input.ptrs.set(e.pointerId, { ...g, sx: g.x, sy: g.y, t: performance.now(), swiped: false, ui });
  if (!ui) Input.downs.push({ id: e.pointerId, ...g });
});
screenEl.addEventListener('pointermove', e => {
  const p = Input.ptrs.get(e.pointerId); if (!p) return;
  Object.assign(p, Input.toGame(e));
  if (!p.swiped && p.sy - p.y > 14 && performance.now() - p.t < 450) { p.swiped = true; Input.swipes.push({ dir: 'up', x: p.x, y: p.y }); }
});
function endPtr(e) {
  const p = Input.ptrs.get(e.pointerId); if (!p) return;
  Input.ups.push({ id: e.pointerId, x: p.x, y: p.y });
  if (!p.swiped && Math.hypot(p.x - p.sx, p.y - p.sy) < 10 && performance.now() - p.t < 400) Input.taps.push({ x: p.sx, y: p.sy });
  Input.ptrs.delete(e.pointerId);
}
screenEl.addEventListener('pointerup', endPtr);
screenEl.addEventListener('pointercancel', e => { const p = Input.ptrs.get(e.pointerId); if (p) Input.ups.push({ id: e.pointerId, x: p.x, y: p.y, cancel: true }); Input.ptrs.delete(e.pointerId); });
screenEl.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => { if (!Input.keys.has(e.code)) Input.pressed.add(e.code); Input.keys.add(e.code); Sound.unlock(); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => Input.keys.delete(e.code));
addEventListener('blur', () => { Input.keys.clear(); Input.ptrs.clear(); });

// --- sound: tiny Web Audio synth, unlocked on first touch ---
const Sound = {
  ac: null, master: null, on: true,
  unlock() {
    if (!this.ac) { try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ac.createGain(); this.master.gain.value = this.on ? .5 : 0;
      const comp = this.ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .2;
      const make = this.ac.createGain(); make.gain.value = 1.6; this.master.connect(comp); comp.connect(make); make.connect(this.ac.destination); } catch (_) { return; } }
    if (this.ac.state === 'suspended') this.ac.resume();
  },
  toggle() { this.on = !this.on; if (this.master) this.master.gain.value = this.on ? .5 : 0; try { localStorage.setItem('sequim:sound', this.on ? '1' : '0'); } catch (_) {} },
  // a submix an event can cut off all at once (e.g. a song scheduled ahead, when the player quits)
  bus() { if (!this.ac) return null; const g = this.ac.createGain(); g.connect(this.master); return g; },
  tone(freq, dur, { type = 'square', vol = .15, slide = 0, delay = 0, at, out } = {}) {
    if (!this.ac) return; const t = at ?? this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + dur + .02);
  },
  noise(dur, { vol = .25, freq = 1200, delay = 0, at, out, type = 'lowpass' } = {}) {
    if (!this.ac) return; const t = at ?? this.ac.currentTime + delay;
    const b = this.ac.createBuffer(1, Math.ceil(this.ac.sampleRate * dur), this.ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    s.buffer = b; f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out || this.master); s.start(t);
  },
  // a subtractive synth note: oscillator into a resonant low-pass whose cutoff falls with an envelope
  synth(freq, dur, { type = 'sawtooth', cutoff = 900, env = 2400, q = 8, vol = .12, delay = 0, at, out, detune = 0 } = {}) {
    if (!this.ac) return; const t = at ?? this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    f.type = 'lowpass'; f.Q.value = q; f.frequency.setValueAtTime(cutoff + env, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, cutoff), t + dur * .8);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + dur + .05);
  },
  kick({ at, out, vol = .7 } = {}) { if (!this.ac) return; const t = at ?? this.ac.currentTime; const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + .04); g.gain.exponentialRampToValueAtTime(.0001, t + .4);
    o.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + .42);
    this.noise(.012, { at: t, out, vol: vol * .5, freq: 3000, type: 'highpass' }); },
  clap({ at, out, vol = .3 } = {}) { if (!this.ac) return; const t = at ?? this.ac.currentTime;
    for (const d of [0, .012, .024]) this.noise(d ? .03 : .16, { at: t + d, out, vol, freq: 1400, type: 'bandpass' });
    this.tone(190, .07, { at: t, out, type: 'triangle', vol: vol * .6 }); },
  // a held voice an event can steer every frame (engine hum, drones)
  voice(type = 'sawtooth', cutoff = 900) {
    if (!this.ac) return { set() {}, stop() {} };
    const o = this.ac.createOscillator(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    o.type = type; f.type = 'lowpass'; f.frequency.value = cutoff; g.gain.value = 0;
    o.connect(f); f.connect(g); g.connect(this.master); o.start();
    const ac = this.ac;
    return {
      set(freq, vol, cut) { const t = ac.currentTime; o.frequency.setTargetAtTime(freq, t, .05); g.gain.setTargetAtTime(vol, t, .05); if (cut) f.frequency.setTargetAtTime(cut, t, .05); },
      stop() { const t = ac.currentTime; g.gain.setTargetAtTime(0, t, .03); o.stop(t + .2); },
    };
  },
  jingle(notes, { type = 'square', vol = .12, step = .1 } = {}) { notes.forEach((n, i) => { if (n) this.tone(n, step * .9, { type, vol, delay: i * step }); }); },
};
try { Sound.on = localStorage.getItem('sequim:sound') !== '0'; } catch (_) {}

// Shared scoreboard. The game reads a cached copy synchronously; uploads and refreshes happen
// in the background. A score is kept on the phone until the server confirms it, so nothing is
// lost offline (or when the page runs somewhere with no /api, like a file:// build).
const Scores = {
  api: '/api/scores/',
  online: null,                                  // null = not asked yet, then true / false
  boardKey: id => 'sequim:board:' + id,          // last top 10 from the server
  pendingKey: 'sequim:pending',                  // scores not yet confirmed by the server
  read(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } },
  write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  list(id) {
    const board = this.read(this.boardKey(id), []);
    const mine = this.read(this.pendingKey, []).filter(p => p.event === id && !board.some(b => b.id === p.id));
    return [...board, ...mine].sort((a, b) => b.score - a.score).slice(0, 10);
  },
  best(id) { return this.list(id)[0] || null; },
  qualifies(id, score) { const l = this.list(id); return score > 0 && (l.length < 10 || score > l[l.length - 1].score); },
  // returns the new entry's id so the scores screen can highlight it
  add(id, name, score) {
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 10), event: id, name, score, at: Date.now() };
    this.write(this.pendingKey, [...this.read(this.pendingKey, []), entry]);
    this.flush();
    return entry.id;
  },
  async call(id, opts) {
    const r = await fetch(this.api + id, { ...opts, headers: { 'Content-Type': 'application/json' } });
    const body = (r.headers.get('content-type') || '').includes('json') ? await r.json() : null;
    if (!body) throw new Error('no scoreboard here');
    return { status: r.status, body };
  },
  flush() { return this._flushing ||= this._flush().finally(() => { this._flushing = null; }); },
  async _flush() {
    for (const p of this.read(this.pendingKey, [])) {
      try {
        const { status, body } = await this.call(p.event, { method: 'POST', body: JSON.stringify({ id: p.id, name: p.name, score: p.score }) });
        if (status === 429 || status >= 500) { this.online = status < 500; return; }
        if (body.scores) this.write(this.boardKey(p.event), body.scores);
        this.write(this.pendingKey, this.read(this.pendingKey, []).filter(q => q.id !== p.id)); // saved, or rejected for good
        this.online = true;
      } catch (_) { this.online = false; return; }
    }
  },
  async refresh(id) {
    await this.flush();
    try { const { status, body } = await this.call(id); if (status === 200 && body.scores) { this.write(this.boardKey(id), body.scores); this.online = true; } }
    catch (_) { this.online = false; }
  },
};
// on a computer, show keyboard hints instead of touch hints
const KEYBOARD = matchMedia('(pointer: fine)').matches;
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const fmt = n => Math.round(n).toLocaleString('en-US');
