"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 12000;

// Create circular particle texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d')!;
  
  // Create gradient from center
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  
  return new THREE.CanvasTexture(canvas);
}

export default function ParticleField() {
  const points = useRef<THREE.Points>(null!);
  const { mouse, viewport, camera } = useThree();
  
  const { positions, colors, sizes, particleTexture } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // More sophisticated distribution with depth layers
      const radius = Math.random() * 25 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      
      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const z = radius * Math.sin(theta) * Math.cos(phi) * 0.6;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Whitish colors with very subtle variation
      const depth = z / 15 + 0.5; // Normalize depth
      const intensity = Math.random();
      
      if (intensity > 0.95) {
        // Rare slight blue tint
        colors[i3] = 0.85;
        colors[i3 + 1] = 0.85;
        colors[i3 + 2] = 0.9;
      } else if (intensity > 0.9) {
        // Slight warm white
        colors[i3] = 0.9;
        colors[i3 + 1] = 0.88;
        colors[i3 + 2] = 0.85;
      } else {
        // Pure white to off-white
        const brightness = 0.7 + Math.random() * 0.2; // 70-90% brightness
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
      }
      
      // Size variation based on depth
      sizes[i] = (Math.random() * 0.5 + 0.5) * (1 - depth * 0.3);
    }
    
    return { 
      positions, 
      colors, 
      sizes,
      particleTexture: createParticleTexture()
    };
  }, []);
  
  useFrame((state) => {
    if (!points.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const sizes = points.current.geometry.attributes.size.array as Float32Array;
    
    // Wave animation with turbulence
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      // Create wave pattern with turbulence
      const waveX = Math.sin(x * 0.1 + time * 0.5) * 0.3;
      const waveZ = Math.cos(z * 0.1 + time * 0.3) * 0.2;
      const turbulence = Math.sin(y * 0.2 + time * 0.8) * 0.05;
      
      // Breathing effect
      const breathe = Math.sin(time * 0.25) * 0.1 + 1;
      
      // Update Y position with wave, breathing and turbulence
      positions[i3 + 1] += (waveX + waveZ + turbulence) * 0.008 * breathe;
      
      // Mouse interaction - particles move away from cursor
      const mouseX = mouse.x * viewport.width * 0.5;
      const mouseY = mouse.y * viewport.height * 0.5;
      const dist = Math.sqrt(
        Math.pow(positions[i3] - mouseX, 2) +
        Math.pow(positions[i3 + 1] - mouseY, 2)
      );
      
      if (dist < 3) {
        const force = (3 - dist) * 0.008;
        positions[i3] += (positions[i3] - mouseX) * force;
        positions[i3 + 1] += (positions[i3 + 1] - mouseY) * force;
      }
      
      // Dynamic size based on camera distance
      const distToCamera = Math.sqrt(
        Math.pow(positions[i3] - camera.position.x, 2) +
        Math.pow(positions[i3 + 1] - camera.position.y, 2) +
        Math.pow(positions[i3 + 2] - camera.position.z, 2)
      );
      sizes[i] = (1 - distToCamera / 50) * (Math.sin(time + i * 0.1) * 0.1 + 0.9);
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.size.needsUpdate = true;
    
    // Rotate the entire field slowly
    points.current.rotation.y = time * 0.03;
    points.current.rotation.x = Math.sin(time * 0.1) * 0.02;
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          pointTexture: { value: particleTexture }
        }}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform sampler2D pointTexture;
          varying vec3 vColor;
          void main() {
            vec2 uv = gl_PointCoord;
            vec4 textureColor = texture2D(pointTexture, uv);
            gl_FragColor = vec4(vColor, 0.5) * textureColor;
            gl_FragColor.rgb *= gl_FragColor.a;
          }
        `}
      />
    </points>
  );
}