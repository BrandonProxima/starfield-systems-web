"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { PhysicsState } from "./ScrollPhysicsController";

interface ScrollData {
  position: number;
  velocity: number;
}

// Sample points from texture to create particle positions
function sampleTextureToParticles(
  texture: THREE.Texture,
  sampleCount: number = 5000
): { positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null {
  try {
    // Create a canvas to read pixel data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }
    
    const img = texture.image as HTMLImageElement;
    if (!img || !img.width || !img.height) {
      console.error('Image not loaded properly');
      return null;
    }
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
  
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  
  // Sample pixels and create particles where alpha > threshold
  const stepX = Math.ceil(canvas.width / Math.sqrt(sampleCount));
  const stepY = Math.ceil(canvas.height / Math.sqrt(sampleCount));
  
  for (let y = 0; y < canvas.height; y += stepY) {
    for (let x = 0; x < canvas.width; x += stepX) {
      const i = (y * canvas.width + x) * 4;
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;
      const a = pixels[i + 3] / 255;
      
      if (a > 0.1) { // Only create particle if pixel is visible
        // Convert pixel position to 3D space
        const px = (x / canvas.width - 0.5) * 8; // Scale to logo width
        const py = -(y / canvas.height - 0.5) * 1.6; // Scale to logo height
        const pz = (Math.random() - 0.5) * 0.2; // Small random depth
        
        positions.push(px, py, pz);
        colors.push(r * 2, g * 2, b * 2); // Boost brightness for additive blending
        sizes.push(0.03 + Math.random() * 0.02); // Varying particle sizes
      }
    }
  }
  
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes)
    };
  } catch (error) {
    console.error('Error sampling texture:', error);
    return null;
  }
}

export default function ParticleLogo({ 
  scrollData = { position: 0, velocity: 0 },
  physicsState
}: { 
  scrollData?: ScrollData;
  physicsState?: PhysicsState | null;
}) {
  const meshRef = useRef<THREE.Points>(null!);
  const { camera, mouse, viewport } = useThree();
  const [hovered, setHovered] = useState(false);
  const particleData = useRef<{ positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const targetOpacity = useRef(0.1);
  
  // Load the logo texture
  const logoTexture = useLoader(TextureLoader, "/starfield-systems-logo.png");
  
  // Convert texture to particles
  useEffect(() => {
    if (logoTexture && logoTexture.image) {
      console.log('Logo texture loaded, creating particles...');
      const data = sampleTextureToParticles(logoTexture, 3000);
      if (data) {
        console.log('Created', data.positions.length / 3, 'particles');
        particleData.current = data;
        originalPositions.current = new Float32Array(data.positions);
      } else {
        console.error('Failed to create particle data');
      }
    }
  }, [logoTexture]);
  
  // Create geometry and material
  const { geometry, material } = useMemo(() => {
    if (!particleData.current) {
      return { geometry: null, material: null };
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.current.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(particleData.current.colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(particleData.current.sizes, 1));
    
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCameraDistance: { value: 15 },
        uOpacity: { value: 0.1 },
        uDissolve: { value: 0 },
        uMouse: { value: new THREE.Vector2() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        
        uniform float uTime;
        uniform float uCameraDistance;
        uniform float uDissolve;
        uniform vec2 uMouse;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Distance-based dissolution
          float distanceEffect = smoothstep(0.0, 10.0, uCameraDistance);
          float dissolveAmount = (1.0 - distanceEffect) * uDissolve;
          
          // Add physics-based movement when close
          if (dissolveAmount > 0.0) {
            // Particle drift based on position
            float driftX = sin(position.y * 10.0 + uTime) * dissolveAmount * 0.5;
            float driftY = cos(position.x * 10.0 + uTime) * dissolveAmount * 0.3;
            float driftZ = sin(position.x * position.y + uTime * 0.5) * dissolveAmount * 2.0;
            
            pos.x += driftX;
            pos.y += driftY;
            pos.z += driftZ;
            
            // Push particles away from camera when very close
            vec3 toCam = cameraPosition - pos;
            float camDist = length(toCam);
            if (camDist < 5.0) {
              vec3 pushDir = normalize(pos - cameraPosition);
              float pushForce = (1.0 - camDist / 5.0) * 2.0;
              pos += pushDir * pushForce;
            }
          }
          
          // Mouse interaction
          float mouseInfluence = 1.0 - distance(vec2(pos.x, pos.y), uMouse * 4.0) / 4.0;
          mouseInfluence = max(0.0, mouseInfluence);
          pos.z += mouseInfluence * 0.2;
          
          // Calculate alpha based on camera distance
          float distToCamera = length(cameraPosition - pos);
          vAlpha = smoothstep(0.5, 3.0, distToCamera);
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + dissolveAmount);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle shape
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft edges
          float alpha = smoothstep(0.5, 0.0, dist);
          
          // Holographic effect - color shift at edges
          vec3 edgeColor = vColor + vec3(0.2, 0.3, 0.5) * (1.0 - alpha);
          
          gl_FragColor = vec4(edgeColor, alpha * uOpacity * vAlpha);
          gl_FragColor.rgb *= gl_FragColor.a;
        }
      `
    });
    
    return { geometry: geo, material: mat };
  }, [particleData.current]);
  
  useFrame((state) => {
    if (!meshRef.current || !material || !originalPositions.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Update uniforms
    material.uniforms.uTime.value = time;
    
    // Calculate camera distance to logo
    const logoWorldPos = new THREE.Vector3(0, 0, 0);
    meshRef.current.localToWorld(logoWorldPos);
    const cameraDistance = camera.position.distanceTo(logoWorldPos);
    material.uniforms.uCameraDistance.value = cameraDistance;
    
    // Dissolve effect based on camera distance
    const dissolveThreshold = 8; // Start dissolving at this distance
    const dissolve = 1 - Math.min(1, Math.max(0, cameraDistance / dissolveThreshold));
    material.uniforms.uDissolve.value = dissolve;
    
    // Update mouse uniform
    material.uniforms.uMouse.value.set(mouse.x, mouse.y);
    
    // Breathing effect - stronger at depth
    const breatheIntensity = 1 + scrollData.position * 0.2;
    const breathe = Math.sin(time * 0.25) * 0.05 * breatheIntensity + 1;
    meshRef.current.scale.set(breathe, breathe, breathe);
    
    // Position based on scroll
    meshRef.current.position.z = Math.sin(time * 0.5) * 0.2 + scrollData.position * 2;
    
    // Opacity based on scroll and distance
    const scrollOpacity = 0.1 + scrollData.position * 0.2;
    const distanceOpacity = Math.min(1, cameraDistance / 10);
    targetOpacity.current = scrollOpacity * distanceOpacity;
    
    if (hovered) {
      targetOpacity.current = Math.min(1, targetOpacity.current + 0.1);
    }
    
    material.uniforms.uOpacity.value += (targetOpacity.current - material.uniforms.uOpacity.value) * 0.05;
    
    // Subtle rotation
    meshRef.current.rotation.y = Math.sin(time * 0.1) * 0.02 + mouse.x * 0.05;
    meshRef.current.rotation.x = Math.cos(time * 0.15) * 0.01 - mouse.y * 0.025;
  });
  
  // Fallback to simple plane if particles not ready
  if (!geometry || !material) {
    return (
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[8, 1.6]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }
  
  return (
    <points 
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}