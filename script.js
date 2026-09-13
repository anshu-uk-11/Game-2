const Q=s=>document.querySelector(s),QA=s=>[...document.querySelectorAll(s)];
let lives=10,credits=0,streak=0,round=1,rolling=false,numbers=new Set(),size=null,parity=null;

let audioCtx=null;
function audioStart(){
  try{
    audioCtx=audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
  }catch(e){}
}
function diceSound(finalSound=false){
  if(!audioCtx)return;
  const now=audioCtx.currentTime;
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.type=finalSound?"triangle":"square";
  osc.frequency.setValueAtTime(finalSound?180:95,now);
  osc.frequency.exponentialRampToValueAtTime(finalSound?80:55,now+0.08);
  gain.gain.setValueAtTime(0.0001,now);
  gain.gain.exponentialRampToValueAtTime(finalSound?0.16:0.08,now+0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001,now+0.09);
  osc.connect(gain);gain.connect(audioCtx.destination);
  osc.start(now);osc.stop(now+0.1);
}


let audioCtx=null;
function audioStart(){
  try{
    audioCtx=audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==="suspended") audioCtx.resume();
  }catch(e){}
}
function diceRollSound(){
  if(!audioCtx)return;
  const now=audioCtx.currentTime;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type="square";
  o.frequency.setValueAtTime(120,now);
  o.frequency.exponentialRampToValueAtTime(65,now+0.12);
  g.gain.setValueAtTime(0.0001,now);
  g.gain.exponentialRampToValueAtTime(0.09,now+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,now+0.13);
  o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.14);
}
function diceResultSound(win){
  if(!audioCtx)return;
  const now=audioCtx.currentTime;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type="triangle";
  o.frequency.setValueAtTime(win?520:210,now);
  o.frequency.exponentialRampToValueAtTime(win?760:120,now+0.18);
  g.gain.setValueAtTime(0.0001,now);
  g.gain.exponentialRampToValueAtTime(0.12,now+0.015);
  g.gain.exponentialRampToValueAtTime(0.0001,now+0.22);
  o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.23);
}

const layouts={1:[[50,50]],2:[[25,25],[75,75]],3:[[25,25],[50,50],[75,75]],4:[[25,25],[75,25],[25,75],[75,75]],5:[[25,25],[75,25],[50,50],[25,75],[75,75]],6:[[25,25],[25,50],[25,75],[75,25],[75,50],[75,75]]};

for(let n=3;n<=18;n++){
 const b=document.createElement('button');b.type='button';b.className='num';b.textContent=n;
 b.addEventListener('click',()=>{
   if(rolling)return;
   if(numbers.has(n)){numbers.delete(n);b.classList.remove('selected')}
   else{if(numbers.size>=lives){notice('Not enough lives for another number choice.','loss');return}numbers.add(n);b.classList.add('selected')}
 });
 Q('#numbers').appendChild(b);
}
QA('.pick').forEach(b=>b.addEventListener('click',()=>{
 if(rolling)return; const k=b.dataset.kind,v=b.dataset.val;
 if(k==='size')size=size===v?null:v; else parity=parity===v?null:v;
 QA('.pick').forEach(x=>x.classList.toggle('selected',(x.dataset.kind==='size'?x.dataset.val===size:x.dataset.val===parity)));
}));

function draw(d,v){
 d.innerHTML='';
 for(const p of layouts[v]){const x=document.createElement('i');x.className='pip';x.style.left=p[0]+'%';x.style.top=p[1]+'%';d.appendChild(x)}
 d.dataset.v=v;
}
function notice(t,c=''){Q('#notice').textContent=t;Q('#notice').className='notice '+c}
function animate(type,sub){
 const box=Q('#resultAnimation');
 Q('#animationTitle').textContent=type==='win'?'WIN':'LOSS';
 Q('#animationSub').textContent=sub;
 Q('#medal').textContent=type==='win'?'✓':'−';
 box.className='result-animation '+type+' show';
 box.setAttribute('aria-hidden','false');
 setTimeout(()=>{box.className='result-animation '+type;box.setAttribute('aria-hidden','true')},1750);
}
function clearChoices(){
  numbers.clear(); size=null; parity=null;
  QA('.num,.pick').forEach(x=>x.classList.remove('selected'));
}
function addChip(label,win){
 const r=document.createElement('div');r.className='result-chip '+(win?'win':'loss');
 r.innerHTML='<span class="label">'+label+'</span><span class="state">'+(win?'✓ WIN':'✕ LOSS')+'</span>';
 Q('#resultList').appendChild(r);
}
function roll(){
 if(rolling||(!numbers.size&&!size&&!parity))return;
 audioStart();
 if(numbers.size>lives){notice('Not enough lives.','loss');return}
 rolling=true;audioStart();Q('#roll').disabled=true;QA('.die').forEach(d=>d.classList.add('rolling'));const soundLoop=setInterval(diceRollSound,180);diceRollSound();
 diceSound(false);
 const soundTimer=setInterval(()=>diceSound(false),180);
 const v=[1+Math.random()*6|0,1+Math.random()*6|0,1+Math.random()*6|0];
 setTimeout(()=>{
   clearInterval(soundTimer);
   diceSound(true);
   QA('.die').forEach((d,i)=>{d.classList.remove('rolling');draw(d,v[i])});
   const total=v[0]+v[1]+v[2],used=numbers.size;
   const results=[];
   lives-=used;

   if(numbers.size){
     const ok=numbers.has(total);
     results.push(['Number '+total,ok]);
     if(ok){lives+=2;credits+=10;streak++}else streak=0;
   }
   if(size){
     const ok=size==='small'?total<=10:total>=11;
     results.push([size==='small'?'SMALL':'BIG',ok]);
   }
   if(parity){
     const ok=parity==='even'?total%2===0:total%2!==0;
     results.push([parity.toUpperCase(),ok]);
   }

   Q('#resultList').innerHTML='';
   results.forEach(x=>addChip(x[0],x[1]));
   const wins=results.filter(x=>x[1]).map(x=>x[0]);
   const losses=results.filter(x=>!x[1]).map(x=>x[0]);
   const anyWin=wins.length>0;
   notice(anyWin?'Result checked — each choice is shown separately.':'All selected choices are LOSS.',''+(anyWin?'win':'loss'));

   // One animation for the round: golden if any selected choice wins, silver if all lose.
   animate(anyWin?'win':'loss',anyWin?wins.join(' + ')+' matched':'No selected choice matched');diceResultSound(anyWin);

   Q('#total').textContent=total;Q('#lives').textContent=lives;Q('#credits').textContent=credits;Q('#streak').textContent=streak;
   addHistory(v,total,results);
   round++;Q('#period').textContent=String(round).padStart(6,'0');
   clearChoices();rolling=false;Q('#roll').disabled=false;
 },900);
}
function addHistory(v,total,results){
 const wins=results.filter(x=>x[1]).map(x=>x[0]),losses=results.filter(x=>!x[1]).map(x=>x[0]);
 const r=document.createElement('div');r.className='history-row';
 r.innerHTML='<span>#'+round+'</span><span>🎲 '+v.join(' + ')+' = <b>'+total+'</b></span><span class="'+(wins.length?'win':'loss')+'">'+
 (wins.length?'WIN: '+wins.join(', '):'LOSS')+(losses.length?' • '+losses.join(', '):'')+'</span>';
 Q('#history').prepend(r);
 while(Q('#history').children.length>15)Q('#history').lastElementChild.remove();
}
QA('.die').forEach(d=>draw(d,1));
Q('#roll').addEventListener('click',roll);
Q('#lives').textContent=lives;Q('#credits').textContent=credits;Q('#streak').textContent=streak;

Q('#reset').addEventListener('click',()=>{
  if(rolling)return;
  clearChoices();
  Q('#resultList').innerHTML='<div class="empty">No result yet.</div>';
  Q('#total').textContent='—';
  notice('Choices reset. Select again and roll.');
});
