/* Modern Web Portfolio — interactions. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const config = window.PORTFOLIO_CONFIG || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------
     Config
     ------------------------------------------------------------------ */

  function applyConfig() {
    const name = config.name || 'Your Name';
    const role = config.role || 'Independent Web Developer';
    const email = config.email || '';

    $$('[data-brand-name]').forEach((el) => { el.textContent = name; });
    $$('[data-brand-role]').forEach((el) => { el.textContent = role; });
    $$('[data-brand-initial]').forEach((el) => { el.textContent = name.trim().charAt(0).toUpperCase(); });

    document.title = `${name} — ${role}`;

    $$('[data-email-link]').forEach((el) => {
      if (email) el.href = `mailto:${email}`;
    });
    $$('.contact-item strong').forEach((el) => {
      if (el.textContent.includes('@') && email) el.textContent = email;
    });

    const githubHandle = $('#github-handle');
    const githubLink = $('#github-link');
    const githubFooter = $('#github-link-footer');
    if (config.githubUsername) {
      const url = `https://github.com/${config.githubUsername}`;
      if (githubLink) {
        githubLink.href = url;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLink.removeAttribute('aria-disabled');
      }
      if (githubFooter) githubFooter.href = url;
      if (githubHandle) githubHandle.textContent = `@${config.githubUsername}`;
    } else {
      if (githubLink) {
        githubLink.removeAttribute('href');
        githubLink.removeAttribute('target');
        githubLink.removeAttribute('rel');
        githubLink.setAttribute('aria-disabled', 'true');
      }
      if (githubFooter) githubFooter.remove();
      if (githubHandle) githubHandle.textContent = 'Profile coming soon';
    }

    const linkedin = $('#linkedin-link');
    const linkedinLabel = $('#linkedin-label');
    if (config.linkedinUrl) {
      linkedin.href = config.linkedinUrl;
      linkedin.removeAttribute('aria-disabled');
      linkedin.target = '_blank';
      linkedin.rel = 'noopener noreferrer';
      if (linkedinLabel) linkedinLabel.textContent = 'Connect on LinkedIn';
    } else {
      linkedin.removeAttribute('href');
      linkedin.setAttribute('aria-disabled', 'true');
      if (linkedinLabel) linkedinLabel.textContent = 'Profile coming soon';
    }

    const zone = $('#about-timezone');
    if (zone && config.timezone) zone.textContent = config.timezone;

    const meta = $('#contact-meta');
    if (meta && (config.location || config.timezone)) {
      meta.textContent = [config.location, config.timezone].filter(Boolean).join(' · ');
    }

    const formNote = $('#form-note span');
    if (formNote && config.formEndpoint) {
      formNote.textContent = 'Your enquiry is delivered to my inbox. I will reply as soon as I can.';
    }
  }

  /* ------------------------------------------------------------------
     Header, scroll progress, back to top
     ------------------------------------------------------------------ */

  function initScrollChrome() {
    const header = $('#site-header');
    const bar = $('#scroll-bar');
    const backTop = $('#back-top');
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('scrolled', y > 12);
      if (bar) bar.style.width = `${height > 0 ? Math.min(100, (y / height) * 100) : 0}%`;
      backTop.classList.toggle('show', y > 700);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */

  function initNav() {
    const toggle = $('#nav-toggle');
    const menu = $('#mobile-menu');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
    };

    toggle.addEventListener('click', () => {
      setOpen(!document.body.classList.contains('nav-open'));
    });

    $$('a', menu).forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------
     Active nav link
     ------------------------------------------------------------------ */

  function initActiveNav() {
    const sections = $$('main section[id]');
    const links = $$('.nav-link');
    if (!sections.length || !links.length) return;

    const setActive = (id) => {
      links.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.2, 0.6] });

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */

  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     Cursor glow
     ------------------------------------------------------------------ */

  function initCursorGlow() {
    const glow = $('#cursor-glow');
    if (!glow || reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let raf = null;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;

    window.addEventListener('mousemove', (event) => {
      x = event.clientX;
      y = event.clientY;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        raf = null;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     Card tilt + spotlight
     ------------------------------------------------------------------ */

  function initTilt() {
    if (reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const targets = $$('[data-tilt]');
    targets.forEach((el) => {
      const strength = el.classList.contains('hero-visual') ? 5 : 4;

      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        el.style.setProperty('--ry', `${(px - 0.5) * strength * 2}deg`);
        el.style.setProperty('--rx', `${(0.5 - py) * strength * 2}deg`);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });

      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // Inner card tilt should not rotate the whole service card twice.
    $$('.service-card').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    });
  }

  /* ------------------------------------------------------------------
     Case studies
     ------------------------------------------------------------------ */

  const CASES = {
    nexora: {
      title: 'Nexora SaaS Landing Page',
      tag: 'Personal project',
      banner: 'radial-gradient(500px 320px at 80% 0%, rgba(167,139,250,.55), transparent 65%), linear-gradient(150deg,#2a1a55,#141029 55%,#0e1a3a)',
      meta: [
        ['My role', 'Design & frontend build'],
        ['Type', 'Personal project'],
        ['Stack', 'HTML · CSS · JavaScript'],
      ],
      summary:
        'A complete single-page marketing site for a fictional analytics product. The brief I set myself: make a SaaS page that feels calm and premium instead of loud — strong type hierarchy, generous spacing, and product visuals built entirely in CSS so nothing depends on heavy images.',
      built: [
        'Sticky glass navigation with a working mobile menu.',
        'Hero, feature grid, three-tier pricing table and final call-to-action.',
        'Scroll-reveal animations with an accessible reduced-motion fallback.',
        'Fully responsive layout from 320px to ultra-wide, tested in browser dev tools.',
        'Semantic HTML, focus states and keyboard-operable navigation.',
      ],
      learned:
        'This project pushed me to build a complete page system rather than isolated sections, and to keep the design consistent across every breakpoint. It is a personal concept, not a paid client project.',
      disclaimer: 'Personal project — not a paid client engagement. The product is fictional.',
    },
    country: {
      title: 'Country Explorer API Application',
      tag: 'Personal project',
      banner: 'radial-gradient(500px 320px at 20% 0%, rgba(77,139,255,.5), transparent 65%), linear-gradient(150deg,#16224d,#10122b 55%,#1b1038)',
      meta: [
        ['My role', 'Frontend & API integration'],
        ['Type', 'Personal project'],
        ['Data', 'REST Countries API'],
      ],
      summary:
        'A search-driven app that consumes a real public API instead of hard-coded data. It fetches country records, lets the user search by name and filter by region, and opens a detail view with population, capital, languages and currencies.',
      built: [
        'Fetch API with async/await, loading, empty and error states.',
        'Debounced live search and region filters.',
        'Detail view rendered from the selected country object.',
        'Responsive CSS Grid card layout with a dark interface.',
        'Graceful fallback message when the API is unreachable.',
      ],
      learned:
        'The main lesson was state management without a framework: keeping search input, filters and rendered results in sync while handling slow or failed requests. It is a personal practice project built to learn real API integration.',
      disclaimer: 'Personal project — built for practice with a public API. Data belongs to the REST Countries project.',
    },
    zudoo: {
      title: 'Zudoo AI Assistant Concept',
      tag: 'Concept',
      banner: 'radial-gradient(500px 320px at 70% 10%, rgba(214,128,255,.45), transparent 65%), linear-gradient(150deg,#3a1652,#1a0f30 55%,#241038)',
      meta: [
        ['My role', 'UI concept & prototyping'],
        ['Type', 'Concept study'],
        ['Stack', 'HTML · CSS'],
      ],
      summary:
        'An interface study for a conversational AI assistant. The goal was a focused, low-noise chat experience: one input, clear message grouping, and a visual identity built around a slow-turning gradient orb rather than stock imagery.',
      built: [
        'Chat layout with user and assistant message states.',
        'Animated gradient orb created entirely with CSS conic gradients.',
        'Input bar, suggestion chips and a calm dark palette.',
        'Component styles that could be extended into a real product UI.',
      ],
      learned:
        'This is a design concept, not a working AI product. There is no model or backend behind it — the value is the interface thinking and the CSS craft. I am explicit about that distinction.',
      disclaimer: 'Concept only. No AI model or backend is connected, and nothing here is a commercial product.',
    },
  };

  function initCases() {
    const dialog = $('#case-modal');
    const content = $('#modal-content');
    if (!dialog || !content) return;

    const open = (key) => {
      const study = CASES[key];
      if (!study) return;

      content.innerHTML = `
        <div class="modal-banner" style="background:${study.banner}">
          <span class="mc-tag">${escapeHtml(study.tag)}</span>
          <h2 class="mc-title" id="case-modal-title">${escapeHtml(study.title)}</h2>
        </div>
        <div class="modal-body">
          <dl class="mc-meta">
            ${study.meta.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
          </dl>
          <div class="mc-section">
            <h4>Overview</h4>
            <p>${escapeHtml(study.summary)}</p>
          </div>
          <div class="mc-section">
            <h4>What I built</h4>
            <ul class="mc-list">${study.built.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          </div>
          <div class="mc-section">
            <h4>What I learned</h4>
            <p>${escapeHtml(study.learned)}</p>
          </div>
          <p class="mc-disclaimer">${escapeHtml(study.disclaimer)}</p>
        </div>`;

      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      document.body.style.overflow = '';
    };

    $$('[data-open-case]').forEach((btn) => {
      btn.addEventListener('click', () => open(btn.dataset.openCase));
    });

    $$('[data-case]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        open(card.dataset.case);
      });
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Open case study: ${CASES[card.dataset.case]?.title || ''}`);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(card.dataset.case);
        }
      });
    });

    $('#modal-close')?.addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */

  function initForm() {
    const form = $('#contact-form');
    if (!form) return;

    const toast = $('#toast');
    const showToast = (message) => {
      if (!toast) return;
      toast.innerHTML = message;
      toast.classList.add('show');
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 5200);
    };

    const fields = {
      name: $('#cf-name'),
      email: $('#cf-email'),
      message: $('#cf-message'),
    };

    const setError = (field, message) => {
      const wrapper = field.closest('.field');
      const errorEl = wrapper?.querySelector('.field-error');
      wrapper?.classList.toggle('invalid', Boolean(message));
      if (errorEl) errorEl.textContent = message || '';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    const validate = () => {
      let valid = true;
      if (!fields.name.value.trim() || fields.name.value.trim().length < 2) {
        setError(fields.name, 'Please enter your name.');
        valid = false;
      } else setError(fields.name, '');

      const email = fields.email.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setError(fields.email, 'Please enter a valid email address.');
        valid = false;
      } else setError(fields.email, '');

      if (!fields.message.value.trim() || fields.message.value.trim().length < 10) {
        setError(fields.message, 'Please add a little detail about the project (10+ characters).');
        valid = false;
      } else setError(fields.message, '');
      return valid;
    };

    Object.values(fields).forEach((field) => {
      field.addEventListener('input', () => {
        if (field.closest('.field')?.classList.contains('invalid')) validate();
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const honeypot = form.querySelector('[name="company"]');
      if (honeypot && honeypot.value) return; // silently drop bots

      if (!validate()) {
        fields.name.closest('.field')?.classList.contains('invalid')
          ? fields.name.focus()
          : fields.email.closest('.field')?.classList.contains('invalid')
            ? fields.email.focus()
            : fields.message.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const button = form.querySelector('button[type="submit"]');
      const email = config.email || 'firwall63@gmail.com';

      if (config.formEndpoint) {
        button.classList.add('is-loading');
        button.disabled = true;
        try {
          const response = await fetch(config.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ...data, _subject: `New enquiry: ${data.projectType}` }),
          });
          if (!response.ok) throw new Error(`Request failed: ${response.status}`);
          form.reset();
          showToast('<strong>Message sent.</strong> Thanks — I usually reply within one business day.');
        } catch (error) {
          console.error(error);
          showToast('<strong>Could not send automatically.</strong> Please email me directly at ' + email + '.');
        } finally {
          button.classList.remove('is-loading');
          button.disabled = false;
        }
        return;
      }

      const subject = `Project enquiry — ${data.projectType || 'Website'}`;
      const body = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Project type: ${data.projectType}`,
        `Budget: ${data.budget}`,
        '',
        data.message,
      ].join('\n');

      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast('<strong>Your email app is opening.</strong> Review the message and press send.');
    });
  }

  /* ------------------------------------------------------------------
     Misc
     ------------------------------------------------------------------ */

  function initYear() {
    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  applyConfig();
  initYear();
  initScrollChrome();
  initNav();
  initActiveNav();
  initReveal();
  initCursorGlow();
  initTilt();
  initCases();
  initForm();
})();
