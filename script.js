(() => {
  const root = document.documentElement;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('static');

  /* ---------- UI (работает и без GSAP) ---------- */

  // Header: прячем при скролле вниз, показываем при скролле вверх
  const header = document.querySelector('.header');
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle('is-scrolled', y > 40);
    if (!root.classList.contains('menu-open') && !header.classList.contains('dd-open')) header.classList.toggle('is-hidden', y > 400 && y > lastY);
    lastY = y;
  };
  window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  // Выпадающие меню
  const ddLinks = [...document.querySelectorAll('[data-dd]')];
  const ddOverlay = document.querySelector('.dd-overlay');
  let ddTimer = null, ddCurrent = null;
  const ddClose = () => {
    ddLinks.forEach(l => { l.classList.remove('is-open'); l.setAttribute('aria-expanded', 'false'); });
    document.querySelectorAll('.dd.is-open').forEach(p => p.classList.remove('is-open'));
    ddOverlay && ddOverlay.classList.remove('is-on');
    header.classList.remove('dd-open');
    ddCurrent = null;
  };
  const ddOpen = (link) => {
    clearTimeout(ddTimer);
    if (ddCurrent === link) return;
    ddClose();
    const panel = document.querySelector(`.dd[data-panel="${link.dataset.dd}"]`);
    if (!panel) return;
    if (panel.classList.contains('dd--small')) {
      const layer = panel.parentElement.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      panel.style.left = Math.min(r.left - layer.left - 28, layer.width - panel.offsetWidth - 10) + 'px';
    }
    link.classList.add('is-open'); link.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
    ddOverlay && ddOverlay.classList.add('is-on');
    header.classList.add('dd-open');
    header.classList.remove('is-hidden');
    ddCurrent = link;
  };
  const ddLater = () => { clearTimeout(ddTimer); ddTimer = setTimeout(ddClose, 180); };
  ddLinks.forEach(l => {
    l.addEventListener('mouseenter', () => ddOpen(l));
    l.addEventListener('mouseleave', ddLater);
    l.addEventListener('click', e => { e.preventDefault(); ddCurrent === l ? ddClose() : ddOpen(l); });
  });
  document.querySelectorAll('.dd').forEach(p => {
    p.addEventListener('mouseenter', () => clearTimeout(ddTimer));
    p.addEventListener('mouseleave', ddLater);
  });
  document.querySelectorAll('.nav__link:not([data-dd]), .menu a:not([data-dd])').forEach(l => l.addEventListener('mouseenter', ddClose));
  ddOverlay && ddOverlay.addEventListener('click', ddClose);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ddClose(); });

  // Mobile menu
  document.querySelector('.burger').addEventListener('click', () => root.classList.toggle('menu-open'));
  document.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', () => root.classList.remove('menu-open')));

  // Accordion
  document.querySelectorAll('.acc__head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.parentElement;
      const open = !item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.acc__item').forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
      });
      if (open) { item.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
    });
  });

  // News tabs
  const tabs = document.querySelector('.tabs');
  const cards = [...document.querySelectorAll('.news-card')];
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn || btn.classList.contains('is-active')) return;
    const idx = btn.dataset.tab;
    tabs.dataset.active = idx;
    tabs.querySelectorAll('.tab').forEach(t => {
      const on = t === btn; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on);
    });
    const swap = () => cards.forEach(c => c.querySelectorAll('[data-t0]').forEach(el => { el.textContent = el.dataset['t' + idx]; }));
    if (hasGSAP && !reduce) {
      gsap.timeline()
        .to(cards, { y: 24, opacity: 0, duration: .35, stagger: .05, ease: 'power2.in' })
        .add(swap)
        .to(cards, { y: 0, opacity: 1, duration: .7, stagger: .08, ease: 'expo.out' });
    } else swap();
  });

  // CTA form
  const form = document.querySelector('.form');
  const note = form.querySelector('.form__note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('input[required]').forEach(i => {
      const bad = !i.value.trim();
      i.parentElement.classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    note.textContent = ok ? 'Спасибо! Менеджер свяжется с вами в течение рабочего дня.' : 'Заполните имя и телефон';
    note.classList.add('is-visible');
    if (ok) form.reset();
  });
  form.addEventListener('input', e => e.target.parentElement.classList.remove('is-error'));
  document.querySelector('.subscribe').addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.currentTarget.querySelector('button');
    btn.textContent = 'Готово ✓';
    setTimeout(() => (btn.textContent = 'Подписаться'), 2400);
  });

  /* ---------- Без GSAP — показываем всё как есть ---------- */
  if (!hasGSAP || reduce) {
    root.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80 }); }
    }));
  }

  /* ---------- Split text ---------- */
  const splitWords = (el) => {
    const walk = (node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'sw';
            const i = document.createElement('span'); i.className = 'si'; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('lead__dot')) walk(n);
      });
    };
    walk(el);
    return el.querySelectorAll('.si');
  };

  /* ---------- Появление при входе в экран ----------
     IntersectionObserver вместо ScrollTrigger once: корректно срабатывает и после
     перезагрузки посреди страницы (уже пролистанные блоки показываются сразу). */
  const reveal = (el, fn, offset = 12) => {
    if (!el) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { io.disconnect(); fn(); }
    }), { rootMargin: `0px 0px -${offset}% 0px` });
    io.observe(el);
  };

  /* ---------- Loader + hero intro ---------- */
  const heroTitle = document.querySelector('.hero__title');
  const heroWords = splitWords(heroTitle);
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set('[data-hero-btn]', { opacity: 0, y: 20 });
  gsap.set('[data-hero-art]', { opacity: 0 });
  gsap.set('[data-hero-img]', { scale: 1.12 });
  gsap.set('.header', { yPercent: -100 });

  const intro = gsap.timeline({ delay: .1 });
  intro
    .fromTo('.loader__mark', { scale: .6, opacity: 0, rotate: -90 }, { scale: 1, opacity: 1, rotate: 0, duration: .8, ease: 'expo.out' })
    .to('.loader__bar', { scaleX: 1, duration: .9, ease: 'power2.inOut' }, '<.1')
    .to('.loader__mark', { scale: .85, opacity: 0, duration: .4, ease: 'power2.in' })
    .to('.loader', { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=.15')
    .set('.loader', { display: 'none' })
    .to('[data-hero-art]', { opacity: 1, duration: 1.2, ease: 'power2.out' }, '-=.6')
    .to('[data-hero-img]', { scale: 1, duration: 2.2, ease: 'expo.out' }, '<')
    .to('.header', { yPercent: 0, duration: 1, ease: 'expo.out', clearProps: 'transform' }, '<.2')
    .to(heroWords, { yPercent: 0, duration: 1.1, stagger: .09, ease: 'expo.out' }, '<.15')
    .to('[data-hero-btn]', { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, '<.35');

  gsap.to('.hero__content', {
    y: -60, opacity: .2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true }
  });

  /* ---------- Заголовки: слова поднимаются из маски ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    if (el === heroTitle) return;
    const words = splitWords(el);
    const dot = el.querySelector('.lead__dot');
    const tl = gsap.timeline({ paused: true });
    tl.from(words, { yPercent: 110, duration: 1.1, stagger: .045, ease: 'expo.out' });
    if (dot) tl.from(dot, { scale: 0, rotate: -180, duration: .9, ease: 'back.out(1.6)' }, 0);
    reveal(el, () => tl.play());
  });

  /* ---------- Лид: слова «проявляются» по мере скролла ---------- */
  document.querySelectorAll('[data-scrub-words]').forEach(el => {
    const words = splitWords(el);
    const dotTw = gsap.from(el.querySelector('.lead__dot'), { scale: 0, rotate: -180, duration: 1, ease: 'back.out(1.6)', paused: true });
    reveal(el, () => dotTw.play());
    gsap.fromTo(words, { opacity: .12 }, {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 45%', scrub: .6 }
    });
  });

  /* ---------- Eyebrow: эффект печати ---------- */
  document.querySelectorAll('[data-type]').forEach(el => {
    const text = el.textContent;
    const chars = '[]_/<>#01';
    el.style.minHeight = '1.2em';
    reveal(el, () => {
      {
        const obj = { p: 0 };
        gsap.to(obj, {
          p: 1, duration: Math.min(1.4, text.length * .035), ease: 'none',
          onUpdate: () => {
            const n = Math.floor(obj.p * text.length);
            const tail = n < text.length ? chars[Math.floor(Math.random() * chars.length)] : '';
            el.textContent = text.slice(0, n) + tail;
          },
          onComplete: () => (el.textContent = text)
        });
      }
    }, 8);
    el.textContent = '';
  });

  /* ---------- Fade-up ---------- */
  gsap.utils.toArray('[data-fade]').forEach(el => {
    const tw = gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', paused: true });
    reveal(el, () => tw.play(), 8);
  });

  /* ---------- Группы со stagger ---------- */
  gsap.utils.toArray('[data-stagger]').forEach(group => {
    const tw = gsap.from(group.children, { y: 60, opacity: 0, duration: 1.1, stagger: .09, ease: 'expo.out', paused: true, clearProps: 'transform' });
    reveal(group, () => tw.play());
  });

  /* ---------- About: фото раскрывается + параллакс ---------- */
  const media = document.querySelector('[data-clip-reveal]');
  gsap.fromTo(media, { clipPath: 'inset(18% 12% 18% 12% round 33px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 33px)', ease: 'none',
    scrollTrigger: { trigger: media, start: 'top 95%', end: 'top 30%', scrub: .8 }
  });
  gsap.fromTo(media.querySelector('img'), { scale: 1.35 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true }
  });

  /* ---------- Статистика: линии + счётчики ---------- */
  const stats = gsap.utils.toArray('[data-stat]');
  stats.forEach((stat, i) => {
    const num = stat.querySelector('[data-count]');
    const target = +num.dataset.count;
    const icon = stat.querySelector('.stat__icon');
    const label = stat.querySelector('.stat__label');
    const tl = gsap.timeline({ paused: true, delay: (i % 2) * .12 });
    reveal(stat, () => tl.play());
    tl.fromTo(stat, { '--sx': 0 }, { '--sx': 1, duration: 1.2, ease: 'expo.inOut' })
      .from(icon, { scale: .4, opacity: 0, rotate: -30, duration: .9, ease: 'back.out(1.8)' }, .25)
      .from(num, { y: 30, opacity: 0, duration: .9, ease: 'expo.out' }, .3)
      .from(label, { y: 16, opacity: 0, duration: .9, ease: 'expo.out' }, .4);
    const o = { v: 0 };
    tl.to(o, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => (num.textContent = Math.round(o.v) + '+') }, .3);
  });

  /* ---------- Иллюстрация FAQ: чертёж «рисуется» ---------- */
  const draw = document.querySelector('[data-draw] svg');
  if (draw) {
    const paths = draw.querySelectorAll('path');
    paths.forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    const drawTw = gsap.to(paths, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: { each: .025, from: 'start' }, paused: true });
    reveal(draw, () => drawTw.play(), 20);
    gsap.to(draw, {
      y: -40, ease: 'none',
      scrollTrigger: { trigger: '.faq', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Factory: параллакс фона ---------- */
  gsap.fromTo('[data-parallax-bg]', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.factory', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.fromTo('[data-parallax-bg] img', { scale: 1.15 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.factory', start: 'top bottom', end: 'center center', scrub: true }
  });

  /* ---------- CTA: трубы плывут ---------- */
  gsap.fromTo('[data-cta-art] img', { x: 80, rotate: 3, scale: 1.08 }, {
    x: 0, rotate: 0, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'center center', scrub: 1 }
  });

  /* ---------- Footer: логотип ---------- */
  const logoTw = gsap.from('[data-footer-logo]', { y: 40, opacity: 0, scale: .9, duration: 1.2, ease: 'expo.out', paused: true });
  reveal(document.querySelector('.footer__bottom'), () => logoTw.play(), 2);

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
