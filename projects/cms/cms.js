/**
 * Mahdi Yasser — Projects CMS
 * Full AJAX operation — zero page reloads, zero redirects.
 */

/* ================================================================
   UTILS
   ================================================================ */
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/* ================================================================
   MODAL SYSTEM — replaces all confirm() / alert() / prompt()
   Styles injected once into <head> on first call.
   ================================================================ */
(function () {
    var _stylesInjected = false;

    function injectStyles() {
        if (_stylesInjected) return;
        _stylesInjected = true;
        var s = document.createElement('style');
        s.id = 'cms-modal-styles';
        s.textContent = [
            /* Backdrop */
            '.cms-modal-backdrop{',
                'position:fixed;inset:0;',
                'background:rgba(0,0,0,0.72);',
                'display:flex;align-items:center;justify-content:center;',
                'padding:1.25rem;',
                'z-index:99000;',
                'opacity:0;',
                'transition:opacity .2s ease;',
                'pointer-events:none;',
            '}',
            '.cms-modal-backdrop.active{opacity:1;pointer-events:all;}',

            /* Dialog box */
            '.cms-modal{',
                'background:#13131a;',
                'border:1px solid rgba(255,255,255,0.08);',
                'border-radius:14px;',
                'box-shadow:0 24px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(240,165,0,0.07);',
                'padding:2rem 2rem 1.5rem;',
                'max-width:420px;width:100%;',
                'transform:translateY(12px) scale(0.97);',
                'transition:transform .22s cubic-bezier(0.22,1,0.36,1);',
                'font-family:\'Syne\',sans-serif;',
            '}',
            '.cms-modal-backdrop.active .cms-modal{transform:translateY(0) scale(1);}',

            /* Icon row */
            '.cms-modal-icon{',
                'width:44px;height:44px;border-radius:50%;',
                'display:flex;align-items:center;justify-content:center;',
                'margin-bottom:1.1rem;font-size:1.1rem;',
            '}',
            '.cms-modal-icon.danger{background:rgba(239,68,68,0.12);color:#ef4444;}',
            '.cms-modal-icon.warning{background:rgba(240,165,0,0.12);color:#f0a500;}',
            '.cms-modal-icon.info{background:rgba(99,102,241,0.12);color:#818cf8;}',

            /* Title */
            '.cms-modal-title{',
                'font-size:1.05rem;font-weight:700;',
                'color:#e8e8f0;margin-bottom:0.55rem;line-height:1.3;',
            '}',

            /* Body text */
            '.cms-modal-body{',
                'font-family:\'JetBrains Mono\',monospace;',
                'font-size:0.78rem;line-height:1.7;',
                'color:#6a6a90;margin-bottom:1.75rem;',
            '}',
            '.cms-modal-body strong{color:#a0a0c0;font-weight:600;}',

            /* Prompt input */
            '.cms-modal-input{',
                'width:100%;background:#0c0c0f;',
                'border:1px solid rgba(255,255,255,0.1);',
                'border-radius:8px;',
                'color:#e8e8f0;',
                'font-family:\'JetBrains Mono\',monospace;',
                'font-size:0.82rem;',
                'padding:0.6rem 0.85rem;',
                'margin-bottom:1.5rem;',
                'outline:none;',
                'transition:border-color .18s;',
            '}',
            '.cms-modal-input:focus{border-color:rgba(240,165,0,0.5);}',

            /* Button row */
            '.cms-modal-actions{display:flex;gap:0.65rem;justify-content:flex-end;}',

            /* Buttons */
            '.cms-modal-btn{',
                'display:inline-flex;align-items:center;gap:0.4rem;',
                'padding:0.5rem 1.1rem;border-radius:8px;',
                'font-family:\'JetBrains Mono\',monospace;',
                'font-size:0.76rem;font-weight:600;',
                'letter-spacing:0.04em;',
                'cursor:pointer;border:none;',
                'transition:all .18s ease;',
                'user-select:none;',
            '}',
            '.cms-modal-btn-cancel{',
                'background:rgba(255,255,255,0.05);',
                'color:#7070a0;border:1px solid rgba(255,255,255,0.08);',
            '}',
            '.cms-modal-btn-cancel:hover{background:rgba(255,255,255,0.09);color:#a0a0c0;}',
            '.cms-modal-btn-danger{',
                'background:rgba(239,68,68,0.15);',
                'color:#ef4444;border:1px solid rgba(239,68,68,0.25);',
            '}',
            '.cms-modal-btn-danger:hover{background:rgba(239,68,68,0.25);border-color:rgba(239,68,68,0.5);}',
            '.cms-modal-btn-confirm{',
                'background:rgba(240,165,0,0.12);',
                'color:#f0a500;border:1px solid rgba(240,165,0,0.22);',
            '}',
            '.cms-modal-btn-confirm:hover{background:rgba(240,165,0,0.22);border-color:rgba(240,165,0,0.45);}',
        ].join('');
        document.head.appendChild(s);
    }

    /**
     * cmsConfirm(options, onConfirm, onCancel)
     *
     * options = {
     *   title:   string   (default "Are you sure?")
     *   message: string   (HTML allowed, wrap highlights in <strong>)
     *   type:    'danger' | 'warning' | 'info'  (default 'danger')
     *   confirmText: string (default 'Confirm')
     *   cancelText:  string (default 'Cancel')
     * }
     */
    window.cmsConfirm = function (options, onConfirm, onCancel) {
        injectStyles();
        if (typeof options === 'string') options = { message: options };
        var type        = options.type        || 'danger';
        var title       = options.title       || 'Are you sure?';
        var message     = options.message     || '';
        var confirmText = options.confirmText || 'Confirm';
        var cancelText  = options.cancelText  || 'Cancel';

        var iconMap = {
            danger:  'fa-triangle-exclamation',
            warning: 'fa-circle-exclamation',
            info:    'fa-circle-info'
        };
        var btnClass = type === 'danger' ? 'cms-modal-btn-danger' : 'cms-modal-btn-confirm';

        var backdrop = document.createElement('div');
        backdrop.className = 'cms-modal-backdrop';
        backdrop.innerHTML =
            '<div class="cms-modal" role="dialog" aria-modal="true">' +
                '<div class="cms-modal-icon ' + type + '">' +
                    '<i class="fa-solid ' + (iconMap[type] || iconMap.danger) + '"></i>' +
                '</div>' +
                '<div class="cms-modal-title">' + escHtml(title) + '</div>' +
                '<div class="cms-modal-body">' + message + '</div>' +
                '<div class="cms-modal-actions">' +
                    '<button class="cms-modal-btn cms-modal-btn-cancel" data-action="cancel">' +
                        '<i class="fa-solid fa-xmark"></i> ' + escHtml(cancelText) +
                    '</button>' +
                    '<button class="cms-modal-btn ' + btnClass + '" data-action="confirm">' +
                        '<i class="fa-solid fa-check"></i> ' + escHtml(confirmText) +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(backdrop);

        function close(confirmed) {
            backdrop.classList.remove('active');
            setTimeout(function () { backdrop.remove(); }, 220);
            if (confirmed && typeof onConfirm === 'function') onConfirm();
            else if (!confirmed && typeof onCancel === 'function') onCancel();
        }

        // Animate in
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { backdrop.classList.add('active'); });
        });

        // Button clicks
        backdrop.addEventListener('click', function (e) {
            var action = e.target.closest('[data-action]');
            if (action) close(action.dataset.action === 'confirm');
            else if (e.target === backdrop) close(false); // click outside
        });

        // Keyboard
        function onKey(e) {
            if (e.key === 'Enter')  { document.removeEventListener('keydown', onKey); close(true);  }
            if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(false); }
        }
        document.addEventListener('keydown', onKey);

        // Focus confirm button
        setTimeout(function () {
            var confirmBtn = backdrop.querySelector('[data-action="confirm"]');
            if (confirmBtn) confirmBtn.focus();
        }, 50);
    };

    /**
     * cmsAlert(options)
     *
     * options = { title, message, type, btnText }
     */
    window.cmsAlert = function (options) {
        injectStyles();
        if (typeof options === 'string') options = { message: options };
        var type    = options.type    || 'info';
        var title   = options.title   || 'Notice';
        var message = options.message || '';
        var btnText = options.btnText || 'OK';

        var iconMap = {
            danger:  'fa-triangle-exclamation',
            warning: 'fa-circle-exclamation',
            info:    'fa-circle-info',
            success: 'fa-circle-check'
        };

        var backdrop = document.createElement('div');
        backdrop.className = 'cms-modal-backdrop';
        backdrop.innerHTML =
            '<div class="cms-modal" role="alertdialog" aria-modal="true">' +
                '<div class="cms-modal-icon ' + type + '">' +
                    '<i class="fa-solid ' + (iconMap[type] || iconMap.info) + '"></i>' +
                '</div>' +
                '<div class="cms-modal-title">' + escHtml(title) + '</div>' +
                '<div class="cms-modal-body">' + message + '</div>' +
                '<div class="cms-modal-actions">' +
                    '<button class="cms-modal-btn cms-modal-btn-confirm" data-action="ok">' +
                        escHtml(btnText) +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(backdrop);

        function close() {
            backdrop.classList.remove('active');
            setTimeout(function () { backdrop.remove(); }, 220);
        }

        requestAnimationFrame(function () {
            requestAnimationFrame(function () { backdrop.classList.add('active'); });
        });

        backdrop.addEventListener('click', function (e) {
            if (e.target.closest('[data-action]') || e.target === backdrop) close();
        });

        function onKey(e) {
            if (e.key === 'Enter' || e.key === 'Escape') {
                document.removeEventListener('keydown', onKey);
                close();
            }
        }
        document.addEventListener('keydown', onKey);

        setTimeout(function () {
            var btn = backdrop.querySelector('[data-action]');
            if (btn) btn.focus();
        }, 50);
    };
})();

/* ================================================================
   TOAST
   ================================================================ */
function showToast(msg, type, duration) {
    type     = type     || 'success';
    duration = duration || 4000;
    var toaster = document.getElementById('cms-toaster');
    if (!toaster) return;
    var isOk = type === 'success';
    var t = document.createElement('div');
    t.style.cssText = [
        'background:' + (isOk ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)'),
        'border:1.5px solid ' + (isOk ? '#22c55e' : '#ef4444'),
        'color:' + (isOk ? '#22c55e' : '#ef4444'),
        'border-radius:8px',
        'font-family:\'JetBrains Mono\',monospace',
        'font-size:0.79rem',
        'line-height:1.55',
        'padding:0.8rem 1.05rem',
        'display:flex', 'align-items:flex-start', 'gap:0.55rem',
        'box-shadow:0 4px 24px rgba(0,0,0,0.45)',
        'pointer-events:all',
        'opacity:0', 'transform:translateY(6px)',
        'transition:opacity .22s,transform .22s',
        'word-break:break-word'
    ].join(';');
    t.innerHTML = '<i class="fa-solid ' + (isOk ? 'fa-circle-check' : 'fa-circle-exclamation') +
                  '" style="margin-top:2px;flex-shrink:0"></i><span>' + msg + '</span>';
    toaster.appendChild(t);
    requestAnimationFrame(function () {
        t.style.opacity    = '1';
        t.style.transform  = 'translateY(0)';
    });
    setTimeout(function () {
        t.style.opacity   = '0';
        t.style.transform = 'translateY(6px)';
        setTimeout(function () { t.remove(); }, 250);
    }, duration);
}

/* ================================================================
   AJAX SUBMIT — returns promise, never throws
   ================================================================ */
function ajaxSubmit(form) {
    var fd = new FormData(form);
    fd.set('_ajax', '1');

    // sync tag_hidden before submit
    var sel = form.querySelector('#tag_select');
    var ti  = form.querySelector('#tag_new');
    var hid = form.querySelector('#tag_hidden');
    if (sel && ti && hid) {
        hid.value = (sel.value === 'new' || sel.value === '')
            ? ti.value
            : sel.options[sel.selectedIndex].text;
        fd.set('tag_hidden', hid.value);
    }

    return fetch(form.action || window.location.pathname, { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .catch(function (e) { return { ok: false, errors: ['Network error: ' + e.message] }; });
}

/* ================================================================
   CLEAR FORM — reset post form to "create new" state
   ================================================================ */
function clearForm() {
    var form = document.getElementById('postForm');
    if (!form) return;

    form.querySelectorAll('input[type=text], input[type=date], input[type=time], textarea')
        .forEach(function (el) { el.value = ''; });
    form.querySelectorAll('input[type=file]').forEach(function (el) { el.value = null; });
    form.querySelectorAll('.js-preview').forEach(function (el) { el.remove(); });

    // Reset auto-fill date/time
    var di  = form.querySelector('input[name="date"]');
    var ti2 = form.querySelector('input[name="time"]');
    if (di)  di.value  = new Date().toISOString().slice(0, 10);
    if (ti2) ti2.value = new Date().toTimeString().slice(0, 5);

    // Clear hidden edit fields
    var editSlug     = document.getElementById('edit_slug');
    var origTagSlug  = document.getElementById('orig_tag_slug_hidden');
    if (editSlug)    editSlug.value    = '';
    if (origTagSlug) origTagSlug.value = '';

    // Clear edit-media section
    var editMedia = document.getElementById('edit-media-section');
    if (editMedia) editMedia.innerHTML = '';

    // Reset panel labels
    var lbl = document.getElementById('post-form-label');
    if (lbl) lbl.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Create Post';
    var ttl = document.getElementById('post-form-title');
    if (ttl) ttl.textContent = 'New Post';

    // Reset submit button
    var btn = document.getElementById('post-submit-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Create Post';

    // Hide cancel button
    var cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    // Clear session form_data in background (silent)
    fetch(window.location.pathname + '?clear=1').catch(function () {});
}

/* ================================================================
   BIND DELETE HANDLERS (called on load + after dynamic content add)
   ================================================================ */
function bindDeleteHandlers() {
    // Post deletes
    document.querySelectorAll('.delete-post-form:not([data-bound])').forEach(function (form) {
        form.setAttribute('data-bound', '1');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var title = form.dataset.title || 'this post';
            cmsConfirm({
                type:        'danger',
                title:       'Delete Post',
                message:     'Delete <strong>' + escHtml(title) + '</strong>?<br>This cannot be undone.',
                confirmText: 'Delete',
                cancelText:  'Cancel'
            }, function () {
                var btn  = form.querySelector('button');
                var orig = btn ? btn.innerHTML : '';
                if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
                ajaxSubmit(form).then(function (json) {
                    if (json.ok) {
                        showToast(json.message || 'Post deleted', 'success');
                        var rowId = form.dataset.rowId;
                        var row   = rowId ? document.getElementById(rowId) : form.closest('.post-row');
                        if (row) {
                            row.style.opacity    = '0';
                            row.style.transition = 'opacity .25s';
                            setTimeout(function () { row.remove(); }, 260);
                        }
                    } else {
                        showToast((json.errors || ['Delete failed']).join(' · '), 'error');
                        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
                    }
                });
            });
        });
    });

    // Project deletes
    document.querySelectorAll('.delete-project-form:not([data-bound])').forEach(function (form) {
        form.setAttribute('data-bound', '1');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var title = form.dataset.title || 'this project';
            cmsConfirm({
                type:        'danger',
                title:       'Delete Project',
                message:     'Delete project <strong>' + escHtml(title) + '</strong>?<br>All posts must be removed first. This cannot be undone.',
                confirmText: 'Delete Project',
                cancelText:  'Cancel'
            }, function () {
                var btn  = form.querySelector('button');
                var orig = btn ? btn.innerHTML : '';
                if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
                ajaxSubmit(form).then(function (json) {
                    if (json.ok) {
                        showToast(json.message || 'Project deleted', 'success');
                        var cardId = form.dataset.cardId;
                        var card   = cardId ? document.getElementById(cardId) : form.closest('.project-card-cms');
                        if (card) {
                            card.style.opacity    = '0';
                            card.style.transition = 'opacity .25s';
                            setTimeout(function () { card.remove(); }, 260);
                        }
                    } else {
                        showToast((json.errors || ['Delete failed']).join(' · '), 'error');
                        if (btn) { btn.disabled = false; btn.innerHTML = orig; }
                    }
                });
            });
        });
    });
}

/* ================================================================
   BIND POST FORM
   ================================================================ */
function bindPostForm() {
    var form = document.getElementById('postForm');
    if (!form || form.dataset.bound) return;
    form.setAttribute('data-bound', '1');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var btn  = form.querySelector('button[type=submit]');
        var orig = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…'; }

        ajaxSubmit(form).then(function (json) {
            if (btn) { btn.disabled = false; btn.innerHTML = orig; }
            if (json.ok) {
                showToast(json.message || 'Saved!', 'success');
                if (json.editUrl) history.replaceState({}, '', json.editUrl);
                if (json.created) clearForm();
            } else {
                showToast((json.errors || ['Error saving post']).join('<br>'), 'error', 6000);
            }
        });
    });
}

/* ================================================================
   BIND PROJECT FORM
   ================================================================ */
function bindProjectForm() {
    var form = document.getElementById('projectForm');
    if (!form || form.dataset.bound) return;
    form.setAttribute('data-bound', '1');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var btn  = form.querySelector('button[type=submit]');
        var orig = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…'; }

        ajaxSubmit(form).then(function (json) {
            if (btn) { btn.disabled = false; btn.innerHTML = orig; }
            if (json.ok) {
                showToast(json.message || 'Project saved!', 'success');
                if (json.created !== false) {
                    // Reset project form to "create" state after successful create
                    cancelEditProject();
                }
            } else {
                showToast((json.errors || ['Error saving project']).join('<br>'), 'error', 6000);
            }
        });
    });
}

/* ================================================================
   TAB SWITCHER (internal use)
   ================================================================ */
function activateTab(id) {
    document.querySelectorAll('.snav-item[data-tab]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === id);
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'tab-' + id);
    });
    sessionStorage.setItem('cms_tab', id);
    // close mobile sidebar
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

/* ================================================================
   LOAD POST FOR EDITING (AJAX — no page reload)
   ================================================================ */
function loadEditPost(slug, tag) {
    activateTab('post-form');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var form = document.getElementById('postForm');
    if (!form) return;

    // Immediate loading indicator
    var titleField = form.querySelector('[name="title"]');
    if (titleField) titleField.value = 'Loading…';

    fetch(window.location.pathname + '?action=get_post&slug=' + encodeURIComponent(slug) + '&tag=' + encodeURIComponent(tag))
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.ok) {
                showToast(data.errors ? data.errors.join(' · ') : 'Failed to load post', 'error');
                if (titleField) titleField.value = '';
                return;
            }

            // -- Hidden edit fields --
            var editSlug    = document.getElementById('edit_slug');
            var origTagSlug = document.getElementById('orig_tag_slug_hidden');
            if (editSlug)    editSlug.value    = data.slug;
            if (origTagSlug) origTagSlug.value = data.orig_tag_slug;

            // -- Basic fields --
            if (titleField)                              titleField.value                                        = data.title    || '';
            var dateF = form.querySelector('[name="date"]');    if (dateF)     dateF.value     = data.date     || '';
            var timeF = form.querySelector('[name="time"]');    if (timeF)     timeF.value     = data.time     || '';
            var locF  = form.querySelector('[name="location"]');if (locF)      locF.value      = data.location || '';
            var bioF  = form.querySelector('[name="bio"]');     if (bioF)      bioF.value      = data.bio      || '';
            var conF  = form.querySelector('[name="content"]'); if (conF)      conF.value      = data.content  || '';

            // -- Tag/project select --
            var sel      = form.querySelector('#tag_select');
            var tagInput = form.querySelector('#tag_new');
            var tagHid   = form.querySelector('#tag_hidden');
            if (sel && data.tag) {
                var found = false;
                for (var i = 0; i < sel.options.length; i++) {
                    if (sel.options[i].text === data.tag) {
                        sel.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found && tagInput) {
                    sel.value = 'new';
                    tagInput.value = data.tag;
                    tagInput.style.display = 'block';
                } else if (tagInput) {
                    tagInput.style.display = 'none';
                    tagInput.value = '';
                }
                if (tagHid) tagHid.value = data.tag;
            }

            // -- Panel labels --
            var lbl = document.getElementById('post-form-label');
            if (lbl) lbl.innerHTML = '<i class="fa-solid fa-pen"></i> Editing Post';
            var ttl = document.getElementById('post-form-title');
            if (ttl) ttl.textContent = data.title || 'Edit Post';

            // -- Submit button --
            var btn = document.getElementById('post-submit-btn');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Post';

            // -- Cancel button --
            var cancelBtn = document.getElementById('cancel-edit-btn');
            if (cancelBtn) cancelBtn.style.display = '';

            // -- Existing media --
            renderEditMedia(data);

            showToast('Loaded: ' + (data.title || slug), 'success', 2000);
        })
        .catch(function (e) {
            showToast('Network error: ' + e.message, 'error');
            if (titleField) titleField.value = '';
        });
}

/* ================================================================
   RENDER EDIT MEDIA SECTION (post images / thumbnail)
   ================================================================ */
function renderEditMedia(data) {
    var section = document.getElementById('edit-media-section');
    if (!section) return;

    var html = '';

    // Thumbnail
    html += '<div class="media-subsection">';
    html += '<p class="media-sub-label">Current Thumbnail</p>';
    if (data.thumbnail) {
        html += '<div class="thumb-wrap">';
        html += '<img src="' + escHtml(data.thumbnail) + '" class="thumb-preview" alt="thumbnail" style="max-width:180px">';
        html += '<label class="delete-toggle"><input type="checkbox" name="delete_thumbnail" value="1"> Delete this thumbnail</label>';
        html += '</div>';
    } else {
        html += '<p class="no-media-msg">No thumbnail set</p>';
    }
    html += '</div>';

    // Existing images
    if (data.images_list && data.images_list.length > 0) {
        html += '<div class="media-subsection">';
        html += '<p class="media-sub-label">Existing Images <span class="field-hint">Check to delete</span></p>';
        html += '<div class="images-preview">';
        data.images_list.forEach(function (img) {
            html += '<div class="img-item">';
            html += '<img src="' + escHtml(img) + '" alt="">';
            html += '<label class="delete-check"><input type="checkbox" name="delete_images[]" value="' + escHtml(img) + '"> Delete</label>';
            html += '</div>';
        });
        html += '</div></div>';
    } else {
        html += '<p class="no-media-msg">No gallery images yet</p>';
    }

    section.innerHTML = html;
}

/* ================================================================
   CANCEL EDIT POST (pure JS, no server call)
   ================================================================ */
function cancelEditPost() {
    clearForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   LOAD PROJECT FOR EDITING (AJAX — no page reload)
   ================================================================ */
function loadEditProject(slug) {
    activateTab('projects');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(window.location.pathname + '?action=get_project&slug=' + encodeURIComponent(slug))
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.ok) {
                showToast(data.errors ? data.errors.join(' · ') : 'Failed to load project', 'error');
                return;
            }

            // Hidden slug for update
            var slugInput = document.getElementById('project_edit_slug');
            if (slugInput) slugInput.value = data.slug;

            // Override the name field to use slug so PHP can find the project
            // project_action=save checks if slug already exists → edit path
            var nameInput = document.querySelector('#projectForm [name="project_name"]');
            var bioInput  = document.querySelector('#projectForm [name="project_bio"]');
            if (nameInput) nameInput.value = data.name;
            if (bioInput)  bioInput.value  = data.bio;

            // Thumbnail section
            var thumbSection = document.getElementById('project-thumb-section');
            if (thumbSection) {
                if (data.thumbnail) {
                    thumbSection.innerHTML =
                        '<div class="media-subsection"><p class="media-sub-label">Current Thumbnail</p>' +
                        '<div class="thumb-wrap">' +
                        '<img src="' + escHtml(data.thumbnail) + '" class="thumb-preview" alt="" style="max-width:180px">' +
                        '<label class="delete-toggle"><input type="checkbox" name="delete_thumbnail" value="1"> Delete this thumbnail</label>' +
                        '</div></div>';
                } else {
                    thumbSection.innerHTML = '';
                }
            }

            // Card title
            var cardTitle = document.getElementById('project-form-card-title');
            if (cardTitle) cardTitle.innerHTML = '<i class="fa-solid fa-pen"></i> Edit: ' + escHtml(data.name);

            // Submit button
            var btn = document.getElementById('project-submit-btn');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Project';

            // Cancel button
            var cancelBtn = document.getElementById('cancel-project-btn');
            if (cancelBtn) cancelBtn.style.display = '';

            showToast('Loaded: ' + (data.name || slug), 'success', 2000);
        })
        .catch(function (e) { showToast('Network error: ' + e.message, 'error'); });
}

/* ================================================================
   CANCEL EDIT PROJECT (pure JS, no server call)
   ================================================================ */
function cancelEditProject() {
    var slugInput = document.getElementById('project_edit_slug');
    if (slugInput) slugInput.value = '';

    var nameInput = document.querySelector('#projectForm [name="project_name"]');
    var bioInput  = document.querySelector('#projectForm [name="project_bio"]');
    if (nameInput) nameInput.value = '';
    if (bioInput)  bioInput.value  = '';

    var thumbSection = document.getElementById('project-thumb-section');
    if (thumbSection) thumbSection.innerHTML = '';

    var cardTitle = document.getElementById('project-form-card-title');
    if (cardTitle) cardTitle.innerHTML = '<i class="fa-solid fa-plus"></i> Create New Project';

    var btn = document.getElementById('project-submit-btn');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Create Project';

    var cancelBtn = document.getElementById('cancel-project-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    // Clear file input
    var fileInput = document.querySelector('#projectForm [name="project_thumbnail"]');
    if (fileInput) fileInput.value = null;
    document.querySelectorAll('#projectForm .js-preview').forEach(function (el) { el.remove(); });
}

/* ================================================================
   DOM READY
   ================================================================ */
document.addEventListener('DOMContentLoaded', function () {

    /* ---- Toaster container ---- */
    if (!document.getElementById('cms-toaster')) {
        var toaster    = document.createElement('div');
        toaster.id     = 'cms-toaster';
        toaster.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;display:flex;flex-direction:column;gap:0.5rem;z-index:9000;pointer-events:none;max-width:360px;width:calc(100% - 3rem)';
        document.body.appendChild(toaster);
    }

    /* ---- Inject hamburger + overlay ---- */
    if (!document.querySelector('.sidebar-toggle')) {
        var toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
        document.body.prepend(toggle);
    }
    if (!document.querySelector('.sidebar-overlay')) {
        var ov    = document.createElement('div');
        ov.className = 'sidebar-overlay';
        document.body.prepend(ov);
    }

    /* ---- Mobile sidebar ---- */
    var sidebar   = document.querySelector('.sidebar');
    var overlay   = document.querySelector('.sidebar-overlay');
    var toggleBtn = document.querySelector('.sidebar-toggle');

    function openSidebar()  { if (sidebar) sidebar.classList.add('open');    if (overlay) overlay.classList.add('open'); }
    function closeSidebar() { if (sidebar) sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('open'); }

    if (toggleBtn) toggleBtn.addEventListener('click', function () {
        sidebar && sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (overlay) overlay.addEventListener('click', closeSidebar);

    /* ---- Tab navigation ---- */
    var navItems  = document.querySelectorAll('.snav-item[data-tab]');
    var urlParams = new URLSearchParams(window.location.search);
    var defaultTab = urlParams.has('edit')         ? 'post-form'
                   : urlParams.has('edit_project') ? 'projects'
                   : 'post-form';

    var restoredTab = (urlParams.has('edit') || urlParams.has('edit_project'))
        ? defaultTab
        : (sessionStorage.getItem('cms_tab') || defaultTab);
    activateTab(restoredTab);

    navItems.forEach(function (btn) {
        btn.addEventListener('click', function () { activateTab(btn.dataset.tab); });
    });

    /* ---- Bind all forms & handlers ---- */
    bindPostForm();
    bindProjectForm();
    bindDeleteHandlers();

    /* ---- Project select toggle ---- */
    var sel = document.getElementById('tag_select');
    var ti  = document.getElementById('tag_new');
    if (sel && ti) {
        function syncTagInput() {
            var isNew = sel.value === 'new' || sel.value === '';
            ti.style.display = isNew ? 'block' : 'none';
            if (!isNew) ti.value = '';
        }
        syncTagInput();
        sel.addEventListener('change', syncTagInput);
    }

    /* ---- Live thumbnail preview ---- */
    ['thumbnail', 'project_thumbnail'].forEach(function (name) {
        var input = document.querySelector('input[name="' + name + '"]');
        if (!input) return;
        input.addEventListener('change', function () {
            var file = input.files[0];
            if (!file) return;
            var preview = input.parentNode.querySelector('.js-preview');
            if (!preview) {
                preview = document.createElement('img');
                preview.className = 'js-preview thumb-preview';
                preview.style.cssText = 'margin-top:0.5rem;max-width:180px;border-radius:8px;display:block;';
                input.insertAdjacentElement('afterend', preview);
            }
            preview.src = URL.createObjectURL(file);
        });
    });

    /* ---- Auto fill date/time on empty form ---- */
    var di  = document.querySelector('input[name="date"]');
    var ti2 = document.querySelector('input[name="time"]');
    if (di  && !di.value)  di.value  = new Date().toISOString().slice(0, 10);
    if (ti2 && !ti2.value) ti2.value = new Date().toTimeString().slice(0, 5);

});
