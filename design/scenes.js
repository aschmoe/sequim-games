// ---- drawing helpers for 320x180 screens ----
const W=320, H=180;
function hex(c){ const n=parseInt(c.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
const tcan=document.createElement('canvas'), tctx=tcan.getContext('2d',{willReadFrequently:true});
function T(ctx,s,x,y,col,o={}){
  const size=o.size||8, fam=o.f==='s'?'"Silkscreen"':'"Press Start 2P"', font=`${size}px ${fam}, monospace`;
  tctx.font=font; const w=Math.ceil(tctx.measureText(s).width)+2, h=size+6;
  tcan.width=w; tcan.height=h; tctx.font=font; tctx.textBaseline='top'; tctx.fillStyle='#fff'; tctx.fillText(s,1,1);
  const d=tctx.getImageData(0,0,w,h), p=d.data, [r,g,b]=hex(col);
  for(let i=0;i<p.length;i+=4){ const a=p[i+3]>110?255:0; p[i]=r;p[i+1]=g;p[i+2]=b;p[i+3]=a; }
  tctx.putImageData(d,0,0);
  let dx=x; if(o.a==='c')dx=x-w/2; else if(o.a==='r')dx=x-w;
  ctx.drawImage(tcan,Math.round(dx)-1,y-1); return w;
}
function TS(ctx,s,x,y,col,sh,o={}){ T(ctx,s,x+1,y+1,sh,o); return T(ctx,s,x,y,col,o); }
function TO(ctx,s,x,y,col,out,sh,o={}){ if(sh)T(ctx,s,x+2,y+2,sh,o); for(const [a,b] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[1,-1],[-1,1]])T(ctx,s,x+a,y+b,out,o); T(ctx,s,x,y,col,o); }
function R(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function box(ctx,x,y,w,h,fill,border,bw=1){ R(ctx,x,y,w,h,border); R(ctx,x+bw,y+bw,w-2*bw,h-2*bw,fill); }
function disc(ctx,cx,cy,r,c){ ctx.fillStyle=c; for(let y=-r;y<=r;y++){ const hw=Math.floor(Math.sqrt(r*r-y*y+r*.6)); ctx.fillRect(cx-hw,cy+y,hw*2+1,1);} }
function line(ctx,x0,y0,x1,y1,c){ ctx.fillStyle=c; const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0)); for(let i=0;i<=n;i++){ ctx.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1);} }
function cable(ctx,x0,y0,x1,y1,sag,c,dark){ const cx=(x0+x1)/2, cy=Math.max(y0,y1)+sag; for(let i=0;i<=80;i++){ const t=i/80, x=(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1, y=(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1; R(ctx,Math.round(x)-1,Math.round(y)+1,2,1,dark); R(ctx,Math.round(x)-1,Math.round(y)-1,2,2,c);} }
function curvePoint(x0,y0,x1,y1,sag,t){ const cx=(x0+x1)/2, cy=Math.max(y0,y1)+sag; return [(1-t)*(1-t)*x0+2*(1-t)*t*cx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*cy+t*t*y1]; }
function blit(ctx,img,x,y,s=1,flip=false){ ctx.save(); if(flip){ ctx.translate(x+img.width*s,y); ctx.scale(-1,1); ctx.drawImage(img,0,0,img.width*s,img.height*s);} else ctx.drawImage(img,x,y,img.width*s,img.height*s); ctx.restore(); }
function tint(img,col){ const c=document.createElement('canvas'); c.width=img.width;c.height=img.height; const x=c.getContext('2d'); x.drawImage(img,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,c.width,c.height); return c; }
function bands(ctx,cols,hs,y=0){ cols.forEach((c,i)=>{ R(ctx,0,y,W,hs[i],c); y+=hs[i]; }); return y; }
function bars(ctx,x,y,n,col,off='#2a2f5a'){ for(let i=0;i<5;i++) R(ctx,x+i*6,y,5,5,i<n?col:off); }
const PORTRAIT={};

// ---- icons (24x24) ----
function iconBoard(ctx,x,y){ R(ctx,x+2,y+12,20,3,'#ffd84a'); R(ctx,x+2,y+15,20,1,'#0e0c14'); R(ctx,x+6,y+16,12,2,'#14141c'); R(ctx,x+7,y+16,10,1,'#4fd6ff'); disc(ctx,x+5,y+19,2,'#c8c8d4'); disc(ctx,x+19,y+19,2,'#c8c8d4'); blit(ctx,spr('bolt'),x+9,y+2); }
function iconSynth(ctx,x,y){ box(ctx,x+2,y+2,20,20,'#d8d8de','#0e0c14'); disc(ctx,x+8,y+8,3,'#2a2a30'); R(ctx,x+8,y+5,1,3,'#fff'); disc(ctx,x+16,y+16,2,'#0e0c14'); R(ctx,x+15,y+15,2,2,'#c8c8d4'); cable(ctx,x+16,y+16,x+7,y+18,4,'#e04a3a','#8a1c18'); }
function iconMasks(ctx,x,y){ disc(ctx,x+9,y+10,7,'#ffd84a'); disc(ctx,x+15,y+14,7,'#a04cd0'); R(ctx,x+6,y+8,2,2,'#0e0c14'); R(ctx,x+10,y+8,2,2,'#0e0c14'); R(ctx,x+6,y+12,6,1,'#0e0c14'); R(ctx,x+7,y+13,4,1,'#0e0c14'); R(ctx,x+12,y+12,2,2,'#0e0c14'); R(ctx,x+17,y+12,2,2,'#0e0c14'); R(ctx,x+13,y+18,5,1,'#0e0c14'); R(ctx,x+12,y+17,1,1,'#0e0c14'); R(ctx,x+18,y+17,1,1,'#0e0c14'); }
function d20(ctx,cx,cy,r,num,big){ const p=[]; for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; p.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]); }
  ctx.fillStyle='#0e0c14'; ctx.beginPath(); p.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b)); ctx.closePath(); ctx.fill();
  const q=p.map(([a,b])=>[cx+(a-cx)*.86, cy+(b-cy)*.86]); ctx.fillStyle='#c0323a'; ctx.beginPath(); q.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b)); ctx.closePath(); ctx.fill();
  const t=[[cx,cy-r*.55],[cx+r*.5,cy+r*.32],[cx-r*.5,cy+r*.32]]; ctx.fillStyle='#e05a5a'; ctx.beginPath(); t.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b)); ctx.closePath(); ctx.fill();
  for(const [a,b] of t) for(const v of [q[0],q[2],q[4]]) {} 
  line(ctx,Math.round(t[0][0]),Math.round(t[0][1]),Math.round(q[4][0]),Math.round(q[4][1]),'#7a1a20');
  line(ctx,Math.round(t[1][0]),Math.round(t[1][1]),Math.round(q[0][0]),Math.round(q[0][1]),'#7a1a20');
  line(ctx,Math.round(t[2][0]),Math.round(t[2][1]),Math.round(q[2][0]),Math.round(q[2][1]),'#7a1a20');
  if(num){ if(big) TO(ctx,num,cx,cy-6,'#ffffff','#0e0c14',null,{a:'c'}); else T(ctx,num,cx,cy-3,'#fff',{f:'s',a:'c'}); }
}
function iconD20(ctx,x,y){ d20(ctx,x+12,y+12,11,'20'); }

// ---- screens ----
function drawTitleArt(c) {
  bands(c, ['#22336e', '#2e4486', '#40589e', '#5a6eb4', '#7c84c0', '#a894c4', '#d8a6b8', '#f2bea8', '#f8d4a4'], [14, 11, 10, 9, 8, 8, 8, 8, 9]);
  disc(c, 236, 70, 10, '#fff0b0'); disc(c, 236, 70, 8, '#ffe27a');
  // Olympic Mountains: jagged ridge with snow on the high peaks
  const ridge = x => 66 + 10 * Math.sin(x * .045) + 6 * Math.sin(x * .13 + 1) + 4 * Math.abs(Math.sin(x * .31)) - (x > 90 && x < 150 ? 10 * Math.sin((x - 90) / 60 * Math.PI) : 0);
  for (let x = 0; x < W; x++) {
    const top = Math.round(ridge(x));
    for (let y = top; y < 96; y++) {
      const snow = top < 64 && y < top + (64 - top) * .7 + 2;
      c.fillStyle = snow ? (x % 7 === 0 && y > top + 1 ? '#c8d0ec' : '#eef0fb') : (y < top + 10 ? '#6a72a8' : '#5a6098');
      c.fillRect(x, y, 1, 1);
    }
  }
  for (let x = 0; x < W; x++) { const top = Math.round(86 + 4 * Math.sin(x * .05 + 2) + 2 * Math.sin(x * .19)); R(c, x, top, 1, 100 - top, '#2e5040'); }
  // red barn on the horizon
  R(c, 34, 82, 18, 11, '#b8322a'); c.fillStyle = '#7a1e1a'; c.beginPath(); c.moveTo(32, 83); c.lineTo(43, 75); c.lineTo(54, 83); c.fill(); R(c, 40, 87, 6, 6, '#f2e6d0'); R(c, 42, 87, 2, 6, '#b8322a');
  // lavender rows in perspective
  const vx = 160, vy = 92;
  for (let y = 96; y < H; y++) {
    const t = (y - vy) / (H - vy);
    for (let x = 0; x < W; x++) {
      const u = (x - vx) / (t * 34) + 100.5; const f = u - Math.floor(u);
      let col;
      if (f > .2 && f < .8) col = ((x * 7 + y * 13) % 11 < (t > .5 ? 3 : 1)) ? '#c8a0f4' : (y % 2 ? '#8a5ac8' : '#9a66d8');
      else col = t > .45 ? '#3a6a34' : '#2e5a2e';
      c.fillStyle = col; c.fillRect(x, y, 1, 1);
    }
  }
}
function sceneTitle(ctx){
  drawTitleArt(ctx);
  TO(ctx,'SEQUIM',160,14,'#ffffff','#2a1250','#8a4ad0',{size:16,a:'c'});
  TO(ctx,'GAMES',160,34,'#ffd84a','#2a1250','#a03a8a',{size:24,a:'c'});
  TO(ctx,'TAP TO START',160,130,'#ffffff','#2a1250',null,{a:'c'});
  T(ctx,'(C) 1987 SEQUIM SOFTWARE',160,166,'#f2e6ff',{f:'s',a:'c'});
  blit(ctx,PORTRAIT.seb,8,142); blit(ctx,PORTRAIT.misha,280,142);
}
function sceneEvents(ctx){
  R(ctx,0,0,W,H,'#10102a');
  bands(ctx,['#5c1a6c','#b52562','#f06a40','#fcc84a'],[6,5,5,4]);
  TS(ctx,'SELECT EVENT',160,6,'#ffffff','#2a0a3a',{a:'c'});
  const rows=[
    ['VOLT RUN','SEBASTIAN  /  ELECTRIC SKATEBOARD','12,480','SEB',iconBoard],
    ['PATCH PANIC','SEBASTIAN  /  MODULAR SYNTH','8,350','MISHA',iconSynth],
    ['OPENING NIGHT','MISHA  /  THEATRE','10,200','MISHA',iconMasks],
    ['ROLL FOR INITIATIVE','MISHA  /  DUNGEONS & DRAGONS','--','',iconD20],
  ];
  rows.forEach(([n,sub,best,who,icon],i)=>{ const y=26+i*32;
    box(ctx,8,y,304,28,i===0?'#26265a':'#1a1a40',i===0?'#ffd84a':'#33336a',i===0?2:1);
    box(ctx,11,y+2,24,24,'#0e0c22','#33336a'); icon(ctx,11,y+2);
    T(ctx,n,42,y+5,i===0?'#ffd84a':'#ffffff');
    T(ctx,sub,42,y+16,'#9a9ad0',{f:'s'});
    T(ctx,best,306,y+5,'#ffffff',{a:'r'}); if(who) T(ctx,who,306,y+16,'#ffd84a',{f:'s',a:'r'});
  });
  T(ctx,'HIGH SCORES',10,163,'#4fd6ff',{f:'s'}); T(ctx,'SOUND: ON',310,163,'#4fd6ff',{f:'s',a:'r'});
}
function sceneVolt(ctx){
  let y=bands(ctx,['#2a5ac8','#3a6ad8','#4a7ee0','#5a92e8','#70a8ee','#8cc0f2','#a8d4f4'],[20,14,12,11,10,9,10]);
  const bh=[30,44,26,52,38,20,46,34,58,28,40,24,50,36];
  let x=0; bh.forEach((h,i)=>{ const w=18+(i*7)%14; R(ctx,x,96-h,w,h+14,'#5a6aa8'); for(let wy=96-h+4;wy<104;wy+=6) for(let wx=x+3;wx<x+w-3;wx+=5) if((wx+wy+i)%3) R(ctx,wx,wy,2,3,'#8ea0d8'); x+=w+2; });
  for(let i=0;i<16;i++){ const tx=i*22+((i*13)%9); for(let r=0;r<16;r++) R(ctx,tx+8-Math.floor(r/2),92+r,Math.floor(r/2)*2+2,1,r%4===3?'#14432c':'#1c5a3a'); R(ctx,tx+7,108,2,4,'#4a301a'); }
  R(ctx,0,108,W,8,'#a8a8b4'); for(let x=0;x<W;x+=16) R(ctx,x,108,1,8,'#8a8a96'); R(ctx,0,116,W,3,'#5a5a68');
  R(ctx,0,119,W,41,'#3a3a46'); for(let x=4;x<W;x+=24) R(ctx,x,139,12,2,'#f4d24a');
  R(ctx,0,160,W,20,'#2a2a34');
  for(const [lx,ly,lw] of [[18,124,16],[8,130,22],[24,136,12],[12,146,18]]) R(ctx,lx,ly,lw,1,'#d8e8ff');
  R(ctx,52,147,40,1,'#1a6a8a');
  R(ctx,54,136,36,2,'#2a2a34'); R(ctx,54,135,36,1,'#5a5a68'); R(ctx,52,134,2,2,'#2a2a34'); R(ctx,90,134,2,2,'#2a2a34');
  R(ctx,62,138,20,3,'#14141c'); R(ctx,63,139,18,1,'#4fd6ff');
  disc(ctx,59,142,3,'#0e0c14'); disc(ctx,59,142,2,'#c8c8d4'); disc(ctx,85,142,3,'#0e0c14'); disc(ctx,85,142,2,'#c8c8d4');
  blit(ctx,spr('sebSkate'),62,115);
  R(ctx,172,126,2,2,'#f08a2a'); R(ctx,171,128,4,3,'#f08a2a'); R(ctx,170,131,6,2,'#ffffff'); R(ctx,169,133,8,4,'#f08a2a'); R(ctx,166,137,14,2,'#d06a1a');
  blit(ctx,spr('bolt'),204,98); R(ctx,203,108,9,1,'#fff6a0');
  ctx.fillStyle='#14141c'; ctx.fillRect(236,150,24,3); ctx.fillRect(238,149,20,5); R(ctx,237,148,22,1,'#2a2a34');
  blit(ctx,spr('dog'),286,126,1,true);
  R(ctx,0,0,W,14,'#0e0c14');
  box(ctx,4,3,28,8,'#0e0c14','#ffffff'); R(ctx,32,5,2,4,'#ffffff'); R(ctx,6,5,15,4,'#3cc060');
  T(ctx,'62%',38,4,'#3cc060',{f:'s'});
  T(ctx,'21 MPH',130,3,'#ffffff'); T(ctx,'0.8 MI',316,3,'#ffd84a',{a:'r'});
  ctx.globalAlpha=.55; R(ctx,4,164,96,13,'#0e0c14'); R(ctx,220,164,96,13,'#0e0c14'); R(ctx,140,164,40,13,'#0e0c14'); ctx.globalAlpha=1;
  T(ctx,'< HOLD: BRAKE',52,167,'#ffffff',{f:'s',a:'c'}); T(ctx,'HOLD: GO >',268,167,'#ffffff',{f:'s',a:'c'}); T(ctx,'^ HOP',160,167,'#ffffff',{f:'s',a:'c'});
}
function sceneSynth(ctx){
  R(ctx,0,0,W,H,'#141018');
  const mods=[['VCO',48,'#d8d8de'],['VCF',56,'#222230'],['VCA',48,'#d8d8de'],['ENV',52,'#222230'],['LFO',40,'#d8d8de'],['OUT',52,'#222230']];
  const jack={}; let x=12;
  mods.forEach(([n,w,c])=>{ box(ctx,x,16,w,110,c,'#0e0c14'); const ink=c==='#222230'?'#ffffff':'#0e0c14';
    T(ctx,n,x+w/2,20,ink,{f:'s',a:'c'});
    for(const [i,ky] of [[0,40],[1,64]]){ const kx=x+w/2; disc(ctx,kx,ky,7,'#0e0c14'); disc(ctx,kx,ky,6,'#3a3a44'); line(ctx,kx,ky,kx+(i?4:-3),ky-4,'#ffffff'); }
    const js=[[x+12,98],[x+w-12,98],[x+w/2,114]];
    js.forEach(([jx,jy],i)=>{ disc(ctx,jx,jy,4,'#c8c8d4'); disc(ctx,jx,jy,2,'#0e0c14'); });
    jack[n]=js; x+=w;
  });
  R(ctx,6,8,308,8,'#b8b8c4'); R(ctx,6,126,308,8,'#b8b8c4'); for(let sx=14;sx<314;sx+=30){ R(ctx,sx,11,3,2,'#6a6a78'); R(ctx,sx,129,3,2,'#6a6a78'); }
  cable(ctx,jack.VCO[1][0],jack.VCO[1][1],jack.VCF[0][0],jack.VCF[0][1],14,'#e04a3a','#8a1c18');
  cable(ctx,jack.VCF[1][0],jack.VCF[1][1],jack.VCA[0][0],jack.VCA[0][1],12,'#f4d24a','#a07a10');
  cable(ctx,jack.ENV[2][0],jack.ENV[2][1],jack.VCA[2][0],jack.VCA[2][1],10,'#3a8ae0','#1c3a8a');
  cable(ctx,jack.VCA[1][0],jack.VCA[1][1],jack.OUT[0][0],jack.OUT[0][1],18,'#a04cd0','#5a2482');
  const tj=jack.VCA[0]; ctx.fillStyle='#ffffff'; for(let a=0;a<64;a++){ const t=a/64*Math.PI*2; ctx.fillRect(Math.round(tj[0]+Math.cos(t)*10),Math.round(tj[1]+Math.sin(t)*10),1,1); }
  const [px,py]=curvePoint(jack.VCF[1][0],jack.VCF[1][1],tj[0],tj[1],12,.72); disc(ctx,Math.round(px),Math.round(py),3,'#ffffff'); disc(ctx,Math.round(px),Math.round(py),1,'#fff6a0');
  R(ctx,0,138,W,42,'#0e0c14');
  T(ctx,'STEP',6,142,'#9a9ad0',{f:'s'});
  for(let i=0;i<16;i++){ const on=[0,3,4,7,8,10,12,14].includes(i); R(ctx,30+i*12,142,10,8,i===9?'#ffffff':on?'#e04a3a':'#2a2a3a'); }
  T(ctx,'GROOVE',6,156,'#9a9ad0',{f:'s'}); box(ctx,44,156,100,7,'#1a1a28','#ffffff'); R(ctx,46,158,70,3,'#f4d24a');
  T(ctx,'COMBO X12',150,155,'#f4d24a'); T(ctx,'8,350',278,155,'#ffffff',{a:'r'}); blit(ctx,PORTRAIT.seb,284,142); T(ctx,'NOD',300,135,'#ffd84a',{f:'s',a:'c'});
  T(ctx,'TAP THE JACK WHEN THE PULSE LANDS',140,168,'#c8c8d4',{f:'s',a:'c'});
  const lj=jack.LFO[1]; cable(ctx,lj[0],lj[1],lj[0]+16,152,6,'#3cc060','#1c6a34'); R(ctx,lj[0]+14,152,4,6,'#c8c8d4');
  TO(ctx,'CABLE OUT!',lj[0]-4,80,'#ffffff','#c0323a',null,{f:'s',a:'c'});
}
function sceneStage(ctx){
  R(ctx,0,0,W,H,'#0a0810');
  R(ctx,40,18,240,100,'#1c2450'); for(const [sx,sy] of [[70,30],[120,24],[200,40],[240,28],[96,50],[260,60],[150,36]]) R(ctx,sx,sy,1,1,'#ffffff');
  disc(ctx,236,44,9,'#f4f0d0'); disc(ctx,240,41,7,'#1c2450');
  ctx.fillStyle='#0e1430'; ctx.fillRect(70,72,180,46); for(const [tx,tw,th] of [[80,16,22],[120,20,34],[170,18,26],[214,16,18]]){ ctx.fillRect(tx,72-th,tw,th); for(let i=0;i<tw;i+=4) ctx.fillRect(tx+i,72-th-3,2,3); }
  ctx.fillStyle='#8a5a2a'; ctx.beginPath(); ctx.moveTo(44,116);ctx.lineTo(276,116);ctx.lineTo(300,148);ctx.lineTo(20,148);ctx.closePath();ctx.fill();
  for(let i=0;i<8;i++) R(ctx,30,118+i*4,260,1,'#6a4220');
  ctx.fillStyle='rgba(255,240,170,0.16)'; ctx.beginPath(); ctx.moveTo(150,0);ctx.lineTo(176,0);ctx.lineTo(196,146);ctx.lineTo(128,146);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,240,170,0.22)'; ctx.beginPath(); ctx.ellipse(162,140,34,6,0,0,Math.PI*2); ctx.fill();
  const X=(cx,cy,c)=>{ for(let i=-3;i<=3;i++){ R(ctx,cx+i,cy+i,2,1,c); R(ctx,cx+i,cy-i,2,1,c);} };
  X(96,134,'#e8e8f0'); X(162,140,'#ffd84a'); X(232,134,'#e8e8f0');
  blit(ctx,spr('mishaHamlet'),118,104); blit(ctx,spr('skull'),136,113);
  for(let x=0;x<44;x+=4){ R(ctx,x,0,2,150,'#c02a2a'); R(ctx,x+2,0,2,150,'#8a1a1a'); }
  for(let x=276;x<W;x+=4){ R(ctx,x,0,2,150,'#c02a2a'); R(ctx,x+2,0,2,150,'#8a1a1a'); }
  R(ctx,0,0,W,12,'#a01e22'); for(let x=0;x<W;x+=16) disc(ctx,x+8,12,6,'#a01e22'); R(ctx,0,0,W,2,'#e0b040');
  R(ctx,0,148,W,32,'#06050a');
  for(let i=0;i<14;i++){ const hx=8+i*23+(i%2)*6, hy=158+(i%3)*3; disc(ctx,hx,hy,7,'#1a1828'); disc(ctx,hx,hy,6,'#0e0c18'); R(ctx,hx-10,hy+5,20,20,'#0e0c18'); }
  R(ctx,201,146,2,8,'#1a1828'); R(ctx,199,144,6,3,'#1a1828');
  for(const [tx,ty] of [[214,96],[222,90],[230,86]]) R(ctx,tx,ty,2,2,'rgba(255,90,70,0.5)');
  disc(ctx,240,82,4,'#e0302a'); R(ctx,239,77,3,2,'#3cc060'); R(ctx,238,80,2,1,'#ff9080');
  box(ctx,54,16,212,50,'#0a0810','#ffffff');
  T(ctx,'VIBE:',60,20,'#c8c8d4'); T(ctx,'MENACING',104,20,'#ff8ab0'); T(ctx,'+',172,20,'#ffffff'); T(ctx,'OPERATIC',184,20,'#4fd6ff');
  T(ctx,'A  TO BE, OR NOT TO BE',62,32,'#ffffff',{f:'s'});
  T(ctx,'B  MORE SWEET WHITE WINE?',62,41,'#ffffff',{f:'s'});
  T(ctx,'C  I AM THE FOG. I AM THE FOG.',62,50,'#ffffff',{f:'s'});
  R(ctx,58,61,204,2,'#2a2a3a'); R(ctx,58,61,120,2,'#ffd84a');
  T(ctx,'APPLAUSE',6,168,'#c8c8d4',{f:'s'}); box(ctx,54,169,90,6,'#1a1a28','#ffffff'); R(ctx,56,171,30,2,'#e0302a');
  T(ctx,'10,200',316,167,'#ffffff',{a:'r'});
}
function sceneDnd(ctx){
  R(ctx,0,0,W,128,'#2a2438');
  for(let y=0;y<112;y+=8){ R(ctx,0,y,W,1,'#1a1626'); for(let x=((y/8)%2)*10;x<W;x+=20){ R(ctx,x,y,1,8,'#1a1626'); R(ctx,x+1,y+1,18,1,'#3a3250'); } }
  for(const tx of [52,268]){ R(ctx,tx,30,4,14,'#4a301a'); R(ctx,tx-1,28,6,3,'#2a1a10'); disc(ctx,tx+2,24,4,'#f08a2a'); disc(ctx,tx+2,25,2,'#ffd84a'); R(ctx,tx+1,17,2,3,'#f08a2a'); }
  R(ctx,0,108,W,22,'#1e1a2a'); for(let x=0;x<W;x+=26) R(ctx,x,108,1,22,'#14101c'); R(ctx,0,118,W,1,'#14101c'); R(ctx,0,108,W,1,'#3a3250');
  blit(ctx,spr('orc'),76,90,1); blit(ctx,spr('goblin'),22,94); blit(ctx,spr('goblin'),46,96);
  R(ctx,22,88,14,2,'#3a0a0a'); R(ctx,22,88,10,2,'#e0302a'); R(ctx,46,90,14,2,'#3a0a0a'); R(ctx,46,90,14,2,'#e0302a'); R(ctx,78,84,20,2,'#e0302a');
  blit(ctx,spr('mishaBard'),258,90,1,true);
  T(ctx,'ROLL TO HIT  -  ARMOR 13',168,30,'#c8c8d4',{f:'s',a:'c'});
  d20(ctx,168,64,22,'17',true);
  for(const [a,b] of [[140,50],[196,50],[142,80],[194,80]]) R(ctx,a,b,2,2,'#ffd84a');
  T(ctx,'TAP TO STOP THE DIE',168,92,'#ffd84a',{f:'s',a:'c'});
  box(ctx,4,132,312,44,'#1c2a8a','#ffffff',2); R(ctx,8,136,304,1,'#3a4ab0');
  T(ctx,'> ATTACK',14,141,'#ffd84a'); T(ctx,'  SPELL',14,155,'#ffffff'); T(ctx,'SONG',100,141,'#ffffff'); T(ctx,'WINE X2',100,155,'#ffffff');
  R(ctx,196,136,1,36,'#3a4ab0');
  T(ctx,'MISHA',204,141,'#ffffff'); T(ctx,'BARD LV3',312,142,'#a8b8f0',{f:'s',a:'r'});
  T(ctx,'HP',204,157,'#a8b8f0',{f:'s'}); box(ctx,218,157,60,7,'#0e0c22','#ffffff'); R(ctx,220,159,42,3,'#3cc060'); T(ctx,'18/24',312,156,'#ffffff',{f:'s',a:'r'});
}
function sceneScores(ctx){
  R(ctx,0,0,W,H,'#0c0c1c');
  TS(ctx,'VOLT RUN - HIGH SCORES',160,5,'#ffd84a','#5c1a6c',{a:'c'});
  const rows=[['1','SEBASTIAN','12,480','#ffd84a'],['2','MISH_','10,250','#4fd6ff'],['3','ALEX','9,915','#ffffff'],['4','SEBASTIAN','7,040','#ffffff']];
  rows.forEach(([r,n,s,c],i)=>{ const y=20+i*12; if(i===1) R(ctx,8,y-2,304,12,'#1c2c5a'); T(ctx,r,14,y,c); T(ctx,n,34,y,c); T(ctx,s,306,y,c,{a:'r'}); });
  TO(ctx,'NEW RECORD! ENTER YOUR NAME',160,72,'#ffffff','#0e0c14',null,{f:'s',a:'c'});
  const nm='MISH'; for(let i=0;i<10;i++){ const bx=80+i*16; R(ctx,bx,94,12,1,i===4?'#ffd84a':'#5a5a8a'); if(nm[i]) T(ctx,nm[i],bx+2,84,'#ffffff'); }
  const keys=['ABCDEFGHIJ','KLMNOPQRST',['U','V','W','X','Y','Z','-','!','<','OK']];
  keys.forEach((row,ri)=>{ [...row].forEach((k,ki)=>{ const kx=12+ki*30, ky=106+ri*22; const sel=(k==='OK'); box(ctx,kx,ky,26,18,sel?'#3a2a7a':'#1a1a3a',sel?'#ffd84a':'#3a3a7a'); T(ctx,k,kx+13,ky+5,sel?'#ffd84a':'#ffffff',{a:'c'}); }); });
}
