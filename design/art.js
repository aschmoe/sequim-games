// ---- palette + pixel helpers ----
const PAL = {
  k:'#0e0c14', w:'#ffffff', s:'#f2c39e', S:'#cf8c68', L:'#ffe2cc', h:'#4a2a1a', H:'#24140c', l:'#7c4c2c',
  g:'#a95c32', G:'#76391c', e:'#24140e', m:'#7a1e22', t:'#fff6ec', c:'#23232e', C:'#454559', z:'#a8a8b8',
  r:'#d83a2a', R:'#8a1c18', y:'#f4d24a', Y:'#c08a1a', b:'#3a7ae0', B:'#1c3a8a', n:'#3cc060', N:'#1c6a34',
  p:'#a04cd0', P:'#5a2482', o:'#f08a2a', a:'#9aa0b0', A:'#5a6070', v:'#b8f0ff', x:'#c8c8d4', q:'#7a5230', Q:'#4a301a'
};
function grid(w,h){ return Array.from({length:h},()=>Array(w).fill('.')); }
function inE(x,y,cx,cy,rx,ry){ const dx=(x+.5-cx)/rx, dy=(y+.5-cy)/ry; return dx*dx+dy*dy<=1; }
function ell(g,cx,cy,rx,ry,ch,f){ for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++) if(inE(x,y,cx,cy,rx,ry)&&(!f||f(x,y,g[y][x]))) g[y][x]=ch; }
function rect(g,x0,y0,x1,y1,ch,f){ for(let y=Math.max(0,y0);y<=Math.min(g.length-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(g[0].length-1,x1);x++) if(!f||f(x,y,g[y][x])) g[y][x]=ch; }
function pts(g,list,ch){ for(const [x,y] of list) if(g[y]&&g[y][x]!==undefined) g[y][x]=ch; }
function outline(g,ch='k'){ const o=g.map(r=>r.slice()); for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++){ if(g[y][x]!=='.')continue; const n=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const v=g[y+dy]&&g[y+dy][x+dx]; return v&&v!=='.'&&v!==ch;}); if(n)o[y][x]=ch; } return o; }
function toRows(g){ return g.map(r=>r.join('')); }
function sprite(rows){ const c=document.createElement('canvas'); c.width=rows[0].length; c.height=rows.length; const x=c.getContext('2d');
  rows.forEach((r,y)=>{ for(let i=0;i<r.length;i++){ const ch=r[i]; if(ch==='.')continue; x.fillStyle=PAL[ch]||ch; x.fillRect(i,y,1,1);} }); return c; }

// ---- portraits, 32x38, built from the reference photos ----
function bust(g,shirt='c',hi='C'){
  for(let y=29;y<38;y++){ const hw=Math.min(15,8+(y-29)*2); rect(g,16-hw,y,15+hw,y,shirt); }
  for(let y=29;y<33;y++){ const hw=Math.min(15,8+(y-29)*2); pts(g,[[16-hw,y],[15+hw,y]],hi); }
}
function sebastianPortrait(){
  const g=grid(32,38);
  bust(g);
  rect(g,12,22,19,30,'s'); rect(g,18,22,19,30,'S'); rect(g,12,25,19,26,'S');
  ell(g,7.4,15,1.7,2.6,'s'); ell(g,24.6,15,1.7,2.6,'S');
  ell(g,16,13.4,8.6,11.2,'s');
  ell(g,16,13.4,8.6,11.2,'S',(x)=> (x+.5-16)/8.6>0.68);
  ell(g,12.6,5.2,2.4,1.5,'L');
  ell(g,16,13.4,8.6,11.2,'g',(x,y)=> y>=18 || (y>=13 && Math.abs(x+.5-16)>=7.2));
  ell(g,16,23.6,6,3.2,'g');
  ell(g,16,24.4,5,2.4,'G',(x,y)=>y>=25);
  // eyes (happy squint) + brows
  pts(g,[[11,12],[20,12],[10,13],[12,13],[19,13],[21,13]],'e');
  pts(g,[[9,10],[10,10],[11,10],[12,10],[19,10],[20,10],[21,10],[22,10]],'G');
  // nose
  pts(g,[[16,14],[16,15],[15,16],[17,16]],'S');
  // smile with teeth
  pts(g,[[11,19],[20,19]],'m'); rect(g,12,20,19,20,'t'); rect(g,13,21,18,21,'m'); pts(g,[[12,20],[19,20]],'m');
  rect(g,12,18,19,18,'G');
  // quarter-zip collar, zipper, logo
  rect(g,10,27,11,30,'c'); rect(g,20,27,21,30,'c'); pts(g,[[11,27],[20,27]],'C');
  rect(g,16,29,16,37,'z'); pts(g,[[17,31]],'z');
  pts(g,[[22,33],[23,32],[24,33]],'w');
  return toRows(outline(g));
}
function mishaPortrait(){
  const g=grid(32,38);
  const edgeL=y=> Math.round(5.6 + Math.sin(y*0.42)*0.9 - Math.max(0,y-18)*0.12);
  const edgeR=y=> 31-edgeL(y+1.5);
  // hair silhouette behind everything
  ell(g,16,12.5,10.6,10.8,'h');
  for(let y=12;y<36;y++){ rect(g,edgeL(y),y,15,y,'h'); rect(g,16,y,edgeR(y),y,'h'); }
  for(const [x,y] of [[edgeL(35),35],[edgeR(35),35],[edgeL(34),35],[edgeR(34),35]]) g[y][x]='.';
  bust(g); rect(g,13,29,18,32,'C');
  // hair falls over the shoulders, in front of the sweater
  for(let y=28;y<36;y++){ rect(g,edgeL(y),y,9-(y>33?1:0),y,'h'); rect(g,22+(y>33?1:0),y,edgeR(y),y,'h'); }
  rect(g,13,21,18,29,'s'); rect(g,17,21,18,29,'S'); rect(g,13,23,18,24,'S');
  ell(g,16,14.6,6.9,9.3,'s');
  ell(g,16,14.6,6.9,9.3,'S',(x)=>(x+.5-16)/6.9>0.66);
  // curtains: middle part, swept out to each side of the forehead
  ell(g,16,14.6,6.9,9.3,'h',(x,y)=>{ const dx=Math.abs(x+.5-15.6); if(y<6)return true; if(y<10) return dx>(y-5)*1.3; return dx>5.6 && y<19; });
  // shade the hair that sits against the face and neck
  const sh=g.map(r=>r.slice());
  for(let y=1;y<37;y++)for(let x=1;x<31;x++) if(sh[y][x]==='h' && [[1,0],[-1,0],[0,1]].some(([a,b])=>'sS'.includes(sh[y+b][x+a]))) g[y][x]='H';
  // flowing highlight strands
  for(const [x0,y0,y1,ph] of [[8,9,31,0],[11,4,9,1],[23,10,30,2],[20,4,9,0],[6,16,33,3],[25,18,33,1]])
    for(let y=y0;y<=y1;y++){ const x=x0+Math.round(Math.sin(y*0.42+ph)*0.9); if(g[y][x]==='h' && (y+ph)%6!==0) g[y][x]='l'; }
  // face
  pts(g,[[11,11],[12,11],[13,11],[18,11],[19,11],[20,11]],'H');
  pts(g,[[12,13],[19,13],[11,14],[13,14],[18,14],[20,14]],'e');
  pts(g,[[16,15],[16,16],[15,17],[17,17]],'S');
  pts(g,[[12,19],[19,19]],'m'); rect(g,13,20,18,20,'t'); rect(g,14,21,17,21,'m'); pts(g,[[13,20],[18,20]],'m');
  rect(g,16,30,16,37,'z');
  return toRows(outline(g));
}

// ---- small in-game sprites ----
const SPR = {
  sebSkate: [
    "......kkkkk.....",
    ".....kLLsssk....",
    ".....kLssssSk...",
    ".....ksssssek...",
    ".....kssssssk...",
    ".....kgggssssk..",
    ".....kggggmgk...",
    "......kggggk....",
    "......kccck.....",
    ".....kcCccck....",
    "....kcCcccccssk.",
    "....kcCcccckkk..",
    "....kccccck.....",
    ".....kcccck.....",
    ".....kaaaak.....",
    "....kaaaaaak....",
    "...kaaak.kaak...",
    "...kaak...kaak..",
    "..kaak.....kak..",
    "..kkkk....kkkk..",
  ],
  mishaHamlet: [
    ".....kkkkkk.....",
    "....khhllhhk....",
    "...khlhhhhlhk...",
    "...khhsssshhk...",
    "...khsesseshk...",
    "...khssmmsshk...",
    "...khhsssshhk...",
    "..khhkwwwwkhhk..",
    "..khkwxwwxwkhk..",
    "..khkppppppkhk..",
    "..kpkpPppPpkpk..",
    "..kpkpyyyypkpk..",
    "..kskppppppksk..",
    "...kkpPppPpkk...",
    "....kppppppk....",
    "....kCCkkCCk....",
    "....kCCk.kCCk...",
    "....kCCk.kCCk...",
    "...kkkk..kkkk...",
  ],
  mishaBard: [
    ".....kkkkkk.....",
    "....khhllhhk....",
    "...khlhhhhlhk...",
    "...khhsssshhk...",
    "...khsesseshk...",
    "...khssmmsshk...",
    "...khhsssshhk...",
    "..knhhkNNkhhnk..",
    "..knnhnnnnhnnk..",
    ".knnkqqqqqknnk..",
    ".knkqQqqQqqknk..",
    ".knkqqqQqqqkQk..",
    "..kknqqqqqkkQk..",
    "...knnnnnnnkQk..",
    "...knnnnnnnk.k..",
    "....kCCkkCCk....",
    "....kCCk.kCCk...",
    "...kkkk..kkkk...",
  ],
  skull: [".kkkk.","kwwwwk","kkwkwk","kwwwwk",".kwkk.","..kk.."],
  goblin: [
    "..k.kkkkk.k...",
    ".knkknnnnkknk.",
    ".knnnnnnnnnnk.",
    "..knyknnyknk..",
    "..knnnnnnnnk..",
    "...knwnwnnk...",
    "....knnnnk....",
    "...kqqqqqqk...",
    "..knkqqqqknk..",
    "..knkqqqqknk.k",
    "...kkqqqqkk.kx",
    "....kNkkNk..kx",
    "....kNk.kNk.k.",
    "...kkk..kkk...",
  ],
  orc: [
    "......kkkkkkk.......",
    ".....kNNNNNNNk......",
    "....kNNNNNNNNNk.....",
    "....kNrNNNNrNNk.....",
    "....kNNNNNNNNNk.....",
    "....kNwNNNNNwNk.....",
    ".....kNNNNNNNk......",
    "...kkAAAAAAAAAkk....",
    "..kNkAaAAAAaAAkNk...",
    "..kNkAAAAAAAAAkNk.k.",
    "..kNkAAqqqqqAAkNkkxk",
    "..kNNkAAAAAAAkNNkqxk",
    "...kkkAAAAAAAkk.kqk.",
    ".....kAAAkAAAk..kqk.",
    ".....kNNk.kNNk..kqk.",
    ".....kNNk.kNNk......",
    "....kkkk...kkkk.....",
  ],
  dog: [
    "........kk..",
    ".......kqqk.",
    "k......kqekk",
    "qk....kqqqqk",
    ".kqkkkqqqk..",
    ".kqqqqqqqk..",
    ".kqqqqqqk...",
    ".kqk..kqk...",
    ".kk...kk....",
  ],
  bolt: ["...kkk.","..kyyk.","..kyk..",".kyyykk",".kkyyyk","..kyyk.","..kyk..","..kk..."],
};
const spriteCache = {};
function spr(name){ if(!spriteCache[name]){ const rows=SPR[name]; const w=Math.max(...rows.map(r=>r.length)); spriteCache[name]=sprite(rows.map(r=>r.padEnd(w,'.'))); } return spriteCache[name]; }
