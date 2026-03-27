/**
 * Mahdi Yasser — The Random Zone
 * v11 design system: canvas (violet), cursor, reveal + all original card/modal logic
 */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. THEME TOGGLE
       ========================================================= */
    const body       = document.body;
    const themeBtn   = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    themeBtn.addEventListener('click', () => {
        const next = body.classList.contains('light-theme') ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next);
    });

    function applyTheme(t) {
        body.classList.remove('dark-theme', 'light-theme');
        body.classList.add(t + '-theme');
    }

    /* =========================================================
       2. CUSTOM CURSOR
       ========================================================= */
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left = mx + 'px';
        dot.style.top  = my + 'px';
    });

    (function animateRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(animateRing);
    })();

    function attachCursorHover(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
            el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
        });
    }
    attachCursorHover('a, button, .link-card, .non-clickable-card, .card-button');

    /* =========================================================
       3. CANVAS PARTICLE BACKGROUND
       ========================================================= */
    const canvas = document.getElementById('bg-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); initParticles(); });

    function initParticles() {
        particles = [];
        const count = Math.floor((W * H) / 14000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x:  Math.random() * W,
                y:  Math.random() * H,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r:  Math.random() * 1.2 + 0.3,
                a:  Math.random()
            });
        }
    }
    initParticles();

    function getAccentRGB() {
        return body.classList.contains('light-theme') ? '124, 58, 237' : '168, 85, 247';
    }

    (function drawParticles() {
        ctx.clearRect(0, 0, W, H);
        const c = getAccentRGB();

        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${c}, ${0.3 + p.a * 0.4})`;
            ctx.fill();
        });

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${c}, ${(1 - dist / 120) * 0.12})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(drawParticles);
    })();

    /* =========================================================
       4. SCROLL REVEAL
       ========================================================= */
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* =========================================================
       5. DYNAMIC CARD LOADING (original logic preserved)
       ========================================================= */
    const cardsContainer = document.getElementById('project-cards-container');
    const loadingState   = document.getElementById('loading-state');
    const errorState     = document.getElementById('error-state');
    const DATA_URL       = './data/data.json';

    // Modal elements
    const storyModalOverlay     = document.getElementById('storyModalOverlay');
    const closeStoryModalButton = document.getElementById('closeStoryModal');
    const modalProjectName      = document.getElementById('modalProjectName');
    const modalStoryContent     = document.getElementById('modalStoryContent');

    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
        return text.replace(urlRegex, url => {
            const href = url.startsWith('www.') ? 'http://' + url : url;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    function createCardHTML(project) {
        const adjustedImagePath = project.image.replace('../', '');

        const hasTag = project.tag && project.tag.trim().length > 0;
        const tagHTML = hasTag ? `<div class="card-tag">${project.tag}</div>` : '';

        const hasStory = project.story && project.story.trim().length > 0;
        const storyButtonHTML = hasStory
            ? `<button class="card-button show-story-btn"
                   data-project-name="${project.name}"
                   data-project-story="${encodeURIComponent(project.story)}">
                   Show Story
               </button>`
            : '';

        const hasDescription = project.description && project.description.trim().length > 0;
        const descriptionHTML = hasDescription ? `<p>${project.description}</p>` : '';

        const isClickable  = project.path !== '';
        const wrapperTag   = isClickable ? 'a' : 'div';
        const wrapperClass = isClickable ? 'link-card' : 'non-clickable-card';
        const hrefAttr     = isClickable ? `href="${project.path}"` : '';
        const displayName  = (project.name && project.name.trim().length > 0) ? project.name : 'No Name';

        return `<${wrapperTag} ${hrefAttr} class="${wrapperClass} card-${project.id}">
                    <img src="${adjustedImagePath}" alt="${displayName} preview">
                    ${tagHTML}
                    ${storyButtonHTML}
                    <div class="overlay">
                        ${displayName}
                        ${descriptionHTML}
                    </div>
                </${wrapperTag}>`;
    }

    fetch(DATA_URL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            loadingState.style.display = 'none';

            if (!Array.isArray(data)) throw new Error('Data is not an array');

            cardsContainer.innerHTML = data.map(createCardHTML).join('');

            // Re-attach cursor hover to new cards
            attachCursorHover('.link-card, .non-clickable-card, .card-button');

            // Card tilt effect
            document.querySelectorAll('.link-card, .non-clickable-card').forEach(card => {
                card.addEventListener('mousemove', e => {
                    const rect = card.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
                    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -8;
                    card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });

            // Story button listeners
            document.querySelectorAll('.show-story-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();

                    const name  = btn.dataset.projectName;
                    const story = decodeURIComponent(btn.dataset.projectStory);

                    if (name && name.trim().length > 0) {
                        modalProjectName.textContent = name;
                        modalProjectName.style.display = '';
                    } else {
                        modalProjectName.textContent = '';
                        modalProjectName.style.display = 'none';
                    }

                    modalStoryContent.innerHTML = '<p>' + linkify(story) + '</p>';
                    storyModalOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });
        })
        .catch(err => {
            console.error('Error loading data:', err);
            loadingState.style.display = 'none';
            errorState.style.display = 'flex';
        });

    /* =========================================================
       6. MODAL CLOSE LOGIC
       ========================================================= */
    function closeModal() {
        storyModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeStoryModalButton) closeStoryModalButton.addEventListener('click', closeModal);

    if (storyModalOverlay) {
        storyModalOverlay.addEventListener('click', e => {
            if (e.target === storyModalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && storyModalOverlay?.classList.contains('active')) closeModal();
    });

});
