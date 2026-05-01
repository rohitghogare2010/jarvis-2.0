import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  EffectComposer,
  Bloom,
  Vignette
} from '@react-three/postprocessing';
import * as THREE from 'three';
import HolographicCore from './HolographicCore';
import FloatingParticles from './FloatingParticles';
import HolographicGrid from './HolographicGrid';
import NeuralNetwork from './NeuralNetwork';

function Scene() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <HolographicCore />
      <FloatingParticles count={200} />
      <HolographicGrid />
      <NeuralNetwork />
    </group>
  );
}

function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom 
        intensity={0.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur={true}
      />
      <Vignette darkness={0.5} offset={0.3} />
    </EffectComposer>
  );
}

function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.2;
    camera.position.x = Math.sin(t) * 0.5;
    camera.position.y = Math.cos(t * 0.5) * 0.3;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

export default function HolographicDashboard() {
  return (
    <>
      <color attach="background" args={['#0a0a0f']} />
      <fog attach="fog" args={['#0a0a0f', 10, 50]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
      <Scene />
      <CameraController />
      <PostProcessing />
    </>
  );
}