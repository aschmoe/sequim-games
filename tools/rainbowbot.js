// plays Rainbow Rush: looks ahead with the game's own physics, jumps near edges and over brambles, with noisy timing
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, sd = '0.03', shots = ''] = process.argv;   // sd: timing noise in seconds; shots: a directory for screenshots
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.addInitScript(sd => {
    window.__rainbowDebug = (s, k) => {
      window.S = s; window.K = k; const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += Math.random(); return (u / 6 - .5) * 3.4; };
      const grounds = k.surfaces.filter(q => q.kind === 'ground');
      const support = (x, y) => k.surfaces.find(q => x >= q.x0 && x <= q.x1 && Math.abs(q.yAt(x) - y) <= 10);
      const brambles = k.objs.filter(o => o.k === 'bramble');
      // fly from a state; return true if it lands without touching a bramble. dbl: seconds until a double jump (or null)
      const fly = (x, y, vy, v, dbl, boost) => {
        const dt = 1 / 60; let t = 0;
        while (t < 3) {
          const xp = x, yp = y; x += v * dt; t += dt;
          if (dbl !== null && t >= dbl) { vy = -k.JUMP2; dbl = null; }
          vy = Math.min(vy + k.GRAV * dt, 720); y += vy * dt; if (y < 40) { y = 40; vy = Math.max(vy, 0); }
          for (const q of grounds) if (q.x0 >= xp + 5 && q.x0 < x + 5 && y > q.y + 3) x = q.x0 - 5;
          if (boost - t <= 0 && brambles.some(o => !o.got && x + 6 > o.x + 3 && x - 6 < o.x + o.w - 3 && y > o.y - o.h + 3)) return false;
          if (vy >= 0) for (const q of k.surfaces) { if (x < q.x0 || x > q.x1) continue; if (yp <= q.yAt(Math.max(q.x0, Math.min(q.x1, xp))) + 2 && y >= q.yAt(x)) {
            // landed: make sure we are not landing right on top of a bramble
            return !(boost - t <= 0 && brambles.some(o => !o.got && x + 6 > o.x + 3 && x - 6 < o.x + o.w - 3)); } }
          if (y > 220) return false;
        }
        return false;
      };
      let noise = gauss() * sd, holdUntil = 0;
      const press = () => { Input.pressed.add('Space'); Input.keys.add('Space'); holdUntil = performance.now() + 260; noise = gauss() * sd; };
      setInterval(() => {
        if (performance.now() > holdUntil) Input.keys.delete('Space');
        if (s.start > 0 || s.rescue || s.over) return;
        const v = Math.max(s.v, 60), lead = Math.max(0, .05 + noise) * v;
        if (s.on) {
          // what is coming if we keep running
          let edge = null, thorn = null;
          for (let d = 0; d < 260; d += 2) { if (!support(s.x + d, s.on.kind === 'arc' ? s.on.yAt(Math.min(s.on.x1, s.x + d)) : s.y)) { edge = d; break; } }
          const br = s.boost > 0 ? null : brambles.find(o => !o.got && o.x + o.w > s.x - 4 && o.x - s.x < 140); if (br) thorn = br.x - s.x;
          const canSingle = fly(s.x, s.y, -k.JUMP, v, null, s.boost), canDouble = !canSingle && [.25, .3, .35, .4, .45].some(t => fly(s.x, s.y, -k.JUMP, v, t, s.boost));
          if (edge !== null && edge <= 10 + lead && (canSingle || canDouble || edge <= 4)) press();
          else if (thorn !== null && thorn < 34 + lead && canSingle) press();
          else if (edge !== null && edge < 120 && canSingle && edge < 50 + lead && !fly(s.x + edge, s.y, -k.JUMP, v, null, 0) ) press();
        } else if (s.jumps < 2 && s.vy > -80 && !fly(s.x, s.y, s.vy, v, null, s.boost) && fly(s.x, s.y, s.vy, v, 0, s.boost)) press();
      }, 16);
    };
  }, +sd);
  await p.goto('file://' + file + '#play-rainbow'); await p.waitForTimeout(800);
  const t0 = Date.now(); let n = 0, lastShot = -1;
  while (Date.now() - t0 < 200000) {
    await p.waitForTimeout(250);
    const st = await p.evaluate(() => window.S ? { x: S.x, over: S.over, done: S.done, start: S.start } : null);
    if (shots && st && st.start <= 0 && Math.floor(st.x / 1200) > lastShot) { lastShot = Math.floor(st.x / 1200); await p.screenshot({ path: `${shots}/r-${String(++n).padStart(2, '0')}.png` }); }
    if (await p.evaluate(() => Shell.scene?.constructor?.name === 'ResultsScene')) break;
  }
  const r = await p.evaluate(() => ({ time: +(S.time ?? S.clock).toFixed(1), sparkles: S.sparkles, total: K.objs.filter(o => o.k === 'spark').length, gems: S.gems, best: S.best, falls: S.falls, bumps: S.bumps, score: Shell.scene.r?.score, headline: Shell.scene.r?.headline }));
  if (shots) await p.screenshot({ path: `${shots}/r-results.png` });
  console.log(JSON.stringify(r));
  await b.close();
})();
