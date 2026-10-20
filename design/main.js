const SCENES={title:sceneTitle,events:sceneEvents,volt:sceneVolt,synth:sceneSynth,stage:sceneStage,dnd:sceneDnd,scores:sceneScores};
function paint(c,name){ const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.clearRect(0,0,c.width,c.height); SCENES[c.dataset.scene](x,name); }
(async()=>{
  try{ await Promise.race([Promise.all([document.fonts.load('8px "Press Start 2P"'),document.fonts.load('8px "Silkscreen"')]), new Promise(r=>setTimeout(r,2500))]); }catch(e){}
  PORTRAIT.seb=sprite(sebastianPortrait()); PORTRAIT.misha=sprite(mishaPortrait());
  document.querySelectorAll('canvas[data-scene]').forEach(c=>paint(c));
  document.querySelectorAll('canvas[data-portrait]').forEach(c=>{ const x=c.getContext('2d'); x.drawImage(PORTRAIT[c.dataset.portrait],0,0); });
  const sw=document.getElementById('swatches');
  for(const col of ['#140c30','#5c1a6c','#b52562','#f06a40','#fcc84a','#ffd84a','#3cc060','#4fd6ff','#3a6ad8','#1c2a8a','#c02a2a','#8a5a2a','#f2c39e','#a95c32','#4a2a1a','#d8d8de']){ const d=document.createElement('span'); d.className='sw'; d.style.background=col; d.title=col; sw.appendChild(d); }
})();
