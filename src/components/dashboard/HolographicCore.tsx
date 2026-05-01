import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function HolographicCore() {
  const groupRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const torusRef = useRef<THREE.Mesh>(null);
  
  // Custom shader material for holographic effect
  const hologramMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#00d4ff') },
        color2: { value: new THREE.Color('#8b5cf6') },
        opacity: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Pulsing effect
          vec3 pos = position;
          float pulse = sin(time * 2.0) * 0.05;
          pos *= 1.0 + pulse;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // Fresnel effect
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          
          // Animated color
          float colorMix = sin(time * 0.5 + vPosition.y * 2.0) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, colorMix);
          
          // Scanline effect
          float scanline = sin(vPosition.y * 50.0 + time * 5.0) * 0.1 + 0.9;
          
          // Combine effects
          float alpha = (fresnel * 0.8 + 0.2) * opacity * scanline;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Update shader uniforms
    hologramMaterial.uniforms.time.value = time;
    
    // Animate inner core
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.x += 0.01;
      innerCoreRef.current.rotation.y += 0.02;
    }
    
    // Animate outer ring
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= 0.005;
      outerRingRef.current.rotation.x = Math.sin(time * 0.3) * 0.3;
    }
    
    // Animate torus
    if (torusRef.current) {
      torusRef.current.rotation.y += 0.008;
      torusRef.current.rotation.z = Math.sin(time * 0.5) * 0.2;
    }
    
    // Pulse group scale
    if (groupRef.current) {
      const pulse = 1 + Math.sin(time * 2) * 0.02;
      groupRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Inner core - Icosahedron */}
      <mesh ref={innerCoreRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <primitive object={hologramMaterial.clone()} attach="material" />
      </mesh>
      
      {/* Middle ring - Octahedron */}
      <mesh ref={outerRingRef}>
        <octahedronGeometry args={[2.5, 0]} />
        <meshBasicMaterial 
          color="#00d4ff"
          wireframe={true}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Outer ring - Torus */}
      <mesh ref={torusRef} position={[0, 0, 0]}>
        <torusGeometry args={[3.5, 0.1, 16, 100]} />
        <meshBasicMaterial 
          color="#8b5cf6"
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Additional decorative rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.05, 16, 100]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent={true}
          opacity={0.2}
        />
      </mesh>
      
      <mesh rotation={[0, Math.PI / 2, Math.PI / 4]}>
        <torusGeometry args={[4.2, 0.03, 16, 100]} />
        <meshBasicMaterial 
          color="#00ff88"
          transparent={true}
          opacity={0.15}
        />
      </mesh>
      
      {/* Energy particles at center */}
      <PointsCore />
    </group>
  );
}

// Points forming energy core
function PointsCore() {
  const ref = useRef<THREE.Points>(null);
  const count = 100;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 0.5 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x += 0.005;
      
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      ref.current.scale.setScalar(scale);
    }
  });
  
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#00ffff"
        transparent={true}
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}