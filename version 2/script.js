(() => {
  const root = document.documentElement;
  const hasGSAP = window.gsap && window.ScrollTrigger;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || location.search.includes('static');

  /* ---------- Шапка ---------- */
  const header = document.querySelector('.header');
  let lastY = 0;
  const onScroll = (y) => {
    header.classList.toggle('is-compact', y > 40);
    if (!root.classList.contains('menu-open') && !header.classList.contains('dd-open')) header.classList.toggle('is-hidden', y > 500 && y > lastY);
    lastY = y;
  };
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  document.querySelector('.burger').addEventListener('click', () => root.classList.toggle('menu-open'));
  document.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', () => root.classList.remove('menu-open')));

  /* ---------- Выпадающие меню ---------- */
  const ddLinks = [...document.querySelectorAll('[data-dd]')];
  const ddOverlay = document.querySelector('.dd-overlay');
  let ddTimer = null, ddCurrent = null;
  const ddClose = () => {
    ddLinks.forEach(l => { l.classList.remove('is-open'); l.setAttribute('aria-expanded', 'false'); });
    document.querySelectorAll('.dd.is-open').forEach(p => p.classList.remove('is-open'));
    ddOverlay.classList.remove('is-on');
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
    ddOverlay.classList.add('is-on');
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
  document.querySelectorAll('.menu a:not([data-dd])').forEach(l => l.addEventListener('mouseenter', ddClose));
  ddOverlay.addEventListener('click', ddClose);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') ddClose(); });

  /* ---------- Карточки «С чего начать?»: расчёт подъёма заголовка ---------- */
  const layoutCats = () => document.querySelectorAll('.cat').forEach(c => {
    const head = c.querySelector('.cat__head');
    const lift = 28 - head.offsetTop;
    c.style.setProperty('--lift', lift + 'px');
    c.style.setProperty('--subs-top', (28 + head.offsetHeight + 18) + 'px');
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(layoutCats);
  addEventListener('resize', layoutCats);

  /* ---------- Аккордеон ---------- */
  document.querySelectorAll('.acc__head').forEach(head => head.addEventListener('click', () => {
    const item = head.parentElement;
    const open = !item.classList.contains('is-open');
    item.parentElement.querySelectorAll('.acc__item').forEach(i => {
      i.classList.remove('is-open'); i.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
    });
    if (open) { item.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- Вкладки новостей ---------- */
  const tabs = document.querySelector('.tabs');
  const bar = tabs.querySelector('.tabs__bar');
  const posts = [...document.querySelectorAll('.post')];
  const moveBar = (t) => { bar.style.width = t.offsetWidth + 'px'; bar.style.transform = `translateX(${t.offsetLeft}px)`; };
  const applyFilter = (f) => {
    posts.forEach(p => {
      const on = f === 'all' || (p.dataset.kind || '').split(' ').includes(f);
      p.classList.toggle('is-out', !on);
    });
  };
  tabs.addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (!t || t.classList.contains('is-active')) return;
    tabs.querySelectorAll('.tab').forEach(x => x.classList.toggle('is-active', x === t));
    moveBar(t);
    if (hasGSAP && !still) {
      gsap.to(posts, { opacity: 0, y: 16, duration: .3, stagger: .04, ease: 'power2.in', onComplete: () => {
        applyFilter(t.dataset.filter);
        gsap.fromTo(posts.filter(p => !p.classList.contains('is-out')), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .7, stagger: .08, ease: 'expo.out' });
      }});
    } else applyFilter(t.dataset.filter);
  });
  const initBar = () => moveBar(tabs.querySelector('.tab.is-active'));
  document.fonts ? document.fonts.ready.then(initBar) : initBar();
  addEventListener('resize', initBar);

  /* ---------- Форма ---------- */
  const form = document.querySelector('.form');
  const note = form.querySelector('.form__note');
  const noteText = note.textContent;
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(i => {
      const bad = !i.value.trim(); i.parentElement.classList.toggle('is-error', bad); if (bad) ok = false;
    });
    note.classList.toggle('is-err', !ok); note.classList.toggle('is-ok', ok);
    note.textContent = ok ? 'Спасибо! Инженер свяжется с вами в течение рабочего дня.' : 'Заполните имя и телефон';
    if (ok) { form.reset(); setTimeout(() => { note.textContent = noteText; note.classList.remove('is-ok'); }, 5000); }
  });
  form.addEventListener('input', e => e.target.parentElement.classList.remove('is-error'));
  document.querySelector('.sub').addEventListener('submit', e => {
    e.preventDefault();
    const b = e.currentTarget.querySelector('button'); b.textContent = '✓';
    setTimeout(() => (b.textContent = '→'), 2200);
  });

  /* ---------- Слайдер в hero ---------- */
  const slider = document.querySelector('[data-slider]');
  // скрытые слайды (атрибут hidden) не участвуют
  const slides = [...slider.querySelectorAll('[data-slide]:not([hidden])')];
  const dots = [...slider.querySelectorAll('.dot-btn')].slice(0, slides.length);
  const progress = document.createElement('span');
  progress.className = 'slider__progress';
  slider.appendChild(progress);
  const DURATION = 6;
  let current = 0, busy = false, auto = null;

  const animateIn = (slide, dir) => {
    if (!hasGSAP || still) return;
    const lines = slide.querySelectorAll('.ln > span');
    const btn = slide.querySelector('.btn');
    const label = slide.querySelector('.slide__label');
    const img = slide.querySelector('.slide__media img, .slide__media video');
    const tl = gsap.timeline();
    tl.fromTo(img, { opacity: 0, x: img.tagName === 'VIDEO' ? 0 : 120 * dir, scale: 1.06 }, { opacity: 1, x: 0, scale: 1, duration: 1.4, ease: 'expo.out' })
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: .09, ease: 'expo.out' }, .15)
      .fromTo(btn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, .45)
    if (label) tl.fromTo(label, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: 'expo.out' }, .1);
    return tl;
  };
  const restartProgress = () => {
    if (!hasGSAP || still || slides.length < 2) return;
    gsap.killTweensOf(progress);
    gsap.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => go(current + 1, 1) });
  };
  const go = (to, dir = 1) => {
    if (slides.length < 2) return;
    to = (to + slides.length) % slides.length;
    if (to === current || busy) return;
    busy = true;
    const prev = slides[current], next = slides[to];
    dots[current].classList.remove('is-active'); dots[to].classList.add('is-active');
    current = to;
    if (hasGSAP && !still) {
      gsap.to(prev.querySelectorAll('.slide__content > *'), { opacity: 0, y: -20, duration: .4, ease: 'power2.in' });
      gsap.to(prev.querySelector('.slide__media img, .slide__media video'), { opacity: 0, x: -80 * dir, duration: .6, ease: 'power2.in', onComplete: () => {
        prev.classList.remove('is-active');
        gsap.set(prev.querySelectorAll('.slide__content > *'), { clearProps: 'opacity,transform' });
        next.classList.add('is-active');
        animateIn(next, dir).eventCallback('onComplete', () => (busy = false));
        restartProgress();
      }});
    } else {
      prev.classList.remove('is-active'); next.classList.add('is-active'); busy = false;
    }
  };
  slider.querySelector('[data-next]').addEventListener('click', () => go(current + 1, 1));
  slider.querySelector('[data-prev]').addEventListener('click', () => go(current - 1, -1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i, i > current ? 1 : -1)));
  // свайп на тач-устройствах
  let sx = null;
  slider.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  slider.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    sx = null;
  });
  // пауза при наведении
  slider.addEventListener('mouseenter', () => hasGSAP && gsap.getTweensOf(progress).forEach(t => t.pause()));
  slider.addEventListener('mouseleave', () => hasGSAP && gsap.getTweensOf(progress).forEach(t => t.resume()));

  if (!hasGSAP || still) return;

  /* ---------- Motion ---------- */
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1 });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -90 }); }
    }));
  }

  /* Появление при входе в экран — IntersectionObserver: срабатывает и после
     перезагрузки посреди страницы (уже пролистанные блоки показываются сразу) */
  const reveal = (el, fn, offset = 12) => {
    el = typeof el === 'string' ? document.querySelector(el) : el;
    if (!el) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting || e.boundingClientRect.top < 0) { io.disconnect(); fn(); }
    }), { rootMargin: `0px 0px -${offset}% 0px` });
    io.observe(el);
  };

  const typeIn = (el, delay = 0) => {
    const text = el.textContent; const glyphs = '[]_/01#';
    el.textContent = ' ';
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1, delay, duration: Math.min(1.2, text.length * .03), ease: 'none',
      onUpdate: () => {
        const n = Math.floor(o.p * text.length);
        el.textContent = text.slice(0, n) + (n < text.length ? glyphs[(Math.random() * glyphs.length) | 0] : '');
      },
      onComplete: () => (el.textContent = text)
    });
  };

  /* Интро: шапка + первый слайд */
  gsap.from('.top, .header', { opacity: 0, duration: .8, ease: 'power2.out' });
  gsap.from('.slider', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.inOut' });
  gsap.from('.slider__dots, .slider__nav', { opacity: 0, y: 20, duration: .9, delay: 1.1, ease: 'expo.out' });
  gsap.delayedCall(.5, () => { animateIn(slides[0], 1); restartProgress(); });
  gsap.set(slides[0].querySelectorAll('.ln > span'), { yPercent: 110 });
  gsap.set(slides[0].querySelector('.btn'), { opacity: 0 });
  gsap.set(slides[0].querySelector('.slide__label'), { opacity: 0 });
  gsap.set(slides[0].querySelector('.slide__media img, .slide__media video'), { opacity: 0 });

  /* Статистика */
  const stats = gsap.utils.toArray('[data-stat]');
  const statTl = gsap.timeline({ paused: true });
  reveal('.stats', () => statTl.play(), 6);
  statTl
    .fromTo(stats, { '--sy': 0 }, { '--sy': 1, duration: 1, stagger: .08, ease: 'expo.inOut' })
    .from(stats.flatMap(s => [...s.children]), { y: 24, opacity: 0, duration: .9, stagger: .06, ease: 'expo.out' }, .1);
  stats.forEach((s, i) => {
    const n = s.querySelector('[data-count]'); const to = +n.dataset.count; const o = { v: 0 };
    statTl.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => (n.textContent = Math.round(o.v)) }, .15 + i * .06);
  });

  /* Заголовки */
  document.querySelectorAll('[data-lines]').forEach(h => {
    const tw = gsap.from(h.querySelectorAll('.ln > span'), { yPercent: 105, duration: 1.2, stagger: .1, ease: 'expo.out', paused: true });
    reveal(h, () => tw.play());
  });

  /* Моно-подписи */
  document.querySelectorAll('[data-type]').forEach(el => {
    const text = el.textContent;
    reveal(el, () => { el.textContent = text; typeIn(el); }, 8);
  });

  /* О компании: слова проявляются при скролле */
  const scrub = document.querySelector('[data-scrub]');
  const words = [];
  const split = (node) => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        if (/^\s+$/.test(w)) return f.appendChild(document.createTextNode(' '));
        const s = document.createElement('span'); s.className = 'sw'; s.textContent = w; words.push(s); f.appendChild(s);
      });
      n.replaceWith(f);
    } else split(n);
  });
  split(scrub);
  gsap.fromTo(words, { opacity: .12 }, {
    opacity: 1, stagger: .1, ease: 'none',
    scrollTrigger: { trigger: scrub, start: 'top 80%', end: 'bottom 50%', scrub: .5 }
  });

  /* Fade и stagger */
  gsap.utils.toArray('[data-fade]').forEach(el => {
    const tw = gsap.from(el, { opacity: 0, y: 24, duration: 1, ease: 'expo.out', paused: true });
    reveal(el, () => tw.play(), 6);
  });
  gsap.utils.toArray('[data-stagger]').forEach(g => {
    const items = [...g.children].filter(c => !c.classList.contains('is-out'));
    const tw = gsap.from(items, { opacity: 0, y: 48, duration: 1.1, stagger: .08, ease: 'expo.out', clearProps: 'transform', paused: true });
    reveal(g, () => tw.play());
  });

  const lineTw = gsap.fromTo('.cats__grid', { borderTopColor: 'rgba(27,41,83,0)' }, { borderTopColor: 'rgba(27,41,83,1)', duration: 1.2, paused: true });
  reveal('.cats__grid', () => lineTw.play());

  /* CTA: красная линия по скроллу */
  gsap.fromTo('[data-cta]', { '--cx': 0 }, { '--cx': 1, ease: 'none', scrollTrigger: { trigger: '[data-cta]', start: 'top 85%', end: 'top 30%', scrub: .6 } });

  addEventListener('load', () => { ScrollTrigger.refresh(); layoutCats(); });
})();
