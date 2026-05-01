import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function HolographicGrid() {
  const gridRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const size = 30;
    const divisions = 30;
    const halfSize = size / 2;
    const step = size / divisions;
    
    for (let i = 0; i <= divisions; i++) {
      const pos = -halfSize + i * step;
      
      points.push(new THREE.Vector3(-halfSize, 0, pos));
      points.push(new THREE.Vector3(halfSize, 0, pos));
      
      points.push(new THREE.Vector3(pos, 0, -halfSize));
      points.push(new THREE.Vector3(pos, 0, halfSize));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);
  
  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#00d4ff') },
        opacity: { value: 0.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistance;
        
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vDistance = length(worldPos.xz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        
        varying vec2 vUv;
        varying float vDistance;
        
        void main() {
          float fade = 1.0 - smoothstep(5.0, 25.0, vDistance);
          float scanline = sin((vUv.y + time * 0.5) * 100.0) * 0.2 + 0.8;
          float pulse = sin(time * 2.0 - vDistance * 0.5) * 0.1 + 0.9;
          
          float alpha = opacity * fade * scanline * pulse;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);
  
  useFrame((state) => {
    gridMaterial.uniforms.time.value = state.clock.elapsedTime;
    
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.001;
    }
    
    if (linesRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      linesRef.current.scale.set(scale, scale, scale);
    }
  });
  
  return (
    <group ref={gridRef} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <lineSegments ref={linesRef} geometry={gridGeometry}>
        <primitive object={gridMaterial} attach="material" />
      </lineSegments>
      
      <RadialLines />
    </group>
  );
}

function RadialLines() {
  const ref = useRef<THREE.Group>(null);
  
  const lines = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points: THREE.Vector3[] = [];
    const segments = 36;
    const radius = 20;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    
    geometry.setFromPoints(points);
    return geometry;
  }, []);
  
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#00d4ff',
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });
  }, []);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.z += 0.002;
    }
  });
  
  return (
    <group ref={ref}>
      <lineSegments geometry={lines}>
        <primitive object={material} attach="material" />
      </lineSegments>
    </group>
  );
}