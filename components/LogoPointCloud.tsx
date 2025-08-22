"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PhysicsState } from "./ScrollPhysicsController";

interface ScrollData {
  position: number;
  velocity: number;
}

// Define the text shapes using point coordinates
const TEXT_DATA = {
  STARFIELD: [
    // S
    ...Array.from({ length: 8 }, (_, i) => ({ x: -3.8, y: 0.3 - i * 0.08, char: 'S' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -3.8 + i * 0.08, y: 0.3, char: 'S' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -3.8 + i * 0.08, y: 0, char: 'S' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -3.4, y: 0 - i * 0.08, char: 'S' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -3.4 - i * 0.08, y: -0.3, char: 'S' })),
    
    // T
    ...Array.from({ length: 7 }, (_, i) => ({ x: -3.0 + i * 0.08, y: 0.3, char: 'T' })),
    ...Array.from({ length: 8 }, (_, i) => ({ x: -2.65, y: 0.3 - i * 0.08, char: 'T' })),
    
    // A
    ...Array.from({ length: 8 }, (_, i) => ({ x: -2.0, y: 0.3 - i * 0.08, char: 'A' })),
    ...Array.from({ length: 8 }, (_, i) => ({ x: -1.6, y: 0.3 - i * 0.08, char: 'A' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.0 + i * 0.08, y: 0.3, char: 'A' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.0 + i * 0.08, y: 0, char: 'A' })),
    
    // R
    ...Array.from({ length: 8 }, (_, i) => ({ x: -1.0, y: 0.3 - i * 0.08, char: 'R' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -1.0 + i * 0.08, y: 0.3, char: 'R' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -1.0 + i * 0.08, y: 0, char: 'R' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -0.7, y: 0.3 - i * 0.08, char: 'R' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -0.85 + i * 0.05, y: -0.05 - i * 0.06, char: 'R' })),
    
    // F
    ...Array.from({ length: 8 }, (_, i) => ({ x: -0.2, y: 0.3 - i * 0.08, char: 'F' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -0.2 + i * 0.08, y: 0.3, char: 'F' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -0.2 + i * 0.08, y: 0, char: 'F' })),
    
    // I
    ...Array.from({ length: 8 }, (_, i) => ({ x: 0.5, y: 0.3 - i * 0.08, char: 'I' })),
    
    // E
    ...Array.from({ length: 8 }, (_, i) => ({ x: 0.9, y: 0.3 - i * 0.08, char: 'E' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 0.9 + i * 0.08, y: 0.3, char: 'E' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: 0.9 + i * 0.08, y: 0, char: 'E' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 0.9 + i * 0.08, y: -0.3, char: 'E' })),
    
    // L
    ...Array.from({ length: 8 }, (_, i) => ({ x: 1.6, y: 0.3 - i * 0.08, char: 'L' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 1.6 + i * 0.08, y: -0.3, char: 'L' })),
    
    // D
    ...Array.from({ length: 8 }, (_, i) => ({ x: 2.3, y: 0.3 - i * 0.08, char: 'D' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: 2.3 + i * 0.08, y: 0.3, char: 'D' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: 2.3 + i * 0.08, y: -0.3, char: 'D' })),
    ...Array.from({ length: 6 }, (_, i) => ({ x: 2.6, y: 0.2 - i * 0.08, char: 'D' })),
  ],
  SYSTEMS: [
    // S
    ...Array.from({ length: 8 }, (_, i) => ({ x: -2.8, y: -0.9 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.8 + i * 0.08, y: -0.9, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.8 + i * 0.08, y: -1.2, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.4, y: -1.2 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -2.4 - i * 0.08, y: -1.5, char: 's' })),
    
    // Y
    ...Array.from({ length: 4 }, (_, i) => ({ x: -2.0, y: -0.9 - i * 0.08, char: 'Y' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -1.6, y: -0.9 - i * 0.08, char: 'Y' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: -1.8, y: -1.2 - i * 0.08, char: 'Y' })),
    
    // S
    ...Array.from({ length: 8 }, (_, i) => ({ x: -1.0, y: -0.9 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -1.0 + i * 0.08, y: -0.9, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -1.0 + i * 0.08, y: -1.2, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -0.6, y: -1.2 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: -0.6 - i * 0.08, y: -1.5, char: 's' })),
    
    // T
    ...Array.from({ length: 7 }, (_, i) => ({ x: -0.2 + i * 0.08, y: -0.9, char: 'T' })),
    ...Array.from({ length: 8 }, (_, i) => ({ x: 0.15, y: -0.9 - i * 0.08, char: 'T' })),
    
    // E
    ...Array.from({ length: 8 }, (_, i) => ({ x: 0.7, y: -0.9 - i * 0.08, char: 'E' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 0.7 + i * 0.08, y: -0.9, char: 'E' })),
    ...Array.from({ length: 4 }, (_, i) => ({ x: 0.7 + i * 0.08, y: -1.2, char: 'E' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 0.7 + i * 0.08, y: -1.5, char: 'E' })),
    
    // M
    ...Array.from({ length: 8 }, (_, i) => ({ x: 1.4, y: -0.9 - i * 0.08, char: 'M' })),
    ...Array.from({ length: 8 }, (_, i) => ({ x: 1.8, y: -0.9 - i * 0.08, char: 'M' })),
    ...Array.from({ length: 3 }, (_, i) => ({ x: 1.4 + i * 0.13, y: -0.9 - i * 0.08, char: 'M' })),
    ...Array.from({ length: 3 }, (_, i) => ({ x: 1.8 - i * 0.13, y: -0.9 - i * 0.08, char: 'M' })),
    
    // S
    ...Array.from({ length: 8 }, (_, i) => ({ x: 2.3, y: -0.9 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 2.3 + i * 0.08, y: -0.9, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 2.3 + i * 0.08, y: -1.2, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 2.7, y: -1.2 - i * 0.08, char: 's' })),
    ...Array.from({ length: 5 }, (_, i) => ({ x: 2.7 - i * 0.08, y: -1.5, char: 's' })),
  ]
};

export default function LogoPointCloud({ 
  scrollData = { position: 0, velocity: 0 },
  physicsState
}: { 
  scrollData?: ScrollData;
  physicsState?: PhysicsState | null;
}) {
  const meshRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();
  
  // Create particle data from text
  const { geometry, material, particleCount, originalPositions } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const randoms: number[] = [];
    
    // Combine both text lines
    const allPoints = [...TEXT_DATA.STARFIELD, ...TEXT_DATA.SYSTEMS];
    
    // Add multiple particles per text point for density
    const particlesPerPoint = 3;
    
    allPoints.forEach(point => {
      for (let i = 0; i < particlesPerPoint; i++) {
        // Add slight randomness to position
        const jitter = 0.02;
        positions.push(
          point.x + (Math.random() - 0.5) * jitter,
          point.y + (Math.random() - 0.5) * jitter,
          (Math.random() - 0.5) * 0.1
        );
        
        // Bright white/blue color
        colors.push(
          2.5 + Math.random() * 0.5,  // R
          2.5 + Math.random() * 0.5,  // G
          3.0 + Math.random() * 0.5   // B - slightly more blue
        );
        
        // Varying sizes
        sizes.push(0.015 + Math.random() * 0.01);
        
        // Random values for animation
        randoms.push(Math.random(), Math.random(), Math.random());
      }
    });
    
    // Add some floating particles around for atmosphere
    const atmosphereCount = 100;
    for (let i = 0; i < atmosphereCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2
      );
      colors.push(
        1.0 + Math.random() * 0.5,
        1.0 + Math.random() * 0.5,
        1.5 + Math.random() * 0.5
      );
      sizes.push(0.005 + Math.random() * 0.005);
      randoms.push(Math.random(), Math.random(), Math.random());
    }
    
    const count = positions.length / 3;
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 3));
    
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uDissolve: { value: 0 },
        uCameraPos: { value: new THREE.Vector3() },
        uOpacity: { value: 0.3 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 random;
        varying vec3 vColor;
        varying float vAlpha;
        
        uniform float uTime;
        uniform float uDissolve;
        uniform vec3 uCameraPos;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Gentle floating animation
          pos.y += sin(uTime * 0.5 + random.x * 6.28) * 0.02;
          pos.x += cos(uTime * 0.3 + random.y * 6.28) * 0.01;
          
          // Dissolution effect when camera gets close
          if (uDissolve > 0.0) {
            // Swirling dissolution
            float swirl = uTime * 0.5 + random.x * 6.28;
            vec3 dissolveOffset = vec3(
              sin(swirl) * random.y,
              cos(swirl * 0.7) * random.z,
              sin(swirl * 1.3) * random.x
            ) * uDissolve * 3.0;
            
            pos += dissolveOffset;
            
            // Push away from camera when very close
            vec3 toCam = pos - uCameraPos;
            float camDist = length(toCam);
            if (camDist < 5.0) {
              vec3 pushDir = normalize(toCam);
              pos += pushDir * (1.0 - camDist / 5.0) * 2.0;
            }
          }
          
          // Calculate point size with perspective
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + uDissolve * 2.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Fade based on dissolution
          vAlpha = 1.0 - uDissolve * 0.5;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;
        
        void main() {
          // Circular particle shape
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft edges
          float alpha = smoothstep(0.5, 0.0, dist);
          
          // Glow effect
          vec3 finalColor = vColor * (1.0 + (1.0 - dist) * 0.5);
          
          gl_FragColor = vec4(finalColor, alpha * vAlpha * uOpacity);
        }
      `
    });
    
    return { 
      geometry: geo, 
      material: mat, 
      particleCount: count,
      originalPositions: new Float32Array(positions)
    };
  }, []);
  
  useFrame((state) => {
    if (!meshRef.current || !material) return;
    
    const time = state.clock.getElapsedTime();
    
    // Update uniforms
    material.uniforms.uTime.value = time;
    material.uniforms.uCameraPos.value.copy(camera.position);
    
    // Calculate distance from camera to logo
    const logoPos = meshRef.current.position;
    const distance = camera.position.distanceTo(logoPos);
    
    // Dissolution based on distance
    const dissolveStart = 8;
    const dissolveEnd = 2;
    const dissolveFactor = THREE.MathUtils.clamp(
      1 - (distance - dissolveEnd) / (dissolveStart - dissolveEnd),
      0,
      1
    );
    material.uniforms.uDissolve.value = dissolveFactor;
    
    // Opacity based on scroll and distance
    const baseOpacity = 0.15 + scrollData.position * 0.25;
    const distanceFade = THREE.MathUtils.clamp(distance / 15, 0.5, 1);
    material.uniforms.uOpacity.value = baseOpacity * distanceFade * (1 + dissolveFactor * 0.3);
    
    // Gentle breathing effect
    const breathe = 1 + Math.sin(time * 0.25) * 0.03;
    meshRef.current.scale.setScalar(breathe);
    
    // Subtle Z movement
    meshRef.current.position.z = Math.sin(time * 0.5) * 0.1;
  });
  
  return (
    <points 
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
    />
  );
}