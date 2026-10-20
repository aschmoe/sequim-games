const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, outdir, cls, sd] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.addInitScript((sd) => {
    window.__dndDebug = (s, h) => { window.DS = s; window.DH = h; window.STATS = { blocks: 0, perfect: 0, good: 0 };
      const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      let plan = null, lastInc = null, barAim = null;
      const tick = () => {
        if (s.inc && s.inc !== lastInc) { lastInc = s.inc; plan = null; }
        if (s.inc && !s.inc.result && plan === null) plan = s.inc.ring.T + gauss() * sd;
        if (s.inc && !s.inc.result && plan !== null && s.inc.t >= plan) { Input.downs.push({ id: 9, x: 200, y: 90 }); plan = 1e9; }
        if (s.inc && s.inc.result && plan === 1e9) { STATS.blocks++; if (s.inc.result === 'perfect') STATS.perfect++; if (s.inc.result === 'good') STATS.good++; plan = -1; }
        if (s.inc && s.inc.hits > 1 && s.inc.result === null && plan === -1) plan = null;
        if (s.cmd === 'bar') { if (barAim === null) barAim = .5 + gauss() * .09; if (s.ct > .3 && Math.abs(s.barPos - barAim) < .03) { Input.pressed.add('Space'); barAim = null; } } else barAim = null;
        if (s.cmd === 'mash' && Math.random() < .15) Input.downs.push({ id: 7, x: 160, y: 90 });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
  }, +sd);
  await p.goto('file://' + file + '#play-dnd'); await p.waitForTimeout(900);
  const ev = f => p.evaluate(f); const shots = new Set();
  const shot = async n => { if (shots.has(n)) return; shots.add(n); await p.screenshot({ path: `${outdir}/t-${cls}-${n}.png` }); };
  await p.keyboard.press('Digit' + cls); await p.waitForTimeout(300);
  const t0 = Date.now();
  for (let i = 0; i < 6000; i++) {
    const st = await ev(() => ({ phase: DS.phase, cmd: DS.cmd, inc: !!DS.inc, atb: DS.atb, room: DS.room, hp: DS.hp, max: DS.max, wine: DS.wine, uses: DS.uses, scene: Shell.scene.constructor.name, ins: DS.insults && DS.insults.findIndex(x => x.good), klass: DS.klass && DS.klass.id, alive: DS.foes.filter(f => f.hp > 0).length, rech: DS.foes.some(f => f.rechargeT > 0), smash: DS.foes.some(f => f.hp > 0 && f.intent.kind === 'smash' && f.atb > .6) }));
    if (st.scene !== 'PlayScene') break;
    if (st.phase === 'battle') {
      if (st.inc) await shot('block' + st.room);
      if (st.cmd === 'bar') await shot('bar');
      if (st.rech) await shot('recharge');
      if (!st.cmd && !st.inc) { await shot('battle' + st.room);
        if (st.atb >= 1) { let pick = 1; if (st.hp < st.max * .4 && st.wine > 0) pick = 3; else if (st.smash && Math.random() < .5) pick = 4; else if (st.uses > 0 && (st.klass !== 'fighter' || st.alive > 1)) pick = 2; await p.keyboard.press('Digit' + pick); } }
      if (st.cmd === 'target') await p.keyboard.press('Enter');
      if (st.cmd === 'mock') { await p.waitForTimeout(500); await p.keyboard.press('Digit' + (st.ins + 1)); }
    }
    if (st.phase === 'rest') { await p.waitForTimeout(300); await p.keyboard.press('Digit1'); }
    await p.waitForTimeout(25);
  }
  await p.waitForTimeout(500);
  console.log('class', cls, 'sd', sd, Math.round((Date.now() - t0) / 1000) + 's', JSON.stringify(await ev(() => ({ blocks: STATS, r: Shell.scene.r && { score: Shell.scene.r.score, headline: Shell.scene.r.headline, rooms: Shell.scene.r.stats[1][1], crits: Shell.scene.r.stats[2][1], hpLeft: DS.hp + '/' + DS.max } }))));
  await b.close();
})();
