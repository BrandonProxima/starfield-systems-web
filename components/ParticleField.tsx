"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 8000;

export default function ParticleField() {
  const points = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Create a grid-like distribution with some randomness
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Blue gradient colors
      const intensity = Math.random();
      if (intensity > 0.8) {
        // Bright blue accent
        colors[i3] = 0.05;
        colors[i3 + 1] = 0.65;
        colors[i3 + 2] = 0.91;
      } else if (intensity > 0.6) {
        // Medium blue
        colors[i3] = 0.22;
        colors[i3 + 1] = 0.74;
        colors[i3 + 2] = 0.97;
      } else {
        // Subtle blue-white
        colors[i3] = 0.49;
        colors[i3 + 1] = 0.83;
        colors[i3 + 2] = 0.99;
      }
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (!points.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    
    // Wave animation
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const z = positions[i3 + 2];
      
      // Create wave pattern
      const waveX = Math.sin(x * 0.1 + time * 0.5) * 0.3;
      const waveZ = Math.cos(z * 0.1 + time * 0.3) * 0.2;
      
      // Breathing effect
      const breathe = Math.sin(time * 0.25) * 0.1 + 1;
      
      // Update Y position with wave and breathing
      positions[i3 + 1] += (waveX + waveZ) * 0.01 * breathe;
      
      // Mouse interaction - particles move away from cursor
      const mouseX = mouse.x * viewport.width * 0.5;
      const mouseY = mouse.y * viewport.height * 0.5;
      const dist = Math.sqrt(
        Math.pow(positions[i3] - mouseX, 2) +
        Math.pow(positions[i3 + 1] - mouseY, 2)
      );
      
      if (dist < 3) {
        const force = (3 - dist) * 0.01;
        positions[i3] += (positions[i3] - mouseX) * force;
        positions[i3 + 1] += (positions[i3 + 1] - mouseY) * force;
      }
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
    
    // Rotate the entire field slowly
    points.current.rotation.y = time * 0.05;
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particlesPosition.positions}
          itemSize={3}
          args={[particlesPosition.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={particlesPosition.colors}
          itemSize={3}
          args={[particlesPosition.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}