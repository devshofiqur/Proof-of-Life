/* ============================================================
   PROOF OF LIFE — MAIN JAVASCRIPT
   Navigation, audio players, animations, interactions
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navigation ── */
  const nav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  // Scroll behavior
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile toggle
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav on link click
  document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });


  /* ── Page routing ── */
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update nav active state
    document.querySelectorAll('[data-page]').forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
  }

  // Nav link clicks
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });

  // Show home by default
  showPage('page-home');


  /* ── Scroll reveal ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  function initReveal() {
    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }
  initReveal();

  // Re-init on page change
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      setTimeout(initReveal, 100);
    });
  });


  /* ── Counter animation ── */
  function animateCounter(el, target, suffix = '') {
    const duration = 1800;
    const start = performance.now();
    const isFloat = target.toString().includes('.');

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = isFloat
        ? (eased * target).toFixed(1)
        : Math.floor(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statEls = entry.target.querySelectorAll('.stat-number');
        statEls.forEach(el => {
          const target = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, target, suffix);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsRow = document.querySelector('.stats-row');
  if (statsRow) statsObserver.observe(statsRow);


  /* ── Audio engine ── */
  const audioEngine = {
    audio: null,
    currentId: null,
    _simTimer: null,

    play(id, src, title, onProgress) {
      // Stop current if different track
      if (this.currentId && this.currentId !== id) {
        this.stopAll();
      }

      if (this.currentId === id && this.isPlaying(id)) return;

      this.currentId = id;
      showMiniPlayer(title);

      // Simulate playback for demo
      this.simulatePlayback(id, title, onProgress);
    },

    simulatePlayback(id, title, onProgress) {
      let progress = 0;
      this.updateAllPlayButtons(id, true);

      if (this._simTimer) clearInterval(this._simTimer);
      this._simTimer = setInterval(() => {
        progress += 0.25;
        if (progress >= 100) {
          clearInterval(this._simTimer);
          this._simTimer = null;
          this.updateAllPlayButtons(id, false);
          hideMiniPlayer();
          onProgress(0);
          return;
        }
        onProgress(progress);
        updateMiniProgress(progress);
      }, 300);
    },

    pause(id, onProgress) {
      if (this._simTimer) {
        clearInterval(this._simTimer);
        this._simTimer = null;
      }
      this.updateAllPlayButtons(id, false);
    },

    stopAll() {
      if (this._simTimer) {
        clearInterval(this._simTimer);
        this._simTimer = null;
      }
      if (this.currentId) {
        this.updateAllPlayButtons(this.currentId, false);
      }
      hideMiniPlayer();
    },

    isPlaying(id) {
      return this._simTimer !== null && this.currentId === id;
    },

    updateAllPlayButtons(id, playing) {
      document.querySelectorAll(`[data-player-id="${id}"]`).forEach(btn => {
        btn.classList.toggle('playing', playing);
      });
    }
  };

  // Featured episode player
  const featuredPlayBtn = document.getElementById('featuredPlayBtn');
  const featuredProgress = document.getElementById('featuredProgress');
  const featuredTimeEl = document.getElementById('featuredTime');

  if (featuredPlayBtn) {
    let isPlaying = false;
    let elapsed = 0;
    let timer;
    const totalSecs = 47 * 60 + 23;

    featuredPlayBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      featuredPlayBtn.classList.toggle('playing', isPlaying);

      if (isPlaying) {
        timer = setInterval(() => {
          elapsed += 3;
          const pct = (elapsed / totalSecs) * 100;
          featuredProgress.style.width = Math.min(pct, 100) + '%';
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          if (featuredTimeEl) featuredTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
          if (elapsed >= totalSecs) { clearInterval(timer); isPlaying = false; featuredPlayBtn.classList.remove('playing'); }
        }, 300);
        showMiniPlayer('Ep. 12 — The Year We Stopped Pretending');
      } else {
        clearInterval(timer);
      }
    });
  }

  // Episode card players
  document.querySelectorAll('.ep-play-btn').forEach(btn => {
    const id = btn.dataset.epId;
    const title = btn.dataset.title || 'Proof of Life';

    btn.addEventListener('click', () => {
      const fill = document.getElementById(`fill-${id}`);

      if (audioEngine.isPlaying(id)) {
        audioEngine.pause(id, (pct) => {
          if (fill) fill.style.width = pct + '%';
        });
      } else {
        audioEngine.play(id, '', title, (pct) => {
          if (fill) fill.style.width = pct + '%';
        });
      }
    });
  });


  /* ── Mini player ── */
  const miniPlayer = document.getElementById('miniPlayer');
  const miniPlayerTitle = document.getElementById('miniPlayerTitle');
  const miniClose = document.getElementById('miniClose');

  function showMiniPlayer(title) {
    if (miniPlayer) {
      miniPlayerTitle.textContent = title;
      miniPlayer.classList.add('visible');
    }
  }

  function hideMiniPlayer() {
    if (miniPlayer) miniPlayer.classList.remove('visible');
  }

  function updateMiniProgress(pct) {
    const fill = document.getElementById('miniFill');
    if (fill) fill.style.width = pct + '%';
  }

  if (miniClose) {
    miniClose.addEventListener('click', () => {
      audioEngine.stopAll();
      hideMiniPlayer();

      // Also stop featured player
      const featuredPlayBtn = document.getElementById('featuredPlayBtn');
      if (featuredPlayBtn) featuredPlayBtn.classList.remove('playing');
    });
  }


  /* ── Episode filter buttons ── */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      document.querySelectorAll('.ep-card').forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.transition = 'opacity 0.3s, transform 0.3s';
        if (show) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = ''; }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.97)';
          setTimeout(() => { card.style.display = 'none'; }, 300);
        }
      });
    });
  });


  /* ── Newsletter form ── */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.newsletter-input');
      const btn = newsletterForm.querySelector('.newsletter-submit');
      btn.textContent = '✓ You\'re in!';
      input.value = '';
      setTimeout(() => { btn.textContent = 'Subscribe'; }, 3500);
    });
  }


  /* ── Platform badge clicks ── */
  document.querySelectorAll('.platform-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const platform = badge.dataset.platform;
      const urls = {
        spotify: 'https://spotify.com',
        apple: 'https://podcasts.apple.com',
        google: 'https://podcasts.google.com',
        amazon: 'https://music.amazon.com/podcasts'
      };
      if (urls[platform]) window.open(urls[platform], '_blank');
    });
  });

});
