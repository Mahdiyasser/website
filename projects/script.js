/**
 * Mahdi Yasser — Projects Page
 * v11 design system: canvas, cursor, reveal + full project/post logic
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

    function hookCursor(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
            el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
        });
    }
    hookCursor('a, button, .project-card, .post-card');

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
        return body.classList.contains('light-theme') ? '196, 122, 0' : '240, 165, 0';
    }

    (function draw() {
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
        requestAnimationFrame(draw);
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
       5. PROJECTS + POSTS LOGIC (original, enhanced)
       ========================================================= */
    const projectsFeed    = document.getElementById('projects-feed');
    const postsList       = document.getElementById('project-posts-list');
    const postsTitle      = document.getElementById('posts-title');
    const projectsView    = document.getElementById('projects-view');
    const postsView       = document.getElementById('posts-view');
    const backButton      = document.getElementById('back-to-projects');
    const loadingMsg      = document.getElementById('loading-projects');

    let allPostsData    = [];
    let allProjectsData = [];

    /* --- Sort by date descending --- */
    function sortByDate(posts) {
        return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /* --- View switching --- */
    function showPostsView() {
        projectsView.classList.add('hidden');
        postsView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showProjectsView() {
        postsView.classList.add('hidden');
        projectsView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* --- Render project cards --- */
    function renderProjectCards(projects) {
        if (!projects || projects.length === 0) {
            loadingMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>No projects found.</span>';
            loadingMsg.classList.add('error');
            return;
        }

        loadingMsg.style.display = 'none';
        projectsFeed.innerHTML = '';

        projects.forEach(project => {
            const slug        = project.slug;
            const postCount   = allPostsData.filter(p => p.file && p.file.includes(`/${slug}/`)).length;
            const fallback    = 'https://via.placeholder.com/600x400?text=No+Image';
            const thumb       = project.thumbnail || fallback;

            const card = document.createElement('div');
            card.classList.add('project-card');
            card.dataset.slug = slug;

            card.innerHTML = `
                <div class="project-card-image">
                    <img src="${thumb}" alt="${project.name}" onerror="this.src='${fallback}'">
                </div>
                <div class="project-card-arrow">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
                <div class="project-card-body">
                    <h3>${project.name}</h3>
                    <p>${project.bio}</p>
                </div>
                ${postCount > 0 ? `<div class="project-card-count">${postCount} post${postCount !== 1 ? 's' : ''}</div>` : ''}
            `;

            card.addEventListener('click', () => filterAndShowPosts(slug, project.name));

            // Tilt effect
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 7;
                const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -7;
                card.style.transform = `perspective(700px) rotateY(${x}deg) rotateX(${y}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });

            projectsFeed.appendChild(card);
        });

        // Attach cursor hover to new cards
        hookCursor('.project-card');
    }

    /* --- Render filtered posts --- */
    function renderFilteredPosts(posts) {
        postsList.innerHTML = '';

        if (!posts || posts.length === 0) {
            postsList.innerHTML = '<div class="no-posts"><i class="fa-regular fa-folder-open"></i>&nbsp; No posts found for this project yet.</div>';
            return;
        }

        sortByDate(posts).forEach(post => {
            const date     = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const fallback = 'https://via.placeholder.com/300x200?text=No+Image';
            const thumb    = post.thumbnail || fallback;

            const card = document.createElement('a');
            card.href  = post.file;
            card.classList.add('post-card');

            card.innerHTML = `
                <div class="post-card-thumb">
                    <img src="${thumb}" alt="${post.title}" onerror="this.src='${fallback}'">
                </div>
                <div class="post-card-body">
                    <h3>${post.title}</h3>
                    <div class="post-meta">
                        <i class="fa-solid fa-calendar-days"></i>
                        ${date}
                        ${post.location ? `&nbsp;·&nbsp;<i class="fa-solid fa-location-dot"></i> ${post.location}` : ''}
                    </div>
                    <p class="post-card-desc">${post.desc}</p>
                    <span class="post-read-link">Read Post <i class="fa-solid fa-arrow-right"></i></span>
                </div>
            `;

            postsList.appendChild(card);
        });

        hookCursor('.post-card');
    }

    /* --- Filter and show posts for a project --- */
    function filterAndShowPosts(slug, name) {
        const filtered = allPostsData.filter(p => p.file && p.file.includes(`/${slug}/`));
        postsTitle.innerHTML = `${name} <span class="accent">Posts</span>`;
        renderFilteredPosts(filtered);
        showPostsView();
    }

    /* --- Fetch data --- */
    async function fetchAllData() {
        try {
            const [projRes, postsRes] = await Promise.all([
                fetch('projects.json'),
                fetch('posts.json').catch(() => null)
            ]);

            if (!projRes.ok) throw new Error('Failed to load projects.json');
            allProjectsData = await projRes.json();

            if (postsRes && postsRes.ok) {
                allPostsData = await postsRes.json();
            } else {
                console.warn('posts.json not found — showing projects only.');
                allPostsData = [];
            }

            renderProjectCards(allProjectsData);

        } catch (err) {
            console.error('Data load error:', err);
            loadingMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><span>Error loading data. Check the console.</span>';
            loadingMsg.classList.add('error');
        }
    }

    /* --- Back button --- */
    backButton.addEventListener('click', showProjectsView);

    /* --- Kick off --- */
    fetchAllData();
});
