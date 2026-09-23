// Hero: an interactive cylinder, not a turntable.
// Drag to orbit · Accionar (stroke + pressure) · Corte (cutaway) · Despiece (exploded) · hover names parts.
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Cylinder, usePalette, dimsFrom, PARTS, smooth } from './cylinder.jsx';
import { Stage } from './Stage.jsx';

const DIMS = dimsFrom({ bore: 80, rod: 36, stroke: 500 });
const BORE = 80, PRESSURE = 160; // demo values shown in the readout
const pushKN = (PRESSURE * 1e5 * Math.PI * (BORE / 2000) ** 2) / 1000;

function Rig({ stateRef, ui, onHover }) {
  const g = useRef();
  const { viewport } = useThree();
  // Model is ≈ 7.4 units long with the rod out; keep 12 % air on each side
  const scale = Math.min(1.35, (viewport.width * 1.02) / 7.4); // rotation foreshortens ~12 %, so this still leaves air
  const pos = [0, 0.1, 0];
  useFrame((_, dt) => {
    const s = stateRef.current;
    s.t = (s.t ?? 0) + dt;
    const k = 1 - Math.pow(0.001, dt);
    const want = ui.current.act ? 1 : 0.18 + s.scroll * 0.8;
    s.stroke += (want - s.stroke) * k * 0.9;
    s.explode += ((ui.current.explode ? 1 : 0) - s.explode) * k;
    const moving = Math.abs(want - s.stroke) > 0.01;
    s.pulse += ((moving || ui.current.act ? 0.8 + 0.2 * Math.sin(s.t * 8) : 0) - s.pulse) * k;
    g.current.rotation.y = -0.55 + smooth(s.scroll) * 0.4;
  });
  return (
    <group ref={g} position={pos} scale={scale} rotation={[0.2, -0.55, 0]}>
      <Cylinder stateRef={stateRef} accent={usePalette().accent} dims={DIMS} cutaway={ui.current.cut} onHover={onHover} />
    </group>
  );
}

export default function HeroCylinder() {
  const host = useRef();
  const stateRef = useRef({ assemble: 1, stroke: 0.18, paint: 1, pulse: 0, explode: 0, scroll: 0 });
  const ui = useRef({ act: false, cut: false, explode: false });
  const [, force] = useState(0);
  const [live, setLive] = useState(true);
  const [part, setPart] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0 });
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(matchMedia('(pointer: fine)').matches), []);

  useEffect(() => {
    const el = host.current;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      stateRef.current.scroll = Math.min(1, Math.max(0, -r.top / (r.height * 0.8)));
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); };
  }, []);

  const toggle = (k) => () => {
    ui.current[k] = !ui.current[k];
    force((n) => n + 1);
    window.dataLayer?.push({ event: 'hero_3d', control: k, on: ui.current[k] });
  };

  return (
    <div ref={host} className="hero3d-host" onPointerMove={(e) => setTip({ x: e.clientX, y: e.clientY })}>
      <Stage live={live} camera={{ position: [0, 0.6, 10], fov: 30 }} controls shadowY={-1.05}>
        <Rig stateRef={stateRef} ui={ui} onHover={setPart} />
      </Stage>
      <div className="hero3d-ui" role="group" aria-label="Controles del modelo 3D">
        <button type="button" aria-pressed={ui.current.act} onClick={toggle('act')}>{ui.current.act ? 'Retraer' : 'Accionar'}</button>
        <button type="button" aria-pressed={ui.current.cut} onClick={toggle('cut')}>Corte</button>
        <button type="button" aria-pressed={ui.current.explode} onClick={toggle('explode')}>Despiece</button>
        <span className="hero3d-read" aria-live="polite">
          {ui.current.act ? `Ø${BORE} · ${PRESSURE} bar → ${pushKN.toFixed(1)} kN` : (fine ? 'Arrastra para girar' : 'Prueba el cilindro')}
        </span>
      </div>
      {part && <span className="hero3d-tip" style={{ transform: `translate(${tip.x + 14}px, ${tip.y + 14}px)` }}>{PARTS[part]}</span>}
    </div>
  );
}
