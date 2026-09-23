// "El taller": five hands-on process simulators on one canvas.
// No scroll-jacking. Each process has an idle autopilot that shows what to do
// until the visitor takes over with mouse or finger.
import { useEffect, useRef, useState } from 'react';

const MODES = [
  { key: 'torno', hint: 'Arrastre la herramienta sobre la barra para cortar' },
  { key: 'cnc', hint: 'Arrastre para fresar un vaciado en el bloque' },
  { key: 'print', hint: 'Arrastre de izquierda a derecha para imprimir capa por capa' },
  { key: 'weld', hint: 'Arrastre sobre la junta para depositar el cordón' },
  { key: 'paint', hint: 'Arrastre para pintar la pieza con spray' },
];

const css = (v, f) => (typeof window === 'undefined' ? f : getComputedStyle(document.documentElement).getPropertyValue(v).trim() || f);
const readPal = () => ({ bg: css('--bg', '#0E0E0E'), surface: css('--surface', '#1A1A19'), s2: css('--surface-2', '#242422'), line: css('--line', '#2E2D2A'), construct: css('--construct', '#3A3935'), muted: css('--muted', '#8A8984'), text: css('--text', '#E8E6E1'), accent: css('--accent', '#F24E1E') });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function Taller({ items }) {
  const canvas = useRef(null);
  const wrap = useRef(null);
  const [mode, setMode] = useState(0);
  const [read, setRead] = useState('');
  const [log, setLog] = useState([]);
  const [material, setMaterial] = useState('PLA');
  const [userOn, setUserOn] = useState(false);
  const st = useRef({});
  const ptr = useRef({ x: 0, y: 0, down: false, lastUser: -1e9 });
  const modeRef = useRef(0);
  const matRef = useRef('PLA');
  modeRef.current = mode; matRef.current = material;

  const reset = (m = modeRef.current) => { st.current[MODES[m].key] = null; setLog([]); };

  useEffect(() => {
    const cv = canvas.current, ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, raf = 0, live = false, t0 = performance.now(), lastRead = 0;
    let pal = readPal();
    const onPal = () => { pal = readPal(); };
    addEventListener('palettechange', onPal);
    const size = () => {
      const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr;
      Object.keys(st.current).forEach((k) => (st.current[k] = null));
    };
    const ro = new ResizeObserver(size); ro.observe(cv); size();
    const io = new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live) loop(); }, { threshold: 0.05 });
    io.observe(cv);

    const toLocal = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const down = (e) => { const p = toLocal(e); Object.assign(ptr.current, p, { down: true, lastUser: performance.now() }); setUserOn(true); cv.setPointerCapture?.(e.pointerId); };
    const move = (e) => { const p = toLocal(e); Object.assign(ptr.current, p); if (e.pointerType === 'mouse' || ptr.current.down) ptr.current.lastUser = performance.now(); };
    const up = () => { ptr.current.down = false; };
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); addEventListener('pointerup', up);

    // ── shared drawing helpers ───────────────────────────────────────────
    const grid = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.strokeStyle = pal.construct; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      for (let x = 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
      for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
      ctx.restore();
    };
    const cross = (x, y) => {
      ctx.save(); ctx.strokeStyle = pal.accent; ctx.globalAlpha = .7; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.restore();
    };
    const mono = (txt, x, y, c = pal.muted, align = 'left') => { ctx.font = '500 11px "JetBrains Mono", monospace'; ctx.fillStyle = c; ctx.textAlign = align; ctx.fillText(txt, x, y); };

    // Autopilot pointer per mode (until the visitor interacts)
    const auto = (key, t) => {
      const u = (t % 9000) / 9000;
      switch (key) {
        case 'torno': return { x: W * (0.2 + 0.62 * u), y: H * 0.5 - H * (0.16 - 0.07 * Math.sin(u * Math.PI * 3)), down: true };
        case 'cnc': return { x: W * 0.5 + Math.cos(u * Math.PI * 4) * W * 0.18 * (0.4 + u), y: H * 0.5 + Math.sin(u * Math.PI * 4) * H * 0.18 * (0.4 + u), down: true };
        case 'print': return { x: W * (0.1 + 0.8 * u), y: H * 0.5, down: true };
        case 'weld': return { x: W * (0.12 + 0.76 * u), y: H * 0.5 + Math.sin(u * 40) * 3, down: true };
        default: return { x: W * (0.2 + 0.6 * u), y: H * 0.5 + Math.sin(u * Math.PI * 6) * H * 0.2, down: true };
      }
    };

    // ── 1 · TORNO ────────────────────────────────────────────────────────
    const torno = (s, p, t, dt) => {
      const x0 = W * 0.14, x1 = W * 0.9, N = 110, cy = H * 0.5, R0 = H * 0.2, Rmin = H * 0.06;
      if (!s.r) Object.assign(s, { r: new Array(N).fill(R0), chips: [] });
      const seg = (x1 - x0) / N;
      grid();
      // chuck
      ctx.fillStyle = pal.s2; ctx.fillRect(x0 - W * 0.09, cy - R0 * 1.8, W * 0.08, R0 * 3.6);
      ctx.fillStyle = pal.muted; [-1, 1].forEach((k) => ctx.fillRect(x0 - W * 0.02, cy + k * R0 * 1.05 - (k > 0 ? 0 : R0 * 0.35), W * 0.03, R0 * 0.35));
      // cut
      const tip = { x: p.x, y: p.y };
      const i = Math.floor((tip.x - x0) / seg);
      let cutting = false;
      if (p.down && i >= 0 && i < N) {
        const depth = clamp(Math.abs(tip.y - cy), Rmin, R0);
        for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < N && s.r[k] > depth) { s.r[k] += (depth - s.r[k]) * 0.35; cutting = true; }
      }
      if (cutting && Math.random() < 0.7) s.chips.push({ x: tip.x, y: tip.y, vx: (Math.random() - .3) * 3, vy: -Math.random() * 3, a: 0, life: 1 });
      // bar with rotation bands
      const phase = t * 0.012;
      for (let k = 0; k < N; k++) {
        const r = s.r[k], x = x0 + k * seg;
        const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
        g.addColorStop(0, '#5d6166'); g.addColorStop(.35, '#d9dde1'); g.addColorStop(.55, '#9aa0a6'); g.addColorStop(1, '#3a3d40');
        ctx.fillStyle = g; ctx.fillRect(x, cy - r, seg + .6, r * 2);
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        for (let b = 0; b < 5; b++) { const a = phase + b * 1.2566; if (Math.cos(a) > 0) ctx.fillRect(x, cy + Math.sin(a) * r - .5, seg + .6, 1); }
      }
      // chips
      ctx.strokeStyle = pal.accent;
      s.chips = s.chips.filter((c) => (c.life -= dt * 0.9) > 0);
      s.chips.forEach((c) => { c.vy += 0.15; c.x += c.vx; c.y += c.vy; c.a += 0.4; ctx.globalAlpha = c.life; ctx.beginPath(); ctx.arc(c.x, c.y, 3, c.a, c.a + 4); ctx.stroke(); });
      ctx.globalAlpha = 1;
      // tool insert
      ctx.fillStyle = pal.accent; ctx.beginPath(); const up = tip.y < cy ? -1 : 1;
      ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x - 10, tip.y + up * 26); ctx.lineTo(tip.x + 14, tip.y + up * 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pal.s2; ctx.fillRect(tip.x - 8, tip.y + up * 26 + (up < 0 ? -60 : 0), 26, 60);
      cross(tip.x, tip.y);
      const scale = 80 / (R0 * 2);
      const minD = Math.min(...s.r) * 2 * scale;
      const here = i >= 0 && i < N ? s.r[i] * 2 * scale : null;
      return `Ø inicial 80.0 mm · Ø bajo herramienta ${here ? here.toFixed(1) : '--'} mm · mínimo ${minD.toFixed(1)} mm`;
    };

    // ── 2 · CNC ──────────────────────────────────────────────────────────
    const cnc = (s, p, t, dt) => {
      const bx = W * 0.14, by = H * 0.14, bw = W * 0.72, bh = H * 0.72, rTool = Math.max(10, H * 0.035);
      if (!s.cut) { s.cut = document.createElement('canvas'); s.cut.width = W * dpr; s.cut.height = H * dpr; s.cctx = s.cut.getContext('2d'); s.cctx.scale(dpr, dpr); s.area = 0; s.last = null; s.lines = []; }
      grid();
      ctx.fillStyle = pal.s2; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = pal.muted; ctx.strokeRect(bx + .5, by + .5, bw, bh);
      const inside = p.x > bx + rTool && p.x < bx + bw - rTool && p.y > by + rTool && p.y < by + bh - rTool;
      if (p.down && inside) {
        const c = s.cctx; c.fillStyle = '#000';
        const from = s.prev ?? p, d = Math.hypot(p.x - from.x, p.y - from.y), n = Math.max(1, Math.ceil(d / (rTool * 0.4)));
        for (let k = 1; k <= n; k++) { const x = from.x + (p.x - from.x) * k / n, y = from.y + (p.y - from.y) * k / n; c.beginPath(); c.arc(x, y, rTool, 0, 7); c.fill(); }
        s.prev = { x: p.x, y: p.y };
        if (!s.last || Math.hypot(p.x - s.last.x, p.y - s.last.y) > 18) {
          const mmX = ((p.x - bx) / bw * 200).toFixed(2), mmY = ((by + bh - p.y) / bh * 120).toFixed(2);
          s.lines.push(`G01 X${mmX} Y${mmY} Z-4.00 F1200`); s.lines = s.lines.slice(-7); s.last = { x: p.x, y: p.y }; s.area += 1; s.dirty = true;
        }
      }
      if (!(p.down && inside)) s.prev = null;
      ctx.save(); ctx.globalAlpha = .82; ctx.drawImage(s.cut, 0, 0, W, H); ctx.restore();
      // pocket floor sheen
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .05; ctx.drawImage(s.cut, 1, 1, W, H); ctx.restore();
      // spindle
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 0.03);
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, rTool, 0, 7); ctx.stroke();
      for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(rTool * .6, rTool * .2, rTool, 0); ctx.stroke(); }
      ctx.restore();
      cross(p.x, p.y);
      mono('BLOQUE 200 × 120 mm', bx, by - 10);
      return `Herramienta Ø${(rTool * 2 / bw * 200).toFixed(0)} mm · pasadas ${s.area}`;
    };

    // ── 3 · IMPRESIÓN 3D ─────────────────────────────────────────────────
    const print = (s, p, t) => {
      const resin = matRef.current === 'Resina';
      if (!s.inited || s.resin !== resin) Object.assign(s, { inited: true, resin, prog: 0 });
      const target = clamp((p.x - W * 0.1) / (W * 0.8), 0, 1);
      if (p.down) s.prog = Math.max(s.prog, target);
      const bedY = resin ? H * 0.16 : H * 0.84, h = H * 0.6, cx = W * 0.5;
      const layerH = resin ? 0.05 : 0.2, total = Math.round(60 / layerH);
      const width = (u) => { // a bracket: flange, web with a hole, boss
        if (u < 0.18) return W * 0.34; if (u < 0.75) return W * 0.12 + (u < 0.3 ? (0.3 - u) * W * 1.2 : 0); return W * 0.2;
      };
      grid();
      ctx.fillStyle = pal.muted; ctx.fillRect(W * 0.15, bedY + (resin ? -8 : 0), W * 0.7, 8);
      if (resin) { ctx.fillStyle = 'rgba(120,140,160,.18)'; ctx.fillRect(W * 0.18, H * 0.82, W * 0.64, H * 0.12); mono('TANQUE DE RESINA', W * 0.18, H * 0.97); }
      const drawn = s.prog * h, step = resin ? 2 : 4;
      for (let y = 0; y < drawn; y += step) {
        const u = y / h, w = width(u);
        const hole = u > 0.4 && u < 0.58;
        ctx.fillStyle = resin ? `rgba(200,205,210,${0.55 + 0.25 * ((y / step) % 2)})` : ((y / step) % 2 ? pal.accent : shade(pal.accent));
        const yy = resin ? bedY + y : bedY - y - step;
        if (hole) { ctx.fillRect(cx - w / 2, yy, w * 0.3, step - .5); ctx.fillRect(cx + w * 0.2, yy, w * 0.3, step - .5); }
        else ctx.fillRect(cx - w / 2, yy, w, step - .5);
      }
      // nozzle / laser
      const u = s.prog, w = width(u), headX = cx - w / 2 + ((Math.sin(t * 0.01) + 1) / 2) * w;
      const headY = resin ? bedY + drawn : bedY - drawn;
      if (resin) { ctx.strokeStyle = pal.accent; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(headX, H * 0.94); ctx.lineTo(headX, headY + 2); ctx.stroke(); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = pal.text; ctx.fillRect(headX - 14, headY - 34, 28, 22); ctx.beginPath(); ctx.moveTo(headX - 6, headY - 12); ctx.lineTo(headX + 6, headY - 12); ctx.lineTo(headX, headY - 2); ctx.fill(); }
      cross(p.x, p.y);
      return `${resin ? 'Resina (SLA)' : 'PLA (FDM)'} · capa ${Math.round(s.prog * total)} / ${total} · ${layerH} mm por capa`;
    };
    const shade = (hex) => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) * .8, g = ((n >> 8) & 255) * .8, b = (n & 255) * .8; return `rgb(${r|0},${g|0},${b|0})`; };

    // ── 4 · SOLDADURA ────────────────────────────────────────────────────
    const weld = (s, p, t, dt) => {
      const seam = H * 0.5;
      if (!s.beads) Object.assign(s, { beads: [], sparks: [], len: 0, last: null });
      grid();
      ctx.fillStyle = pal.s2; ctx.fillRect(W * 0.08, H * 0.2, W * 0.84, seam - H * 0.2 - 2); ctx.fillRect(W * 0.08, seam + 2, W * 0.84, H * 0.3);
      ctx.strokeStyle = pal.muted; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(W * 0.08, seam); ctx.lineTo(W * 0.92, seam); ctx.stroke(); ctx.setLineDash([]);
      const onSeam = Math.abs(p.y - seam) < 28 && p.x > W * 0.08 && p.x < W * 0.92;
      if (p.down && onSeam) {
        if (s.last == null) { s.beads.push({ x: p.x, born: t }); s.last = p.x; }
        else if (Math.abs(p.x - s.last) > 3) {
          const n = Math.ceil(Math.abs(p.x - s.last) / 4);
          for (let k = 1; k <= n; k++) s.beads.push({ x: s.last + (p.x - s.last) * k / n, born: t });
          s.len += Math.abs(p.x - s.last); s.last = p.x;
        }
        for (let k = 0; k < 5; k++) s.sparks.push({ x: p.x, y: seam, vx: (Math.random() - .5) * 7, vy: -Math.random() * 6 - 1, life: 1 });
        const g = ctx.createRadialGradient(p.x, seam, 0, p.x, seam, H * 0.4); g.addColorStop(0, 'rgba(255,240,220,.45)'); g.addColorStop(1, 'rgba(255,240,220,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      } else if (!p.down) s.last = null;
      s.beads.forEach((b) => {
        const age = clamp((t - b.born) / 2500, 0, 1);
        ctx.fillStyle = age < 1 ? `rgba(255,${Math.round(200 - age * 140)},${Math.round(80 - age * 60)},${1 - age * 0.3})` : '#6b5a45';
        ctx.beginPath(); ctx.ellipse(b.x, seam, 7, 9, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(b.x - 2, seam, 7, -1, 1); ctx.stroke();
      });
      s.sparks = s.sparks.filter((k) => (k.life -= dt * 1.6) > 0);
      s.sparks.forEach((k) => { k.vy += 0.25; k.x += k.vx; k.y += k.vy; ctx.strokeStyle = `rgba(255,${180 + (k.life * 60) | 0},90,${k.life})`; ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x - k.vx * 2, k.y - k.vy * 2); ctx.stroke(); });
      // torch
      ctx.fillStyle = pal.text; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.5); ctx.fillRect(-5, -70, 10, 56); ctx.fillStyle = pal.accent; ctx.fillRect(-7, -16, 14, 10); ctx.restore();
      cross(p.x, p.y);
      mono(onSeam ? 'ARCO ENCENDIDO' : 'ACERQUE LA ANTORCHA A LA JUNTA', W * 0.08, H * 0.16, onSeam && p.down ? pal.accent : pal.muted);
      return `Cordón depositado ${(s.len / (W * 0.84) * 500).toFixed(0)} mm de 500 mm`;
    };

    // ── 5 · PINTURA ──────────────────────────────────────────────────────
    const paint = (s, p, t, dt) => {
      if (!s.mask) { s.mask = document.createElement('canvas'); s.mask.width = W * dpr; s.mask.height = H * dpr; s.m = s.mask.getContext('2d'); s.m.scale(dpr, dpr); s.tmp = document.createElement('canvas'); s.tmp.width = W * dpr; s.tmp.height = H * dpr; s.tc = s.tmp.getContext('2d'); s.tc.scale(dpr, dpr); s.cov = 0; s.n = 0; }
      const shape = (c) => { // cylinder silhouette: caps, barrel, rod
        const cy = H * 0.5, bh = H * 0.34, x0 = W * 0.16, bw = W * 0.46;
        c.beginPath(); c.rect(x0, cy - bh / 2 - 10, W * 0.05, bh + 20); c.rect(x0 + W * 0.05, cy - bh / 2, bw, bh); c.rect(x0 + W * 0.05 + bw, cy - bh / 2 - 10, W * 0.05, bh + 20);
        c.rect(x0 + W * 0.1 + bw, cy - bh * 0.13, W * 0.2, bh * 0.26);
      };
      grid();
      ctx.fillStyle = '#7d8185'; shape(ctx); ctx.fill();
      if (p.down) {
        const m = s.m; m.fillStyle = '#000';
        const from = s.prev ?? p, n = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 10));
        for (let j = 1; j <= n; j++) {
          const cx = from.x + (p.x - from.x) * j / n, cy = from.y + (p.y - from.y) * j / n;
          for (let k = 0; k < 22; k++) { const a = Math.random() * 7, r = Math.random() ** 0.6 * H * 0.09; m.globalAlpha = .5; m.beginPath(); m.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.2, 0, 7); m.fill(); }
        }
        m.globalAlpha = 1; s.prev = { x: p.x, y: p.y };
        if (t > (s.nextCov ?? 0)) { s.nextCov = t + 350; // coverage estimate on a coarse grid
          let hit = 0, tot = 0; const probe = s.m.getImageData(0, 0, s.mask.width, s.mask.height).data;
          shape(ctx);
          for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) if (ctx.isPointInPath(x * dpr, y * dpr)) { tot++; if (probe[((y * dpr | 0) * s.mask.width + (x * dpr | 0)) * 4 + 3] > 100) hit++; }
          ctx.beginPath(); s.cov = tot ? hit / tot : 0;
        }
      }
      if (!p.down) s.prev = null;
      const tc = s.tc; tc.clearRect(0, 0, W, H); tc.globalCompositeOperation = 'source-over'; tc.drawImage(s.mask, 0, 0, W, H);
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = pal.accent; tc.fillRect(0, 0, W, H);
      tc.globalCompositeOperation = 'destination-in'; tc.fillStyle = '#000'; shape(tc); tc.fill(); tc.globalCompositeOperation = 'source-over';
      ctx.drawImage(s.tmp, 0, 0, W, H);
      // spray gun + cone
      if (p.down) { ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.moveTo(p.x + 40, p.y - 50); ctx.lineTo(p.x - H * 0.09, p.y); ctx.lineTo(p.x + H * 0.09, p.y); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = pal.text; ctx.fillRect(p.x + 34, p.y - 64, 22, 16); ctx.fillRect(p.x + 44, p.y - 48, 8, 26);
      cross(p.x, p.y);
      return `Cobertura ${(s.cov * 100).toFixed(0)} %${s.cov > 0.95 ? ' · lista para instalar' : ''}`;
    };

    const fns = { torno, cnc, print, weld, paint };
    let last = performance.now();
    const loop = () => {
      if (!live) return;
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      const key = MODES[modeRef.current].key;
      const idle = now - ptr.current.lastUser > 3200;
      const p = idle ? auto(key, now - t0) : ptr.current;
      if (!st.current[key]) st.current[key] = {};
      const out = fns[key](st.current[key], p, now - t0, dt);
      if (now - lastRead > 140) {
        lastRead = now; setRead(out); if (idle !== !userOn) setUserOn(!idle);
        if (key === 'cnc' && st.current.cnc?.dirty) { st.current.cnc.dirty = false; setLog([...st.current.cnc.lines]); }
      }
      raf = requestAnimationFrame(loop);
    };
    return () => { cancelAnimationFrame(raf); live = false; ro.disconnect(); io.disconnect(); removeEventListener('palettechange', onPal); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  }, []);

  const pick = (i) => { setMode(i); setLog([]); ptr.current.lastUser = -1e9; window.dataLayer?.push({ event: 'taller_process', process: MODES[i].key }); };
  const it = items[mode];
  return (
    <div className="tl">
      <ol className="tl-list" role="tablist" aria-label="Procesos del taller">
        {items.map((c, i) => (
          <li key={c.code}>
            <button type="button" role="tab" aria-selected={i === mode} onClick={() => pick(i)}>
              <span className="label">{c.code} · {c.kind}</span>
              <span className="tl-word">{c.word}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="tl-stage" ref={wrap}>
        <canvas ref={canvas} className="tl-canvas" aria-label={`Simulador interactivo: ${it.word}`} role="img" />
        <div className="tl-hud tl-top">
          <span className="label"><b>{it.code}</b> · SIMULACIÓN · {userOn ? 'EN SUS MANOS' : 'DEMO AUTOMÁTICA'}</span>
          <div className="tl-actions">
            {MODES[mode].key === 'print' && ['PLA', 'Resina'].map((m) => (
              <button key={m} type="button" className={`chip${material === m ? ' on' : ''}`} onClick={() => { setMaterial(m); reset(2); }}>{m}</button>
            ))}
            <button type="button" className="chip" onClick={() => reset()}>Reiniciar</button>
          </div>
        </div>
        {log.length > 0 && <pre className="tl-gcode" aria-hidden="true">{log.join('\n')}</pre>}
        <div className="tl-hud tl-bottom">
          <span className="label tl-read">{read}</span>
          <span className="label">{MODES[mode].hint}</span>
        </div>
      </div>
      <p className="lead tl-text">{it.text}</p>
    </div>
  );
}
