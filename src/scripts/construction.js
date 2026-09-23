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
  const m = ctx.measureText('HDMX');
  const out = {
    ascent: m.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.9,
    cap: m.actualBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.7,
  };
  metricsCache.set(font, out);
  return out;
}

function lineBoxes(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2);
  const lines = [];
  for (const r of rects) {
    const hit = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.5);
    if (hit) { hit.left = Math.min(hit.left, r.left); hit.right = Math.max(hit.right, r.right); }
    else lines.push({ top: r.top, left: r.left, right: r.right, height: r.height });
  }
  return lines.sort((a, b) => a.top - b.top);
}

function make(layer, cls, css, delay) {
  const d = document.createElement('div');
  d.className = cls;
  Object.assign(d.style, css);
  if (delay != null) d.style.transitionDelay = `${delay}s`;
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
  const box = section.getBoundingClientRect();
  const W = box.width, H = box.height;
  let i = 0;
  const step = () => 0.08 * i++;

  section.querySelectorAll('[data-cl-text]').forEach((el) => {
    const st = getComputedStyle(el);
    const { ascent, cap } = fontMetrics(st);
    const lines = lineBoxes(el);
    const left = Math.min(...lines.map((l) => l.left)) - box.left;
    lines.forEach((l, n) => {
      const base = l.top - box.top + ascent;
      const capTop = base - cap;
      make(layer, 'cl h', { left: 0, top: `${capTop}px`, width: `${W}px` }, step());
      make(layer, 'cl h axis march', { left: 0, top: `${base}px`, width: `${W}px` }, step());
      if (n === 0) tag(layer, 'CAP', W - 44, capTop - 14, false, step());
      tag(layer, `BASE ${String(n + 1).padStart(2, '0')}`, W - 64, base + 6, true, step());
      if (n === 0) {
        const x = make(layer, 'cl-x', { left: `${left}px`, top: `${base}px` });
        x.style.transitionDelay = `${step() + 0.6}s`;
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

  if (wasDrawn) layer.classList.add('drawn');
  return layer;
}

export function initConstruction(root = document) {
  const sections = [...root.querySelectorAll('[data-cl]')];
  if (!sections.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        const layer = e.target.querySelector(':scope > .cl-layer');
        layer && requestAnimationFrame(() => layer.classList.add('drawn'));
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.18 });

  const buildAll = () => sections.forEach((s) => {
    const layer = build(s);
    if (reduce) layer.classList.add('drawn');
  });

  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    buildAll();
    if (!reduce) sections.forEach((s) => io.observe(s));
  });

  let t;
  const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(buildAll, 160); });
  sections.forEach((s) => ro.observe(s));
}
