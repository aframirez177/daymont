// Door A: cylinder configurator → structured RFQ (WhatsApp / copy).
// Forces are computed from the inputs (F = p · A); nothing is invented.
import { useMemo, useState } from 'react';

const BORES = [25, 32, 40, 50, 63, 80, 100, 125, 140, 160, 180, 200, 250];
const RODS = { 25: 12, 32: 14, 40: 18, 50: 22, 63: 28, 80: 36, 100: 45, 125: 56, 140: 63, 160: 70, 180: 80, 200: 90, 250: 110 };
const MOUNTS = ['Brida delantera', 'Brida trasera', 'Horquilla trasera', 'Muñón central', 'Patas laterales', 'Ojo con rótula'];

export default function Configurator({ whatsapp, placeholder }) {
  const [f, setF] = useState({
    kind: 'Hidráulico', bore: 63, rod: 28, stroke: 250, mount: 'Horquilla trasera',
    pressure: 160, qty: 1, city: 'Bogotá', company: '', name: '', notes: '',
  });
  const [copied, setCopied] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
  const setBore = (e) => { const b = Number(e.target.value); setF((s) => ({ ...s, bore: b, rod: RODS[b] })); };
  const setKind = (k) => setF((s) => ({ ...s, kind: k, pressure: k === 'Hidráulico' ? 160 : 6 }));

  const calc = useMemo(() => {
    const A = Math.PI * (f.bore / 2000) ** 2;                   // m²
    const a = A - Math.PI * (f.rod / 2000) ** 2;                // annulus m²
    const P = f.pressure * 1e5;                                  // Pa
    const push = (P * A) / 1000, pull = (P * a) / 1000;          // kN
    const vol = (A * (f.stroke / 1000)) * 1000;                  // L per extension
    return { push, pull, kg: (push * 1000) / 9.81, vol };
  }, [f]);

  const msg = `Hola Daymont, quiero cotizar un cilindro:
• Tipo: ${f.kind}
• Ø camisa: ${f.bore} mm · Ø vástago: ${f.rod} mm
• Carrera: ${f.stroke} mm
• Montaje: ${f.mount}
• Presión de trabajo: ${f.pressure} bar
• Fuerza calculada: ${calc.push.toFixed(1)} kN empuje / ${calc.pull.toFixed(1)} kN retorno
• Cantidad: ${f.qty} · Ciudad: ${f.city}
${f.company ? `• Empresa: ${f.company}\n` : ''}${f.name ? `• Contacto: ${f.name}\n` : ''}${f.notes ? `• Notas: ${f.notes}\n` : ''}(Enviado desde el configurador web)`;

  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  const track = (cta) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: 'rfq_submit', cta, bore: f.bore, stroke: f.stroke, kind: f.kind }); };
  const copy = async () => {
    track('copy');
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* select fallback */ }
  };

  // Schematic geometry (SVG units)
  const barrelH = 34 + (f.bore / 250) * 70;
  const rodH = Math.max(8, barrelH * (f.rod / f.bore));
  const barrelW = 150 + Math.min(1, f.stroke / 1500) * 190;
  const rodOut = 40 + Math.min(1, f.stroke / 1500) * 150;
  const cy = 90, x0 = 30;

  return (
    <div className="cfg">
      <div>
        <form onSubmit={(e) => { e.preventDefault(); track('whatsapp'); window.open(waHref, '_blank', 'noopener'); }} aria-label="Configurador de cilindro">
          <div className="field full">
            <span id="kind-l" className="label">Tipo</span>
            <div className="seg" role="group" aria-labelledby="kind-l">
              {['Hidráulico', 'Neumático'].map((k) => (
                <button key={k} type="button" aria-pressed={f.kind === k} onClick={() => setKind(k)}>{k}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="cfg-bore">Ø camisa (mm)</label>
            <select id="cfg-bore" value={f.bore} onChange={setBore}>{BORES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="cfg-rod">Ø vástago (mm)</label>
            <input id="cfg-rod" type="number" min="6" max={f.bore - 4} value={f.rod} onChange={set('rod')} />
          </div>
          <div className="field">
            <label htmlFor="cfg-stroke">Carrera (mm)</label>
            <input id="cfg-stroke" type="number" min="10" max="6000" step="10" value={f.stroke} onChange={set('stroke')} />
          </div>
          <div className="field">
            <label htmlFor="cfg-pressure">Presión (bar)</label>
            <input id="cfg-pressure" type="number" min="1" max="350" value={f.pressure} onChange={set('pressure')} />
          </div>
          <div className="field full">
            <label htmlFor="cfg-mount">Montaje</label>
            <select id="cfg-mount" value={f.mount} onChange={set('mount')}>{MOUNTS.map((m) => <option key={m}>{m}</option>)}</select>
          </div>
          <div className="field">
            <label htmlFor="cfg-qty">Cantidad</label>
            <input id="cfg-qty" type="number" min="1" value={f.qty} onChange={set('qty')} />
          </div>
          <div className="field">
            <label htmlFor="cfg-city">Ciudad</label>
            <input id="cfg-city" value={f.city} onChange={set('city')} autoComplete="address-level2" />
          </div>
          <div className="field">
            <label htmlFor="cfg-company">Empresa</label>
            <input id="cfg-company" value={f.company} onChange={set('company')} autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="cfg-name">Nombre</label>
            <input id="cfg-name" value={f.name} onChange={set('name')} autoComplete="name" />
          </div>
          <div className="field full">
            <label htmlFor="cfg-notes">Aplicación / notas</label>
            <textarea id="cfg-notes" rows="2" value={f.notes} onChange={set('notes')} placeholder="Ej.: prensa, volteo, compuerta, fluido, temperatura" />
          </div>
          <div className="btns full">
            <button className="btn primary" type="submit">Enviar solicitud por WhatsApp <span className="arr">→</span></button>
            <button className="btn" type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar solicitud'}</button>
          </div>
          {placeholder && <p className="note full">DEMO · el número de WhatsApp es provisional hasta que Daymont lo confirme.</p>}
        </form>
      </div>
      <div className="out">
        <span className="label">Plano esquemático · escala indicativa</span>
        <svg className="schematic" viewBox="0 0 560 190" role="img" aria-label={`Cilindro de ${f.bore} mm de camisa y ${f.stroke} mm de carrera`}>
          <g stroke="var(--construct)" strokeDasharray="4 4" strokeWidth="1">
            <line x1="0" y1={cy} x2="560" y2={cy} />
            <line x1={x0} y1="6" x2={x0} y2="184" />
          </g>
          <rect x={x0 + 14} y={cy - barrelH / 2} width={barrelW} height={barrelH} fill="var(--surface-2)" stroke="var(--text)" strokeWidth="2" />
          <rect x={x0} y={cy - barrelH / 2 - 6} width="16" height={barrelH + 12} fill="var(--text)" />
          <rect x={x0 + 14 + barrelW - 2} y={cy - barrelH / 2 - 6} width="16" height={barrelH + 12} fill="var(--text)" />
          <rect x={x0 + 14 + barrelW * 0.35} y={cy - barrelH / 2 + 2} width="10" height={barrelH - 4} fill="var(--accent)" />
          <rect x={x0 + 24 + barrelW * 0.35} y={cy - rodH / 2} width={barrelW * 0.65 + rodOut} height={rodH} fill="var(--muted)" />
          <circle cx={x0 + 24 + barrelW + rodOut + 8} cy={cy} r={rodH * 0.9 + 4} fill="none" stroke="var(--text)" strokeWidth="3" />
          <g fill="var(--accent-ink)" stroke="var(--accent-ink)" fontFamily="JetBrains Mono, monospace" fontSize="10">
            <line x1={x0 + 14} y1="20" x2={x0 + 14 + barrelW} y2="20" />
            <text x={x0 + 14 + barrelW / 2} y="14" textAnchor="middle" stroke="none">CAMISA</text>
            <line x1={x0 + 14 + barrelW + 14} y1="172" x2={x0 + 24 + barrelW + rodOut} y2="172" />
            <text x={x0 + 20 + barrelW + rodOut / 2} y="166" textAnchor="middle" stroke="none">CARRERA {f.stroke}</text>
            <line x1="548" y1={cy - barrelH / 2} x2="548" y2={cy + barrelH / 2} />
            <text x="540" y={cy - barrelH / 2 - 6} textAnchor="end" stroke="none">Ø{f.bore}</text>
          </g>
        </svg>
        <div className="forces">
          <div><span className="label">Empuje</span><span className="data">{calc.push.toFixed(1)} kN</span><span className="note">≈ {Math.round(calc.kg).toLocaleString('es-CO')} kgf</span></div>
          <div><span className="label">Retorno</span><span className="data">{calc.pull.toFixed(1)} kN</span><span className="note">área anular</span></div>
          <div><span className="label">Volumen</span><span className="data">{calc.vol.toFixed(2)} L</span><span className="note">por extensión</span></div>
        </div>
        <span className="label">Tu solicitud</span>
        <pre className="summary" aria-live="polite">{msg}</pre>
        <p className="note">F = P × A. Valores teóricos sin eficiencia ni factor de seguridad; ingeniería los valida al cotizar.</p>
      </div>
    </div>
  );
}
