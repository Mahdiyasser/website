<?php
// ── CONFIG ────────────────────────────────────────────────────────────────────
$JSON_FILE = __DIR__ . '/../data/questions.json';   // adjust folder name if needed

// ── HELPERS ──────────────────────────────────────────────────────────────────
function loadData(string $file): array {
    if (!file_exists($file)) die('JSON file not found: ' . $file);
    return json_decode(file_get_contents($file), true);
}

function saveData(string $file, array $data): void {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function nextId(array $questions): int {
    if (empty($questions)) return 1;
    return max(array_column($questions, 'id')) + 1;
}

function jsonResponse(array $payload): void {
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── API HANDLER ───────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $body['action'] ?? '';
    $data   = loadData($JSON_FILE);

    switch ($action) {

        // ── CATEGORIES ──────────────────────────────────────────────────────
        case 'add_category':
            $data['categories'][] = [
                'id'    => $body['id'],
                'name'  => $body['name'],
                'emoji' => $body['emoji'],
                'color' => $body['color'],
            ];
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        case 'edit_category':
            foreach ($data['categories'] as &$cat) {
                if ($cat['id'] === $body['id']) {
                    $cat['name']  = $body['name'];
                    $cat['emoji'] = $body['emoji'];
                    $cat['color'] = $body['color'];
                    break;
                }
            }
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        case 'delete_category':
            $data['categories'] = array_values(
                array_filter($data['categories'], fn($c) => $c['id'] !== $body['id'])
            );
            $data['questions'] = array_values(
                array_filter($data['questions'], fn($q) => $q['category'] !== $body['id'])
            );
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        // ── QUESTIONS ────────────────────────────────────────────────────────
        case 'add_question':
            $data['questions'][] = [
                'id'       => nextId($data['questions']),
                'text'     => $body['text'],
                'category' => $body['category'],
            ];
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        case 'edit_question':
            foreach ($data['questions'] as &$q) {
                if ($q['id'] === (int)$body['id']) {
                    $q['text']     = $body['text'];
                    $q['category'] = $body['category'];
                    break;
                }
            }
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        case 'delete_question':
            $data['questions'] = array_values(
                array_filter($data['questions'], fn($q) => $q['id'] !== (int)$body['id'])
            );
            saveData($JSON_FILE, $data);
            jsonResponse(['ok' => true]);

        default:
            jsonResponse(['ok' => false, 'error' => 'Unknown action']);
    }
}

// ── LOAD FOR PAGE RENDER ──────────────────────────────────────────────────────
$data = loadData($JSON_FILE);
$categoriesJson = json_encode($data['categories'], JSON_UNESCAPED_UNICODE);
$questionsJson  = json_encode($data['questions'],  JSON_UNESCAPED_UNICODE);
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>لوحة الإدارة — الأسئلة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --bg:        #0c0d0f;
    --surface:   #141618;
    --surface2:  #1c1f22;
    --border:    #2a2d32;
    --border2:   #363b42;
    --text:      #e8eaed;
    --muted:     #6b7280;
    --accent:    #FF6B35;
    --accent2:   #FF1493;
    --green:     #3D9970;
    --red:       #e84855;
    --radius:    10px;
    --font:      'IBM Plex Sans Arabic', sans-serif;
    --mono:      'JetBrains Mono', monospace;
}

html { font-size: 15px; }
body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
    direction: rtl;
}

/* ── LAYOUT ── */
.layout { display: flex; min-height: 100vh; }

.sidebar {
    width: 220px;
    background: var(--surface);
    border-left: 1px solid var(--border);
    padding: 24px 0;
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    z-index: 10;
}

.sidebar-logo {
    padding: 0 20px 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
}
.sidebar-logo h1 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--accent);
    letter-spacing: -0.02em;
}
.sidebar-logo p { font-size: .75rem; color: var(--muted); margin-top: 2px; }

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    color: var(--muted);
    font-size: .875rem;
    font-weight: 500;
    transition: all .15s;
    border-right: 3px solid transparent;
}
.nav-item:hover { color: var(--text); background: var(--surface2); }
.nav-item.active { color: var(--accent); border-right-color: var(--accent); background: rgba(255,107,53,.06); }
.nav-icon { font-size: 1.1rem; width: 22px; text-align: center; }

.main {
    margin-right: 220px;
    flex: 1;
    padding: 32px;
    max-width: 100%;
}

/* ── HEADER ── */
.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
}
.page-header h2 {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.02em;
}
.page-header p { font-size: .8rem; color: var(--muted); margin-top: 4px; }

/* ── STATS BAR ── */
.stats {
    display: flex;
    gap: 14px;
    margin-bottom: 28px;
}
.stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    flex: 1;
}
.stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--accent);
    line-height: 1;
}
.stat-label { font-size: .75rem; color: var(--muted); margin-top: 6px; }

/* ── SECTION ── */
.section { display: none; }
.section.active { display: block; }

/* ── TOOLBAR ── */
.toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}
.toolbar .search {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 9px 14px;
    color: var(--text);
    font-family: var(--font);
    font-size: .875rem;
    outline: none;
    transition: border-color .15s;
}
.toolbar .search:focus { border-color: var(--accent); }
.toolbar .search::placeholder { color: var(--muted); }

/* ── BUTTONS ── */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: var(--radius);
    font-family: var(--font);
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all .15s;
    white-space: nowrap;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #e85c27; }
.btn-ghost { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
.btn-ghost:hover { border-color: var(--border2); background: var(--surface2); }
.btn-danger { background: transparent; border: 1px solid var(--red); color: var(--red); }
.btn-danger:hover { background: var(--red); color: #fff; }
.btn-sm { padding: 5px 10px; font-size: .75rem; }
.btn-icon { padding: 6px 8px; }

/* ── TABLE ── */
.table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}
table {
    width: 100%;
    border-collapse: collapse;
}
thead th {
    background: var(--surface2);
    padding: 11px 16px;
    text-align: right;
    font-size: .72rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .06em;
    border-bottom: 1px solid var(--border);
}
tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background .1s;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--surface2); }
td {
    padding: 12px 16px;
    font-size: .875rem;
    vertical-align: middle;
}
td.id-col {
    font-family: var(--mono);
    font-size: .75rem;
    color: var(--muted);
    width: 48px;
}
td.actions { text-align: left; white-space: nowrap; width: 100px; }
.actions-wrap { display: flex; gap: 6px; justify-content: flex-end; }

/* category badge */
.cat-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
    white-space: nowrap;
}

/* color swatch */
.color-swatch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    display: inline-block;
    flex-shrink: 0;
}

/* question text */
.q-text { line-height: 1.5; }

/* empty state */
.empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
}
.empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
.empty p { font-size: .875rem; }

/* ── MODAL ── */
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.65);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
.overlay.open { display: flex; }

.modal {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 14px;
    width: 100%;
    max-width: 480px;
    animation: modalIn .2s ease;
}
@keyframes modalIn {
    from { opacity: 0; transform: translateY(16px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.modal-header h3 { font-size: 1rem; font-weight: 700; }
.close-btn {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 4px;
    transition: color .15s;
}
.close-btn:hover { color: var(--text); }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

/* FORM */
.form-group { display: flex; flex-direction: column; gap: 6px; }
label { font-size: .78rem; font-weight: 600; color: var(--muted); }
input[type=text], textarea, select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    color: var(--text);
    font-family: var(--font);
    font-size: .875rem;
    outline: none;
    transition: border-color .15s;
    width: 100%;
    direction: rtl;
}
input[type=text]:focus, textarea:focus, select:focus { border-color: var(--accent); }
textarea { resize: vertical; min-height: 80px; }
select option { background: var(--surface2); }
input[type=color] {
    -webkit-appearance: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 48px;
    height: 38px;
    padding: 3px;
    background: var(--surface2);
    cursor: pointer;
}
.color-row { display: flex; gap: 10px; align-items: center; }
.color-row input[type=text] { flex: 1; }

/* ── TOAST ── */
.toast-wrap {
    position: fixed;
    bottom: 24px;
    left: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 999;
}
.toast {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: .8rem;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: toastIn .2s ease;
    box-shadow: 0 8px 24px rgba(0,0,0,.4);
}
.toast.success { border-color: var(--green); }
.toast.error   { border-color: var(--red); }
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── FILTER CHIPS ── */
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.chip {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    transition: all .15s;
}
.chip.active { border-color: var(--accent); color: var(--accent); background: rgba(255,107,53,.08); }
.chip:hover { border-color: var(--border2); color: var(--text); }

/* ── DELETE CONFIRM ── */
.confirm-modal .modal-body { align-items: center; text-align: center; gap: 10px; }
.confirm-icon { font-size: 2.5rem; }
.confirm-msg { font-size: .9rem; color: var(--muted); line-height: 1.6; }
.confirm-msg strong { color: var(--text); }

/* scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
</style>
</head>
<body>

<!-- SIDEBAR -->
<div class="layout">
<nav class="sidebar">
    <div class="sidebar-logo">
        <h1>⚙️ الإدارة</h1>
        <p>إدارة الأسئلة والأقسام</p>
    </div>
    <div class="nav-item active" onclick="showSection('dashboard')" id="nav-dashboard">
        <span class="nav-icon">📊</span> الرئيسية
    </div>
    <div class="nav-item" onclick="showSection('categories')" id="nav-categories">
        <span class="nav-icon">🗂️</span> الأقسام
    </div>
    <div class="nav-item" onclick="showSection('questions')" id="nav-questions">
        <span class="nav-icon">❓</span> الأسئلة
    </div>
</nav>

<!-- MAIN -->
<main class="main">

    <!-- DASHBOARD -->
    <section class="section active" id="section-dashboard">
        <div class="page-header">
            <div>
                <h2>الرئيسية</h2>
                <p>نظرة عامة على ملف الأسئلة</p>
            </div>
        </div>
        <div class="stats">
            <div class="stat">
                <div class="stat-value" id="stat-cats">—</div>
                <div class="stat-label">إجمالي الأقسام</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="stat-qs">—</div>
                <div class="stat-label">إجمالي الأسئلة</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="stat-avg">—</div>
                <div class="stat-label">متوسط الأسئلة / قسم</div>
            </div>
        </div>
        <div class="table-wrap" id="dash-table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>القسم</th>
                        <th>الإيموجي</th>
                        <th>اللون</th>
                        <th>عدد الأسئلة</th>
                    </tr>
                </thead>
                <tbody id="dash-table"></tbody>
            </table>
        </div>
    </section>

    <!-- CATEGORIES -->
    <section class="section" id="section-categories">
        <div class="page-header">
            <div>
                <h2>الأقسام</h2>
                <p>إضافة وتعديل وحذف أقسام الأسئلة</p>
            </div>
            <button class="btn btn-primary" onclick="openAddCategory()">＋ قسم جديد</button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width:48px">ID</th>
                        <th>الاسم</th>
                        <th>الإيموجي</th>
                        <th>اللون</th>
                        <th>الأسئلة</th>
                        <th style="width:100px"></th>
                    </tr>
                </thead>
                <tbody id="cat-table"></tbody>
            </table>
        </div>
    </section>

    <!-- QUESTIONS -->
    <section class="section" id="section-questions">
        <div class="page-header">
            <div>
                <h2>الأسئلة</h2>
                <p>إضافة وتعديل وحذف الأسئلة</p>
            </div>
            <button class="btn btn-primary" onclick="openAddQuestion()">＋ سؤال جديد</button>
        </div>
        <div class="toolbar">
            <input class="search" type="text" placeholder="ابحث في الأسئلة..." id="q-search" oninput="renderQuestions()">
        </div>
        <div class="chips" id="q-chips"></div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th style="width:48px">#</th>
                        <th>السؤال</th>
                        <th>القسم</th>
                        <th style="width:100px"></th>
                    </tr>
                </thead>
                <tbody id="q-table"></tbody>
            </table>
        </div>
    </section>

</main>
</div>

<!-- ── MODALS ── -->

<!-- ADD / EDIT CATEGORY -->
<div class="overlay" id="modal-cat">
    <div class="modal">
        <div class="modal-header">
            <h3 id="modal-cat-title">قسم جديد</h3>
            <button class="close-btn" onclick="closeModal('modal-cat')">✕</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>معرّف القسم (ID) — لا مسافات، أحرف إنجليزية</label>
                <input type="text" id="cat-id" placeholder="مثال: ta7adi">
            </div>
            <div class="form-group">
                <label>الاسم بالعربي</label>
                <input type="text" id="cat-name" placeholder="مثال: تحدي">
            </div>
            <div class="form-group">
                <label>الإيموجي</label>
                <input type="text" id="cat-emoji" placeholder="🔥" maxlength="4">
            </div>
            <div class="form-group">
                <label>اللون</label>
                <div class="color-row">
                    <input type="text" id="cat-color-hex" placeholder="#FF6B35" oninput="syncColorPicker()">
                    <input type="color" id="cat-color-pick" value="#FF6B35" oninput="syncColorHex()">
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('modal-cat')">إلغاء</button>
            <button class="btn btn-primary" onclick="saveCategory()">حفظ</button>
        </div>
    </div>
</div>

<!-- ADD / EDIT QUESTION -->
<div class="overlay" id="modal-q">
    <div class="modal">
        <div class="modal-header">
            <h3 id="modal-q-title">سؤال جديد</h3>
            <button class="close-btn" onclick="closeModal('modal-q')">✕</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>نص السؤال</label>
                <textarea id="q-text" placeholder="اكتب السؤال هنا..."></textarea>
            </div>
            <div class="form-group">
                <label>القسم</label>
                <select id="q-category"></select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('modal-q')">إلغاء</button>
            <button class="btn btn-primary" onclick="saveQuestion()">حفظ</button>
        </div>
    </div>
</div>

<!-- CONFIRM DELETE -->
<div class="overlay" id="modal-confirm">
    <div class="modal confirm-modal" style="max-width:360px">
        <div class="modal-header">
            <h3>تأكيد الحذف</h3>
            <button class="close-btn" onclick="closeModal('modal-confirm')">✕</button>
        </div>
        <div class="modal-body">
            <div class="confirm-icon">🗑️</div>
            <p class="confirm-msg" id="confirm-msg">هل أنت متأكد من الحذف؟</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('modal-confirm')">لا، إلغاء</button>
            <button class="btn btn-danger" id="confirm-ok-btn">نعم، احذف</button>
        </div>
    </div>
</div>

<!-- TOAST -->
<div class="toast-wrap" id="toast-wrap"></div>

<script>
// ── STATE ─────────────────────────────────────────────────────────────────────
let cats = <?= $categoriesJson ?>;
let qs   = <?= $questionsJson ?>;
let editingCatId   = null;
let editingQId     = null;
let activeFilter   = 'all';

// ── INIT ──────────────────────────────────────────────────────────────────────
renderAll();

function renderAll() {
    renderDashboard();
    renderCategories();
    renderQuestions();
    renderQChips();
    renderQSelect();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('section-' + name).classList.add('active');
    document.getElementById('nav-' + name).classList.add('active');
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    document.getElementById('stat-cats').textContent = cats.length;
    document.getElementById('stat-qs').textContent   = qs.length;
    document.getElementById('stat-avg').textContent  = cats.length ? Math.round(qs.length / cats.length) : 0;

    const tbody = document.getElementById('dash-table');
    tbody.innerHTML = cats.map(c => {
        const count = qs.filter(q => q.category === c.id).length;
        return `<tr>
            <td><span class="cat-badge" style="background:${c.color}22;color:${c.color}">${c.name}</span></td>
            <td>${c.emoji}</td>
            <td><span class="color-swatch"><span class="swatch" style="background:${c.color}"></span>${c.color}</span></td>
            <td style="font-family:var(--mono);font-size:.8rem">${count}</td>
        </tr>`;
    }).join('');
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────
function renderCategories() {
    const tbody = document.getElementById('cat-table');
    if (!cats.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-icon">🗂️</div><p>لا يوجد أقسام بعد</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = cats.map(c => {
        const count = qs.filter(q => q.category === c.id).length;
        return `<tr>
            <td class="id-col">${c.id}</td>
            <td><strong>${c.name}</strong></td>
            <td style="font-size:1.3rem">${c.emoji}</td>
            <td><span class="color-swatch"><span class="swatch" style="background:${c.color}"></span>${c.color}</span></td>
            <td style="font-family:var(--mono);font-size:.8rem">${count}</td>
            <td class="actions">
                <div class="actions-wrap">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditCategory('${c.id}')" title="تعديل">✏️</button>
                    <button class="btn btn-danger btn-sm btn-icon" onclick="confirmDeleteCategory('${c.id}')" title="حذف">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openAddCategory() {
    editingCatId = null;
    document.getElementById('modal-cat-title').textContent = 'قسم جديد';
    document.getElementById('cat-id').value        = '';
    document.getElementById('cat-id').disabled     = false;
    document.getElementById('cat-name').value      = '';
    document.getElementById('cat-emoji').value     = '';
    document.getElementById('cat-color-hex').value = '#FF6B35';
    document.getElementById('cat-color-pick').value= '#FF6B35';
    openModal('modal-cat');
}

function openEditCategory(id) {
    const c = cats.find(x => x.id === id);
    if (!c) return;
    editingCatId = id;
    document.getElementById('modal-cat-title').textContent = 'تعديل القسم';
    document.getElementById('cat-id').value        = c.id;
    document.getElementById('cat-id').disabled     = true;
    document.getElementById('cat-name').value      = c.name;
    document.getElementById('cat-emoji').value     = c.emoji;
    document.getElementById('cat-color-hex').value = c.color;
    document.getElementById('cat-color-pick').value= c.color;
    openModal('modal-cat');
}

async function saveCategory() {
    const id    = document.getElementById('cat-id').value.trim();
    const name  = document.getElementById('cat-name').value.trim();
    const emoji = document.getElementById('cat-emoji').value.trim();
    const color = document.getElementById('cat-color-hex').value.trim();

    if (!id || !name || !emoji || !color) { toast('كل الحقول مطلوبة', 'error'); return; }
    if (!editingCatId && cats.find(c => c.id === id)) { toast('معرّف القسم موجود مسبقاً', 'error'); return; }

    const action = editingCatId ? 'edit_category' : 'add_category';
    const res = await api({ action, id, name, emoji, color });
    if (!res.ok) return;

    if (editingCatId) {
        const c = cats.find(x => x.id === editingCatId);
        Object.assign(c, { name, emoji, color });
    } else {
        cats.push({ id, name, emoji, color });
    }

    closeModal('modal-cat');
    renderAll();
    toast(editingCatId ? 'تم تعديل القسم ✓' : 'تم إضافة القسم ✓', 'success');
}

function confirmDeleteCategory(id) {
    const c = cats.find(x => x.id === id);
    const count = qs.filter(q => q.category === id).length;
    document.getElementById('confirm-msg').innerHTML =
        `هل تريد حذف قسم <strong>${c.name}</strong>؟<br>سيتم حذف <strong>${count}</strong> سؤال معه أيضاً.`;
    document.getElementById('confirm-ok-btn').onclick = () => deleteCategory(id);
    openModal('modal-confirm');
}

async function deleteCategory(id) {
    const res = await api({ action: 'delete_category', id });
    if (!res.ok) return;
    cats = cats.filter(c => c.id !== id);
    qs   = qs.filter(q => q.category !== id);
    closeModal('modal-confirm');
    renderAll();
    toast('تم حذف القسم ✓', 'success');
}

// ── QUESTIONS ─────────────────────────────────────────────────────────────────
function renderQChips() {
    const el = document.getElementById('q-chips');
    el.innerHTML = `<span class="chip ${activeFilter==='all'?'active':''}" onclick="setFilter('all')">الكل (${qs.length})</span>` +
        cats.map(c => {
            const count = qs.filter(q => q.category === c.id).length;
            return `<span class="chip ${activeFilter===c.id?'active':''}" onclick="setFilter('${c.id}')">${c.emoji} ${c.name} (${count})</span>`;
        }).join('');
}

function setFilter(id) {
    activeFilter = id;
    renderQChips();
    renderQuestions();
}

function renderQuestions() {
    const search = document.getElementById('q-search').value.trim().toLowerCase();
    let list = qs;
    if (activeFilter !== 'all') list = list.filter(q => q.category === activeFilter);
    if (search) list = list.filter(q => q.text.toLowerCase().includes(search));

    const tbody = document.getElementById('q-table');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty"><div class="empty-icon">❓</div><p>لا يوجد أسئلة</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(q => {
        const cat = cats.find(c => c.id === q.category);
        const badge = cat
            ? `<span class="cat-badge" style="background:${cat.color}22;color:${cat.color}">${cat.emoji} ${cat.name}</span>`
            : `<span class="cat-badge" style="background:#333;color:#888">${q.category}</span>`;
        return `<tr>
            <td class="id-col">${q.id}</td>
            <td class="q-text">${q.text}</td>
            <td>${badge}</td>
            <td class="actions">
                <div class="actions-wrap">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="openEditQuestion(${q.id})" title="تعديل">✏️</button>
                    <button class="btn btn-danger btn-sm btn-icon" onclick="confirmDeleteQuestion(${q.id})" title="حذف">🗑</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderQSelect() {
    const sel = document.getElementById('q-category');
    const cur = sel.value;
    sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join('');
    if (cur) sel.value = cur;
}

function openAddQuestion() {
    editingQId = null;
    document.getElementById('modal-q-title').textContent = 'سؤال جديد';
    document.getElementById('q-text').value = '';
    renderQSelect();
    if (activeFilter !== 'all') document.getElementById('q-category').value = activeFilter;
    openModal('modal-q');
}

function openEditQuestion(id) {
    const q = qs.find(x => x.id === id);
    if (!q) return;
    editingQId = id;
    document.getElementById('modal-q-title').textContent = 'تعديل السؤال';
    document.getElementById('q-text').value = q.text;
    renderQSelect();
    document.getElementById('q-category').value = q.category;
    openModal('modal-q');
}

async function saveQuestion() {
    const text     = document.getElementById('q-text').value.trim();
    const category = document.getElementById('q-category').value;
    if (!text) { toast('نص السؤال مطلوب', 'error'); return; }

    const action = editingQId ? 'edit_question' : 'add_question';
    const res = await api({ action, id: editingQId, text, category });
    if (!res.ok) return;

    if (editingQId) {
        const q = qs.find(x => x.id === editingQId);
        Object.assign(q, { text, category });
    } else {
        const maxId = qs.length ? Math.max(...qs.map(q => q.id)) : 0;
        qs.push({ id: maxId + 1, text, category });
    }

    closeModal('modal-q');
    renderAll();
    toast(editingQId ? 'تم تعديل السؤال ✓' : 'تم إضافة السؤال ✓', 'success');
}

function confirmDeleteQuestion(id) {
    const q = qs.find(x => x.id === id);
    document.getElementById('confirm-msg').innerHTML =
        `هل تريد حذف هذا السؤال؟<br><strong>${q.text}</strong>`;
    document.getElementById('confirm-ok-btn').onclick = () => deleteQuestion(id);
    openModal('modal-confirm');
}

async function deleteQuestion(id) {
    const res = await api({ action: 'delete_question', id });
    if (!res.ok) return;
    qs = qs.filter(q => q.id !== id);
    closeModal('modal-confirm');
    renderAll();
    toast('تم حذف السؤال ✓', 'success');
}

// ── COLOR SYNC ────────────────────────────────────────────────────────────────
function syncColorHex()    { document.getElementById('cat-color-hex').value  = document.getElementById('cat-color-pick').value; }
function syncColorPicker() {
    const v = document.getElementById('cat-color-hex').value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) document.getElementById('cat-color-pick').value = v;
}

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// ── API ───────────────────────────────────────────────────────────────────────
async function api(body) {
    try {
        const r = await fetch('', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await r.json();
        if (!data.ok) { toast(data.error || 'حدث خطأ', 'error'); }
        return data;
    } catch(e) {
        toast('خطأ في الاتصال', 'error');
        return { ok: false };
    }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
    const wrap = document.getElementById('toast-wrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = (type === 'success' ? '✅' : '❌') + ' ' + msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
</script>
</body>
</html>
