/* ==========================================================
   THE AETHERIAL GAUNTLET — game systems
   XP · levels · class select · quest board · achievements
   minimap · sound · keyboard · countdown · 2D particles
   No 3D assets: SVG parallax + CSS + 2D canvas only.
   ========================================================== */

(() => {
'use strict';

/* ---------------- state ---------------- */
const S = {
  started: false,
  xp: 0,
  level: 1,
  gold: 0,
  quests: 0,
  playerClass: null,
  accepted: new Set(),
  achieved: new Set(),
  sound: true,
  progress: 0,
  scrollY: 0,
  smoothScroll: 0,
  mouse: { x: 0.5, y: 0.5 },
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const LEVEL_FACTS = [
  "Techfest is Asia's Largest Science and Technology Festival.",
  "Held at IIT Bombay, Powai, Mumbai — 16 to 18 December 2026.",
  "The 30th edition theme is 'An Aetherial Renaissance'.",
  "Over 300 events run across the three days.",
  "Reach spans 2,500+ Indian and 500+ international colleges.",
  "Past speakers include Dr. A.P.J. Abdul Kalam and Jimmy Wales.",
  "Zonal rounds take the Gauntlet to cities across India before the final.",
  "Ignite accredits student technical bodies across the country.",
  "Over 1,75,000 people pass through the gates each edition.",
  "Entry to the Techfest campus is free and open to all.",
];

const ACHIEVEMENTS = {
  realm:    ["⚔", "WELCOME, CHALLENGER", "You have entered the Gauntlet."],
  quests:   ["✦", "BOARD DISCOVERED", "24 open quests. Choose your path."],
  vault:    ["◈", "VAULT BREACHED", "Skill scrolls unlocked."],
  zonals:   ["◉", "CARTOGRAPHER", "12 zonal cities mapped."],
  guilds:   ["⛨", "GUILD HALL ENTERED", "Ignite chapters await your college."],
  legends:  ["★", "HISTORY READ", "Four legends have stood here."],
  ledger:   ["≡", "LEDGER BALANCED", "The Gauntlet by the numbers."],
  enlist:   ["➤", "QUEST ACCEPTED", "Your journey begins in December."],
};

/* ---------------- audio (procedural, no assets) ---------------- */
let actx = null;
function tone(freq, dur = 0.09, type = 'sine', gain = 0.05) {
  if (!S.sound) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) { /* audio is optional */ }
}
const sfx = {
  hover:   () => tone(620, 0.05, 'sine', 0.022),
  pick:    () => { tone(700, 0.08, 'triangle', 0.05); setTimeout(() => tone(1050, 0.11, 'triangle', 0.045), 70); },
  accept:  () => { tone(520, 0.09, 'square', 0.035); setTimeout(() => tone(780, 0.13, 'square', 0.03), 80); },
  level:   () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.17, 'sine', 0.05), i * 85)); },
  boot:    () => { [392, 523, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 0.28, 'sine', 0.045), i * 130)); },
  achieve: () => { tone(880, 0.1, 'triangle', 0.04); setTimeout(() => tone(1320, 0.16, 'triangle', 0.035), 90); },
};

/* ---------------- toasts ---------------- */
const toastsEl = $('#toasts');
function toast(icon, title, text, cls = '') {
  if (!toastsEl) return;
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.innerHTML = '<span class="toast-icon">' + icon + '</span>' +
                 '<span class="toast-body"><span class="toast-title">' + title +
                 '</span><span class="toast-text">' + text + '</span></span>';
  toastsEl.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 420);
  }, 4600);
}

/* ==========================================================
   SVG SCENE — stars + parallax layers
   ========================================================== */

function buildStars() {
  const g = $('.stars');
  if (!g) return;
  const NS = 'http://www.w3.org/2000/svg';
  let out = '';
  for (let i = 0; i < 150; i++) {
    const x = (Math.random() * 1600).toFixed(0);
    const y = (Math.random() * 560).toFixed(0);
    const r = (Math.random() * 1.5 + 0.35).toFixed(2);
    const o = (Math.random() * 0.7 + 0.18).toFixed(2);
    const dur = (2.4 + Math.random() * 3.6).toFixed(1);
    const del = (Math.random() * 4).toFixed(1);
    out += '<circle class="star" cx="' + x + '" cy="' + y + '" r="' + r +
           '" opacity="' + o + '" style="animation-duration:' + dur +
           's;animation-delay:' + del + 's"/>';
  }
  g.innerHTML = out;
}

/* ==========================================================
   2D PARTICLE CANVAS — drifting motes + sparks
   ========================================================== */

function initParticles() {
  const cv = $('#particles');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let motes = [];

  function resize() {
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(120, W / 12));
    motes = Array.from({ length: n }, () => spawn(true));
  }
  function spawn(anywhere) {
    const palette = ['#ffd98a', '#7fe3ff', '#b07aff', '#ffffff'];
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: Math.random() * 1.8 + 0.5,
      vy: -(Math.random() * 0.32 + 0.08),
      vx: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.5 + 0.18,
      tw: Math.random() * Math.PI * 2,
      c: palette[Math.floor(Math.random() * palette.length)],
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    /* parallax drift with scroll velocity */
    const vel = Math.max(-40, Math.min(40, S.scrollY - S.smoothScroll));
    for (const m of motes) {
      m.tw += 0.02;
      m.y += m.vy - vel * 0.012;
      m.x += m.vx + Math.sin(m.tw) * 0.12;
      if (m.y < -12) Object.assign(m, spawn(false));
      const alpha = m.a * (0.55 + Math.sin(m.tw) * 0.45);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.c;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(draw);
}

/* ==========================================================
   HUD
   ========================================================== */

const hud = $('#hud'), minimap = $('#minimap'), replayBtn = $('#replayBtn');
const xpFill = $('#xpFill'), xpVal = $('#xpVal'), lvlBadge = $('#lvlBadge');
const goldVal = $('#goldVal'), questVal = $('#questVal'), className = $('#className');
const classGlyph = $('#classGlyph'), hudAvatar = $('.hud-avatar');

function updateHUD() {
  const per = 1000;
  const inLevel = S.xp % per;
  const pct = S.started ? (inLevel / per) * 100 : 0;
  if (xpFill) xpFill.style.width = pct + '%';
  if (xpVal) xpVal.textContent = Math.floor(inLevel) + ' / ' + per;
  if (lvlBadge) lvlBadge.textContent = 'LV ' + S.level;
  if (goldVal) goldVal.textContent = '₹' + S.gold.toLocaleString('en-IN');
  if (questVal) questVal.textContent = S.quests;
}

function levelUp(newLevel) {
  S.level = newLevel;
  if (lvlBadge) {
    lvlBadge.classList.add('bump');
    setTimeout(() => lvlBadge.classList.remove('bump'), 320);
  }
  sfx.level();
  const fact = LEVEL_FACTS[Math.min(newLevel - 2, LEVEL_FACTS.length - 1)];
  toast('▲', 'LEVEL ' + newLevel + ' REACHED', fact, 'lvlup');
  updateHUD();
}

/* ==========================================================
   COUNTDOWN — 16 Dec 2026, 09:00 IST
   ========================================================== */

const TARGET = new Date('2026-12-16T09:00:00+05:30').getTime();
const cdD = $('#cdD'), cdH = $('#cdH'), cdM = $('#cdM'), cdS = $('#cdS');

function tickCountdown() {
  const now = Date.now();
  let diff = TARGET - now;
  if (diff <= 0) {
    if (cdD) cdD.textContent = '00';
    if (cdH) cdH.textContent = '00';
    if (cdM) cdM.textContent = '00';
    if (cdS) cdS.textContent = '00';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const p = v => String(v).padStart(2, '0');
  if (cdD) cdD.textContent = p(d);
  if (cdH) cdH.textContent = p(h);
  if (cdM) cdM.textContent = p(m);
  if (cdS) cdS.textContent = p(s);
}
setInterval(tickCountdown, 1000);
tickCountdown();

/* ==========================================================
   CLASS SELECT
   ========================================================== */

const CLASS_META = {
  'ROBOTICS':  ['⚙', 'ROBOTICS'],
  'AI & CODE': ['◈', 'AI & CODE'],
  'AEROSPACE': ['▲', 'AEROSPACE'],
  'QUANT':     ['∑', 'QUANT'],
  'IDEAS':     ['✧', 'IDEAS'],
};

function pickClass(track) {
  S.playerClass = track;
  const meta = CLASS_META[track] || ['◇', track];
  if (className) className.textContent = meta[1];
  if (classGlyph) classGlyph.textContent = meta[0];
  if (hudAvatar) hudAvatar.classList.add('picked');
  $$('.cs-card').forEach(c => c.classList.toggle('picked', c.dataset.track === track));
  sfx.pick();
  toast(meta[0], 'PATH CHOSEN — ' + meta[1], 'The board now shows your path. Press ALL to see everything.');
  filterQuests(track);
}

$$('.cs-card').forEach(card => {
  card.addEventListener('mouseenter', sfx.hover);
  card.addEventListener('click', () => pickClass(card.dataset.track));
});

/* ==========================================================
   QUEST BOARD
   ========================================================== */

const questGrid = $('#questGrid');
const quests = $$('.quest', questGrid);
const boardNote = $('#boardNote');

/* total prize pool, computed from the real figures on the cards */
const totalPool = quests.reduce((sum, q) => {
  const raw = (q.dataset.prize || '').replace(/[^\d]/g, '');
  return sum + (raw ? parseInt(raw, 10) : 0);
}, 0);

function filterQuests(track) {
  let shown = 0;
  quests.forEach(q => {
    const match = track === 'ALL' || q.dataset.track === track;
    q.classList.toggle('hidden', !match);
    if (match) shown++;
  });
  if (boardNote) {
    boardNote.textContent = shown + ' QUEST' + (shown === 1 ? '' : 'S') + ' SHOWN' +
      (track !== 'ALL' ? ' · PATH: ' + track : '') +
      ' · TOTAL PRIZE POOL ON THE BOARD: ₹' + totalPool.toLocaleString('en-IN');
  }
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

$$('.track-btn').forEach(btn => {
  btn.addEventListener('mouseenter', sfx.hover);
  btn.addEventListener('click', () => {
    $$('.track-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const t = btn.dataset.track;
    S.playerClass = t === 'ALL' ? null : t;
    filterQuests(t);
    sfx.pick();
  });
});

/* accept a quest: first click accepts, second opens techfest.org */
quests.forEach(q => {
  const take = $('.quest-take', q);
  if (!take) return;
  take.addEventListener('mouseenter', sfx.hover);
  take.addEventListener('click', e => {
    const name = $('.quest-name', q) ? $('.quest-name', q).textContent : 'Quest';
    if (!S.accepted.has(name)) {
      e.preventDefault();
      S.accepted.add(name);
      S.quests++;
      const raw = (q.dataset.prize || '').replace(/[^\d]/g, '');
      const prize = raw ? parseInt(raw, 10) : 0;
      S.gold += prize;
      take.innerHTML = '<span>ACCEPTED ✓</span><span class="qt-arrow">↗</span>';
      take.style.borderColor = 'var(--jade)';
      take.style.color = 'var(--jade)';
      sfx.accept();
      toast('✦', 'QUEST ACCEPTED', name + (prize ? ' — ₹' + prize.toLocaleString('en-IN') + ' added to your purse.' : '.'));
      updateHUD();
    }
  });
});

/* ==========================================================
   ACHIEVEMENTS ON SECTION ENTRY
   ========================================================== */

function unlock(id) {
  if (S.achieved.has(id)) return;
  S.achieved.add(id);
  const a = ACHIEVEMENTS[id];
  if (!a) return;
  sfx.achieve();
  toast(a[0], 'ACHIEVEMENT — ' + a[1], a[2]);
}

/* ==========================================================
   MINIMAP
   ========================================================== */

const SECTIONS = $$('.panel[data-name], .foot');
const mmNodes = $('#mmNodes'), mmFill = $('#mmFill');

function buildMinimap() {
  if (!mmNodes) return;
  mmNodes.innerHTML = '';
  SECTIONS.forEach((sec, i) => {
    const el = document.createElement('div');
    el.className = 'mm-node';
    el.dataset.idx = i;
    el.innerHTML = '<span>' + (sec.dataset.name || 'FOOT') + '</span>';
    mmNodes.appendChild(el);
  });
}
buildMinimap();
const mmNodeEls = $$('.mm-node', mmNodes);

/* ==========================================================
   SCROLL ENGINE
   ========================================================== */

const layers = $$('.lyr');

function onScroll() {
  S.scrollY = window.scrollY;
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  S.progress = docH > 0 ? Math.min(1, S.scrollY / docH) : 0;

  /* XP from progress */
  if (S.started) {
    const targetXp = S.progress * 10000;
    if (targetXp > S.xp) {
      S.xp = targetXp;
      const lvl = Math.min(10, Math.floor(S.xp / 1000) + 1);
      if (lvl > S.level) levelUp(lvl);
      updateHUD();
    }
  }

  /* SVG parallax layers — each at its own speed */
  layers.forEach(l => {
    const sp = parseFloat(l.dataset.speed) || 0.3;
    l.style.transform = 'translate3d(' + (S.mouse.x - 0.5) * sp * -26 + 'px,' +
                        (-S.scrollY * sp * 0.28) + 'px,0)';
  });

  /* minimap */
  if (mmFill) mmFill.style.height = (S.progress * 100) + '%';
  const activeIdx = SECTIONS.findIndex(sec => {
    const r = sec.getBoundingClientRect();
    return r.top <= window.innerHeight * 0.5 && r.bottom >= window.innerHeight * 0.5;
  });
  mmNodeEls.forEach((n, i) => n.classList.toggle('on', i === activeIdx));

  /* achievements */
  if (activeIdx >= 0 && SECTIONS[activeIdx] && SECTIONS[activeIdx].id) {
    unlock(SECTIONS[activeIdx].id);
  }

  /* chrome */
  if (hud) hud.classList.toggle('up', S.scrollY > 40);
  if (minimap) minimap.classList.toggle('up', S.scrollY > 40);
  if (replayBtn) replayBtn.classList.toggle('up', S.scrollY > window.innerHeight * 1.2);
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ==========================================================
   SCROLL REVEAL
   ========================================================== */

function initReveal() {
  const targets = $$('.quest, .combo, .vault-item, .zonal, .guild, .legend, .stat, .track-btn, .cs-card, .perks li, .big-cta');
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = ((i % 8) * 55) + 'ms';
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => io.observe(el));
}

/* ==========================================================
   MOUSE PARALLAX
   ========================================================== */

window.addEventListener('mousemove', e => {
  S.mouse.x = e.clientX / window.innerWidth;
  S.mouse.y = e.clientY / window.innerHeight;
}, { passive: true });

/* ==========================================================
   KEYBOARD
   ========================================================== */

window.addEventListener('keydown', e => {
  if (!S.started) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
    return;
  }
  if (e.key >= '1' && e.key <= '5') {
    const tracks = ['ROBOTICS', 'AI & CODE', 'AEROSPACE', 'QUANT', 'IDEAS'];
    pickClass(tracks[parseInt(e.key, 10) - 1]);
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    const next = SECTIONS.find(s => s.getBoundingClientRect().top > window.innerHeight * 0.4);
    if (next) window.scrollTo({ top: next.offsetTop - 10, behavior: 'smooth' });
  }
  if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    const prev = [...SECTIONS].reverse().find(s => s.getBoundingClientRect().top < -window.innerHeight * 0.4);
    window.scrollTo({ top: prev ? prev.offsetTop - 10 : 0, behavior: 'smooth' });
  }
});

/* ==========================================================
   SOUND TOGGLE
   ========================================================== */

const soundBtn = $('#soundBtn');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    S.sound = !S.sound;
    soundBtn.classList.toggle('off', !S.sound);
    soundBtn.textContent = S.sound ? '♪' : '✕';
    if (S.sound) sfx.pick();
  });
}

/* ==========================================================
   BOOT
   ========================================================== */

const boot = $('#boot'), bootStart = $('#bootStart'), bootLoad = $('#bootLoad');

function startGame() {
  if (S.started) return;
  S.started = true;
  sfx.boot();
  if (boot) boot.classList.add('gone');
  document.body.classList.remove('locked');
  if (hud) hud.classList.add('up');
  if (minimap) minimap.classList.add('up');
  updateHUD();
  setTimeout(() => unlock('realm'), 700);
  setTimeout(() => {
    toast('✦', 'HOW TO PLAY', 'Scroll to earn XP and level up. Press 1–5 to choose a path. Accept quests to fill your purse.');
  }, 1500);
}

if (bootStart) bootStart.addEventListener('click', startGame);

/* boot progress bar */
let bp = 0;
const bootTick = setInterval(() => {
  bp += Math.random() * 16 + 6;
  if (bp >= 100) { bp = 100; clearInterval(bootTick); }
  if (bootLoad) bootLoad.style.width = bp + '%';
}, 130);

/* ==========================================================
   RESTART
   ========================================================== */

if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    S.accepted.forEach(n => n);
    S.xp = 0; S.level = 1; S.gold = 0; S.quests = 0;
    S.accepted.clear(); S.achieved.clear();
    $$('.quest-take').forEach(t => {
      t.innerHTML = '<span>ACCEPT QUEST</span><span class="qt-arrow">→</span>';
      t.style.borderColor = ''; t.style.color = '';
    });
    $$('.cs-card').forEach(c => c.classList.remove('picked'));
    S.playerClass = null;
    if (className) className.textContent = 'UNCLASSED';
    if (classGlyph) classGlyph.textContent = '◇';
    if (hudAvatar) hudAvatar.classList.remove('picked');
    $$('.track-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    filterQuests('ALL');
    updateHUD();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('↺', 'GAUNTLET RESET', 'Purse emptied, achievements cleared. Begin again.');
  });
}

/* ==========================================================
   INIT
   ========================================================== */

buildStars();
initParticles();
initReveal();
filterQuests('ALL');
updateHUD();
document.body.classList.add('locked');

/* let the scene breathe before the player presses start */
window.addEventListener('load', () => {
  onScroll();
  setTimeout(() => toast('◈', 'THE GAUNTLET AWAITS', 'Press START to enter the realm.'), 900);
});

console.log(
  '%cTHE AETHERIAL GAUNTLET%c\nTechfest 2026 · IIT Bombay · 30th Edition\n' +
  'XP: scroll to earn · Keys 1-5: choose path · Arrows: navigate\n' +
  'No 3D assets — SVG parallax, CSS, 2D canvas only.',
  'color:#d9a94c; font-size:15px; font-weight:bold; font-family:monospace;',
  'color:#9a93b8; font-size:12px; font-family:monospace;'
);

})();
