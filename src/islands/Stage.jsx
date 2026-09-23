// Shared 3D stage: solid ground, key/fill lights with soft shadows,
// contact shadow and N8AO ambient occlusion. Solid background (palette bg)
// so AO composites cleanly.
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { EffectComposer, N8AO } from '@react-three/postprocessing';
import { Env, usePalette } from './cylinder.jsx';

export function Stage({ children, live = true, camera, controls = false, shadowY = -1.25, style, onPointerMissed }) {
  const pal = usePalette();
  const fine = typeof window !== 'undefined' && matchMedia('(pointer: fine)').matches;
  return (
    <Canvas
      shadows
      frameloop={live ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={camera}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y', ...style }}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={[pal.bg]} />
      <Env />
      <hemisphereLight args={['#ffffff', '#202020', 0.35]} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <directionalLight position={[-6, 2, -4]} intensity={0.6} />
      {children}
      <ContactShadows position={[0, shadowY, 0]} opacity={0.65} scale={16} blur={2.4} far={4} resolution={512} color="#000000" />
      {controls && fine && (
        <OrbitControls makeDefault enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.55} minPolarAngle={0.75} maxPolarAngle={2.1} />
      )}
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <N8AO aoRadius={0.9} distanceFalloff={1.2} intensity={3.2} quality="medium" halfRes color="black" />
      </EffectComposer>
    </Canvas>
  );
}
