const $ = x => document.getElementById(x);

// ---------- core state ----------
let score = 0, streak = 0, lives = 10, best = +localStorage.diceBest || 0;
let round = 1, time = 30, locked = false, sel = new Set(), hist = [];

// ---------- credit / betting state ----------
const START_CREDITS = 500;
const MIN_BET = 10, MAX_BET = 200, BET_STEP = 10;
let credits = +localStorage.diceCredits || START_CREDITS;
let bet = 20;

// ---------- sound state ----------
let muted = false;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playRollSound() {
  if (muted) return;
  initAudio();
  const ctx = audioCtx;
  const duration = 0.55;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1400;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
  noise.stop(ctx.currentTime + duration);
}

function playLandSound() {
  if (muted) return;
  initAudio();
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

function playWinSound() {
  if (muted) return;
  initAudio();
  const ctx = audioCtx;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + i * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.09 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.09);
    osc.stop(ctx.currentTime + i * 0.09 + 0.3);
  });
}

// ---------- dice face rendering ----------
const faces = {
  1: ["p1"],
  2: ["p2", "p3"],
  3: ["p2", "p1", "p3"],
  4: ["p2", "p4", "p5", "p3"],
  5: ["p2", "p4", "p1", "p5", "p3"],
  6: ["p2", "p4", "p6", "p7", "p5", "p3"]
};
function die(el, n) {
  el.innerHTML = faces[n].map(x => `<i class="pip ${x}"></i>`).join("");
}

// ---------- number picker ----------
for (let n = 3; n <= 18; n++) {
  const b = document.createElement("button");
  b.className = "num";
  b.textContent = n;
  b.onclick = () => {
    if (locked) return;
    sel.has(n) ? (sel.delete(n), b.classList.remove("sel")) : (sel.add(n), b.classList.add("sel"));
    render();
  };
  $("numbers").append(b);
}

// ---------- payout logic ----------
function multiplier(count) {
  if (count <= 1) return 8;
  if (count === 2) return 5;
  if (count === 3) return 4;
  if (count === 4) return 3;
  return 2;
}

function render() {
  $("count").textContent = sel.size;
  $("chosen").textContent = sel.size ? [...sel].sort((a, b) => a - b).join(", ") : "None";
  if (sel.size) {
    const m = multiplier(sel.size);
    $("payoutPreview").textContent = `${bet} × ${m} = ${bet * m} credits`;
  } else {
    $("payoutPreview").textContent = "—";
  }
}

function stats() {
  $("credits").textContent = credits;
  $("score").textContent = score;
  $("streak").textContent = streak;
  $("lives").textContent = lives;
  $("best").textContent = best;
  $("round").textContent = String(round).padStart(2, "0");
  $("timer").textContent = time;
  $("roll").disabled = locked || credits < bet || sel.size === 0;
}

function historyAdd(total, pts, credChange, ok) {
  hist.unshift([round, [...sel].sort((a, b) => a - b).join(", "), total, pts, credChange, ok]);
  $("history").innerHTML = hist.slice(0, 10).map(h => `
    <div class="history-row">
      <span>#${h[0]}</span>
      <span>${h[1]}</span>
      <span class="${h[5] ? "win" : "miss"}">${h[2]} ${h[5] ? "✓" : "✕"}</span>
      <span class="${h[5] ? "win" : "miss"}">${h[4] >= 0 ? "+" : ""}${h[4]}</span>
    </div>`).join("");
}

// ---------- betting controls ----------
function setBet(v) {
  bet = Math.max(MIN_BET, Math.min(v, MAX_BET, credits || MIN_BET));
  $("betAmt").textContent = bet;
  document.querySelectorAll(".chips button[data-v]").forEach(b => {
    b.classList.toggle("active", +b.dataset.v === bet);
  });
  render();
  stats();
}

document.querySelectorAll(".chips button[data-v]").forEach(b => {
  b.onclick = () => { if (!locked) setBet(+b.dataset.v); };
});
$("betUp").onclick = () => { if (!locked) setBet(bet + BET_STEP); };
$("betDown").onclick = () => { if (!locked) setBet(bet - BET_STEP); };

// ---------- roll / round flow ----------
function roll() {
  if (locked || !sel.size || credits < bet) return;
  locked = true;
  credits -= bet;
  localStorage.diceCredits = credits;
  $("roll").disabled = true;
  $("status").textContent = "ROLLING…";
  playRollSound();
  stats();

  let t = 0;
  const a = setInterval(() => {
    for (let i = 1; i < 4; i++) die($("d" + i), 1 + Math.random() * 6 | 0);
    if (++t > 8) { clearInterval(a); finish(); }
  }, 80);
}

function finish() {
  const v = [1, 2, 3].map(() => 1 + Math.random() * 6 | 0);
  v.forEach((n, i) => { die($("d" + (i + 1)), n); $("v" + (i + 1)).textContent = n; });
  playLandSound();

  const total = v[0] + v[1] + v[2];
  const ok = sel.has(total);
  let pts = 0, credChange = -bet;

  $("total").textContent = total;

  if (ok) {
    streak++;
    pts = 100 + (streak % 2 === 0 ? 50 : 0);
    score += pts;
    const winnings = bet * multiplier(sel.size);
    credits += winnings;
    credChange = winnings - bet;
    if (score > best) { best = score; localStorage.diceBest = best; }
    $("status").textContent = "✓ CORRECT!";
    $("winText").textContent = `Perfect prediction — total ${total}! +${pts} points, +${winnings} credits`;
    $("win").classList.add("show");
    playWinSound();
  } else {
    streak = 0;
    lives--;
    $("status").textContent = "✕ MISS";
  }

  localStorage.diceCredits = credits;
  historyAdd(total, pts, credChange, ok);
  stats();
  setTimeout(next, ok ? 1300 : 600);
}

function next() {
  if (lives <= 0) {
    locked = true;
    $("roll").disabled = true;
    $("status").textContent = "GAME OVER — OUT OF LIVES";
    return;
  }
  if (credits < MIN_BET) {
    locked = true;
    $("roll").disabled = true;
    $("status").textContent = "GAME OVER — OUT OF CREDITS";
    return;
  }
  round++;
  time = 30;
  sel.clear();
  document.querySelectorAll(".num").forEach(x => x.classList.remove("sel"));
  locked = false;
  setBet(Math.min(bet, credits));
  render();
  stats();
}

function reset() {
  score = 0; streak = 0; lives = 10; round = 1; time = 30; locked = false;
  sel.clear(); hist = [];
  credits = START_CREDITS;
  localStorage.diceCredits = credits;
  bet = 20;
  $("history").innerHTML = "";
  document.querySelectorAll(".num").forEach(x => x.classList.remove("sel"));
  $("total").textContent = "—";
  $("status").textContent = "SELECT YOUR NUMBERS";
  $("win").classList.remove("show");
  [1, 2, 3].forEach(i => { $("d" + i).innerHTML = ""; $("v" + i).textContent = "?"; });
  setBet(bet);
  render();
  stats();
}

// ---------- wiring ----------
$("roll").onclick = roll;
$("reset").onclick = reset;
$("cont").onclick = () => { $("win").classList.remove("show"); next(); };
$("clear").onclick = () => { $("history").innerHTML = ""; hist = []; };
$("mute").onclick = () => {
  muted = !muted;
  $("mute").textContent = muted ? "🔇" : "🔊";
};

setInterval(() => {
  if (!locked) {
    if (time > 0) time--;
    if (time === 0 && sel.size) roll();
    stats();
  }
}, 1000);

setBet(bet);
render();
stats();
