"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScrollData {
  position: number;
  velocity: number;
}

const TRAIL_PARTICLES = 200; // Subset of particles that leave trails
const TRAIL_LENGTH = 5; // Number of history positions

export default function ParticleTrails({ scrollData = { position: 0, velocity: 0 } }: { scrollData?: ScrollData }) {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const positionHistory = useRef<Float32Array[]>([]);
  const smoothedVelocity = useRef(0);
  
  // Initialize trail geometry
  const { positions, colors } = useMemo(() => {
    // Each trail segment needs 2 vertices (start and end)
    const positions = new Float32Array(TRAIL_PARTICLES * TRAIL_LENGTH * 2 * 3);
    const colors = new Float32Array(TRAIL_PARTICLES * TRAIL_LENGTH * 2 * 3);
    
    // Initialize history buffers
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      positionHistory.current.push(new Float32Array(TRAIL_PARTICLES * 3));
    }
    
    // Initialize colors (white with varying opacity via alpha in shader)
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 1;
      colors[i + 1] = 1;
      colors[i + 2] = 1;
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (!lineRef.current) return;
    
    // Smooth velocity for less jittery trails
    smoothedVelocity.current += (Math.abs(scrollData.velocity) - smoothedVelocity.current) * 0.1;
    
    // Only show trails during movement
    const trailOpacity = Math.min(smoothedVelocity.current * 0.5, 0.1);
    const material = lineRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uOpacity.value = trailOpacity;
    
    // Generate random particle positions based on time (to simulate following main particles)
    const time = state.clock.getElapsedTime();
    const currentPositions = positionHistory.current[0];
    
    for (let i = 0; i < TRAIL_PARTICLES; i++) {
      const i3 = i * 3;
      // Create positions that match the particle field distribution
      const angle = (i / TRAIL_PARTICLES) * Math.PI * 2;
      const radius = 8 + Math.sin(time * 0.5 + i * 0.1) * 2;
      
      currentPositions[i3] = Math.cos(angle) * radius + Math.sin(time * 0.3) * 0.5;
      currentPositions[i3 + 1] = Math.sin(angle) * radius * 0.3 + Math.cos(time * 0.4) * 0.3;
      currentPositions[i3 + 2] = Math.sin(angle * 2) * 3 - scrollData.position * 2;
    }
    
    // Shift history
    const last = positionHistory.current.pop()!;
    positionHistory.current.unshift(last);
    last.set(currentPositions);
    
    // Update line segments
    const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
    let posIndex = 0;
    
    for (let i = 0; i < TRAIL_PARTICLES; i++) {
      const i3 = i * 3;
      
      for (let j = 0; j < TRAIL_LENGTH - 1; j++) {
        const current = positionHistory.current[j];
        const next = positionHistory.current[j + 1];
        
        // Start point
        positions[posIndex++] = current[i3];
        positions[posIndex++] = current[i3 + 1];
        positions[posIndex++] = current[i3 + 2];
        
        // End point
        positions[posIndex++] = next[i3];
        positions[posIndex++] = next[i3 + 1];
        positions[posIndex++] = next[i3 + 2];
      }
    }
    
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          uOpacity: { value: 0 }
        }}
        vertexShader={`
          varying vec3 vColor;
          void main() {
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, uOpacity);
            gl_FragColor.rgb *= gl_FragColor.a;
          }
        `}
      />
    </lineSegments>
  );
}