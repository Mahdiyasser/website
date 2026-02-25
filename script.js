/**
 * Mahdi Yasser — Personal Site v2.0
 * Interactive scripts: theme, cursor, canvas, typed text, reveal
 */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. THEME TOGGLE
       ========================================================= */
    const body       = document.body;
    const themeBtn   = document.getElementById('theme-toggle');

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initTheme  = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initTheme);

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

    let mx = 0, my = 0;
    let rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
    });

    // Smooth ring follow
    function animateRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Expand on hoverable elements
    document.querySelectorAll('a, button, .img-card, .quick-btn, .soc-btn').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });

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

    function getAccentColor() {
        return body.classList.contains('light-theme') ? '196, 122, 0' : '240, 165, 0';
    }

    function drawParticles() {
        ctx.clearRect(0, 0, W, H);
        const c = getAccentColor();

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${c}, ${0.3 + p.a * 0.4})`;
            ctx.fill();
        });

        // Connect nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
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
    }
    drawParticles();

    /* =========================================================
       4. TYPED TEXT EFFECT
       ========================================================= */
    const phrases = [
        'Programmer.',
        'Self-hosted enthusiast.',
        'Photographer.',
        'Linux addict.',
        'Highschooler & maker.'
    ];

    const typedEl = document.getElementById('typed-text');
    let pi = 0, ci = 0, deleting = false;
    let typingDelay = 80, deleteDelay = 40, pauseDelay = 1800;

    function type() {
        const phrase = phrases[pi];
        if (!deleting) {
            typedEl.textContent = phrase.slice(0, ci + 1);
            ci++;
            if (ci === phrase.length) {
                deleting = true;
                setTimeout(type, pauseDelay);
                return;
            }
            setTimeout(type, typingDelay + Math.random() * 40);
        } else {
            typedEl.textContent = phrase.slice(0, ci - 1);
            ci--;
            if (ci === 0) {
                deleting = false;
                pi = (pi + 1) % phrases.length;
                setTimeout(type, 400);
                return;
            }
            setTimeout(type, deleteDelay);
        }
    }
    setTimeout(type, 900);

    /* =========================================================
       5. SCROLL REVEAL
       ========================================================= */
    const revealEls = document.querySelectorAll('.reveal');
    const tlItems   = document.querySelectorAll('.tl-item');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealEls.forEach(el => observer.observe(el));

    // Staggered timeline items
    const tlObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, i * 80);
                tlObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    tlItems.forEach(el => tlObserver.observe(el));

    /* =========================================================
       6. CARD TILT EFFECT
       ========================================================= */
    document.querySelectorAll('.img-card').forEach(card => {
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

    /* =========================================================
       7. PROFILE PICTURE CLICK EASTER EGG
       ========================================================= */
    const pfp = document.getElementById('pfp-img');
    let clickCount = 0;
    const msgs = ['👋', '🚀', '💻', '⚡', '🔥'];

    pfp.addEventListener('click', () => {
        clickCount++;
        const bubble = document.createElement('div');
        bubble.textContent = msgs[clickCount % msgs.length];
        bubble.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%) translateY(0);
            font-size: 1.5rem;
            pointer-events: none;
            animation: float-up 1s ease forwards;
            z-index: 100;
        `;
        pfp.parentElement.style.position = 'relative';
        pfp.parentElement.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1000);
    });

    // Inject float-up keyframe
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-up {
            0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-50px); }
        }
    `;
    document.head.appendChild(style);

});
