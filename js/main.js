/* =============================================================
   INOTA CONSTRUCCIONES — main.js  v2
   Vanilla JS — sin dependencias externas
   Módulos: header adaptive, mobile menu, reveals, timeline, form
============================================================= */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. STICKY HEADER + DARK/LIGHT ADAPTIVE
     - .scrolled: añade fondo sólido al hacer scroll > 60px
     - .on-dark: cambia colores del header cuando está sobre
       una sección oscura (hero, proceso, contacto, footer)
  ────────────────────────────────────────────────────────── */
  const header = document.getElementById('site-header');

  if (header) {
    // Sticky
    function updateHeader() {
      header.classList.toggle('scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    // Adaptive dark/light — observa secciones oscuras
    if ('IntersectionObserver' in window) {
      const darkSections = document.querySelectorAll('#intro, #proceso, #contacto, #site-footer');
      let darkSectionCount = 0; // cuántas secciones oscuras están actualmente intersectando

      const headerDarkObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              darkSectionCount++;
            } else {
              darkSectionCount = Math.max(0, darkSectionCount - 1);
            }
            header.classList.toggle('on-dark', darkSectionCount > 0);
          });
        },
        {
          threshold: 0,
          rootMargin: '-' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '80', 10)) + 'px 0px -95% 0px',
        }
      );

      darkSections.forEach(function (s) { headerDarkObserver.observe(s); });

      // Estado inicial: si la página carga sobre el intro (oscuro), aplicar .on-dark
      const introEl = document.getElementById('intro');
      if (introEl && introEl.getBoundingClientRect().top <= 0 === false) {
        header.classList.add('on-dark');
        darkSectionCount = 1;
      }
    }
  }

  /* ──────────────────────────────────────────────────────────
     2. MOBILE MENU (hamburger)
  ────────────────────────────────────────────────────────── */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    function openMenu() {
      mobileMenu.classList.add('is-open');
      hamburger.classList.add('is-active');
      hamburger.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      mobileMenu.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Cierra grupos colapsables (ej. Servicios)
      mobileMenu.querySelectorAll('.mobile-menu__group.is-open').forEach(function (g) {
        g.classList.remove('is-open');
        var t = g.querySelector('.mobile-menu__toggle');
        var s = g.querySelector('.mobile-menu__sub');
        if (t) t.setAttribute('aria-expanded', 'false');
        if (s) s.setAttribute('aria-hidden', 'true');
      });
    }

    hamburger.addEventListener('click', function () {
      mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Toggle Servicios sub-menú móvil
    var mobileGroups = mobileMenu.querySelectorAll('.mobile-menu__group');
    mobileGroups.forEach(function (group) {
      var toggle = group.querySelector('.mobile-menu__toggle');
      var sub = group.querySelector('.mobile-menu__sub');
      if (!toggle || !sub) return;
      toggle.addEventListener('click', function () {
        var isOpen = group.classList.contains('is-open');
        group.classList.toggle('is-open', !isOpen);
        toggle.setAttribute('aria-expanded', String(!isOpen));
        sub.setAttribute('aria-hidden', String(isOpen));
      });
    });

    // Botón de cierre interno
    var mobileCloseBtn = mobileMenu.querySelector('.mobile-close');
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', function () {
        closeMenu();
        hamburger.focus();
      });
    }

    // Cerrar al tocar fuera del menú
    document.addEventListener('click', function (e) {
      if (
        mobileMenu.classList.contains('is-open') &&
        !e.target.closest('#mobile-menu') &&
        !e.target.closest('.hamburger')
      ) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     3. REVEAL ANIMATIONS (IntersectionObserver)
     .reveal-fade, .reveal-up, .reveal-line → .is-visible
     Stagger via CSS custom property --reveal-delay en el HTML
  ────────────────────────────────────────────────────────── */
  const revealElements = document.querySelectorAll('.reveal-fade, .reveal-up, .reveal-line');

  if (revealElements.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    revealElements.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealElements.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ──────────────────────────────────────────────────────────
     4. CANVAS SCROLL SEQUENCE
     Renderiza frames JPEG en <canvas> controlados por scroll.
     Desktop: frames/desktop/ — 145 frames @ 1280px, 24 fps
     Mobile:  frames/mobile/  —  73 frames @  768px, 12 fps

     Para reemplazar el video en el futuro:
       1. Extrae frames del nuevo video con FFmpeg:
          ffmpeg -i nuevo.mp4 -vf "fps=24,scale=1280:-2" -q:v 3 frames/desktop/frame_%04d.jpg
          ffmpeg -i nuevo.mp4 -vf "fps=12,scale=768:-2"  -q:v 5 frames/mobile/frame_%04d.jpg
       2. Actualiza TOTAL_D / TOTAL_M si cambia el número de frames.
  ────────────────────────────────────────────────────────── */
  var introSection = document.querySelector('.video-scroll');
  var scrollCanvas = document.getElementById('scroll-canvas');
  var seqTexts     = document.querySelectorAll('.video-text');
  var seqHint      = document.querySelector('.video-scroll-hint');

  // Fases de texto: [inicio, fin] normalizado 0–1
  var SEQ_PHASES = [
    [0.00, 0.32],
    [0.28, 0.57],
    [0.52, 0.80],
    [0.75, 1.00],
  ];

  if (introSection && scrollCanvas) {
    var ctx2d       = scrollCanvas.getContext('2d');
    var isMob       = window.innerWidth < 768;
    var FRAME_DIR   = isMob ? 'frames/mobile'   : 'frames/desktop';
    var TOTAL_D     = 145;  // actualizar si cambia el video
    var TOTAL_M     = 73;   // actualizar si cambia el video
    var TOTAL       = isMob ? TOTAL_M : TOTAL_D;
    var frameImgs   = new Array(TOTAL).fill(null);
    var frameLoaded = new Array(TOTAL).fill(false);
    var curFrame    = 0;
    var rafQueued   = false;

    // ── Tamaño del canvas (CSS size ≠ canvas resolution) ──────
    function sizeCanvas() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      if (scrollCanvas.width !== w || scrollCanvas.height !== h) {
        scrollCanvas.width  = w;
        scrollCanvas.height = h;
        renderFrame(curFrame);
      }
    }
    window.addEventListener('resize', sizeCanvas, { passive: true });
    sizeCanvas();

    // ── Dibuja un frame en el canvas (cover-fit) ───────────────
    function renderFrame(idx) {
      if (!frameLoaded[idx] || !ctx2d) return;
      var img = frameImgs[idx];
      var cw  = scrollCanvas.width;
      var ch  = scrollCanvas.height;
      var iw  = img.naturalWidth;
      var ih  = img.naturalHeight;
      var sc  = Math.max(cw / iw, ch / ih);
      var ox  = (cw - iw * sc) / 2;
      var oy  = (ch - ih * sc) / 2;
      ctx2d.drawImage(img, ox, oy, iw * sc, ih * sc);
    }

    // ── Actualiza textos según progreso ────────────────────────
    function updateSeqPhases(p) {
      SEQ_PHASES.forEach(function (range, i) {
        var el = seqTexts[i];
        if (!el) return;
        var on = p >= range[0] && p <= range[1];
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (seqHint) seqHint.classList.toggle('is-hidden', p > 0.03);
    }

    // ── Carga progresiva — frame 0 primero, luego el resto ─────
    function pad4(n) { return ('000' + n).slice(-4); }

    function loadFrame(i) {
      var img = new Image();
      img.onload = function () {
        frameImgs[i]   = img;
        frameLoaded[i] = true;
        if (i === 0) {
          renderFrame(0);
          if (seqTexts[0]) {
            seqTexts[0].classList.add('is-active');
            seqTexts[0].setAttribute('aria-hidden', 'false');
          }
        }
        // Si este frame es el que el scroll necesita ahora, dibujarlo
        if (i === curFrame) renderFrame(i);
      };
      img.src = FRAME_DIR + '/frame_' + pad4(i + 1) + '.jpg';
    }

    // Cargar frame 0 inmediato, luego el resto en batch
    loadFrame(0);
    for (var fi = 1; fi < TOTAL; fi++) { loadFrame(fi); }

    // ── Scroll handler — directo, sin lerp (canvas no lo necesita) ─
    window.addEventListener('scroll', function () {
      var rect     = introSection.getBoundingClientRect();
      var trackH   = introSection.offsetHeight - window.innerHeight;
      var scrolled = -rect.top;
      var progress = Math.max(0, Math.min(1, scrolled / trackH));
      var target   = Math.min(Math.round(progress * (TOTAL - 1)), TOTAL - 1);

      if (target === curFrame && rafQueued) return;
      curFrame = target;

      if (!rafQueued) {
        rafQueued = true;
        requestAnimationFrame(function () {
          renderFrame(curFrame);
          updateSeqPhases(curFrame / (TOTAL - 1));
          rafQueued = false;
        });
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     5. PROCESO — línea cobre animada
     CSS anima width 0→92% cuando la sección entra en viewport
  ────────────────────────────────────────────────────────── */
  const processTimeline = document.querySelector('.process__timeline');

  if (processTimeline && 'IntersectionObserver' in window) {
    const timelineObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            processTimeline.classList.add('is-visible');
            timelineObserver.unobserve(processTimeline);
          }
        });
      },
      { threshold: 0.25 }
    );
    timelineObserver.observe(processTimeline);
  }

  /* ──────────────────────────────────────────────────────────
     6. ACTIVE NAV LINK
     Resalta el link de nav según la sección actualmente visible
  ────────────────────────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(function (link) {
              link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
            });
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ──────────────────────────────────────────────────────────
     7. FORMULARIO DE CONTACTO
     Validación básica + feedback visual
     REEMPLAZAR: integrar con Formspree, Netlify Forms, o EmailJS
  ────────────────────────────────────────────────────────── */
  const contactForm = document.querySelector('.contact__form');

  if (contactForm) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const btnText   = submitBtn ? submitBtn.querySelector('.btn__text') : null;

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const requiredFields = contactForm.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(function (field) {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderBottomColor = '#c0392b';
          field.addEventListener('input', function () {
            field.style.borderBottomColor = '';
          }, { once: true });
        }
      });

      if (!isValid) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Enviando...';
      }

      /* REEMPLAZAR con endpoint real, p.ej.:
         fetch('https://formspree.io/f/TU_ID', {
           method: 'POST',
           body: new FormData(contactForm),
           headers: { 'Accept': 'application/json' }
         }).then(...)
      */
      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Mensaje enviado ✓';
          submitBtn.style.background = '#4a7c59';
        }
        contactForm.reset();

        setTimeout(function () {
          if (submitBtn) {
            if (btnText) btnText.textContent = 'Enviar consulta';
            submitBtn.style.background = '';
          }
        }, 4000);
      }, 1500);
    });
  }

  /* ──────────────────────────────────────────────────────────
     8. SMOOTH SCROLL — fallback para anclas
  ────────────────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      const hh = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '80', 10
      );
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - hh, behavior: 'smooth' });
    });
  });


  /* ──────────────────────────────────────────────────────────
     9. EASTER EGG — Torre Inota
     5 clics en el logo dentro de 3.5s → overlay cinematográfico
     → redirige a /torre-inota/
  ────────────────────────────────────────────────────────── */
  var eggLogo  = document.querySelector('.logo');
  var eggCount = 0;
  var eggTimer = null;

  if (eggLogo) {
    eggLogo.addEventListener('click', function (e) {
      eggCount++;
      clearTimeout(eggTimer);
      eggTimer = setTimeout(function () { eggCount = 0; }, 3500);

      eggLogo.classList.remove('egg-pulse');
      void eggLogo.offsetWidth;
      eggLogo.classList.add('egg-pulse');

      if (eggCount >= 5) {
        e.preventDefault();
        eggCount = 0;
        clearTimeout(eggTimer);
        launchTorreInota();
      }
    });
  }

  function launchTorreInota() {
    var overlay = document.createElement('div');
    overlay.className = 'torre-egg-overlay';
    overlay.innerHTML =
      '<div class="torre-egg-inner">' +
        '<span class="torre-egg-label">acceso secreto</span>' +
        '<p class="torre-egg-title">TORRE<br>INOTA</p>' +
        '<span class="torre-egg-sub">construye el cielo</span>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-active');
      });
    });

    setTimeout(function () {
      window.location.href = '/torre-inota/';
    }, 2200);
  }

  /* ──────────────────────────────────────────────────────────
     10. DROPDOWN SERVICIOS
     Hover (desktop) manejado por CSS.
     Click/tap: toggle .is-open — permite abrir en móvil y
     en escritorio sin hover.
     Click fuera: cierra todos.
  ────────────────────────────────────────────────────────── */
  var dropdownItems = document.querySelectorAll('.nav__item--dropdown');

  dropdownItems.forEach(function (item) {
    var trigger = item.querySelector('.nav__dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      var isOpen = item.classList.contains('is-open');

      // Cierra todos primero
      dropdownItems.forEach(function (d) {
        d.classList.remove('is-open');
        var t = d.querySelector('.nav__dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        // En móvil, donde el hover no existe, evitamos navegar al hacer tap
        // para que el menú se abra. En desktop el hover ya lo muestra.
        if (window.innerWidth < 1024) {
          e.preventDefault();
        }
      }
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav__item--dropdown')) {
      dropdownItems.forEach(function (d) {
        d.classList.remove('is-open');
        var t = d.querySelector('.nav__dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      dropdownItems.forEach(function (d) {
        d.classList.remove('is-open');
        var t = d.querySelector('.nav__dropdown-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

})();
