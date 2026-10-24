// ===== Rainbow Rush: Sophia's bonus round, a fast auto-running platformer =====
(() => {
  const FINISH = 14400, RUN_X = 84, GRAV = 1000, JUMP = 360, JUMP2 = 320, SPRING = 430, BOOST_V = 265, BOOST_MAX = 3.2, MAXFALL = 720, CEIL = 46, PAR = 96;
  // the unicorn's hitbox around its feet point, and how far a sparkle is pulled in (much farther while boosting)
  const HB = { l: 11, r: 12, top: 29 }, MAGNET = 10, MAGNET_BOOST = 64;
  const ZONES = [{ name: 'CANDY CLOUDS', from: 0 }, { name: 'LAVENDER HILLS', from: 3600 }, { name: 'CHOCOLATE HILLS', from: 7200 }, { name: 'STARLIGHT SKY', from: 10800 }];
  const zoneAt = x => clamp(Math.floor(x / 3600), 0, 3);
  const baseSpeed = x => 150 + 50 * clamp(x / FINISH, 0, 1);
  const RAINBOW = ['#ff4a5a', '#ff9a3a', '#ffe04a', '#5ad86a', '#4aa8ff', '#a86aff'];
  // each sparkle in a streak plays the next note up a pentatonic scale
  const SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93];

  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- the course: ground ledges, cloud platforms and rainbow bridges you can run on, plus things on them ----
  // Every gap is sized against the jump: a single jump covers ~0.72s of running, a double jump ~1.16s.
  function buildCourse() {
    const r = rng(1015), ri = (a, b) => Math.floor(a + r() * (b - a + 1));
    const surfaces = [], objs = [];
    const flat = (x0, x1, y, kind) => { const q = { kind, x0, x1, y, yAt: () => q.y }; surfaces.push(q); return q; };
    let g = flat(-400, 0, 140, 'ground');
    const run = len => { const a = g.x1; g.x1 += len; return a; };
    const land = (w, dy) => { g = flat(g.x1 + w, g.x1 + w, clamp(g.y + dy, 100, 150), 'ground'); };
    const spark = (x, y) => objs.push({ k: 'spark', x: Math.round(x), y: Math.round(y) });
    const line = (x, y, n, step = 18) => { for (let i = 0; i < n; i++) spark(x + i * step, y); };
    // sparkles along the path a full-strength jump really takes from (x0, y0) at the course's speed there,
    // until it comes down to untilY. dbl: double jump at the top. Hand-drawn arcs were often out of reach.
    const flight = (x0, y0, untilY, n, dbl = false) => {
      const v = baseSpeed(x0), dt = 1 / 120, path = []; let x = x0, y = y0, vy = -JUMP, again = dbl;
      for (let t = 0; t < 2.5; t += dt) { x += v * dt; if (again && vy >= 0) { vy = -JUMP2; again = false; } vy += GRAV * dt; y += vy * dt; path.push([x, y]); if (vy > 0 && y >= untilY) break; }
      for (let i = 0; i < n; i++) { const p = path[Math.floor((.1 + .8 * (i + .5) / n) * (path.length - 1))]; spark(p[0], p[1] - 16); }
    };
    const put = (k, x, extra) => objs.push({ k, x: Math.round(x), y: g.y, ...extra });
    const C = {
      run(z) { const a = run(ri(180, 260)); line(a + 30, g.y - 16, ri(4, 7)); if (r() < .5 + z * .1) { put('pad', g.x1 - 50, { w: 26 }); run(40); } },
      gap(z) {
        if (r() < .25) { put('pad', g.x1 + 30, { w: 26 }); run(60); }
        run(ri(90, 150)); const w = ri(50, 76 + z * 6), dy = ri(-26, 26) * (w > 70 ? .6 : 1) | 0, y0 = g.y, edge = g.x1;
        land(w, dy); flight(edge - 6, y0, g.y, 5); run(ri(110, 170));
      },
      bramble(z) {
        const a = run(ri(320, 380)), n = z ? ri(1, 2) : 1;
        for (let i = 0; i < n; i++) { const bx = a + 110 + i * ri(130, 160); put('bramble', bx, { w: 18, h: 12 }); flight(bx + 9 - baseSpeed(bx) * JUMP / GRAV, g.y, g.y, 5); }
      },
      smash(z) {
        const a = run(70), n = 3 + Math.min(z, 1); put('pad', a + 20, { w: 26 });
        run(140 + n * 80 + 120); for (let i = 0; i < n; i++) put('bramble', a + 170 + i * 80, { w: 18, h: 12 });
        line(a + 90, g.y - 16, 12, 26);
      },
      rainbow(z) {
        const a = run(ri(90, 140)); if (r() < .7) put('pad', a + 20, { w: 26 });
        const w = ri(230, 320), h = ri(48, 68), x0 = g.x1, y = g.y;
        const q = { kind: 'arc', x0, x1: x0 + w, y, h, yAt: x => y - h * Math.sin(Math.PI * clamp((x - x0) / w, 0, 1)) }; surfaces.push(q);
        for (let i = 1; i <= 9; i++) spark(x0 + w * i / 10, q.yAt(x0 + w * i / 10) - 16);
        if (z) objs.push({ k: 'gem', x: x0 + w / 2, y: y - h - 50 });
        land(w, 0); run(ri(130, 180));
      },
      plats(z) {
        run(ri(80, 120)); let x = g.x1, y = g.y; const n = ri(2, 3);
        for (let i = 0; i < n; i++) { x += ri(56, 74); y = clamp(y + ri(-24, 14), 90, 132); const w = ri(54, 74); flat(x, x + w, y, 'cloud'); line(x + 10, y - 16, Math.floor((w - 10) / 18)); x += w; }
        const w = ri(56, 70); g = flat(x + w, x + w, clamp(y + ri(-6, 24), 104, 148), 'ground'); run(ri(140, 190));
      },
      spring(z) {
        if (g.y < 128) return C.gap(z);
        run(ri(100, 140)); put('spring', g.x1 - 36, { w: 14 });
        const sx = g.x1 - 29, sy = g.y, v = baseSpeed(sx);
        // the ceiling flattens the top of a spring jump, so trace that too
        let x = sx, y = sy, vy = -SPRING; const path = [];
        for (let t = 0; t < 1.2; t += 1 / 120) { x += v / 120; vy += GRAV / 120; y += vy / 120; if (y < CEIL) { y = CEIL; vy = Math.max(vy, 0); } path.push([x, y]); if (vy > 0 && y >= sy - 10) break; }
        for (let i = 1; i <= 8; i++) { const p = path[Math.floor(i / 9 * path.length)]; spark(p[0], p[1] - 16); }
        const top = path.reduce((a, p) => p[1] < a[1] ? p : a); objs.push({ k: 'gem', x: top[0] + 20, y: top[1] - 16 });
        land(ri(70, 95), ri(-6, 16)); run(ri(160, 220));
      },
      dgap(z) { run(ri(110, 160)); const y0 = g.y, w = ri(108, 128 + z * 4), edge = g.x1; land(w, ri(-4, 18)); flight(edge - 6, y0, g.y, 7, true); run(ri(150, 200)); },
      stairs(z) {
        for (let i = 0; i < 3; i++) { run(ri(70, 100)); const y0 = g.y, w = ri(40, 56), edge = g.x1; land(w, -18); flight(edge - 6, y0, g.y, 3); }
        run(ri(90, 130)); land(ri(40, 60), ri(30, 46)); line(g.x0 + 20, g.y - 16, 4); run(ri(140, 180));
      },
    };
    const WEIGHTS = [
      { run: 2, gap: 4, bramble: 3, rainbow: 2, smash: 1, stairs: 1 },
      { run: 1, gap: 3, bramble: 2, rainbow: 2, smash: 1, plats: 2, spring: 2, dgap: 1, stairs: 1 },
      { run: 2, gap: 3, bramble: 2, rainbow: 2, smash: 2, plats: 2, spring: 2, dgap: 1, stairs: 2 },
      { run: 1, gap: 3, bramble: 2, rainbow: 2, smash: 1, plats: 3, spring: 2, dgap: 2, stairs: 1 },
    ];
    run(420); line(180, 124, 5);
    let last = '';
    while (g.x1 < FINISH - 500) {
      const w = WEIGHTS[zoneAt(g.x1)], total = Object.values(w).reduce((a, b) => a + b, 0); let pick;
      do { let t = r() * total; pick = Object.keys(w).find(k => (t -= w[k]) < 0); } while (pick === last);
      last = pick; C[pick](zoneAt(g.x1));
    }
    run(FINISH + 700 - g.x1);
    objs.sort((a, b) => a.x - b.x);
    return { surfaces, objs, home: g };
  }

  // ---- Sophia on her unicorn, 32x32 with the hooves on the bottom row, built like the portraits ----
  let FRAMES;
  const MANE = ['r', 'o', 'y', 'n', 'b', 'p'];
  function riderFrame(kind) {
    const g = grid(32, 32), wave = { a: 0, b: 1, c: 0, j: 1 }[kind];
    // tail: six rainbow strands streaming back
    for (let i = 0; i < 6; i++) { const y = 17 + i + (i > 2 ? wave : 0); rect(g, 1 + (i % 2), y, 6, y, MANE[i]); }
    // legs: far pair first (shaded), then the near pair. dx = where the hoof lands relative to the hip
    const leg = (x, dx, len, ch) => { for (let k = 0; k < len; k++) rect(g, x + Math.round(dx * k / (len - 1)), 25 + k, x + 1 + Math.round(dx * k / (len - 1)), 25 + k, ch); const hx = x + dx; rect(g, hx, 25 + len, hx + 1, 25 + len, 'Y'); };
    const L = { a: [[1, -1], [3, -3]], b: [[-2, 0], [0, 2]], c: [[3, -3], [-2, 1]], j: [[4, -4], [4, -4]] }[kind], len = kind === 'j' ? 4 : 6;
    leg(19, L[0][0], len, 'x'); leg(9, L[0][1], len, 'x'); leg(21, L[1][0], len, 'w'); leg(7, L[1][1], len, 'w');
    ell(g, 14.5, 21.5, 9.5, 4.5, 'w'); ell(g, 14.5, 23.5, 8, 2.4, 'x', (x, y) => y >= 24);   // body, shaded belly
    ell(g, 22.5, 16, 2.8, 5.5, 'w');                                                        // neck
    ell(g, 25.5, 11, 3.6, 3, 'w'); ell(g, 28.5, 12.5, 2.2, 1.8, 'w');                       // head, snout
    pts(g, [[23, 6], [23, 7], [24, 7]], 'w'); pts(g, [[26, 10], [26, 9]], 'e'); pts(g, [[28, 13]], 'i'); pts(g, [[30, 12]], 'x');
    pts(g, [[26, 7], [26, 6], [27, 5], [27, 4], [28, 3], [28, 2]], 'y'); pts(g, [[26, 6], [27, 4]], 'Y');   // horn
    for (let y = 7; y <= 19; y++) { const x = y < 11 ? 22 : y < 15 ? 20 : 19, ch = MANE[Math.min(5, Math.floor((y - 7) / 2))]; pts(g, [[x, y], [x - 1, y + (y % 2 ? wave : 0)]], ch); }
    // Sophia
    ell(g, 7.5, 7 + wave, 2, 3.2, 'h');                                                     // ponytail
    ell(g, 12.5, 5.5, 4.6, 5, 'h'); ell(g, 14, 6.5, 3.2, 3.6, 's', (x, y) => y >= 3);
    rect(g, 10, 1, 16, 2, 'h'); pts(g, [[8, 1], [9, 0], [9, 1], [10, 0], [8, 3], [9, 2]], 'i');           // bangs, bow
    pts(g, [[15, 5], [15, 6]], 'e'); pts(g, [[16, 8]], 'i'); pts(g, [[14, 9], [15, 9]], 'm');
    rect(g, 11, 11, 15, 16, 'p'); rect(g, 11, 11, 11, 16, 'P'); pts(g, [[13, 12], [12, 13], [13, 13], [14, 13], [13, 14]], 'y');
    if (kind === 'j') pts(g, [[16, 11], [17, 10], [18, 9]], 's'); else pts(g, [[16, 12], [17, 13], [18, 13]], 's');   // arm: up for joy, or holding the mane
    rect(g, 11, 17, 16, 17, 'p'); rect(g, 14, 18, 15, 21, 's'); rect(g, 14, 22, 16, 22, 'i');                       // skirt, leg, shoe
    return sprite(toRows(outline(g)));
  }

  // ---- backgrounds ----
  const cache = {};
  function canvasOf(w, h, paint) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; paint(cv.getContext('2d')); return cv; }
  // a pixel rainbow: six rings, base along the bottom edge
  function rainbowArc(r, band) {
    const key = 'rb' + r + ':' + band; if (cache[key]) return cache[key];
    return cache[key] = canvasOf(2 * r + 2, r + 1, c => {
      for (let i = 0; i < 6; i++) { const ro = r - i * band, rin = ro - band;
        for (let x = -ro; x <= ro; x++) { const top = Math.round(r - Math.sqrt(ro * ro - x * x)), bot = Math.abs(x) < rin ? Math.round(r - Math.sqrt(rin * rin - x * x)) : r + 1; R(c, x + r + 1, top, 1, Math.max(1, bot - top), RAINBOW[i]); } }
    });
  }
  function puff(c, x, y, w, col, shade) { for (let i = 0; i <= w; i += 7) { const rr = 5 + ((i * 7) % 5); disc(c, x + i, y - rr * .4, rr, shade); disc(c, x + i, y - rr * .4 - 1, rr, col); } R(c, x - 4, y - 1, w + 8, 4, col); }
  function cloudTile(col, shade) {
    const key = 'cl' + col; if (cache[key]) return cache[key];
    return cache[key] = canvasOf(240, 40, c => { puff(c, 16, 26, 42, col, shade); puff(c, 120, 18, 28, col, shade); puff(c, 180, 30, 36, col, shade); });
  }
  function tiled(c, img, par, cam, y) { const o = cam * par % img.width; for (let k = -1; k < W / img.width + 2; k++) c.drawImage(img, Math.round(k * img.width - o), y); }
  function bgCandy(c, cam, t) {
    bands(c, ['#8ac8ff', '#a0d4ff', '#b8deff', '#cce2ff', '#dcdcfa', '#e6d8f6', '#ecd8f2'], [22, 18, 18, 18, 20, 26, 58]);
    c.globalAlpha = .6; c.drawImage(rainbowArc(110, 6), Math.round(50 - cam * .02), 18); c.globalAlpha = 1;
    tiled(c, cloudTile('#ffffff', '#e0e8ff'), .12, cam, 54);
    tiled(c, cloudTile('#fff0f8', '#ffd0e8'), .3, cam + 90, 92);
  }
  function bgLavender(c, cam, t) {
    bands(c, ['#4a8ae0', '#5e9ae6', '#76aaec', '#90bcf0', '#acd0f4', '#c8e0f6'], [22, 18, 16, 16, 16, 92]);
    disc(c, 262, 34, 12, '#fff0b0'); disc(c, 262, 34, 10, '#ffe27a');
    c.globalAlpha = .5; c.drawImage(rainbowArc(70, 4), Math.round(140 - cam * .02), 30); c.globalAlpha = 1;
    const o1 = cam * .05, o2 = cam * .25;
    for (let x = 0; x < W; x++) {
      const wx = x + o1, top = Math.round(78 + 9 * Math.sin(wx * .04) + 5 * Math.sin(wx * .11 + 1) + 3 * Math.abs(Math.sin(wx * .27)));
      R(c, x, top, 1, 110 - top, '#8a7ac8'); if (top < 76) R(c, x, top, 1, Math.round((76 - top) * .7) + 2, '#f4f0ff');
      const hx = x + o2, ht = Math.round(104 + 6 * Math.sin(hx * .02) + 3 * Math.sin(hx * .07));
      R(c, x, ht, 1, H - ht, '#6aa84a');
      R(c, x, ht, 1, 1, '#8ac86a');
      for (let y = ht + 5, row = 0; y < H; y += 6, row++) if ((Math.floor(hx / 4) + row) % 2) R(c, x, y, 1, 2, row % 2 ? '#9a5ad0' : '#b47ae0');
    }
  }
  function bgChoco(c, cam, t) {
    bands(c, ['#ff9a9a', '#ffaa98', '#ffbca0', '#ffcca8', '#ffdab4', '#ffe6c4'], [22, 18, 18, 18, 20, 84]);
    disc(c, 236, 46, 13, '#fff4d8'); disc(c, 236, 46, 11, '#ffe8a8');
    c.globalAlpha = .45; c.drawImage(rainbowArc(80, 4), Math.round(20 - cam * .02), 34); c.globalAlpha = 1;
    const o1 = cam * .06, o2 = cam * .25;
    for (let x = 0; x < W; x++) {
      // far hills: milk chocolate with strawberry frosting on top
      const wx = x + o1, top = Math.round(84 + 10 * Math.sin(wx * .03) + 4 * Math.sin(wx * .09 + 2));
      R(c, x, top, 1, H - top, '#a8683e'); R(c, x, top, 1, 3, '#ff9ac8'); if (Math.round(wx) % 9 < 2) R(c, x, top + 3, 1, 2 + Math.round(wx) % 3, '#ff9ac8');
      // near hills: dark chocolate with wavy caramel drizzle and sprinkles
      const hx = x + o2, ht = Math.round(108 + 7 * Math.sin(hx * .025) + 3 * Math.sin(hx * .08));
      R(c, x, ht, 1, H - ht, '#6a3a1e'); R(c, x, ht, 1, 2, '#8a4e2a');
      for (let y = ht + 7, row = 0; y < H; y += 10, row++) R(c, x, y + Math.round(2 * Math.sin(hx * .18 + row * 2)), 1, 1, '#e0a870');
      if (Math.round(hx * 7) % 37 === 0) R(c, x, ht + 4 + Math.round(hx) % 11, 2, 1, RAINBOW[Math.round(hx) % 6]);
    }
  }
  let STARS;
  function bgStar(c, cam, t) {
    bands(c, ['#120c34', '#1a1244', '#241852', '#2e1e60', '#3a2470', '#4a2c7c'], [26, 24, 24, 24, 24, 58]);
    if (!STARS) { const r = rng(7); STARS = Array.from({ length: 70 }, () => ({ x: r() * 640, y: r() * 120, p: r() * 6 })); }
    for (const st of STARS) { const x = Math.round((st.x - cam * .04) % 640 + 640) % 640 - 160; if (x < 0 || x >= W) continue;
      const tw = Math.sin(t * 3 + st.p) > .6; R(c, x, st.y, 1, 1, '#ffffff'); if (tw) { R(c, x - 1, st.y, 3, 1, '#c8c8ff'); R(c, x, st.y - 1, 1, 3, '#c8c8ff'); R(c, x, st.y, 1, 1, '#ffffff'); } }
    disc(c, 60, 34, 11, '#fff6d8'); disc(c, 65, 31, 10, '#1a1244');
    // aurora: rainbow ribbons waving across the sky
    c.globalAlpha = .28;
    for (let i = 0; i < 6; i++) for (let x = 0; x < W; x += 2) { const y = Math.round(58 + i * 3 + 10 * Math.sin((x + cam * .06) * .025 + t * .8) + 4 * Math.sin(x * .07 + t * 1.3)); R(c, x, y, 2, 3, RAINBOW[i]); }
    c.globalAlpha = 1;
    tiled(c, cloudTile('#5a3a9a', '#4a2c84'), .15, cam, 104);
  }
  const BGS = [bgCandy, bgLavender, bgChoco, bgStar];
  const SURF = [
    { top: '#ff6ab0', lip: '#ffffff', fill: '#ffc4e0', edge: '#e05a9a' },
    { top: '#6ad05a', lip: '#4a9a3a', fill: '#9a6a44', edge: '#6a4428' },
    { top: '#5a3018', lip: '#9a5a32', fill: '#7a4424', edge: '#4a2410' },
    { top: '#b8c0ff', lip: '#7a6ae0', fill: '#2a2058', edge: '#7a6ae0' },
  ];

  // ---- small drawings ----
  function sparkle(c, x, y, t, big) {
    const col = RAINBOW[Math.floor(x / 20 + t * 6) % 6];
    R(c, x, y - 3, 1, 7, col); R(c, x - 3, y, 7, 1, col); R(c, x - 1, y - 1, 3, 3, col); R(c, x, y, 1, 1, '#ffffff');
    if (big) { R(c, x, y - 5, 1, 1, '#ffffff'); R(c, x, y + 5, 1, 1, '#ffffff'); R(c, x - 5, y, 1, 1, '#ffffff'); R(c, x + 5, y, 1, 1, '#ffffff'); }
  }
  function gemAt(c, x, y, t) {
    for (let i = 0; i < 9; i++) { const hw = 4 - Math.abs(4 - i); R(c, x - hw - 1, y - 5 + i, hw * 2 + 3, 1, '#0e0c14'); }
    for (let i = 0; i < 9; i++) { const hw = 4 - Math.abs(4 - i); if (hw >= 0) R(c, x - hw, y - 4 + i - 1, hw * 2 + 1, 1, i < 4 ? '#ff9ae0' : '#c04aa8'); }
    R(c, x - 2, y - 3, 1, 2, '#ffffff');
    if (Math.floor(t * 4) % 2) { R(c, x + 7, y - 6, 1, 3, '#ffffff'); R(c, x + 6, y - 5, 3, 1, '#ffffff'); }
  }
  function bramble(c, x, y) {
    disc(c, x + 5, y - 5, 5, '#1c4a24'); disc(c, x + 13, y - 5, 5, '#1c4a24'); disc(c, x + 9, y - 8, 5, '#2e6a34'); disc(c, x + 14, y - 7, 3, '#2e6a34');
    for (const [a, b] of [[1, -7], [4, -11], [9, -13], [15, -11], [18, -6], [7, -6], [12, -4]]) R(c, x + a, y + b, 1, 1, '#e8f0b0');
    for (const [a, b] of [[5, -7], [11, -9], [14, -4], [8, -3]]) { R(c, x + a, y + b, 2, 2, '#3a1a5a'); R(c, x + a, y + b, 1, 1, '#8a5ac0'); }
  }
  function pad(c, x, y, w, t) {
    R(c, x, y - 2, w, 2, '#2a2058');
    for (let i = 0; i < 3; i++) { const col = Math.floor(t * 8 - i) % 3 === 0 ? '#ffffff' : i % 2 ? '#ff6ab8' : '#ffe04a', cx = x + 5 + i * 8;
      for (let k = 0; k < 3; k++) { R(c, cx + k, y - 8 + k, 2, 1, col); R(c, cx + k, y - 4 - k, 2, 1, col); } }
  }
  function spring(c, x, y, sq) {
    const hgt = sq > 0 ? 4 : 9;
    for (let i = 0; i < hgt; i += 2) R(c, x + 4 + (i % 4 ? 3 : 0), y - i - 2, 4, 1, '#c8c8d4');
    R(c, x + 2, y - 1, 10, 1, '#5a5a6a');
    const hy = y - hgt - 5; for (const [a, b] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) disc(c, x + 7 + a, hy + b, 2, '#ff6ab8'); disc(c, x + 7, hy, 2, '#ffe04a');
    R(c, x + 1, y - 4, 3, 2, '#5ad86a'); R(c, x + 10, y - 5, 3, 2, '#5ad86a');
  }

  function create(api) {
    const { surfaces, objs, home } = buildCourse();
    const grounds = surfaces.filter(q => q.kind === 'ground');
    if (!FRAMES) FRAMES = { a: riderFrame('a'), b: riderFrame('b'), c: riderFrame('c'), j: riderFrame('j') };
    const s = {
      x: 0, y: 140, vy: 0, v: 0, on: surfaces[0], jumps: 0, jumpT: 0, coyote: 0, buffer: 0, boost: 0, inv: 0, squash: 0,
      t: 0, clock: 0, start: 3.2, over: false, done: 0, sent: false, paused: false,
      score: 0, sparkles: 0, gems: 0, streak: 0, best: 0, falls: 0, bumps: 0, smashed: 0, rescue: null, safe: null,
      zone: 0, banner: { text: ZONES[0].name, t: 2.5 }, fx: [], parts: [], loose: [], trail: [], hintT: 7, cam: -RUN_X,
    };
    s.safe = { q: s.on, x: 0 };
    window.__rainbowDebug?.(s, { surfaces, objs, GRAV, JUMP, JUMP2, FINISH, HB, CEIL });
    let lastCount = 4, bus = null, nextT = 0, step = 0;

    const say = (text, col = '#ffe04a', y = 70) => s.fx.push({ text, t: 1.3, x: RUN_X + 10, y, col });
    const burst = (x, y, n, sp = 90, cols = RAINBOW) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * (.4 + Math.random() * .6); s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: .5 + Math.random() * .4, col: cols[i % cols.length] }); } };
    const mult = () => Math.min(5, 1 + Math.floor(s.streak / 10));
    function supportAt(x, y, tol) { let best = null, bd = tol; for (const q of surfaces) { if (x < q.x0 || x > q.x1) continue; const d = Math.abs(q.yAt(x) - y); if (d <= bd) { bd = d; best = q; } } return best; }
    function breakStreak() { if (s.streak >= 10) say('STREAK OVER', '#ff8ab0', 84); s.streak = 0; }

    function collect(o) {
      o.got = true; s.sparkles++; s.streak++; s.best = Math.max(s.best, s.streak); s.score += 10 * mult();
      Sound.tone(midi(SCALE[s.streak % SCALE.length]), .09, { type: 'square', vol: .045 });
      burst(o.x, o.y, 4, 60);
      if (s.streak % 10 === 0 && s.streak <= 40) { say('X' + mult() + ' STREAK!'); Sound.jingle([1047, 1319, 1568], { step: .05, vol: .06 }); }
      if (s.boost > 0) s.boost = Math.min(BOOST_MAX, s.boost + .2);   // keep grabbing sparkles to keep zooming
      if (s.streak % 20 === 0) { s.boost = Math.max(s.boost, 2); say('SPARKLE BOOST!', '#ffffff', 56); Sound.tone(300, .4, { type: 'sawtooth', slide: 900, vol: .07 }); }
    }
    function bump(o) {
      s.bumps++; s.inv = 1.3; s.v *= .45; s.vy = -230; s.on = null; s.jumps = 1; s.jumpT = 1;
      const lose = Math.min(5, s.sparkles); s.sparkles -= lose; s.score = Math.max(0, s.score - lose * 10);
      for (let i = 0; i < lose; i++) s.loose.push({ x: s.x, y: s.y - 16, vx: s.v + 60 + Math.random() * 120, vy: -160 - Math.random() * 140, t: 1.8, age: 0 });
      breakStreak(); say('OUCH! BRAMBLES!', '#ff6a6a');
      Sound.noise(.25, { vol: .25, freq: 1200 }); Sound.tone(392, .25, { type: 'triangle', slide: -200, vol: .1 });
    }
    function startRescue() {
      const q = s.safe.q, rx = clamp(s.safe.x - 60, q.x0 + 10, Math.max(q.x0 + 10, q.x1 - 10));
      s.rescue = { t: 0, x: rx, y: q.yAt(rx), q, cam0: s.cam };
      s.falls++; breakStreak(); s.boost = 0; s.trail = [];
      Sound.tone(660, .5, { type: 'triangle', slide: -400, vol: .1 }); Sound.jingle([523, 659, 784], { step: .12, vol: .06 });
    }

    function music() {
      if (!Sound.ac || s.paused || s.over) return;
      if (!bus) { bus = Sound.bus(); nextT = Sound.ac.currentTime + .05; }
      const now = Sound.ac.currentTime, E = .17;
      if (nextT < now - .1) nextT = now + .05;
      while (nextT < now + .2) {
        const i = step % 8, ch = CHORDS[Math.floor(step / 8) % 4], m = MEL[step % 32];
        if (m) Sound.tone(midi(m + (s.boost > 0 ? 12 : 0)), E * .85, { type: 'square', vol: .03, at: nextT, out: bus });
        if (i % 2 === 0) Sound.tone(midi(ch - 24 + (i === 4 ? 12 : 0)), E * 1.6, { type: 'triangle', vol: .09, at: nextT, out: bus });
        else Sound.noise(.03, { vol: .02, freq: 6000, type: 'highpass', at: nextT, out: bus });
        nextT += E; step++;
      }
    }

    function finishRun() {
      if (s.sent) return; s.sent = true;
      const perfect = !s.falls && !s.bumps, time = Math.max(0, Math.round((PAR - s.time) * 100));
      const score = s.score + time + (perfect ? 2000 : 0);
      api.finish({ score, headline: perfect ? 'PERFECT RAINBOW!' : s.falls ? 'RAINBOW RUNNER!' : 'SPARKLE SUPERSTAR!',
        stats: [['TIME', s.time.toFixed(1) + 's'], ['SPARKLES', String(s.sparkles)], ['BEST STREAK', String(s.best)], ['OOPSIES', String(s.falls + s.bumps)]] });
    }

    function update(dt) {
      dt = Math.min(dt, 1 / 30); s.t += dt; s.hintT -= dt;
      if (s.banner) { s.banner.t -= dt; if (s.banner.t <= 0) s.banner = null; }
      s.fx = s.fx.filter(f => (f.t -= dt) > 0);
      s.parts = s.parts.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; return (p.t -= dt) > 0; });
      if (s.start > 0) {
        s.start -= dt; const n = Math.ceil(s.start);
        if (n !== lastCount && n >= 0) { lastCount = n; if (n > 0) Sound.tone(523, .12); else Sound.jingle([784, 1047, 1319], { step: .06 }); }
        return;
      }
      music();
      if (!s.over) s.clock += dt;

      if (s.rescue) {
        const rs = s.rescue; rs.t += dt; s.cam = rs.cam0 + (rs.x - RUN_X - rs.cam0) * clamp(rs.t / .6, 0, 1);
        if (rs.t > 1.3) { s.x = rs.x; s.y = rs.y; s.on = rs.q; s.vy = 0; s.v = baseSpeed(s.x) * .6; s.inv = 1.5; s.jumps = 0; s.rescue = null; say('HERE WE GO AGAIN!', '#ffffff'); }
        return;
      }

      const pressed = !s.over && (Input.downs.length > 0 || Input.keyPressed('Space', 'ArrowUp', 'KeyW'));
      const held = Input.held(() => true) || Input.key('Space', 'ArrowUp', 'KeyW');
      if (pressed) s.buffer = .12; else s.buffer -= dt;
      s.boost -= dt; s.inv -= dt; s.coyote -= dt; s.squash -= dt; s.jumpT += dt;

      const target = s.over ? 0 : s.boost > 0 ? BOOST_V : baseSpeed(s.x) * (s.on?.kind === 'arc' ? 1.15 : 1);
      s.v += clamp(target - s.v, -(s.over ? 320 : 140) * dt, (s.boost > 0 ? 900 : 200) * dt);
      const xPrev = s.x, yPrev = s.y;
      s.x += s.v * dt;

      if (s.on) {
        const q = s.x >= s.on.x0 && s.x <= s.on.x1 ? s.on : supportAt(s.x, s.y, 10);
        if (q) { s.on = q; s.y = q.yAt(s.x); s.safe = { q, x: s.x }; }
        else { s.on = null; s.coyote = .09; s.jumps = 1; s.vy = 0; s.jumpT = 1; }
      }
      if (s.buffer > 0) {
        if (s.on || s.coyote > 0) { s.vy = -JUMP; s.on = null; s.coyote = 0; s.jumps = 1; s.buffer = 0; s.jumpT = 0; Sound.tone(392, .14, { type: 'square', slide: 400, vol: .07 }); }
        else if (s.jumps < 2) { s.vy = -JUMP2; s.jumps = 2; s.buffer = 0; s.jumpT = 0; burst(s.x, s.y - 4, 10, 110); Sound.jingle([784, 988, 1175, 1568], { step: .035, vol: .06 }); }
      }
      if (!s.on) {
        // let go early for a smaller hop, but every jump gets a tenth of a second at full strength
        s.vy += GRAV * (s.vy < 0 && !held && s.jumpT > .1 ? 1.8 : 1) * dt; s.vy = Math.min(s.vy, MAXFALL);
        s.y += s.vy * dt;
        if (s.y < CEIL) { s.y = CEIL; s.vy = Math.max(s.vy, 0); }
        for (const q of grounds) if (q.x0 >= xPrev + 8 && q.x0 < s.x + 8 && s.y > q.y + 3) s.x = q.x0 - 8;  // the side of a ledge
        if (s.vy >= 0) {
          let best = null;
          for (const q of surfaces) { if (s.x < q.x0 || s.x > q.x1) continue; const a = q.yAt(clamp(xPrev, q.x0, q.x1)), b = q.yAt(s.x); if (yPrev <= a + 2 && s.y >= b && (!best || b < best.b)) best = { q, b }; }
          if (best) { s.on = best.q; s.y = best.b; s.vy = 0; s.jumps = 0; s.squash = .1; if (best.q.kind === 'cloud') s.boost = Math.min(s.boost, 0); Sound.noise(.05, { vol: .08, freq: 700 }); for (let i = 0; i < 4; i++) s.parts.push({ x: s.x + (i - 1.5) * 4, y: s.y - 1, vx: (i - 1.5) * 30, vy: -30, t: .3, col: '#ffffff' }); }
        }
        if (s.y > H + 40 && !s.over) { startRescue(); return; }
      }

      // things on the course
      const px0 = s.x - HB.l, px1 = s.x + HB.r, py0 = s.y - HB.top, py1 = s.y, mx = s.x + 2, my = s.y - 15;
      for (const o of objs) {
        if (o.got || o.x < s.x - 80 || o.x > s.x + 80) continue;
        if (o.k === 'spark') {
          // sparkles drift into her when close, and from much farther away while boosting
          if (!o.mag && Math.hypot(o.x - mx, o.y - my) < (s.boost > 0 ? MAGNET_BOOST : MAGNET + 16)) o.mag = true;
          if (o.mag) { const k = Math.min(1, dt * 12); o.x += (mx - o.x) * k + s.v * dt; o.y += (my - o.y) * k; }
          if (o.x > px0 - 2 && o.x < px1 + 2 && o.y > py0 - 4 && o.y < py1 + 2) collect(o);
        }
        else if (o.k === 'gem') { if (o.x > px0 - 4 && o.x < px1 + 4 && o.y > py0 - 8 && o.y < py1 + 6) { o.got = true; s.gems++; s.score += 250; say('+250 RAINBOW GEM!', '#ff9ae0', 50); burst(o.x, o.y, 16, 140); Sound.jingle([1047, 1319, 1568, 2093], { step: .06, vol: .08 }); } }
        else if (o.k === 'pad') { if (s.on && s.x > o.x - 4 && s.x < o.x + o.w + 4 && s.boost < 2) { if (s.boost <= 0) { say('SPEED BOOST!', '#ffffff', 56); Sound.tone(220, .5, { type: 'sawtooth', slide: 1100, vol: .07 }); } s.boost = 2.4; s.v = Math.max(s.v, BOOST_V * .9); } }
        else if (o.k === 'spring') { if (s.on && Math.abs(s.x - (o.x + 7)) < 10 && Math.abs(s.y - o.y) < 3) { s.vy = -SPRING; s.on = null; s.jumps = 1; s.jumpT = 1; o.sq = .25; burst(o.x + 7, o.y - 10, 8, 90, ['#ff6ab8', '#ffe04a']); Sound.tone(260, .3, { type: 'triangle', slide: 700, vol: .1 }); } }
        else if (o.k === 'bramble' && px1 > o.x + 3 && px0 < o.x + o.w - 3 && py1 > o.y - o.h + 3) {
          if (s.boost > 0) { o.got = true; s.smashed++; s.score += 30; burst(o.x + 9, o.y - 6, 12, 120, ['#2e6a34', '#1c4a24', '#3a1a5a', '#ffe04a']); Sound.noise(.12, { vol: .2, freq: 2400 }); if (s.smashed % 3 === 1) say('SMASH!', '#5ad86a', 84); }
          else if (s.inv <= 0) bump(o);
        }
      }
      for (const o of objs) if (o.sq > 0) o.sq -= dt;
      s.loose = s.loose.filter(l => { l.age += dt; l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 600 * dt;
        if (l.age > .25 && l.x > px0 - 2 && l.x < px1 + 2 && l.y > py0 - 4 && l.y < py1 + 2) { s.sparkles++; s.score += 10; Sound.tone(1568, .06, { vol: .04 }); return false; }
        return (l.t -= dt) > 0 && l.y < H + 10; });

      // rainbow trail while boosting or riding a rainbow
      s.trail.push({ x: s.x - 12, y: s.y - 17, on: s.boost > 0 || s.on?.kind === 'arc' }); if (s.trail.length > 26) s.trail.shift();
      if (Math.random() < dt * (s.boost > 0 ? 30 : 6)) s.parts.push({ x: s.x - 14, y: s.y - 4 - Math.random() * 18, vx: -30, vy: -10, t: .5, col: s.boost > 0 ? RAINBOW[Math.floor(Math.random() * 6)] : '#ffffff' });

      const z = zoneAt(s.x); if (z !== s.zone) { s.zone = z; s.banner = { text: ZONES[z].name, t: 2.2 }; Sound.jingle([659, 784, 1047], { step: .08, vol: .08 }); }
      if (!s.over && s.x >= FINISH) { s.over = true; s.time = s.clock; s.banner = { text: 'YOU DID IT!', t: 3 }; Sound.jingle([523, 659, 784, 1047, 784, 1047, 1319], { step: .1 }); burst(FINISH, 90, 40, 160); }
      if (s.over) { s.done += dt; if (Math.random() < dt * 8) burst(FINISH + Math.random() * 200 - 60, 40 + Math.random() * 40, 8, 80); if (s.done > 2.8) finishRun(); }
      s.cam = s.x - RUN_X;
    }

    function drawSurface(c, q, cam) {
      const a = Math.max(q.x0, cam - 2), b = Math.min(q.x1, cam + W + 2); if (a >= b) return;
      if (q.kind === 'ground') {
        const sf = SURF[zoneAt(q.x0)], z = zoneAt(q.x0), sx = Math.round(a - cam), w = Math.round(b - a) + 1, y = Math.round(q.y);
        R(c, sx, y, w, H - y, sf.fill); R(c, sx, y, w, 3, sf.top); R(c, sx, y + 3, w, 1, sf.lip);
        for (let wx = Math.ceil(a / 6) * 6; wx < b; wx += 6) {
          const x = wx - cam, k = wx / 6;
          if (z === 0) { if (k % 3 === 0) R(c, x, y + 3, 2, 3 + wx % 4, sf.top); R(c, x + 2, y + 9 + (wx * 7) % 22, 2, 1, RAINBOW[k % 6]); }
          else if (z === 1) { R(c, x, y - 3, 1, 3, '#4a9a3a'); if (k % 2) { R(c, x, y - 6, 1, 3, '#a86ad8'); R(c, x + 1, y - 5, 1, 1, '#c89af0'); } if (k % 5 === 0) R(c, x + 2, y + 10 + (wx * 3) % 18, 3, 2, '#7a5236'); }
          else if (z === 2) { if (k % 2 === 0) { R(c, x, y + 4, 1, H - y, '#5a3018'); R(c, x + 1, y + 4, 1, H - y, '#9a5a32'); } for (let n = 1; n < 6; n++) { R(c, x, y + 4 + 12 * n, 6, 1, '#5a3018'); R(c, x, y + 5 + 12 * n, 6, 1, '#9a5a32'); } if (k % 4 === 1) R(c, x + 1, y + 3, 2, 2 + (wx * 3) % 5, sf.top); if (k % 7 === 3) R(c, x + 3, y + 8 + (wx % 17), 2, 1, RAINBOW[k % 6]); }
          else { if ((k * 7) % 5 === 0) R(c, x + 2, y + 8 + (wx * 5) % 24, 1, 1, Math.sin(s.t * 4 + k) > 0 ? '#ffffff' : '#7a6ae0'); }
        }
        if (q.x0 >= cam - 2) R(c, Math.round(q.x0 - cam), y, 1, H - y, sf.edge);
        if (q.x1 <= cam + W + 2) R(c, Math.round(q.x1 - cam), y, 1, H - y, sf.edge);
      } else if (q.kind === 'cloud') {
        const sx = Math.round(q.x0 - cam), w = q.x1 - q.x0, y = Math.round(q.y), z = zoneAt(q.x0);
        const col = z === 3 ? '#d8d0ff' : z === 2 ? '#ffd8ec' : '#ffffff', shade = z === 3 ? '#9a8ae0' : z === 2 ? '#e8a8c8' : '#c8d8ff';
        for (let i = 2; i < w - 2; i += 7) disc(c, sx + i + 2, y + 6, 4, shade);
        R(c, sx, y, w, 6, col); disc(c, sx + 1, y + 3, 3, col); disc(c, sx + w - 1, y + 3, 3, col);
        R(c, sx + 2, y + 1, w - 6, 1, '#ffffff');
      } else {
        for (let x = a; x < b; x++) { const top = Math.round(q.yAt(x)), sx = Math.round(x - cam); for (let i = 0; i < 6; i++) R(c, sx, top + i * 2, 1, 2, RAINBOW[i]);
          if ((Math.round(x) + Math.round(s.t * 140)) % 46 === 0) { R(c, sx, top - 1, 1, 3, '#ffffff'); R(c, sx - 1, top, 3, 1, '#ffffff'); } }
        for (const ex of [q.x0, q.x1]) if (ex > cam - 12 && ex < cam + W + 12) { disc(c, ex - cam, q.y + 6, 7, '#e0e8ff'); disc(c, ex - cam, q.y + 5, 6, '#ffffff'); }
      }
    }

    function drawRider(c, x, y, frame) {
      if (s.inv > 0 && Math.floor(s.t * 14) % 2) return;
      blit(c, FRAMES[frame], x - 16, y - 32 + (s.squash > 0 ? 1 : 0) - (frame === 'b' ? 1 : 0));
      if (s.boost > 0 && !s.rescue) { const w = Math.round(24 * Math.min(1, s.boost / BOOST_MAX)); R(c, x - 13, y - 38, 26, 4, '#0e0c14'); for (let i = 0; i < 2; i++) R(c, x - 12, y - 37 + i, w, 1, RAINBOW[Math.floor(s.t * 10 + i) % 6]); }
    }

    function draw(c) {
      const cam = Math.round(s.cam), zc = zoneAt(cam + RUN_X);
      BGS[zc](c, cam, s.t);
      const since = cam + RUN_X - ZONES[zc].from; if (zc > 0 && since < 240) { c.globalAlpha = 1 - since / 240; BGS[zc - 1](c, cam, s.t); c.globalAlpha = 1; }

      for (const q of surfaces) if (q.kind !== 'arc') drawSurface(c, q, cam);
      for (const q of surfaces) if (q.kind === 'arc') drawSurface(c, q, cam);

      // finish arch and the cheering section
      const fx = FINISH - cam, gy = Math.round(home.y);
      if (fx > -140 && fx < W + 260) {
        c.drawImage(rainbowArc(48, 4), Math.round(fx - 49), gy - 48);
        for (let i = 0; i < 6; i++) R(c, fx - 1, gy - 6 + i, 2, 1, i % 2 ? '#0e0c14' : '#ffffff');
        box(c, fx - 26, gy - 66, 52, 12, '#ff6ab8', '#0e0c14'); T(c, 'FINISH', fx, gy - 64, '#ffffff', { f: 's', a: 'c' });
        const px = fx + 170, hop = k => Math.abs(Math.sin(s.t * 6 + k)) * (s.over ? 4 : 1);
        blit(c, spr('sebHelmet'), px, gy - 22 - hop(0));
        blit(c, spr('mishaReading'), px + 22, gy - 19 - hop(1));
        blit(c, spr('dogHans'), px + 44, gy - 15 - hop(2), 1, true);
        blit(c, spr('dogLexie'), px + 70, gy - 13 - hop(3), 1, true);
        box(c, px - 6, gy - 44, 76, 13, '#ffffff', '#0e0c14'); R(c, px + 10, gy - 31, 2, 4, '#0e0c14');
        T(c, 'GO SOPHIA!', px + 32, gy - 41, RAINBOW[Math.floor(s.t * 6) % 6] === '#ffe04a' ? '#ff4a5a' : RAINBOW[Math.floor(s.t * 6) % 6], { f: 's', a: 'c' });
      }

      for (const o of objs) {
        const sx = o.x - cam; if (sx < -30 || sx > W + 30 || o.got) continue;
        if (o.k === 'spark') sparkle(c, sx, o.y + Math.round(Math.sin(s.t * 4 + o.x * .1)), s.t, Math.floor(s.t * 5 + o.x / 13) % 3 === 0);
        else if (o.k === 'gem') gemAt(c, sx, o.y + Math.round(Math.sin(s.t * 3) * 2), s.t);
        else if (o.k === 'bramble') bramble(c, sx, o.y);
        else if (o.k === 'pad') pad(c, sx, o.y, o.w, s.t);
        else if (o.k === 'spring') spring(c, sx, o.y, o.sq);
      }
      for (const l of s.loose) if (Math.floor(l.t * 10) % 2 || l.t > .6) sparkle(c, Math.round(l.x - cam), Math.round(l.y), s.t, false);

      // rainbow trail
      for (let i = 1; i < s.trail.length; i++) { const p = s.trail[i - 1], n = s.trail[i]; if (!p.on || !n.on) continue;
        c.globalAlpha = i / s.trail.length; const x0 = Math.round(p.x - cam), w = Math.max(1, Math.round(n.x - p.x) + 1);
        for (let k = 0; k < 6; k++) R(c, x0, Math.round(p.y) - 6 + k * 2, w, 2, RAINBOW[k]); }
      c.globalAlpha = 1;

      if (s.rescue) {
        const rs = s.rescue, k = clamp((rs.t - .3) / .7, 0, 1), cy = Math.round(H + 20 + (rs.y + 6 - H - 20) * (1 - (1 - k) ** 2)), cx = Math.round(rs.x - cam);
        drawRider(c, cx, cy - 4, 'j');
        disc(c, cx - 12, cy, 6, '#ffffff'); disc(c, cx, cy - 2, 8, '#ffffff'); disc(c, cx + 12, cy, 6, '#ffffff'); R(c, cx - 18, cy + 1, 37, 5, '#ffffff'); R(c, cx - 17, cy + 6, 35, 1, '#c8d8ff');
        if (rs.t < 1) TO(c, 'OOPS! CLOUD TO THE RESCUE!', 160, 60, '#ffffff', '#0e0c14', '#a86aff', { f: 's', a: 'c' });
      } else {
        const frame = !s.on ? 'j' : s.v < 5 ? 'b' : ['a', 'b', 'c', 'b'][Math.floor(s.x / 16) % 4];
        drawRider(c, Math.round(s.x - cam), Math.round(s.y), frame);
      }
      for (const p of s.parts) R(c, Math.round(p.x - cam), Math.round(p.y), p.t > .25 ? 2 : 1, p.t > .25 ? 2 : 1, p.col);
      for (const f of s.fx) TO(c, f.text, f.x, f.y - (1.3 - f.t) * 12, f.col, '#0e0c14', null, { f: 's', a: 'c' });

      // HUD
      R(c, 0, 0, W, 15, '#0e0c14');
      sparkle(c, 8, 7, s.t, false); T(c, String(s.sparkles), 15, 4, '#ffe04a');
      const m = mult(); if (m > 1) TO(c, 'X' + m, 62, 4, RAINBOW[Math.floor(s.t * 8) % 6], '#0e0c14', null, {});
      const bx = 96, bw = 150, prog = clamp(s.x / FINISH, 0, 1);
      for (let i = 0; i < 6; i++) R(c, bx, 5 + i, Math.round(bw * prog), 1, RAINBOW[i]);
      R(c, bx + Math.round(bw * prog), 5, bw - Math.round(bw * prog), 6, '#2a2440');
      for (let i = 1; i < 4; i++) R(c, bx + Math.round(i * bw / 4), 4, 1, 8, '#6a6a7a');
      R(c, bx + bw, 3, 2, 10, '#ffffff');
      disc(c, bx + Math.round(bw * prog), 8, 3, '#ff9ae0');
      T(c, (s.over ? s.time : s.clock).toFixed(1), 296, 4, '#ffffff', { a: 'r' });
      if (s.banner) TO(c, s.banner.text, 160, 30, '#ffffff', '#0e0c14', '#a86aff', { size: 16, a: 'c' });
      if (s.start > 0) {
        const n = Math.ceil(s.start); TO(c, n > 0 ? String(n) : 'GO!', 160, 74, '#ffe04a', '#0e0c14', '#ff6ab8', { size: 16, a: 'c' });
        TO(c, KEYBOARD ? 'SPACE TO JUMP. PRESS AGAIN IN THE AIR TO DOUBLE JUMP!' : 'TAP TO JUMP. TAP AGAIN IN THE AIR TO DOUBLE JUMP!', 160, 98, '#ffffff', '#0e0c14', null, { f: 's', a: 'c' });
        TO(c, 'ZOOM OVER BOOST PADS. GRAB SPARKLES TO KEEP ZOOMING!', 160, 110, '#ffffff', '#0e0c14', null, { f: 's', a: 'c' });
      }
      if (s.hintT > 0 && s.start <= 0) { c.globalAlpha = .6; R(c, 76, 164, 168, 13, '#0e0c14'); c.globalAlpha = 1;
        T(c, KEYBOARD ? 'SPACE: JUMP  (HOLD = HIGHER)' : 'TAP: JUMP  (HOLD = HIGHER)', 160, 167, '#ffffff', { f: 's', a: 'c' }); }
    }

    return {
      update, draw,
      pause(p) { s.paused = p; if (!p && Sound.ac) nextT = Math.max(nextT, Sound.ac.currentTime + .05); },
      destroy() { try { bus?.disconnect(); } catch (_) {} },
    };
  }

  // C, G, Am, F under a bouncy pentatonic tune, eighth notes
  const CHORDS = [60, 55, 57, 53];
  const MEL = [76, 79, 84, 79, 76, 79, 81, 79, 74, 79, 83, 79, 74, 71, 74, 79, 72, 76, 81, 76, 72, 76, 79, 76, 77, 81, 84, 81, 79, 77, 76, 74];

  function icon(c, x, y) {
    for (let i = 0; i < 5; i++) { const ro = 10 - i * 2, rin = ro - 2; for (let dx = -ro; dx <= ro; dx++) { const top = Math.round(20 - Math.sqrt(ro * ro - dx * dx)), bot = Math.abs(dx) < rin ? Math.round(20 - Math.sqrt(rin * rin - dx * dx)) : 21; R(c, x + 12 + dx, y + top, 1, Math.max(1, bot - top), RAINBOW[i]); } }
    R(c, x + 19, y + 2, 1, 5, '#ffffff'); R(c, x + 17, y + 4, 5, 1, '#ffffff'); R(c, x + 4, y + 3, 1, 3, '#ffe04a'); R(c, x + 3, y + 4, 3, 1, '#ffe04a');
  }

  registerEvent({ id: 'rainbow', name: 'RAINBOW RUSH', star: 'sophia', sub: 'SOPHIA  /  BONUS ROUND', icon, create });
})();
