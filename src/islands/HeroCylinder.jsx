import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Cylinder, Env, usePalette } from './cylinder.jsx';

function Rig({ stateRef, pointer }) {
  const g = useRef();
  const { viewport, size } = useThree();
  const compact = size.width < 820; // mobile/tablet: canvas is a band above the headline
  const pos = compact ? [0.35, -0.05, 0] : [viewport.width * 0.1, 1.55, 0];
  const scale = compact ? Math.min(1.1, viewport.width / 7.2) : Math.min(1.25, viewport.width / 10.5);
  useFrame((_, dt) => {
    const s = stateRef.current;
    // Rod "breathes" in idle, and extends as the hero scrolls away
    s.t = (s.t ?? 0) + dt;
    const idle = (Math.sin(s.t * 0.9) * 0.5 + 0.5) * 0.35;
    s.stroke = Math.min(1, idle + s.scroll * 0.9);
    const ry = -0.62 + pointer.current.x * 0.25 + s.scroll * 0.5;
    const rx = 0.18 + pointer.current.y * 0.12;
    g.current.rotation.y += (ry - g.current.rotation.y) * 0.06;
    g.current.rotation.x += (rx - g.current.rotation.x) * 0.06;
  });
  return (
    <group ref={g} position={pos} scale={scale}>
      <Cylinder stateRef={stateRef} accent={usePalette().accent} />
    </group>
  );
}

export default function HeroCylinder() {
  const host = useRef();
  const stateRef = useRef({ assemble: 1, stroke: 0, paint: 1, pulse: 0, scroll: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const [live, setLive] = useState(true);
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = host.current;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onMove = (e) => {
      pointer.current.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      stateRef.current.scroll = Math.min(1, Math.max(0, -r.top / (r.height * 0.8)));
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener('pointermove', onMove); removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <Canvas
        frameloop={live && !reduce ? 'always' : 'demand'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 10], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Env />
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 5]} intensity={1.6} />
        <directionalLight position={[-6, -2, -4]} intensity={0.5} />
        <Rig stateRef={stateRef} pointer={pointer} />
      </Canvas>
    </div>
  );
}
