'use strict';

/* ================= ICONS ================= */
const ICON_COPY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const ICON_SUN = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const ICON_EYE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_EYE_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';

/* ================= CONSTANTS ================= */
const SEGMENT_COUNT = 10;

const COLOR_FOR_LABEL = {
  'Very Weak': '#ff3b5c',
  'Weak': '#ff8a3d',
  'Medium': '#ffc63d',
  'Strong': '#38d96a',
  'Very Strong': '#00e5a0',
  'No Password': '#5d6b82',
};

/* ================= HELPERS ================= */
const $ = (id) => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;

function animateValue(el, to, duration = 260) {
  const from = parseInt(el.dataset.prev || '0', 10);
  el.dataset.prev = String(to);
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / duration);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(lerp(from, to, ease));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      console.error('Clipboard error:', e);
      return false;
    }
  }
}

let toastTimer;
function showToast(message, ok = true) {
  const toast = $('toast');
  toast.textContent = (ok ? '✓ ' : '') + message;
  toast.style.borderColor = ok ? 'var(--accent)' : 'var(--bad)';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function makeSegments(wrapper) {
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const seg = document.createElement('div');
    seg.className = 'segment';
    wrapper.appendChild(seg);
  }
  return wrapper.querySelectorAll('.segment');
}

function updateRangeFill(input, valueEl) {
  const min = parseFloat(input.min);
  const max = parseFloat(input.max);
  const pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
  input.style.setProperty('--val', pct + '%');
  if (valueEl) valueEl.textContent = input.value;
}

function flashCopied(btn) {
  btn.classList.add('copied');
  btn.innerHTML = '✓';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = ICON_COPY;
  }, 1200);
}

/* ================= PARTICLE BACKGROUND ================= */
function initParticles(canvas) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  let w, h, running = true;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = window.innerWidth < 600 ? 32 : 55;
  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.35 + 0.1),
      o: Math.random() * 0.45 + 0.1,
      tw: Math.random() * Math.PI * 2,
    });
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.02;
      if (p.y < -12) { p.y = h + 12; p.x = Math.random() * w; }
      if (p.x < -12) p.x = w + 12;
      if (p.x > w + 12) p.x = -12;
      const alpha = p.o * (0.6 + 0.4 * Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; requestAnimationFrame(tick); }
  });

  requestAnimationFrame(tick);
}

/* ================= THEME ================= */
const themeToggle = $('themeToggle');
const themeIcon = $('themeIcon');

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('pw-theme', theme);
  themeIcon.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
}
themeToggle.addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('pw-theme') || 'dark');

/* ================= TABS ================= */
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel').forEach((panel) => {
      const show = panel.id === 'panel-' + btn.dataset.tab;
      if (show) {
        panel.hidden = false;
        panel.classList.remove('enter');
        void panel.offsetWidth;
        panel.classList.add('enter');
      } else {
        panel.hidden = true;
      }
    });
  });
});

/* ================= ANALYZER ================= */
const passwordInput = $('passwordInput');
const toggleBtn = $('toggleBtn');
const eyeIcon = $('eyeIcon');
const segmentsWrapper = $('segments');
const strengthLabel = $('strengthLabel');
const scoreLabel = $('scoreLabel');
const entropyValue = $('entropyValue');
const crackTimeValue = $('crackTimeValue');
const compositionEl = $('composition');
const fingerprintValue = $('fingerprintValue');
const checksList = $('checksList');
const suggestionsList = $('suggestionsList');

const segmentEls = makeSegments(segmentsWrapper);
let debounceTimer = null;

passwordInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => analyzePassword(passwordInput.value), 60);
});

toggleBtn.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeIcon.innerHTML = isPassword ? ICON_EYE_OFF : ICON_EYE;
});

function renderComposition(comp) {
  const total = comp.lowercase + comp.uppercase + comp.digits + comp.special;
  compositionEl.innerHTML = '';
  if (total === 0) {
    const empty = document.createElement('span');
    empty.className = 'comp-empty';
    empty.textContent = 'No characters yet';
    compositionEl.appendChild(empty);
    return;
  }
  const bar = document.createElement('div');
  bar.className = 'comp-bar';
  const parts = [
    { c: '#16a34a', v: comp.lowercase, t: 'lower' },
    { c: '#4ade80', v: comp.uppercase, t: 'upper' },
    { c: '#0e7490', v: comp.digits, t: 'digit' },
    { c: '#dc2626', v: comp.special, t: 'special' },
  ];
  parts.filter((p) => p.v > 0).forEach((p) => {
    const seg = document.createElement('div');
    seg.style.width = ((p.v / total) * 100).toFixed(2) + '%';
    seg.style.background = p.c;
    bar.appendChild(seg);
  });
  compositionEl.appendChild(bar);

  const legend = document.createElement('div');
  legend.className = 'comp-legend';
  parts.forEach((p) => {
    const item = document.createElement('span');
    const dot = document.createElement('i');
    dot.style.background = p.c;
    item.appendChild(dot);
    item.appendChild(document.createTextNode(`${p.t} ${p.v}`));
    legend.appendChild(item);
  });
  compositionEl.appendChild(legend);
}

function renderChecks(checks) {
  checksList.innerHTML = '';
  checks.forEach((check, i) => {
    const div = document.createElement('div');
    div.className = 'check-item ' + (check.passed ? 'check-pass' : 'check-fail');
    div.innerHTML = `<span class="check-icon">${check.passed ? '✓' : '✗'}</span><span></span>`;
    div.lastChild.textContent = check.label;
    div.style.transitionDelay = `${i * 20}ms`;
    checksList.appendChild(div);
    requestAnimationFrame(() => div.classList.add('enter'));
  });
}

function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = '';
  suggestions.forEach((s, i) => {
    const li = document.createElement('li');
    li.textContent = s;
    li.style.transitionDelay = `${i * 20}ms`;
    suggestionsList.appendChild(li);
    requestAnimationFrame(() => li.classList.add('enter'));
  });
}

function renderSegments(els, score, color, count = SEGMENT_COUNT) {
  const filled = Math.round((score / 100) * count);
  els.forEach((seg, i) => {
    if (i < filled) {
      seg.classList.add('filled');
      seg.style.background = color;
      seg.style.transitionDelay = `${i * 12}ms`;
    } else {
      seg.classList.remove('filled');
      seg.style.background = '';
      seg.style.transitionDelay = '0ms';
    }
  });
}

function renderResult(data, targets) {
  const t = targets;
  const isNoPass = data.label === 'No Password';
  const color = COLOR_FOR_LABEL[data.label] || '#5d6b82';

  renderSegments(t.segmentEls, data.score, color);

  if (t.strengthLabel) {
    t.strengthLabel.textContent = isNoPass ? 'AWAITING INPUT' : data.label.toUpperCase();
    t.strengthLabel.style.color = isNoPass ? '' : color;
    t.strengthLabel.style.borderColor = isNoPass ? '' : color;
  }

  if (t.scoreLabel) animateValue(t.scoreLabel, data.score);
  if (t.entropyEl) t.entropyEl.textContent = `${data.entropy} bits`;
  if (t.crackEl) t.crackEl.textContent = data.crack_time;
  if (t.compositionEl) renderComposition(data.composition || { lowercase: 0, uppercase: 0, digits: 0, special: 0 });
  if (t.fingerprintEl) {
    t.fingerprintEl.textContent = data.fingerprint || '—';
    t.fingerprintEl.title = data.fingerprint || '';
  }
  if (t.checksList) renderChecks(data.checks);
  if (t.suggestionsList) renderSuggestions(data.suggestions);
}

async function analyzePassword(password) {
  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    renderResult(data, {
      segmentEls,
      strengthLabel,
      scoreLabel,
      entropyEl: entropyValue,
      crackEl: crackTimeValue,
      compositionEl,
      fingerprintEl: fingerprintValue,
      checksList,
      suggestionsList,
    });
  } catch (err) {
    console.error('Error analyzing password:', err);
  }
}

analyzePassword('');

/* "/" focuses the analyzer input */
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    passwordInput.focus();
  }
});

/* ================= GENERATOR ================= */
const genLength = $('genLength');
const genLengthValue = $('genLengthValue');
const optUpper = $('optUpper');
const optLower = $('optLower');
const optDigits = $('optDigits');
const optSpecial = $('optSpecial');
const optAmbiguous = $('optAmbiguous');
const generateBtn = $('generateBtn');
const genOutputWrapper = $('genOutputWrapper');
const genOutputText = $('genOutputText');
const regenBtn = $('regenBtn');
const copyBtn = $('copyBtn');
const genSegmentsWrapper = $('genSegments');
const genStrengthLabel = $('genStrengthLabel');
const genScoreLabel = $('genScoreLabel');
const historySection = $('historySection');
const historyList = $('historyList');

const genSegmentEls = makeSegments(genSegmentsWrapper);
const history = [];

function renderHistory() {
  historySection.hidden = history.length === 0;
  historyList.innerHTML = '';
  history.forEach((h, i) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.style.animationDelay = `${i * 40}ms`;

    const idx = document.createElement('span');
    idx.className = 'history-idx mono';
    idx.textContent = String(i + 1).padStart(2, '0');

    const pw = document.createElement('span');
    pw.className = 'history-pw';
    pw.textContent = h.password;
    pw.title = h.password;

    const chip = document.createElement('span');
    chip.className = 'history-chip';
    chip.textContent = h.score;
    chip.style.color = h.color;
    chip.style.borderColor = h.color;

    const cp = document.createElement('button');
    cp.className = 'mini-copy';
    cp.innerHTML = ICON_COPY;
    cp.title = 'Copy';
    cp.addEventListener('click', async () => {
      if (await copyText(h.password)) {
        showToast('Copied to clipboard');
        flashCopied(cp);
      }
    });

    li.append(idx, pw, chip, cp);
    historyList.appendChild(li);
  });
}

function addToHistory(password, score, label) {
  history.unshift({ password, score, color: COLOR_FOR_LABEL[label] || '#5d6b82' });
  if (history.length > 8) history.pop();
  renderHistory();
}

updateRangeFill(genLength, genLengthValue);
genLength.addEventListener('input', () => updateRangeFill(genLength, genLengthValue));

async function generatePassword() {
  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        length: parseInt(genLength.value, 10),
        use_upper: optUpper.checked,
        use_lower: optLower.checked,
        use_digits: optDigits.checked,
        use_special: optSpecial.checked,
        exclude_ambiguous: optAmbiguous.checked,
      }),
    });
    const data = await response.json();

    genOutputWrapper.hidden = false;
    genOutputWrapper.classList.remove('enter');
    void genOutputWrapper.offsetWidth;
    genOutputWrapper.classList.add('enter');

    if (data.error) {
      genOutputText.textContent = data.error;
      genOutputText.style.color = 'var(--bad)';
      return;
    }

    genOutputText.style.color = '';
    genOutputText.textContent = data.password;
    copyBtn.classList.remove('copied');
    copyBtn.innerHTML = ICON_COPY;

    renderResult(data.analysis, {
      segmentEls: genSegmentEls,
      strengthLabel: genStrengthLabel,
      scoreLabel: genScoreLabel,
      entropyEl: null,
      crackEl: null,
      compositionEl: null,
      fingerprintEl: null,
      checksList: null,
      suggestionsList: null,
    });

    addToHistory(data.password, data.analysis.score, data.analysis.label);
  } catch (err) {
    console.error('Error generating password:', err);
    showToast('Generation failed', false);
  }
}

generateBtn.addEventListener('click', generatePassword);
regenBtn.addEventListener('click', generatePassword);

copyBtn.addEventListener('click', async () => {
  if (await copyText(genOutputText.textContent)) {
    showToast('Password copied to clipboard');
    flashCopied(copyBtn);
  }
});

/* ================= PASSPHRASE ================= */
const ppWords = $('ppWords');
const ppWordsValue = $('ppWordsValue');
const ppSepGroup = $('ppSepGroup');
const ppCap = $('ppCap');
const ppDigit = $('ppDigit');
const ppGenerateBtn = $('ppGenerateBtn');
const ppOutputWrapper = $('ppOutputWrapper');
const ppOutputText = $('ppOutputText');
const ppCopyBtn = $('ppCopyBtn');
const ppSegmentsWrapper = $('ppSegments');
const ppStrengthLabel = $('ppStrengthLabel');
const ppScoreLabel = $('ppScoreLabel');

const ppSegmentEls = makeSegments(ppSegmentsWrapper);
let ppSeparator = '-';

ppSepGroup.querySelectorAll('.pp-sep-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    ppSepGroup.querySelectorAll('.pp-sep-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    ppSeparator = btn.dataset.sep;
  });
});

updateRangeFill(ppWords, ppWordsValue);
ppWords.addEventListener('input', () => updateRangeFill(ppWords, ppWordsValue));

ppGenerateBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/generate_passphrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        words: parseInt(ppWords.value, 10),
        separator: ppSeparator,
        capitalize: ppCap.checked,
        add_digit: ppDigit.checked,
      }),
    });
    const data = await response.json();

    ppOutputWrapper.hidden = false;
    ppOutputWrapper.classList.remove('enter');
    void ppOutputWrapper.offsetWidth;
    ppOutputWrapper.classList.add('enter');

    ppOutputText.textContent = data.password;
    ppCopyBtn.classList.remove('copied');
    ppCopyBtn.innerHTML = ICON_COPY;

    renderResult(data.analysis, {
      segmentEls: ppSegmentEls,
      strengthLabel: ppStrengthLabel,
      scoreLabel: ppScoreLabel,
      entropyEl: null,
      crackEl: null,
      compositionEl: null,
      fingerprintEl: null,
      checksList: null,
      suggestionsList: null,
    });
  } catch (err) {
    console.error('Error generating passphrase:', err);
    showToast('Generation failed', false);
  }
});

ppCopyBtn.addEventListener('click', async () => {
  if (await copyText(ppOutputText.textContent)) {
    showToast('Passphrase copied to clipboard');
    flashCopied(ppCopyBtn);
  }
});

/* ================= DATA RAIN ================= */
function initDataRain(canvas) {
  const ctx = canvas.getContext('2d');
  const chars = '0123456789ABCDEF';
  const drops = [];
  let w, h, running = true;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(70, Math.max(24, Math.floor(w / 55)));
    drops.length = 0;
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        ch: chars[Math.floor(Math.random() * chars.length)],
        speed: Math.random() * 0.55 + 0.2,
        size: Math.random() * 8 + 11,
        o: Math.random() * 0.3 + 0.1,
        change: Math.random() * 0.02 + 0.005,
      });
    }
  }
  resize();
  window.addEventListener('resize', resize);

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    const light = document.body.dataset.theme === 'light';
    const base = light ? 'rgba(22, 163, 74,' : 'rgba(34, 197, 94,';
    const cap = light ? 0.3 : 0.5;
    for (const d of drops) {
      d.y -= d.speed;
      if (Math.random() < d.change) d.ch = chars[Math.floor(Math.random() * chars.length)];
      if (d.y < -26) { d.y = h + 26; d.x = Math.random() * w; }
      ctx.font = `${d.size}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = base + Math.min(cap, d.o) + ')';
      ctx.fillText(d.ch, d.x, d.y);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; requestAnimationFrame(tick); }
  });

  requestAnimationFrame(tick);
}

/* ================= INIT ================= */
initParticles($('particles'));
initDataRain($('dataRain'));
