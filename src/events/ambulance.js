// ===== event: GOLDEN HOUR (Misha drives Sebastian to the hospital) =====
// Pseudo-3D road, the 1980s way: the course is a list of short segments. Each frame the ones
// ahead of the camera are projected and filled in as horizontal strips, nearest first, so a
// hill crest hides whatever is behind it. Sprites are then drawn far to near, clipped the same way.
(() => {
  const SEG = 200, ROAD_W = 1200, LANES = 3, RUMBLE = 3, DRAW = 150;
  const CAM_H = 1000, DEPTH = 1 / Math.tan(50 * Math.PI / 180), PLAYER_Z = CAM_H * DEPTH, HORIZON = H / 2;
  const MAX = SEG * 60, ACCEL = MAX / 4.5, BRAKE = MAX * 1.1, OFFROAD_DECEL = MAX * .7, OFFROAD_LIMIT = MAX * .3;
  const STEER = 2.3, CENTRIFUGAL = .3, PW = .15; // PW: half the ambulance's width, road edge = 1
  const MILES = 17;                              // Sequim to Port Angeles on 101, roughly
  const DRAIN = 1.05;                            // patient health lost per second, always
  const HOLD = 1.5;                              // stretches every straight and curve; sets the run length

  // ---------- sprites (built on first play, after the fonts load) ----------
  let S = null;
  function carRows(body, dark) {
    const g = grid(24, 16);
    rect(g, 1, 6, 22, 12, body); rect(g, 5, 1, 18, 6, body); rect(g, 6, 2, 17, 5, 'j'); pts(g, [[6, 2], [7, 2]], 'a');
    rect(g, 1, 11, 22, 11, dark); rect(g, 1, 8, 3, 9, 'r'); rect(g, 20, 8, 22, 9, 'r'); rect(g, 10, 9, 13, 10, 'y');
    rect(g, 1, 12, 22, 13, 'a'); rect(g, 2, 13, 6, 15, 'c'); rect(g, 17, 13, 21, 15, 'c');
    return g;
  }
  function build() {
    const sp = rows => sprite(toRows(outline(rows)));
    const s = {};
    // the ambulance, from behind; two frames for the light bar
    for (const lit of [0, 1]) {
      const g = grid(30, 22);
      rect(g, 1, 4, 28, 17, 'w'); rect(g, 25, 4, 28, 17, 'x');
      rect(g, 5, 1, 24, 3, 'C'); rect(g, 6, 1, 11, 3, lit ? 'r' : 'R'); rect(g, 18, 1, 23, 3, lit ? 'B' : 'b'); rect(g, 13, 2, 16, 3, 'w');
      rect(g, 4, 6, 12, 9, 'j'); rect(g, 17, 6, 25, 9, 'j'); pts(g, [[5, 6], [6, 6], [18, 6], [19, 6]], 'A');
      rect(g, 1, 11, 28, 12, 'r'); rect(g, 14, 5, 15, 17, 'x');
      rect(g, 7, 13, 9, 15, 'r'); rect(g, 6, 14, 10, 14, 'r'); rect(g, 20, 13, 22, 15, 'r'); rect(g, 19, 14, 23, 14, 'r');
      rect(g, 1, 14, 2, 16, lit ? 'o' : 'r'); rect(g, 27, 14, 28, 16, lit ? 'r' : 'o');
      rect(g, 0, 17, 29, 18, 'a'); rect(g, 3, 18, 8, 21, 'c'); rect(g, 21, 18, 26, 21, 'c'); rect(g, 12, 16, 17, 16, 'y');
      s['amb' + lit] = sp(g);
    }
    // traffic, rear views
    s.sedanR = sp(carRows('r', 'R')); s.sedanB = sp(carRows('b', 'B')); s.sedanY = sp(carRows('y', 'Y')); s.sedanG = sp(carRows('z', 'A'));
    { const g = grid(24, 16); rect(g, 1, 7, 22, 12, 'n'); rect(g, 6, 1, 17, 7, 'n'); rect(g, 7, 2, 16, 5, 'j'); rect(g, 1, 7, 22, 8, 'N');
      rect(g, 1, 9, 3, 10, 'r'); rect(g, 20, 9, 22, 10, 'r'); rect(g, 1, 12, 22, 13, 'a'); rect(g, 2, 13, 6, 15, 'c'); rect(g, 17, 13, 21, 15, 'c'); s.pickup = sp(g); }
    { const g = grid(28, 26); // logging truck: a stack of log ends
      rect(g, 2, 18, 25, 20, 'C'); rect(g, 1, 20, 26, 21, 'a'); rect(g, 2, 21, 7, 25, 'c'); rect(g, 20, 21, 25, 25, 'c');
      for (const [cx, cy] of [[6, 15], [13.5, 15], [21, 15], [9.5, 9], [17.5, 9], [13.5, 3.5]]) { ell(g, cx, cy, 3.6, 3.6, 'q'); ell(g, cx, cy, 2.4, 2.4, 'f'); ell(g, cx, cy, .9, .9, 'u'); }
      rect(g, 1, 4, 1, 18, 'A'); rect(g, 26, 4, 26, 18, 'A'); s.logs = sp(g); }
    { const g = grid(28, 24); // RV
      rect(g, 1, 2, 26, 19, 't'); rect(g, 1, 9, 26, 10, 'b'); rect(g, 1, 11, 26, 11, 'B'); rect(g, 9, 3, 18, 7, 'j');
      rect(g, 22, 2, 23, 18, 'a'); ell(g, 7, 15, 3, 3, 'c'); ell(g, 7, 15, 1.4, 1.4, 'a');
      rect(g, 1, 16, 2, 17, 'r'); rect(g, 25, 16, 26, 17, 'r'); rect(g, 1, 19, 26, 20, 'a'); rect(g, 3, 20, 7, 23, 'c'); rect(g, 20, 20, 24, 23, 'c'); s.rv = sp(g); }
    { const g = grid(22, 20); // farm tractor
      rect(g, 0, 8, 5, 19, 'c'); rect(g, 16, 8, 21, 19, 'c'); rect(g, 1, 10, 4, 17, 'C'); rect(g, 17, 10, 20, 17, 'C');
      rect(g, 6, 9, 15, 15, 'n'); rect(g, 8, 4, 13, 9, 'k'); rect(g, 9, 1, 12, 4, 'y'); rect(g, 7, 15, 14, 16, 'N'); s.tractor = sp(g); }
    // scenery
    { const g = grid(16, 34); rect(g, 7, 29, 8, 33, 'q');
      for (let y = 0; y < 30; y++) { const tier = (y % 8) / 8, hw = Math.min(7.5, 1 + y * .22 + tier * 2.2); rect(g, Math.round(8 - hw), y, Math.round(7 + hw), y, y % 8 < 2 ? 'n' : 'N'); }
      s.fir = sp(g); }
    { const g = grid(20, 8); ell(g, 10, 7, 10, 7, 'N'); ell(g, 10, 7, 9, 6, 'p'); for (let x = 2; x < 18; x += 3) pts(g, [[x, 2], [x + 1, 3]], 'P'); for (let x = 3; x < 18; x += 4) pts(g, [[x, 1]], 'i'); s.lavender = sp(g); }
    { const g = grid(26, 22); rect(g, 1, 8, 24, 21, 'r'); rect(g, 1, 8, 24, 8, 'R');
      for (let y = 0; y < 8; y++) { const hw = y < 3 ? 6 + y * 2 : 12; rect(g, 13 - hw, y, 12 + hw, y, 'Q'); }
      rect(g, 8, 12, 17, 21, 'R'); line2(g, 8, 12, 17, 21, 't'); line2(g, 17, 12, 8, 21, 't'); rect(g, 8, 12, 17, 12, 't'); rect(g, 10, 3, 15, 5, 't'); s.barn = sp(g); }
    { const g = grid(10, 7); rect(g, 0, 0, 9, 6, 'u'); rect(g, 0, 2, 9, 2, 'U'); rect(g, 0, 5, 9, 5, 'U'); s.hay = sp(g); }
    { const g = grid(4, 26); rect(g, 1, 3, 2, 25, 'A'); rect(g, 0, 0, 3, 2, 'a'); pts(g, [[1, 2], [2, 2]], 'y'); s.lamp = sp(g); }
    const building = (wall, trim, win) => { const g = grid(30, 28); rect(g, 0, 2, 29, 27, wall); rect(g, 0, 0, 29, 2, trim);
      for (let y = 5; y < 22; y += 6) for (let x = 3; x < 27; x += 6) rect(g, x, y, x + 3, y + 3, win); rect(g, 12, 22, 17, 27, 'k'); return sp(g); };
    s.bldgA = building('g', 'G', 'v'); s.bldgB = building('f', 'u', 'j'); s.bldgC = building('a', 'A', 'v');
    s.signPA = n => textSign(n, '#1c6a34', '#ffffff', 'PORT ANGELES', String(n));
    s.signHosp = textSign('h', '#1c3a8a', '#ffffff', 'HOSPITAL', 'H  >');
    s.signFarm = textSign('f', '#7a5230', '#f4d24a', 'U-PICK', 'LAVENDER');
    s.signWine = textSign('w', '#5a2482', '#f4cc80', 'WINE', 'TASTING');
    { const c = document.createElement('canvas'); c.width = 96; c.height = 44; const x = c.getContext('2d');
      R(x, 0, 6, 96, 38, '#e8e4dc'); R(x, 0, 6, 96, 3, '#a8a8b8'); R(x, 0, 40, 96, 4, '#5a6070');
      for (let i = 0; i < 6; i++) R(x, 6 + i * 15, 14, 9, 7, '#7ab0d8');
      R(x, 34, 0, 28, 10, '#d83a2a'); T(x, 'EMERGENCY', 48, 2, '#ffffff', { f: 's', a: 'c' });
      R(x, 30, 26, 36, 14, '#3a4a5a'); R(x, 32, 28, 32, 10, '#b8f0ff'); T(x, 'HOSPITAL', 48, 22, '#1c3a8a', { f: 's', a: 'c' });
      R(x, 80, 26, 10, 3, '#d83a2a'); R(x, 83.5, 22.5, 3, 10, '#d83a2a'); R(x, 6, 26, 10, 3, '#d83a2a'); R(x, 9.5, 22.5, 3, 10, '#d83a2a');
      s.hospital = c; }
    // pickups
    { const g = grid(12, 10); rect(g, 0, 2, 11, 9, 'w'); rect(g, 4, 0, 7, 2, 'a'); rect(g, 5, 3, 6, 8, 'r'); rect(g, 3, 5, 8, 6, 'r'); s.medkit = sp(g); }
    { const g = grid(12, 12); for (let i = 0; i < 8; i++) rect(g, 2 + i, 9 - i, 3 + i, 10 - i, 'z'); ell(g, 9.5, 2.5, 2.5, 2.5, 'z'); rect(g, 9, 1, 10, 2, '.'); ell(g, 2.5, 9.5, 2, 2, 'z'); s.wrench = sp(g); }
    { const g = grid(6, 14); rect(g, 2, 0, 3, 4, 'G'); rect(g, 1, 4, 4, 13, 'f'); rect(g, 1, 7, 4, 10, 'w'); pts(g, [[2, 8], [3, 9]], 'p'); s.wine = sp(g); }
    { const g = grid(4, 4); rect(g, 0, 0, 3, 3, '#9a9aa8'); rect(g, 1, 1, 2, 2, '#c8c8d4'); s.smoke = sprite(toRows(g)); }
    s.skater = spr('sebSkate');
    return s;
  }
  function line2(g, x0, y0, x1, y1, ch) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) pts(g, [[Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]], ch); }
  // Sebastian as the patient: his portrait with a head bandage wrapped over the forehead
  const patientCache = {};
  function patientFace(mood) {
    if (patientCache[mood]) return patientCache[mood];
    const rows = sebastianPortrait(mood).map(r => [...r]);
    for (let y = 4; y <= 7; y++) { const xs = rows[y].map((ch, x) => ch !== '.' ? x : -1).filter(x => x >= 0); if (!xs.length) continue;
      const a = xs[0], b = xs[xs.length - 1];
      for (let x = a + 1; x < b; x++) rows[y][x] = y === 4 || y === 7 ? 'x' : 'w'; }
    rows[5][11] = 'r'; rows[6][11] = 'r'; rows[5][12] = 'r'; rows[6][10] = 'R'; // a little spot where he hit the trail
    return (patientCache[mood] = sprite(rows.map(r => r.join(''))));
  }
  const signCache = {};
  function textSign(key, bg, fg, a, b) {
    if (signCache[key]) return signCache[key];
    const w = 72, c = document.createElement('canvas'); c.width = w; c.height = 34; const x = c.getContext('2d');
    R(x, 0, 0, w, 22, '#0e0c14'); R(x, 1, 1, w - 2, 20, bg); R(x, 2, 2, w - 4, 18, fg); R(x, 3, 3, w - 6, 16, bg);
    T(x, a, w / 2, 4, fg, { f: 's', a: 'c' }); T(x, b, w / 2, 11, fg, { f: 's', a: 'c' });
    R(x, 12, 22, 3, 12, '#5a6070'); R(x, w - 15, 22, 3, 12, '#5a6070');
    return (signCache[key] = c);
  }

  // menu icon: the ambulance from the side
  let iconImg = null;
  function icon(c, x, y) {
    if (!iconImg) { const g = grid(22, 14);
      rect(g, 0, 2, 14, 10, 'w'); rect(g, 14, 5, 20, 10, 'w'); rect(g, 15, 6, 18, 8, 'j'); rect(g, 0, 7, 20, 7, 'r');
      rect(g, 5, 3, 7, 6, 'r'); rect(g, 4, 4, 8, 5, 'r'); rect(g, 2, 0, 4, 1, 'r'); rect(g, 9, 0, 11, 1, 'b');
      ell(g, 4.5, 11.5, 2.2, 2.2, 'c'); ell(g, 16.5, 11.5, 2.2, 2.2, 'c'); iconImg = sprite(toRows(outline(g))); }
    blit(c, iconImg, x + 1, y + 5);
  }

  // ---------- the course ----------
  const ZONES = [
    { name: 'SEQUIM', sky: ['#4a7ad8', '#7aa8ec', '#b8d8f8'], grass: ['#5a9a3a', '#4e8c34'], rumble: ['#d83a2a', '#ffffff'], far: 'mtn' },
    { name: 'HIGHWAY 101', sky: ['#5a7aa8', '#8aa4c4', '#c8d4e0'], grass: ['#2f6a2e', '#295f29'], rumble: ['#d83a2a', '#ffffff'], far: 'mtn', trees: true },
    { name: 'PORT ANGELES', sky: ['#5a5aa8', '#d88a9a', '#f8c48a'], grass: ['#4a7a44', '#436e3d'], rumble: ['#a8a8b8', '#e8e8e8'], far: 'water' },
  ];
  // [ease in, hold, ease out, curve, hill (in segment lengths)]
  const COURSE = [
    [0, [[0, 50, 0, 0, 0], [20, 60, 20, 0, 10], [30, 80, 30, -2, 0], [25, 60, 25, 0, -10], [30, 100, 30, 3, 0], [20, 40, 20, 0, 0],
      [40, 90, 40, -3, 15], [25, 50, 25, 0, -15], [30, 120, 30, 2, 0], [20, 60, 20, -4, 0], [30, 80, 30, 0, 10], [40, 100, 40, 3, -10], [20, 80, 20, 0, 0], [30, 60, 30, -2, 5]]],
    [1, [[30, 60, 30, 0, 30], [25, 50, 25, -4, 0], [25, 50, 25, 4, -20], [40, 80, 40, -6, 0], [30, 40, 30, 0, 40], [25, 60, 25, 5, -20], [30, 60, 30, -3, -20],
      [40, 120, 40, 0, 0], [25, 50, 25, 6, 10], [25, 50, 25, -6, -10], [30, 80, 30, 2, 30], [40, 100, 40, -4, -30], [25, 60, 25, 0, 0], [30, 60, 30, 5, 0], [30, 60, 30, -5, 0], [40, 80, 40, 0, -20]]],
    [2, [[30, 60, 30, 3, -20], [25, 80, 25, 0, 0], [30, 60, 30, -4, 0], [25, 40, 25, 0, 10], [30, 90, 30, 2, 0], [25, 50, 25, -5, -10], [30, 60, 30, 4, 0],
      [20, 100, 20, 0, 0], [30, 60, 30, -3, 0], [25, 50, 25, 3, 0], [20, 220, 0, 0, -5]]],
  ];
  const easeIn = (a, b, t) => a + (b - a) * t * t, easeInOut = (a, b, t) => a + (b - a) * (-Math.cos(t * Math.PI) / 2 + .5);
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function buildCourse() {
    const segs = [];
    let y = 0;
    const add = (curve, y2, zone) => { const i = segs.length; segs.push({ i, z: i * SEG, y1: y, y2, curve, zone, light: Math.floor(i / RUMBLE) % 2 === 0, sprites: [] }); y = y2; };
    for (const [zone, sections] of COURSE) for (const [ein, hold0, eout, curve, hill] of sections) {
      const hold = Math.round(hold0 * HOLD), y0 = y, y1 = y0 + hill * SEG, n = ein + hold + eout;
      for (let k = 0; k < ein; k++) add(easeIn(0, curve, k / ein), easeInOut(y0, y1, (k + 1) / n), zone);
      for (let k = 0; k < hold; k++) add(curve, easeInOut(y0, y1, (ein + k + 1) / n), zone);
      for (let k = 0; k < eout; k++) add(easeInOut(curve, 0, k / eout), easeInOut(y0, y1, (ein + hold + k + 1) / n), zone);
    }
    const r = rng(1016), N = segs.length, finish = N - 60;
    const put = (i, img, off, ww, solid = true) => { if (segs[i]) segs[i].sprites.push({ img, off, ww, solid }); };
    for (let i = 12; i < finish - 10; i++) {
      const z = segs[i].zone, side = r() < .5 ? -1 : 1;
      if (z === 0) {
        if (i % 4 === 0) { put(i, S.lavender, -1.25 - r() * .4, 620, false); put(i, S.lavender, 1.25 + r() * .4, 620, false); }
        if (i % 4 === 2) put(i, S.lavender, side * (1.9 + r() * .8), 620, false);
        if (i % 90 === 45) put(i, S.barn, side * (2.3 + r() * .5), 1700);
        if (i % 37 === 5) put(i, S.hay, -side * (1.3 + r() * .3), 280, false);
        if (i % 70 === 20 && r() < .6) put(i, S.fir, side * (2.4 + r()), 800);
      } else if (z === 1) {
        if (i % 3 === 0) put(i, S.fir, -(1.3 + r() * 2.4), 700 + r() * 300);
        if (i % 3 === 1) put(i, S.fir, 1.3 + r() * 2.4, 700 + r() * 300);
        if (i % 7 === 0) put(i, S.fir, side * (3.5 + r() * 2), 900);
      } else {
        if (i % 9 === 0) put(i, [S.bldgA, S.bldgB, S.bldgC][Math.floor(r() * 3)], -1.35 - r() * .2, 1900);
        if (i % 9 === 4) put(i, [S.bldgA, S.bldgB, S.bldgC][Math.floor(r() * 3)], 1.35 + r() * .2, 1900);
        if (i % 12 === 6) { put(i, S.lamp, -1.12, 170); put(i, S.lamp, 1.12, 170); }
      }
    }
    // signs: miles to go on 101, then hospital arrows in town
    for (let i = 300; i < finish; i += 600) { const mi = Math.max(1, Math.round((finish - i) / finish * MILES)); put(i, S.signPA(mi), 1.2, 1150); }
    put(180, S.signFarm, -1.2, 1100); put(1500, S.signWine, 1.2, 1100);
    for (let i = finish - 1800; i < finish - 100; i += 400) put(i, S.signHosp, 1.2, 1150);
    put(N - 6, S.hospital, -.5, 4200, false);
    return { segs, finish };
  }

  function makeTraffic(segs) {
    const r = rng(2016), cars = [];
    const zoneSpan = z => { const list = segs.filter(s => s.zone === z); return [list[0].i, list[list.length - 1].i]; };
    const spec = [
      [0, 9, () => r() < .4 ? ['tractor', .2, 330] : [['sedanR', 'sedanB', 'pickup'][Math.floor(r() * 3)], .42 + r() * .1, 340]],
      [1, 18, () => { const q = r(); return q < .35 ? ['logs', .38 + r() * .06, 420] : q < .5 ? ['rv', .36, 440] : [['sedanY', 'sedanG', 'sedanB', 'pickup'][Math.floor(r() * 4)], .45 + r() * .12, 340]; }],
      [2, 15, () => [['sedanR', 'sedanB', 'sedanY', 'sedanG', 'pickup'][Math.floor(r() * 5)], .36 + r() * .12, 340]],
    ];
    for (const [z, n, pick] of spec) {
      const [a, b] = zoneSpan(z);
      for (let k = 0; k < n; k++) {
        const [img, sp, ww] = pick(), seg = Math.round(a + 80 + (b - a - 120) * (k + r() * .6) / n);
        cars.push({ img, z: seg * SEG, x: [-2 / 3, 0, 2 / 3][Math.floor(r() * LANES)], speed: MAX * sp, base: MAX * sp, hw: ww / 2 / ROAD_W, ww, oblivious: r() < .3, pull: 0 });
      }
    }
    return cars;
  }
  function makePickups(segs, finish) {
    const r = rng(3016), out = [], kinds = ['medkit', 'wrench', 'medkit', 'wrench', 'medkit', 'wine', 'medkit', 'wrench', 'medkit', 'wrench', 'medkit', 'wine', 'wrench', 'medkit'];
    kinds.forEach((kind, k) => { const i = Math.round(260 + (finish - 500) * (k + .2 + r() * .6) / kinds.length); out.push({ kind, seg: i, x: [-2 / 3, 0, 2 / 3][Math.floor(r() * 3)], got: false }); });
    return out;
  }

  // ---------- background strips (wrap horizontally) ----------
  let BG = null;
  function buildBg() {
    const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
    // whole-number harmonics of the strip width, so each strip repeats with no seam
    const u = x => x / 640 * Math.PI * 2;
    const ridge = (x, seed, amp) => Math.sin(3 * u(x) + seed) * amp + Math.sin(7 * u(x) + seed * 2) * amp * .5 + Math.sin(17 * u(x) + seed * 3) * amp * .25;
    return {
      mtn: mk(640, 44, c => { for (let x = 0; x < 640; x++) { const t = Math.round(17 + ridge(x, 1, 9)); R(c, x, t, 1, 44 - t, '#6a7aa8'); if (t < 15) R(c, x, t, 1, 15 - t + 2, '#f2f2fa'); } }),
      hills: mk(640, 26, c => { for (let x = 0; x < 640; x++) { const t = Math.round(13 + ridge(x, 4, 5)); R(c, x, t, 1, 26 - t, '#3a6a4a'); } }),
      trees: mk(640, 18, c => { for (let x = 0; x < 640; x++) { const t = 6 + Math.round(4 * Math.abs(Math.sin(46 * u(x))) + 2 * Math.sin(5 * u(x))); R(c, x, t, 1, 18 - t, '#1c4a2c'); } }),
      water: mk(640, 30, c => { const isl = x => Math.round(10 + ridge(x, 2, 4)); for (let x = 0; x < 640; x++) { R(c, x, isl(x), 1, 18 - isl(x), '#7a86b4'); }
        R(c, 0, 18, 640, 12, '#3a6aa8'); for (let i = 0; i < 90; i++) R(c, (i * 71) % 640, 20 + (i * 13) % 9, 6, 1, '#8ac0e8'); }),
    };
  }
  function wrapStrip(c, img, off, y) { const w = img.width, x0 = -(((off % w) + w) % w); for (let x = x0; x < W; x += w) c.drawImage(img, Math.round(x), Math.round(y)); }

  function create(api) {
    S ||= build(); BG ||= buildBg();
    const { segs, finish } = buildCourse();
    const s = {
      phase: 'intro', t: 0, pos: 0, x: 0, speed: 0, patient: 100, amb: 100, time: 0,
      cars: makeTraffic(segs), pickups: makePickups(segs, finish), crashes: 0, picked: 0, wine: 0,
      bgOff: 0, shake: 0, hitT: 0, msg: null, endT: 0, steer: 0, skater: null, beepT: 0, rumbleT: 0, wineT: 0,
    };
    window.__ambDebug?.(s, { segs, finish, MAX, PLAYER_Z, SEG });
    const engine = Sound.voice('sawtooth', 500), siren = Sound.voice('triangle', 2400);
    const segAt = z => segs[clamp(Math.floor(z / SEG), 0, segs.length - 1)];
    const say = (text, col = '#ffffff', t = 1.4) => { s.msg = { text, col, t }; };

    function end(kind) {
      if (s.phase === 'end') return;
      s.phase = 'end'; s.endKind = kind; s.endT = 0;
      if (kind === 'arrive') { Sound.jingle([523, 659, 784, 1047, 784, 1047], { step: .1 }); }
      else { Sound.jingle([392, 330, 262, 196], { step: .16, type: 'triangle' }); s.skater = { z: s.pos + PLAYER_Z + 60, x: s.x, speed: 0 }; }
    }
    function finishRun() {
      const arrived = s.endKind === 'arrive', progress = clamp((s.pos + PLAYER_Z) / (finish * SEG), 0, 1);
      const score = arrived ? Math.round(4000 + s.patient * 50 + s.amb * 20 + Math.max(0, 200 - s.time) * 30 + s.picked * 50 - s.crashes * 100) : Math.round(progress * 3000);
      const headline = !arrived ? (s.endKind === 'patient' ? 'HE SKATED THERE HIMSELF' : 'THE AMBULANCE GAVE OUT')
        : s.patient > 70 ? 'STABLE AND SMILING' : s.patient > 35 ? 'MADE IT IN TIME' : 'JUST IN TIME';
      api.finish({ score: Math.max(0, score), headline, stats: [['TIME', s.time.toFixed(1) + 's'], ['PATIENT', Math.round(s.patient) + '%'], ['AMBULANCE', Math.round(s.amb) + '%'], ['PICKUPS', String(s.picked)], ['CRASHES', String(s.crashes)]] });
    }

    function update(dt) {
      s.t += dt; if (s.msg && (s.msg.t -= dt) <= 0) s.msg = null;
      s.shake = Math.max(0, s.shake - dt * 8); s.hitT = Math.max(0, s.hitT - dt); s.wineT = Math.max(0, s.wineT - dt);
      if (s.phase === 'intro') {
        if (Input.taps.length || Input.keyPressed('Enter', 'Space')) { s.phase = 'drive'; say('GO GO GO!', '#ffd84a'); Sound.jingle([392, 523, 659], { step: .07 }); }
        sound(); return;
      }
      const pct = s.speed / MAX, pseg = segAt(s.pos + PLAYER_Z);
      let left = false, right = false, brake = false;
      if (s.phase === 'drive') {
        s.time += dt;
        const tl = Input.held(p => p.x < 160), tr = Input.held(p => p.x >= 160);
        brake = (tl && tr) || Input.key('ArrowDown', 'KeyS', 'Space');
        left = !brake && (tl || Input.key('ArrowLeft', 'KeyA'));
        right = !brake && (tr || Input.key('ArrowRight', 'KeyD'));
        if (left && right) left = right = false;
      }
      // speed: the gas is always down; braking and rough ground take it off
      if (s.phase === 'end') s.speed = Math.max(0, s.speed - BRAKE * .7 * dt);
      else if (brake) s.speed = Math.max(0, s.speed - BRAKE * dt);
      else s.speed = Math.min(MAX * (s.amb < 25 ? .75 : 1), s.speed + ACCEL * dt);
      const off = Math.abs(s.x) > 1;
      if (off && s.speed > OFFROAD_LIMIT) s.speed = Math.max(OFFROAD_LIMIT, s.speed - OFFROAD_DECEL * dt);
      // steering, plus the curve pushing you outward
      const dx = dt * STEER * pct;
      s.steer += ((right ? 1 : left ? -1 : 0) - s.steer) * Math.min(1, dt * 10);
      s.x += s.steer * dx - dx * pct * pseg.curve * CENTRIFUGAL;
      s.x = clamp(s.x, -3, 3);
      const before = s.pos;
      s.pos = Math.min(s.pos + s.speed * dt, (segs.length - 2) * SEG - PLAYER_Z);
      s.bgOff += pseg.curve * (s.pos - before) / SEG * .9;

      if (s.phase === 'drive') {
        // health: the patient always needs the hospital; rough driving costs both bars
        s.patient -= DRAIN * dt;
        if (off && s.speed > OFFROAD_LIMIT * .5) { s.patient -= 2.2 * dt; s.amb -= 1.4 * dt; s.shake = Math.max(s.shake, .6); }
        // traffic. Checked against where the ambulance was last frame too, so a slow frame can't skip a car.
        const pz = s.pos + PLAYER_Z, pzOld = before + PLAYER_Z, segOld = segAt(pzOld);
        for (const car of s.cars) {
          const dOld = car.z - pzOld;
          const ahead = (car.z - pz) / SEG;
          if (!car.oblivious && ahead > 0 && ahead < 45 && Math.abs(car.x - s.x) < .7) car.pull = 1; // siren: pull over
          if (car.pull) { const target = car.x >= s.x ? .86 : -.86; car.x += clamp(target - car.x, -.6 * dt, .6 * dt); car.speed = car.base * .75; }
          car.z += car.speed * dt;
          const d = car.z - pz;
          if (s.hitT <= 0 && dOld > -40 && d < 90 && s.speed > car.speed && Math.abs(car.x - s.x) < PW + car.hw) {
            s.speed = car.speed * .5; s.pos = car.z - PLAYER_Z - 100; s.amb -= 14; s.patient -= 7; s.crashes++; s.hitT = .8; s.shake = 1.4;
            car.x += car.x >= s.x ? .2 : -.2; crashSound(); say(['WATCH IT!', 'OOF!', 'SORRY!', 'HOLD ON, SEB!'][s.crashes % 4], '#ff8ab0');
          }
        }
        // scenery you can hit when you leave the road
        if (off && s.hitT <= 0) hit: for (let i = segOld.i; i <= pseg.i + 1; i++) for (const sp of segs[i]?.sprites || []) {
          const seg = segs[i];
          if (!sp.solid) continue;
          const span = sp.ww / ROAD_W * 2, a = sp.off < 0 ? sp.off - span : sp.off, b = sp.off < 0 ? sp.off : sp.off + span;
          if (s.x + PW > a && s.x - PW < b) {
            s.speed = Math.min(s.speed, MAX / 6); s.pos = Math.max(0, seg.z - PLAYER_Z - 60); s.amb -= 16; s.patient -= 6; s.crashes++; s.hitT = .9; s.shake = 1.6;
            s.x -= Math.sign(s.x) * .3; crashSound(); say('STAY ON THE ROAD!', '#ff8ab0'); break hit;
          }
        }
        // pickups
        for (const p of s.pickups) {
          if (p.got || p.seg < segOld.i - 1 || p.seg > pseg.i + 1 || Math.abs(p.x - s.x) > .32) continue;
          p.got = true; s.picked++;
          if (p.kind === 'medkit') { s.patient = Math.min(100, s.patient + 15); say('+ PATIENT', '#ff8ab0'); Sound.jingle([659, 880, 1175], { step: .05 }); }
          else if (p.kind === 'wrench') { s.amb = Math.min(100, s.amb + 20); say('+ AMBULANCE', '#4fd6ff'); Sound.jingle([523, 659, 784], { step: .05, type: 'triangle' }); }
          else { s.patient = Math.min(100, s.patient + 25); s.wine++; s.wineT = 4; say('SWEET WHITE WINE!', '#f4cc80', 2); Sound.jingle([784, 988, 1175, 1568], { step: .07, type: 'triangle' }); }
        }
        if (s.patient <= 0) { s.patient = 0; end('patient'); }
        else if (s.amb <= 0) { s.amb = 0; end('ambulance'); }
        else if (pz >= finish * SEG) end('arrive');
      } else if (s.phase === 'end') {
        s.endT += dt;
        if (s.skater) { s.skater.speed = Math.min(MAX * .7, s.skater.speed + MAX * .8 * dt); s.skater.z += s.skater.speed * dt; }
        if (s.endT > 3.4) { finishRun(); return; }
      }
      sound(dt);
    }

    function crashSound() { Sound.noise(.35, { vol: .35, freq: 700 }); Sound.tone(90, .25, { type: 'square', vol: .15, slide: -40 }); }
    function sound(dt = 0) {
      const pct = s.speed / MAX, live = s.phase === 'drive';
      engine.set(45 + pct * 95 + (Math.abs(s.x) > 1 ? Math.sin(s.t * 40) * 6 : 0), s.phase === 'intro' ? .02 : .05, 300 + pct * 600);
      // two-tone siren, kept low so it sits under everything else
      siren.set(Math.sin(s.t * Math.PI * 1.6) > 0 ? 960 : 720, live ? .018 : 0);
      if (!live) return;
      // the heart monitor speeds up as the patient fades
      s.beepT -= dt;
      if (s.beepT <= 0) { s.beepT = .35 + s.patient / 100 * .75; Sound.tone(s.patient < 30 ? 1320 : 1040, .06, { type: 'sine', vol: .05 }); }
      if (Math.abs(s.x) > 1 && s.speed > OFFROAD_LIMIT * .5 && (s.rumbleT -= dt) <= 0) { s.rumbleT = .09; Sound.noise(.06, { vol: .08, freq: 300 }); }
    }

    // ---------- drawing ----------
    function project(wx, wy, wz, camX, camY, camZ) {
      const cz = wz - camZ, scale = DEPTH / cz;
      return { x: W / 2 + scale * (wx - camX) * W / 2, y: HORIZON - scale * (wy - camY) * H / 2, w: scale * ROAD_W * W / 2, scale };
    }
    function drawSprite(c, img, x, y, w, h, clip) { // bottom-anchored, cut off below clip
      if (w < .5 || y - h >= clip) return;
      const cut = Math.max(0, y - clip), dh = h - cut; if (dh <= 0) return;
      c.drawImage(img, 0, 0, img.width, img.height * dh / h, Math.round(x), Math.round(y - h), Math.max(1, Math.round(w)), Math.max(1, Math.round(dh)));
    }
    function draw(c) {
      const zone = ZONES[segAt(s.pos + PLAYER_Z).zone];
      const sx = s.shake ? Math.round((Math.random() - .5) * s.shake * 3) : 0, sy = s.shake ? Math.round((Math.random() - .5) * s.shake * 2) : 0;
      c.save(); c.translate(sx, sy);
      // sky and far scenery
      bands(c, zone.sky, [30, 30, 40], -2);
      const base = segAt(s.pos), basePct = (s.pos % SEG) / SEG, pseg = segAt(s.pos + PLAYER_Z);
      const ppct = ((s.pos + PLAYER_Z) % SEG) / SEG, playerY = pseg.y1 + (pseg.y2 - pseg.y1) * ppct;
      const lift = clamp(playerY / SEG * .6, -14, 14);
      if (zone.far === 'water') wrapStrip(c, BG.water, s.bgOff * .5, HORIZON - 26 + lift * .3);
      else { wrapStrip(c, BG.mtn, s.bgOff * .4, HORIZON - 42 + lift * .3); wrapStrip(c, BG.hills, s.bgOff * .8, HORIZON - 22 + lift * .6); }
      if (zone.trees) wrapStrip(c, BG.trees, s.bgOff * 1.3, HORIZON - 14 + lift);
      R(c, -4, HORIZON + 2 + lift, W + 8, H, zone.grass[1]);
      // road, nearest segment first
      const camX = s.x * ROAD_W, camY = playerY + CAM_H, camZ = s.pos;
      let maxy = H, x = 0, dx = -(base.curve * basePct);
      const vis = [];
      for (let n = 0; n < DRAW; n++) {
        const seg = segs[base.i + n]; if (!seg) break;
        const p1 = project(0, seg.y1, seg.z, camX - x, camY, camZ), p2 = project(0, seg.y2, seg.z + SEG, camX - x - dx, camY, camZ);
        x += dx; dx += seg.curve;
        seg.p1 = p1; seg.p2 = p2; seg.clip = maxy;
        vis.push(seg);
        if (seg.z - camZ <= DEPTH || p2.y >= maxy || p2.y >= p1.y) continue;
        const top = Math.max(0, Math.ceil(p2.y)), bot = Math.min(maxy, Math.ceil(p1.y));
        const Z = ZONES[seg.zone], li = seg.light ? 0 : 1, grass = Z.grass[li], rumble = Z.rumble[li], road = seg.light ? '#6e6e78' : '#66666f';
        for (let yy = top; yy < bot; yy++) {
          const t = (p1.y - yy) / (p1.y - p2.y), cx = p1.x + (p2.x - p1.x) * t, w = p1.w + (p2.w - p1.w) * t, rw = w / 6;
          c.fillStyle = grass; c.fillRect(-4, yy, W + 8, 1);
          c.fillStyle = rumble; c.fillRect(Math.round(cx - w - rw), yy, Math.round(2 * (w + rw)), 1);
          c.fillStyle = road; c.fillRect(Math.round(cx - w), yy, Math.round(2 * w), 1);
          if (seg.light) { const lw = Math.max(1, w / 28); c.fillStyle = '#e8e8e8'; for (let l = 1; l < LANES; l++) c.fillRect(Math.round(cx - w + 2 * w * l / LANES - lw / 2), yy, Math.round(lw), 1); }
        }
        if (seg.i >= finish && seg.i < finish + 3) { // painted finish bar at the hospital driveway
          for (let yy = top; yy < bot; yy++) { const t = (p1.y - yy) / (p1.y - p2.y), cx = p1.x + (p2.x - p1.x) * t, w = p1.w + (p2.w - p1.w) * t; c.fillStyle = seg.i % 2 ? '#ffffff' : '#d83a2a'; c.fillRect(Math.round(cx - w), yy, Math.round(2 * w), 1); }
        }
        maxy = Math.min(maxy, top);
      }
      // sprites, cars and pickups, farthest first
      const pz = s.pos + PLAYER_Z, bySeg = new Map();
      const addAt = (z, item) => { const i = Math.floor(z / SEG) - base.i; if (i > 0 && i < vis.length) (bySeg.get(i) || bySeg.set(i, []).get(i)).push(item); };
      for (const car of s.cars) addAt(car.z, { car });
      for (const p of s.pickups) if (!p.got) addAt(p.seg * SEG + SEG / 2, { pick: p });
      if (s.skater) addAt(s.skater.z, { skater: true });
      for (let n = vis.length - 1; n > 0; n--) {
        const seg = vis[n], p1 = seg.p1, p2 = seg.p2;
        if (!p1 || seg.z - camZ <= DEPTH) continue;
        for (const sp of seg.sprites) {
          const w = p1.scale * sp.ww * W / 2, h = w * sp.img.height / sp.img.width;
          drawSprite(c, sp.img, p1.x + p1.w * sp.off + (sp.off < 0 ? -w : 0), p1.y, w, h, seg.clip);
        }
        for (const it of bySeg.get(n) || []) {
          if (it.car || it.skater) {
            const z = it.car ? it.car.z : s.skater.z, t = (z % SEG) / SEG, sc = p1.scale + (p2.scale - p1.scale) * t;
            const cx = p1.x + (p2.x - p1.x) * t, cy = p1.y + (p2.y - p1.y) * t, img = it.car ? S[it.car.img] : S.skater, ww = it.car ? it.car.ww : 260;
            const w = sc * ww * W / 2, h = w * img.height / img.width, xo = it.car ? it.car.x : s.skater.x;
            drawSprite(c, img, cx + xo * sc * ROAD_W * W / 2 - w / 2, cy, w, h, seg.clip);
          } else {
            const p = it.pick, img = S[p.kind], w = p1.scale * (p.kind === 'wine' ? 160 : 260) * W / 2, h = w * img.height / img.width, bob = Math.sin(s.t * 5 + p.seg) * h * .15;
            drawSprite(c, img, p1.x + p.x * p1.w - w / 2, p1.y - h * .4 + bob, w, h, seg.clip);
          }
        }
      }
      // the ambulance
      const bounce = (Math.abs(s.x) > 1 && s.speed > 1000 ? (Math.floor(s.t * 20) % 2) : 0) + (s.speed > 500 ? Math.floor(s.t * 9) % 2 * .5 : 0);
      const lean = Math.round(s.steer * 2), amb = S['amb' + (Math.floor(s.t * 6) % 2)];
      if (!(s.hitT > 0 && Math.floor(s.t * 16) % 2)) {
        R(c, 132 + lean, 175, 56, 4, 'rgba(0,0,0,.35)');
        c.drawImage(amb, 130 + lean, Math.round(134 - bounce), 60, 44);
      }
      if (s.amb < 30 && s.phase !== 'intro') for (let i = 0; i < 3; i++) { const k = (s.t * 1.5 + i / 3) % 1; c.globalAlpha = 1 - k; c.drawImage(S.smoke, 150 + Math.sin(i * 2 + s.t) * 6, 132 - k * 26, 8 + k * 6, 8 + k * 6); c.globalAlpha = 1; }
      c.restore();
      hud(c);
    }

    function bar(c, x, y, v, label, warn) {
      T(c, label, x, y, '#ffffff', { f: 's' });
      box(c, x + 54, y, 58, 7, '#1a1426', '#0e0c14');
      const col = v > 60 ? '#3cc060' : v > 30 ? '#f4d24a' : '#d83a2a';
      if (!(warn && v < 30 && Math.floor(s.t * 4) % 2)) R(c, x + 55, y + 1, Math.round(56 * v / 100), 5, col);
    }
    function hud(c) {
      R(c, 0, 0, W, 22, 'rgba(14,12,20,.55)');
      bar(c, 4, 3, s.patient, 'PATIENT', true); bar(c, 4, 12, s.amb, 'AMBULANCE', true);
      const miles = Math.max(0, (finish * SEG - s.pos - PLAYER_Z) / (finish * SEG) * MILES);
      T(c, miles.toFixed(1) + ' MI', 292, 3, '#ffd84a', { f: 's', a: 'r' });
      T(c, Math.round(s.speed / MAX * 88) + ' MPH', 292, 12, '#ffffff', { f: 's', a: 'r' });
      // progress along 101
      R(c, 124, 7, 108, 1, '#5a5a8a'); R(c, 124 + Math.round(108 * clamp((s.pos + PLAYER_Z) / (finish * SEG), 0, 1)) - 1, 5, 3, 5, '#ffffff');
      T(c, 'H', 236, 4, '#ff8ab0', { f: 's' }); T(c, ZONES[segAt(s.pos + PLAYER_Z).zone].name, 178, 12, '#c8b8f0', { f: 's', a: 'c' });
      // Misha drives (bottom right); Sebastian, the patient, reacts to how it's going (bottom left)
      blit(c, PORTRAIT.misha, 284, 140);
      blit(c, patientFace(s.wineT > 0 ? 'shades' : s.patient < 35 ? 'grimace' : 'happy'), 4, 140);
      if (s.msg) TO(c, s.msg.text, 160, 40, s.msg.col, '#0e0c14', null, { a: 'c' });
      if (s.phase === 'intro') {
        box(c, 30, 30, 260, 120, '#0e0c1e', '#a070e0', 2);
        blit(c, PORTRAIT.misha, 40, 40); blit(c, patientFace('grimace'), 248, 40);
        TS(c, 'GOLDEN HOUR', 160, 38, '#ffd84a', '#a03a8a', { a: 'c' });
        ['MISHA IS SHOOTING A HOSPITAL', 'DRAMA. SEBASTIAN JUST WIPED', 'OUT ON HIS E-BOARD. THE PROP', 'AMBULANCE WILL HAVE TO DO.'].forEach((l, i) => T(c, l, 160, 56 + i * 9, '#ffffff', { f: 's', a: 'c' }));
        T(c, 'GET HIM TO PORT ANGELES!', 160, 96, '#ff8ab0', { f: 's', a: 'c' });
        T(c, KEYBOARD ? 'ARROWS STEER   DOWN BRAKES' : 'HOLD LEFT OR RIGHT TO STEER', 160, 110, '#c8b8f0', { f: 's', a: 'c' });
        T(c, KEYBOARD ? 'GRAB KITS + WRENCHES' : 'HOLD BOTH SIDES TO BRAKE', 160, 119, '#c8b8f0', { f: 's', a: 'c' });
        if (Math.floor(s.t * 2) % 2 === 0) T(c, KEYBOARD ? 'PRESS ENTER' : 'TAP TO START', 160, 136, '#ffffff', { a: 'c' });
      } else if (s.phase === 'end') {
        const lines = s.endKind === 'arrive' ? ['ARRIVED!', 'SEBASTIAN IS IN GOOD HANDS']
          : s.endKind === 'patient' ? ['TOO SLOW!', 'SEBASTIAN GOT TIRED OF WAITING', 'AND SKATED THERE HIMSELF'] : ['BROKE DOWN!', 'THE AMBULANCE GAVE OUT.', 'SEBASTIAN SKATED THE REST'];
        box(c, 50, 52, 220, 22 + lines.length * 9, '#0e0c1e', s.endKind === 'arrive' ? '#3cc060' : '#d83a2a', 2);
        TO(c, lines[0], 160, 57, s.endKind === 'arrive' ? '#ffd84a' : '#ff8ab0', '#0e0c14', null, { a: 'c' });
        lines.slice(1).forEach((l, i) => T(c, l, 160, 73 + i * 9, '#ffffff', { f: 's', a: 'c' }));
      }
    }

    return {
      update, draw,
      pause(on) { if (on) { engine.set(40, 0); siren.set(700, 0); } },
      destroy() { engine.stop(); siren.stop(); },
    };
  }

  registerEvent({ id: 'ambulance', name: 'GOLDEN HOUR', star: 'misha', sub: 'MISHA  /  AMBULANCE DASH', icon, create });
})();
