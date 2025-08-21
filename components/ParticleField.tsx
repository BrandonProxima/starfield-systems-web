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
      
      // Whitish colors with warm amber particles
      const depth = z / 15 + 0.5; // Normalize depth
      const intensity = Math.random();
      
      if (intensity > 0.90) {
        // Warm amber particles (10%) - like hot dust, brighter
        colors[i3] = Math.min(1.0, 1.0 * 1.2);   // 20% brighter amber
        colors[i3 + 1] = Math.min(1.0, 0.75 * 1.2);
        colors[i3 + 2] = Math.min(1.0, 0.05 * 1.2);
      } else if (intensity > 0.80) {
        // Warm-white transition (10%)
        colors[i3] = Math.min(1.0, 1.0 * 1.2);
        colors[i3 + 1] = Math.min(1.0, 0.90 * 1.2);
        colors[i3 + 2] = Math.min(1.0, 0.75 * 1.2);
      } else if (intensity > 0.77) {
        // Slight cool tint for contrast (3%)
        colors[i3] = Math.min(1.0, 0.85 * 1.2);
        colors[i3 + 1] = Math.min(1.0, 0.88 * 1.2);
        colors[i3 + 2] = Math.min(1.0, 0.92 * 1.2);
      } else {
        // Pure white to off-white (majority ~77%)
        const brightness = (0.7 + Math.random() * 0.2) * 1.2; // 20% brighter
        colors[i3] = Math.min(1.0, brightness);
        colors[i3 + 1] = Math.min(1.0, brightness);
        colors[i3 + 2] = Math.min(1.0, brightness);
      }
      
      // Size variation based on depth - warm particles slightly larger
      if (intensity > 0.90) {
        // Amber particles are slightly larger, like they're energized
        sizes[i] = (Math.random() * 0.4 + 0.3) * (1 - depth * 0.3);
      } else {
        sizes[i] = (Math.random() * 0.3 + 0.2) * (1 - depth * 0.3);
      }
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
    
    // Update camera position uniform for distance calculations
    const material = points.current.material as THREE.ShaderMaterial;
    material.uniforms.uCameraPos.value.copy(state.camera.position);
    
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
      
      // Mouse interaction - particles move away from cursor (more subtle)
      const mouseX = mouse.x * viewport.width * 0.5;
      const mouseY = mouse.y * viewport.height * 0.5;
      const dist = Math.sqrt(
        Math.pow(positions[i3] - mouseX, 2) +
        Math.pow(positions[i3 + 1] - mouseY, 2)
      );
      
      if (dist < 2) {
        const force = (2 - dist) * 0.004;
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
          pointTexture: { value: particleTexture },
          uCameraPos: { value: new THREE.Vector3() }
        }}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          varying float vDistance;
          uniform vec3 uCameraPos;
          void main() {
            vColor = color;
            vDistance = distance(position, uCameraPos);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform sampler2D pointTexture;
          varying vec3 vColor;
          varying float vDistance;
          void main() {
            vec2 uv = gl_PointCoord;
            vec4 textureColor = texture2D(pointTexture, uv);
            
            // Base particle color
            vec4 baseColor = vec4(vColor, 0.7) * textureColor;
            
            // Slate halo for distant particles - #64748B = rgb(100, 116, 139)
            vec3 slateColor = vec3(0.392, 0.455, 0.545);
            
            // Distance-based slate halo (peaks around distance 20-30)
            float haloStrength = smoothstep(15.0, 30.0, vDistance) * smoothstep(40.0, 25.0, vDistance);
            haloStrength *= 0.3; // Subtle effect
            
            // Create halo effect - larger, softer glow
            float haloDistance = distance(uv, vec2(0.5)) * 2.0;
            float haloAlpha = (1.0 - smoothstep(0.4, 1.2, haloDistance)) * haloStrength;
            
            // Blend slate halo with particle
            vec3 finalColor = mix(baseColor.rgb, slateColor, haloAlpha * 0.5);
            float finalAlpha = max(baseColor.a, haloAlpha * 0.3);
            
            gl_FragColor = vec4(finalColor, finalAlpha);
            gl_FragColor.rgb *= gl_FragColor.a;
          }
        `}
      />
    </points>
  );
}