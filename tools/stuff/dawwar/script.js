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
  timerTotal: 30,
  allowAddTime: false,
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
  loadSettingsFromStorage();  // ← restore saved settings
});

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
      autoSave();
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
      autoSave();
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
      autoSave();
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
      autoSave();
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
      autoSave();
    }
  });

  // Custom questions per player
  document.getElementById('custom-qpp').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 1 && val <= 50) {
      state.questionsPerPlayer = val;
      document.querySelectorAll('#qpp-options .seg-opt').forEach(b => b.classList.remove('active'));
      autoSave();
    }
  });

  // Custom skips per player (0 = unlimited = 99)
  document.getElementById('custom-skips').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      state.skipLimitPerPlayer = val === 0 ? 99 : val;
      document.querySelectorAll('#skip-options .seg-opt').forEach(b => b.classList.remove('active'));
      autoSave();
    }
  });

  // Custom repeat count for all questions
  document.getElementById('custom-repeat').addEventListener('input', function () {
    const val = parseInt(this.value);
    if (!isNaN(val) && val >= 0 && val <= 20) {
      state.globalRepeatLimit = val;
      document.querySelectorAll('#repeat-options .seg-opt').forEach(b => b.classList.remove('active'));
      autoSave();
    }
  });
}

// ── CUSTOM SETTINGS TOGGLE ────────────────────
function toggleCustomSettings() {
  const section = document.getElementById('custom-settings-section');
  section.classList.toggle('open');
}

// ── LOCALSTORAGE: SETTINGS PERSISTENCE ────────
const LS_SETTINGS  = 'dawwar_settings';
const LS_PLAYERS   = 'dawwar_players';
const LS_CUSTOM_QS = 'dawwar_custom_qs';
const LS_QSETS     = 'dawwar_qsets';

function saveSettingsToStorage() {
  try {
    const settings = {
      timerDuration:      state.timerDuration,
      skipLimitPerPlayer: state.skipLimitPerPlayer,
      questionsPerPlayer: state.questionsPerPlayer,
      globalRepeatLimit:  state.globalRepeatLimit,
      selectedCategories: state.selectedCategories,
      customOnly:         state.customOnly,
      allowAddTime:       state.allowAddTime
    };
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(LS_PLAYERS, JSON.stringify(state.players));
    localStorage.setItem(LS_CUSTOM_QS, JSON.stringify(state.setupCustomQuestions));
  } catch (e) { /* ignore storage errors */ }
}

function loadSettingsFromStorage() {
  try {
    // Restore settings
    const raw = localStorage.getItem(LS_SETTINGS);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.timerDuration)      applyTimerSetting(s.timerDuration);
      if (s.questionsPerPlayer !== undefined) applyQppSetting(s.questionsPerPlayer);
      if (s.skipLimitPerPlayer !== undefined) applySkipSetting(s.skipLimitPerPlayer);
      if (s.globalRepeatLimit !== undefined)  applyRepeatSetting(s.globalRepeatLimit);
      if (s.selectedCategories?.length)       restoreCategoryFilter(s.selectedCategories);
      else if (s.customOnly)                  restoreCategoryFilter(null, true);
      if (s.allowAddTime === true) {
        state.allowAddTime = true;
        document.getElementById('add-time-toggle')?.classList.add('active');
      }
    }

    // Restore players
    const rawP = localStorage.getItem(LS_PLAYERS);
    if (rawP) {
      const players = JSON.parse(rawP);
      players.forEach(name => {
        if (!state.players.includes(name) && state.players.length < 8) {
          state.players.push(name);
        }
      });
      renderPlayersList();
      updateStartBtn();
    }

    // Restore custom questions
    const rawQ = localStorage.getItem(LS_CUSTOM_QS);
    if (rawQ) {
      state.setupCustomQuestions = JSON.parse(rawQ);
      renderModalAddedList();
      updateCustomBadge();
    }

    // Render saved question sets
    renderQsetsList();
  } catch (e) { /* ignore */ }
}

function applyTimerSetting(val) {
  state.timerDuration = val;
  const btns = document.querySelectorAll('#timer-options .seg-opt');
  let matched = false;
  btns.forEach(b => {
    b.classList.remove('active');
    if (parseInt(b.dataset.seconds) === val) { b.classList.add('active'); matched = true; }
  });
  if (!matched) {
    const ci = document.getElementById('custom-timer');
    if (ci) ci.value = val;
  }
}

function applyQppSetting(val) {
  state.questionsPerPlayer = val;
  const btns = document.querySelectorAll('#qpp-options .seg-opt');
  let matched = false;
  btns.forEach(b => {
    b.classList.remove('active');
    if (parseInt(b.dataset.qpp) === val) { b.classList.add('active'); matched = true; }
  });
  if (!matched) {
    const ci = document.getElementById('custom-qpp');
    if (ci) ci.value = val;
  }
}

function applySkipSetting(val) {
  state.skipLimitPerPlayer = val;
  const btns = document.querySelectorAll('#skip-options .seg-opt');
  let matched = false;
  btns.forEach(b => {
    b.classList.remove('active');
    if (parseInt(b.dataset.skips) === val) { b.classList.add('active'); matched = true; }
  });
  if (!matched) {
    const ci = document.getElementById('custom-skips');
    if (ci) ci.value = val === 99 ? 0 : val;
  }
}

function applyRepeatSetting(val) {
  state.globalRepeatLimit = val;
  const btns = document.querySelectorAll('#repeat-options .seg-opt');
  let matched = false;
  btns.forEach(b => {
    b.classList.remove('active');
    if (parseInt(b.dataset.repeat) === val) { b.classList.add('active'); matched = true; }
  });
  if (!matched) {
    const ci = document.getElementById('custom-repeat');
    if (ci) ci.value = val;
  }
}

function restoreCategoryFilter(cats, customOnly = false) {
  // Reset first
  const allBtn    = document.querySelector('.cat-filter-btn.all-btn');
  const customBtn = document.querySelector('.cat-filter-btn.custom-btn');
  document.querySelectorAll('.cat-filter-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
  });

  if (customOnly) {
    customBtn?.classList.add('active');
    state.customOnly = true;
  } else if (cats && cats.length > 0) {
    state.selectedCategories = cats;
    cats.forEach(catId => {
      const btn = document.querySelector(`.cat-filter-btn[data-cat="${catId}"]`);
      const cat = state.categories.find(c => c.id === catId);
      if (btn && cat) {
        btn.classList.add('active');
        btn.style.background = cat.color;
        btn.style.color = '#fff';
      }
    });
    allBtn?.classList.remove('active');
  } else {
    allBtn?.classList.add('active');
  }
}

// Auto-save settings whenever they change
function autoSave() {
  saveSettingsToStorage();
}

// ── QUESTION SETS ──────────────────────────────
function getQsets() {
  try { return JSON.parse(localStorage.getItem(LS_QSETS) || '[]'); }
  catch (e) { return []; }
}

function saveQsets(sets) {
  try { localStorage.setItem(LS_QSETS, JSON.stringify(sets)); }
  catch (e) { showToast('⚠️ مساحة التخزين ممتلية'); }
}

function saveAsSet() {
  const input = document.getElementById('set-name-input');
  const name  = input?.value.trim();
  if (!name) {
    if (input) { input.style.borderColor = 'var(--red)'; setTimeout(() => input.style.borderColor = '', 800); }
    return;
  }
  if (state.setupCustomQuestions.length === 0) {
    showToast('أضف أسئلة الأول!');
    return;
  }

  const sets = getQsets();
  // Replace if same name
  const existIdx = sets.findIndex(s => s.name === name);
  const newSet = {
    id:        'set_' + Date.now(),
    name,
    questions: state.setupCustomQuestions.map(q => ({ ...q }))
  };

  if (existIdx >= 0) sets[existIdx] = newSet;
  else sets.push(newSet);

  saveQsets(sets);
  input.value = '';
  renderQsetsList();
  showToast(`✅ تم حفظ «${name}»`);
}

function loadSet(setId) {
  const sets = getQsets();
  const set  = sets.find(s => s.id === setId);
  if (!set) return;

  // Merge: add questions that aren't already in the session (by text match)
  const existingTexts = new Set(state.setupCustomQuestions.map(q => q.text));
  const newOnes = set.questions.filter(q => !existingTexts.has(q.text));
  newOnes.forEach(q => {
    state.setupCustomQuestions.push({ ...q, id: 'custom_' + Date.now() + '_' + Math.floor(rnd() * 1e9) });
  });

  renderModalAddedList();
  updateCustomBadge();
  renderQsetsList();
  saveSettingsToStorage();
  showToast(`📚 تم تحميل «${set.name}» (${toArabicNum(newOnes.length)} سؤال جديد)`);
}

function deleteSet(setId) {
  const sets    = getQsets().filter(s => s.id !== setId);
  saveQsets(sets);
  renderQsetsList();
}

function renderQsetsList() {
  const container = document.getElementById('qsets-list');
  if (!container) return;

  const sets = getQsets();
  container.innerHTML = '';

  if (sets.length === 0) {
    container.innerHTML = '<p class="qsets-empty">مفيش مجموعات محفوظة لسه</p>';
    return;
  }

  sets.forEach(set => {
    const chip = document.createElement('div');
    chip.className = 'qset-chip';
    chip.innerHTML = `
      <div class="qset-name">${set.name}</div>
      <span class="qset-count">${toArabicNum(set.questions.length)} سؤال</span>
      <button class="qset-load-btn" onclick="loadSet('${set.id}')">تحميل</button>
      <button class="qset-delete-btn" onclick="deleteSet('${set.id}')">🗑</button>
    `;
    container.appendChild(chip);
  });
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
    autoSave();
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
    autoSave();
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
  autoSave();
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
  updateSaveSetSection();
  renderQsetsList();
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

  renderModalAddedList();
  updateCustomBadge();
  updateSaveSetSection();
  autoSave();
  showToast('تم إضافة سؤالك! 🎉');
}

function removeSetupQuestion(id) {
  state.setupCustomQuestions = state.setupCustomQuestions.filter(q => q.id !== id);
  renderModalAddedList();
  updateCustomBadge();
  updateSaveSetSection();
  autoSave();
}

function updateSaveSetSection() {
  const section = document.getElementById('save-set-section');
  if (section) section.style.display = state.setupCustomQuestions.length > 0 ? '' : 'none';
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
  autoSave();
}

function removePlayer(index) {
  state.players.splice(index, 1);
  renderPlayersList();
  updateStartBtn();
  autoSave();
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
  updateAddTimeBtnVisibility();
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
  state.timerTotal     = state.timerDuration;  // track current "full" for ring
  updateTimerUI(state.timerDuration, state.timerDuration);

  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerUI(state.timerRemaining, state.timerTotal);  // use timerTotal, not timerDuration
    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      timesUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

// ── ADD EXTRA TIME (in-game) ──────────────────
function addExtraTime() {
  const bonus = 30;
  state.timerRemaining += bonus;
  state.timerTotal     += bonus;  // expand the ring's reference total too
  updateTimerUI(state.timerRemaining, state.timerTotal);
  showToast(`⏱ +${toArabicNum(bonus)} ثانية!`);
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
var arabicNums = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function toArabicNum(n) {
  return String(n).split('').map(d => arabicNums[d] ?? d).join('');
}

// ── HELP SECTION ──────────────────────────────
function toggleHelp() {
  const body  = document.getElementById('help-body');
  const arrow = document.getElementById('help-toggle-arrow');
  const btn   = document.querySelector('.help-toggle-btn');
  const open  = body.classList.toggle('open');
  arrow.textContent = open ? '▲' : '▼';
  btn.classList.toggle('help-toggle-open', open);
}

// ── SHOW QUESTIONS PASSWORD MODAL ─────────────
const SHOW_Q_PASSWORD = '2486';
let showQBrowserCatId = null;

function openShowQModal() {
  const input = document.getElementById('show-q-password-input');
  const err   = document.getElementById('show-q-error');
  input.value = '';
  err.style.display = 'none';
  document.getElementById('modal-show-q-password').classList.remove('hidden');
  setTimeout(() => input.focus(), 300);
}

function closeShowQPasswordModal() {
  document.getElementById('modal-show-q-password').classList.add('hidden');
}

function closeShowQPasswordBackdrop(e) {
  if (e.target === document.getElementById('modal-show-q-password')) closeShowQPasswordModal();
}

function checkShowQPassword() {
  const input = document.getElementById('show-q-password-input');
  const err   = document.getElementById('show-q-error');
  if (input.value.trim() === SHOW_Q_PASSWORD) {
    closeShowQPasswordModal();
    openShowQBrowserModal();
  } else {
    err.style.display = '';
    input.value = '';
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 900);
  }
}

// Allow Enter key in password input
document.addEventListener('DOMContentLoaded', () => {
  const pi = document.getElementById('show-q-password-input');
  if (pi) pi.addEventListener('keydown', e => { if (e.key === 'Enter') checkShowQPassword(); });
});

// ── SHOW QUESTIONS BROWSER MODAL ──────────────
function openShowQBrowserModal() {
  buildShowQCatTabs();
  document.getElementById('modal-show-q-browser').classList.remove('hidden');
}

function closeShowQBrowserModal() {
  document.getElementById('modal-show-q-browser').classList.add('hidden');
}

function closeShowQBrowserBackdrop(e) {
  if (e.target === document.getElementById('modal-show-q-browser')) closeShowQBrowserModal();
}

function buildShowQCatTabs() {
  const tabs = document.getElementById('show-q-cat-tabs');
  tabs.innerHTML = '';
  const frag = document.createDocumentFragment();

  // "All" tab
  const allTab = document.createElement('button');
  allTab.className = 'show-q-tab active';
  allTab.dataset.cat = 'all';
  allTab.textContent = '🌟 الكل';
  allTab.addEventListener('click', () => selectShowQTab('all', allTab));
  frag.appendChild(allTab);

  state.categories.forEach(cat => {
    const tab = document.createElement('button');
    tab.className = 'show-q-tab';
    tab.dataset.cat = cat.id;
    tab.textContent = `${cat.emoji} ${cat.name}`;
    tab.style.setProperty('--tab-color', cat.color);
    tab.addEventListener('click', () => selectShowQTab(cat.id, tab));
    frag.appendChild(tab);
  });

  tabs.appendChild(frag);
  showQBrowserCatId = 'all';
  renderShowQList('all');
}

function selectShowQTab(catId, clickedTab) {
  document.querySelectorAll('.show-q-tab').forEach(t => t.classList.remove('active'));
  clickedTab.classList.add('active');
  showQBrowserCatId = catId;
  renderShowQList(catId);
}

function renderShowQList(catId) {
  const list = document.getElementById('show-q-list');
  list.innerHTML = '';

  const filtered = catId === 'all'
    ? state.questions.filter(q => !q.custom)
    : state.questions.filter(q => !q.custom && q.category === catId);

  if (filtered.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:24px 0;font-size:14px">مفيش أسئلة في الفئة دي</p>';
    return;
  }

  const frag = document.createDocumentFragment();
  filtered.forEach((q, i) => {
    const cat = state.categories.find(c => c.id === q.category) || { emoji: '💬', color: '#FF6B35' };
    const row = document.createElement('div');
    row.className = 'show-q-row';
    row.innerHTML = `
      <span class="show-q-num">${toArabicNum(i + 1)}</span>
      <span class="show-q-cat-dot" style="background:${cat.color}">${cat.emoji}</span>
      <span class="show-q-text">${q.text}</span>
    `;
    frag.appendChild(row);
  });
  list.appendChild(frag);
}

// ── RESET ALL ─────────────────────────────────
function confirmResetAll() {
  document.getElementById('modal-confirm-reset').classList.remove('hidden');
}

function closeConfirmReset() {
  document.getElementById('modal-confirm-reset').classList.add('hidden');
}

function closeConfirmResetBackdrop(e) {
  if (e.target === document.getElementById('modal-confirm-reset')) closeConfirmReset();
}

function executeResetAll() {
  // Clear localStorage
  try {
    localStorage.removeItem('dawwar_settings');
    localStorage.removeItem('dawwar_players');
    localStorage.removeItem('dawwar_custom_qs');
    localStorage.removeItem('dawwar_qsets');
  } catch (e) {}

  // Reset state
  state.players              = [];
  state.timerDuration        = 30;
  state.skipLimitPerPlayer   = 1;
  state.questionsPerPlayer   = 0;
  state.globalRepeatLimit    = 1;
  state.selectedCategories   = [];
  state.customOnly           = false;
  state.setupCustomQuestions = [];
  state.allowAddTime         = false;

  // Reset UI — players
  renderPlayersList();
  updateStartBtn();
  updateCustomBadge();

  // Reset timer buttons
  document.querySelectorAll('#timer-options .seg-opt').forEach(b => b.classList.remove('active'));
  document.querySelector('#timer-options .seg-opt[data-seconds="30"]')?.classList.add('active');

  // Reset qpp buttons
  document.querySelectorAll('#qpp-options .seg-opt').forEach(b => b.classList.remove('active'));
  document.querySelector('#qpp-options .seg-opt[data-qpp="0"]')?.classList.add('active');

  // Reset skip buttons
  document.querySelectorAll('#skip-options .seg-opt').forEach(b => b.classList.remove('active'));
  document.querySelector('#skip-options .seg-opt[data-skips="1"]')?.classList.add('active');

  // Reset repeat buttons
  document.querySelectorAll('#repeat-options .seg-opt').forEach(b => b.classList.remove('active'));
  document.querySelector('#repeat-options .seg-opt[data-repeat="1"]')?.classList.add('active');

  // Reset custom number inputs
  ['custom-timer','custom-qpp','custom-skips','custom-repeat'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset category filter
  document.querySelectorAll('.cat-filter-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = '';
    b.style.color = '';
  });
  document.querySelector('.cat-filter-btn.all-btn')?.classList.add('active');

  // Reset add-time toggle
  document.getElementById('add-time-toggle')?.classList.remove('active');

  // Reset modal lists
  const addedList = document.getElementById('modal-added-list');
  if (addedList) addedList.innerHTML = '';
  const divider = document.getElementById('modal-divider');
  if (divider) divider.style.display = 'none';
  const saveSection = document.getElementById('save-set-section');
  if (saveSection) saveSection.style.display = 'none';
  renderQsetsList();

  closeConfirmReset();
  showToast('تم المسح — ابدأ من جديد! 🧹');
}

// ── ALLOW ADD TIME TOGGLE ─────────────────────
function toggleAllowAddTime() {
  state.allowAddTime = !state.allowAddTime;
  const btn = document.getElementById('add-time-toggle');
  if (btn) btn.classList.toggle('active', state.allowAddTime);
  updateAddTimeBtnVisibility();
  autoSave();
}

function updateAddTimeBtnVisibility() {
  const btn = document.getElementById('add-time-btn');
  if (btn) btn.style.display = state.allowAddTime ? '' : 'none';
}
