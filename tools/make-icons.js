// Renders the home-screen icons from the game's own title art into static/.
//   ./build.sh && node tools/make-icons.js
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const path = require('node:path'), fs = require('node:fs');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html')); await p.waitForTimeout(1500);
  // the maskable one is cropped to a circle or squircle by the launcher, so its text sits inside the middle 80%
  for (const [file, size, mask] of [['icon-192', 192, false], ['icon-512', 512, false], ['icon-maskable-512', 512, true]]) {
    const data = await p.evaluate(([size, mask]) => {
      if (!titleArt.drawn) { drawTitleArt(titleArt.x); titleArt.drawn = true; }
      const S = 128, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      x.drawImage(titleArt.c, (W - S) / 2, 0, S, S, 0, 0, S, S);           // lavender, mountains, barn
      x.drawImage(titleArt.c, (W - S) / 2, H - (S - 100), S, S - 100, 0, 100, S, S - 100); // more lavender at the bottom
      if (mask) {
        TO(x, 'SEQUIM', S / 2, 38, '#ffffff', '#2a1250', '#8a4ad0', { size: 8, a: 'c' });
        TO(x, 'GAMES', S / 2, 50, '#ffd84a', '#2a1250', '#a03a8a', { size: 16, a: 'c' });
      } else {
        TO(x, 'SEQUIM', S / 2, 26, '#ffffff', '#2a1250', '#8a4ad0', { size: 16, a: 'c' });
        TO(x, 'GAMES', S / 2, 46, '#ffd84a', '#2a1250', '#a03a8a', { size: 24, a: 'c' });
      }
      const out = document.createElement('canvas'); out.width = out.height = size; const o = out.getContext('2d');
      o.imageSmoothingEnabled = false; o.drawImage(c, 0, 0, size, size);
      return out.toDataURL('image/png');
    }, [size, mask]);
    fs.writeFileSync(path.join(__dirname, '..', 'static', `${file}.png`), Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close(); console.log('wrote static/icon-192.png, icon-512.png, icon-maskable-512.png');
})();
