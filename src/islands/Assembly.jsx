// Pinned section: vertical scroll drives a horizontal strip of 7 steps
// while a procedural 3D cylinder assembles in sync.
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Cylinder, Env, usePalette, smooth } from './cylinder.jsx';

gsap.registerPlugin(ScrollTrigger);

function Rig({ stateRef, progressRef }) {
  const g = useRef();
  useFrame((_, dt) => {
    const p = progressRef.current;
    const s = stateRef.current;
    s.t = (s.t ?? 0) + dt;
    s.assemble = Math.min(1, p * 1.0);
    const f = p * 7;
    const test = smooth(f - 5) * (1 - smooth(f - 6.2));
    s.pulse = test * (0.6 + 0.4 * Math.sin(s.t * 6));
    s.stroke = 0.25 + test * (Math.sin(s.t * 2.4) * 0.5 + 0.5) * 0.7;
    s.paint = smooth(f - 6);
    const ry = -0.95 + p * 1.25;
    g.current.rotation.y += (ry - g.current.rotation.y) * 0.08;
    g.current.rotation.x = 0.28 - p * 0.12;
    const z = 0.9 + smooth(p * 1.2) * 0.1;
    g.current.scale.setScalar(z);
  });
  return (
    <group ref={g} position={[0.3, 0.35, 0]}>
      <Cylinder stateRef={stateRef} accent={usePalette().accent} />
    </group>
  );
}

export default function Assembly({ steps }) {
  const section = useRef();
  const track = useRef();
  const bar = useRef();
  const progressRef = useRef(0);
  const stateRef = useRef({ assemble: 0, stroke: 0.25, paint: 0, pulse: 0 });
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = section.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0 });
    io.observe(el);

    const distance = () => Math.max(0, track.current.scrollWidth - innerWidth + 80);
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: () => `+=${Math.max(innerHeight * 3.2, distance() * 1.6)}`,
      pin: true,
      scrub: reduce ? false : 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        progressRef.current = p;
        track.current.style.transform = `translate3d(${-distance() * p}px,0,0)`;
        bar.current.style.transform = `scaleX(${p})`;
        setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
      },
    });
    ScrollTrigger.refresh();
    return () => { st.kill(); io.disconnect(); };
  }, [steps.length]);

  const s = steps[active];
  return (
    <section ref={section} className="assembly" id="armado" aria-labelledby="armado-title">
      <div className="stage" aria-hidden="true">
        <Canvas frameloop={live ? 'always' : 'never'} dpr={[1, 1.75]} camera={{ position: [0, 1.1, 9], fov: 34 }} gl={{ antialias: true, alpha: true }}>
          <Env />
          <ambientLight intensity={0.25} />
          <directionalLight position={[4, 6, 5]} intensity={1.6} />
          <directionalLight position={[-6, -2, -4]} intensity={0.5} />
          <Rig stateRef={stateRef} progressRef={progressRef} />
        </Canvas>
      </div>
      <div className="stage-axes" aria-hidden="true">
        <i className="ax-h" /><i className="ax-v" />
        <span className="label" style={{ position: 'absolute', left: 'var(--gutter)', top: 'calc(46% - 18px)' }}>EJE DEL CILINDRO</span>
      </div>
      <div className="progress"><i ref={bar} /></div>
      <div className="head wrap">
        <p className="label">Scroll · Así se arma un cilindro Daymont</p>
        <h2 id="armado-title" className="h1" style={{ marginTop: 10, maxWidth: '9ch' }}>
          Siete pasos, <span className="hl">un solo taller.</span>
        </h2>
      </div>
      <div className="readout" aria-live="polite">
        <span className="label">Paso <b>{s.n} / 07</b></span>
        <span className="label"><b>{s.spec}</b></span>
      </div>
      <ol ref={track} className="track" style={{ listStyle: 'none', margin: 0 }}>
        {steps.map((st, i) => (
          <li key={st.n} className={`panel${i === active ? ' on' : ''}`}>
            <span className="n">{st.n}</span>
            <h3 className="h3">{st.title}</h3>
            <span className="label">{st.spec}</span>
            <p className="small muted">{st.text}</p>
          </li>
        ))}
        <li className="panel" style={{ background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' }}>
          <span className="n" style={{ color: 'inherit' }}>→</span>
          <h3 className="h3">¿Necesitas uno?</h3>
          <p className="small">Configúralo en 2 minutos y recibe la fuerza calculada.</p>
          <a className="btn" href="#configurador" data-track="assembly_to_config" style={{ borderColor: 'currentColor', color: 'inherit' }}>Configurar <span className="arr">→</span></a>
        </li>
      </ol>
    </section>
  );
}
