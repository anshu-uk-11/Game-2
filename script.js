const livesEl=document.getElementById("lives"),scoreEl=document.getElementById("score"),streakEl=document.getElementById("streak"),timerEl=document.getElementById("timer"),roundEl=document.getElementById("round"),totalEl=document.getElementById("total"),rollBtn=document.getElementById("rollBtn"),numbersEl=document.getElementById("numbers"),selectedCountEl=document.getElementById("selectedCount"),usedLivesEl=document.getElementById("usedLives"),resultCard=document.getElementById("resultCard"),resultTitle=document.getElementById("resultTitle"),resultText=document.getElementById("resultText"),historyEl=document.getElementById("history");
let lives=10,score=0,streak=0,round=1,timer=30,rolling=false;
let selectedNumbers=new Set(), selectedSize=null, selectedParity=null;

for(let n=3;n<=18;n++){const b=document.createElement("button");b.className="num";b.textContent=n;b.dataset.number=n;b.onclick=()=>toggleNumber(n,b);numbersEl.appendChild(b)}
document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>{if(rolling)return;const kind=b.dataset.kind;if(kind==="size"){selectedSize=selectedSize===b.dataset.value?null:b.dataset.value;document.querySelectorAll('[data-kind="size"]').forEach(x=>x.classList.toggle("selected",x===b&&selectedSize));}else{selectedParity=selectedParity===b.dataset.value?null:b.dataset.value;document.querySelectorAll('[data-kind="parity"]').forEach(x=>x.classList.toggle("selected",x===b&&selectedParity));}updateSelection()});

function toggleNumber(n,b){if(rolling)return;if(selectedNumbers.has(n)){selectedNumbers.delete(n);b.classList.remove("selected")}else{if(lives-selectedNumbers.size<=0){showMessage("NO LIVES LEFT","You cannot select more numbers than your current lives.");return}selectedNumbers.add(n);b.classList.add("selected")}updateSelection()}
function updateSelection(){selectedCountEl.textContent=selectedNumbers.size;usedLivesEl.textContent=selectedNumbers.size;rollBtn.disabled=rolling||(!selectedNumbers.size&&!selectedSize&&!selectedParity)}
function clearChoices(){selectedNumbers.clear();selectedSize=null;selectedParity=null;document.querySelectorAll(".num,.choice").forEach(x=>x.classList.remove("selected"));updateSelection()}
function showMessage(t,txt,cls=""){resultCard.className="result-card "+cls;resultTitle.textContent=t;resultText.textContent=txt}

function setDie(el,v){el.dataset.value=v}
function roll(){if(rolling)return;const used=selectedNumbers.size;if(!used&&!selectedSize&&!selectedParity)return;if(used>lives){showMessage("NOT ENOUGH LIVES","Choose fewer numbers.");return}rolling=true;rollBtn.disabled=true;
const dice=[...document.querySelectorAll(".dice")];dice.forEach(d=>d.classList.add("rolling"));
const vals=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
setTimeout(()=>{dice.forEach((d,i)=>{d.classList.remove("rolling");setDie(d,vals[i])});const total=vals.reduce((a,b)=>a+b,0);totalEl.textContent=total;resolve(total,used);rolling=false;},900)}
function resolve(total,used){lives-=used;let wins=[],losses=[];if(selectedNumbers.size){if(selectedNumbers.has(total)){wins.push("Number");}else losses.push("Number")}
if(selectedSize){const actual=total<=10?"small":"big";(actual===selectedSize?wins:losses).push(selectedSize.toUpperCase())}
if(selectedParity){const actual=total%2===0?"even":"odd";(actual===selectedParity?wins:losses).push(selectedParity.toUpperCase())}
const anyWin=wins.length>0; if(anyWin){lives+=2;score+=100*wins.length;streak++;showMessage("WIN ✓",`Total ${total} • ${wins.join(", ")} correct • +2 lives`, "win")}else{streak=0;showMessage("LOSS ✕",`Total ${total} • ${losses.join(", ")} wrong`, "loss")}
livesEl.textContent=lives;scoreEl.textContent=score;streakEl.textContent=streak;addHistory(total,valsFromDice(),anyWin,wins);round++;roundEl.textContent=round;clearChoices();timer=30;timerEl.textContent=timer}
function valsFromDice(){return [...document.querySelectorAll(".dice")].map(d=>d.dataset.value).join(" + ")}
function addHistory(total,dice,win,wins){if(historyEl.classList.contains("history-empty"))historyEl.innerHTML="";const row=document.createElement("div");row.className="history-item";row.innerHTML=`<span>#${round} &nbsp; 🎲 ${dice} = <b>${total}</b></span><span class="${win?"win-text":"loss-text"}">${win?"WIN":"LOSS"}</span>`;historyEl.prepend(row);while(historyEl.children.length>12)historyEl.lastChild.remove()}
rollBtn.onclick=roll;
setInterval(()=>{if(rolling)return;timer--;if(timer<=0){if(selectedNumbers.size||selectedSize||selectedParity)roll();else timer=30}timerEl.textContent=timer},1000);
updateSelection();