const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [,, file, out, w, full] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w || 1100, height: 900 }, deviceScaleFactor: 1 });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + file);
  await p.waitForTimeout(800);
  await p.screenshot({ path: out, fullPage: full !== 'no' });
  await b.close();
})();
