// ===== Roll for Initiative: Misha's dungeon crawl, ending at Sebastian the Terrible, Lord of the Volts =====
(() => {
  const recolor = (rows, map) => rows.map(r => [...r].map(ch => map[ch] || ch).join(''));
  const CLASSES = [
    { id: 'fighter', name: 'FIGHTER', hp: 34, charge: 2.6, mod: 4, dmg: [8, 2], special: 'CLEAVE', uses: 3, map: { n: 'a', N: 'A', q: 'r', Q: 'R' },
      blurb: ['TOUGH AS NAILS', 'CLEAVE: A SWING', 'AT EVERY ENEMY'] },
    { id: 'wizard', name: 'WIZARD', hp: 22, charge: 2.5, mod: 3, dmg: [6, 1], special: 'FIREBALL', uses: 2, map: { n: 'p', N: 'P', q: 'p', Q: 'P' },
      blurb: ['FRAGILE, CLEVER', 'FIREBALL: TAP', 'FAST TO BURN'] },
    { id: 'bard', name: 'BARD', hp: 26, charge: 2.3, mod: 3, dmg: [6, 1], special: 'MOCKERY', uses: 4, map: {},
      blurb: ['CHARMING, RUDE', 'MOCKERY: PICK', 'THE BEST INSULT'] },
  ];
  // every enemy has a weakness the Bard's insults can find
  const KINDS = {
    goblin: { name: 'GOBLIN', hp: 10, ac: 11, charge: 3.2, spr: 'goblin', scale: 2, weak: 'SENSITIVE ABOUT ITS EARS',
      insults: ['NICE EARS. DO THEY GET RADIO?', 'YOUR SHOES ARE UNTIED.', 'YOU SMELL LIKE A WET SOCK.'],
      plan: () => Math.random() < .3 ? { kind: 'stab', dmg: 6, label: 'STAB 6' } : { kind: 'hit', dmg: 4, label: 'HIT 4' } },
    orc: { name: 'ORC', hp: 28, ac: 13, charge: 3.9, spr: 'orc', scale: 2, weak: 'TERRIBLE AT MATH',
      insults: ["QUICK: WHAT'S 7 TIMES 8?", 'YOUR AXE IS SMALL.', 'ORCS ARE SMELLY.'],
      plan: (e) => (e.turn % 3 === 1 ? { kind: 'windup', dmg: 0, label: 'WINDING UP!' } : e.turn % 3 === 2 ? { kind: 'smash', dmg: 14, label: 'SMASH 14!' } : { kind: 'hit', dmg: 7, label: 'HIT 7' }) },
    seb: { name: 'SEBASTIAN', title: 'LORD OF THE VOLTS', hp: 56, ac: 14, charge: 2.8, spr: 'sebSkate', scale: 2, boss: true, weak: 'RANGE ANXIETY',
      insults: ['IS THAT BOARD AT 3% BATTERY?', 'YOUR BOARD MAKES A WHINY NOISE.', 'YOUR BEARD IS... FINE.'],
      plan: (e) => (e.turn % 3 === 2 ? { kind: 'recharge', dmg: 0, label: 'BATTERY LOW' } : e.hp < e.max / 2 ? { kind: 'double', dmg: 5, label: 'ZAP 5 X2' } : { kind: 'zap', dmg: 7, label: 'ZAP 7' }) },
  };
  const ROOMS = [
    { name: 'THE GOBLIN DEN', foes: ['goblin', 'goblin'] },
    { name: 'MORE GOBLINS', foes: ['goblin', 'goblin', 'goblin'] },
    { name: "THE ORC'S CELLAR", foes: ['orc', 'goblin'] },
    { name: 'THE VOLT THRONE', foes: ['seb'] },
  ];
  const BOONS = [
    { id: 'wine', label: '+1 SWEET WHITE WINE', apply: s => s.wine++ },
    { id: 'hp', label: '+6 MAX HP, FULLY HEALED', apply: s => { s.max += 6; s.hp = s.max; } },
    { id: 'dmg', label: '+1 DAMAGE ON EVERY HIT', apply: s => s.bonusDmg++ },
    { id: 'use', label: '+1 SPECIAL USE', apply: s => s.uses++ },
  ];
  const SLOT_X = [34, 82, 130], FLOOR_Y = 124, MISHA_X = 248;
  const roll = n => 1 + Math.floor(Math.random() * n);

  // how each attack's ring closes: most close steadily; the orc's smash stalls halfway, then snaps
  const RINGS = { hit: { T: .7 }, stab: { T: .55 }, smash: { T: .95, feint: true }, zap: { T: .6 }, double: { T: .55 } };
  const ringP = (r, t) => !r.feint ? t / r.T : t < .45 ? .6 * t / .45 : t < .8 ? .6 : .6 + .4 * (t - .8) / .15;
  const W_PERFECT = .051, W_GOOD = .1105; // 15% tighter than the first real-time pass (.06 / .13)

  function create(api) {
    const s = {
      phase: 'class', t: 0, clock: 0, cls: 0, room: -1, foes: [], hp: 0, max: 0, wine: 2, uses: 0, bonusDmg: 0, guardT: 0,
      score: 0, fx: [], banner: null, sel: 0, target: 0, shake: 0, lunge: 0, crits: 0, perfectBlocks: 0, wineDrunk: 0, dealt: 0,
      atb: 0, cmd: null, ct: 0, inc: null, clearT: 0,
    };
    const sprites = {};
    const mishaSprite = () => sprites[s.klass.id] || (sprites[s.klass.id] = sprite(recolor(SPR.mishaBard, s.klass.map)));
    const fx = (text, x, y, col, t = 1) => s.fx.push({ text: String(text), x, y, col, t, max: t });
    const say = (text, t = 1.4) => { s.banner = { text, t }; };
    const living = () => s.foes.filter(f => f.hp > 0);
    const foeX = f => SLOT_X[f.slot];

    function chooseClass(i) { s.klass = CLASSES[i]; s.max = s.hp = s.klass.hp; s.uses = s.klass.uses; Sound.jingle([392, 523, 659, 784], { step: .08 }); startRoom(0); }
    function startRoom(i) {
      s.room = i;
      s.foes = ROOMS[i].foes.map((k, slot) => { const K = KINDS[k]; if (K.boss) slot = 1; return { k, K, slot, hp: K.hp, max: K.hp, turn: 0, flash: 0, intent: null, atb: Math.random() * .25, speedMul: 1, stunT: 0, rechargeT: 0, recharging: false }; });
      for (const f of s.foes) f.intent = f.K.plan(f);
      s.phase = 'roomcard'; s.t = 0; s.atb = .6; s.cmd = null; s.inc = null; s.clearT = 0; Sound.jingle([262, 330, 392], { step: .12, vol: .1 });
    }

    // ---- Misha's options, available whenever his gauge is full ----
    const MENU = () => [
      { id: 'attack', label: 'ATTACK', ok: true },
      { id: 'special', label: s.klass.special + ' x' + s.uses, ok: s.uses > 0 },
      { id: 'wine', label: 'WINE x' + s.wine, ok: s.wine > 0 && s.hp < s.max },
      { id: 'guard', label: 'GUARD', ok: s.guardT <= 0 },
    ].map(m => ({ ...m, ok: m.ok && s.atb >= 1 }));
    function pickMenu(i) {
      if (s.atb < 1 || s.cmd || s.inc || s.phase !== 'battle') return;
      const m = MENU()[i]; if (!m.ok) { Sound.tone(150, .1, { type: 'triangle' }); return; }
      s.sel = i; Sound.tone(660, .05);
      if (m.id === 'wine') { s.wine--; s.wineDrunk++; s.hp = Math.min(s.max, s.hp + 12); fx('+12', MISHA_X, 70, '#3cc060'); say('SWEET WHITE WINE. DELICIOUS.'); Sound.jingle([392, 330, 262, 523], { step: .07, type: 'triangle' }); s.atb = 0; return; }
      if (m.id === 'guard') { s.guardT = 6; say('MISHA RAISES HIS GUARD.'); Sound.tone(440, .15, { type: 'triangle' }); s.atb = 0; return; }
      s.action = m.id;
      const single = m.id === 'attack' || (m.id === 'special' && s.klass.id === 'bard');
      s.target = s.foes.indexOf(living()[0]);
      if (single && living().length > 1) s.cmd = 'target'; else beginCommand();
    }
    function beginCommand() {
      s.ct = 0;
      if (s.action === 'attack' || (s.action === 'special' && s.klass.id === 'fighter')) { s.cmd = 'bar'; s.barPos = 0; s.barDir = 1; s.barSpeed = 1 / .75; }
      else if (s.klass.id === 'wizard') { s.cmd = 'mash'; s.taps = 0; s.uses--; }
      else { s.cmd = 'mock'; s.uses--; const f = s.foes[s.target]; s.insults = f.K.insults.map((x, i) => ({ x, good: i === 0 })).sort(() => Math.random() - .5); }
    }
    function doneCommand() { s.cmd = null; s.atb = 0; s.lunge = .3; }
    // the d20: where you stop the marker decides the roll
    function stopBar() {
      const e = Math.abs(s.barPos - .5) * 2, d = e < .055 ? 20 : e > .95 ? 1 : clamp(Math.round(19 - e * 18), 2, 19);
      s.d20 = { value: d }; if (s.action === 'special') s.uses--;
      s.cmd = 'rolling'; s.ct = 0; Sound.noise(.3, { vol: .15, freq: 2200, type: 'bandpass' });
    }
    function resolveRoll() {
      const d = s.d20.value, cleave = s.action === 'special', targets = cleave ? living() : [s.foes[s.target]].filter(f => f && f.hp > 0);
      if (d === 1) { say('NATURAL 1! MISHA TRIPS OVER HIS OWN CAPE.'); Sound.jingle([392, 370, 349, 330], { step: .18, type: 'sawtooth', vol: .1 }); s.shake = .3; return doneCommand(); }
      const crit = d === 20; if (crit) { s.crits++; s.score += 100; say('NATURAL 20! CRITICAL HIT!'); Sound.jingle([523, 659, 784, 1047, 1319], { step: .06 }); }
      let anyHit = false;
      for (const f of targets) {
        const ac = f.recharging ? 8 : f.K.ac;
        if (!crit && d + s.klass.mod < ac) { fx('MISS', foeX(f), 66, '#9a9ab0'); continue; }
        anyHit = true; const [die, plus] = s.klass.dmg;
        let dmg = roll(die) + plus + s.bonusDmg + (crit ? roll(die) : 0); if (cleave) dmg = Math.max(2, dmg - 2); if (f.recharging) dmg *= 2;
        hurt(f, dmg);
      }
      if (!crit) say((cleave ? 'CLEAVE! ' : '') + 'ROLLED ' + d + ' + ' + s.klass.mod + (anyHit ? '. HIT!' : '. MISSED.'), 1.2);
      doneCommand();
    }
    function hurt(f, dmg) {
      f.hp = Math.max(0, f.hp - dmg); f.flash = .3; s.dealt += dmg; s.score += dmg * 10;
      fx(dmg, foeX(f), 60, '#ffd84a'); Sound.noise(.12, { vol: .3, freq: 1200 }); Sound.tone(180, .12, { type: 'square', vol: .1, slide: -80 });
      if (f.hp === 0) { fx(f.K.boss ? 'DEFEATED!' : 'DOWN!', foeX(f), 48, '#ff8ab0', 1.2); if (!f.K.boss) Sound.tone(300, .3, { type: 'sawtooth', slide: -250, vol: .08 }); }
    }
    function mock(i) {
      const ins = s.insults[i], f = s.foes[s.target];
      s.mockLine = { text: '"' + ins.x + '"', t: 1.6 };
      if (ins.good) { hurt(f, 12 + s.bonusDmg); if (f.hp > 0) { f.stunT = 3.5; f.atb = Math.min(f.atb, .5); } say('IT HITS ' + f.K.name + ' RIGHT IN THE ' + f.K.weak.split(' ').slice(-1)[0] + '. STUNNED!'); Sound.jingle([523, 784], { step: .08 }); }
      else { hurt(f, 2); say(f.K.name + ' SHRUGS IT OFF.'); }
      doneCommand();
    }

    // ---- enemies act the moment their gauge fills ----
    function enemyAct(f) {
      f.atb = 0; f.speedMul = 1; const it = f.intent; f.turn++;
      if (it.kind === 'windup') { say('THE ORC RAISES ITS AXE HIGH. THE SMASH IS COMING FAST.'); Sound.tone(110, .5, { type: 'sawtooth', vol: .08, slide: 40 }); f.intent = f.K.plan(f); f.speedMul = 1.9; return; }
      if (it.kind === 'recharge') { f.recharging = true; f.rechargeT = 3.5; say('BATTERY LOW! SEBASTIAN PLUGS IN. HIT HIM NOW!'); Sound.tone(880, .4, { type: 'square', vol: .06, slide: -600 }); f.intent = f.K.plan(f); return; }
      const lines = { hit: 'ATTACKS!', stab: 'LUNGES WITH A DAGGER!', smash: 'SMASHES!', zap: 'THROWS A LIGHTNING BOLT!', double: 'ZAPS TWICE!' };
      say(f.K.name + ' ' + lines[it.kind], 1.1);
      s.inc = { f, kind: it.kind, ring: RINGS[it.kind], dmg: it.dmg, hits: it.kind === 'double' ? 2 : 1, t: 0, result: null, after: 0 };
      f.intent = f.K.plan(f);
    }
    function judgeBlock(tapped) {
      const inc = s.inc; if (inc.result) return;
      const off = Math.abs(inc.t - inc.ring.T), grade = !tapped ? 'none' : off < W_PERFECT ? 'perfect' : off < W_GOOD ? 'good' : 'whiff';
      let dmg = inc.dmg; if (s.guardT > 0) dmg = Math.ceil(dmg / 2);
      if (grade === 'perfect') { dmg = 0; s.perfectBlocks++; s.score += 100; fx('PERFECT BLOCK!', MISHA_X, 56, '#4fd6ff'); Sound.tone(1568, .15, { vol: .1 }); Sound.noise(.05, { vol: .2, freq: 5000, type: 'highpass' }); }
      else if (grade === 'good') { dmg = Math.ceil(dmg / 2); fx('BLOCK', MISHA_X, 56, '#4fd6ff'); Sound.tone(988, .1, { vol: .1 }); }
      else if (grade === 'whiff') fx(inc.t < inc.ring.T ? 'TOO EARLY' : 'TOO LATE', MISHA_X, 46, '#9a9ab0', .8);
      if (dmg > 0) { s.hp = Math.max(0, s.hp - dmg); fx('-' + dmg, MISHA_X, 70, '#ff5050'); s.shake = .25; s.mishaFlash = .3; Sound.noise(.15, { vol: .3, freq: 600 }); if (inc.f.K.boss) Sound.noise(.2, { vol: .2, freq: 6000, type: 'highpass' }); }
      inc.result = grade; inc.f.lungeT = .35;
    }

    function roomCleared() {
      s.score += 500;
      if (s.room === ROOMS.length - 1) { s.phase = 'victory'; s.t = 0; s.score += 2000 + s.hp * 20; Sound.jingle([523, 659, 784, 1047, 784, 1047, 1319], { step: .12 }); return; }
      s.phase = 'rest'; s.t = 0; s.boons = [...BOONS].sort(() => Math.random() - .5).slice(0, 3);
      Sound.jingle([392, 523, 659, 523, 784], { step: .1, vol: .1 });
    }
    function gameOver() { s.phase = 'defeat'; s.t = 0; Sound.jingle([392, 349, 330, 262], { step: .25, type: 'triangle' }); }
    function finish(win) {
      api.finish({ score: s.score, headline: win ? 'THE LAVENDER KING TRIUMPHS!' : 'THE PARTY WIPES.',
        stats: [['CLASS', s.klass.name], ['ROOMS CLEARED', (win ? 4 : s.room) + ' / 4'], ['CRITICAL HITS', String(s.crits)], ['PERFECT BLOCKS', String(s.perfectBlocks)], ['WINE DRUNK', String(s.wineDrunk)]] });
      s.phase = 'done';
    }
    function takeBoon(i) { s.boons[i].apply(s); Sound.jingle([523, 659, 784], { step: .07 }); startRoom(s.room + 1); }

    function update(dt) {
      s.clock += dt; s.t += dt;
      s.fx = s.fx.filter(f => (f.t -= dt) > 0);
      if (s.banner && (s.banner.t -= dt) <= 0) s.banner = null;
      if (s.mockLine && (s.mockLine.t -= dt) <= 0) s.mockLine = null;
      s.shake = Math.max(0, s.shake - dt); s.lunge = Math.max(0, s.lunge - dt); s.mishaFlash = Math.max(0, (s.mishaFlash || 0) - dt);
      for (const f of s.foes) { f.flash = Math.max(0, f.flash - dt); if (f.lungeT) f.lungeT = Math.max(0, f.lungeT - dt); }
      const tapped = Input.downs.length > 0 || Input.keyPressed('Space'), key = (...k) => Input.keyPressed(...k);

      if (s.phase === 'class') {
        CLASSES.forEach((c, i) => { if (Input.tapIn(8 + i * 104, 34, 96, 112)) chooseClass(i); });
        if (key('ArrowLeft')) s.sel = (s.sel + 2) % 3; if (key('ArrowRight')) s.sel = (s.sel + 1) % 3; if (key('Enter', 'Space')) chooseClass(s.sel);
        ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (key(k)) chooseClass(i); });
        return;
      }
      if (s.phase === 'roomcard') { if (s.t > 2) { s.phase = 'battle'; s.t = 0; } return; }
      if (s.phase === 'rest') { s.boons.forEach((b, i) => { if (Input.tapIn(50, 64 + i * 22, 220, 18)) takeBoon(i); }); ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (key(k)) takeBoon(i); }); return; }
      if (s.phase === 'victory') { if (s.t > 3.5) finish(true); return; }
      if (s.phase === 'defeat') { if (s.t > 3) finish(false); return; }
      if (s.phase !== 'battle') return;

      // an incoming strike freezes everything else: one tap to block it
      if (s.inc) {
        const inc = s.inc;
        if (!inc.result) { inc.t += dt; if (tapped && inc.t > .05) judgeBlock(true); else if (inc.t > inc.ring.T + W_GOOD) judgeBlock(false); }
        else if ((inc.after += dt) > .45) {
          if (s.hp <= 0) { s.inc = null; return gameOver(); }
          if (--inc.hits > 0) { inc.t = 0; inc.result = null; inc.after = 0; Sound.tone(1200, .05, { vol: .06 }); }
          else s.inc = null;
        }
        return;
      }

      // the clock: bullet time while Misha is aiming
      const slow = s.cmd ? .35 : 1;
      s.guardT = Math.max(0, s.guardT - dt);
      if (!s.cmd) s.atb = Math.min(1, s.atb + dt / s.klass.charge);
      if (s.atb >= 1 && !s.readyPinged) { s.readyPinged = true; Sound.tone(1320, .06, { vol: .07 }); } if (s.atb < 1) s.readyPinged = false;
      for (const f of living()) {
        if (f.stunT > 0) { f.stunT -= dt; continue; }
        if (f.rechargeT > 0) { f.rechargeT -= dt; if (f.rechargeT <= 0) { f.recharging = false; say('SEBASTIAN IS FULLY CHARGED AGAIN.'); } continue; }
        f.atb = Math.min(1, f.atb + dt * slow * f.speedMul / f.K.charge);
      }
      if (!s.cmd) { const ready = living().find(f => f.atb >= 1 && f.stunT <= 0 && f.rechargeT <= 0); if (ready) return enemyAct(ready); }

      // Misha's command in progress
      if (s.cmd === 'target') {
        for (const f of living()) if (Input.tapIn(foeX(f) - 22, 40, 44, 90)) { s.target = s.foes.indexOf(f); Sound.tone(660, .05); return beginCommand(); }
        const alive = living().map(f => s.foes.indexOf(f)); const k = alive.indexOf(s.target);
        if (key('ArrowLeft')) s.target = alive[(k + alive.length - 1) % alive.length]; if (key('ArrowRight')) s.target = alive[(k + 1) % alive.length];
        if (key('Enter', 'Space')) beginCommand(); if (key('Escape', 'Backspace')) s.cmd = null;
      } else if (s.cmd === 'bar') {
        s.ct += dt; s.barPos += s.barDir * s.barSpeed * dt; if (s.barPos > 1) { s.barPos = 2 - s.barPos; s.barDir = -1; } if (s.barPos < 0) { s.barPos = -s.barPos; s.barDir = 1; }
        if (s.ct > .15 && tapped) stopBar(); else if (s.ct > 3.5) { s.barPos = 0; stopBar(); }
      } else if (s.cmd === 'rolling') { s.ct += dt; if (s.ct > .7) resolveRoll(); }
      else if (s.cmd === 'mash') {
        s.ct += dt; s.taps += Input.downs.length + (key('Space') ? 1 : 0);
        if (s.ct > 2) { const dmg = clamp(1 + Math.floor(s.taps / 3), 1, 10) + s.bonusDmg; say('FIREBALL! ' + s.taps + ' TAPS OF FURY.'); Sound.noise(.6, { vol: .35, freq: 900 }); s.shake = .3; for (const f of living()) hurt(f, f.recharging ? dmg * 2 : dmg); doneCommand(); }
      } else if (s.cmd === 'mock') {
        s.insults.forEach((ins, i) => { if (Input.tapIn(40, 54 + i * 16, 240, 14)) mock(i); });
        ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (key(k)) mock(i); });
      } else {
        MENU().forEach((m, i) => { if (Input.tapIn(6 + (i % 2) * 74, 136 + Math.floor(i / 2) * 21, 70, 19)) pickMenu(i); });
        ['Digit1', 'Digit2', 'Digit3', 'Digit4'].forEach((k, i) => { if (key(k)) pickMenu(i); });
        if (key('ArrowDown') || key('ArrowUp')) s.sel = (s.sel + 2) % 4; if (key('ArrowRight')) s.sel = (s.sel + 1) % 4; if (key('ArrowLeft')) s.sel = (s.sel + 3) % 4;
        if (key('Enter')) pickMenu(s.sel);
      }
      if (!living().length && !s.cmd) { s.clearT += dt; if (s.clearT > .9) roomCleared(); }
    }

    // ---- drawing ----
    function drawDungeon(c) {
      R(c, 0, 0, W, 132, '#2a2438');
      for (let y = 0; y < 112; y += 8) { R(c, 0, y, W, 1, '#1a1626'); for (let x = ((y / 8) % 2) * 10; x < W; x += 20) { R(c, x, y, 1, 8, '#1a1626'); R(c, x + 1, y + 1, 18, 1, '#3a3250'); } }
      for (const tx of [60, 200, 290]) { R(c, tx, 34, 4, 14, '#4a301a'); const fl = Math.sin(s.clock * 13 + tx) > 0 ? 1 : 0; disc(c, tx + 2, 28 - fl, 4, '#f08a2a'); disc(c, tx + 2, 29, 2, '#ffd84a'); }
      R(c, 0, 112, W, 20, '#1e1a2a'); for (let x = 0; x < W; x += 26) R(c, x, 112, 1, 20, '#14101c'); R(c, 0, 112, W, 1, '#3a3250');
      if (s.room === 3) { R(c, 8, 40, 10, 12, '#e8e8f0'); R(c, 10, 43, 2, 4, '#0e0c14'); R(c, 14, 43, 2, 4, '#0e0c14'); T(c, 'OUTLET', 13, 54, '#9a9ab0', { f: 's', a: 'c' }); }
    }
    function drawFoe(c, f) {
      if (f.hp <= 0 && f.flash <= 0) { if (!f.K.boss) { R(c, foeX(f) - 10, FLOOR_Y - 3, 20, 3, '#14101c'); } return; }
      const img = spr(f.K.spr), sc = f.K.scale, w = img.width * sc, h = img.height * sc, lunge = f.lungeT > 0 ? Math.sin((.35 - f.lungeT) / .35 * Math.PI) * 30 : 0;
      let x = foeX(f) - w / 2 + lunge, y = FLOOR_Y - h;
      if (f.K.boss) {
        y -= 10 + Math.round(Math.sin(s.clock * 3) * 2);
        // the electric board, glowing unless he's plugged in
        R(c, x - 6, y + h + 2, w + 12, 4, '#2a2a34'); R(c, x - 4, y + h + 6, w + 8, 2, f.recharging ? '#3a3a46' : '#4fd6ff'); disc(c, x, y + h + 9, 3, '#c8c8d4'); disc(c, x + w, y + h + 9, 3, '#c8c8d4');
        if (f.recharging) { cable(c, 13, 50, x - 4, y + h + 4, 20, '#e8e8f0', '#6a6a78'); TO(c, 'BATTERY', x + w + 26, y + h / 2 - 6, '#ff5050', '#0e0c14', null, { f: 's', a: 'c' }); TO(c, '3%', x + w + 26, y + h / 2 + 4, Math.floor(s.clock * 4) % 2 ? '#ff5050' : '#ffffff', '#0e0c14', null, { f: 's', a: 'c' }); }
        else if (Math.floor(s.clock * 6) % 2) { R(c, x - 6, y + h + 11, 2, 2, '#ffd84a'); R(c, x + w + 4, y + h + 11, 2, 2, '#ffd84a'); }
      }
      c.save(); if (f.flash > 0 && Math.floor(f.flash * 20) % 2) c.globalAlpha = .4; blit(c, img, x, y, sc); c.restore();
      if (f.hp > 0) {
        const bw = Math.max(28, Math.min(48, w)); R(c, foeX(f) - bw / 2, y - 8, bw, 4, '#3a0a0a'); R(c, foeX(f) - bw / 2, y - 8, Math.round(bw * f.hp / f.max), 4, '#e0302a');
        const it = f.intent; const danger = it.dmg >= 10 || it.kind === 'windup';
        T(c, it.label, foeX(f), y - 18, danger ? '#ff5050' : it.kind === 'recharge' ? '#4fd6ff' : '#ffd84a', { f: 's', a: 'c' });
        // the gauge: when it fills, this enemy strikes
        if (f.stunT > 0) T(c, 'STUNNED', foeX(f), y - 2, '#ff8ab0', { f: 's', a: 'c' });
        else { const g = f.rechargeT > 0 ? f.rechargeT / 3.5 : f.atb; R(c, foeX(f) - bw / 2, y - 3, bw, 2, '#14101c'); R(c, foeX(f) - bw / 2, y - 3, Math.round(bw * g), 2, f.rechargeT > 0 ? '#4fd6ff' : g > .8 && Math.floor(s.clock * 8) % 2 ? '#ff5050' : '#e8e8f0'); }
        if (s.cmd === 'target' && s.foes.indexOf(f) === s.target) { const bob = Math.floor(s.clock * 4) % 2; T(c, 'v', foeX(f), y - 28 + bob, '#ffffff', { a: 'c' }); }
        if (f.K.boss) T(c, 'SEBASTIAN THE TERRIBLE', foeX(f), y - 36, '#ffd84a', { f: 's', a: 'c' });
      }
    }
    function drawMisha(c) {
      const img = mishaSprite(), sc = 2, w = img.width * sc, h = img.height * sc, lunge = s.lunge > 0 ? Math.sin((.3 - s.lunge) / .3 * Math.PI) * 26 : 0;
      const x = MISHA_X - w / 2 - lunge, y = FLOOR_Y - h;
      if (s.klass.id === 'wizard') { c.fillStyle = '#3a4ab0'; c.beginPath(); c.moveTo(x + 6, y + 6); c.lineTo(x + w - 6, y + 6); c.lineTo(x + w / 2 + 4, y - 16); c.closePath(); c.fill(); R(c, x + w / 2, y - 6, 2, 2, '#ffd84a'); R(c, x + w / 2 - 6, y, 2, 2, '#ffd84a'); line(c, x - 2, y + 8, x - 2, y + h, '#7a5230'); disc(c, x - 2, y + 6, 3, '#4fd6ff'); }
      if (s.klass.id === 'fighter') { line(c, x - 4, y + 10, x - 4, y + 34, '#e8e8f0'); R(c, x - 8, y + 30, 9, 2, '#a07a10'); }
      c.save(); if (s.mishaFlash > 0 && Math.floor(s.mishaFlash * 20) % 2) c.globalAlpha = .4; blit(c, img, x, y, sc); c.restore();
      if (s.guardT > 0) { c.fillStyle = '#4fd6ff'; for (let k = 0; k < 40; k++) { const t = k / 40 * Math.PI * 2; c.fillRect(Math.round(MISHA_X + Math.cos(t) * 24), Math.round(FLOOR_Y - 18 + Math.sin(t) * 26), 1, 1); } }
    }
    function drawPanel(c) {
      box(c, 2, 132, 316, 46, '#1c2a8a', '#ffffff', 2); R(c, 6, 136, 308, 1, '#3a4ab0');
      if (s.phase === 'battle' && !s.cmd && !s.inc) MENU().forEach((m, i) => { const x = 6 + (i % 2) * 74, y = 136 + Math.floor(i / 2) * 21, sel = KEYBOARD && i === s.sel;
        box(c, x, y, 70, 19, m.ok ? (sel ? '#3a4ab0' : '#24308a') : '#1c2460', sel ? '#ffd84a' : m.ok ? '#8a9ae0' : '#3a4280'); T(c, m.label, x + 35, y + 6, m.ok ? '#ffffff' : '#6a72b0', { f: 's', a: 'c' }); });
      else if (s.cmd === 'target') T(c, KEYBOARD ? 'ARROWS + ENTER TO AIM' : 'TAP AN ENEMY TO AIM', 78, 152, '#ffd84a', { f: 's', a: 'c' });
      else T(c, s.inc ? 'BLOCK AS THE RING LANDS!' : s.cmd === 'bar' ? 'TAP TO STOP: CENTER = 20' : s.cmd === 'mash' ? 'TAP TAP TAP TAP!' : s.phase === 'battle' ? 'SLOW MOTION...' : '...', 78, 152, '#ffd84a', { f: 's', a: 'c' });
      R(c, 156, 136, 1, 38, '#3a4ab0');
      T(c, 'MISHA', 162, 139, '#ffffff'); T(c, s.klass.name, 312, 140, '#a8b8f0', { f: 's', a: 'r' });
      T(c, 'HP', 162, 155, '#a8b8f0', { f: 's' }); box(c, 176, 155, 90, 7, '#0e0c22', '#ffffff'); R(c, 178, 157, Math.round(86 * s.hp / s.max), 3, s.hp > s.max / 2 ? '#3cc060' : s.hp > s.max / 4 ? '#f4d24a' : '#ff5050');
      T(c, s.hp + '/' + s.max, 312, 155, '#ffffff', { f: 's', a: 'r' });
      const ready = s.atb >= 1; T(c, ready ? 'READY!' : 'CHARGE', 162, 166, ready && Math.floor(s.clock * 4) % 2 ? '#ffd84a' : '#a8b8f0', { f: 's' }); box(c, 196, 167, 50, 5, '#0e0c22', '#ffffff'); R(c, 197, 168, Math.round(48 * s.atb), 3, ready ? '#ffd84a' : '#8a9ae0');
      T(c, fmt(s.score), 312, 166, '#ffd84a', { f: 's', a: 'r' });
    }
    function draw(c) {
      c.save(); if (s.shake > 0) c.translate(Math.round((Math.random() - .5) * 6), Math.round((Math.random() - .5) * 4));
      drawDungeon(c);
      if (s.phase === 'class') {
        c.restore(); R(c, 0, 0, W, H, '#14102a');
        TS(c, 'CHOOSE MISHA\'S CLASS', 160, 10, '#ffd84a', '#2a1250', { a: 'c' });
        CLASSES.forEach((k, i) => { const x = 8 + i * 104, sel = KEYBOARD && s.sel === i, img = sprites[k.id] || (sprites[k.id] = sprite(recolor(SPR.mishaBard, k.map)));
          box(c, x, 34, 96, 112, '#1c2a5a', sel ? '#ffd84a' : '#5a6ab0', sel ? 2 : 1);
          if (k.id === 'wizard') { c.fillStyle = '#3a4ab0'; c.beginPath(); c.moveTo(x + 36, 46); c.lineTo(x + 60, 46); c.lineTo(x + 51, 30); c.closePath(); c.fill(); }
          blit(c, img, x + 32, 42, 2); T(c, k.name, x + 48, 84, '#ffffff', { a: 'c' }); T(c, 'HP ' + k.hp, x + 48, 96, '#3cc060', { f: 's', a: 'c' });
          k.blurb.forEach((b, j) => T(c, b, x + 48, 108 + j * 10, j ? '#c8c8d8' : '#ffd84a', { f: 's', a: 'c' })); });
        T(c, KEYBOARD ? 'ARROWS + ENTER, OR CLICK A CLASS' : 'TAP A CLASS TO BEGIN', 160, 160, '#c8c8d8', { f: 's', a: 'c' });
        return;
      }
      for (const f of s.foes) drawFoe(c, f);
      drawMisha(c);
      if (s.inc && !s.inc.result) {
        const p = clamp(ringP(s.inc.ring, s.inc.t), 0, 1.2), r = Math.max(6, Math.round(6 + (1 - p) * 40)), cy = FLOOR_Y - 18;
        c.fillStyle = '#ffffff'; for (let k = 0; k < 60; k++) { const t = k / 60 * Math.PI * 2; c.fillRect(Math.round(MISHA_X + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), 2, 2); }
        c.fillStyle = '#4fd6ff'; for (let k = 0; k < 30; k++) { const t = k / 30 * Math.PI * 2; c.fillRect(Math.round(MISHA_X + Math.cos(t) * 6), Math.round(cy + Math.sin(t) * 6), 1, 1); }
        if (s.inc.f.K.boss) { const bx = foeX(s.inc.f) + 20 + (MISHA_X - foeX(s.inc.f) - 40) * p, by = 70 + p * 30; blit(c, spr('bolt'), bx, by, 2); }
      }
      c.restore();
      if (s.cmd && s.phase === 'battle') { c.globalAlpha = .18; R(c, 0, 0, W, 132, '#4fd6ff'); c.globalAlpha = 1; }
      if (s.cmd === 'bar') {
        box(c, 60, 50, 200, 34, '#0a0810', '#ffffff', 2); T(c, 'ROLL TO HIT', 160, 54, '#ffffff', { f: 's', a: 'c' });
        for (let x = 0; x < 180; x++) { const e = Math.abs(x / 179 - .5) * 2; R(c, 70 + x, 66, 1, 8, e < .055 ? '#ffd84a' : e < .35 ? '#3cc060' : e < .7 ? '#c8a020' : e > .95 ? '#5a0a0a' : '#a02020'); }
        const mx = 70 + Math.round(s.barPos * 179); R(c, mx - 1, 62, 3, 16, '#ffffff'); R(c, mx, 63, 1, 14, '#0e0c14');
        T(c, '20', 160, 76, '#ffd84a', { f: 's', a: 'c' });
      }
      if (s.cmd === 'rolling') { const spin = s.ct < .45, v = spin ? 1 + Math.floor(Math.random() * 20) : s.d20.value; d20(c, 160, 66, 20, String(v), true); if (!spin) T(c, v === 20 ? 'NAT 20!' : v === 1 ? 'NAT 1...' : '+' + s.klass.mod + ' = ' + (v + s.klass.mod), 160, 92, v === 20 ? '#ffd84a' : '#ffffff', { f: 's', a: 'c' }); }
      if (s.cmd === 'mash') { box(c, 90, 46, 140, 40, '#2a0a0a', '#ff8a2a', 2); TO(c, 'FIREBALL!', 160, 52, '#ffd84a', '#7a1a00', null, { a: 'c' }); T(c, s.taps + ' TAPS', 160, 66, '#ffffff', { a: 'c' }); R(c, 96, 79, Math.round(128 * clamp(1 - s.ct / 2, 0, 1)), 3, '#ff8a2a'); }
      if (s.cmd === 'mock') {
        const f = s.foes[s.target]; box(c, 34, 24, 252, 104, '#0a0810', '#ffffff', 2);
        T(c, f.K.name + ' WEAKNESS: ' + f.K.weak, 160, 30, '#ff8ab0', { f: 's', a: 'c' }); T(c, 'PICK THE INSULT THAT STINGS', 160, 41, '#ffd84a', { f: 's', a: 'c' });
        s.insults.forEach((ins, i) => { box(c, 40, 54 + i * 16, 240, 14, '#1c2a5a', '#5a6ab0'); T(c, 'ABC'[i] + '  ' + ins.x, 46, 58 + i * 16, '#ffffff', { f: 's' }); });
      }
      if (s.mockLine) { const w = s.mockLine.text.length * 6 + 10; box(c, MISHA_X - w + 20, 46, w, 13, '#ffffff', '#0e0c14'); T(c, s.mockLine.text, MISHA_X - w / 2 + 20, 49, '#0e0c14', { f: 's', a: 'c' }); }
      if (s.phase === 'rest') {
        box(c, 40, 24, 240, 104, '#0a0810', '#e0b040', 2); TO(c, 'ROOM CLEARED!', 160, 30, '#e0b040', '#0e0c14', null, { a: 'c' }); T(c, 'MISHA RESTS. CHOOSE A REWARD:', 160, 46, '#ffffff', { f: 's', a: 'c' });
        s.boons.forEach((b, i) => { box(c, 50, 64 + i * 22, 220, 18, '#1c2a5a', '#5a6ab0'); T(c, 'ABC'[i] + '  ' + b.label, 58, 70 + i * 22, '#ffffff', { f: 's' }); });
      }
      drawPanel(c);
      if (s.phase === 'roomcard') { box(c, 70, 44, 180, 40, '#0a0810', '#e0b040', 2); TO(c, 'ROOM ' + (s.room + 1), 160, 50, '#e0b040', '#0e0c14', null, { a: 'c' }); T(c, ROOMS[s.room].name, 160, 68, '#ffffff', { f: 's', a: 'c' });
        if (s.room === 3) T(c, '"YOU DARE CHALLENGE THE LORD OF THE VOLTS?"', 160, 94, '#ffd84a', { f: 's', a: 'c' }); }
      if (s.banner) { const w = Math.min(316, s.banner.text.length * 6 + 14); box(c, 160 - w / 2, 4, w, 13, '#0a0810', '#ffffff'); T(c, s.banner.text, 160, 7, '#ffffff', { f: 's', a: 'c' }); }
      if (s.phase === 'victory') { R(c, 0, 0, W, 132, 'rgba(10,8,24,.6)'); TO(c, 'VICTORY!', 160, 40, '#ffd84a', '#0e0c14', '#a03a8a', { size: 16, a: 'c' }); T(c, 'SEBASTIAN RETREATS TO CHARGE HIS BOARD.', 160, 64, '#ffffff', { f: 's', a: 'c' }); T(c, 'MISHA IS THE LAVENDER KING OF THE DUNGEON.', 160, 76, '#ff8ab0', { f: 's', a: 'c' }); }
      if (s.phase === 'defeat') { R(c, 0, 0, W, 132, 'rgba(24,4,8,.65)'); TO(c, 'DEFEATED...', 160, 46, '#ff5050', '#0e0c14', null, { size: 16, a: 'c' }); T(c, 'MISHA NEEDS MORE SWEET WHITE WINE.', 160, 70, '#ffffff', { f: 's', a: 'c' }); }
      for (const f of s.fx) TO(c, f.text, f.x, f.y - (f.max - f.t) * 14, f.col, '#0e0c14', null, { a: 'c' });
    }
    if (window.__dndDebug) window.__dndDebug(s, { MENU, living, KINDS, RINGS, ringP });
    return { update, draw };
  }

  registerEvent({ id: 'dnd', name: 'ROLL FOR INITIATIVE', star: 'misha', sub: 'MISHA  /  DUNGEONS & DRAGONS', icon: 'd20', create });
})();
