const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, outdir] = process.argv;
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text()); });
  await p.addInitScript(() => {
    window.__patchDebug = (s, h) => { window.PS = s; window.PH = h;
      // jam bot: taps the right jack near the right moment, misses about one note in eight
      let n = 0;
      const tick = () => {
        if (s.phase === 'jam') {
          const st = h.songTime();
          for (const note of s.notes) {
            if (note.state !== 'pending' || note.botDone) continue;
            if (st >= note.t - 0.02) { note.botDone = true; if ((n++ % 8) === 7) continue;
              const c = s.cables.find(q => q.lane === note.lane); if (!c || c.popped) continue; const j = h.J[c.in]; Input.downs.push({ id: 99, x: j.x, y: j.y }); }
          }
          if (s.cables.some(c => c.popped) && !s.botPlug) { s.botPlug = true; setTimeout(() => { Input.pressed.add('Space'); s.botPlug = false; }, 1200); }
          const r = h.ROUNDS[s.round];
          if (r.sweep) { const beat = st / h.spb(); if (beat >= h.LEAD_IN + r.sweep[0] && beat < h.LEAD_IN + r.sweep[1]) { const tg = h.sweepTarget(beat); Input.keys.delete('ArrowUp'); Input.keys.delete('ArrowDown'); if (s.knob < tg - .04) Input.keys.add('ArrowUp'); else if (s.knob > tg + .04) Input.keys.add('ArrowDown'); } else { Input.keys.delete('ArrowUp'); Input.keys.delete('ArrowDown'); } }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
  });
  await p.goto('file://' + file);
  await p.waitForTimeout(1000);
  await p.mouse.click(480, 270); await p.waitForTimeout(300);
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  const S = 3; // canvas is 960x540 for a 320x180 screen
  const jackXY = async id => { const j = await p.evaluate(id => PH.J[id], id); return [j.x * S + 1, j.y * S + 1]; };
  const drag = async (a, bb) => { const [x0, y0] = await jackXY(a), [x1, y1] = await jackXY(bb); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move((x0 + x1) / 2, y0 + 60, { steps: 5 }); await p.mouse.move(x1, y1, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(150); };
  for (let round = 0; round < 3; round++) {
    while ((await p.evaluate(() => PS.phase)) !== 'patch') await p.waitForTimeout(100);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${outdir}/p${round}a-patch.png` });
    const cables = await p.evaluate(r => PH.ROUNDS[r].cables, round);
    if (round === 0) await drag('VCO.out', 'VCA.in'); // a wrong one first
    if (round === 1) { const [a, bb] = cables[1]; const [x0, y0] = await jackXY(a); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move(x0 + 40, y0 + 50, { steps: 4 }); await p.waitForTimeout(1300); await p.screenshot({ path: `${outdir}/p1h-hint.png` }); const [x1, y1] = await jackXY(bb); await p.mouse.move(x1, y1, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(150); }
    for (const [a, bb] of cables.slice().reverse()) { if (round === 1 && a === cables[1][0]) continue; await drag(a, bb); }
    await p.screenshot({ path: `${outdir}/p${round}b-patched.png` });
    while ((await p.evaluate(() => PS.phase)) !== 'jam') await p.waitForTimeout(100);
    const spb = await p.evaluate(() => PH.spb());
    const shotBeat = round === 1 ? 13.6 : round === 2 ? 22 : 12;
    while ((await p.evaluate(() => PH.songTime() / PH.spb())) < shotBeat) await p.waitForTimeout(50);
    await p.screenshot({ path: `${outdir}/p${round}c-jam.png` });
    while ((await p.evaluate(() => PS.phase)) === 'jam') await p.waitForTimeout(200);
    console.log('round', round + 1, JSON.stringify(await p.evaluate(() => ({ score: PS.score, perfect: PS.perfect, good: PS.good, miss: PS.miss, best: PS.best, groove: Math.round(PS.groove), wrong: PS.wrong, sweep: Math.round(PS.sweepScore), audio: !!Sound.ac }))));
  }
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${outdir}/p9-results.png` });
  console.log('scene', await p.evaluate(() => Shell.scene.constructor.name));
  await b.close();
})();
