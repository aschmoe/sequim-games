// ===== Patch Panic: Sebastian's Moog modular, patched and played in three rounds =====
(() => {
  // ---- the rack: six modules between walnut cheeks, inputs on the upper row, outputs below ----
  const MODS = [{ id: 'VCO', w: 52 }, { id: 'VCF', w: 52 }, { id: 'ENV', w: 46 }, { id: 'LFO', w: 44 }, { id: 'VCA', w: 52 }, { id: 'OUT', w: 42 }];
  { let x = 16; for (const m of MODS) { m.x = x; x += m.w; } }
  const IN_Y = 94, OUT_Y = 114;
  const J = {};
  const jack = (id, dx, y, kind, label) => { const m = MODS.find(q => q.id === id.split('.')[0]); J[id] = { id, x: m.x + dx, y, kind, label }; };
  jack('VCO.cv', 16, IN_Y, 'in', 'CV'); jack('VCO.out', 36, OUT_Y, 'out', 'OUT');
  jack('VCF.in', 14, IN_Y, 'in', 'IN'); jack('VCF.cv', 38, IN_Y, 'in', 'CV'); jack('VCF.out', 26, OUT_Y, 'out', 'OUT');
  jack('ENV.out', 23, OUT_Y, 'out', 'OUT');
  jack('LFO.out', 22, OUT_Y, 'out', 'OUT');
  jack('VCA.in', 14, IN_Y, 'in', 'IN'); jack('VCA.cv', 38, IN_Y, 'in', 'CV'); jack('VCA.out', 26, OUT_Y, 'out', 'OUT');
  jack('OUT.in', 21, IN_Y, 'in', 'IN');
  const KNOBS = [['VCO', 16, 44], ['VCO', 36, 66], ['VCF', 26, 48, 'cutoff'], ['VCF', 26, 74], ['ENV', 14, 44], ['ENV', 32, 44], ['ENV', 14, 68], ['ENV', 32, 68], ['LFO', 22, 50], ['VCA', 26, 56], ['OUT', 21, 56]];
  const CUTOFF = { x: MODS[1].x + 26, y: 48 };
  const SLIDER = { x: 160, top: 40, bottom: 112 };
  const BAND = .13;
  const CABLE_COLS = [['#e04a3a', '#8a1c18'], ['#f4d24a', '#a07a10'], ['#3a8ae0', '#1c3a8a'], ['#3cc060', '#1c6a34'], ['#c070f0', '#5a2482']];
  const pretty = id => { const [m, k] = id.split('.'); return m + ' ' + (k === 'out' ? 'OUT' : k === 'in' ? 'IN' : 'CV'); };

  // ---- the three rounds. chart: one string per bar, eight slots per bar; a digit is the lane (cable) to tap ----
  const ROUNDS = [
    { name: 'BASS LINE', bpm: 100, key: 45, time: 16, ghost: true,
      cables: [['VCO.out', 'VCF.in'], ['VCF.out', 'VCA.in'], ['VCA.out', 'OUT.in']],
      chart: ['0.......', '1.......', '2...0...', '1.......', '0...1...', '2...1...', '0...2...', '1...0...'],
      roots: [0, 0, 5, 5, 3, 3, 7, 7] },
    { name: 'ACID', bpm: 110, key: 45, time: 20, pop: 13,
      cables: [['VCO.out', 'VCF.in'], ['ENV.out', 'VCF.cv'], ['VCF.out', 'VCA.in'], ['VCA.out', 'OUT.in']],
      chart: ['0...1...', '2...3...', '0.1.2...', '3.......', '3...2...', '1...0.1.', '0...2...', '3...1...'],
      roots: [0, 0, 3, 3, 5, 5, 7, 10] },
    { name: 'FILTER SWEEP', bpm: 120, key: 47, time: 22, pop: 9, sweep: [16, 24],
      cables: [['VCO.out', 'VCF.in'], ['LFO.out', 'VCO.cv'], ['ENV.out', 'VCF.cv'], ['VCF.out', 'VCA.in'], ['VCA.out', 'OUT.in']],
      chart: ['0...1...', '2.3.4...', '0...1.2.', '3...4...', '........', '........', '0.1.2...', '4.3.1.0.'],
      roots: [0, 0, 3, 5, 0, 0, 7, 7] },
  ];
  const LEAD_IN = 4; // beats of count-in before the chart starts
  const PENTA = [0, 3, 5, 7, 10, 12, 15, 17];
  const W_PERFECT = .1, W_GOOD = .2;
  const TRAVEL = 2; // beats a pulse spends crossing its cable

  function create(api) {
    const faces = {}; for (const m of ['happy', 'grimace', 'shades']) faces[m] = sprite(sebastianPortrait(m));
    const s = {
      round: -1, phase: 'intro', phaseT: 0, clock: 0, score: 0, patchBonus: 0, wrong: 0,
      perfect: 0, good: 0, miss: 0, combo: 0, best: 0, groove: 50, lastMiss: -9, fx: [],
      cables: [], drag: null, notes: [], knob: .5, sweepScore: 0,
    };
    let bus = null, acStart = 0, clockStart = 0, lastLead = -1, lastKnobY = null;
    if (window.__patchDebug) window.__patchDebug(s, { J, songTime: () => songTime(), sweepTarget: b => sweepTarget(b), ROUNDS, spb: () => spb(), LEAD_IN });

    const RD = () => ROUNDS[s.round];
    const spb = () => 60 / RD().bpm;
    const songTime = () => {
      const ac = Sound.ac;
      if (ac && acStart) return ac.currentTime - (ac.outputLatency || ac.baseLatency || 0) - acStart;
      return s.clock - clockStart;
    };
    const fx = (text, x, y, col, t = .8) => s.fx.push({ text, x, y, col, t, max: t });
    const jackAt = (x, y, r = 13) => { let best = null, bd = r; for (const j of Object.values(J)) { const d = Math.hypot(j.x - x, j.y - y); if (d < bd) { bd = d; best = j; } } return best; };

    function startRound(i) {
      s.round = i; s.phase = 'banner'; s.phaseT = 1.6; s.cables = []; s.drag = null; s.notes = [];
      Sound.jingle([392, 523], { step: .08, vol: .08 });
    }
    function startPatch() { s.phase = 'patch'; s.phaseT = RD().time; }
    function cableFor(a, b) { return RD().cables.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a)); }
    function connect(i) {
      const [a, b] = RD().cables[i];
      s.cables.push({ lane: i, out: J[a].kind === 'out' ? a : b, in: J[a].kind === 'in' ? a : b, popped: false, plug: null });
      Sound.tone(1200, .04, { type: 'square', vol: .1 }); Sound.noise(.03, { vol: .2, freq: 3000 });
      if (s.cables.length === RD().cables.length) {
        const bonus = Math.ceil(s.phaseT) * 50; s.patchBonus += bonus; s.score += bonus;
        fx('PATCHED! +' + bonus, 150, 70, '#3cc060', 1.2); Sound.jingle([523, 659, 784], { step: .06, vol: .1 });
        s.phase = 'ready'; s.phaseT = 1.2;
      }
    }
    function startJam() {
      s.phase = 'jam'; lastLead = -1;
      const r = RD(), b = spb();
      s.notes = [];
      r.chart.forEach((bar, bi) => [...bar].forEach((ch, k) => { if (ch !== '.') s.notes.push({ t: (LEAD_IN + bi * 4 + k / 2) * b, lane: +ch, bar: bi, state: 'pending' }); }));
      s.jamEnd = (LEAD_IN + r.chart.length * 4 + 1) * b;
      s.popped = false;
      // schedule the whole backing track up front on the audio clock
      bus?.disconnect(); bus = Sound.bus();
      clockStart = s.clock;
      const ac = Sound.ac; acStart = ac ? ac.currentTime + .25 : 0; if (!ac) clockStart += .25;
      if (ac) {
        const beats = LEAD_IN + r.chart.length * 4;
        for (let i = 0; i < beats; i++) {
          const t = acStart + i * b, bar = Math.floor((i - LEAD_IN) / 4);
          if (i < LEAD_IN) { Sound.tone(i === 0 ? 1320 : 880, .05, { at: t, out: bus, vol: .08 }); continue; }
          Sound.kick({ at: t, out: bus });
          Sound.noise(.025, { at: t + b / 4, out: bus, vol: .05, freq: 8000, type: 'highpass' });
          Sound.noise(.09, { at: t + b / 2, out: bus, vol: .1, freq: 7000, type: 'highpass' });
          Sound.noise(.025, { at: t + b * .75, out: bus, vol: .05, freq: 8000, type: 'highpass' });
          if (i % 2 === 1) Sound.clap({ at: t, out: bus });
          const root = r.key - 12 + r.roots[bar];
          // offbeat bass: a fat saw and a square an octave down, ducking out of the kick's way
          Sound.synth(midi(root + 12), b * .42, { at: t + b / 2, out: bus, type: 'sawtooth', cutoff: 300, env: 1400, q: 9, vol: .13 });
          Sound.synth(midi(root), b * .42, { at: t + b / 2, out: bus, type: 'square', cutoff: 200, env: 300, q: 2, vol: .09 });
          if (i % 4 === 3) Sound.synth(midi(root + 24), b * .2, { at: t + b * .75, out: bus, type: 'sawtooth', cutoff: 600, env: 2000, q: 12, vol: .06 });
        }
      }
    }
    function leadNote(n, quality) {
      const r = RD(), pitch = r.key + 12 + r.roots[n.bar] + PENTA[(n.lane * 2 + n.bar) % PENTA.length];
      if (quality === 'miss') Sound.synth(midi(pitch) * 1.06, .18, { type: 'square', cutoff: 300, env: 300, vol: .07, out: bus, detune: 40 });
      else { Sound.synth(midi(pitch), .4, { cutoff: quality === 'perfect' ? 1400 : 700, env: 3000, q: 10, vol: .16, out: bus }); Sound.synth(midi(pitch) * 1.005, .4, { type: 'square', cutoff: 900, env: 1500, q: 4, vol: .06, out: bus }); }
    }
    function judge(n, dt) {
      const j = s.cables.find(c => c.lane === n.lane), jk = J[j.in];
      if (Math.abs(dt) <= W_PERFECT) { n.state = 'hit'; s.perfect++; s.combo++; s.groove = Math.min(100, s.groove + 3); add(300); fx('PERFECT', jk.x, jk.y - 16, '#ffd84a'); leadNote(n, 'perfect'); }
      else { n.state = 'hit'; s.good++; s.combo++; s.groove = Math.min(100, s.groove + 1.5); add(120); fx('GOOD', jk.x, jk.y - 16, '#4fd6ff'); leadNote(n, 'good'); }
      s.best = Math.max(s.best, s.combo);
      if (s.combo > 0 && s.combo % 10 === 0) fx('COMBO X' + s.combo, 150, 40, '#ff8ab0', 1);
    }
    function add(p) { s.score += Math.round(p * (1 + Math.min(2, Math.floor(s.combo / 10) * .5))); }
    function missNote(n) {
      n.state = 'miss'; s.miss++; s.combo = 0; s.groove = Math.max(0, s.groove - 8); s.lastMiss = s.clock;
      const c = s.cables.find(q => q.lane === n.lane); if (c) { const jk = J[c.in]; fx('MISS', jk.x, jk.y - 16, '#ff5050'); }
      leadNote(n, 'miss');
    }
    function plugPos(c) {
      if (c.plug) return c.plug;
      const j = J[c.in], k = clamp((s.clock - (c.popT || 0)) / .35, 0, 1), sway = Math.sin(s.clock * 3) * 3 * k;
      return { x: j.x + 12 * k + sway, y: j.y + 26 * k - Math.sin(k * Math.PI) * 14 };
    }

    function update(dt) {
      s.clock += dt;
      s.fx = s.fx.filter(f => (f.t -= dt) > 0);
      if (s.phase === 'intro') { startRound(0); return; }
      if (s.phase === 'banner') { s.phaseT -= dt; if (s.phaseT <= 0) startPatch(); return; }
      if (s.phase === 'ready') { s.phaseT -= dt; if (s.phaseT <= 0) startJam(); return; }
      if (s.phase === 'between') { s.phaseT -= dt; if (s.phaseT <= 0) { if (s.round + 1 < ROUNDS.length) startRound(s.round + 1); else finish(); } return; }

      if (s.phase === 'patch') {
        s.phaseT -= dt;
        for (const d of Input.downs) { const j = jackAt(d.x, d.y); if (j && !s.cables.some(c => c.in === j.id || c.out === j.id)) s.drag = { from: j.id, id: d.id, t: s.clock }; }
        if (s.drag) {
          const p = Input.ptrs.get(s.drag.id); if (p) s.drag.pos = { x: p.x, y: p.y };
          const up = Input.ups.find(u => u.id === s.drag.id);
          if (up) {
            const j = jackAt(up.x, up.y, 14), from = s.drag.from; s.drag = null;
            if (j && j.id !== from) {
              const i = cableFor(from, j.id);
              if (i >= 0 && !s.cables.some(c => c.lane === i)) connect(i);
              else { s.wrong++; s.score = Math.max(0, s.score - 100); fx('WRONG JACK', j.x, j.y - 16, '#ff5050'); Sound.tone(110, .25, { type: 'sawtooth', vol: .12 }); }
            }
          }
        }
        if (s.phaseT <= 0 && s.phase === 'patch') {
          RD().cables.forEach((_, i) => { if (!s.cables.some(c => c.lane === i)) { const [a, b] = RD().cables[i]; s.cables.push({ lane: i, out: J[a].kind === 'out' ? a : b, in: J[a].kind === 'in' ? a : b, popped: false }); } });
          fx('THE ROADIE PATCHED IT', 150, 70, '#ff8ab0', 1.4); s.phase = 'ready'; s.phaseT = 1.4;
        }
        return;
      }

      // ---- jam ----
      const r = RD(), b = spb(), st = songTime(), beat = st / b;
      if (r.pop && !s.popped && beat >= r.pop) {
        s.popped = true;
        const upcoming = s.cables.map(c => ({ c, n: s.notes.filter(n => n.lane === c.lane && n.state === 'pending' && n.t > st && n.t < st + 8 * b).length }));
        upcoming.sort((a, b) => b.n - a.n); const c = upcoming[0].c; c.popped = true; c.popT = s.clock;
        s.shake = .45; Sound.noise(.12, { vol: .5, freq: 4000 }); Sound.tone(70, .5, { type: 'sawtooth', vol: .18, slide: -30 }); Sound.tone(1800, .25, { type: 'sine', vol: .06, slide: 600 });
      }
      const popped = s.cables.find(c => c.popped);
      if (popped) {
        s.groove = Math.max(0, s.groove - 6 * dt);
        s.crackle = (s.crackle || 0) - dt; if (s.crackle <= 0) { s.crackle = .22 + Math.random() * .2; Sound.noise(.05, { vol: .12, freq: 2500, out: bus }); }
        for (const n of s.notes) if (n.lane === popped.lane && n.state === 'pending' && n.t < st + TRAVEL * b) n.state = 'skip';
      }
      s.shake = Math.max(0, (s.shake || 0) - dt);

      const inSweep = r.sweep && beat >= LEAD_IN + r.sweep[0] && beat < LEAD_IN + r.sweep[1];
      // taps on jacks, or a grab of the dangling plug
      for (const d of Input.downs) {
        if (popped) { const pp = plugPos(popped); if (Math.hypot(pp.x - d.x, pp.y - d.y) < 16) { s.drag = { plug: popped, id: d.id }; continue; } }
        if (inSweep) continue;
        const j = jackAt(d.x, d.y, 19); if (!j) continue;
        const c = s.cables.find(q => q.in === j.id && !q.popped); if (!c) continue;
        hitLane(c.lane, st);
      }
      if (KEYBOARD && !inSweep) {
        const order = [...s.cables].sort((a, b) => J[a.in].x - J[b.in].x);
        ['KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'].forEach((k, i) => { if (Input.keyPressed(k) && order[i] && !order[i].popped) hitLane(order[i].lane, st); });
        if (popped && Input.keyPressed('Space')) replug(popped);
      }
      if (s.drag?.plug) {
        const p = Input.ptrs.get(s.drag.id); if (p) s.drag.plug.plug = { x: p.x, y: p.y };
        const up = Input.ups.find(u => u.id === s.drag.id);
        if (up) { const c = s.drag.plug; s.drag = null; const j = J[c.in]; if (Math.hypot(j.x - up.x, j.y - up.y) < 16) replug(c); else c.plug = null; }
      }
      for (const n of s.notes) if (n.state === 'pending' && st - n.t > W_GOOD) missNote(n);

      // the filter sweep: ride the cutoff knob along the moving target
      if (inSweep) {
        for (const p of Input.ptrs.values()) { if (p.ui) continue; s.knob = clamp((SLIDER.bottom - p.y) / (SLIDER.bottom - SLIDER.top), 0, 1); break; }
        if (Input.key('ArrowUp', 'KeyW')) s.knob = clamp(s.knob + 1.1 * dt, 0, 1);
        if (Input.key('ArrowDown', 'KeyS')) s.knob = clamp(s.knob - 1.1 * dt, 0, 1);
        const target = sweepTarget(beat);
        const on = Math.abs(s.knob - target) < BAND;
        if (on) { s.score += Math.round(600 * dt); s.sweepScore += 600 * dt; s.groove = Math.min(100, s.groove + 4 * dt); }
        const eighth = Math.floor(beat * 2);
        if (eighth !== lastLead) { lastLead = eighth; const bar = Math.floor((beat - LEAD_IN) / 4);
          Sound.synth(midi(r.key + 12 + r.roots[clamp(bar, 0, 7)] + PENTA[eighth % 4]), b * .45, { cutoff: 120 + s.knob * 2600, env: 400, q: 14, vol: .12, out: bus }); }
        s.sweepOn = on;
      } else lastKnobY = null;

      if (st >= s.jamEnd) { s.phase = 'between'; s.phaseT = 1.6; s.cables.forEach(c => c.popped = false);
        fx(s.round + 1 < ROUNDS.length ? 'ROUND ' + (s.round + 1) + ' DONE!' : 'ENCORE!', 150, 60, '#ffd84a', 1.5); }
    }
    function sweepTarget(beat) { const r = RD(); const u = (beat - LEAD_IN - r.sweep[0]) / (r.sweep[1] - r.sweep[0]); return .5 + .38 * Math.sin(u * Math.PI * 2.5 - Math.PI / 2); }
    function hitLane(lane, st) {
      let best = null; for (const n of s.notes) if (n.lane === lane && n.state === 'pending' && Math.abs(n.t - st) <= W_GOOD && (!best || Math.abs(n.t - st) < Math.abs(best.t - st))) best = n;
      if (best) judge(best, best.t - st); else s.groove = Math.max(0, s.groove - 1);
    }
    function replug(c) { c.popped = false; c.plug = null; fx('PLUGGED IN!', J[c.in].x, J[c.in].y - 20, '#3cc060', 1); Sound.tone(1200, .04, { vol: .1 }); s.score += 200; }
    function finish() {
      const total = s.perfect + s.good + s.miss, acc = total ? (s.perfect + s.good * .6) / total : 0;
      s.score += Math.round(s.groove * 20);
      api.finish({ score: s.score, headline: acc >= .9 ? 'STANDING OVATION' : acc >= .7 ? 'SOLID GROOVE' : 'TECHNICAL DIFFICULTIES',
        stats: [['PERFECT', String(s.perfect)], ['GOOD', String(s.good)], ['MISSED', String(s.miss)], ['BEST COMBO', String(s.best)], ['PATCH BONUS', fmt(s.patchBonus)]] });
    }

    // ---- drawing ----
    function drawRack(c) {
      R(c, 0, 0, W, H, '#100c10');
      for (const x0 of [4, 304]) { R(c, x0, 8, 12, 124, '#7a4a26'); for (let y = 10; y < 130; y += 7) R(c, x0 + 2 + (y % 3), y, 6, 1, '#5a321a'); R(c, x0, 8, 12, 1, '#a06a3a'); }
      for (const m of MODS) {
        box(c, m.x, 16, m.w, 112, '#18181e', '#0a0a0e'); R(c, m.x + 1, 17, m.w - 2, 1, '#2a2a34');
        T(c, m.id, m.x + m.w / 2, 20, '#ffffff', { f: 's', a: 'c' });
      }
      for (const [mid, dx, y, kind] of KNOBS) {
        const m = MODS.find(q => q.id === mid), x = m.x + dx, big = kind === 'cutoff', r = big ? 9 : 6;
        disc(c, x, y, r + 1, '#0a0a0e'); disc(c, x, y, r, '#2a2a30'); disc(c, x, y, r - 2, '#c8c8d4'); disc(c, x, y, r - 3, '#9a9aa8');
        const v = big ? s.knob : ((dx * 7 + y) % 10) / 10, a = Math.PI * (.75 + v * 1.5);
        line(c, x, y, Math.round(x + Math.cos(a) * (r - 1)), Math.round(y + Math.sin(a) * (r - 1)), '#0a0a0e');
        if (big) T(c, 'CUTOFF', x, y + 12, '#9a9aa8', { f: 's', a: 'c' });
      }
      R(c, 6, 8, 308, 8, '#b8b8c4'); R(c, 6, 128, 308, 6, '#b8b8c4');
      for (let x = 14; x < 314; x += 30) { R(c, x, 11, 3, 2, '#6a6a78'); R(c, x, 130, 3, 2, '#6a6a78'); }
      for (const j of Object.values(J)) {
        disc(c, j.x, j.y, 5, j.kind === 'out' ? '#e8c060' : '#c8c8d4'); disc(c, j.x, j.y, 3, '#2a2a30'); disc(c, j.x, j.y, 2, '#050505');
        T(c, j.label, j.x, j.y + 6, '#b8b8c8', { f: 's', a: 'c' });
      }
    }
    function cablePath(c, x0, y0, x1, y1, col, dark) { cable(c, x0, y0, x1, y1, 16, col, dark); }
    function drawCables(c) {
      for (const cb of s.cables) {
        const a = J[cb.out], b = J[cb.in], [col, dark] = CABLE_COLS[cb.lane];
        if (cb.popped) {
          const p = plugPos(cb), blink = Math.floor(s.clock * 6) % 2;
          cablePath(c, a.x, a.y, p.x, p.y, col, dark);
          R(c, p.x - 3, p.y - 3, 7, 7, '#e8e8f0'); R(c, p.x - 2, p.y - 2, 5, 5, col);
          if (!cb.plug) {
            const rr = 9 + Math.round(Math.sin(s.clock * 8) * 2); c.fillStyle = '#ffffff';
            for (let k = 0; k < 48; k++) { const t = k / 48 * Math.PI * 2; c.fillRect(Math.round(p.x + Math.cos(t) * rr), Math.round(p.y + Math.sin(t) * rr), 1, 1); }
            for (let k = 2; k < 10; k += 2) R(c, Math.round(p.x + (b.x - p.x) * k / 12), Math.round(p.y + (b.y - p.y) * k / 12), 2, 2, blink ? '#ffffff' : '#ff5050');
          }
          disc(c, b.x, b.y, 7, blink ? '#ff5050' : '#ffffff'); disc(c, b.x, b.y, 3, '#2a2a30'); disc(c, b.x, b.y, 2, '#050505');
        }
        else { cablePath(c, a.x, a.y, b.x, b.y, col, dark); R(c, b.x - 1, b.y - 1, 3, 3, col); R(c, a.x - 1, a.y - 1, 3, 3, col); }
      }
    }
    function drawJam(c) {
      const st = songTime(), b = spb();
      for (const n of s.notes) {
        if (n.state !== 'pending') continue;
        const ahead = n.t - st; if (ahead > TRAVEL * b || ahead < -W_GOOD) continue;
        const cb = s.cables.find(q => q.lane === n.lane); if (!cb || cb.popped) continue;
        const a = J[cb.out], j = J[cb.in], p = clamp(1 - ahead / (TRAVEL * b), 0, 1);
        const cx = (a.x + j.x) / 2, cy = Math.max(a.y, j.y) + 16, x = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * cx + p * p * j.x, y = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * cy + p * p * j.y;
        disc(c, x, y, 3, '#ffffff'); disc(c, x, y, 1, CABLE_COLS[n.lane][0]);
        if (ahead > b) continue;
        const rr = Math.round(5 + 10 * clamp(ahead / b, 0, 1)); c.fillStyle = CABLE_COLS[n.lane][0];
        for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; c.fillRect(Math.round(j.x + Math.cos(t) * rr), Math.round(j.y + Math.sin(t) * rr), 1, 1); }
      }
      if (KEYBOARD) { const order = [...s.cables].sort((a, b) => J[a.in].x - J[b.in].x); order.forEach((cb, i) => T(c, 'DFJKL'[i], J[cb.in].x, J[cb.in].y - 14, '#ffd84a', { f: 's', a: 'c' })); }
      const r = RD(), beat = st / b;
      if (r.sweep && beat >= LEAD_IN + r.sweep[0] - 3 && beat < LEAD_IN + r.sweep[1]) {
        const live = beat >= LEAD_IN + r.sweep[0], tg = live ? sweepTarget(beat) : sweepTarget(LEAD_IN + r.sweep[0]);
        const { x, top, bottom } = SLIDER, h = bottom - top, yOf = v => Math.round(bottom - v * h);
        box(c, x - 40, top - 22, 80, h + 40, '#0a080e', live ? '#ffd84a' : '#9a9aa8', 2);
        T(c, 'FILTER SWEEP', x, top - 18, '#ffd84a', { f: 's', a: 'c' });
        R(c, x - 3, top, 7, h, '#2a2a34');
        const by0 = yOf(clamp(tg + BAND, 0, 1)), by1 = yOf(clamp(tg - BAND, 0, 1));
        R(c, x - 10, by0, 21, by1 - by0, s.sweepOn ? '#3cc060' : '#1e7a3a');
        const ky = yOf(s.knob); disc(c, x, ky, 5, '#0e0c14'); disc(c, x, ky, 4, s.sweepOn || !live ? '#ffd84a' : '#ff5050');
        T(c, live ? (s.sweepOn ? 'NICE!' : 'GET THE DOT IN THE GREEN') : 'GET READY...', x, bottom + 6, s.sweepOn ? '#3cc060' : '#ffffff', { f: 's', a: 'c' });
        if (!live || beat < LEAD_IN + r.sweep[0] + 2) { TO(c, KEYBOARD ? 'HOLD UP / DOWN ARROWS' : 'SLIDE YOUR FINGER UP AND DOWN', 160, 2, '#ffd84a', '#0e0c14', null, { f: 's', a: 'c' }); }
      }
      const pc = s.cables.find(q => q.popped);
      if (pc) { const blink = Math.floor(s.clock * 5) % 2; box(c, 70, 22, 180, 22, blink ? '#c0202a' : '#7a1018', '#ffffff', 2); TO(c, 'CABLE OUT!', 160, 25, '#ffffff', '#0e0c14', null, { a: 'c' }); T(c, KEYBOARD ? 'DRAG THE PLUG BACK IN (OR SPACE)' : 'DRAG THE PLUG BACK INTO ITS JACK', 160, 35, '#ffffff', { f: 's', a: 'c' }); }
      if (st < LEAD_IN * b && st > 0) TO(c, String(LEAD_IN - Math.floor(st / b)), 160, 56, '#ffffff', '#0e0c14', '#a03a8a', { size: 16, a: 'c' });
    }
    function drawHud(c) {
      R(c, 0, 136, W, 44, '#0a080e');
      if (s.phase === 'patch' || s.phase === 'banner' || s.phase === 'ready') {
        T(c, 'PATCH CARD', 6, 139, '#ffd84a', { f: 's' });
        const tl = s.phase === 'patch' ? s.phaseT / RD().time : 1; R(c, 70, 141, 120, 3, '#2a2a3a'); R(c, 70, 141, Math.round(120 * tl), 3, tl < .3 ? '#ff5050' : '#3cc060');
        RD().cables.forEach(([a, b], i) => {
          const done = s.cables.some(q => q.lane === i), x = 6 + (i % 2) * 136, y = 150 + Math.floor(i / 2) * 10;
          if (!done && s.drag && s.drag.from && (s.drag.from === a || s.drag.from === b)) R(c, x - 2, y - 2, 132, 10, '#3a2a6a');
          R(c, x, y + 1, 5, 5, done ? '#3cc060' : CABLE_COLS[i][0]); if (done) T(c, '*', x + 1, y - 1, '#0a080e', { f: 's' });
          T(c, pretty(J[a].kind === 'out' ? a : b) + ' > ' + pretty(J[a].kind === 'in' ? a : b), x + 9, y, done ? '#6a6a7a' : '#e8e8f0', { f: 's' });
        });
      } else {
        T(c, 'GROOVE', 6, 141, '#9a9ad0', { f: 's' }); box(c, 46, 141, 90, 7, '#1a1a28', '#ffffff'); R(c, 48, 143, Math.round(86 * s.groove / 100), 3, s.groove > 60 ? '#3cc060' : s.groove > 30 ? '#f4d24a' : '#ff5050');
        T(c, 'COMBO ' + s.combo, 6, 155, s.combo >= 10 ? '#ff8ab0' : '#e8e8f0');
        T(c, fmt(s.score), 276, 141, '#ffffff', { a: 'r' });
        T(c, 'ROUND ' + (s.round + 1) + ': ' + RD().name, 276, 155, '#9a9ad0', { f: 's', a: 'r' });
        const pc = s.cables.find(q => q.popped);
        T(c, pc ? (KEYBOARD ? 'CABLE OUT! DRAG IT BACK, OR PRESS SPACE' : 'CABLE OUT! DRAG THE PLUG BACK IN') : (KEYBOARD ? 'TAP JACKS OR USE D F J K L ON THE BEAT' : 'TAP EACH JACK AS ITS PULSE LANDS'), 6, 168, pc ? '#ff5050' : '#6a6a7a', { f: 's' });
      }
      // Sebastian, reacting
      const st = songTime(), b = RD() ? spb() : .5;
      const mood = s.cables.some(q => q.popped) || s.clock - s.lastMiss < .8 || (s.phase === 'jam' && s.groove < 25) || (s.phase === 'patch' && s.phaseT < 4) ? 'grimace' : s.combo >= 16 ? 'shades' : 'happy';
      const bob = s.phase === 'jam' && mood !== 'grimace' && st > 0 && (st / b) % 1 < .25 ? 2 : 0;
      R(c, 282, 136, 38, 44, '#1a1426'); blit(c, faces[mood], 285, 140 + bob);
    }
    function draw(c) {
      c.save(); if (s.shake > 0) c.translate(Math.round((Math.random() - .5) * 6), Math.round((Math.random() - .5) * 4));
      drawRack(c);
      if (s.round < 0) { c.restore(); return; }
      if (s.phase === 'patch' && !RD().ghost) RD().cables.forEach(([a, b], i) => {
        if (s.cables.some(q => q.lane === i)) return;
        const out = J[J[a].kind === 'out' ? a : b], inn = J[J[a].kind === 'in' ? a : b], col = CABLE_COLS[i][0];
        if (Math.floor(s.clock * 2 + i * .3) % 2) { c.fillStyle = col; for (let k = 0; k < 36; k++) { const t = k / 36 * Math.PI * 2; c.fillRect(Math.round(out.x + Math.cos(t) * 8), Math.round(out.y + Math.sin(t) * 8), 1, 1); } }
        if (s.drag && s.drag.from && (s.drag.from === out.id || s.drag.from === inn.id) && s.clock - s.drag.t > .9) {
          const other = s.drag.from === out.id ? inn : out;
          if (Math.floor(s.clock * 6) % 2) { disc(c, other.x, other.y, 7, col); disc(c, other.x, other.y, 3, '#2a2a30'); disc(c, other.x, other.y, 2, '#050505'); }
        }
      });
      if (s.phase === 'patch' && RD().ghost) RD().cables.forEach(([a, b], i) => { if (s.cables.some(q => q.lane === i)) return; const ja = J[a], jb = J[b]; for (let k = 0; k <= 30; k++) if (k % 3 !== 2) R(c, Math.round(ja.x + (jb.x - ja.x) * k / 30), Math.round(ja.y + (jb.y - ja.y) * k / 30), 1, 1, CABLE_COLS[i][0]); });
      drawCables(c);
      if (s.drag && s.drag.from && s.drag.pos) { const j = J[s.drag.from], i = Math.min(s.cables.length, 4); cablePath(c, j.x, j.y, s.drag.pos.x, s.drag.pos.y, '#e8e8f0', '#6a6a78'); disc(c, s.drag.pos.x, s.drag.pos.y, 3, '#ffffff'); }
      if (s.phase === 'jam') drawJam(c);
      c.restore();
      drawHud(c);
      if (s.phase === 'banner') { R(c, 0, 52, W, 34, '#0a080e'); TO(c, 'ROUND ' + (s.round + 1), 160, 56, '#ffd84a', '#0e0c14', null, { a: 'c' }); TO(c, RD().name, 160, 70, '#ffffff', '#0e0c14', '#a03a8a', { a: 'c' }); }
      for (const f of s.fx) TO(c, f.text, f.x, f.y - (f.max - f.t) * 12, f.col, '#0e0c14', null, { f: 's', a: 'c' });
    }

    return {
      update, draw,
      pause(p) { try { if (Sound.ac) p ? Sound.ac.suspend() : Sound.ac.resume(); } catch (_) {} },
      destroy() { try { bus?.disconnect(); if (Sound.ac?.state === 'suspended') Sound.ac.resume(); } catch (_) {} },
    };
  }

  registerEvent({ id: 'patch', name: 'PATCH PANIC', star: 'sebastian', sub: 'SEBASTIAN  /  MOOG SYNTH', icon: 'synth', create });
})();
