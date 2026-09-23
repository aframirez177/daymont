// Procedural, parametric tie-rod hydraulic cylinder (no model files).
// Axis = X. Solid parts (lathe tube with wall thickness, rounded caps),
// optional cutaway (clipping plane) with live fluid chambers, hover parts.
//
// stateRef.current (mutated every frame by the caller):
//   assemble 0..1 · stroke 0..1 · paint 0..1 · pulse 0..1 · explode 0..1
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const smooth = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
const stage = (a, i, n = 7) => smooth(a * n - i);

export function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v, f) => (cs.getPropertyValue(v).trim() || f);
  return { accent: g('--accent', '#F24E1E'), bg: g('--bg', '#0E0E0E'), text: g('--text', '#E8E6E1'), surface: g('--surface', '#1A1A19') };
}

export function usePalette() {
  const [pal, setPal] = useState(() => (typeof window === 'undefined' ? { accent: '#F24E1E', bg: '#0E0E0E', text: '#E8E6E1', surface: '#1A1A19' } : readPalette()));
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
    gl.localClippingEnabled = true;
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => { env.dispose(); pmrem.dispose(); scene.environment = null; };
  }, [gl, scene]);
  return null;
}

// Geometry from real inputs (mm) → scene units
export function dimsFrom({ bore = 63, rod = 28, stroke = 400 } = {}) {
  const R = 0.34 + Math.min(1, bore / 250) * 0.5;
  const L = 1.7 + Math.min(1, stroke / 1500) * 2.6;
  const rodR = Math.max(0.07, R * (rod / bore) * 0.95);
  return { R, L, rodR, cap: R * 0.72, capW: R * 2.35, tie: R * 2.35 * 0.39 };
}

export const PARTS = {
  camisa: 'Camisa · tubo bruñido',
  vastago: 'Vástago · acero cromado',
  piston: 'Pistón y sellos',
  tapas: 'Tapas y puertos',
  tirantes: 'Tirantes y tuercas',
  fluido: 'Aceite a presión',
};

function hover(onHover, key) {
  return {
    onPointerOver: (e) => { e.stopPropagation(); onHover?.(key); document.body.style.cursor = 'pointer'; },
    onPointerOut: (e) => { e.stopPropagation(); onHover?.(null); document.body.style.cursor = ''; },
  };
}

export function Cylinder({ stateRef, accent = '#F24E1E', dims = dimsFrom(), cutaway = false, onHover, castShadow = true }) {
  const { R, L, rodR, cap: CAP, capW: CAP_W, tie: TIE } = dims;
  const ROD_LEN = L + 0.6;
  const clip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)], []);
  const cutState = useRef(null);

  const m = useMemo(() => ({
    paint: new THREE.MeshPhysicalMaterial({ color: '#8b8f94', metalness: 0.55, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide }),
    steel: new THREE.MeshStandardMaterial({ color: '#9aa0a6', metalness: 0.9, roughness: 0.3 }),
    bore: new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }),
    chrome: new THREE.MeshStandardMaterial({ color: '#f1f3f5', metalness: 1, roughness: 0.06 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#111', metalness: 0, roughness: 0.75 }),
    brass: new THREE.MeshStandardMaterial({ color: '#b8925a', metalness: 0.95, roughness: 0.28 }),
    fluidA: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.35, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false }),
    fluidB: new THREE.MeshStandardMaterial({ color: '#6a5a2a', emissive: '#3a2a10', emissiveIntensity: 0.2, transparent: true, opacity: 0.45, roughness: 0.2, depthWrite: false }),
  }), []);
  useEffect(() => { m.fluidA.color.set(accent); m.fluidA.emissive.set(accent); }, [accent, m]);

  // Hollow tube with real wall thickness (lathe profile, closed loop)
  const tube = useMemo(() => {
    const w = Math.max(0.04, R * 0.1);
    const pts = [new THREE.Vector2(R - w, -L / 2), new THREE.Vector2(R, -L / 2), new THREE.Vector2(R, L / 2), new THREE.Vector2(R - w, L / 2), new THREE.Vector2(R - w, -L / 2)];
    return new THREE.LatheGeometry(pts, 96);
  }, [R, L]);

  const bare = useMemo(() => new THREE.Color('#8b8f94'), []);
  const target = useMemo(() => new THREE.Color(accent), [accent]);
  const barrel = useRef(), rod = useRef(), piston = useRef(), capF = useRef(), capR = useRef(), ties = useRef(), fa = useRef(), fb = useRef();

  useFrame(() => {
    const s = stateRef.current;
    const cut = cutaway || !!s.cut;
    if (cut !== cutState.current) {
      cutState.current = cut;
      [m.paint, m.bore, m.steel].forEach((mat) => { mat.clippingPlanes = cut ? clip : []; mat.needsUpdate = true; });
    }
    const a = s.assemble ?? 1;
    const ex = smooth(s.explode ?? 0);
    const t0 = stage(a, 0), t1 = stage(a, 1), t2 = stage(a, 2), t3 = stage(a, 3), t4 = stage(a, 4);
    const travel = L - 0.34 - CAP * 0.2;
    const px = -travel / 2 + (s.stroke ?? 0) * travel * 0.92;

    barrel.current.position.y = (1 - t0) * -3.2 + ex * -1.1;
    barrel.current.visible = t0 > 0.001;
    rod.current.position.x = px + (1 - t1) * 7 + ex * 1.6;
    rod.current.visible = t1 > 0.001;
    piston.current.position.x = px - (1 - t2) * 6.5 + ex * 0.9;
    piston.current.position.y = ex * 1.2;
    piston.current.visible = t2 > 0.001;
    capF.current.position.x = L / 2 + CAP / 2 + (1 - t3) * 3.2 + ex * 1.0;
    capR.current.position.x = -L / 2 - CAP / 2 - (1 - t3) * 3.2 - ex * 1.0;
    capF.current.visible = capR.current.visible = t3 > 0.001;
    ties.current.position.x = (1 - t4) * 9;
    ties.current.position.z = -ex * 1.4;
    ties.current.visible = t4 > 0.001;

    // Fluid chambers (only meaningful in cutaway): cap side A, rod side B
    const inner = -L / 2, outer = L / 2;
    const aLen = Math.max(0.001, px - 0.17 - inner), bLen = Math.max(0.001, outer - (px + 0.17));
    fa.current.scale.set(aLen, 1, 1); fa.current.position.x = inner + aLen / 2;
    fb.current.scale.set(bLen, 1, 1); fb.current.position.x = outer - bLen / 2;
    const showFluid = cut && t3 > 0.99 && ex < 0.01;
    fa.current.visible = fb.current.visible = showFluid;
    m.fluidA.emissiveIntensity = 0.3 + (s.pulse ?? 0) * 1.6;

    m.paint.color.copy(bare).lerp(target, smooth(s.paint ?? 0));
  });

  const shadow = { castShadow, receiveShadow: true };
  const ri = R - Math.max(0.04, R * 0.1) - 0.004;
  return (
    <group>
      <group ref={barrel} {...hover(onHover, 'camisa')}>
        <mesh geometry={tube} rotation={[0, 0, -Math.PI / 2]} material={m.paint} {...shadow} />
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.bore}>
          <cylinderGeometry args={[ri, ri, L, 96, 1, true]} />
        </mesh>
      </group>

      <group ref={fa} {...hover(onHover, 'fluido')}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.fluidA}><cylinderGeometry args={[ri - 0.01, ri - 0.01, 1, 64]} /></mesh>
      </group>
      <group ref={fb}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.fluidB}><cylinderGeometry args={[ri - 0.01, ri - 0.01, 1, 64]} /></mesh>
      </group>

      <group ref={rod} {...hover(onHover, 'vastago')}>
        <mesh position={[ROD_LEN / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.chrome} {...shadow}>
          <cylinderGeometry args={[rodR, rodR, ROD_LEN, 48]} />
        </mesh>
        <RoundedBox args={[0.36, rodR * 2.4, rodR * 2.4]} radius={0.03} position={[ROD_LEN + 0.18, 0, 0]} material={m.steel} {...shadow} />
        <mesh position={[ROD_LEN + 0.36 + rodR * 0.95, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.steel} {...shadow}>
          <torusGeometry args={[rodR * 0.95, rodR * 0.42, 20, 48]} />
        </mesh>
      </group>

      <group ref={piston} {...hover(onHover, 'piston')}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={m.steel} {...shadow}>
          <cylinderGeometry args={[ri - 0.005, ri - 0.005, 0.34, 64]} />
        </mesh>
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={m.rubber}>
            <torusGeometry args={[ri - 0.012, 0.026, 12, 64]} />
          </mesh>
        ))}
      </group>

      <group ref={capF} {...hover(onHover, 'tapas')}>
        <RoundedBox args={[CAP, CAP_W, CAP_W]} radius={0.05} smoothness={3} material={m.paint} {...shadow} />
        <mesh position={[0, CAP_W / 2 + 0.09, 0]} material={m.brass} {...shadow}><cylinderGeometry args={[0.1, 0.1, 0.18, 24]} /></mesh>
        <mesh position={[CAP / 2 + 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel}><cylinderGeometry args={[rodR * 1.6, rodR * 1.6, 0.1, 40]} /></mesh>
      </group>
      <group ref={capR} {...hover(onHover, 'tapas')}>
        <RoundedBox args={[CAP, CAP_W, CAP_W]} radius={0.05} smoothness={3} material={m.paint} {...shadow} />
        <mesh position={[0, CAP_W / 2 + 0.09, 0]} material={m.brass} {...shadow}><cylinderGeometry args={[0.1, 0.1, 0.18, 24]} /></mesh>
        {[-0.2, 0.2].map((z) => (
          <RoundedBox key={z} args={[0.6, CAP_W * 0.45, 0.12]} radius={0.03} position={[-CAP / 2 - 0.3, 0, z * (R / 0.62)]} material={m.steel} {...shadow} />
        ))}
        <mesh position={[-CAP / 2 - 0.42, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.chrome}><cylinderGeometry args={[0.07, 0.07, CAP_W * 0.5, 16]} /></mesh>
      </group>

      <group ref={ties} {...hover(onHover, 'tirantes')}>
        {[[TIE, TIE], [TIE, -TIE], [-TIE, TIE], [-TIE, -TIE]].map(([y, z]) => (
          <group key={`${y}${z}`} position={[0, y, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={m.chrome} {...shadow}><cylinderGeometry args={[0.045, 0.045, L + CAP * 2 + 0.3, 16]} /></mesh>
            {[1, -1].map((sgn) => (
              <mesh key={sgn} position={[sgn * (L / 2 + CAP + 0.08), 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel} {...shadow}>
                <cylinderGeometry args={[0.1, 0.1, 0.12, 6]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
