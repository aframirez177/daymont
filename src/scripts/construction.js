// Construction lines: dashed blueprint axes that draw themselves.
//
// Markup API (on any positioned section):
//   data-cl                  → the section gets an overlay layer
//   [data-cl-text]           → cap-height + baseline lines for every text line
//   [data-cl-edge]           → vertical axes at the element's left/right edges
//   [data-cl-cota="LABEL"]   → dimension line (cota) above the element
//   data-cl-label="EJE 01"   → optional tag on the element's first axis
//
// Lines are HTML divs with a repeating-gradient dash so the dash pattern
// stays exact, and they "draw" by animating clip-path (see global.css).

const metricsCache = new Map();
const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

function fontMetrics(style) {
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if (metricsCache.has(font)) return metricsCache.get(font);
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  // Cap height from flat-topped capitals; ascent = top of the text content box
  // (what Range rects report), so baseline = rect.top + ascent, exactly.
  const m = ctx.measureText('HEFTIXZ');
  const out = {
    ascent: m.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.9,
    cap: m.actualBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.7,
    ctx,
  };
  metricsCache.set(font, out);
  return out;
}

function lineBoxes(el) {
  // Text-node ranges give the glyph content box of each fragment. Word wrappers
  // (.w) are inline-blocks whose boxes follow line-height, not the glyphs.
  const rects = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(r);
  }
  const lines = [];
  for (const r of rects) {
    const hit = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.3);
    if (hit) { hit.left = Math.min(hit.left, r.left); hit.right = Math.max(hit.right, r.right); }
    else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height });
  }
  return lines.sort((a, b) => a.top - b.top);
}

function make(layer, cls, css, delay) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, css);
  if (delay != null) d.style.setProperty('--d', Math.min(0.7, delay * 0.55).toFixed(3));
  layer.appendChild(d);
  return d;
}

function tag(layer, text, x, y, accent, delay) {
  const t = make(layer, `cl-tag${accent ? ' accent' : ''}`, { left: `${x}px`, top: `${y}px` }, delay);
  t.textContent = text;
  return t;
}

function build(section) {
  let layer = section.querySelector(':scope > .cl-layer');
  const wasDrawn = layer?.classList.contains('drawn');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'cl-layer';
    layer.setAttribute('aria-hidden', 'true');
    section.prepend(layer);
  }
  layer.replaceChildren();
  document.documentElement.classList.add('cl-measuring');
  const box = section.getBoundingClientRect();
  const W = box.width, H = box.height;
  let i = 0;
  const step = () => 0.08 * i++;

  section.querySelectorAll('[data-cl-text]').forEach((el) => {
    const st = getComputedStyle(el);
    const { ascent, cap, ctx } = fontMetrics(st);
    const lines = lineBoxes(el);
    if (!lines.length) return;
    const first = el.textContent.trim().charAt(0);
    const bearing = first ? -ctx.measureText(first).actualBoundingBoxLeft : 0; // >0 when ink starts right of the origin
    const left = Math.min(...lines.map((l) => l.left)) - box.left + bearing;
    lines.forEach((l, n) => {
      const snap = (v) => Math.round(v * devicePixelRatio) / devicePixelRatio;
      const base = snap(l.top - box.top + ascent);
      const capTop = snap(base - cap) - 1; // 1px line sits on top of the cap edge, not inside the ink
      make(layer, 'cl h', { left: 0, top: `${capTop}px`, width: `${W}px` }, step());
      make(layer, 'cl h axis march', { left: 0, top: `${base}px`, width: `${W}px` }, step());
      if (n === 0) tag(layer, 'CAP', W - 44, capTop - 14, false, step());
      tag(layer, `BASE ${String(n + 1).padStart(2, '0')}`, W - 64, base + 6, true, step());
      if (n === 0) {
        make(layer, 'cl-x', { left: `${left}px`, top: `${base}px` }, step() + 0.3);
      }
    });
    make(layer, 'cl v axis', { left: `${left}px`, top: 0, height: `${H}px` }, step());
    if (el.dataset.clLabel) tag(layer, el.dataset.clLabel, left + 8, 10, true, step());
  });

  section.querySelectorAll('[data-cl-edge]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const l = r.left - box.left, rr = r.right - box.left;
    make(layer, 'cl v', { left: `${l}px`, top: 0, height: `${H}px` }, step());
    make(layer, 'cl v', { left: `${rr}px`, top: 0, height: `${H}px` }, step());
    if (el.dataset.clLabel) tag(layer, el.dataset.clLabel, l + 8, r.top - box.top - 18, false, step());
  });

  section.querySelectorAll('[data-cl-cota]').forEach((el) => {
    const r = el.getBoundingClientRect();
    const c = make(layer, 'cota', { left: `${r.left - box.left}px`, top: `${r.top - box.top - 26}px`, width: `${r.width}px` }, step());
    const s = document.createElement('span');
    s.textContent = el.dataset.clCota;
    c.appendChild(s);
  });

  document.documentElement.classList.remove('cl-measuring');
  if (wasDrawn) layer.classList.add('drawn');
  return layer;
}

// Each layer exposes --p (0→1). Lines read it in CSS with their own --d offset,
// so the whole blueprint draws in lock-step with the scroll position.
export function initConstruction({ ScrollTrigger, gsap } = {}, root = document) {
  const sections = [...root.querySelectorAll('[data-cl]')];
  if (!sections.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const buildAll = () => sections.forEach((s) => build(s));

  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    buildAll();
    sections.forEach((s) => {
      const layer = s.querySelector(':scope > .cl-layer');
      if (reduce || !ScrollTrigger) { layer.style.setProperty('--p', 1); return; }
      if (s.hasAttribute('data-cl-load')) {
        // Above the fold: draw on load, then keep drafting while the hero scrolls away
        const st = { p: 0 };
        gsap.to(st, { p: 1, duration: 2.2, ease: 'power2.inOut', delay: 0.2, onUpdate: () => layer.style.setProperty('--p', st.p) });
        return;
      }
      ScrollTrigger.create({
        trigger: s, start: 'top 88%', end: 'top 12%', scrub: 0.4,
        onUpdate: (self) => layer.style.setProperty('--p', self.progress.toFixed(4)),
      });
    });
    ScrollTrigger?.refresh();
  });

  let t;
  const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(buildAll, 160); });
  sections.forEach((s) => ro.observe(s));
}
