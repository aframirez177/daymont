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

// Construction lines
initConstruction();

// Reveals
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rv').forEach((el, i) => {
  el.style.transitionDelay = `${(el.dataset.d ?? 0)}ms`;
  io.observe(el);
});

// Taller: sticky words driven by scroll
const taller = document.querySelector('.taller');
if (taller) {
  const words = [...taller.querySelectorAll('.words > div')];
  const dots = [...taller.querySelectorAll('.dots i')];
  const infos = [...taller.querySelectorAll('[data-cap]')];
  const counter = taller.querySelector('[data-counter]');
  const ghost = taller.querySelector('.ghost-word');
  const set = (idx) => {
    words.forEach((w, i) => { w.classList.toggle('on', i === idx); w.classList.toggle('past', i < idx); });
    dots.forEach((d, i) => d.classList.toggle('on', i <= idx));
    infos.forEach((n, i) => (n.hidden = i !== idx));
    if (counter) counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(words.length).padStart(2, '0')}`;
    if (ghost) ghost.textContent = words[idx]?.dataset.short ?? '';
  };
  set(0);
  ScrollTrigger.create({
    trigger: taller, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => set(Math.min(words.length - 1, Math.floor(self.progress * words.length))),
  });
  if (!reduce && ghost) {
    gsap.to(ghost, { xPercent: -18, ease: 'none', scrollTrigger: { trigger: taller, start: 'top top', end: 'bottom bottom', scrub: true } });
  }
}

// Conversion events (SEM-ready; consumed by any tag manager / n8n webhook)
window.dataLayer = window.dataLayer || [];
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) window.dataLayer.push({ event: 'cta_click', cta: el.dataset.track, href: el.getAttribute('href') });
});

// Refresh triggers once fonts and islands have laid out
(document.fonts?.ready ?? Promise.resolve()).then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());
