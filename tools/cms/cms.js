// ====================================================================
// CONFIGURATION
// ====================================================================
const API_URL        = 'cms.php';
const IMAGE_BASE_PATH = '../img/';
// ====================================================================

// --- DOM REFS ---
const projectList       = document.getElementById('project-list');
const projectModal      = document.getElementById('project-modal');
const confirmModal      = document.getElementById('confirm-modal');
const form              = document.getElementById('project-form');
const modalH3           = document.getElementById('modal-h3');
const modalSubtitle     = document.getElementById('modal-subtitle');
const modalIcon         = document.getElementById('modal-icon');
const modalSubmitBtn    = document.getElementById('modal-submit-btn');
const confirmActionBtn  = document.getElementById('confirm-action-btn');
const confirmCancelBtn  = document.getElementById('confirm-cancel-btn');
const confirmTitle      = document.getElementById('confirm-title');
const confirmMessage    = document.getElementById('confirm-message');
const searchInput       = document.getElementById('search-input');
const toastWrap         = document.getElementById('toast-wrap');
const themeToggleBtn    = document.getElementById('theme-toggle-btn');
const themeIcon         = document.getElementById('theme-icon');

// Image elements
const currentImageContainer = document.getElementById('current-image-container');
const imagePreview          = document.getElementById('image-preview');
const imageFileInput        = document.getElementById('image-file');
const deleteImageCheckbox   = document.getElementById('delete-image');
const imagePathHidden       = document.getElementById('image-path-hidden');
const formMethodInput       = document.getElementById('form-method');

// Stat elements
const statTotal  = document.getElementById('stat-total');
const statTags   = document.getElementById('stat-tags');
const statImages = document.getElementById('stat-images');

let currentProjects = [];
let filteredProjects = [];
let draggingElement  = null;
let confirmCallback  = null;


// ====================================================================
// THEME
// ====================================================================
function initTheme() {
    const saved = localStorage.getItem('cms-theme') || 'dark-theme';
    document.body.className = saved;
    updateThemeIcon(saved);
}

function toggleTheme() {
    const isDark   = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light-theme' : 'dark-theme';
    document.body.className = newTheme;
    localStorage.setItem('cms-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (theme === 'dark-theme') {
        // Sun icon (switch to light)
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364-.707-.707M6.343 6.343l-.707-.707
               m12.728 0-.707.707M6.343 17.657l-.707.707M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"/>`;
    } else {
        // Moon icon (switch to dark)
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0 1 12 15.75c-2.427 0-4.718-.584-6.752-1.55
               a9.088 9.088 0 0 0 6.75-8.548 9.088 9.088 0 0 1 6.75 8.548Z"/>`;
    }
}

themeToggleBtn.addEventListener('click', toggleTheme);


// ====================================================================
// TOASTS
// ====================================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i>
        <span>${message}</span>
    `;
    toastWrap.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}


// ====================================================================
// STATS
// ====================================================================
function updateStats(projects) {
    statTotal.textContent  = projects.length;
    const tags = new Set(projects.map(p => p.tag).filter(Boolean));
    statTags.textContent   = tags.size;
    statImages.textContent = projects.filter(p => p.image).length;
}


// ====================================================================
// SCROLL REVEAL
// ====================================================================
function initReveal() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}


// ====================================================================
// API HELPERS
// ====================================================================
async function apiCall(method, data = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (data) opts.body = JSON.stringify(data);

    try {
        const res = await fetch(API_URL, opts);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success === false) throw new Error(result.message || 'API error');
        return result;
    } catch (err) {
        console.error('API Error:', err);
        showToast(err.message, 'error');
        return { success: false };
    }
}


// ====================================================================
// MODAL OPEN / CLOSE
// ====================================================================
function openProjectModal(project = null) {
    form.reset();
    currentImageContainer.classList.remove('show');
    imagePreview.src     = '';
    deleteImageCheckbox.checked = false;
    imagePathHidden.value = '';

    if (project) {
        modalH3.textContent       = 'Edit Project';
        modalSubtitle.textContent = project.name;
        modalIcon.className       = 'fa-solid fa-pen-to-square';
        modalSubmitBtn.innerHTML  = '<i class="fa-solid fa-floppy-disk"></i> Update Project';
        form.dataset.mode         = 'update';
        formMethodInput.value     = 'PUT';

        document.getElementById('project-id').value  = project.id;
        document.getElementById('name').value         = project.name;
        document.getElementById('path').value         = project.path;
        document.getElementById('tag').value          = project.tag  || '';
        document.getElementById('style').value        = project.style || '';
        document.getElementById('description').value  = project.description || '';
        document.getElementById('story').value        = project.story || '';

        if (project.image) {
            imagePreview.src = project.image;
            currentImageContainer.classList.add('show');
            imagePathHidden.value = project.image;
        }
    } else {
        modalH3.textContent       = 'New Project';
        modalSubtitle.textContent = 'Fill in the details below';
        modalIcon.className       = 'fa-solid fa-plus';
        modalSubmitBtn.innerHTML  = '<i class="fa-solid fa-floppy-disk"></i> Create Project';
        form.dataset.mode         = 'create';
        formMethodInput.value     = 'POST';
        document.getElementById('project-id').value = '';
    }

    projectModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('name').focus(), 80);
}

function closeProjectModal() {
    projectModal.classList.remove('open');
    document.body.style.overflow = '';
    form.reset();
}

function openConfirmModal(title, message, callback) {
    confirmTitle.textContent   = title;
    confirmMessage.innerHTML   = message;
    confirmCallback            = callback;
    confirmModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    confirmActionBtn.focus();
}

function closeConfirmModal() {
    confirmModal.classList.remove('open');
    document.body.style.overflow = '';
    confirmCallback = null;
}


// ====================================================================
// RENDER
// ====================================================================
function renderProjects(projects) {
    projectList.innerHTML = '';

    if (!projects || projects.length === 0) {
        projectList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No projects yet — add one above</p>
            </div>`;
        return;
    }

    projects.forEach(project => {
        const item = document.createElement('div');
        item.className    = 'project-item';
        item.dataset.id   = project.id;
        item.draggable    = true;

        const thumb = project.image
            ? `<div class="project-thumb"><img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)}" loading="lazy"></div>`
            : `<div class="project-thumb"><div class="project-thumb-placeholder"><i class="fa-regular fa-image"></i></div></div>`;

        const tagChip   = project.tag   ? `<span class="tag-chip">${escapeHtml(project.tag)}</span>`   : '';
        const styleChip = project.style ? `<span class="tag-chip">${escapeHtml(project.style)}</span>` : '';

        item.innerHTML = `
            ${thumb}
            <div class="project-info">
                <div class="project-name">
                    ${escapeHtml(project.name)}
                    <span class="project-id-badge">#${project.id}</span>
                </div>
                <div class="project-tags">${tagChip}${styleChip}</div>
                <div class="project-path">
                    <i class="fa-solid fa-link"></i>${escapeHtml(project.path || '—')}
                </div>
                <div class="project-desc">${escapeHtml(project.description || '')}</div>
            </div>
            <div class="project-actions">
                <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                <button class="btn btn-secondary btn-sm edit-btn" data-id="${project.id}" title="Edit">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm delete-btn" data-id="${project.id}" title="Delete">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;

        item.querySelector('.edit-btn').addEventListener('click', () => {
            const p = currentProjects.find(x => x.id === project.id);
            if (p) openProjectModal(p);
        });

        item.querySelector('.delete-btn').addEventListener('click', () => {
            const p = currentProjects.find(x => x.id === project.id);
            if (!p) return;
            openConfirmModal(
                'Delete Project',
                `You are about to permanently delete:<span class="confirm-project-name">${escapeHtml(p.name)}</span>This also deletes the associated image file.`,
                () => deleteProject(p.id)
            );
        });

        // Drag & drop
        item.addEventListener('dragstart',  handleDragStart);
        item.addEventListener('dragover',   handleDragOver);
        item.addEventListener('dragleave',  handleDragLeave);
        item.addEventListener('drop',       handleDrop);
        item.addEventListener('dragend',    handleDragEnd);

        projectList.appendChild(item);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

function applySearch(query) {
    const q = query.toLowerCase().trim();
    filteredProjects = q
        ? currentProjects.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.tag  || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.path || '').toLowerCase().includes(q)
          )
        : currentProjects;
    renderProjects(filteredProjects);
}


// ====================================================================
// FETCH
// ====================================================================
async function fetchProjects() {
    projectList.innerHTML = `<div class="loading-state"><div class="spinner"></div>Loading projects…</div>`;
    const result = await apiCall('GET');

    if (result.success) {
        currentProjects  = result.data || [];
        filteredProjects = currentProjects;
        updateStats(currentProjects);
        applySearch(searchInput.value);
    } else {
        projectList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i>
                <p>Failed to load — check server & data.json</p>
            </div>`;
    }
}


// ====================================================================
// CRUD
// ====================================================================
async function handleFormSubmit(e) {
    e.preventDefault();
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

    const formData = new FormData(form);

    try {
        const res = await fetch(API_URL, { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (result.success === false) throw new Error(result.message || 'API error');

        closeProjectModal();
        await fetchProjects();
        const isEdit = form.dataset.mode === 'update';
        showToast(isEdit ? 'Project updated successfully.' : 'Project created successfully.');
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }

    modalSubmitBtn.disabled = false;
    modalSubmitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Project';
}

async function deleteProject(id) {
    closeConfirmModal();
    const result = await apiCall('DELETE', { id });
    if (result.success) {
        await fetchProjects();
        showToast('Project deleted.');
    }
}


// ====================================================================
// DRAG & DROP
// ====================================================================
function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll('.project-item:not(.dragging)')];
    return items.reduce((closest, child) => {
        const box    = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDragStart(e) {
    draggingElement = e.currentTarget;
    setTimeout(() => e.currentTarget.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    if (!draggingElement) return;
    const after = getDragAfterElement(projectList, e.clientY);
    after ? projectList.insertBefore(draggingElement, after)
          : projectList.appendChild(draggingElement);
}

function handleDragLeave() {}

async function handleDrop(e) {
    e.preventDefault();
    if (!draggingElement) return;
    const newOrder = [...projectList.querySelectorAll('.project-item')].map(n => parseInt(n.dataset.id));
    const result = await apiCall('PUT', { reorder: true, new_order: newOrder });
    if (result.success) {
        await fetchProjects();
        showToast('Order saved.');
    }
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggingElement = null;
}


// ====================================================================
// EVENT WIRING
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initReveal();
    fetchProjects();
});

// "Add" buttons (header + toolbar)
document.getElementById('show-create-modal-btn').addEventListener('click', () => openProjectModal());
document.getElementById('header-add-btn').addEventListener('click',        () => openProjectModal());

// Form submit
form.addEventListener('submit', handleFormSubmit);

// Search
searchInput.addEventListener('input', () => applySearch(searchInput.value));

// Close buttons (all .close-btn inside both modals)
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (projectModal.contains(btn)) closeProjectModal();
        if (confirmModal.contains(btn)) closeConfirmModal();
    });
});

// Click backdrop to close
window.addEventListener('click', e => {
    if (e.target === projectModal) closeProjectModal();
    if (e.target === confirmModal) closeConfirmModal();
});

// Escape key
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (projectModal.classList.contains('open')) closeProjectModal();
    if (confirmModal.classList.contains('open'))  closeConfirmModal();
});

// Confirm / cancel
confirmActionBtn.addEventListener('click', () => { if (confirmCallback) confirmCallback(); });
confirmCancelBtn.addEventListener('click', closeConfirmModal);
