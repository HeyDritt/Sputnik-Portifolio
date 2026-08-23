/* ============================================================
   SPUTNIK — main.js
   Partículas canvas | Hover magnético | Scroll reveal |
   Mobile nav | Header scroll | Ano no footer
   ============================================================ */

'use strict';

// ── UTILIDADES ──────────────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── ANO NO FOOTER ────────────────────────────────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── HEADER SCROLLED ──────────────────────────────────────────
const header = document.getElementById('header');
if (header) {
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ── MOBILE NAV ────────────────────────────────────────────────
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

if (mobileBtn && mobileNav) {
  mobileBtn.addEventListener('click', () => {
    const isOpen = mobileBtn.classList.toggle('open');
    mobileBtn.setAttribute('aria-expanded', isOpen);
    mobileNav.classList.toggle('open', isOpen);
    mobileNav.setAttribute('aria-hidden', !isOpen);
  });

  // Fecha ao clicar em um link do menu mobile
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileBtn.classList.remove('open');
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });
}

// ── HOVER MAGNÉTICO (nav links) ──────────────────────────────
if (!prefersReducedMotion) {
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.18;
      const dy   = (e.clientY - cy) * 0.18;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// ── SCROLL REVEAL (IntersectionObserver) ─────────────────────
{
  const cards = document.querySelectorAll('.reveal-card');

  if (prefersReducedMotion) {
    // Acessibilidade: exibe tudo sem animação
    cards.forEach(c => c.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    cards.forEach(c => observer.observe(c));
  }
}

// ============================================================
//  PARTÍCULAS — CANVAS SPACE
// ============================================================

(function initParticles() {
  const canvas = document.getElementById('space-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  let W, H;
  let animId   = null;
  let paused   = false;

  // Cores de partículas (branco, roxo, laranja)
  const COLORS = [
    'rgba(255,255,255,',
    'rgba(108,60,233,',
    'rgba(255,107,0,',
  ];

  // Configuração
  const CONFIG = prefersReducedMotion
    ? { count: 0, speedMax: 0, repulse: false }
    : { count: 110, speedMax: 0.45, repulse: true };

  let particles = [];
  let mouse     = { x: -9999, y: -9999 };

  // ── Resize ──
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ── Particle ──
  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : (Math.random() > 0.5 ? -4 : H + 4);
      this.r    = Math.random() * 1.8 + 0.4;
      this.vx   = (Math.random() - 0.5) * CONFIG.speedMax;
      this.vy   = (Math.random() - 0.5) * CONFIG.speedMax + 0.05;
      this.a    = Math.random() * 0.22 + 0.1;      // opacidade base
      this.colorBase = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.ox   = this.x;  // posição original
      this.oy   = this.y;
    }

    update() {
      // Repulsão do mouse
      if (CONFIG.repulse) {
        const dx  = this.x - mouse.x;
        const dy  = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = 120;

        if (dist < radius) {
          const force = (radius - dist) / radius;
          this.x += dx / dist * force * 2.2;
          this.y += dy / dist * force * 2.2;
        } else {
          // Volta suavemente à posição original
          this.x += (this.x < this.ox ? 0.04 : -0.04) * Math.abs(this.x - this.ox) * 0.04;
          this.y += (this.y < this.oy ? 0.04 : -0.04) * Math.abs(this.y - this.oy) * 0.04;
        }
      }

      this.x  += this.vx;
      this.y  += this.vy;
      this.ox  = this.x;
      this.oy  = this.y;

      // Recicla quando sai da tela
      if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.colorBase + this.a + ')';
      ctx.fill();
    }
  }

  // ── Inicializa partículas ──
  function initParticleList() {
    particles = [];
    for (let i = 0; i < CONFIG.count; i++) {
      particles.push(new Particle());
    }
  }

  // ── Loop de animação ──
  function loop() {
    if (paused) return;
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  // ── Pausa quando a aba perde foco ──
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused && CONFIG.count > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animId);
    }
  });

  // ── Posição do mouse ──
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // ── Inicia ──
  if (CONFIG.count > 0) {
    initParticleList();
    loop();
  }
})();
