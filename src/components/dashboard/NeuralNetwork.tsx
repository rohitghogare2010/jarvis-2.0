import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const nodeCount = 15;
  
  // Create nodes
  const { nodes, edges } = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    
    // Generate nodes in a spherical distribution
    for (let i = 0; i < nodeCount; i++) {
      const radius = 5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      nodes.push(new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ));
    }
    
    // Create edges (connect nearby nodes)
    const edges: [number, number][] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < 4) {
          edges.push([i, j]);
        }
      }
    }
    
    return { nodes, edges };
  }, []);
  
  // Create line geometry for edges
  const edgesGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    edges.forEach(([i, j]) => {
      points.push(nodes[i]);
      points.push(nodes[j]);
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodes, edges]);
  
  const nodePositions = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    nodes.forEach((node, i) => {
      positions[i * 3] = node.x;
      positions[i * 3 + 1] = node.y;
      positions[i * 3 + 2] = node.z;
    });
    return positions;
  }, [nodes]);
  
  const edgeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#00ffff') },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        varying float vAlpha;
        
        void main() {
          float pulse = sin(time * 3.0) * 0.3 + 0.7;
          gl_FragColor = vec4(color, vAlpha * pulse * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    edgeMaterial.uniforms.time.value = time;
    
    if (groupRef.current) {
      // Slow rotation
      groupRef.current.rotation.y += 0.002;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      
      // Pulse scale
      const scale = 1 + Math.sin(time * 0.5) * 0.05;
      groupRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Edges */}
      <lineSegments geometry={edgesGeometry}>
        <primitive object={edgeMaterial} attach="material" />
      </lineSegments>
      
      {/* Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodeCount}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.15}
          color="#00d4ff"
          transparent={true}
          opacity={0.8}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Animated data packets */}
      <DataPackets nodes={nodes} edges={edges} />
    </group>
  );
}

interface DataPacketsProps {
  nodes: THREE.Vector3[];
  edges: [number, number][];
}

function DataPackets({ nodes, edges }: DataPacketsProps) {
  const packetsRef = useRef<THREE.Points>(null);
  const packetCount = 20;
  
  const { positions, alphas } = useMemo(() => {
    const positions = new Float32Array(packetCount * 3);
    const alphas = new Float32Array(packetCount);
    const edgeIndices = edges.map((_, i) => i);
    
    for (let i = 0; i < packetCount; i++) {
      // Random starting edge
      const edgeIndex = edgeIndices[Math.floor(Math.random() * edgeIndices.length)];
      const t = Math.random();
      const [i1, i2] = edges[edgeIndex];
      
      positions[i * 3] = nodes[i1].x + (nodes[i2].x - nodes[i1].x) * t;
      positions[i * 3 + 1] = nodes[i1].y + (nodes[i2].y - nodes[i1].y) * t;
      positions[i * 3 + 2] = nodes[i1].z + (nodes[i2].z - nodes[i1].z) * t;
      
      alphas[i] = 1.0;
    }
    
    return { positions, alphas };
  }, [nodes, edges]);
  
  const packetMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#00ff88') },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0 * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float glow = 1.0 - dist * 2.0;
          gl_FragColor = vec4(color, vAlpha * glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    packetMaterial.uniforms.time.value = time;
    
    if (packetsRef.current) {
      const posArray = packetsRef.current.geometry.attributes.position.array as Float32Array;
      
      // Move packets along edges
      for (let i = 0; i < packetCount; i++) {
        const progress = ((time * 0.5 + i * 0.3) % 1);
        const edgeIndex = i % edges.length;
        const [i1, i2] = edges[edgeIndex];
        
        posArray[i * 3] = nodes[i1].x + (nodes[i2].x - nodes[i1].x) * progress;
        posArray[i * 3 + 1] = nodes[i1].y + (nodes[i2].y - nodes[i1].y) * progress;
        posArray[i * 3 + 2] = nodes[i1].z + (nodes[i2].z - nodes[i1].z) * progress;
      }
      
      packetsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={packetsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={packetCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={packetCount}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={packetMaterial} attach="material" />
    </points>
  );
}