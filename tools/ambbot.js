// drives Golden Hour like a decent human: looks ahead for curves, cars and pickups, reacts with noisy timing
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, sd = '0.06', skill = '1', tune = '{}'] = process.argv;   // tune: JSON overrides for TUNE in ambulance.js
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 640, height: 360 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.addInitScript(t => { window.__ambTune = JSON.parse(t); }, tune);
  await p.addInitScript(([sd, skill]) => {
    window.__ambDebug = (s, k) => {
      window.S = s; window.K = k; const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += Math.random(); return u / 6 - .5; };
      let target = 0, nextThink = 0, laneErr = 0;
      const tick = () => {
        if (s.phase === 'end') { Input.keys.clear(); return; }
        const now = performance.now();
        if (now >= nextThink) {
          nextThink = now + 120 + Math.abs(gauss()) * sd * 4000;      // reaction time
          const seg = Math.floor((s.pos + k.PLAYER_Z) / k.SEG), lanes = [-2 / 3, 0, 2 / 3];
          const blocked = lx => s.cars.some(c => { const d = (c.z - s.pos - k.PLAYER_Z) / k.SEG; return d > -1 && d < 28 && Math.abs(c.x - lx) < .36; })
            || (s.hazards || []).some(h => !h.hit && h.seg - seg > -1 && h.seg - seg < 24 && Math.abs(h.x - lx) < .4);
          const pick = s.pickups.find(q => !q.got && q.seg - seg > 2 && q.seg - seg < 34 && (q.kind !== 'wrench' || s.amb < 85) && (q.kind === 'wrench' || s.patient < 92));
          const free = lanes.filter(l => !blocked(l));
          if (pick && !blocked(pick.x)) target = pick.x;
          else if (blocked(target) || !lanes.includes(target)) target = free.sort((a, b) => Math.abs(a - s.x) - Math.abs(b - s.x))[0] ?? target;
          if (Math.random() > +skill) target = lanes[Math.floor(Math.random() * 3)];   // a lapse
          laneErr = gauss() * sd * 3;
        }
        Input.keys.clear();
        const seg = Math.floor((s.pos + k.PLAYER_Z) / k.SEG); let mc = 0; for (let i = 0; i < 30; i++) mc = Math.max(mc, Math.abs(k.segs[seg + i]?.curve || 0));
        const want = mc >= 5.5 ? .6 : mc >= 3.5 ? .85 : 1;
        if (s.speed / k.MAX > want + .04) Input.keys.add('ArrowDown');
        else { const e = target + laneErr - s.x; if (e > .06) Input.keys.add('ArrowRight'); else if (e < -.06) Input.keys.add('ArrowLeft'); }
      };
      setInterval(tick, 16);
    };
  }, [+sd, +skill]);
  await p.goto('file://' + file + '#play-ambulance'); await p.waitForTimeout(1000);
  await p.keyboard.press('Enter');
  const t0 = Date.now(); let lastLog = 0;
  while (Date.now() - t0 < 300000) {
    await p.waitForTimeout(1000);
    const st = await p.evaluate(() => ({ seg: Math.round(S.pos / 200), phase: S.phase, end: S.endKind, t: +S.time.toFixed(1), pat: +S.patient.toFixed(0), amb: +S.amb.toFixed(0), crashes: S.crashes, picked: S.picked, zone: K.segs[Math.round(S.pos / 200)].zone }));
    if (Date.now() - lastLog > 15000) { console.log(JSON.stringify(st)); lastLog = Date.now(); }
    if (st.phase === 'end') { await p.waitForTimeout(3800); break; }
  }
  const res = await p.evaluate(() => ({ end: S.endKind, t: +S.time.toFixed(1), pat: +S.patient.toFixed(0), amb: +S.amb.toFixed(0), crashes: S.crashes, bumps: S.bumps, picked: S.picked, wine: S.wine, scene: Shell.scene.constructor?.name }));
  console.log('RESULT', JSON.stringify(res));
  await b.close();
})();
