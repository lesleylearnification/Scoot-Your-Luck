const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  order: {cup:'Hot', coffee:'Espresso', cream:'2% Milk', flavor:'Caramel', finish:'Whipped Cream', realTopper:'Caramel Drizzle'},
  smiles: 250,
  banked: 0,
  multiplier: 1,
  stack: [],
  instability: 0,
  mcgraff: 4,
  ended: false,
  comboAwarded: new Set(),
  mischiefStreak: 0,
};

const toppers = [
  {id:'donut', name:'Tiny Donut', icon:'🍩', smiles:140, weight:1.1, chaos:0.8, width:100, unlock:0, fx:'spark', visualW:112, visualH:92, stackStep:34, threat:24},
  {id:'shark', name:'Gummy Shark', icon:'🦈', smiles:190, weight:1.0, chaos:1.5, width:88, unlock:0, fx:'bubble', visualW:126, visualH:94, stackStep:35, threat:28},
  {id:'waffle', name:'Waffle Roof', icon:'🧇', smiles:230, weight:1.6, chaos:1.0, width:124, unlock:1, fx:'spark', visualW:122, visualH:102, stackStep:38, threat:31},
  {id:'cloud', name:'Thunder Cloud', icon:'🌩️', smiles:270, weight:1.1, chaos:2.1, width:104, unlock:1, fx:'cloud', visualW:118, visualH:100, stackStep:36, threat:34},
  {id:'rex', name:'Gummy T-Rex', icon:'🦖', smiles:330, weight:1.8, chaos:2.0, width:96, unlock:2, fx:'burst', visualW:96, visualH:118, stackStep:39, threat:37},
  {id:'sparkles', name:'Cosmic Sparkles', icon:'✨', smiles:360, weight:0.4, chaos:2.5, width:72, unlock:2, fx:'star', visualW:92, visualH:104, stackStep:35, threat:39},
  {id:'duck', name:'Perfect Rubber Duck', icon:'🦆', smiles:420, weight:0.9, chaos:2.8, width:78, unlock:3, fx:'bubble', visualW:94, visualH:110, stackStep:36, threat:42},
  {id:'boom', name:'Pop-Rock Explosion', icon:'💥', smiles:510, weight:0.7, chaos:3.4, width:82, unlock:3, fx:'burst', visualW:98, visualH:108, stackStep:36, threat:46},
];

const snark = {
  donut:["A donut. On coffee. Civilization had a decent run.","A load-bearing pastry. Very professional."],
  shark:["Finally. Seafood.","Nothing says breakfast like apex predators."],
  waffle:["Oh good. A roof. Your beverage has zoning now.","Structural breakfast. I respect the commitment."],
  rex:["Do the dinosaur, they said. It'll be fine, they said.","That T-Rex has the balance of a shopping cart."],
  duck:["NOW we're making coffee.","Excellent. The duck will testify at the hearing."],
  cloud:["A thundercloud. In a beverage. Subtle.","Forecast says 100% chance of terrible judgment."],
  sparkles:["Sparkles. The universal sign that restraint has failed.","Perfect. Now it can be unstable AND visible from space."],
  boom:["You added an explosion. To coffee. I have no notes.","Excellent choice. Insurance has left the chat."],
  distract:["Bribery. How very wholesome.","Fine. I can be bought. This surprises nobody."],
};

const levels = [
  {name:'NICE', min:0, mult:1},
  {name:'HAPPY', min:2, mult:1.25},
  {name:'RIDICULOUS', min:4, mult:1.6},
  {name:'UNHINGED', min:6, mult:2.1},
  {name:'WHAT IS THAT?', min:8, mult:2.8},
  {name:'MAXIMUM SMILE', min:10, mult:3.5},
];

function initOrder(){
  $$('.segmented').forEach(group => group.addEventListener('click', e => {
    const btn = e.target.closest('.choice'); if(!btn) return;
    group.querySelectorAll('.choice').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    state.order[group.dataset.group] = btn.dataset.value;
    updateDrinkPreview();
  }));
  $('#magicTopperBtn').addEventListener('click', startTopperPhase);
}

function updateDrinkPreview(){
  const o = state.order;
  $('#drinkSummary').textContent = `${o.cup} · ${o.coffee} · ${o.cream} · ${o.flavor} · ${o.finish} · ${o.realTopper}`;

  const preview = $('#realDrink');
  preview.dataset.cup = o.cup;
  preview.dataset.finish = o.finish;
  preview.dataset.topping = o.realTopper;

  const fill = $('.coffee-fill');
  const flavorColors = {
    'Strawberry':'#c96978',
    'White Mocha':'#ba8c73',
    'Mocha':'#4f2b21',
    'Caramel':'#75432e'
  };
  fill.setAttribute('fill', flavorColors[o.flavor] || '#75432e');

  const foam = $('.foam-group');
  if(foam) foam.style.display = o.finish === 'No Foam' ? 'none' : 'block';
  preview.classList.toggle('cold-foam', o.finish === 'Cold Foam');

  const drizzle = $('.drizzle-svg');
  if(drizzle){
    drizzle.style.display = /Drizzle/.test(o.realTopper) ? 'block' : 'none';
    drizzle.setAttribute('stroke', o.realTopper === 'Chocolate Drizzle' ? '#4a261e' : '#cf6f19');
  }
  const crumbs = $('.crumbs-svg');
  if(crumbs) crumbs.style.display = o.realTopper === 'Cookie Crumble' ? 'block' : 'none';
  const gems = $('.gems-svg');
  if(gems) gems.style.display = o.realTopper === 'Cosmic Gems' ? 'block' : 'none';

  preview.classList.remove('magic-flash'); void preview.offsetWidth; preview.classList.add('magic-flash');
}

function startTopperPhase(){
  $('#orderPhase').classList.add('hidden');
  $('#topperPhase').classList.remove('hidden');
  document.body.classList.add('magic-mode');
  document.body.scrollTop = document.documentElement.scrollTop = 0;
  renderTopperTray();
  updateHUD();
  say('“You pressed it. Of course you pressed it.”');
}

function renderTopperTray(){
  const levelIndex = getLevelIndex();
  $('#topperList').innerHTML = toppers.map(t => `
    <button class="topper-card ${t.unlock>levelIndex?'locked':''}" data-id="${t.id}" ${t.unlock>levelIndex?'disabled':''}>
      <img class="topper-art" src="assets/${t.id}.png" alt="" aria-hidden="true">
      <span class="topper-meta"><b>${t.name}</b><small>+${t.smiles} 😊</small></span>
    </button>`).join('');
  $$('.topper-card:not(.locked)').forEach(card=>{
    card.addEventListener('pointerdown', startDrag);
    card.addEventListener('click', e=>{
      if(e.pointerType) return;
      quickDrop(card.dataset.id);
    });
  });
}

let drag = null;
function startDrag(e){
  if(state.ended) return;
  e.preventDefault();
  const card = e.currentTarget;
  const t = toppers.find(x=>x.id===card.dataset.id);
  const ghost = document.createElement('div'); ghost.className='drag-ghost';
  const ghostImg=document.createElement('img'); ghostImg.src=`assets/${t.id}.png`; ghostImg.alt=''; ghost.appendChild(ghostImg); document.body.appendChild(ghost);
  drag={t,ghost}; moveGhost(e.clientX,e.clientY);
  window.addEventListener('pointermove', dragMove); window.addEventListener('pointerup', dragEnd,{once:true});
}
function moveGhost(x,y){if(drag){drag.ghost.style.left=x+'px';drag.ghost.style.top=y+'px'}}
function dragMove(e){moveGhost(e.clientX,e.clientY)}
function dragEnd(e){
  window.removeEventListener('pointermove',dragMove); if(!drag) return;
  const rect=$('#towerStage').getBoundingClientRect();
  if(e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom){
    const normalized = Math.max(-1,Math.min(1,(e.clientX-(rect.left+rect.width/2))/(rect.width*.42)));
    placeTopper(drag.t, normalized);
  }
  drag.ghost.remove(); drag=null;
}
function quickDrop(id){
  if(state.ended) return;
  const t=toppers.find(x=>x.id===id); placeTopper(t,(Math.random()-.5)*.5);
}

function placeTopper(t, offset){
  if(state.ended) return;
  const risk = Math.abs(offset);
  const heightIndex = state.stack.length;
  const instabilityAdd = (t.weight*.65 + t.chaos*.45) * (0.45 + risk*1.7) * (1 + heightIndex*.07);
  state.instability += instabilityAdd;
  const riskBonus = 1 + risk*.8;
  const earned = Math.round(t.smiles * state.multiplier * riskBonus);
  state.smiles += earned;
  state.stack.push({t,offset,earned});

  const el=document.createElement('div'); el.className='stack-item wobble'; el.dataset.id=t.id;
  const art=document.createElement('img'); art.src=`assets/${t.id}.png`; art.alt=''; art.setAttribute('aria-hidden','true'); el.appendChild(art);

  // V8 visual stack anchors: every new object rests on the previous object's top surface.
  // This changes presentation only; scoring, risk, instability, and progression are unchanged.
  const baseTop=236;
  const previousHeight=state.stack.slice(0,-1).reduce((sum,item)=>sum+(item.t.stackStep||44),0);
  const compression=heightIndex>7 ? Math.max(.62,1-(heightIndex-7)*.045) : 1;
  const bottom=baseTop + previousHeight*compression;
  // V9: preserve player placement risk, but add a comic alternating bias so the tower visibly zig-zags.
  const zigDirection = heightIndex % 2 === 0 ? -1 : 1;
  const zigAmount = Math.min(11, 5 + heightIndex * 0.75);
  const left=50 + offset*10 + zigDirection*zigAmount;
  el.style.bottom=bottom+'px';
  el.style.left=left+'%';
  el.style.width=(t.visualW||104)+'px';
  el.style.height=(t.visualH||94)+'px';
  el.style.zIndex=String(10+heightIndex);
  $('#stack').appendChild(el);

  $('#stageCopy').textContent = `+${earned} SMILES · ${Math.round(risk*100)}% EDGE RISK`;

  // V10: Half Caff is now an immediate push-your-luck threat.
  // Each topper has its own threat value, and ignoring him builds a Mischief Streak.
  state.mischiefStreak += 1;
  const streakMultiplier = 1 + Math.min(2, state.mischiefStreak - 1) * 0.35;
  const advance = Math.round((t.threat || 18) * streakMultiplier);
  advanceMcGraff(advance);

  if(state.mcgraff >= 85) say('“Go ahead. Add one more. I dare you.”');
  else if(state.mcgraff >= 65) say('“I can almost touch it.”');
  else if(state.mcgraff >= 40) say('“Getting warmer.”');
  else say(random(snark[t.id]));
  triggerCosmicFx(t.fx, offset);
  checkCombos();
  updateProgression();
  updateHUD();
  wobbleStage();
  const threshold=8.7 + state.stack.length*.18;
  if(state.instability>threshold){setTimeout(()=>lose('topple'),520)}
  else if(state.mcgraff>=100){setTimeout(()=>lose('mcgraff'),520)}
}


function triggerCosmicFx(type, offset=0){
  const layer=$('#cosmicFx'); if(!layer) return;
  const x=50+offset*28;
  const make=(cls,icon,dx=0,dy=0)=>{
    const el=document.createElement('span'); el.className=cls; el.textContent=icon;
    el.style.left=`calc(${x}% + ${dx}px)`; el.style.top=`calc(48% + ${dy}px)`;
    layer.appendChild(el); setTimeout(()=>el.remove(),1700);
  };
  if(type==='cloud'){
    make('fx-cloud','🌩️');
    setTimeout(()=>make('fx-burst','⚡',35,35),180);
    setTimeout(()=>make('fx-burst','⚡',-35,50),360);
  }else if(type==='burst'){
    make('fx-burst','💥');
    for(let i=0;i<6;i++) setTimeout(()=>make('fx-spark',i%2?'✨':'⭐',(Math.random()-.5)*150,(Math.random()-.5)*80),i*55);
  }else if(type==='bubble'){
    for(let i=0;i<7;i++) setTimeout(()=>make('fx-bubble',i%2?'🫧':'○',(Math.random()-.5)*120,30+Math.random()*50),i*70);
  }else if(type==='star'){
    for(let i=0;i<9;i++) setTimeout(()=>make('fx-star',i%3===0?'🌟':'✨',(Math.random()-.5)*160,(Math.random()-.5)*100),i*50);
  }else{
    for(let i=0;i<5;i++) setTimeout(()=>make('fx-spark','✨',(Math.random()-.5)*110,(Math.random()-.5)*70),i*55);
  }
}

function checkCombos(){
  const ids=state.stack.map(s=>s.t.id);
  const combos=[
    {id:'breakfast', need:['donut','waffle'], name:'BREAKFAST OF BAD DECISIONS', bonus:350},
    {id:'wildlife', need:['shark','rex','duck'], name:'UNLICENSED PETTING ZOO', bonus:750},
    {id:'weather', need:['cloud','sparkles'], name:'COSMIC WEATHER ADVISORY', bonus:600},
    {id:'catastrophe', need:['cloud','boom'], name:'ACT OF CAFFEINATED NATURE', bonus:900},
  ];
  combos.forEach(c=>{
    if(!state.comboAwarded.has(c.id) && c.need.every(n=>ids.includes(n))){
      state.comboAwarded.add(c.id); state.smiles+=c.bonus;
      $('#comboHint').textContent=`COMBO! ${c.name} +${c.bonus} 😊`;
      say(`“${c.name}? I hate that I love it.”`);
    }
  })
}

function updateProgression(){
  const idx=getLevelIndex(); state.multiplier=levels[idx].mult;
  renderTopperTray();
}
function getLevelIndex(){
  let idx=0; levels.forEach((l,i)=>{if(state.stack.length>=l.min) idx=i}); return idx;
}
function getLevel(){return levels[getLevelIndex()]}

function updateHUD(){
  $('#smileScore').textContent=state.smiles.toLocaleString();
  $('#bankedScore').textContent=state.banked.toLocaleString();
  $('#multiplier').textContent='×'+state.multiplier.toFixed(2).replace(/0$/,'');
  const pct=Math.min(100,10+state.stack.length*9); $('#meterFill').style.height=pct+'%';
  const stability=Math.max(0,100-(state.instability/10.5)*100); $('#stabilityFill').style.width=stability+'%';
  const danger = stability>72?'steady':stability>45?'wobbly':stability>20?'yikes':'critical';
  $('#towerStage').dataset.danger=danger;
  const teeterAngle=Math.min(9.5,0.65+state.stack.length*0.42+state.instability*0.58);
  const teeterSpeed=Math.max(0.72,3.15-state.stack.length*0.12-state.instability*0.12);
  $('#towerRig').style.setProperty('--teeter-angle',teeterAngle.toFixed(2)+'deg');
  $('#towerRig').style.setProperty('--teeter-speed',teeterSpeed.toFixed(2)+'s');
  $('#stabilityLabel').textContent=stability>72?'STEADY':stability>45?'WOBBLY':stability>20?'YIKES':'ABANDON REASON';
  $('#distractBtn').disabled=state.smiles<100;
}

function setMcGraffPosition(){
  // V8: Half Caff now lives in the same physical scene as the coffee.
  // V12: 0 = far left; 100 = physically touching the cup. The wider travel makes each threat step visually immediate.
  const left=2 + (state.mcgraff/100)*58;
  $('#mcgraff').style.left=`${left}%`;
  $('#towerStage').style.setProperty('--mcgraff-progress',state.mcgraff+'%');
}
function advanceMcGraff(amount){
  state.mcgraff=Math.min(100,state.mcgraff+amount);
  setMcGraffPosition();
}
function say(line){$('#mcgraffQuote').textContent=line}
function random(arr){return arr[Math.floor(Math.random()*arr.length)]}
function wobbleStage(){const s=$('#towerStage');s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake')}

$('#distractBtn').addEventListener('click',()=>{
  if(state.ended||state.smiles<100)return;
  state.smiles-=100;
  state.mcgraff=Math.max(0,state.mcgraff-40);
  state.mischiefStreak=0;
  setMcGraffPosition();
  say(random(snark.distract)); updateHUD();
});

$('#bankBtn').addEventListener('click',()=>{
  if(state.ended)return;
  state.banked += state.smiles; state.smiles=0;
  win();
});

function collapseAnimation(){
  $$('.stack-item').forEach((el,i)=>setTimeout(()=>el.classList.add('fall'),i*45));
}
function lose(type){
  if(state.ended)return; state.ended=true;
  if(type!=='mcgraff') collapseAnimation();
  const mc=$('#mcgraff'); mc.classList.add('celebrate');
  if(type==='mcgraff'){
    say('“BEST. COFFEE. EVER.”');
    $('#towerRig').classList.add('mcgraff-hit');
    setTimeout(collapseAnimation,260);
    setTimeout(()=>showResult('🃏','YOU\'VE BEEN McGRAFFED!','Half Caff touched the coffee and sent the whole ridiculous tower over.'),1050);
  }else{
    $('#towerRig').classList.add('physics-topple');
    say('“Structural engineering isn\'t really your thing, huh?”');
    setTimeout(()=>showResult('💥','WELL. THAT HAPPENED.','Gravity collected its fee. Half Caff is delighted.'),900);
  }
}
function win(){
  if(state.ended)return; state.ended=true;
  showResult('🏆','YOU BANKED IT!','You quit while you were ahead. Half Caff finds your restraint deeply disappointing.');
}
function showResult(icon,title,text){
  $('#resultIcon').textContent=icon; $('#resultTitle').textContent=title; $('#resultText').textContent=text;
  $('#finalSmiles').textContent=(state.banked||state.smiles).toLocaleString(); $('#finalToppers').textContent=state.stack.length; $('#finalLevel').textContent=getLevel().name;
  $('#resultOverlay').classList.remove('hidden');
}

$('#replayBtn').addEventListener('click',()=>location.reload());
initOrder(); updateDrinkPreview(); setMcGraffPosition(); updateHUD();
