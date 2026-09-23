// Procedural tie-rod hydraulic cylinder (no external model files).
// Axis = X. `stateRef.current` drives it every frame:
//   assemble 0..1  (0 = exploded, 1 = assembled, in 7 stages)
//   stroke   0..1  (rod retracted → extended)
//   paint    0..1  (bare steel → brand color)
//   pulse    0..1  (pressure-test glow)
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const L = 3.0;          // barrel length
const R = 0.62;         // barrel outer radius
const CAP = 0.44;       // cap thickness
const CAP_W = 1.46;     // square flange size
const ROD_R = 0.22;
const ROD_LEN = 3.5;
const TIE = 0.56;       // tie-rod offset from axis

export const smooth = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const stage = (a, i, n = 7) => smooth(a * n - i);

export function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v, f) => (cs.getPropertyValue(v).trim() || f);
  return { accent: g('--accent', '#F24E1E'), bg: g('--bg', '#0E0E0E'), text: g('--text', '#E8E6E1') };
}

export function usePalette() {
  const [pal, setPal] = useState(() => (typeof window === 'undefined' ? { accent: '#F24E1E', bg: '#0E0E0E', text: '#E8E6E1' } : readPalette()));
  useEffect(() => {
    const on = () => setPal(readPalette());
    window.addEventListener('palettechange', on);
    return () => window.removeEventListener('palettechange', on);
  }, []);
  return pal;
}

export function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { env.dispose(); pmrem.dispose(); scene.environment = null; };
  }, [gl, scene]);
  return null;
}

function hexNut(props) {
  return (
    <mesh {...props} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.11, 0.11, 0.13, 6]} />
      {props.children}
    </mesh>
  );
}

export function Cylinder({ stateRef, accent = '#F24E1E' }) {
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b8f94', metalness: 0.85, roughness: 0.32 }), []);
  const paintMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8b8f94', metalness: 0.7, roughness: 0.34 }), []);
  const chrome = useMemo(() => new THREE.MeshStandardMaterial({ color: '#eceef0', metalness: 1, roughness: 0.05 }), []);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0, roughness: 0.8 }), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b08d57', metalness: 0.9, roughness: 0.3 }), []);
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color(accent), emissiveIntensity: 0, transparent: true, opacity: 0.9 }), []);

  const bare = useMemo(() => new THREE.Color('#8b8f94'), []);
  const target = useMemo(() => new THREE.Color(accent), [accent]);
  useEffect(() => { glow.emissive.set(accent); }, [accent, glow]);

  const barrel = useRef(), rod = useRef(), piston = useRef(), capF = useRef(), capR = useRef(), ties = useRef(), ring = useRef();

  useFrame(() => {
    const s = stateRef.current;
    const a = s.assemble ?? 1;
    const t0 = stage(a, 0), t1 = stage(a, 1), t2 = stage(a, 2), t3 = stage(a, 3), t4 = stage(a, 4);
    const strokeX = -0.95 + (s.stroke ?? 0) * 1.75; // piston position inside barrel

    barrel.current.position.y = (1 - t0) * -3.2;
    barrel.current.visible = t0 > 0.001;

    rod.current.position.x = strokeX + (1 - t1) * 7;
    rod.current.visible = t1 > 0.001;

    piston.current.position.x = strokeX - (1 - t2) * 6.5;
    piston.current.visible = t2 > 0.001;

    capF.current.position.x = L / 2 + CAP / 2 + (1 - t3) * 3.2;
    capR.current.position.x = -L / 2 - CAP / 2 - (1 - t3) * 3.2;
    capF.current.visible = capR.current.visible = t3 > 0.001;

    ties.current.position.x = (1 - t4) * 9;
    ties.current.visible = t4 > 0.001;

    paintMat.color.copy(bare).lerp(target, smooth(s.paint ?? 0));
    const p = s.pulse ?? 0;
    glow.emissiveIntensity = p * 2.2;
    ring.current.visible = p > 0.01;
    ring.current.position.x = strokeX;
  });

  return (
    <group>
      {/* Barrel */}
      <group ref={barrel}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={paintMat}>
          <cylinderGeometry args={[R, R, L, 64, 1, true]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={steel}>
          <cylinderGeometry args={[R - 0.05, R - 0.05, L, 64, 1, true]} />
        </mesh>
      </group>

      {/* Rod + rod eye */}
      <group ref={rod}>
        <mesh position={[ROD_LEN / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={chrome}>
          <cylinderGeometry args={[ROD_R, ROD_R, ROD_LEN, 48]} />
        </mesh>
        <mesh position={[ROD_LEN + 0.18, 0, 0]} material={steel}>
          <boxGeometry args={[0.36, 0.5, 0.5]} />
        </mesh>
        <mesh position={[ROD_LEN + 0.52, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
          <torusGeometry args={[0.2, 0.09, 16, 40]} />
        </mesh>
      </group>

      {/* Piston + seals */}
      <group ref={piston}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={steel}>
          <cylinderGeometry args={[R - 0.06, R - 0.06, 0.36, 48]} />
        </mesh>
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={rubber}>
            <torusGeometry args={[R - 0.06, 0.028, 10, 48]} />
          </mesh>
        ))}
      </group>

      {/* Pressure ring (test stage) */}
      <mesh ref={ring} rotation={[0, Math.PI / 2, 0]} material={glow}>
        <torusGeometry args={[R + 0.05, 0.018, 8, 64]} />
      </mesh>

      {/* Caps with ports; rear cap carries the clevis */}
      <group ref={capF}>
        <mesh material={paintMat}><boxGeometry args={[CAP, CAP_W, CAP_W]} /></mesh>
        <mesh position={[0, CAP_W / 2 + 0.1, 0]} material={brass}><cylinderGeometry args={[0.1, 0.1, 0.2, 20]} /></mesh>
        <mesh position={[CAP / 2 + 0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={steel}><cylinderGeometry args={[0.34, 0.34, 0.12, 32]} /></mesh>
      </group>
      <group ref={capR}>
        <mesh material={paintMat}><boxGeometry args={[CAP, CAP_W, CAP_W]} /></mesh>
        <mesh position={[0, CAP_W / 2 + 0.1, 0]} material={brass}><cylinderGeometry args={[0.1, 0.1, 0.2, 20]} /></mesh>
        {[-0.2, 0.2].map((z) => (
          <mesh key={z} position={[-CAP / 2 - 0.3, 0, z]} material={steel}><boxGeometry args={[0.6, 0.62, 0.12]} /></mesh>
        ))}
        <mesh position={[-CAP / 2 - 0.42, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={chrome}><cylinderGeometry args={[0.08, 0.08, 0.62, 16]} /></mesh>
      </group>

      {/* Tie rods + nuts */}
      <group ref={ties}>
        {[[TIE, TIE], [TIE, -TIE], [-TIE, TIE], [-TIE, -TIE]].map(([y, z]) => (
          <group key={`${y}${z}`} position={[0, y, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={chrome}><cylinderGeometry args={[0.05, 0.05, L + CAP * 2 + 0.34, 16]} /></mesh>
            {hexNut({ position: [L / 2 + CAP + 0.08, 0, 0], material: steel })}
            {hexNut({ position: [-L / 2 - CAP - 0.08, 0, 0], material: steel })}
          </group>
        ))}
      </group>
    </group>
  );
}
