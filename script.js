/* ============================================================
   script.js — Raihan Fadilah Portfolio (tema dark + cyan)
   Modul:
   1. Utils            — helper umum
   2. ScrollProgress    — progress bar di atas halaman
   3. ThemeToggle        — ganti dark/light, tersimpan di localStorage
   4. NavController       — nav berubah saat scroll + active link
   5. RevealOnScroll        — animasi fade-up saat elemen masuk viewport
   6. HeroIntro               — fade-in hero + typewriter label peran
   7. CodeShowcase              — tab/dot interaktif pada code window
   8. CursorGlow                 — cahaya lembut mengikuti kursor
   9. Magnetic                    — tombol "tertarik" ke arah kursor
   10. TiltCard                    — efek tilt 3D pada kartu
   11. LanguageBars                 — animasi bar bahasa
   12. NeuralNetwork (canvas)        — node + garis yang "menari" di background
   ============================================================ */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ---------- 1. UTILS ---------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const onIdle = (fn) =>
    'requestIdleCallback' in window
      ? requestIdleCallback(fn)
      : setTimeout(fn, 1);

  /* ---------- 2. SCROLL PROGRESS BAR ---------- */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    let ticking = false;
    function update() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------- 3. THEME TOGGLE (dark default, tersimpan) ---------- */
  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const root = document.documentElement;

    try {
      const saved = localStorage.getItem('site-theme');
      if (saved === 'light') root.classList.add('light-mode');
    } catch (e) {
      /* localStorage tidak tersedia (mode privat dsb) — lanjut dengan default dark */
    }

    if (!btn) return;
    btn.addEventListener('click', () => {
      root.classList.toggle('light-mode');
      try {
        localStorage.setItem(
          'site-theme',
          root.classList.contains('light-mode') ? 'light' : 'dark'
        );
      } catch (e) {
        /* abaikan jika storage tidak tersedia */
      }
    });
  }

  /* ---------- 4. NAV: scrolled state + active link ---------- */
  function initNav() {
    const nav = document.querySelector('nav');
    const links = Array.from(
      document.querySelectorAll('.nav-links a, .mobile-menu-links a')
    );
    const hrefs = [...new Set(links.map((a) => a.getAttribute('href')))];
    const sections = hrefs.map((h) => document.querySelector(h)).filter(Boolean);

    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            links.forEach((a) =>
              a.classList.toggle('active', a.getAttribute('href') === id)
            );
          }
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- 4b. MOBILE MENU (hamburger → sidebar drawer) ---------- */
  function initMobileMenu() {
    const burger = document.getElementById('navBurger');
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    const closeBtn = document.getElementById('mobileMenuClose');
    const mobileTheme = document.getElementById('mobileThemeToggle');
    if (!burger || !menu) return;

    function closeMenu() {
      burger.classList.remove('open');
      menu.classList.remove('open');
      if (overlay) { overlay.classList.remove('open'); overlay.style.display = ''; }
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    function openMenu() {
      burger.classList.add('open');
      menu.classList.add('open');
      if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(() => overlay.classList.add('open')); }
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    }

    burger.addEventListener('click', () => {
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    menu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', closeMenu)
    );
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) closeMenu();
    });

    // Mobile theme toggle — sync dengan tombol utama
    if (mobileTheme) {
      mobileTheme.addEventListener('click', () => {
        document.documentElement.classList.toggle('light-mode');
        try {
          localStorage.setItem(
            'site-theme',
            document.documentElement.classList.contains('light-mode') ? 'light' : 'dark'
          );
        } catch (e) { /* ignore */ }
      });
    }
  }

  /* ---------- 5. REVEAL ON SCROLL (fade-up otomatis) ---------- */
  function autoTagFadeUp() {
    const groups = [
      { sel: '#about .about-img-wrap, #about .about-content', stagger: 0 },
      { sel: '#services .services-header', stagger: 0 },
      { sel: '#services .service-card', stagger: 90 },
      { sel: '#experience .exp-header', stagger: 0 },
      { sel: '#experience .exp-item', stagger: 110 },
      { sel: '#portfolio .portfolio-header', stagger: 0 },
      { sel: '#portfolio .project-showcase', stagger: 90 },
      {
        sel: '#contact .section-label, #contact .section-title, #contact p, #contact .contact-actions',
        stagger: 80,
      },
    ];

    groups.forEach(({ sel, stagger }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('fade-up');
        if (stagger) el.style.transitionDelay = i * stagger + 'ms';
      });
    });
  }

  function initRevealOnScroll() {
    autoTagFadeUp();
    // Blok intro (foto+headline paling atas) ditangani terpisah oleh initHeroIntro
    // supaya muncul langsung saat halaman dibuka, bukan menunggu discroll.
    const targets = document.querySelectorAll(
      '.fade-up:not(.intro-grid .fade-up)'
    );

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('in-view');
            if (el.classList.contains('about-img-wrap')) {
              setTimeout(() => el.classList.add('floaty'), 850);
            }
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    targets.forEach((el) => obs.observe(el));
  }

  /* ---------- 6. HERO INTRO: fade-in + typewriter label peran ---------- */
  function typewriterLoop(el, words, opts) {
    opts = opts || {};
    const typeSpeed = opts.typeSpeed || 55;
    const deleteSpeed = opts.deleteSpeed || 32;
    const pauseAfterType = opts.pauseAfterType || 1500;
    const pauseAfterDelete = opts.pauseAfterDelete || 350;

    if (prefersReducedMotion) {
      el.textContent = words[0];
      return;
    }

    const textSpan = document.createElement('span');
    const caret = document.createElement('span');
    caret.className = 'role-caret';
    el.appendChild(textSpan);
    el.appendChild(caret);

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const word = words[wordIndex];
      if (!deleting) {
        charIndex++;
        textSpan.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) {
          deleting = true;
          setTimeout(tick, pauseAfterType);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        charIndex--;
        textSpan.textContent = word.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(tick, pauseAfterDelete);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }
    tick();
  }

  function initHeroIntro() {
    const introTargets = document.querySelectorAll('.intro-grid .fade-up');

    if (prefersReducedMotion) {
      introTargets.forEach((el) => el.classList.add('in-view'));
    } else {
      // Tampilkan blok intro begitu halaman dibuka (bukan menunggu scroll)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          introTargets.forEach((el) => el.classList.add('in-view'));
        });
      });
      // Mulai melayang setelah transisi masuk selesai
      setTimeout(() => {
        document.querySelector('.intro-photo')?.classList.add('floaty');
      }, 950);
    }

    const roleEl = document.querySelector('.intro-role');
    if (roleEl) {
      typewriterLoop(roleEl, [
        'Frontend Developer',
        'Web Developer',
        'Mobile Developer',
      ]);
    }
  }

  /* ---------- 7. CODE SHOWCASE: tab & dot interaktif ---------- */
  function initCodeShowcase() {
    document.querySelectorAll('.code-window').forEach((win) => {
      const wrap = win.parentElement;
      const tabs = Array.from(win.querySelectorAll('.code-tab'));
      const panes = Array.from(win.querySelectorAll('.code-pane'));
      const dots = Array.from(wrap.querySelectorAll('.code-dots .dot'));
      if (!tabs.length) return;

      let current = 0;
      let timer = null;

      function activate(index) {
        current = index;
        tabs.forEach((t, i) => t.classList.toggle('active', i === index));
        panes.forEach((p, i) => p.classList.toggle('active', i === index));
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
      }

      function startAutoplay() {
        if (prefersReducedMotion) return;
        clearInterval(timer);
        timer = setInterval(() => {
          activate((current + 1) % tabs.length);
        }, 4500);
      }

      tabs.forEach((tab, i) =>
        tab.addEventListener('click', () => {
          activate(i);
          startAutoplay();
        })
      );
      dots.forEach((dot, i) =>
        dot.addEventListener('click', () => {
          activate(i);
          startAutoplay();
        })
      );

      win.addEventListener('mouseenter', () => clearInterval(timer));
      win.addEventListener('mouseleave', startAutoplay);

      startAutoplay();
    });
  }

  /* ---------- 8. CURSOR GLOW ---------- */
  function initCursorGlow() {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let active = false;

    window.addEventListener(
      'mousemove',
      (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!active) {
          active = true;
          glow.classList.add('active');
        }
      },
      { passive: true }
    );
    window.addEventListener('mouseleave', () => glow.classList.remove('active'));

    function animate() {
      curX = lerp(curX, mouseX, 0.12);
      curY = lerp(curY, mouseY, 0.12);
      glow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  /* ---------- 9. MAGNETIC BUTTONS ---------- */
  function initMagnetic() {
    if (prefersReducedMotion) return;
    const els = document.querySelectorAll(
      '.hero-btn, .nav-cta, .btn-white, .btn-outline-white'
    );
    els.forEach((el) => {
      el.classList.add('magnetic');
      const strength = 0.28;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* ---------- 10. TILT CARD 3D ---------- */
function initTiltCards() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll(
    '.service-card, .portfolio-card'
  );

  cards.forEach((card) => {
    const maxTilt = 10;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    let raf = null;

    function update() {
      currentX += (mouseX - currentX) * 0.18;
      currentY += (mouseY - currentY) * 0.18;

      const rotateY = currentX * maxTilt;
      const rotateX = -currentY * maxTilt;

      card.style.transform =
        `perspective(1200px)
         rotateX(${rotateX}deg)
         rotateY(${rotateY}deg)
         translate3d(0,-4px,0)`;

      raf = requestAnimationFrame(update);
    }

    card.addEventListener('mouseenter', () => {
      if (!raf) raf = requestAnimationFrame(update);
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();

      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      raf = null;

      card.style.transition =
        'transform 0.35s cubic-bezier(.16,.84,.44,1)';

      card.style.transform =
        'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';

      setTimeout(() => {
        card.style.transition =
          'box-shadow .25s ease, border-color .25s ease';
      }, 350);
    });
  });
}
  /* ---------- 11. LANGUAGE BARS ---------- */
  function initLanguageBars() {
    const bars = document.querySelectorAll('.bar-fill');
    if (!bars.length) return;

    bars.forEach((bar) => {
      bar.dataset.target = bar.style.width || '0%';
      bar.style.width = '0%';
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      bars.forEach((bar) => (bar.style.width = bar.dataset.target));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            requestAnimationFrame(() => {
              bar.style.width = bar.dataset.target;
            });
            obs.unobserve(bar);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((bar) => obs.observe(bar));
  }

  /* ---------- 12. NEURAL NETWORK (canvas "menari" di background) ---------- */
  function initNeuralNetwork() {
    const isMobile = window.innerWidth < 700;
    const density = isMobile ? 35000 : 22000;
    const maxDist = isMobile ? 80 : 110;
    const instances = [];

    document.querySelectorAll('section').forEach((section) => {
      const canvas = document.createElement('canvas');
      canvas.className = 'bg-orbs';
      section.insertBefore(canvas, section.firstChild);
      const ctx = canvas.getContext('2d');

      let nodes = [];
      let w = 0,
        h = 0,
        dpr = Math.min(window.devicePixelRatio || 1, 2);
      let visible = true;

      function makeNodes() {
        const count = clamp(Math.round((w * h) / density), 12, 60);
        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
        }));
      }

      function resize() {
        const rect = section.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeNodes();
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);

        nodes.forEach((n) => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x <= 0 || n.x >= w) n.vx *= -1;
          if (n.y <= 0 || n.y >= h) n.vy *= -1;
          n.x = clamp(n.x, 0, w);
          n.y = clamp(n.y, 0, h);
        });

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i],
              b = nodes[j];
            const dx = a.x - b.x,
              dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.32;
              ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        nodes.forEach((n) => {
          ctx.save();
          ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(165, 243, 252, 0.9)';
          ctx.fill();
          ctx.restore();
        });
      }

      resize();
      instances.push({
        section,
        resize,
        draw,
        get visible() {
          return visible;
        },
        set visible(v) {
          visible = v;
        },
      });
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const inst = instances.find((i) => i.section === entry.target);
            if (inst) inst.visible = entry.isIntersecting;
          });
        },
        { threshold: 0.01 }
      );
      instances.forEach((i) => obs.observe(i.section));
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => instances.forEach((i) => i.resize()), 150);
    });

    if (prefersReducedMotion) {
      instances.forEach((i) => i.draw());
      return;
    }

    let paused = document.hidden;
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
    });

    function loop() {
      if (!paused) {
        instances.forEach((i) => {
          if (i.visible) i.draw();
        });
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 13. EXPERIENCE PHOTO MODAL (CODE WINDOW STYLE) ---------- */
  function initExpPhotoModal() {
    const overlay = document.getElementById('imgModalOverlay');
    const closeBtn = document.getElementById('imgModalClose');
    const modalImg = document.getElementById('modalImg');
    const modalFileName = document.getElementById('modalFileName');
    const modalTitle = document.getElementById('modalTitle');
    const modalCompany = document.getElementById('modalCompany');
    const modalYear = document.getElementById('modalYear');
    const modalCaption = document.getElementById('modalCaption');

    if (!overlay || !modalImg) return;

    function openModal(imgEl) {
      const expItem = imgEl.closest('.exp-item');
      const year = expItem ? expItem.querySelector('.exp-year')?.textContent : '';
      const title = expItem ? expItem.querySelector('.exp-content h3')?.textContent : '';
      const company = expItem ? expItem.querySelector('.exp-company')?.textContent : '';
      const altText = imgEl.alt || title || 'Experience Photo';
      const imgSrc = imgEl.src;

      const filename = imgSrc.substring(imgSrc.lastIndexOf('/') + 1);

      modalImg.src = imgSrc;
      modalImg.alt = altText;
      if (modalFileName) modalFileName.textContent = filename || 'preview.jpg';
      if (modalTitle) modalTitle.textContent = title;
      if (modalCompany) modalCompany.textContent = company;
      if (modalYear) modalYear.textContent = year;
      if (modalCaption) modalCaption.textContent = altText;

      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.exp-photos img').forEach((img) => {
      img.addEventListener('click', () => openModal(img));
    });

    closeBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    initThemeToggle();
    initScrollProgress();
    initNav();
    initMobileMenu();
    initNeuralNetwork();
    initHeroIntro();
    initRevealOnScroll();
    initCodeShowcase();
    initLanguageBars();
    initCursorGlow();
    initExpPhotoModal();
    onIdle(() => {
      initMagnetic();
      initTiltCards();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();