// ===== Volt Run: Sebastian's electric skateboard ride home =====
(() => {
  const ZONES = [
    { name: 'DOWNTOWN', from: 0, to: 2200 },
    { name: 'BIKE PATH', from: 2200, to: 4400 },
    { name: 'TRAILS', from: 4400, to: 6600 },
  ];
  const FINISH = 6600, RIDER_X = 70, BASE_Y = 140;
  const zoneAt = d => d < 2200 ? 0 : d < 4400 ? 1 : 2;
  function height(d) {
    d = clamp(d, 0, FINISH - 1); const z = ZONES[zoneAt(d)], u = (d - z.from) / (z.to - z.from), w = Math.sin(Math.PI * u);
    const S = Math.sin, P = Math.PI;
    if (z === ZONES[0]) return w * 16 * S(u * P * 2);
    if (z === ZONES[1]) return w * (6 * S(u * P * 4) + 3 * S(u * P * 9));
    return w * (8 * S(u * P * 6) + 1.5 * S(u * P * 13 + 1));
  }
  const groundY = d => BASE_Y - height(d);
  const slope = d => (height(d + 3) - height(d - 3)) / 6;

  // what's on the course. h = how tall it is (hop over it), slow = speed you can roll over it at.
  const KINDS = {
    cone: { w: 8, h: 11, slow: 40 }, pothole: { w: 22, h: 1, slow: 40 }, bump: { w: 14, h: 4, slow: 60 },
    rock: { w: 10, h: 8, slow: 40 }, root: { w: 16, h: 3, slow: 55 }, hans: { w: 20, h: 13, slow: 40, dog: 'dogHans' }, lexie: { w: 16, h: 11, slow: 40, dog: 'dogLexie' },
    misha: { w: 14, h: 17, ped: true }, bolt: { w: 8, pickup: true }, coffee: { w: 9, pickup: true },
  };
  const COURSE = [
    [380, 'cone'], [620, 'pothole'], [760, 'bolt'], [930, 'cone'], [1120, 'bump'], [1300, 'coffee'], [1600, 'cone'], [1720, 'pothole'], [1960, 'misha'], [2080, 'bolt'],
    [2520, 'hans'], [2720, 'bolt'], [2920, 'bump'], [3180, 'lexie'], [3300, 'cone'], [3620, 'bolt'], [3820, 'coffee'], [4060, 'bump'], [4260, 'bolt'],
    [4620, 'root'], [4820, 'rock'], [4960, 'bolt'], [5160, 'root'], [5360, 'rock'], [5460, 'root'], [5720, 'bolt'], [5900, 'rock'], [6060, 'root'], [6250, 'rock'], [6420, 'bolt'],
  ];

  // rough ground: go over the limit and the board shakes apart
  const LIMIT = 80; // px/s, which the HUD shows as 16 mph
  const WOBBLE = 160; // above this (32 mph) the board starts to wobble; only throttling downhill gets here
  const ROUGH = [
    { from: 1380, to: 1500, kind: 'cobbles' },
    { from: 3460, to: 3600, kind: 'gravel' },
    { from: 5560, to: 5700, kind: 'rocky' },
  ];
  const roughAt = d => ROUGH.find(r => d >= r.from && d <= r.to);

  // ---- backgrounds, one per zone, drawn with parallax ----
  let skyline, mountains;
  function skylineTile() {
    if (skyline) return skyline;
    const bh = [30, 44, 26, 52, 38, 20, 46, 34, 58, 28, 40, 24, 50, 36];
    let x = 0; const tw = bh.reduce((a, _, i) => a + 18 + (i * 7) % 14 + 2, 0);
    skyline = document.createElement('canvas'); skyline.width = tw; skyline.height = 90; const c = skyline.getContext('2d');
    bh.forEach((h, i) => { const w = 18 + (i * 7) % 14; R(c, x, 60 - h, w, h + 30, '#5a6aa8'); for (let wy = 60 - h + 4; wy < 68; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if ((wx - x + wy + i) % 3) R(c, wx, wy, 2, 3, '#8ea0d8'); x += w + 2; });
    return skyline;
  }
  function mountainStrip() {
    if (mountains) return mountains;
    mountains = document.createElement('canvas'); mountains.width = W + Math.ceil(FINISH * .04) + 4; mountains.height = 60; const c = mountains.getContext('2d');
    for (let x = 0; x < mountains.width; x++) { const top = Math.round(56 + 9 * Math.sin(x * .045) + 5 * Math.sin(x * .13 + 1) + 3 * Math.abs(Math.sin(x * .31)));
      R(c, x, top - 40, 1, 100 - top, '#6a7ab0'); if (top < 58) R(c, x, top - 40, 1, 5, '#eef0fb'); }
    return mountains;
  }
  function bgCity(c, cam) {
    bands(c, ['#2a5ac8', '#3a6ad8', '#4a7ee0', '#5a92e8', '#70a8ee', '#8cc0f2', '#a8d4f4'], [24, 16, 14, 12, 12, 12, 90]);
    const off = cam * .25, tile = skylineTile();
    for (let k = -1; k < 2; k++) c.drawImage(tile, Math.round(k * tile.width - (off % tile.width)), 40);
    R(c, 0, 112, W, H, '#3e6e34'); R(c, 0, 112, W, 1, '#4e8a40');
    const o2 = cam * .5; for (let i = -1; i < 18; i++) { const tx = i * 22 - (o2 % 22); for (let r = 0; r < 14; r++) R(c, tx + 8 - Math.floor(r / 2), 96 + r, Math.floor(r / 2) * 2 + 2, 1, r % 4 === 3 ? '#14432c' : '#1c5a3a'); R(c, tx + 7, 110, 2, 4, '#4a301a'); }
  }
  function bgPath(c, cam) {
    bands(c, ['#3a78d8', '#4c8ae0', '#62a0e8', '#7ab4ee', '#94c8f2', '#b0dcf6'], [22, 16, 14, 12, 12, 104]);
    c.drawImage(mountainStrip(), -Math.round(cam * .04), 40);
    R(c, 0, 98, W, 14, '#2a6ab0'); const o3 = cam * .12; for (let i = 0; i < 24; i++) R(c, (i * 37 - o3 % 37 + 400) % 330 - 5, 101 + (i * 5) % 9, 6, 1, '#8ac8f0');
    R(c, 0, 112, W, H, '#4a8a3a');
    const o4 = cam * .8; for (let i = -1; i < 12; i++) { const fx = i * 32 - (o4 % 32); R(c, fx, 106, 2, 12, '#8a6a4a'); R(c, fx - 14, 109, 32, 1, '#a88a6a'); }
  }
  function bgTrail(c, cam) {
    bands(c, ['#3a8ab8', '#4c9cc4', '#62aecf', '#80c0d8', '#a0d2e0'], [24, 18, 16, 14, 108]);
    const layer = (par, base, size, col, dark, step) => { const o = cam * par; for (let i = -1; i < W / step + 2; i++) { const tx = i * step - (o % step), hh = size + ((i + Math.floor(o / step)) * 7 % 5) * 3;
      for (let r = 0; r < hh; r++) { const hw = Math.floor(r / 2.2) + 1; R(c, tx - hw, base - hh + r, hw * 2, 1, r % 5 === 4 ? dark : col); } R(c, tx - 1, base, 2, 6, '#3a2414'); } };
    layer(.15, 104, 26, '#2a5a5a', '#22484a', 16);
    R(c, 0, 109, W, H, '#2e4a34');
    layer(.45, 116, 34, '#1c5a3a', '#14432c', 24);
    R(c, 0, 121, W, H, '#24361e');
    c.globalAlpha = .12; c.fillStyle = '#fff6c0'; c.beginPath(); c.moveTo(220, 0); c.lineTo(250, 0); c.lineTo(190, 130); c.lineTo(150, 130); c.fill(); c.globalAlpha = 1;
  }
  const BGS = [bgCity, bgPath, bgTrail];
  const SURF = [
    { top: '#6a6a78', fill: '#3a3a46', side: '#a8a8b4', under: '#3a3a46', band: 40 },
    { top: '#d8c8a0', fill: '#a89870', side: '#5a9a44', under: '#4a8a3a', band: 12 },
    { top: '#8a6236', fill: '#5a3a20', side: '#2e6a34', under: '#24361e', band: 12 },
  ];

  function create(api) {
    const s = {
      d: 0, v: 0, alt: 0, vy: 0, battery: 100, t: 0, start: 3.2, wipe: 0, wipeouts: 0, bolts: 0, boost: 0,
      wobble: 0, shake: 0, rattle: 0, done: 0, banner: { text: 'DOWNTOWN', t: 2.5 }, zone: 0, hintT: 7, fx: [], over: false,
      objs: COURSE.map(([x, k]) => ({ x, k, ...KINDS[k], hit: false, aside: 0 })),
    };
    if (window.__voltDebug) window.__voltDebug(s);
    const motor = Sound.voice('sawtooth', 700);
    let rattleTick = 0;
    let lastCount = 4;

    function crash(why) {
      s.wipe = 1.4; s.v = 0; s.alt = 0; s.vy = 0; s.wipeouts++; s.battery = Math.max(0, s.battery - 3); s.shake = 6; s.wobble = 0;
      s.fx.push({ text: why, t: 1.4, x: RIDER_X + 10, y: 70, col: '#ff6a6a' });
      Sound.noise(.4, { vol: .35, freq: 900 }); Sound.tone(220, .3, { type: 'sawtooth', slide: -150, vol: .12 });
    }

    function update(dt) {
      s.t += dt; if (s.banner) { s.banner.t -= dt; if (s.banner.t <= 0) s.banner = null; }
      s.shake = Math.max(0, s.shake - dt * 20); s.hintT -= dt;
      s.fx = s.fx.filter(f => (f.t -= dt) > 0);
      if (s.start > 0) {
        s.start -= dt; const n = Math.ceil(s.start);
        if (n !== lastCount && n >= 0) { lastCount = n; if (n > 0) Sound.tone(440, .12); else Sound.tone(880, .3); }
        motor.set(60, 0); return;
      }
      if (s.over) { s.done += dt; s.v = Math.max(0, s.v - 120 * dt); s.d += s.v * dt; motor.set(60, 0);
        if (s.done > 1.8) { const score = Math.max(0, Math.round(15000 - s.t * 100 + s.battery * 40 + s.bolts * 100 - s.wipeouts * 800));
          api.finish({ score, headline: s.wipeouts === 0 ? 'CLEAN RUN!' : s.battery <= 0 ? 'KICK-PUSHED HOME' : 'MADE IT HOME', stats: [['TIME', s.time.toFixed(1) + 's'], ['BATTERY LEFT', Math.round(s.battery) + '%'], ['BOLTS GRABBED', String(s.bolts)], ['WIPEOUTS', String(s.wipeouts)]] }); }
        return; }

      const go = Input.held(p => p.x >= 160) || Input.key('ArrowRight', 'KeyD');
      const brake = Input.held(p => p.x < 160) || Input.key('ArrowLeft', 'KeyA', 'ArrowDown', 'KeyS');
      const hop = Input.swipes.length > 0 || Input.keyPressed('ArrowUp', 'KeyW', 'Space');
      const dead = s.battery <= 0, grounded = s.alt <= 0;
      s.kicking = false;

      if (s.wipe > 0) { s.wipe -= dt; motor.set(50, 0); }
      else {
        let a = 0;
        if (brake) { if (s.v > 0) a -= 140; }
        else if (go) {
          if (dead) { s.kicking = true; if (s.v < 36) a += 40; s.v = Math.max(s.v, 22); }
          else { const vmax = s.boost > 0 ? 165 : 125; if (s.v < vmax) a += 78; if (s.boost <= 0) s.battery = Math.max(0, s.battery - 2.4 * dt); }
        }
        if (grounded) a -= 9 + .1 * s.v + .039 * Math.max(0, s.v - 120) ** 2;
        a -= 700 * slope(s.d);
        s.v = Math.max(0, s.v + a * dt);
        if (s.v < 1 && !go) s.v = 0;
        s.d += s.v * dt;
        if (hop && grounded) { s.vy = 150; s.alt = .01; Sound.tone(300, .15, { slide: 500, vol: .1 }); }
        if (s.alt > 0) { s.alt += s.vy * dt; s.vy -= 420 * dt; if (s.alt <= 0) { s.alt = 0; s.vy = 0; Sound.noise(.06, { vol: .12, freq: 600 }); if (roughAt(s.d) && s.v > LIMIT) crash('HARD LANDING!'); } }
        s.boost -= dt;
        if (s.v > WOBBLE) { s.wobble += dt; if (s.wobble > 1.6) crash('SPEED WOBBLE!'); } else s.wobble = Math.max(0, s.wobble - dt * 2);
        const hum = s.kicking ? 0 : (go && !dead ? .05 + s.v / 125 * .05 : s.v > 5 ? .015 : 0);
        motor.set(55 + s.v * 1.5, hum, 400 + s.v * 6);
        const r = roughAt(s.d);
        if (r && s.alt <= 0 && s.wipe <= 0) {
          rattleTick -= dt; if (rattleTick <= 0) { rattleTick = .07; Sound.noise(.05, { vol: s.v > LIMIT ? .14 : .05, freq: 500 }); }
          if (s.v > LIMIT) { s.rattle += dt; s.shake = Math.max(s.shake, 1 + (s.v - LIMIT) / 12); if (s.rattle > .45) crash('TOO FAST!'); }
          else s.rattle = Math.max(0, s.rattle - dt);
        } else s.rattle = Math.max(0, s.rattle - dt * 2);
      }

      // zone banners
      const z = zoneAt(s.d); if (z !== s.zone) { s.zone = z; s.banner = { text: ZONES[z].name, t: 2.2 }; Sound.jingle([523, 659, 784], { step: .08, vol: .08 }); }

      // course objects
      for (const o of s.objs) {
        if (o.dog && !o.hit && o.x - s.d < 240) o.x -= 34 * dt;
        if (o.ped && !o.aside && o.x - s.d < 110 && s.v <= 45) { o.aside = 1; s.fx.push({ text: 'BREAK A LEG!', t: 1.4, x: o.x, world: true, y: 84, col: '#ffd84a' }); }
        if (o.aside > 0 && o.aside < 12) o.aside = Math.min(12, o.aside + dt * 40);
        if (o.hit) continue;
        const front = s.d + 12, back = s.d - 12;
        if (front < o.x || back > o.x + o.w) continue;
        if (o.pickup) {
          if (s.alt > 8) { o.hit = true;
            if (o.k === 'bolt') { s.bolts++; s.battery = Math.min(100, s.battery + 8); s.fx.push({ text: '+8%', t: 1, x: RIDER_X, y: 90, col: '#3cc060' }); Sound.jingle([660, 880, 1320], { step: .05, vol: .1 }); }
            else { s.boost = 3.5; s.fx.push({ text: 'COFFEE BOOST!', t: 1.2, x: RIDER_X, y: 90, col: '#ffd84a' }); Sound.jingle([392, 523, 784, 1047], { step: .05, vol: .1 }); } }
          continue;
        }
        if (o.ped) {
          if (o.aside) continue;
          if (s.alt >= o.h) { if (!o.cleared) { o.cleared = true; s.fx.push({ text: 'NICE HOP!', t: 1.2, x: RIDER_X + 10, y: 76, col: '#ffd84a' }); Sound.jingle([784, 988], { step: .06, vol: .08 }); } continue; }
          o.hit = true; crash('WATCH IT, SEB!'); continue; }
        if (s.alt >= o.h) continue;
        if (o.slow && s.v <= o.slow) { o.hit = true; o.passed = true;
          if (o.dog) { s.fx.push({ text: o.k === 'hans' ? 'PETS FOR HANS!' : 'PETS FOR LEXIE!', t: 1.4, x: RIDER_X + 10, y: 80, col: '#ffd84a' }); Sound.jingle([660, 784], { step: .07, vol: .08 }); }
          else { Sound.noise(.08, { vol: .15, freq: 400 }); s.shake = 2; }
          continue; }
        o.hit = true;
        crash(o.dog ? (o.k === 'hans' ? 'HANS!!' : 'LEXIE!!') : 'WIPEOUT!');
      }

      if (s.d >= FINISH && !s.over) { s.over = true; s.time = s.t; Sound.jingle([523, 659, 784, 1047, 784, 1047], { step: .1 }); s.banner = { text: 'HOME!', t: 3 }; }
    }

    function drawObj(c, o, cam) {
      const sx = Math.round(o.x - cam); if (sx < -40 || sx > W + 40) return;
      const gy = Math.round(groundY(o.x + o.w / 2));
      switch (o.k) {
        case 'cone': if (o.hit && !o.passed) { R(c, sx - 2, gy - 3, 12, 3, '#f08a2a'); break; } R(c, sx + 3, gy - 11, 2, 2, '#f08a2a'); R(c, sx + 2, gy - 9, 4, 3, '#f08a2a'); R(c, sx + 1, gy - 6, 6, 2, '#ffffff'); R(c, sx, gy - 4, 8, 3, '#f08a2a'); R(c, sx - 2, gy - 1, 12, 2, '#c06a1a'); break;
        case 'pothole': R(c, sx, gy, o.w, 3, '#0e0c14'); R(c, sx + 2, gy - 1, o.w - 4, 1, '#14141c'); break;
        case 'bump': R(c, sx + 2, gy - 4, o.w - 4, 4, '#2a2a2a'); for (let i = 0; i < o.w - 4; i += 4) R(c, sx + 2 + i, gy - 4, 2, 4, '#f4d24a'); R(c, sx, gy - 2, o.w, 2, '#2a2a2a'); break;
        case 'rock': disc(c, sx + 5, gy - 3, 4, '#7a7a88'); R(c, sx + 2, gy - 6, 4, 1, '#a8a8b8'); break;
        case 'root': for (let i = 0; i < o.w; i++) R(c, sx + i, gy - Math.round(Math.sin(i / o.w * Math.PI) * 3), 1, 2, '#3a2414'); break;
        case 'hans': case 'lexie': {
          const img = spr(o.dog); blit(c, img, sx, gy - img.height + 1, 1, true);
          if (!o.hit && o.x - (cam + RIDER_X) < 180) T(c, o.k === 'hans' ? 'HANS' : 'LEXIE', sx + img.width / 2, gy - img.height - 9, '#ffffff', { f: 's', a: 'c' });
          break; }
        case 'misha': {
          const yy = gy - 19 - Math.round(o.aside); blit(c, spr('mishaReading'), sx, yy);
          if (!o.aside && o.x - (cam + RIDER_X) < 200) { box(c, sx - 34, yy - 16, 82, 12, '#ffffff', '#0e0c14'); T(c, 'TO BE OR NOT...', sx + 7, yy - 13, '#0e0c14', { f: 's', a: 'c' }); }
          break; }
        case 'bolt': if (!o.hit) blit(c, spr('bolt'), sx, gy - 30 + Math.round(Math.sin(s.t * 5 + o.x) * 2)); break;
        case 'coffee': if (!o.hit) { blit(c, spr('coffee'), sx, gy - 28 + Math.round(Math.sin(s.t * 5) * 2)); if (Math.floor(s.t * 4) % 2) R(c, sx + 2, gy - 32, 1, 2, '#ffffff'); } break;
      }
    }

    function drawRider(c, gy) {
      const y = Math.round(gy - s.alt) - (roughAt(s.d) && s.alt <= 0 && s.v > 5 && Math.floor(s.t * 20) % 2 ? 1 : 0), x = RIDER_X;
      if (s.wipe > 0) {
        const k = 1.4 - s.wipe; blitRot(c, spr('sebHelmet'), x + k * 26, y - 12 - Math.sin(k / 1.4 * Math.PI) * 14, k * 9);
        R(c, x - 14 + k * 50, y - 6 + k * 3, 28, 2, '#2a2a34'); return;
      }
      const glow = Input.held(p => p.x >= 160) || Input.key('ArrowRight', 'KeyD');
      if (glow && s.battery > 0) R(c, x - 12, y + 1, 24, 1, '#4fd6ff');
      R(c, x - 16, y - 7, 32, 2, '#2a2a34'); R(c, x - 16, y - 8, 32, 1, '#5a5a68'); R(c, x - 18, y - 9, 2, 2, '#2a2a34'); R(c, x + 16, y - 9, 2, 2, '#2a2a34');
      R(c, x - 9, y - 5, 18, 2, '#14141c'); R(c, x - 8, y - 5, Math.round(16 * s.battery / 100), 1, s.battery > 20 ? '#4fd6ff' : '#ff6a6a');
      for (const wx of [x - 11, x + 11]) { disc(c, wx, y - 2, 2, '#0e0c14'); R(c, wx - 1, y - 3, 2, 2, '#c8c8d4'); }
      const kick = s.kicking && Math.floor(s.t * 4) % 2;
      blit(c, spr(kick ? 'sebKick' : 'sebHelmet'), x - 8, y - 30);
      if (s.boost > 0) for (let i = 0; i < 3; i++) R(c, x - 22 - i * 7 - (s.t * 60 % 7), y - 18 + i * 5, 5, 1, '#ffd84a');
      if (s.v > 60) for (let i = 0; i < 4; i++) R(c, x - 30 - ((s.t * 300 + i * 37) % 40), y - 26 + i * 7, 8 + i * 2, 1, '#ffffff');
    }

    function draw(c) {
      const cam = s.d - RIDER_X;
      c.save();
      if (s.shake > 0 || s.wobble > 0) { const k = s.shake + (s.v > WOBBLE ? Math.min(3, (s.v - WOBBLE) / 4) : 0); c.translate(Math.round((Math.random() - .5) * k), Math.round((Math.random() - .5) * k)); }
      const z = zoneAt(s.d); BGS[z](c, cam);
      const since = s.d - ZONES[z].from; if (z > 0 && since < 220) { c.globalAlpha = 1 - since / 220; BGS[z - 1](c, cam); c.globalAlpha = 1; }
      // ground, one column at a time
      for (let x = 0; x < W; x++) {
        const wd = cam + x, gy = Math.round(groundY(wd)), sf = SURF[zoneAt(clamp(wd, 0, FINISH - 1))];
        R(c, x, gy - 7, 1, 7, sf.side); R(c, x, gy, 1, 2, sf.top); R(c, x, gy + 2, 1, sf.band, sf.fill); R(c, x, gy + 2 + sf.band, 1, H, sf.under); if (sf.band < 40) R(c, x, gy + 2 + sf.band, 1, 1, sf.top);
        const rg = roughAt(wd);
        if (rg) {
          const n = Math.round(wd);
          if (rg.kind === 'cobbles') { for (let yy = 0; yy < 10; yy += 3) R(c, x, gy + yy, 1, 2, (Math.floor(n / 5) + yy / 3) % 2 ? '#8a8a98' : '#6e6e7c'); if (n % 5 === 0) R(c, x, gy, 1, 10, '#4a4a56'); }
          else if (rg.kind === 'gravel') { R(c, x, gy + ((n * 7) % 9), 1, 1, '#f0e2b8'); R(c, x, gy + ((n * 13) % 11), 1, 1, '#6a5a3c'); if (n % 6 < 2) R(c, x, gy - 1, 1, 1, sf.top); }
          else { if ((n * 5) % 7 < 3) R(c, x, gy - ((n * 3) % 3), 1, 3, '#8a8a98'); if (n % 4 === 0) R(c, x, gy + 4, 1, 2, '#6a6a78'); }
        }
        if (zoneAt(wd) === 0) { if (Math.floor(wd / 16) % 1 === 0 && Math.round(wd) % 16 === 0) R(c, x, gy - 7, 1, 7, '#8a8a96'); if (Math.floor(wd / 12) % 2 === 0) R(c, x, gy + 16, 1, 2, '#f4d24a'); }
        else if (zoneAt(wd) === 2 && Math.round(wd * 7) % 23 === 0) R(c, x, gy + 6 + Math.round(wd) % 9, 2, 1, '#7a5230');
        else if (zoneAt(wd) === 1 && Math.round(wd) % 9 === 0) R(c, x, gy - 8, 1, 2, '#3a7a30');
      }
      // finish line and the welcome party
      const fx = FINISH - cam;
      if (fx < W + 80) {
        const gy = Math.round(groundY(FINISH - 1));
        R(c, fx - 2, gy - 50, 2, 50, '#e8e8f0'); R(c, fx + 58, gy - 50, 2, 50, '#e8e8f0');
        for (let i = 0; i < 30; i++) for (let j = 0; j < 2; j++) R(c, fx + i * 2, gy - 50 + j * 2, 2, 2, (i + j) % 2 ? '#0e0c14' : '#ffffff');
        box(c, fx + 4, gy - 44, 52, 11, '#9a66d8', '#0e0c14'); T(c, 'HOME', fx + 30, gy - 42, '#ffffff', { f: 's', a: 'c' });
        blit(c, spr('sophia'), fx + 80, gy - 12);
        box(c, fx + 54, gy - 34, 88, 13, '#ffffff', '#0e0c14'); R(c, fx + 86, gy - 21, 2, 9, '#8a6236');
        T(c, 'GO UNCLE SEB!', fx + 98, gy - 31, '#c0323a', { f: 's', a: 'c' });
      }
      for (const r of ROUGH) {
        const sx = Math.round(r.from - 44 - cam); if (sx < -50 || sx > W + 50) continue;
        const gy = Math.round(groundY(r.from - 44));
        R(c, sx + 20, gy - 26, 2, 26, '#8a8a96');
        box(c, sx, gy - 44, 42, 20, '#f4d24a', '#0e0c14'); T(c, 'ROUGH', sx + 21, gy - 42, '#0e0c14', { f: 's', a: 'c' }); T(c, '16 MPH', sx + 21, gy - 33, '#0e0c14', { f: 's', a: 'c' });
      }
      for (const o of s.objs) drawObj(c, o, cam);
      drawRider(c, groundY(s.d));
      for (const f of s.fx) TO(c, f.text, f.world ? f.x - cam : f.x, f.y - (1.4 - f.t) * 10, f.col, '#0e0c14', null, { f: 's', a: 'c' });
      c.restore();

      // HUD
      R(c, 0, 0, W, 15, '#0e0c14');
      const bc = s.battery > 50 ? '#3cc060' : s.battery > 20 ? '#f4d24a' : '#ff5050';
      box(c, 4, 3, 30, 9, '#0e0c14', '#ffffff'); R(c, 34, 5, 2, 5, '#ffffff');
      if (s.battery > 10 || Math.floor(s.t * 4) % 2) R(c, 6, 5, Math.round(26 * s.battery / 100), 5, bc);
      T(c, Math.ceil(s.battery) + '%', 40, 4, bc, { f: 's' });
      const nextRough = ROUGH.find(r => s.d <= r.to && r.from - s.d < 220);
      T(c, Math.round(s.v * .2) + ' MPH', 118, 4, s.v > WOBBLE || (nextRough && s.v > LIMIT) ? '#ff5050' : '#ffffff', { a: 'r' });
      if (nextRough && s.v > LIMIT && !s.over && s.wipe <= 0 && Math.floor(s.t * 6) % 2) TO(c, s.d >= nextRough.from ? 'TOO FAST! BRAKE!' : 'ROUGH GROUND AHEAD: 16 MPH', 160, 22, '#ffd84a', '#0e0c14', null, { f: 's', a: 'c' });
      R(c, 130, 6, 160, 3, '#2a2a3a'); for (let i = 1; i < 3; i++) R(c, 130 + i * 53, 5, 1, 5, '#6a6a7a');
      R(c, 130, 6, Math.round(160 * clamp(s.d / FINISH, 0, 1)), 3, '#9a66d8'); R(c, 130 + Math.round(160 * clamp(s.d / FINISH, 0, 1)) - 1, 4, 3, 7, '#ffd84a');
      if (s.wobble > 0 && s.wipe <= 0 && Math.floor(s.t * 6) % 2) TO(c, 'SPEED WOBBLE! LET OFF THE GAS!', 160, 40, '#ff5050', '#0e0c14', null, { a: 'c' });
      if (s.battery <= 0 && !s.over && Math.floor(s.t * 2) % 2) TO(c, 'BATTERY DEAD! KICK-PUSH!', 160, 26, '#ff5050', '#0e0c14', null, { f: 's', a: 'c' });
      if (s.banner) TO(c, s.banner.text, 160, 58, '#ffd84a', '#0e0c14', '#a03a8a', { size: 16, a: 'c' });
      if (s.start > 0) { const n = Math.ceil(s.start); TO(c, n > 0 ? String(n) : 'GO!', 160, 84, '#ffffff', '#0e0c14', '#a03a8a', { size: 16, a: 'c' }); TO(c, 'HOP TO GRAB BOLTS. SLOW DOWN ON ROUGH GROUND.', 160, 108, '#ffffff', '#0e0c14', null, { f: 's', a: 'c' }); }
      if (s.hintT > 0) {
        c.globalAlpha = .6; R(c, 4, 164, 100, 13, '#0e0c14'); R(c, 216, 164, 100, 13, '#0e0c14'); R(c, 120, 164, 80, 13, '#0e0c14'); c.globalAlpha = 1;
        if (KEYBOARD) { T(c, 'LEFT / A: BRAKE', 54, 167, '#ffffff', { f: 's', a: 'c' }); T(c, 'RIGHT / D: GO', 266, 167, '#ffffff', { f: 's', a: 'c' }); T(c, 'UP / SPACE: HOP', 160, 167, '#ffffff', { f: 's', a: 'c' }); }
        else { T(c, '< HOLD: BRAKE', 54, 167, '#ffffff', { f: 's', a: 'c' }); T(c, 'HOLD: GO >', 266, 167, '#ffffff', { f: 's', a: 'c' }); T(c, 'SWIPE UP: HOP', 160, 167, '#ffffff', { f: 's', a: 'c' }); }
      }
    }

    return {
      update, draw,
      pause(p) { if (p) motor.set(50, 0); },
      destroy() { motor.stop(); },
    };
  }

  registerEvent({ id: 'volt', name: 'VOLT RUN', star: 'sebastian', sub: 'SEBASTIAN  /  ELECTRIC SKATEBOARD', icon: 'board', create });
})();
