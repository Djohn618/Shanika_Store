/* Shanika Super & Grocery — site behaviour */
(function () {
  'use strict';

  const SITE = {
    email: 'nipunasan91@gmail.com',
    formEndpoint: 'https://formspree.io/f/xgoezlkv',
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

  /* ---------- Language ---------- */
  const DICT = window.I18N || {};
  const originals = new Map();
  let lang = 'en';

  function t(key) {
    if (lang !== 'en' && DICT[lang] && DICT[lang][key] != null) return DICT[lang][key];
    return DICT.en && DICT.en[key] != null ? DICT.en[key] : key;
  }

  function applyLanguage(next) {
    lang = next === 'en' || DICT[next] ? next : 'en';
    root.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (!originals.has(el)) originals.set(el, el.innerHTML);
      const value = lang === 'en' ? null : DICT[lang] && DICT[lang][el.dataset.i18n];
      el.innerHTML = value != null ? value : originals.get(el);
    });

    document.querySelectorAll('.langs button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    updateOpenStatus();
  }

  function initLanguage() {
    document.querySelectorAll('.langs button').forEach((b) => {
      b.addEventListener('click', () => {
        store.set('lang', b.dataset.lang);
        applyLanguage(b.dataset.lang);
      });
    });
    applyLanguage(store.get('lang') || 'en');
  }

  /* ---------- Full-screen menu (phones) ---------- */
  function initMenu() {
    const btn = document.querySelector('.menu-btn');
    const overlay = document.getElementById('menu');
    if (!btn || !overlay) return;
    const closeBtn = overlay.querySelector('.menu-close');
    overlay.inert = true;

    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      overlay.inert = !open;
      // wait for the overlay to become visible before moving focus into it
      setTimeout(() => (open ? closeBtn : btn).focus(), 60);
    };

    btn.addEventListener('click', () => set(true));
    closeBtn.addEventListener('click', () => set(false));
    overlay.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) set(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
      if (e.matches && document.body.classList.contains('menu-open')) set(false);
    });
  }

  /* ---------- Open / closed ---------- */
  function sriLankaNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: SITE.timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
  }

  function formatHour(h) {
    return (h % 12 === 0 ? 12 : h % 12) + (h >= 12 ? ' PM' : ' AM');
  }

  function updateOpenStatus() {
    const now = sriLankaNow();
    const [open, close] = SITE.hours[now.day];
    const isOpen = now.minutes >= open * 60 && now.minutes < close * 60;
    let text;
    if (isOpen) text = t('status.open').replace('{time}', formatHour(close));
    else if (now.minutes < open * 60) text = t('status.closedToday').replace('{time}', formatHour(open));
    else text = t('status.closedTomorrow').replace('{time}', formatHour(SITE.hours[(now.day + 1) % 7][0]));

    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.dataset.state = isOpen ? 'open' : 'closed';
      const label = el.querySelector('.status-text');
      if (label) label.textContent = text;
    });

    document.querySelectorAll('.hours tr[data-day]').forEach((row) => {
      const today = row.dataset.day.split(',').map(Number).includes(now.day);
      row.classList.toggle('is-today', today);
      const th = row.querySelector('th');
      if (th) th.dataset.today = today ? t('hours.today') : '';
    });
  }

  /* ---------- Map (Google only loads after a click) ---------- */
  function initMap() {
    document.querySelectorAll('[data-map]').forEach((box) => {
      const load = () => {
        const iframe = document.createElement('iframe');
        iframe.src = SITE.mapEmbed;
        iframe.title = 'Map: Shanika Super & Grocery, Kandy Road, Trincomalee';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        const consent = box.querySelector('.map-consent');
        if (consent) consent.remove();
        box.appendChild(iframe);
      };
      if (store.get('mapConsent') === 'yes') { load(); return; }
      const btn = box.querySelector('[data-map-load]');
      if (btn) btn.addEventListener('click', () => {
        const remember = box.querySelector('[data-map-remember]');
        if (remember && remember.checked) store.set('mapConsent', 'yes');
        load();
      });
    });
  }

  /* ---------- Forms (delivered by e-mail through Formspree) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach((form) => {
      const status = form.querySelector('.form-status');
      const button = form.querySelector('button[type="submit"]');

      const show = (type, key) => {
        status.className = 'form-status is-' + type;
        status.textContent = t(key);
        status.setAttribute('role', type === 'error' ? 'alert' : 'status');
      };

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const honey = form.querySelector('.hp input');
        if (honey && honey.value) return;
        if (!form.reportValidity()) return;

        const data = Object.fromEntries(new FormData(form).entries());
        delete data._honey;
        // leave out empty optional fields (Formspree checks that "email" is a real address)
        Object.keys(data).forEach((k) => { if (!String(data[k]).trim()) delete data[k]; });
        const payload = Object.assign({
          _subject: (data.topic ? data.topic + ': ' : '') + 'new message from shanikastore.com',
          language: lang
        }, data);

        const label = button.innerHTML;
        button.disabled = true;
        button.textContent = t('form.sending');

        try {
          const res = await fetch(SITE.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || json.errors) throw new Error('Formspree: ' + JSON.stringify(json.errors || res.status));
          form.reset();
          form.querySelectorAll('.rating-hint').forEach((h) => { h.textContent = ''; });
          show('success', 'form.success');
        } catch (err) {
          console.error(err);
          show('error', 'form.error');
        } finally {
          button.disabled = false;
          button.innerHTML = label;
        }
      });
    });

    document.querySelectorAll('.stars').forEach((group) => {
      const hint = group.parentElement.querySelector('.rating-hint');
      group.addEventListener('change', (e) => {
        if (hint && e.target.value) hint.textContent = t('rating.' + e.target.value);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    [initMenu, initLanguage, initMap, initForms].forEach((fn) => {
      try { fn(); } catch (err) { console.error(err); }
    });
    setInterval(updateOpenStatus, 60 * 1000);
  });
})();
