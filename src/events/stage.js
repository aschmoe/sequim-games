// ===== Opening Night: THE LAVENDER KING, an avant-garde tragedy in three acts, starring Misha =====
(() => {
  const MOODS = ['MENACING', 'JOYFUL', 'BORED', 'ROMANTIC', 'PANICKED', 'REGAL'];
  const STYLES = ['OPERATIC', 'WHISPERED', 'ROBOTIC', 'SHAKESPEAREAN', 'INTERPRETIVE'];
  // a related word earns 1 pip instead of 3
  const NEAR = { MENACING: ['REGAL'], REGAL: ['MENACING'], JOYFUL: ['ROMANTIC'], ROMANTIC: ['JOYFUL'], PANICKED: ['BORED'], BORED: ['PANICKED'],
    OPERATIC: ['SHAKESPEAREAN'], SHAKESPEAREAN: ['OPERATIC'], WHISPERED: ['INTERPRETIVE'], INTERPRETIVE: ['WHISPERED'], ROBOTIC: [] };
  const pips = (want, got) => got === want ? 3 : NEAR[want].includes(got) ? 1 : 0;
  const POSE_OF = { OPERATIC: 'wide', WHISPERED: 'mouth', ROBOTIC: 'stiff', SHAKESPEAREAN: 'heart', INTERPRETIVE: 'sky' };

  // the play. per beat: the cue, five actions (one per STYLE, in STYLES order) and six lines (one per MOOD, in MOODS order)
  const ACTS = [
    { name: 'THE STRANGER ARRIVES', bpm: 100, beats: [
      { cue: 'A STRANGER ARRIVES IN SEQUIM.',
        actions: ['FLING YOUR ARMS AT THE LAVENDER', 'SNIFF THE LAVENDER QUIETLY', 'SCAN THE FIELDS. BEEP.', 'KNEEL AND KISS THE SOIL', 'BECOME A LAVENDER STALK'],
        lines: ['SEQUIM. AT LAST. YOU ARE MINE.', 'WHAT A GLORIOUS PURPLE TOWN!', 'OH. LAVENDER. GREAT. NEAT.', 'SUCH FIELDS. SUCH FRAGRANCE.', 'WHY IS EVERYTHING PURPLE?!', 'I GRACE THIS TOWN WITH ME.'] },
      { cue: 'HE MEETS A BEARDED FARMER.',
        actions: ['SALUTE THE BEARD, LOUDLY', 'LEAN IN TO ADMIRE THE BEARD', 'SHAKE HANDS. EXACTLY 3 TIMES.', 'DOFF AN INVISIBLE HAT', 'BECOME THE BEARD'],
        lines: ['THAT BEARD. I WILL HAVE IT.', 'WHAT A MAGNIFICENT BEARD!', 'HI. YOU HAVE A FARM. COOL.', 'YOUR BEARD... LIKE SPUN COPPER.', 'SIR! YOUR BEARD IS ENORMOUS!', 'KNEEL, FARMER. I AM ROYALTY.'] },
      { cue: 'HE IS OFFERED SWEET WHITE WINE.',
        actions: ['RAISE THE GLASS TO THE RAFTERS', 'SIP IT LIKE A SECRET', 'DRINK IN 3 PRECISE MOTIONS', 'TOAST THE HEAVENS', 'BECOME THE WINE'],
        lines: ['POUR. OR FACE THE FOG.', 'SWEET WHITE WINE?! YES! YES!', 'SURE. WHATEVER. FILL IT UP.', 'WINE AS SWEET AS YOUR SMILE.', 'IS IT POISONED?! IS IT?!', 'ONLY THE FINEST FOR MY LIPS.'] },
    ] },
    { name: 'THE FEAST', bpm: 108, beats: [
      { cue: 'AT THE FEAST, THE WINE RUNS OUT.',
        actions: ['WAIL AT THE EMPTY BOTTLE', 'PEER INTO THE EMPTY BOTTLE', 'SHAKE BOTTLE. NO OUTPUT.', 'CLUTCH THE BOTTLE TO YOUR HEART', 'FLOW LIKE SPILLED WINE'],
        lines: ['WHO. DRANK. THE WINE.', 'MORE WINE! THE CELLAR! GO!', 'NO WINE. TYPICAL.', 'WITHOUT WINE, WHAT IS LOVE?', 'THE WINE IS GONE!! ALL OF IT!!', 'FETCH MY ROYAL RESERVE AT ONCE.'] },
      { cue: 'TWO DOGS LOOK VERY GUILTY.', dogs: true,
        actions: ['POINT AT THE DOGS, DRAMATICALLY', 'TIPTOE TOWARD THE DOGS', 'SCAN THE DOGS FOR WINE', 'INTERROGATE HANS, HAND ON HIP', 'BECOME A GUILTY DOG'],
        lines: ['HANS. LEXIE. EXPLAIN YOURSELVES.', "PUPPIES! WHO'S A GOOD THIEF?", 'THE DOGS DID IT. OBVIOUSLY.', 'AH, HANS. YOU HAVE WINE BREATH.', 'THE DOGS ARE DRUNK! HELP!', 'I SENTENCE YOU TO BELLY RUBS.'] },
      { cue: 'HE CLAIMS THE THRONE.',
        actions: ['CROWN YOURSELF, ARMS WIDE', 'SLIP ONTO THE THRONE QUIETLY', 'SIT. ADJUST. SIT AGAIN.', 'RAISE A TURNIP SCEPTER', 'BECOME THE THRONE'],
        lines: ['THE THRONE IS MINE. OBVIOUSLY.', "I'M THE KING! WHEEE!", "FINE. I'LL BE KING. I GUESS.", 'A KING NEEDS A QUEEN...', 'WAIT, KINGS HAVE TO DO TAXES?!', 'BEHOLD! THE LAVENDER KING!'] },
    ] },
    { name: 'THE FOG', bpm: 116, fog: true, beats: [
      { cue: 'THE FOG ROLLS IN. THE DOGS ARE LOST.',
        actions: ['SHAKE YOUR FIST AT THE SKY', 'CUP AN EAR TO THE FOG', 'VISIBILITY ZERO. HALT.', 'DRAW A SWORD UPON THE MIST', 'SWIRL WITH THE FOG'],
        lines: ['AT LAST. MY OLD FRIEND.', "IT'S LIKE A BIG DAMP HUG!", 'OH LOOK. FOG. AGAIN.', 'THE FOG CARESSES MY FACE.', 'HANS?! LEXIE?! ANYBODY?!', 'FOG! I COMMAND YOU TO PART!'] },
      { cue: 'THE DOGS RETURN WITH A BOTTLE.', dogs: true,
        actions: ['LEAP FOR JOY, ARMS FLUNG WIDE', 'KNEEL AND HUG THE DOGS', 'ACCEPT BOTTLE. THANK DOGS.', 'KNIGHT THEM WITH A BAGUETTE', 'WAG AN IMAGINARY TAIL'],
        lines: ['GIVE ME THE BOTTLE. SLOWLY.', 'GOOD DOGS! THE BEST DOGS!', 'OH. THEY FOUND WINE. NICE.', 'MY HEROES. MY FURRY HEROES.', 'IS THAT THE LAST BOTTLE?!', 'ARISE, SIR HANS AND DAME LEXIE.'] },
      { cue: 'HIS FINAL WORDS TO THE CROWD.',
        actions: ['TAKE THE BIGGEST BOW EVER', 'STEP TO THE EDGE. LEAN IN.', 'BOW. RESET. BOW. RESET.', 'HAND ON HEART, GAZE AFAR', 'MELT SLOWLY INTO THE FLOOR'],
        lines: ['REMEMBER ME. OR ELSE.', 'THANK YOU! GOODNIGHT, SEQUIM!', 'THE END. YOU CAN GO NOW.', 'I LOVE YOU ALL. EACH OF YOU.', 'WAIT, IS IT OVER? IS IT OVER?!', 'YOU MAY NOW APPLAUD. LOUDLY.'] },
    ] },
  ];
  // a beat's steps, in counts. choices end early: the play moves on at the next count after you pick
  const STEPS = [{ id: 'cue', counts: 2, label: 'CUE' }, { id: 'move', counts: 8, label: 'MOVE' }, { id: 'action', counts: 10, label: 'ACTION' }, { id: 'line', counts: 12, label: 'LINE' }, { id: 'bow', counts: 7, label: 'BOW' }];
  // stage directions are from the ACTOR's side: stage left is the audience's (and your) right
  const ZONES_U = [['RIGHT', .17], ['CENTER', .5], ['LEFT', .83]], ZONES_V = [['UPSTAGE', .15], ['', .5], ['DOWNSTAGE', .85]];
  const zoneName = (ui, vi) => { const u = ZONES_U[ui][0], v = ZONES_V[vi][0]; if (!v) return u === 'CENTER' ? 'CENTER STAGE' : 'STAGE ' + u; return u === 'CENTER' ? v + ' CENTER' : v + ' ' + u; };
  // layout: the prompt book on the left, the stage on the right. the floor is a trapezoid in perspective
  const COL_W = 118, CX = 220, FLOOR = { top: 100, bottom: 146 };
  const toScreen = (u, v) => { const half = 64 + v * 22, y = FLOOR.top + v * (FLOOR.bottom - FLOOR.top); return { x: CX + (u - .5) * 2 * half, y }; };
  const toFloor = (x, y) => { const v = clamp((y - FLOOR.top) / (FLOOR.bottom - FLOOR.top), 0, 1), half = 64 + v * 22; return { u: clamp((x - CX) / (2 * half) + .5, 0, 1), v }; };
  const SPEED = 70;
  const ROMAN = ['I', 'II', 'III'];

  // word-wrap for the prompt book, by measured pixel width of the small font
  const wrapCache = new Map();
  function wrap(text, maxW) {
    const key = text + '|' + maxW; if (wrapCache.has(key)) return wrapCache.get(key);
    measureCtx.font = '8px "Silkscreen", monospace';
    const out = []; let cur = '';
    for (const w of text.split(' ')) { const t = cur ? cur + ' ' + w : w; if (measureCtx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
    if (cur) out.push(cur); wrapCache.set(key, out); return out;
  }

  function create(api) {
    let seed = (Date.now() % 100000) + 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pick = a => a[Math.floor(rand() * a.length)];
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const poseImg = {}; for (const k of Object.values(POSE_OF)) poseImg[k] = sprite(mishaPose(k));
    const st0 = toScreen(.5, .55);
    const s = {
      act: -1, beat: -1, phase: 'intro', t: 0, clock: 0, score: 0, applause: 50, curtain: 1,
      m: { x: st0.x, y: st0.y }, vel: { x: 0, y: 0 }, dest: null, pose: null, fx: [], flying: [], splats: [], splat: 0,
      log: [], scroll: 0, optRects: [], tally: { mark: 0, action: 0, line: 0, roses: 0, tomatoes: 0, quick: 0 },
    };
    let lastCount = -1, bus = null;
    const fx = (text, x, y, col, t = 1.1) => s.fx.push({ text, x, y, col, t, max: t });
    const A = () => ACTS[s.act], B = () => A()?.beats[s.beat];
    const countLen = () => 60 / A().bpm;
    const step = () => STEPS[s.stepIdx];
    const cheer = big => { Sound.noise(big ? 1.3 : .7, { vol: big ? .22 : .12, freq: 2600, type: 'bandpass' }); for (let i = 0; i < (big ? 12 : 5); i++) Sound.noise(.03, { vol: .1, freq: 3000, type: 'bandpass', delay: rand() * (big ? 1.1 : .6) }); };
    const boo = () => { Sound.tone(110, .9, { type: 'sawtooth', vol: .1, slide: -40 }); Sound.tone(123, .9, { type: 'sawtooth', vol: .08, slide: -50, delay: .1 }); };

    function startAct(i) { s.act = i; s.beat = -1; s.phase = 'actcard'; s.t = 0; s.log.push({ kind: 'act', text: 'ACT ' + ROMAN[i] + ': ' + ACTS[i].name }); Sound.jingle([392, 523, 659], { step: .12, vol: .1 }); }
    function startWheels() { s.phase = 'wheels'; s.t = 0; s.reels = [{ list: MOODS, pos: rand() * 6, speed: 9, stop: null }, { list: STYLES, pos: rand() * 5, speed: 11, stop: null }]; s.reelIdx = 0; }
    function stopReel() { const r = s.reels[s.reelIdx]; if (!r || r.stop !== null) return; r.stop = Math.ceil(r.pos) + 1; Sound.tone(880, .06); s.reelIdx++; }
    const reelWord = r => r.list[((r.stop % r.list.length) + r.list.length) % r.list.length];

    function startBeat(i) {
      s.beat = i; s.phase = 'beat'; s.bt = 0; lastCount = -1; s.pose = null; s.bubble = null;
      if (!bus) bus = Sound.bus();
      const zu = Math.floor(rand() * 3), zv = Math.floor(rand() * 3);
      s.mark = toScreen(clamp(ZONES_U[zu][1] + (rand() - .5) * .16, .05, .95), clamp(ZONES_V[zv][1] + (rand() - .5) * .16, .05, .95)); s.zone = zoneName(zu, zv);
      // options: Act I always offers the best fit; later acts sometimes make you settle for close
      const { mood, style } = s.vibe;
      const three = (list, want) => {
        const strict = s.act === 0 || rand() < .6, best = strict ? want : pick(NEAR[want].length ? NEAR[want] : list.filter(x => x !== want));
        const o = [best]; for (const x of shuffle(list.filter(x => x !== best && x !== want))) if (o.length < 3) o.push(x); return shuffle(o);
      };
      s.actionOpts = three(STYLES, style); s.lineOpts = three(MOODS, mood);
      s.stepIdx = -1; nextStep(0);
    }
    function nextStep(atCount) {
      s.stepIdx++; s.stepStart = atCount; s.chosen = -1; s.commitAt = null; s.optRects = [];
      const id = step()?.id;
      if (id === 'cue') { s.log.push({ kind: 'cue', text: 'BEAT ' + (s.beat + 1) + '. ' + B().cue }); }
      if (id === 'bow') closeLineToCrowd();
    }
    function endStep(count) {
      const id = step().id;
      if (id === 'move') closeMove();
      if (id === 'action') closeAction();
      if (id === 'line') closeLine();
      if (id === 'bow') s.log.push({ kind: 'bow', text: 'ROSES ' + s.beatRoses + '   TOMATOES ' + s.beatToms });
      if (s.stepIdx + 1 < STEPS.length) nextStep(count);
      else if (s.beat + 1 < A().beats.length) startBeat(s.beat + 1);
      else { s.phase = 'actend'; s.t = 0; Sound.jingle([523, 659, 784, 1047], { step: .1, vol: .1 }); cheer(true); }
    }
    function choose(i) {
      if (s.chosen >= 0) return; s.chosen = i; const count = Math.floor(s.bt / countLen());
      s.commitAt = count + 1; const left = s.stepStart + step().counts - s.commitAt;
      if (left > 0) { const bonus = left * 10; s.score += bonus; s.tally.quick += bonus; }
      Sound.tone(880, .06); Sound.tone(1320, .08, { delay: .06, vol: .08 });
    }
    function closeMove() {
      const d = Math.hypot(s.m.x - s.mark.x, s.m.y - s.mark.y), p = d < 8 ? 3 : d < 17 ? 2 : d < 30 ? 1 : 0;
      s.score += p * 100; s.tally.mark += p; s.applause = clamp(s.applause + (p - 1.5) * 3, 0, 100); s.dest = null; s.markShown = 1.6;
      const note = p === 3 ? 'ON YOUR MARK' : 'OFF BY ' + Math.max(1, Math.round(d / 5)) + ' FT';
      s.log.push({ kind: 'move', text: s.zone + ': ' + note, pips: p });
      fx(p === 3 ? 'ON YOUR MARK!' : note, s.mark.x, s.mark.y - 30, p >= 2 ? '#3cc060' : p === 1 ? '#ffd84a' : '#ff5050', 1.4);
      Sound.tone(p >= 2 ? 1047 : 330, .12, { vol: .1 });
    }
    function closeAction() {
      const style = s.chosen >= 0 ? s.actionOpts[s.chosen] : null, p = style ? pips(s.vibe.style, style) : 0;
      s.pose = style ? POSE_OF[style] : 'stiff'; s.actionPips = p; s.score += p * 120; s.tally.action += p;
      s.log.push({ kind: 'action', text: style ? B().actions[STYLES.indexOf(style)] : '(FROZE.)', pips: p });
    }
    function closeLine() {
      const mood = s.chosen >= 0 ? s.lineOpts[s.chosen] : null, p = mood ? pips(s.vibe.mood, mood) : 0;
      s.linePips = p; s.score += p * 120; s.tally.line += p;
      const text = mood ? B().lines[MOODS.indexOf(mood)] : 'LINE?! ...UM...';
      s.log.push({ kind: 'line', text: '"' + text + '"', pips: p });
      s.bubble = { text, t: countLen() * 6 };
    }
    function closeLineToCrowd() {
      const q = s.actionPips + s.linePips; s.beatRoses = 0; s.beatToms = 0;
      s.applause = clamp(s.applause + (q - 3) * 4, 0, 100);
      if (q >= 5) cheer(true); else if (q >= 3) cheer(false); else boo();
      const roses = q >= 5 ? 3 : q >= 3 ? 2 : q >= 2 ? 1 : 0, toms = q >= 5 ? 0 : q >= 3 ? 1 : 3;
      shuffle([...Array(roses).fill('rose'), ...Array(toms).fill('tomato')]).forEach((kind, k) =>
        s.flying.push({ kind, delay: .2 + k * .55, dur: kind === 'rose' ? 2 : .85, t: 0, x0: COL_W + 16 + rand() * 180, y0: 182, land: null }));
    }
    // roses land a few steps away from you; tomatoes are aimed at where you are heading
    function aimFor(f) {
      if (f.kind === 'tomato') { const p = toFloor(s.m.x + s.vel.x * f.dur * .8, s.m.y + s.vel.y * f.dur * .8); return toScreen(p.u, p.v); }
      const a = rand() * Math.PI * 2, r = 20 + rand() * 22, p = toFloor(s.m.x + Math.cos(a) * r, s.m.y + Math.sin(a) * r * .6); return toScreen(p.u, p.v);
    }
    const flyPos = f => { const p = clamp(f.t / f.dur, 0, 1); return { x: f.x0 + (f.land.x - f.x0) * p, y: f.y0 + (f.land.y - 6 - f.y0) * p - Math.sin(p * Math.PI) * (f.kind === 'rose' ? 80 : 40), p }; };

    function moveMisha(dt) {
      for (const p of Input.ptrs.values()) { if (p.ui || p.x < COL_W) continue; if (p.y > FLOOR.top - 16) { const f = toFloor(p.x, p.y + 6); s.dest = toScreen(f.u, f.v); } break; }
      let kx = 0, ky = 0; if (Input.key('ArrowLeft', 'KeyA')) kx--; if (Input.key('ArrowRight', 'KeyD')) kx++; if (Input.key('ArrowUp', 'KeyW')) ky--; if (Input.key('ArrowDown', 'KeyS')) ky++;
      let tx = s.m.x, ty = s.m.y;
      if (kx || ky) { s.dest = null; const n = Math.hypot(kx, ky); tx += kx / n * SPEED * dt; ty += ky / n * SPEED * .6 * dt; }
      else if (s.dest) { const dx = s.dest.x - s.m.x, dy = s.dest.y - s.m.y, d = Math.hypot(dx, dy); if (d < 1) s.dest = null; else { const k = Math.min(1, SPEED * dt / d); tx += dx * k; ty += dy * k; } }
      const f = toFloor(tx, ty), p = toScreen(f.u, f.v);
      s.vel.x = (p.x - s.m.x) / Math.max(dt, .001); s.vel.y = (p.y - s.m.y) / Math.max(dt, .001);
      s.walking = Math.hypot(p.x - s.m.x, p.y - s.m.y) > .2; s.m.x = p.x; s.m.y = p.y;
    }

    function update(dt) {
      s.clock += dt; s.t += dt;
      s.fx = s.fx.filter(f => (f.t -= dt) > 0); s.splats = s.splats.filter(p => (p.t -= dt) > 0);
      if (s.splat > 0) s.splat -= dt; if (s.markShown > 0) s.markShown -= dt;
      if (s.bubble) { s.bubble.t -= dt; if (s.bubble.t <= 0) s.bubble = null; }
      if (s.phase === 'intro') { if (s.t > .4) startAct(0); return; }
      if (s.phase === 'actcard') { s.curtain = Math.max(0, 1 - Math.max(0, s.t - 1.4) / 1.1); if (s.t > 2.8) startWheels(); return; }
      if (s.phase === 'wheels') {
        for (const r of s.reels) { if (r.stop === null) r.pos += r.speed * dt; else r.pos = Math.min(r.stop, r.pos + Math.max(.6, (r.stop - r.pos) * 6) * dt); }
        if (Math.floor(s.clock * 20) !== Math.floor((s.clock - dt) * 20) && s.reelIdx < 2) Sound.noise(.02, { vol: .07, freq: 1500, type: 'bandpass' });
        if (Input.taps.length || Input.keyPressed('Space', 'Enter')) stopReel();
        if (s.reelIdx === 0 && s.t > 3) stopReel(); if (s.reelIdx === 1 && s.t > 4.5) stopReel();
        if (s.reels.every(r => r.stop !== null && r.pos >= r.stop)) {
          if (!s.settled) { s.settled = s.t; s.vibe = { mood: reelWord(s.reels[0]), style: reelWord(s.reels[1]) }; s.log.push({ kind: 'vibe', text: 'VIBE: ' + s.vibe.mood + ' + ' + s.vibe.style }); Sound.jingle([392, 523, 659, 784], { step: .08, vol: .1 }); }
          if (s.t - s.settled > 1.6) { s.settled = 0; startBeat(0); }
        }
        return;
      }
      if (s.phase === 'beat') {
        s.bt += dt; const count = Math.floor(s.bt / countLen()), id = step().id;
        if (count !== lastCount) {
          lastCount = count;
          const end = s.commitAt !== null ? s.commitAt : s.stepStart + step().counts;
          if (count >= end && !(id === 'bow' && s.flying.some(f => !f.done))) { endStep(count); if (s.phase !== 'beat') return; }
          // the count you can hear: a pluck each count, brighter in the last two counts of a choice
          const left = s.stepStart + step().counts - count, urgent = left <= 2 && s.chosen < 0 && (step().id === 'action' || step().id === 'line' || step().id === 'move');
          if (count === s.stepStart) Sound.tone(1047, .25, { type: 'sine', vol: .07, out: bus });
          Sound.synth(midi([57, 60, 64, 62][count % 4] + (urgent ? 12 : 0)), .2, { type: 'triangle', cutoff: 1800, env: 800, vol: urgent ? .09 : .05, out: bus });
        }
        const cur = step().id;
        if (cur === 'move' || cur === 'bow') moveMisha(dt); else { s.walking = false; s.vel.x = s.vel.y = 0; }
        if ((cur === 'action' || cur === 'line') && s.chosen < 0) {
          for (const r of s.optRects) if (Input.tapIn(r.x, r.y, r.w, r.h)) choose(r.i);
          ['Digit1', 'Digit2', 'Digit3'].forEach((k, i) => { if (Input.keyPressed(k, 'Key' + 'ABC'[i])) choose(i); });
        }
        // produce in flight
        for (const f of s.flying) {
          if (f.done) continue; if (f.delay > 0) { f.delay -= dt; if (f.delay <= 0) f.land = aimFor(f); continue; }
          f.t += dt;
          if (f.t >= f.dur) { f.done = true; const d = Math.hypot(s.m.x - f.land.x, (s.m.y - f.land.y) * 1.6);
            if (f.kind === 'rose') { if (d < 16) { s.beatRoses++; s.tally.roses++; s.score += 100; s.applause = clamp(s.applause + 2, 0, 100); fx('CAUGHT!', f.land.x, f.land.y - 28, '#ff8ab0', .9); Sound.jingle([1047, 1319], { step: .05, vol: .08 }); }
              else fx('MISSED', f.land.x, f.land.y - 22, '#9a9ab0', .7); }
            else if (d < 11) { s.beatToms++; s.tally.tomatoes++; s.score = Math.max(0, s.score - 100); s.applause = clamp(s.applause - 5, 0, 100); s.splat = 2; fx('SPLAT!', s.m.x, s.m.y - 32, '#ff5050', .9); Sound.noise(.2, { vol: .3, freq: 500 }); }
            else { s.splats.push({ x: f.land.x, y: f.land.y, t: 3 }); Sound.noise(.08, { vol: .12, freq: 400 }); fx('DODGED!', f.land.x, f.land.y - 24, '#ffd84a', .7); } }
        }
        if (cur !== 'bow' && s.flying.length && s.flying.every(f => f.done)) s.flying = [];
        return;
      }
      if (s.phase === 'actend') { s.curtain = Math.min(1, s.t / 1.1); if (s.t > 2.6) { s.flying = []; if (s.act + 1 < ACTS.length) startAct(s.act + 1); else { s.phase = 'curtaincall'; s.t = 0; } } return; }
      if (s.phase === 'curtaincall' && s.t > 2.6) {
        s.score += Math.round(s.applause * 30); const a = s.applause, beats = ACTS.reduce((n, x) => n + x.beats.length, 0);
        api.finish({ score: s.score, headline: a >= 80 ? 'A TRIUMPH!' : a >= 55 ? 'BRAVE. VERY BRAVE.' : a >= 30 ? 'THE FOG WAS NICE.' : 'BRING TOMATOES.',
          stats: [['MARKS', s.tally.mark + ' / ' + beats * 3 + ' PIPS'], ['ACTIONS', s.tally.action + ' / ' + beats * 3 + ' PIPS'], ['LINES', s.tally.line + ' / ' + beats * 3 + ' PIPS'], ['ROSES CAUGHT', String(s.tally.roses)], ['TOMATOES TAKEN', String(s.tally.tomatoes)]] });
        s.phase = 'done';
      }
    }

    // ---- drawing: the stage (right) ----
    function drawStage(c) {
      R(c, COL_W, 0, W - COL_W, H, '#0a0810');
      R(c, COL_W + 10, 12, W - COL_W - 20, 92, '#1c2450'); for (const [x, y] of [[150, 30], [190, 22], [250, 38], [280, 26], [170, 52], [292, 60]]) R(c, x, y, 1, 1, '#ffffff');
      disc(c, 286, 40, 8, '#f4f0d0'); disc(c, 290, 37, 6, '#1c2450');
      c.fillStyle = '#2a3468'; c.beginPath(); c.moveTo(COL_W + 10, 100); for (let x = COL_W + 10; x <= W - 10; x += 16) c.lineTo(x, 66 + ((x * 37) % 24)); c.lineTo(W - 10, 102); c.lineTo(COL_W + 10, 102); c.fill();
      c.fillStyle = '#e8ecff'; for (let x = COL_W + 26; x <= W - 26; x += 32) { const y = 66 + ((x * 37) % 24); c.beginPath(); c.moveTo(x - 5, y + 5); c.lineTo(x, y); c.lineTo(x + 5, y + 5); c.fill(); }
      for (let x = COL_W + 10; x < W - 10; x += 3) R(c, x, 96 + (x % 2), 2, 4, x % 6 ? '#8a5ac8' : '#9a66d8');
      const tl = toScreen(0, 0), tr = toScreen(1, 0), bl = toScreen(0, 1), br = toScreen(1, 1);
      c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(tl.x - 4, tl.y - 4); c.lineTo(tr.x + 4, tr.y - 4); c.lineTo(br.x + 8, br.y + 4); c.lineTo(bl.x - 8, bl.y + 4); c.closePath(); c.fill();
      for (let i = 1; i < 10; i++) { const a = toScreen(i / 10, 0), b = toScreen(i / 10, 1); line(c, Math.round(a.x), Math.round(a.y - 4), Math.round(b.x), Math.round(b.y + 4), '#7a4c22'); }
      R(c, bl.x - 8, br.y + 4, br.x - bl.x + 16, 2, '#e0b040');
      // spotlight on Misha, tinted by how warm he is while moving to the mark
      const moving = s.phase === 'beat' && step()?.id === 'move';
      const warm = moving ? clamp(1 - Math.hypot(s.m.x - s.mark.x, s.m.y - s.mark.y) / 90, 0, 1) : 1;
      c.globalAlpha = .2; c.fillStyle = warm > .85 ? '#fff0a8' : warm > .55 ? '#ffd0a0' : warm > .3 ? '#c8d0ff' : '#8aa0ff';
      c.beginPath(); c.moveTo(s.m.x - 7, 0); c.lineTo(s.m.x + 7, 0); c.lineTo(s.m.x + 20, s.m.y + 3); c.lineTo(s.m.x - 20, s.m.y + 3); c.closePath(); c.fill();
      c.globalAlpha = .28; c.beginPath(); c.ellipse(s.m.x, s.m.y, 18, 5, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      if (s.markShown > 0 && s.mark) { const mk = s.mark; for (let i = -3; i <= 3; i++) { R(c, mk.x + i, mk.y + i * .6, 2, 1, '#ffd84a'); R(c, mk.x + i, mk.y - i * .6, 2, 1, '#ffd84a'); }
        for (let k = 0; k <= 10; k += 2) R(c, Math.round(s.m.x + (mk.x - s.m.x) * k / 10), Math.round(s.m.y + (mk.y - s.m.y) * k / 10), 1, 1, '#ffffff'); }
      for (const p of s.splats) { disc(c, p.x, p.y, 3, '#b02420'); R(c, p.x - 5, p.y, 3, 1, '#b02420'); R(c, p.x + 3, p.y - 1, 2, 1, '#b02420'); }
      // where things will land: a pink ring for a rose, a growing shadow for a tomato
      for (const f of s.flying) if (!f.done && f.land) {
        const p = clamp(f.t / f.dur, 0, 1);
        if (f.kind === 'rose') { const rr = 7 + Math.round(Math.sin(s.clock * 10) * 1.5); c.fillStyle = '#ff6aa8'; for (let k = 0; k < 28; k++) { const t = k / 28 * Math.PI * 2; c.fillRect(Math.round(f.land.x + Math.cos(t) * rr * 1.6), Math.round(f.land.y + Math.sin(t) * rr * .6), 1, 1); } }
        c.globalAlpha = .25 + p * .4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(f.land.x, f.land.y, 3 + p * 5, 1.5 + p * 2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      }
      if (B()?.dogs && s.phase === 'beat') { const d1 = toScreen(.08, .02), d2 = toScreen(.92, .02); const h = spr('dogHans'), l = spr('dogLexie'); blit(c, h, d1.x - 10, d1.y - h.height); blit(c, l, d2.x - 8, d2.y - l.height, 1, true); }
      const posed = s.pose && s.phase === 'beat' && (step()?.id === 'line' || step()?.id === 'bow');
      const img = posed ? poseImg[s.pose] : spr('mishaHamlet'), bob = s.walking && Math.floor(s.clock * 8) % 2 ? 1 : 0;
      blit(c, img, Math.round(s.m.x - img.width / 2), Math.round(s.m.y - img.height + 1 - bob));
      if (s.splat > 0) { disc(c, s.m.x, s.m.y - 14, 4, '#d8302a'); R(c, s.m.x - 3, s.m.y - 10, 2, 4, '#d8302a'); }
      if (moving) { const d = Math.hypot(s.m.x - s.mark.x, s.m.y - s.mark.y), w2 = clamp(1 - d / 90, 0, 1), hc = w2 > .7 ? '#ff5030' : w2 > .45 ? '#ffb040' : w2 > .2 ? '#80b0ff' : '#4060c0';
        box(c, s.m.x - 13, s.m.y + 3, 26, 4, '#0a0810', '#ffffff'); R(c, s.m.x - 12, s.m.y + 4, Math.round(24 * w2), 2, hc);
        TO(c, d < 8 ? 'ON IT!' : w2 > .7 ? 'HOT' : w2 > .45 ? 'WARM' : w2 > .2 ? 'COOL' : 'COLD', s.m.x, s.m.y - 32, hc, '#0e0c14', null, { f: 's', a: 'c' }); }
      if (A()?.fog && s.phase === 'beat') { c.globalAlpha = .18; c.fillStyle = '#e8ecff'; for (let i = 0; i < 5; i++) { const fx2 = COL_W + ((s.clock * 8 + i * 50) % 240) - 20; c.beginPath(); c.ellipse(fx2, 92 + (i % 3) * 18, 34, 6, 0, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; }
      const cw = 10 + Math.round(s.curtain * 92);
      for (let x = COL_W; x < COL_W + cw; x += 4) { R(c, x, 0, 2, 152, '#c02a2a'); R(c, x + 2, 0, 2, 152, '#8a1a1a'); }
      for (let x = W - cw; x < W; x += 4) { R(c, x, 0, 2, 152, '#c02a2a'); R(c, x + 2, 0, 2, 152, '#8a1a1a'); }
      R(c, COL_W, 0, W - COL_W, 9, '#a01e22'); for (let x = COL_W; x < W; x += 14) disc(c, x + 7, 9, 4, '#a01e22'); R(c, COL_W, 0, W - COL_W, 2, '#e0b040');
      R(c, COL_W, 152, W - COL_W, 28, '#06050a');
      for (let i = 0; i < 9; i++) { const hx = COL_W + 10 + i * 23 + (i % 2) * 5, hy = 164 + (i % 3) * 3; if (hx > 172 && hx < 262) continue; disc(c, hx, hy, 7, '#1a1828'); disc(c, hx, hy, 6, '#0e0c18'); R(c, hx - 10, hy + 5, 20, 20, '#0e0c18'); }
      disc(c, 190, 166, 8, '#0e0c14'); disc(c, 190, 166, 7, '#e2b08c'); R(c, 186, 162, 3, 2, '#ffe2cc'); R(c, 180, 172, 20, 10, '#23232e');
      disc(c, 236, 170, 6, '#0e0c14'); disc(c, 236, 170, 5, '#6a3a22'); R(c, 230, 175, 12, 6, '#a04cd0');
      R(c, 237, 160, 2, 8, '#8a6236'); box(c, 194, 151, 88, 10, '#ffffff', '#0e0c14'); T(c, 'GO UNCLE MISHA!', 238, 152, '#c0323a', { f: 's', a: 'c' });
      if (s.bubble) { const w = Math.min(196, s.bubble.text.length * 6 + 10), bx = clamp(s.m.x - w / 2, COL_W + 2, W - w - 2), by = s.m.y - 40;
        box(c, bx, by, w, 13, '#ffffff', '#0e0c14'); R(c, s.m.x - 1, by + 13, 3, 3, '#ffffff'); T(c, s.bubble.text, bx + w / 2, by + 3, '#0e0c14', { f: 's', a: 'c' }); }
      for (const f of s.flying) {
        if (f.done || !f.land) continue; const p = flyPos(f);
        if (f.kind === 'tomato') { disc(c, p.x, p.y, 4, '#e0302a'); R(c, p.x - 1, p.y - 6, 3, 2, '#3cc060'); R(c, p.x - 2, p.y - 2, 1, 1, '#ff9a8a'); }
        else { disc(c, p.x, p.y, 3, '#e8306a'); R(c, p.x - 1, p.y - 1, 2, 2, '#ff8ab0'); line(c, Math.round(p.x), Math.round(p.y + 3), Math.round(p.x + 2), Math.round(p.y + 10), '#3cc060'); }
      }
    }

    // ---- drawing: the prompt book (left), a script that rolls up as you go ----
    const INNER = COL_W - 10, LH = 8;
    function pipsAt(c, x, y, n) { for (let i = 0; i < 3; i++) disc(c, x + i * 6, y, 2, i < n ? '#ffd84a' : '#3a3a4a'); }
    function entryHeight(e) { if (e.kind === 'act') return 14; return wrap(e.text, INNER - (e.pips !== undefined ? 0 : 0)).length * LH + (e.pips !== undefined ? LH : 0) + 4; }
    function drawEntry(c, e, y) {
      if (e.kind === 'act') { R(c, 2, y + 2, COL_W - 4, 10, '#3a1a2a'); T(c, e.text.length > 20 ? 'ACT ' + e.text.split(':')[0].slice(4) : e.text, COL_W / 2, y + 3, '#e0b040', { f: 's', a: 'c' }); return; }
      const col = { cue: '#ffd84a', vibe: '#ff8ab0', move: '#c8c8d8', action: '#ffffff', line: '#ffffff', bow: '#9a9ab0' }[e.kind];
      const icon = { move: '>', action: '*', line: '"', bow: '+' }[e.kind];
      const ls = wrap(e.text, INNER);
      ls.forEach((l, i) => T(c, l, 6, y + 2 + i * LH, col, { f: 's' }));
      if (e.pips !== undefined) { const py = y + 2 + ls.length * LH + 3; T(c, { move: 'MARK', action: 'ACTION', line: 'LINE' }[e.kind], 6, py - 3, '#6a6a8a', { f: 's' }); pipsAt(c, 52, py, e.pips); }
    }
    function currentBlock() {
      // returns { h, draw(c,y) } for the step in progress
      const id = step().id, count = s.bt / countLen(), total = step().counts, left = clamp((s.stepStart + total - count) / total, 0, 1);
      const bar = (c, y) => { R(c, 6, y, INNER - 2, 3, '#2a2a3a'); R(c, 6, y, Math.round((INNER - 2) * left), 3, left < .25 ? '#ff5050' : '#ffd84a'); };
      if (id === 'cue') return { h: 14, draw: (c, y) => { T(c, 'PLACES...', 6, y + 3, '#9a9ab0', { f: 's' }); } };
      if (id === 'move') { const ls = wrap('GO ' + s.zone + '!', INNER); return { h: ls.length * 10 + 26, draw: (c, y) => {
        ls.forEach((l, i) => TO(c, l, 6, y + 3 + i * 10, '#ffd84a', '#0e0c14', null, { f: 's' }));
        T(c, s.act === 0 && s.beat === 0 ? 'STAGE LEFT = YOUR RIGHT' : (KEYBOARD ? 'ARROWS OR CLICK' : 'TOUCH TO WALK'), 6, y + 5 + ls.length * 10, '#9a9ab0', { f: 's' }); bar(c, y + 16 + ls.length * 10); } }; }
      if (id === 'action' || id === 'line') {
        const opts = id === 'action' ? s.actionOpts.map(st => B().actions[STYLES.indexOf(st)]) : s.lineOpts.map(m => '"' + B().lines[MOODS.indexOf(m)] + '"');
        const wrapped = opts.map(o => wrap(o, INNER - 12)); let h = 12; for (const w of wrapped) h += w.length * LH + 5; h += 8;
        return { h, draw: (c, y) => {
          T(c, id === 'action' ? 'PICK AN ACTION' : 'SAY YOUR LINE', 6, y + 2, '#ffd84a', { f: 's' });
          let yy = y + 12; s.optRects = [];
          wrapped.forEach((ls, i) => { const hh = ls.length * LH + 3, sel = s.chosen === i, dim = s.chosen >= 0 && !sel;
            box(c, 4, yy, INNER + 2, hh, sel ? '#3a2a6a' : '#0e0c22', sel ? '#ffd84a' : '#4a4a6a');
            T(c, 'ABC'[i], 7, yy + 2, sel ? '#ffd84a' : '#6a6a8a', { f: 's' }); ls.forEach((l, k) => T(c, l, 15, yy + 2 + k * LH, dim ? '#5a5a7a' : sel ? '#ffd84a' : '#ffffff', { f: 's' }));
            s.optRects.push({ x: 4, y: yy, w: INNER + 2, h: hh, i }); yy += hh + 2; });
          if (s.chosen < 0) bar(c, yy + 2); else T(c, 'ON CUE!', 6, yy, '#3cc060', { f: 's' });
        } };
      }
      return { h: 20, draw: (c, y) => { T(c, s.flying.some(f => f.kind === 'rose') ? 'CATCH THE ROSES!' : 'TAKE A BOW', 6, y + 2, '#ff8ab0', { f: 's' }); T(c, s.flying.some(f => f.kind === 'tomato') ? 'DODGE THE TOMATOES!' : ' ', 6, y + 11, '#ff5050', { f: 's' }); } };
    }
    function drawBook(c, dt) {
      R(c, 0, 0, COL_W, H, '#120e20'); R(c, COL_W - 1, 0, 1, H, '#3a2a5a');
      // header: act, score, applause, vibe
      R(c, 0, 0, COL_W, 30, '#1c1634');
      T(c, s.act >= 0 ? 'ACT ' + ROMAN[s.act] : 'OPENING NIGHT', 4, 2, '#e0b040', { f: 's' }); T(c, fmt(s.score), COL_W - 4, 2, '#ffffff', { f: 's', a: 'r' });
      T(c, s.vibe ? s.vibe.mood : '', 4, 11, '#ff8ab0', { f: 's' }); T(c, s.vibe ? s.vibe.style : '', 4, 19, '#4fd6ff', { f: 's' });
      box(c, COL_W - 34, 13, 30, 5, '#0a0810', '#ffffff'); R(c, COL_W - 33, 14, Math.round(28 * s.applause / 100), 3, s.applause > 60 ? '#3cc060' : s.applause > 30 ? '#ffd84a' : '#ff5050');
      T(c, 'CLAP', COL_W - 19, 20, '#6a6a8a', { f: 's', a: 'c' });
      // the script: history, then the step in progress, then what is still to come
      c.save(); c.beginPath(); c.rect(0, 31, COL_W - 1, H - 31); c.clip();
      const heights = s.log.map(entryHeight); let total = heights.reduce((a, b) => a + b, 0);
      const cur = s.phase === 'beat' ? currentBlock() : null;
      const anchor = cur ? clamp(H - 4 - cur.h, 36, 96) : 96; // where the step in progress sits
      const target = Math.max(0, total - (anchor - 34));
      s.scroll += (target - s.scroll) * Math.min(1, (dt || .016) * 8);
      let y = 34 - s.scroll;
      s.log.forEach((e, i) => { if (y + heights[i] > 28 && y < H) drawEntry(c, e, y); y += heights[i]; });
      if (cur) {
        R(c, 2, y, COL_W - 4, cur.h, '#221a40'); R(c, 2, y, 2, cur.h, '#ffd84a'); cur.draw(c, y); y += cur.h + 2;
        for (let k = s.stepIdx + 1; k < STEPS.length; k++) { T(c, STEPS[k].label, 6, y + 2, '#4a4a6a', { f: 's' }); y += 10; }
      }
      c.restore();
    }

    let lastDraw = performance.now();
    function draw(c) {
      const now = performance.now(), dt = Math.min(.05, (now - lastDraw) / 1000); lastDraw = now;
      drawStage(c); drawBook(c, dt);
      if (s.phase === 'actcard' && s.t < 2.4) { box(c, 70, 50, 180, 42, '#0a0810', '#e0b040', 2); TO(c, 'ACT ' + ROMAN[s.act], 160, 57, '#e0b040', '#0e0c14', null, { a: 'c' }); T(c, A().name, 160, 74, '#ffffff', { f: 's', a: 'c' });
        if (s.act === 0) TO(c, 'THE LAVENDER KING: A TRAGEDY', 160, 36, '#ffd84a', '#0e0c14', null, { f: 's', a: 'c' }); }
      if (s.phase === 'wheels') {
        const r0 = s.reels;
        box(c, 50, 40, 220, 56, '#120e22', '#ffffff');
        const drawReel = (r, x, label, active) => { box(c, x, 56, 98, 26, '#0a0810', active ? '#ffd84a' : '#5a5a7a'); T(c, label, x + 49, 46, '#9a9ab0', { f: 's', a: 'c' });
          if (active) { T(c, '>', x + 6, 65, '#ffd84a', { f: 's' }); T(c, '<', x + 88, 65, '#ffd84a', { f: 's' }); }
          c.save(); c.beginPath(); c.rect(x + 2, 63, 94, 12); c.clip(); const base = Math.floor(r.pos), frac = r.pos - base, n = r.list.length;
          for (let k = -1; k <= 2; k++) { const idx = ((base + k) % n + n) % n; T(c, r.list[idx], x + 49, 66 + (k - frac) * 12, r.stop !== null && r.pos >= r.stop && k === 0 ? '#ffd84a' : '#ffffff', { f: 's', a: 'c' }); } c.restore(); };
        drawReel(r0[0], 56, 'ACT ' + ROMAN[s.act] + ' MOOD', s.reelIdx === 0); drawReel(r0[1], 166, 'ACT ' + ROMAN[s.act] + ' STYLE', s.reelIdx === 1);
        T(c, s.reelIdx < 2 ? (KEYBOARD ? 'PRESS SPACE TO SET THE VIBE' : 'TAP TO SET THE VIBE') : 'THE VIBE FOR THIS ACT!', 160, 86, '#ffd84a', { f: 's', a: 'c' });
      }
      if (s.phase === 'actend' && s.t > .8) TO(c, 'END OF ACT ' + ROMAN[s.act], 220, 64, '#e0b040', '#0e0c14', null, { a: 'c' });
      if (s.phase === 'curtaincall' || s.phase === 'done') TO(c, 'CURTAIN CALL', 220, 60, '#ffd84a', '#0e0c14', '#a03a8a', { a: 'c' });
      for (const f of s.fx) TO(c, f.text, f.x, f.y - (f.max - f.t) * 12, f.col, '#0e0c14', null, { f: 's', a: 'c' });
    }
    if (window.__stageDebug) window.__stageDebug(s, { MOODS, STYLES, pips, step, toScreen, flyPos, ACTS });
    return { update, draw, destroy() { try { bus?.disconnect(); } catch (_) {} } };
  }

  registerEvent({ id: 'stage', name: 'OPENING NIGHT', star: 'misha', sub: 'MISHA  /  AVANT-GARDE THEATRE', icon: 'masks', create });
})();
