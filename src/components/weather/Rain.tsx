import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './Rain.module.css';
import { EffectsQuality } from '../../services/config';

type Props = {
  active: boolean;
  count?: number; 
  intensity?: 'moderate' | 'heavy';
  quality?: EffectsQuality;
};

// Shader for GPU-based rain movement
const RainMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 40.0 },
    uWindX: { value: 0.0 },
    uColor: { value: new THREE.Color("#a8d4ff") },
    uOpacity: { value: 0.6 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uWindX;
    
    attribute vec3 aOffset;
    attribute float aSpeedFactor;
    
    varying float vOpacity;

    void main() {
      vec3 pos = position;
      
      // Calculate movement
      // Range is roughly -25 to 25 (50 units total)
      float totalDist = 50.0;
      float moveY = mod(aOffset.y - (uTime * uSpeed * aSpeedFactor), totalDist);
      float y = moveY - 25.0;
      
      // Horizontal drift (Wind)
      float x = aOffset.x + (uWindX * (y + 25.0) / totalDist);
      
      // Wrap X
      x = mod(x + 20.0, 40.0) - 20.0;

      // Apply tilt based on wind
      // Tilt = atan(wind / vertical_speed)
      float tilt = atan(uWindX / uSpeed);
      float cosT = cos(tilt);
      float sinT = sin(tilt);
      
      // Rotation matrix for Z axis
      mat2 rot = mat2(cosT, -sinT, sinT, cosT);
      vec2 rotatedPos = rot * pos.xy;
      
      vec3 finalPos = vec3(rotatedPos.x + x, y, aOffset.z);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
      vOpacity = 1.0;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vOpacity;
    void main() {
      gl_FragColor = vec4(uColor, uOpacity * vOpacity);
    }
  `
};

const RainGPU: React.FC<{ count: number; intensity: 'moderate' | 'heavy' }> = ({ count, intensity }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const windX = intensity === 'heavy' ? 15.0 : 0.0;

  // Generate stable random offsets and speed factors once
  const [offsets, speedFactors] = useMemo(() => {
    const off = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      off[i * 3] = (Math.random() - 0.5) * 40;     // X
      off[i * 3 + 1] = (Math.random() - 0.5) * 50; // Y
      off[i * 3 + 2] = (Math.random() - 0.5) * 5;  // Z
      speed[i] = 0.5 + Math.random() * 0.5;
    }
    return [off, speed];
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Simple plane instead of heavy capsule */}
      <planeGeometry args={[0.05, 1.5]}>
        <instancedBufferAttribute attach="attributes-aOffset" args={[offsets, 3]} />
        <instancedBufferAttribute attach="attributes-aSpeedFactor" args={[speedFactors, 1]} />
      </planeGeometry>
      <shaderMaterial
        ref={materialRef}
        args={[RainMaterial]}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
};

export const Rain: React.FC<Props> = ({ active, count = 100, intensity = 'moderate' }) => {
  if (!active) return null;

  return (
    <div className={`${styles.container} ${styles.active}`}>
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }} gl={{ alpha: true, antialias: false }}>
        <RainGPU count={count} intensity={intensity} />
      </Canvas>
    </div>
  );
};
