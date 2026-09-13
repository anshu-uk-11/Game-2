const Q=s=>document.querySelector(s),QA=s=>[...document.querySelectorAll(s)];
let lives=10,credits=0,streak=0,round=1,rolling=false,numbers=new Set(),size=null,parity=null;

let audioCtx = null;

function audioStart(){
  try{
    if(!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return false;
      audioCtx = new AC();
    }
    if(audioCtx.state === "suspended") audioCtx.resume();
    return true;
  }catch(e){
    console.log("Audio unavailable:", e);
    return false;
  }
}

function playTone(freq, duration=0.08, type="square", volume=0.045, delay=0){
  if(!audioCtx) return;
  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.015);
}

function diceRollSound(){
  if(!audioCtx) return;
  playTone(180 + Math.random()*80, 0.055, "square", 0.035);
}

function diceResultSound(win){
  if(!audioCtx) return;
  if(win){
    playTone(520, 0.10, "sine", 0.06, 0);
    playTone(660, 0.10, "sine", 0.06, 0.11);
    playTone(820, 0.16, "sine", 0.065, 0.22);
  }else{
    playTone(220, 0.12, "sawtooth", 0.045, 0);
    playTone(165, 0.18, "sawtooth", 0.04, 0.13);
  }
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
 for(const p of lay
