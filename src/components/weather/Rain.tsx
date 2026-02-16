import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import styles from './Rain.module.css';
import type { EffectsQuality } from '../../services/config';

type Props = {
  active: boolean;
  count?: number; 
  intensity?: 'moderate' | 'heavy';
  quality?: EffectsQuality;
};

// Performance tier configurations
const QUALITY_CONFIG = {
  1: { // CSS only - no 3D
    rainCount: 0,
    windowDrops: 0,
    useEnvMap: false,
    material: 'basic',
    dpr: 1,
    geometryDetail: { cap: 2, radial: 4, sphere: 6 }
  },
  2: { // Low
    rainCount: 30,
    windowDrops: 8,
    useEnvMap: false,
    material: 'basic',
    dpr: 1,
    geometryDetail: { cap: 2, radial: 4, sphere: 6 }
  },
  3: { // Medium
    rainCount: 50,
    windowDrops: 12,
    useEnvMap: false,
    material: 'standard',
    dpr: 1,
    geometryDetail: { cap: 3, radial: 6, sphere: 8 }
  },
  4: { // High
    rainCount: 80,
    windowDrops: 20,
    useEnvMap: false,
    material: 'physical',
    dpr: 1,
    geometryDetail: { cap: 4, radial: 8, sphere: 10 }
  },
  5: { // Ultra
    rainCount: 100,
    windowDrops: 20,
    useEnvMap: true,
    material: 'physical',
    dpr: [1, 2] as [number, number],
    geometryDetail: { cap: 4, radial: 8, sphere: 12 }
  }
} as const;

/**
 * 3D Rain Scene using InstancedMesh for performance
 */
const RainScene: React.FC<{ 
  count: number; 
  intensity: 'moderate' | 'heavy';
  materialType: 'basic' | 'standard' | 'physical';
  geometryDetail: { cap: number; radial: number };
}> = ({ count, intensity, materialType, geometryDetail }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Base constants
  const BASE_SPEED = 40;
  
  // Wind/Tilt configuration based on intensity
  // Increase wind speed to match a visible tilt
  const windX = intensity === 'heavy' ? 15 : 0; 
  
  // Calculate correct physical tilt angle: tan(theta) = horizontal_v / vertical_v
  // windX is positive (right). 
  // We need positive rotation (Counter-Clockwise) to create '\' shape.
  const tiltAngle = Math.atan(windX / BASE_SPEED);
  
  // Create temp object for matrix calculations to avoid GC
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize random positions and speeds
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => {
      // Area roughly covering slightly more than viewport
      // Coordinate system: 0,0 is center. Viewport width/height depends on camera Z.
      // At Z=0 with Camera Z=20, FOV=60, width is roughly 23 units.
      
      const x = (Math.random() - 0.5) * 40; // Spread X
      const y = (Math.random() - 0.5) * 40; // Spread Y
      const z = (Math.random() - 0.5) * 5;  // Shallow depth
      
      const speed = 0.5 + Math.random() * 0.5; // Random fall speed factor
      
      return {
        initialPosition: new THREE.Vector3(x, y, z),
        position: new THREE.Vector3(x, y, z),
        speed: speed,
        rotation: new THREE.Euler(0, 0, (Math.random() - 0.5) * 0.1) // Slight wobble
      };
    });
  }, [count]);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    // Boundary for resetting rain (vertical limits)
    const limitY = -25;
    const startY = 25; 
    const limitX = -25; 
    const startX = 25;

    particles.forEach((particle, i) => {
      // Accelerate vertical movement
      particle.position.y -= particle.speed * BASE_SPEED * delta;
      
      // Apply wind (horizontal movement)
      if (windX !== 0) {
        particle.position.x += windX * particle.speed * delta;
      }

      // Reset if below limit
      if (particle.position.y < limitY) {
        particle.position.y = startY;
        // Adjust reset X to account for wind drift so they don't all disappear to one side
        particle.position.x = (Math.random() - 0.5) * 40 + (windX !== 0 ? -10 : 0); 
      }
      
      // Also loop X if they go too far (for heavy wind)
      if (particle.position.x < limitX) {
         particle.position.x = startX;
      }

      // Update Matrix
      dummy.position.copy(particle.position);
      
      // Apply Tilt
      // Dynamic rotation: base wobble + static tilt
      dummy.rotation.set(
        particle.rotation.x, 
        particle.rotation.y, 
        particle.rotation.z + tiltAngle
      );
      
      // Scale drops to look long and thin
      dummy.scale.set(0.1, 2.5, 0.1); 
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Capsule Geometry: radius, length, capSegments, radialSegments */}
      <capsuleGeometry args={[0.08, 1, geometryDetail.cap, geometryDetail.radial]} />
      
      {/* Material based on quality setting */}
      {materialType === 'basic' && (
        <meshBasicMaterial
          color="#a8d4ff"
          transparent
          opacity={0.6}
        />
      )}
      {materialType === 'standard' && (
        <meshStandardMaterial
          color="#ffffff"
          emissive="#88ccff"
          emissiveIntensity={0.1}
          transparent
          opacity={0.7}
          roughness={0.3}
          metalness={0.5}
        />
      )}
      {materialType === 'physical' && (
        <meshPhysicalMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={0.2}
          transparent
          opacity={0.9} 
          roughness={0.1}
          metalness={0.9} 
          transmission={0.9} 
          thickness={2.0} 
          ior={1.5} 
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={2.0}
        />
      )}
    </instancedMesh>
  );
};

/**
 * Static/Sliding drops on the "camera lens/window"
 */
const WindowDrops: React.FC<{ 
  count: number; 
  intensity: 'moderate' | 'heavy';
  materialType: 'basic' | 'standard' | 'physical';
  sphereDetail: number;
}> = ({ count, intensity, materialType, sphereDetail }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Z positon: Camera is at 20. Place these at 18 (2 units away). 
  // Viewport @ dist 2: Height = 2 * 2 * tan(30) ~= 2.3. Width ~= 4.
  const Z_POS = 15; // 5 units away from camera
  // Viewport @ dist 5: Height = 5.77. Width ~ 10.
  const BOUND_X = 6;
  const BOUND_Y = 3.5;

  const drops = useMemo(() => {
    return Array.from({ length: count }, () => {
      return {
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * BOUND_X * 2.2, 
          (Math.random() - 0.5) * BOUND_Y * 2.2, 
          Z_POS
        ),
        // Random visual traits
        scale: 0.2 + Math.random() * 0.4, // Size variance
        aspect: 1, // Will stretch when sliding
        
        // Physics state
        velY: 0,
        accel: 0,
        slipThreshold: 0.99 + Math.random() * 0.01, // Chance to start sliding
        sliding: false
      };
    });
  }, [count, intensity]);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    drops.forEach((drop, i) => {
      // Logic:
      // 1. Randomly start sliding
      // 2. If sliding, accelerate down.
      // 3. Reset if off screen.

      if (!drop.sliding) {
         // Tiny chance to start sliding each frame
         if (Math.random() > 0.995) {
             drop.sliding = true;
             drop.accel = 0.5 + Math.random(); // Start slow
         }
      } else {
         // Gravity
         drop.velY += drop.accel * delta;
         drop.pos.y -= drop.velY * delta;
         
         // Stretch while sliding
         drop.aspect = 1 + drop.velY * 0.5;
         
         // Reset
         if (drop.pos.y < -BOUND_Y - 1) {
             drop.pos.y = BOUND_Y + 1;
             drop.pos.x = (Math.random() - 0.5) * BOUND_X * 2;
             drop.sliding = false;
             drop.velY = 0;
             drop.aspect = 1;
         }
      }

      dummy.position.copy(drop.pos);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(drop.scale, drop.scale * drop.aspect, drop.scale * 0.5); // Flatten Z a bit
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Sphere for droplets */}
      <sphereGeometry args={[0.1, sphereDetail, sphereDetail]} />
      {materialType === 'basic' && (
        <meshBasicMaterial
          color="#a8d4ff"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      )}
      {materialType === 'standard' && (
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.5}
          roughness={0.2}
          metalness={0.3}
          depthWrite={false}
        />
      )}
      {materialType === 'physical' && (
        <meshPhysicalMaterial 
          color="#ffffff" 
          transmission={1.0}
          thickness={1.5}
          roughness={0.0}
          ior={1.33}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      )}
    </instancedMesh>
  );
};

/**
 * CSS-only rain fallback for quality=1
 */
const CSSRain: React.FC<{ intensity: 'moderate' | 'heavy' }> = ({ intensity }) => {
  const dropCount = intensity === 'heavy' ? 60 : 40;
  
  return (
    <div className={styles.cssRainContainer}>
      {Array.from({ length: dropCount }, (_, i) => (
        <div
          key={i}
          className={styles.cssRainDrop}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${0.5 + Math.random() * 0.3}s`,
            opacity: 0.3 + Math.random() * 0.4
          }}
        />
      ))}
    </div>
  );
};

export const Rain: React.FC<Props> = ({ active, count, intensity = 'moderate', quality = 3 }) => {
  const config = QUALITY_CONFIG[quality];
  
  // Base counts from config, adjusted for intensity
  const intensityMultiplier = intensity === 'heavy' ? 2 : 1;
  const effectiveCount = count || (config.rainCount * intensityMultiplier);
  const windowDropsCount = config.windowDrops * intensityMultiplier;

  // Don't render Canvas when not active to save GPU/CPU resources
  if (!active) {
    return null;
  }

  // Quality 1: CSS-only fallback
  if (quality === 1) {
    return (
      <div 
        className={`${styles.container} ${styles.active}`}
        aria-hidden="true"
      >
        <CSSRain intensity={intensity} />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.container} ${styles.active}`}
      aria-hidden="true"
    >
      {/* R3F Canvas */}
      <Canvas 
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ alpha: true, antialias: quality >= 4 }}
        dpr={config.dpr}
        style={{ pointerEvents: 'none', background: 'transparent' }}
        frameloop={quality <= 2 ? 'demand' : 'always'}
      >
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 5]} intensity={5} color="#ffffff" />
        
        {/* Environment map only for Ultra quality */}
        {config.useEnvMap && <Environment preset="city" />}

        <RainScene 
          count={effectiveCount} 
          intensity={intensity}
          materialType={config.material}
          geometryDetail={config.geometryDetail}
        />
        {windowDropsCount > 0 && (
          <WindowDrops 
            count={windowDropsCount} 
            intensity={intensity}
            materialType={config.material}
            sphereDetail={config.geometryDetail.sphere}
          />
        )}
      </Canvas>
    </div>
  );
};
