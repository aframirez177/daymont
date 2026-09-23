import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initConstruction } from './construction.js';

gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Smooth scroll (skipped for reduced motion)
if (!reduce) {
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -64 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

// Page rails
requestAnimationFrame(() => document.querySelector('.page-rails')?.classList.add('drawn'));

// Split headlines into masked words (before lines measure them)
document.querySelectorAll('[data-split]').forEach((el) => {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
          w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
  if (reduce) return;
  gsap.fromTo(el.querySelectorAll('.wi'), { yPercent: 105, rotate: 4 }, {
    yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: el.closest('.hero') ? undefined : { trigger: el, start: 'top 85%' },
    delay: el.closest('.hero') ? 0.15 : 0,
  });
});

// Construction lines, scrubbed by scroll
initConstruction({ ScrollTrigger, gsap });

if (!reduce) {
  // Hero exit: the two headline lines shear apart as the cylinder takes over
  const hero = document.querySelector('.hero');
  if (hero) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    tl.to(hero.querySelector('.l1'), { xPercent: -14, ease: 'none' }, 0)
      .to(hero.querySelector('.l2'), { xPercent: 10, ease: 'none' }, 0)
      .to(hero.querySelector('.meta-row'), { opacity: 0, ease: 'none' }, 0);
  }

  // Ghost numerals: oversized outline indices drifting at their own depth
  document.querySelectorAll('.ghost-num').forEach((g) => {
    gsap.fromTo(g, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Panels that open like a drawing sheet being unrolled
  document.querySelectorAll('[data-wipe]').forEach((sec) => {
    gsap.fromTo(sec, { clipPath: 'inset(9% 5% 0% 5%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: sec, start: 'top 95%', end: 'top 35%', scrub: true } });
  });

  // Cards lift in with a slight depth offset
  document.querySelectorAll('[data-depth]').forEach((el) => {
    const d = parseFloat(el.dataset.depth);
    gsap.fromTo(el, { y: 44 * d }, { y: -44 * d, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

// Blueprint HUD: scroll ruler, section index, live coordinates, cursor crosshair
const hud = document.querySelector('.hud');
if (hud) {
  const marker = hud.querySelector('.hud-mark');
  const yOut = hud.querySelector('[data-y]');
  const secOut = hud.querySelector('[data-sec]');
  const items = [...hud.querySelectorAll('.hud-idx li')];
  const secs = items.map((li) => document.getElementById(li.dataset.target)).filter(Boolean);
  const tick = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    marker.style.transform = `translateY(${p * (innerHeight - 160)}px)`;
    yOut.textContent = String(Math.round(scrollY)).padStart(6, '0');
    let cur = 0;
    secs.forEach((sec, i) => { if (sec.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
    items.forEach((li, i) => li.classList.toggle('on', i === cur));
    secOut.textContent = items[cur]?.textContent ?? '';
  };
  addEventListener('scroll', tick, { passive: true }); tick();
  items.forEach((li) => li.addEventListener('click', () => {
    const el = document.getElementById(li.dataset.target);
    if (el) (window.__lenis ? window.__lenis.scrollTo(el, { offset: -64 }) : el.scrollIntoView());
  }));

  const cross = document.querySelector('.crosshair');
  if (cross && matchMedia('(pointer: fine)').matches && !reduce) {
    const [cx, cy, cl] = [cross.querySelector('.cx'), cross.querySelector('.cy'), cross.querySelector('.cc')];
    let tx = 0, ty = 0, x = 0, y = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cross.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => cross.classList.remove('on'));
    gsap.ticker.add(() => {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cx.style.transform = `translateX(${x}px)`; cy.style.transform = `translateY(${y}px)`;
      cl.style.transform = `translate(${x + 12}px, ${y + 12}px)`;
      cl.textContent = `X ${String(Math.round(x)).padStart(4, '0')} · Y ${String(Math.round(y + scrollY)).padStart(5, '0')}`;
    });
  }
}

// Reveals
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rv').forEach((el, i) => {
  el.style.transitionDelay = `${(el.dataset.d ?? 0)}ms`;
  io.observe(el);
});

// Conversion events (SEM-ready; consumed by any tag manager / n8n webhook)
window.dataLayer = window.dataLayer || [];
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) window.dataLayer.push({ event: 'cta_click', cta: el.dataset.track, href: el.getAttribute('href') });
});

// Refresh triggers once fonts and islands have laid out
(document.fonts?.ready ?? Promise.resolve()).then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
