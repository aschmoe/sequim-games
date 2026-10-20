const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, mode] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.addInitScript((mode) => { window.__voltDebug = s => { window.S = s; s.hintT = 0;
    const log = []; window.LOG = log; let lastZ = -1;
    setInterval(() => {
      if (S.start > 0 || S.over) return;
      Input.keys.clear();
      const ahead = S.objs.find(o => !o.hit && !o.pickup && !(o.ped && o.aside) && o.x + o.w > S.d - 12 && o.x - S.d < 60);
      const ped = S.objs.find(o => o.ped && !o.aside && !o.hit && o.x - S.d < 200 && o.x > S.d);
      const smart = mode === 'smart';
      const R=[[1380,1500],[3460,3600],[5560,5700]].find(([a,b]) => S.d <= b && a - S.d < 40 + S.v * .9);
      const pedSlow = ped && !smart;
      if ((pedSlow && S.v > 40) || (R && S.v > 74)) Input.keys.add('ArrowLeft');
      else if (S.v < 150) Input.keys.add('ArrowRight');
      if (smart && S.battery > 15 && S.v > 110 && S.wobble === 0 && !ped) { /* coast downhill a bit */ }
      const pick = smart && S.objs.find(o => !o.hit && o.pickup && o.x - S.d < 30 + S.v * .1 && o.x > S.d - 6);
      if (pick && S.alt === 0) Input.pressed.add('ArrowUp');
      if (ahead && (smart || !ahead.ped) && ahead.x - S.d < 34 + S.v * .12 && S.alt === 0 && !R) Input.pressed.add('ArrowUp');
    }, 30);
    window.CRASHES=[]; setInterval(() => { for (const f of S.fx) if (f.col === '#ff6a6a' && !f.seen) { f.seen = 1; window.CRASHES.push(f.text + '@' + Math.round(S.d) + ' v' + Math.round(S.v) + ' alt' + Math.round(S.alt)); } }, 50);
    setInterval(() => log.push([Math.round(S.t), Math.round(S.d), Math.round(S.battery), S.wipeouts]), 5000);
  }; }, mode);
  await p.goto('file://' + file + '#play-volt');
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(5000); const r = await p.evaluate(() => window.S ? { t: S.t, d: S.d, bat: S.battery, w: S.wipeouts, over: S.over, time: S.time, scene: Shell.scene.constructor.name } : null); console.log(JSON.stringify(r)); if (!r || r.over || r.scene !== 'PlayScene') break; }
  console.log('crashes', JSON.stringify(await p.evaluate(() => window.CRASHES)));
  await b.close();
})();
