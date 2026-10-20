// ===== shell: event registry + the screens every event shares =====
const PORTRAIT = {};
// To add an event: call registerEvent({...}) with an id, menu text, an icon, and create(api).
// create(api) returns { update(dt), draw(ctx), destroy?() } and calls api.finish({ score, stats }) when the run ends.
const EVENTS = [];
function registerEvent(def) { EVENTS.push(def); }

function cable(c, x0, y0, x1, y1, sag, col, dark) { const cx = (x0 + x1) / 2, cy = Math.max(y0, y1) + sag; for (let i = 0; i <= 80; i++) { const t = i / 80, x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1; R(c, x - 1, y + 1, 2, 1, dark); R(c, x - 1, y - 1, 2, 2, col); } }
function d20(c, cx, cy, r, num, big) {
  const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  const poly = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([a, b], i) => i ? c.lineTo(a, b) : c.moveTo(a, b)); c.closePath(); c.fill(); };
  poly(p, '#0e0c14'); const q = p.map(([a, b]) => [cx + (a - cx) * .86, cy + (b - cy) * .86]); poly(q, '#c0323a');
  const t = [[cx, cy - r * .55], [cx + r * .5, cy + r * .32], [cx - r * .5, cy + r * .32]]; poly(t, '#e05a5a');
  [[0, 4], [1, 0], [2, 2]].forEach(([a, b]) => line(c, Math.round(t[a][0]), Math.round(t[a][1]), Math.round(q[b][0]), Math.round(q[b][1]), '#7a1a20'));
  if (num) { if (big) TO(c, num, cx, cy - 6, '#ffffff', '#0e0c14', null, { a: 'c' }); else T(c, num, cx, cy - 3, '#fff', { f: 's', a: 'c' }); }
}
const ICONS = {
  board(c, x, y) { R(c, x + 2, y + 12, 20, 3, '#ffd84a'); R(c, x + 2, y + 15, 20, 1, '#0e0c14'); R(c, x + 6, y + 16, 12, 2, '#14141c'); R(c, x + 7, y + 16, 10, 1, '#4fd6ff'); disc(c, x + 5, y + 19, 2, '#c8c8d4'); disc(c, x + 19, y + 19, 2, '#c8c8d4'); blit(c, spr('bolt'), x + 9, y + 2); },
  synth(c, x, y) { box(c, x + 2, y + 2, 20, 20, '#d8d8de', '#0e0c14'); disc(c, x + 8, y + 8, 3, '#2a2a30'); R(c, x + 8, y + 5, 1, 3, '#fff'); disc(c, x + 16, y + 16, 2, '#0e0c14'); R(c, x + 15, y + 15, 2, 2, '#c8c8d4'); cable(c, x + 16, y + 16, x + 7, y + 18, 4, '#e04a3a', '#8a1c18'); },
  masks(c, x, y) { disc(c, x + 9, y + 10, 7, '#ffd84a'); disc(c, x + 15, y + 14, 7, '#a04cd0'); for (const [a, b, w] of [[6, 8, 2], [10, 8, 2], [6, 12, 6], [7, 13, 4], [12, 12, 2], [17, 12, 2], [13, 18, 5], [12, 17, 1], [18, 17, 1]]) R(c, x + a, y + b, w, w > 2 ? 1 : (w === 1 ? 1 : 2), '#0e0c14'); },
  d20(c, x, y) { d20(c, x + 12, y + 12, 11, '20'); },
};

// placeholders keep the menu honest about what is coming
const PLANNED = [
  { id: 'volt', name: 'VOLT RUN', star: 'sebastian', sub: 'SEBASTIAN  /  ELECTRIC SKATEBOARD', icon: 'board' },
  { id: 'patch', name: 'PATCH PANIC', star: 'sebastian', sub: 'SEBASTIAN  /  MOOG SYNTH', icon: 'synth' },
  { id: 'stage', name: 'OPENING NIGHT', star: 'misha', sub: 'MISHA  /  AVANT-GARDE THEATRE', icon: 'masks' },
  { id: 'dnd', name: 'ROLL FOR INITIATIVE', star: 'misha', sub: 'MISHA  /  DUNGEONS & DRAGONS', icon: 'd20' },
];
function menuEvents() {
  const list = PLANNED.map(p => EVENTS.find(e => e.id === p.id) || p);
  for (const e of EVENTS) if (!list.includes(e)) list.push(e);
  // a personal link (#misha or /misha) lists that brother's events first
  const who = (location.hash.slice(1) || location.pathname.split('/').pop() || '').toLowerCase();
  if (who === 'misha' || who === 'sebastian') list.sort((a, b) => (b.star === who) - (a.star === who));
  return list;
}

const Shell = {
  scene: null, t: 0,
  go(scene) { this.scene?.leave?.(); this.scene = scene; scene.enter?.(); },
  isUiPoint(p) { return this.scene?.ui ? inRect(p, 296, 0, 24, 16) : false; },
};

// ---------- title: lavender fields under the Olympic Mountains ----------
const titleArt = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; let x = c.getContext('2d'); return { c, x, drawn: false };
})();
function drawTitleArt(c) {
  bands(c, ['#22336e', '#2e4486', '#40589e', '#5a6eb4', '#7c84c0', '#a894c4', '#d8a6b8', '#f2bea8', '#f8d4a4'], [14, 11, 10, 9, 8, 8, 8, 8, 9]);
  disc(c, 236, 70, 10, '#fff0b0'); disc(c, 236, 70, 8, '#ffe27a');
  // Olympic Mountains: jagged ridge with snow on the high peaks
  const ridge = x => 66 + 10 * Math.sin(x * .045) + 6 * Math.sin(x * .13 + 1) + 4 * Math.abs(Math.sin(x * .31)) - (x > 90 && x < 150 ? 10 * Math.sin((x - 90) / 60 * Math.PI) : 0);
  for (let x = 0; x < W; x++) {
    const top = Math.round(ridge(x));
    for (let y = top; y < 96; y++) {
      const snow = top < 64 && y < top + (64 - top) * .7 + 2;
      c.fillStyle = snow ? (x % 7 === 0 && y > top + 1 ? '#c8d0ec' : '#eef0fb') : (y < top + 10 ? '#6a72a8' : '#5a6098');
      c.fillRect(x, y, 1, 1);
    }
  }
  for (let x = 0; x < W; x++) { const top = Math.round(86 + 4 * Math.sin(x * .05 + 2) + 2 * Math.sin(x * .19)); R(c, x, top, 1, 100 - top, '#2e5040'); }
  // red barn on the horizon
  R(c, 34, 82, 18, 11, '#b8322a'); c.fillStyle = '#7a1e1a'; c.beginPath(); c.moveTo(32, 83); c.lineTo(43, 75); c.lineTo(54, 83); c.fill(); R(c, 40, 87, 6, 6, '#f2e6d0'); R(c, 42, 87, 2, 6, '#b8322a');
  // lavender rows in perspective
  const vx = 160, vy = 92;
  for (let y = 96; y < H; y++) {
    const t = (y - vy) / (H - vy);
    for (let x = 0; x < W; x++) {
      const u = (x - vx) / (t * 34) + 100.5; const f = u - Math.floor(u);
      let col;
      if (f > .2 && f < .8) col = ((x * 7 + y * 13) % 11 < (t > .5 ? 3 : 1)) ? '#c8a0f4' : (y % 2 ? '#8a5ac8' : '#9a66d8');
      else col = t > .45 ? '#3a6a34' : '#2e5a2e';
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
  }
}
const TitleScene = {
  enter() { if (!titleArt.drawn) { drawTitleArt(titleArt.x); titleArt.drawn = true; } this.t = 0; },
  update(dt) { this.t += dt; if (Input.taps.length || Input.keyPressed('Enter', 'Space')) { Sound.jingle([523, 659, 784, 1047], { step: .07 }); Shell.go(MenuScene); } },
  draw(c) {
    c.drawImage(titleArt.c, 0, 0);
    TO(c, 'SEQUIM', 160, 14, '#ffffff', '#2a1250', '#8a4ad0', { size: 16, a: 'c' });
    TO(c, 'GAMES', 160, 34, '#ffd84a', '#2a1250', '#a03a8a', { size: 24, a: 'c' });
    if (Math.floor(this.t * 2) % 2 === 0) TO(c, KEYBOARD ? (document.hasFocus() ? 'PRESS ENTER' : 'CLICK TO START') : 'TAP TO START', 160, 130, '#ffffff', '#2a1250', null, { a: 'c' });
    T(c, '(C) 1987 SEQUIM SOFTWARE', 160, 166, '#f2e6ff', { f: 's', a: 'c' });
    blit(c, PORTRAIT.seb, 8, 142); blit(c, PORTRAIT.misha, 280, 142);
  },
};

// ---------- event menu ----------
const MenuScene = {
  enter() { this.list = menuEvents(); this.t = 0; this.flash = null; this.sel = this.sel ?? 0; },
  update(dt) {
    this.t += dt;
    const pick = i => { const e = this.list[i]; this.sel = i;
      if (e.create) { Sound.tone(880, .08); Shell.go(new PlayScene(e)); }
      else { Sound.tone(160, .12, { type: 'triangle' }); this.flash = { i, t: 1.2 }; } };
    this.list.forEach((e, i) => { if (Input.tapIn(8, 26 + i * 32, 304, 28)) pick(i); });
    if (Input.keyPressed('ArrowDown', 'KeyS')) { this.sel = (this.sel + 1) % this.list.length; Sound.tone(520, .04); }
    if (Input.keyPressed('ArrowUp', 'KeyW')) { this.sel = (this.sel + this.list.length - 1) % this.list.length; Sound.tone(520, .04); }
    if (Input.keyPressed('Enter', 'Space')) pick(this.sel);
    if (Input.tapIn(0, 156, 110, 24) || Input.keyPressed('KeyH')) Shell.go(new ScoresScene(this.list.find(e => e.create)?.id, -1, MenuScene));
    if (Input.tapIn(220, 156, 100, 24) || Input.keyPressed('KeyM')) { Sound.toggle(); Sound.tone(660, .06); }
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
  },
  draw(c) {
    R(c, 0, 0, W, H, '#14102a');
    bands(c, ['#2e4486', '#7c84c0', '#d8a6b8', '#f8d4a4'], [6, 5, 5, 4]);
    TS(c, 'SELECT EVENT', 160, 6, '#ffffff', '#2a1250', { a: 'c' });
    this.list.forEach((e, i) => {
      const y = 26 + i * 32, live = !!e.create;
      const sel = KEYBOARD && i === this.sel;
      box(c, 8, y, 304, 28, live ? '#241c4c' : '#1a1636', sel ? '#ffd84a' : live ? '#a070e0' : '#2e2856', live || sel ? 2 : 1);
      box(c, 11, y + 2, 24, 24, '#0e0c22', '#2e2856'); ICONS[e.icon]?.(c, 11, y + 2);
      T(c, e.name, 42, y + 5, live ? '#ffd84a' : '#8a84b0');
      T(c, e.sub, 42, y + 16, live ? '#c8b8f0' : '#6a6490', { f: 's' });
      const best = live ? Scores.best(e.id) : null;
      if (this.flash?.i === i) T(c, 'COMING SOON', 306, y + 10, '#ff8ab0', { f: 's', a: 'r' });
      else if (!live) T(c, 'SOON', 306, y + 10, '#6a6490', { f: 's', a: 'r' });
      else if (best) { T(c, fmt(best.score), 306, y + 5, '#ffffff', { a: 'r' }); T(c, best.name, 306, y + 16, '#ffd84a', { f: 's', a: 'r' }); }
      else T(c, KEYBOARD ? 'ENTER TO PLAY' : 'TAP TO PLAY', 306, y + 10, '#ffffff', { f: 's', a: 'r' });
    });
    T(c, KEYBOARD ? 'H: HIGH SCORES' : 'HIGH SCORES', 10, 164, '#4fd6ff', { f: 's' });
    if (KEYBOARD) T(c, 'ARROWS + ENTER', 160, 164, '#8a84b0', { f: 's', a: 'c' });
    T(c, (KEYBOARD ? 'M: ' : '') + (Sound.on ? 'SOUND ON' : 'SOUND OFF'), 310, 164, '#4fd6ff', { f: 's', a: 'r' });
  },
};

// ---------- playing an event, with a shared pause button ----------
class PlayScene {
  constructor(def) { this.def = def; this.ui = true; }
  enter() {
    this.paused = false;
    this.inst = this.def.create({ finish: r => this.finish(r) });
  }
  leave() { this.inst?.destroy?.(); }
  finish(result) { this.inst?.destroy?.(); this.inst = null; Shell.go(new ResultsScene(this.def, result)); }
  update(dt) {
    if (Input.tapIn(296, 0, 24, 16) || Input.keyPressed('Escape', 'KeyP')) { this.paused = !this.paused; this.inst?.pause?.(this.paused); Sound.tone(440, .05); }
    if (this.paused) {
      if (Input.tapIn(110, 70, 100, 18) || Input.keyPressed('Enter', 'Space')) { this.paused = false; this.inst?.pause?.(false); }
      else if (Input.tapIn(110, 96, 100, 18) || Input.keyPressed('KeyQ')) Shell.go(MenuScene);
      return;
    }
    this.inst?.update(dt);
  }
  draw(c) {
    this.inst?.draw(c);
    if (KEYBOARD && !document.hasFocus() && !this.paused) { box(c, 90, 150, 140, 13, '#0e0c14', '#ffd84a'); T(c, 'CLICK HERE FOR KEYBOARD', 160, 153, '#ffd84a', { f: 's', a: 'c' }); }
    box(c, 304, 2, 13, 11, '#0e0c14', '#ffffff'); R(c, 308, 5, 2, 5, '#ffffff'); R(c, 312, 5, 2, 5, '#ffffff');
    if (this.paused) {
      c.globalAlpha = .7; R(c, 0, 0, W, H, '#0a0818'); c.globalAlpha = 1;
      TO(c, 'PAUSED', 160, 44, '#ffd84a', '#0e0c14', null, { a: 'c' });
      box(c, 110, 70, 100, 18, '#241c4c', '#a070e0'); T(c, 'RESUME', 160, 75, '#ffffff', { a: 'c' });
      box(c, 110, 96, 100, 18, '#241c4c', '#a070e0'); T(c, 'QUIT', 160, 101, '#ffffff', { a: 'c' });
      if (KEYBOARD) T(c, 'ENTER: RESUME   Q: QUIT', 160, 124, '#c8b8f0', { f: 's', a: 'c' });
    }
  }
}

// ---------- results ----------
class ResultsScene {
  constructor(def, r) { this.def = def; this.r = r; this.t = 0; }
  enter() { Sound.jingle([392, 523, 659, 784, 659, 784], { step: .09 }); }
  update(dt) {
    this.t += dt;
    if (this.t > .8 && (Input.taps.length || Input.keyPressed('Enter', 'Space'))) {
      if (Scores.qualifies(this.def.id, this.r.score)) Shell.go(new NameScene(this.def, this.r.score));
      else Shell.go(new ScoresScene(this.def.id, -1, MenuScene));
    }
  }
  draw(c) {
    R(c, 0, 0, W, H, '#14102a'); bands(c, ['#2e4486', '#7c84c0', '#d8a6b8', '#f8d4a4'], [6, 5, 5, 4]);
    TS(c, this.def.name, 160, 6, '#ffffff', '#2a1250', { a: 'c' });
    if (this.r.headline) TO(c, this.r.headline, 160, 30, '#ff8ab0', '#0e0c14', null, { a: 'c' });
    TO(c, fmt(this.r.score * clamp(this.t / .8, 0, 1)), 160, 46, '#ffd84a', '#0e0c14', '#a03a8a', { size: 24, a: 'c' });
    (this.r.stats || []).forEach(([k, v], i) => { const y = 86 + i * 13; T(c, k, 70, y, '#c8b8f0', { f: 's' }); T(c, v, 250, y, '#ffffff', { a: 'r' }); });
    if (this.t > .8 && Math.floor(this.t * 2) % 2 === 0) T(c, KEYBOARD ? 'PRESS ENTER' : 'TAP TO CONTINUE', 160, 164, '#ffffff', { f: 's', a: 'c' });
  }
}

// ---------- arcade name entry ----------
const KEYS = ['ABCDEFGHIJ', 'KLMNOPQRST', ['U', 'V', 'W', 'X', 'Y', 'Z', '-', '!', '<', 'OK']];
class NameScene {
  constructor(def, score) { this.def = def; this.score = score; this.name = ''; this.t = 0; try { this.name = localStorage.getItem('sequim:lastname') || ''; } catch (_) {} }
  update(dt) {
    this.t += dt;
    KEYS.forEach((row, ri) => [...row].forEach((k, ki) => { if (Input.tapIn(12 + ki * 30, 106 + ri * 22, 26, 18)) this.press(k); }));
    for (const code of Input.pressed) {
      if (code.startsWith('Key')) this.press(code.slice(3)); else if (code === 'Backspace') this.press('<'); else if (code === 'Enter') this.press('OK'); else if (code === 'Minus') this.press('-');
    }
  }
  press(k) {
    if (k === '<') { this.name = this.name.slice(0, -1); Sound.tone(300, .05); return; }
    if (k === 'OK') { if (!this.name) return; try { localStorage.setItem('sequim:lastname', this.name); } catch (_) {} const mine = Scores.add(this.def.id, this.name, this.score); Sound.jingle([523, 784, 1047], { step: .08 }); Shell.go(new ScoresScene(this.def.id, mine, MenuScene)); return; }
    if (this.name.length < 10) { this.name += k; Sound.tone(600 + this.name.length * 40, .05); }
  }
  draw(c) {
    R(c, 0, 0, W, H, '#0e0c1e');
    TS(c, 'NEW HIGH SCORE!', 160, 8, '#ffd84a', '#a03a8a', { a: 'c' });
    T(c, fmt(this.score), 160, 24, '#ffffff', { a: 'c' });
    T(c, KEYBOARD ? 'TYPE YOUR NAME, THEN PRESS ENTER' : 'ENTER YOUR NAME', 160, 44, '#c8b8f0', { f: 's', a: 'c' });
    for (let i = 0; i < 10; i++) { const bx = 80 + i * 16; R(c, bx, 80, 12, 1, i === this.name.length && Math.floor(this.t * 3) % 2 ? '#ffd84a' : '#5a5a8a'); if (this.name[i]) T(c, this.name[i], bx + 2, 68, '#ffffff'); }
    KEYS.forEach((row, ri) => [...row].forEach((k, ki) => { const kx = 12 + ki * 30, ky = 106 + ri * 22, ok = k === 'OK'; box(c, kx, ky, 26, 18, ok ? '#3a2a7a' : '#1a1a3a', ok ? '#ffd84a' : '#3a3a7a'); T(c, k, kx + 13, ky + 5, ok ? '#ffd84a' : '#ffffff', { a: 'c' }); }));
  }
}

// ---------- high scores ----------
class ScoresScene {
  // mine: id of the score just entered, highlighted in the list
  constructor(id, mine, back) { this.ids = EVENTS.map(e => e.id); this.i = Math.max(0, this.ids.indexOf(id)); this.mine = mine; this.back = back; this.t = 0; Scores.refresh(this.ids[this.i]); }
  update(dt) {
    this.t += dt;
    if (this.ids.length > 1 && (Input.tapIn(0, 0, 40, 22) || Input.keyPressed('ArrowLeft'))) { this.i = (this.i + this.ids.length - 1) % this.ids.length; Scores.refresh(this.ids[this.i]); }
    else if (this.ids.length > 1 && (Input.tapIn(280, 0, 40, 22) || Input.keyPressed('ArrowRight'))) { this.i = (this.i + 1) % this.ids.length; Scores.refresh(this.ids[this.i]); }
    else if (this.t > .4 && (Input.taps.length || Input.keyPressed('Enter', 'Space', 'Escape'))) Shell.go(this.back);
  }
  draw(c) {
    R(c, 0, 0, W, H, '#0e0c1e');
    const def = EVENTS[this.i];
    TS(c, (def?.name || '') + ' - HIGH SCORES', 160, 6, '#ffd84a', '#a03a8a', { a: 'c' });
    if (this.ids.length > 1) { T(c, '<', 8, 6, '#4fd6ff'); T(c, '>', 304, 6, '#4fd6ff'); }
    const l = def ? Scores.list(def.id) : [];
    if (!l.length) T(c, 'NO SCORES YET. GO SET ONE!', 160, 80, '#c8b8f0', { f: 's', a: 'c' });
    l.slice(0, 10).forEach((s, i) => {
      const y = 24 + i * 13, me = s.id === this.mine, col = me ? '#4fd6ff' : i === 0 ? '#ffd84a' : '#ffffff';
      if (me) R(c, 8, y - 2, 304, 12, '#1c2c5a');
      T(c, String(i + 1), 26, y, col, { a: 'r' }); T(c, s.name, 36, y, col); T(c, fmt(s.score), 306, y, col, { a: 'r' });
    });
    if (Scores.online === false) T(c, 'OFFLINE: SCORES WILL SYNC LATER', 160, 156, '#7a6aa0', { f: 's', a: 'c' });
    if (Math.floor(this.t * 2) % 2 === 0) T(c, KEYBOARD ? 'PRESS ENTER  /  ARROWS: OTHER EVENTS' : 'TAP TO CONTINUE', 160, 168, '#c8b8f0', { f: 's', a: 'c' });
  }
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  Shell.t += dt;
  Shell.scene.update(dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  Shell.scene.draw(ctx);
  Input.endFrame();
  requestAnimationFrame(frame);
}
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load('8px "Press Start 2P"'), document.fonts.load('8px "Silkscreen"')]), new Promise(r => setTimeout(r, 2500))]); } catch (_) {}
  PORTRAIT.seb = sprite(sebastianPortrait()); PORTRAIT.misha = sprite(mishaPortrait());
  const start = location.hash.startsWith('#play-') ? new PlayScene(EVENTS.find(e => e.id === location.hash.slice(6))) : TitleScene;
  Shell.go(start);
  EVENTS.forEach(e => Scores.refresh(e.id));
  addEventListener('visibilitychange', () => { if (!document.hidden) EVENTS.forEach(e => Scores.refresh(e.id)); });
  requestAnimationFrame(frame);
}
