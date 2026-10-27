/* Shanika Super & Grocery — site behaviour */
(function () {
  'use strict';

  const SITE = {
    email: 'deshanjohn618@gmail.com',
    // Opening hours in Sri Lanka time. Day 0 = Sunday.
    hours: { 0: [7, 20], 1: [6, 21], 2: [6, 21], 3: [6, 21], 4: [6, 21], 5: [6, 21], 6: [6, 21] },
    timeZone: 'Asia/Colombo',
    mapEmbed: 'https://maps.google.com/maps?q=Shanika%20Super%20%26%20Grocery%2C%20Kandy%20Road%2C%20Trincomalee%2C%20Sri%20Lanka&z=16&output=embed'
  };

  const root = document.documentElement;
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ } }
  };

  /* ---------- Theme ---------- */
  function initTheme() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const sync = () => btn.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
    sync();
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      store.set('theme', root.dataset.theme);
      sync();
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener && mq.addEventListener('change', (e) => {
      if (store.get('theme')) return;
      root.dataset.theme = e.matches ? 'dark' : 'light';
      sync();
    });
  }

  /* ---------- Language ---------- */
  const DICT = window.I18N || {};
  const originals = new Map();
  const originalAttrs = new Map();
  let lang = 'en';

  function t(key) {
    if (lang !== 'en' && DICT[lang] && DICT[lang][key] != null) return DICT[lang][key];
    return DICT.en && DICT.en[key] != null ? DICT.en[key] : key;
  }

  function applyLanguage(next) {
    lang = DICT[next] || next === 'en' ? next : 'en';
    root.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!originals.has(el)) originals.set(el, el.innerHTML);
      const key = el.dataset.i18n;
      const value = lang === 'en' ? null : DICT[lang] && DICT[lang][key];
      el.innerHTML = value != null ? value : originals.get(el);
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        const cacheKey = el.dataset.i18nAttr + '|' + attr;
        if (!originalAttrs.has(el)) originalAttrs.set(el, {});
        const cache = originalAttrs.get(el);
        if (!(cacheKey in cache)) cache[cacheKey] = el.getAttribute(attr) || '';
        const value = lang === 'en' ? null : DICT[lang] && DICT[lang][key];
        el.setAttribute(attr, value != null ? value : cache[cacheKey]);
      });
    });

    document.querySelectorAll('.lang-switch button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    updateOpenStatus();
    document.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
  }

  function initLanguage() {
    document.querySelectorAll('.lang-switch button').forEach((b) => {
      b.addEventListener('click', () => {
        store.set('lang', b.dataset.lang);
        applyLanguage(b.dataset.lang);
      });
    });
    const saved = store.get('lang');
    applyLanguage(saved || 'en');
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('main-nav');
    if (!header) return;

    const close = () => {
      document.body.classList.remove('menu-open');
      toggle && toggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = !document.body.classList.contains('menu-open');
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      document.addEventListener('click', (e) => {
        if (document.body.classList.contains('menu-open') && !nav.contains(e.target) && !toggle.contains(e.target)) close();
      });
      window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) close(); });
    }

    const toTop = document.querySelector('.to-top');
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      toTop && toTop.classList.toggle('is-visible', y > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    toTop && toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Open / closed status ---------- */
  function sriLankaNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SITE.timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function formatHour(h) {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return hr + ':00 ' + suffix;
  }

  function updateOpenStatus() {
    const chips = document.querySelectorAll('[data-open-status]');
    const rows = document.querySelectorAll('.hours tr[data-day]');
    if (!chips.length && !rows.length) return;

    const now = sriLankaNow();
    const [open, close] = SITE.hours[now.day];
    const isOpen = now.minutes >= open * 60 && now.minutes < close * 60;
    let text;
    if (isOpen) {
      text = t('status.open').replace('{time}', formatHour(close));
    } else if (now.minutes < open * 60) {
      text = t('status.closedToday').replace('{time}', formatHour(open));
    } else {
      const next = SITE.hours[(now.day + 1) % 7][0];
      text = t('status.closedTomorrow').replace('{time}', formatHour(next));
    }

    chips.forEach((chip) => {
      chip.dataset.state = isOpen ? 'open' : 'closed';
      const label = chip.querySelector('.status-text');
      if (label) label.textContent = text;
    });

    rows.forEach((row) => {
      const days = row.dataset.day.split(',').map(Number);
      const today = days.includes(now.day);
      row.classList.toggle('is-today', today);
      const th = row.querySelector('th');
      if (th) th.dataset.today = today ? t('hours.today') : '';
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Map (loads Google only after consent) ---------- */
  function initMap() {
    document.querySelectorAll('[data-map]').forEach((box) => {
      const load = () => {
        const iframe = document.createElement('iframe');
        iframe.src = SITE.mapEmbed;
        iframe.title = 'Map: Shanika Super & Grocery, Kandy Road, Trincomalee';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        box.querySelector('.map-consent')?.remove();
        box.appendChild(iframe);
      };
      if (store.get('mapConsent') === 'yes') { load(); return; }
      const btn = box.querySelector('[data-map-load]');
      btn && btn.addEventListener('click', () => {
        const remember = box.querySelector('[data-map-remember]');
        if (remember && remember.checked) store.set('mapConsent', 'yes');
        load();
      });
    });
  }

  /* ---------- Forms (sent by e-mail through FormSubmit) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach((form) => {
      const status = form.querySelector('.form-status');
      const button = form.querySelector('button[type="submit"]');

      const show = (type, key) => {
        if (!status) return;
        status.className = 'form-status is-' + type;
        status.innerHTML = '<i class="fa-solid ' + (type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation') + '" aria-hidden="true"></i><span>' + t(key) + '</span>';
        status.setAttribute('role', type === 'error' ? 'alert' : 'status');
      };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (form.querySelector('.hp input') && form.querySelector('.hp input').value) return;
        if (!form.reportValidity()) return;

        const data = Object.fromEntries(new FormData(form).entries());
        delete data._honey;
        const payload = Object.assign({
          _subject: (form.dataset.form === 'feedback' ? 'New feedback' : 'New message') + ' — shanikastore.com',
          _template: 'table',
          _captcha: 'false',
          language: lang
        }, data);

        const original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> ' + t('form.sending');

        try {
          const res = await fetch('https://formsubmit.co/ajax/' + SITE.email, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || json.success === 'false' || json.success === false) throw new Error('send failed');
          form.reset();
          form.querySelectorAll('.rating-hint').forEach((h) => { h.textContent = ''; });
          show('success', 'form.success');
        } catch (err) {
          show('error', 'form.error');
        } finally {
          button.disabled = false;
          button.innerHTML = original;
        }
      });
    });

    // Star rating hint text
    document.querySelectorAll('.stars').forEach((group) => {
      const hint = group.parentElement.querySelector('.rating-hint');
      group.addEventListener('change', (e) => {
        if (hint && e.target.value) hint.textContent = t('rating.' + e.target.value);
      });
    });
  }

  /* ---------- Misc ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Reveal first, so content always shows even if a later step fails
    [initReveal, initTheme, initNav, initLanguage, initMap, initForms, initYear].forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
    setInterval(updateOpenStatus, 60 * 1000);
  });
})();
