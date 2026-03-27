/* =============================================
   DAWWAR – دوّر | Game Logic
   ============================================= */

// ── STATE ─────────────────────────────────────
let state = {
  players: [],
  currentPlayerIndex: 0,

  // Question pool
  questions: [],
  categories: [],
  usedQuestionIds: new Set(),
  questionRepeatCounts: {},

  // Settings
  timerDuration: 30,
  skipLimitPerPlayer: 1,
  questionsPerPlayer: 0,
  selectedCategories: [],
  customOnly: false,

  // Session stats
  timerInterval: null,
  timerRemaining: 30,
  questionCount: 0,
  skippedCount: 0,
  penaltyCount: 0,

  // Per-player tracking
  playerSkipsUsed: {},
  playerQuestionCounts: {},

  // Custom questions
  setupCustomQuestions: [],
  selectedModalCat: null,
  globalRepeatLimit: 1,     // applies to ALL questions; 0 = unlimited
  anonymousMode: false,     // current modal anonymous toggle

  // Anti-repeat tracking — keeps last N question IDs
  recentQuestionIds: [],

  pendingTimesUpPlayer: ''
};

// ── DOM CACHE ─────────────────────────────────
// Cached references to hot-path elements (timer, question, player name)
const $ = {};

function initDOMCache() {
  $.timerCircle    = document.getElementById('timer-circle');
  $.timerDisplay   = document.getElementById('timer-display');
  $.timerRingWrap  = document.querySelector('.timer-ring-wrap');
  $.questionText   = document.getElementById('question-text');
  $.questionCatTag = document.getElementById('question-category');
  $.catEmoji       = document.getElementById('cat-emoji');
  $.catName        = document.getElementById('cat-name');
  $.currentPlayer  = document.getElementById('current-player-name');
  $.skipBtn        = document.getElementById('skip-btn');
  $.skipLabel      = document.getElementById('skip-remaining-label');
  $.questionCntr   = document.getElementById('question-counter');
}

// ── CRYPTO RANDOM ─────────────────────────────
function rnd() {
  if (window.crypto?.getRandomValues) {
    const a = new Uint32Array(1);
    window.crypto.getRandomValues(a);
    return a[0] / 4294967296;
  }
  return Math.random();
}

// Double-pass Fisher-Yates with crypto entropy — much crazier than once
function shuffle(arr) {
  const a = [...arr];
  for (let pass = 0; pass < 2; pass++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  initDOMCache();
  setupTimerOptions();
  setupQppOptions();
  setupSkipOptions();
  setupRepeatOptions();
  setupPlayerInput();
  buildCategoryFilter();
  buildModalCategoryPicker();
  setupCustomSettings();
  setupDraggablePanel();
});

// ── DRAGGABLE SETUP PANEL ─────────────────────
function setupDraggablePanel() {
  const panel   = document.querySelector('.setup-panel');
  const handle  = panel.querySelector('.modal-handle');
  const screen  = document.getElementById('screen-welcome');

  let dragging   = false;
  let startY     = 0;
  let startTop   = 0;
  let currentTop = 0;  // px from top of screen

  // Compute the default (collapsed) top — logo header height
  function getDefaultTop() {
    const header = document.querySelector('.welcome-logo-header');
    return header ? header.getBoundingClientRect().bottom : 180;
  }

  function getFullTop() {
    return 24; // leave a small gap at the very top
  }

  function applyTop(top, animate) {
    const screenH = screen.getBoundingClientRect().height;
    top = Math.max(getFullTop(), Math.min(top, getDefaultTop()));
    currentTop = top;
    panel.style.transition = animate ? 'top .3s cubic-bezier(.34,1.2,.64,1)' : 'none';
    panel.style.top        = top + 'px';
    panel.style.height     = (screenH - top) + 'px';
    panel.style.position   = 'absolute';
    panel.style.left       = '0';
    panel.style.right      = '0';
  }

  function snapToNearest() {
    const mid = (getDefaultTop() + getFullTop()) / 2;
    applyTop(currentTop < mid ? getFullTop() : getDefaultTop(), true);
  }

  // ── TOUCH ──
  handle.addEventListener('touchstart', e => {
    dragging = true;
    startY   = e.touches[0].clientY;
    startTop = currentTop || getDefaultTop();
    panel.style.transition = 'none';
    panel.style.overflowY  = 'hidden'; // prevent scroll while dragging
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy  = e.touches[0].clientY - startY;
    applyTop(startTop + dy, false);
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.overflowY = 'auto';
    snapToNearest();
  });

  // ── MOUSE (desktop) ──
  handle.addEventListener('mousedown', e => {
    dragging = true;
    startY   = e.clientY;
    startTop = currentTop || getDefaultTop();
    panel.style.transition = 'none';
    panel.style.overflowY  = 'hidden';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    applyTop(startTop + dy, false);
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.overflowY = 'auto';
    snapToNearest();
  });

  // Init at default position
  applyTop(getDefaultTop(), false);
}

// ── LOAD QUESTIONS ────────────────────────────
async function loadQuestions() {
  try {
    const res  = await fetch('./data/questions.json');
    const data = await res.json();
    state.questions  = data.questions;
    state.categories = data.categories;
  } catch (e) {
    console.warn('Using fallback questions');
    state.categories = [
      { id: 'general', name: 'عام', emoji: '💬', color: '#FF6B35' }
    ];
    state.questions = [
      { id: 1, text: 'قول حاجة مش حد هنا عارفها عنك',    category: 'general' },
      { id: 2, text: 'إيه أحلى ذكرى عندك مع ناس هنا؟', category: 'general' }
    ];
  }
}

// ── SETUP: TIMER OPTIONS ──────────────────────
function setupTimerOptions() {
  document.querySelectorAll('#timer-options .seg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#timer-options .seg-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.timerDuration = parseInt(btn.dataset.seconds);
      // Clear custom timer input
      const ci = document.getElementById('custom-timer');
      if (ci) ci.value = '';
    });
  });
}

// ── SETUP: QUESTIONS PER PLAYER ───────────────
function setupQppOptions() {
  document.querySelectorAll('#qpp-options .seg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#qpp-options .seg-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.questionsPerPlayer = parseInt(btn.dataset.qpp);
      const ci = document.getElementById('custom-qpp');
      if (ci) ci.value = '';
    });
  });
}

// ── SETUP: SKIP OPTIONS ───────────────────────
function setupSkipOptions() {
  document.querySelectorAll('#skip-options .seg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#skip-options .seg-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.skipLimitPerPlayer = parseInt(btn.dataset.skips);
      const ci = document.getElementById('custom-skips');
      if (ci) ci.value = '';
    });
  });
}

// ── SETUP: REPEAT OPTIONS (moved from modal) ──
function setupRepeatOptions() {
  document.querySelectorAll('#repeat-options .seg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#repeat-options .seg-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.globalRepeatLimit = parseInt(btn.dataset.repeat);
      const ci = document.getElementById('custom-repeat');
      if (ci) ci.value = '';
    });
  });
}

// ── SETUP: PLAYER INPUT ───────────────────────
function setupPlayerInput() {
  const input = document.getElementById('player-input');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });
}

// ── SETUP: CUSTOM SETTINGS ────────────────────
function setupCustomSettings() {
  // Custom timer (seconds)
  document.getElementById('custom-timer').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 5 && val <= 300) {
      state.timerDuration = val;
      document.querySelectorAll('#timer-options .seg-opt').forEach(b => b.classList.remove('active'));
    }
  });

  // Custom questions per player
  document.getElementById('custom-qpp').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 1 && val <= 50) {
      state.questionsPerPlayer = val;
      document.querySelectorAll('#qpp-options .seg-opt').forEach(b => b.classList.remove('active'));
    } else if (this.value === '') {
      // revert to whatever seg option was active
    }
  });

  // Custom skips per player (0 = unlimited = 99)
  document.getElementById('custom-skips').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      state.skipLimitPerPlayer = val === 0 ? 99 : val;
      document.querySelectorAll('#skip-options .seg-opt').forEach(b => b.classList.remove('active'));
    }
  });

  // Custom repeat count for all questions
  document.getElementById('custom-repeat').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      state.globalRepeatLimit = val;
      document.querySelectorAll('#repeat-options .seg-opt').forEach(b => b.classList.remove('active'));
    }
  });
}

// ── CUSTOM SETTINGS TOGGLE ────────────────────
function toggleCustomSettings() {
  const section = document.getElementById('custom-settings-section');
  section.classList.toggle('open');
}

// ── CATEGORY FILTER (setup screen) ───────────
function buildCategoryFilter() {
  const wrap = document.getElementById('cat-filter-wrap');
  if (!wrap) return;
  const frag = document.createDocumentFragment();

  const allBtn = document.createElement('button');
  allBtn.className = 'cat-filter-btn all-btn active';
  allBtn.dataset.cat = 'all';
  allBtn.textContent = '🌟 الكل';
  allBtn.addEventListener('click', () => selectCategoryFilter('all', allBtn));
  frag.appendChild(allBtn);

  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-filter-btn';
    btn.dataset.cat = cat.id;
    btn.textContent = `${cat.emoji} ${cat.name}`;
    btn.style.setProperty('--cat-color', cat.color);
    btn.addEventListener('click', () => selectCategoryFilter(cat.id, btn));
    frag.appendChild(btn);
  });

  const customBtn = document.createElement('button');
  customBtn.className = 'cat-filter-btn custom-btn';
  customBtn.dataset.cat = 'custom';
  customBtn.textContent = '✏️ مخصصة فقط';
  customBtn.addEventListener('click', () => selectCategoryFilter('custom', customBtn));
  frag.appendChild(customBtn);

  wrap.appendChild(frag);
}

function selectCategoryFilter(catId, clickedBtn) {
  const allBtn    = document.querySelector('.cat-filter-btn.all-btn');
  const customBtn = document.querySelector('.cat-filter-btn.custom-btn');

  if (catId === 'all') {
    document.querySelectorAll('.cat-filter-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
    });
    allBtn.classList.add('active');
    state.selectedCategories = [];
    state.customOnly = false;
    return;
  }

  if (catId === 'custom') {
    const isActive = customBtn.classList.contains('active');
    document.querySelectorAll('.cat-filter-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
    });
    if (!isActive) {
      customBtn.classList.add('active');
      state.customOnly = true;
      state.selectedCategories = [];
    } else {
      allBtn.classList.add('active');
      state.customOnly = false;
    }
    return;
  }

  state.customOnly = false;
  customBtn.classList.remove('active');
  customBtn.style.background = '';
  customBtn.style.color = '';

  const isActive = clickedBtn.classList.contains('active');
  if (isActive) {
    clickedBtn.classList.remove('active');
    clickedBtn.style.background = '';
    clickedBtn.style.color = '';
  } else {
    const cat = state.categories.find(c => c.id === catId);
    clickedBtn.classList.add('active');
    if (cat) {
      clickedBtn.style.background = cat.color;
      clickedBtn.style.color = '#fff';
    }
  }

  state.selectedCategories = [];
  document.querySelectorAll('.cat-filter-btn:not(.all-btn):not(.custom-btn)').forEach(b => {
    if (b.classList.contains('active')) state.selectedCategories.push(b.dataset.cat);
  });

  if (state.selectedCategories.length === 0) {
    allBtn.classList.add('active');
  } else {
    allBtn.classList.remove('active');
    allBtn.style.background = '';
  }
}

// ── MODAL: CATEGORY PICKER ────────────────────
function buildModalCategoryPicker() {
  const grid = document.getElementById('modal-cat-options');
  if (!grid) return;
  const frag = document.createDocumentFragment();

  state.categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-opt' + (i === 0 ? ' selected' : '');
    btn.dataset.catId = cat.id;
    btn.textContent = `${cat.emoji} ${cat.name}`;
    if (i === 0) {
      btn.style.background = cat.color;
      btn.style.color = '#fff';
      state.selectedModalCat = cat.id;
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-opt').forEach(b => {
        b.classList.remove('selected');
        b.style.background = '';
        b.style.color = '';
      });
      btn.classList.add('selected');
      btn.style.background = cat.color;
      btn.style.color = '#fff';
      state.selectedModalCat = cat.id;
    });
    frag.appendChild(btn);
  });

  grid.appendChild(frag);
}

// ── MODAL: OPEN / CLOSE ───────────────────────
function openAddQModal() {
  document.getElementById('modal-add-q').classList.remove('hidden');
  setTimeout(() => document.getElementById('modal-q-text').focus(), 300);
}

function closeAddQModal() {
  document.getElementById('modal-add-q').classList.add('hidden');
}

function toggleAnonymous() {
  state.anonymousMode = !state.anonymousMode;
  const btn = document.getElementById('anon-toggle');
  if (state.anonymousMode) {
    btn.classList.add('active');
    btn.textContent = '🕵️ مجهول ✓';
  } else {
    btn.classList.remove('active');
    btn.textContent = '🕵️ مجهول';
  }
}

function closeAddQModalBackdrop(e) {
  if (e.target === document.getElementById('modal-add-q')) closeAddQModal();
}

// ── MODAL: SAVE QUESTION ──────────────────────
function saveModalQuestion() {
  const textarea = document.getElementById('modal-q-text');
  const text = textarea.value.trim();
  if (!text) {
    textarea.classList.add('error');
    setTimeout(() => textarea.classList.remove('error'), 900);
    return;
  }

  const catId  = state.selectedModalCat || state.categories[0]?.id || 'general';

  const newQ = {
    id: 'custom_' + Date.now() + '_' + Math.floor(rnd() * 1e9),
    text,
    category: catId,
    custom: true,
    anonymous: state.anonymousMode
  };

  state.setupCustomQuestions.push(newQ);
  textarea.value = '';

  // Reset anonymous toggle after each add
  state.anonymousMode = false;
  const anonBtn = document.getElementById('anon-toggle');
  if (anonBtn) {
    anonBtn.classList.remove('active');
    anonBtn.textContent = '🕵️ مجهول';
  }

  renderModalAddedList();
  updateCustomBadge();
  showToast('تم إضافة سؤالك! 🎉');
}

function removeSetupQuestion(id) {
  state.setupCustomQuestions = state.setupCustomQuestions.filter(q => q.id !== id);
  renderModalAddedList();
  updateCustomBadge();
}

function renderModalAddedList() {
  const list    = document.getElementById('modal-added-list');
  const divider = document.getElementById('modal-divider');
  const frag    = document.createDocumentFragment();

  list.innerHTML = '';

  if (state.setupCustomQuestions.length === 0) {
    if (divider) divider.style.display = 'none';
    return;
  }

  if (divider) divider.style.display = '';

  state.setupCustomQuestions.forEach(q => {
    const cat  = state.categories.find(c => c.id === q.category);
    const chip = document.createElement('div');
    chip.className = 'added-q-chip';

    const displayText = q.anonymous
      ? '<span class="q-chip-anon">🕵️ سؤال مجهول</span>'
      : `<span class="q-chip-text">${q.text}</span>`;

    const catSpan = q.anonymous ? '' : `<span class="q-chip-cat">${cat ? cat.emoji : '💬'}</span>`;
    chip.innerHTML = `
      ${catSpan}
      ${displayText}
      <button class="q-chip-remove" onclick="removeSetupQuestion('${q.id}')">✕</button>
    `;
    frag.appendChild(chip);
  });

  list.appendChild(frag);
}

function updateCustomBadge() {
  const badge = document.getElementById('custom-q-badge');
  const count = state.setupCustomQuestions.length;
  badge.style.display = count > 0 ? '' : 'none';
  badge.textContent   = count;
}

// ── CONFIRM EXIT MODAL ────────────────────────
function openConfirmExit() {
  document.getElementById('modal-confirm-exit').classList.remove('hidden');
}

function closeConfirmExit() {
  document.getElementById('modal-confirm-exit').classList.add('hidden');
}

function closeConfirmExitBackdrop(e) {
  if (e.target === document.getElementById('modal-confirm-exit')) closeConfirmExit();
}

function confirmExit() {
  closeConfirmExit();
  stopTimer();
  showScreen('screen-welcome');
}

// ── PLAYERS ───────────────────────────────────
function addPlayer() {
  const input = document.getElementById('player-input');
  const name  = input.value.trim();
  if (!name || state.players.length >= 8) return;
  if (state.players.includes(name)) {
    input.style.borderColor = 'var(--red)';
    setTimeout(() => input.style.borderColor = '', 1000);
    return;
  }
  state.players.push(name);
  input.value = '';
  renderPlayersList();
  updateStartBtn();
}

function removePlayer(index) {
  state.players.splice(index, 1);
  renderPlayersList();
  updateStartBtn();
}

function renderPlayersList() {
  const list = document.getElementById('players-list');
  const frag = document.createDocumentFragment();
  list.innerHTML = '';

  state.players.forEach((name, i) => {
    const chip = document.createElement('div');
    chip.className = 'player-chip';
    chip.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div class="chip-avatar">${name[0]}</div>
        <span>${name}</span>
      </div>
      <button class="chip-remove" onclick="removePlayer(${i})">✕</button>
    `;
    frag.appendChild(chip);
  });

  list.appendChild(frag);
}

function updateStartBtn() {
  document.getElementById('start-btn').disabled = state.players.length < 2;
}

// ── GAME START ────────────────────────────────
function startGame() {
  if (state.players.length < 2) return;

  state.players             = shuffle([...state.players]);
  state.currentPlayerIndex  = 0;
  state.usedQuestionIds     = new Set();
  state.questionRepeatCounts = {};
  state.questionCount        = 0;
  state.skippedCount         = 0;
  state.penaltyCount         = 0;
  state.recentQuestionIds    = [];

  // Merge custom questions (remove any previous custom entries first)
  state.questions = state.questions.filter(q => !q.custom);
  state.questions = [...state.questions, ...state.setupCustomQuestions];

  // Init per-player counters
  state.playerSkipsUsed      = {};
  state.playerQuestionCounts = {};
  state.players.forEach(name => {
    state.playerSkipsUsed[name]      = 0;
    state.playerQuestionCounts[name] = 0;
  });

  showScreen('screen-game');
  showQuestion();
  startTimer();
}

// ── AVAILABLE QUESTION POOL ───────────────────
function getAvailablePool() {
  let pool = [...state.questions];

  // Filter by category / custom-only selection
  if (state.customOnly) {
    pool = pool.filter(q => q.custom);
  } else if (state.selectedCategories.length > 0) {
    pool = pool.filter(q => q.custom || state.selectedCategories.includes(q.category));
  }

  // Filter by repeat / usage limits — applies to ALL questions now
  pool = pool.filter(q => {
    const limit = state.globalRepeatLimit;
    if (limit === 0) return true;  // unlimited
    return (state.questionRepeatCounts[q.id] || 0) < limit;
  });

  return pool;
}

// ── QUESTION DISPLAY ──────────────────────────
function showQuestion() {
  // Check per-player question limit before drawing
  if (state.questionsPerPlayer > 0) {
    const playerName = state.players[state.currentPlayerIndex];
    const answered   = state.playerQuestionCounts[playerName] || 0;
    if (answered >= state.questionsPerPlayer) {
      const allDone = state.players.every(
        name => (state.playerQuestionCounts[name] || 0) >= state.questionsPerPlayer
      );
      if (allDone) { endGame(); return; }
      advancePlayer();
      showQuestion();
      return;
    }
  }

  const available = getAvailablePool();
  if (available.length === 0) { endGame(); return; }

  // ── CRAZY RANDOMNESS ──────────────────────────
  // Step 1: crypto-shuffle the whole pool
  const shuffledPool = shuffle(available);

  // Step 2: anti-repeat — prefer questions NOT recently shown (last 8)
  const recentSet = new Set(state.recentQuestionIds);
  const fresh = shuffledPool.filter(q => !recentSet.has(q.id));
  const source = fresh.length > 0 ? fresh : shuffledPool;

  // Step 3: pick with crypto random from fresh source
  const q = source[Math.floor(rnd() * source.length)];

  // Track recent (circular buffer of 8)
  state.recentQuestionIds.push(q.id);
  if (state.recentQuestionIds.length > 8) state.recentQuestionIds.shift();
  // ─────────────────────────────────────────────

  // Track usage — all questions via repeatCounts now
  state.questionRepeatCounts[q.id] = (state.questionRepeatCounts[q.id] || 0) + 1;

  state.questionCount++;

  const currentName = state.players[state.currentPlayerIndex];
  state.playerQuestionCounts[currentName] = (state.playerQuestionCounts[currentName] || 0) + 1;

  const cat = state.categories.find(c => c.id === q.category) ||
              { name: 'عام', emoji: '💬', color: '#FF6B35' };

  // Update UI via cached refs
  $.currentPlayer.textContent = currentName;
  updateQuestionCounter();

  $.questionCatTag.style.display = '';
  $.questionCatTag.style.background = cat.color;
  $.catEmoji.textContent = cat.emoji;
  $.catName.textContent  = cat.name;

  // Restart question pop animation
  $.questionText.style.animation = 'none';
  void $.questionText.offsetWidth;
  $.questionText.style.animation = '';
  $.questionText.textContent = q.text;

  updateSkipButton();
}

function updateQuestionCounter() {
  const playerName = state.players[state.currentPlayerIndex];
  const answered   = state.playerQuestionCounts[playerName] || 0;

  if (state.questionsPerPlayer > 0) {
    $.questionCntr.textContent = `${toArabicNum(answered)} / ${toArabicNum(state.questionsPerPlayer)}`;
  } else {
    $.questionCntr.textContent = `سؤال ${toArabicNum(state.questionCount)}`;
  }
}

// ── TIMER ─────────────────────────────────────
function startTimer() {
  clearInterval(state.timerInterval);
  state.timerRemaining = state.timerDuration;
  updateTimerUI(state.timerDuration, state.timerDuration);

  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerUI(state.timerRemaining, state.timerDuration);
    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      timesUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

function updateTimerUI(remaining, total) {
  const circumference = 150.8;  // 2*PI*24

  const fraction = remaining / total;
  const offset   = circumference * (1 - fraction);

  // Use cached DOM refs for hot timer path
  $.timerCircle.style.strokeDasharray  = circumference;
  $.timerCircle.style.strokeDashoffset = offset;
  $.timerDisplay.textContent = remaining;

  $.timerCircle.classList.remove('warning', 'danger');
  if (fraction <= 0.25)     $.timerCircle.classList.add('danger');
  else if (fraction <= 0.5) $.timerCircle.classList.add('warning');

  if (remaining <= 5 && remaining > 0) {
    $.timerRingWrap.classList.remove('shake');
    void $.timerRingWrap.offsetWidth;
    $.timerRingWrap.classList.add('shake');
  }
}

function timesUp() {
  state.penaltyCount++;
  state.pendingTimesUpPlayer = state.players[state.currentPlayerIndex];
  document.getElementById('timesup-player-name').textContent = state.pendingTimesUpPlayer;
  showScreen('screen-timesup');
}

function continueAfterPenalty() {
  advancePlayer();
  showScreen('screen-game');
  showQuestion();
  startTimer();
}

// ── TURNS ─────────────────────────────────────
function nextTurn() {
  stopTimer();
  advancePlayer();
  showQuestion();
  startTimer();
}

function skipQuestion() {
  const playerName = state.players[state.currentPlayerIndex];
  const used = state.playerSkipsUsed[playerName] || 0;

  if (state.skipLimitPerPlayer < 99 && used >= state.skipLimitPerPlayer) return;

  state.playerSkipsUsed[playerName] = used + 1;
  state.skippedCount++;

  // Undo the per-player + global question counts for the skipped Q
  state.playerQuestionCounts[playerName] =
    Math.max(0, (state.playerQuestionCounts[playerName] || 1) - 1);
  state.questionCount = Math.max(0, state.questionCount - 1);

  // Keep timer running — same player, new question
  showQuestion();
}

function advancePlayer() {
  state.currentPlayerIndex =
    (state.currentPlayerIndex + 1) % state.players.length;
}

// ── SKIP BUTTON + INLINE BADGE ────────────────
function updateSkipButton() {
  const playerName = state.players[state.currentPlayerIndex];
  const used       = state.playerSkipsUsed[playerName] || 0;
  const limit      = state.skipLimitPerPlayer;
  const remaining  = limit - used;

  if (limit >= 99) {
    $.skipBtn.disabled      = false;
    $.skipLabel.textContent = '';
    $.skipLabel.style.display = 'none';
  } else if (remaining <= 0) {
    $.skipBtn.disabled      = true;
    $.skipLabel.textContent = 'خلصت التخطيات';
    $.skipLabel.style.display = '';
  } else {
    $.skipBtn.disabled      = false;
    $.skipLabel.textContent = `😅 باقي ${toArabicNum(remaining)}`;
    $.skipLabel.style.display = '';
  }
}

// ── END GAME ──────────────────────────────────
function endGame() {
  stopTimer();
  document.getElementById('stat-questions').textContent = toArabicNum(state.questionCount);
  document.getElementById('stat-skipped').textContent   = toArabicNum(state.skippedCount);
  document.getElementById('stat-penalties').textContent = toArabicNum(state.penaltyCount);
  showScreen('screen-end');
}

function restartGame() {
  stopTimer();
  state.usedQuestionIds      = new Set();
  state.questionRepeatCounts = {};
  state.questionCount        = 0;
  state.skippedCount         = 0;
  state.penaltyCount         = 0;
  state.currentPlayerIndex   = 0;
  state.recentQuestionIds    = [];
  state.players              = shuffle([...state.players]);

  state.playerSkipsUsed      = {};
  state.playerQuestionCounts = {};
  state.players.forEach(name => {
    state.playerSkipsUsed[name]      = 0;
    state.playerQuestionCounts[name] = 0;
  });

  showScreen('screen-game');
  showQuestion();
  startTimer();
}

// goHome now shows confirmation modal instead of navigating directly
function goHome() {
  openConfirmExit();
}

// ── SCREEN TRANSITIONS ────────────────────────
function showScreen(id) {
  const current = document.querySelector('.screen.active');
  if (current) {
    current.classList.add('slide-out');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('slide-out'), 400);
  }
  setTimeout(() => {
    const next = document.getElementById(id);
    if (next) next.classList.add('active');
  }, 50);
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className   = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── HELPERS ───────────────────────────────────
const arabicNums = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabicNum(n) {
  return String(n).split('').map(d => arabicNums[d] ?? d).join('');
}
