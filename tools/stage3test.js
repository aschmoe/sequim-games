const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, outdir] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.addInitScript(() => { window.__stageDebug = (s, h) => { window.SS = s; window.SH = h; }; });
  await p.goto('file://' + file + '#play-stage'); await p.waitForTimeout(800);
  const ev = f => p.evaluate(f); const shots = new Set();
  const shot = async n => { if (shots.has(n)) return; shots.add(n); await p.screenshot({ path: `${outdir}/q-${n}.png` }); };
  let held = false; const t0 = Date.now();
  for (let i = 0; i < 6000; i++) {
    const st = await ev(() => ({ phase: SS.phase, act: SS.act, beat: SS.beat, t: SS.t, step: SS.phase === 'beat' ? SH.step().id : '', reelIdx: SS.reelIdx, mark: SS.mark, m: SS.m, chosen: SS.chosen,
      rects: SS.optRects, clock: SS.clock, fly: (SS.flying || []).filter(f => !f.done && f.land).map(f => ({ kind: f.kind, x: f.land.x, y: f.land.y })), scene: Shell.scene.constructor.name }));
    if (st.scene !== 'PlayScene') { console.log('ended after', Math.round((Date.now() - t0) / 1000), 's real'); break; }
    if (st.phase === 'wheels' && st.reelIdx < 2 && st.t > 1 + st.reelIdx * .6) await p.keyboard.press('Space');
    if (st.phase === 'wheels' && st.reelIdx === 2) await shot('wheels');
    if (st.phase === 'beat') {
      const key = st.act + '.' + st.beat, worst = key === '1.0';
      if (st.step === 'move') { if (!held) { await p.mouse.move(st.mark.x * 3, (st.mark.y - 6) * 3); await p.mouse.down(); held = true; } if (key === '0.1') await shot('move'); }
      else if (held && st.step !== 'bow') { await p.mouse.up(); held = false; }
      if ((st.step === 'action' || st.step === 'line') && st.chosen < 0 && st.rects.length === 3) {
        if (key === '0.1') await shot(st.step);
        const sc = await ev(() => (SH.step().id === 'action' ? SS.actionOpts.map(o => SH.pips(SS.vibe.style, o)) : SS.lineOpts.map(o => SH.pips(SS.vibe.mood, o))));
        const i = worst ? sc.indexOf(Math.min(...sc)) : sc.indexOf(Math.max(...sc));
        await p.waitForTimeout(700); const r = (await ev(() => SS.optRects)).find(q => q.i === i); if (r) await p.mouse.click((r.x + r.w / 2) * 3, (r.y + r.h / 2) * 3);
      }
      if (st.step === 'bow') {
        const rose = st.fly.find(f => f.kind === 'rose'), tom = st.fly.find(f => f.kind === 'tomato');
        let tx = null, ty = null;
        if (tom && Math.hypot(st.m.x - tom.x, st.m.y - tom.y) < 20) { tx = st.m.x + (st.m.x < 220 ? 30 : -30); ty = st.m.y; } else if (rose) { tx = rose.x; ty = rose.y; }
        if (tx !== null) { if (!held) { await p.mouse.move(tx * 3, (ty - 6) * 3); await p.mouse.down(); held = true; } else await p.mouse.move(tx * 3, (ty - 6) * 3); } else if (held) { await p.mouse.up(); held = false; }
        if (st.fly.length) await shot(worst ? 'bow-bad' : (key === '0.1' ? 'bow' : 'bow-x'));
      }
      if (key === '1.2' && st.step === 'action') await shot('later');
    }
    await p.waitForTimeout(40);
  }
  await p.waitForTimeout(800);
  console.log(JSON.stringify(await ev(() => ({ score: SS.score, applause: Math.round(SS.applause), tally: SS.tally, gameSeconds: Math.round(SS.clock) }))));
  await p.screenshot({ path: `${outdir}/q-results.png` });
  await b.close();
})();
