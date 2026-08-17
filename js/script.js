(function () {
    'use strict';

    // ===== DATA (real — no fabricated proficiency levels) =====
    const skillsData = [
        { name: 'HTML5', icon: 'fab fa-html5' },
        { name: 'CSS3', icon: 'fab fa-css3-alt' },
        { name: 'JavaScript', icon: 'fab fa-js' },
        { name: 'Python', icon: 'fab fa-python' },
        { name: 'Fortran', icon: 'fas fa-square-root-variable' },
        { name: 'Git & GitHub', icon: 'fab fa-git-alt' },
        { name: 'WordPress', icon: 'fab fa-wordpress' },
        { name: 'Jekyll & GitHub Pages', icon: 'fas fa-globe' },
        { name: 'Firebase', icon: 'fas fa-fire' },
        { name: 'Scratch', icon: 'fas fa-puzzle-piece' },
        { name: 'Climate & Atmospheric Modelling', icon: 'fas fa-cloud-sun' },
        { name: 'Remote Sensing', icon: 'fas fa-satellite-dish' },
        { name: 'Wind Energy Statistics (Weibull)', icon: 'fas fa-wind' },
        { name: 'Data Analysis (SPSS)', icon: 'fas fa-chart-line' },
        { name: 'Robotics & micro:bit', icon: 'fas fa-robot' },
        { name: 'STEM Curriculum Design', icon: 'fas fa-chalkboard-user' },
        { name: 'AI Prompt Engineering', icon: 'fas fa-wand-magic-sparkles' },
        { name: 'Practical AI Tools', icon: 'fas fa-microchip' },
    ];

    // ===== DOM REFS =====
    const navbar = document.getElementById('navbar');
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const themeToggle = document.getElementById('themeToggle');
    const scrollTopBtn = document.getElementById('scrollTop');
    const skillsGrid = document.getElementById('skillsGrid');
    const yearSpan = document.getElementById('year');
    const statProjects = document.getElementById('statProjects');
    const statPubs = document.getElementById('statPubs');
    const statLessons = document.getElementById('statLessons');

    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // ===== THEME =====
    function getTheme() { return localStorage.getItem('theme') || 'light'; }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    setTheme(getTheme());
    themeToggle && themeToggle.addEventListener('click', () => {
        setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    // ===== MOBILE NAV =====
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen);
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ===== ACTIVE NAV LINK (scroll-spy for in-page anchors only) =====
    const sections = document.querySelectorAll('section[id]');
    const anchorLinks = navLinks ? navLinks.querySelectorAll("a[href^='#']") : [];

    function updateActiveNav() {
        if (!anchorLinks.length) return;
        const scrollY = window.scrollY + 120;
        let current = 'home';
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollY >= top && scrollY < top + height) current = section.id;
        });
        anchorLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + current);
        });
    }

    // ===== NAVBAR SHADOW =====
    function handleNavShadow() {
        navbar && navbar.classList.toggle('scrolled', window.scrollY > 20);
    }

    // ===== SCROLL TO TOP =====
    function handleScrollTopVisibility() {
        scrollTopBtn && scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
    }
    scrollTopBtn && scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== RENDER SKILLS =====
    function renderSkills() {
        if (!skillsGrid) return;
        skillsGrid.innerHTML = '';
        skillsData.forEach((skill, index) => {
            const card = document.createElement('div');
            card.className = 'skill-card reveal';
            if (index < 4) card.classList.add('reveal-delay-' + (index % 3 + 1));
            card.innerHTML = `
                <span class="skill-icon"><i class="${skill.icon}"></i></span>
                <span class="skill-name">${skill.name}</span>
            `;
            skillsGrid.appendChild(card);
        });
    }

    // ===== ANIMATE STATS (real figures) =====
    function animateStats() {
        if (!statProjects || !statPubs || !statLessons) return;
        const targets = [
            { el: statProjects, target: 21, suffix: '+' },
            { el: statPubs, target: 3, suffix: '' },
            { el: statLessons, target: 356, suffix: '+' },
        ];
        let animated = false;

        function isInView() {
            const about = document.getElementById('about');
            if (!about) return false;
            const rect = about.getBoundingClientRect();
            return rect.top < window.innerHeight - 100;
        }

        function startCounters() {
            if (animated || !isInView()) return;
            animated = true;
            targets.forEach(({ el, target, suffix }) => {
                let current = 0;
                const increment = Math.max(1, Math.ceil(target / 40));
                const interval = setInterval(() => {
                    current += increment;
                    if (current >= target) { current = target; clearInterval(interval); }
                    el.textContent = current + suffix;
                }, 30);
            });
        }
        window.addEventListener('scroll', startCounters);
        setTimeout(startCounters, 300);
    }

    // ===== SCROLL REVEAL (with a robust fallback sweep) =====
    function initReveal() {
        const revealItems = document.querySelectorAll('.reveal');

        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver(
                entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            revealObserver.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0, rootMargin: '200px 0px -5% 0px' }
            );
            revealItems.forEach(item => revealObserver.observe(item));

            // Belt-and-suspenders: IntersectionObserver can miss short
            // sections during very fast or instant scrolls (trackpad
            // flicks, Page Down, jumping straight to a #hash). Sweep
            // periodically for anything already on-screen (or scrolled
            // past) that's still hidden, and reveal it directly.
            let sweepScheduled = false;
            const sweepReveals = () => {
                sweepScheduled = false;
                document.querySelectorAll('.reveal:not(.visible)').forEach(item => {
                    const rect = item.getBoundingClientRect();
                    if (rect.top < window.innerHeight * 1.5) {
                        item.classList.add('visible');
                        revealObserver.unobserve(item);
                    }
                });
            };
            const scheduleSweep = () => {
                if (!sweepScheduled) {
                    sweepScheduled = true;
                    requestAnimationFrame(sweepReveals);
                }
            };
            window.addEventListener('scroll', scheduleSweep, { passive: true });
            window.addEventListener('resize', scheduleSweep);
            scheduleSweep();

            const sweepInterval = setInterval(() => {
                const remaining = document.querySelectorAll('.reveal:not(.visible)').length;
                sweepReveals();
                if (remaining === 0) clearInterval(sweepInterval);
            }, 400);
        } else {
            revealItems.forEach(item => item.classList.add('visible'));
        }
    }

    // ===== SCROLL HANDLER =====
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveNav();
                handleNavShadow();
                handleScrollTopVisibility();
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', onScroll);

    // ===== PROJECT FILTER (projects.html) =====
    function initProjectFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const cards = document.querySelectorAll('.project-card[data-project-category]');
        if (!filterBtns.length || !cards.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                const filter = btn.getAttribute('data-filter');
                let anyGroupVisible = {};
                cards.forEach(card => {
                    const match = filter === 'all' || card.getAttribute('data-project-category') === filter;
                    card.style.display = match ? '' : 'none';
                });
                document.querySelectorAll('.project-group-heading').forEach(heading => {
                    const grid = heading.nextElementSibling;
                    if (!grid) return;
                    const visibleCount = Array.from(grid.querySelectorAll('.project-card')).filter(c => c.style.display !== 'none').length;
                    heading.style.display = visibleCount ? '' : 'none';
                    grid.style.display = visibleCount ? '' : 'none';
                });
            });
        });
    }

    // ===== INIT =====
    window.addEventListener('load', () => {
        updateActiveNav();
        handleNavShadow();
        handleScrollTopVisibility();
    });

    renderSkills();
    animateStats();
    initReveal();
    initProjectFilter();

})();
