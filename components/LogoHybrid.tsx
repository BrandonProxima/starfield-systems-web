"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { CameraState } from "./SmoothCameraController";

interface ScrollData {
  position: number;
  velocity: number;
}

export default function LogoHybrid({ 
  scrollData = { position: 0, velocity: 0 },
  cameraState
}: { 
  scrollData?: ScrollData;
  cameraState?: CameraState | null;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  
  // Load the logo texture
  const logoTexture = useLoader(TextureLoader, "/starfield-systems-logo.png");
  
  // Extract image data for particle generation
  useEffect(() => {
    if (logoTexture && logoTexture.image) {
      const img = logoTexture.image as HTMLImageElement;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx && img.complete) {
        // Use full resolution for maximum particles
        const scale = 1.0; // Full resolution
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setImageData(data);
      }
    }
  }, [logoTexture]);
  
  // Create particle geometry from image data
  const { particleGeometry, particleMaterial } = useMemo(() => {
    if (!imageData) return { particleGeometry: null, particleMaterial: null };
    
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const randoms: number[] = [];
    const originalIndices: number[] = [];
    
    const { width, height, data } = imageData;
    // Logo is 1500x500, aspect ratio 3:1
    const logoWidth = 9;  // Slightly wider for proper aspect
    const logoHeight = 3;  // Fixed 3:1 aspect ratio
    
    // Sample every pixel for denser particles
    const step = 1; // Reduced from 2 for more particles
    let index = 0;
    
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const a = data[i + 3] / 255;
        
        // Only create particle for visible pixels
        if (a > 0.01) { // Very low threshold for all visible pixels
          // Position in 3D space - no jitter for perfect alignment
          const px = ((x / width) - 0.5) * logoWidth;
          const py = (0.5 - (y / height)) * logoHeight;
          const pz = 0; // Keep all particles on same plane initially
          
          positions.push(px, py, pz);
          
          // Use exact colors from the image without modification
          // No brightness boost or glow addition to preserve brand identity
          colors.push(
            r,  // Exact red value from logo
            g,  // Exact green value from logo  
            b   // Exact blue value from logo
          );
          
          // Uniform small size for solid appearance
          sizes.push(0.008 + a * 0.002); // Smaller, more uniform
          
          // Random values for animation
          randoms.push(
            Math.random(),
            Math.random(),
            Math.random(),
            Math.random() // Extra random for variety
          );
          
          // Store original index for ordered dissolution
          originalIndices.push(index++);
        }
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('random', new THREE.Float32BufferAttribute(randoms, 4));
    geometry.setAttribute('originalIndex', new THREE.Float32BufferAttribute(originalIndices, 1));
    
    // Store original positions for reset
    geometry.setAttribute('originalPosition', new THREE.Float32BufferAttribute([...positions], 3));
    
    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.NormalBlending,  // Normal blending to preserve exact colors
      depthWrite: false,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uDissolve: { value: 0 },
        uMeshOpacity: { value: 1 },
        uPointsOpacity: { value: 0 },
        uCameraDistance: { value: 15 }
      },
      vertexShader: `
        attribute float size;
        attribute vec4 random;
        attribute float originalIndex;
        attribute vec3 originalPosition;
        
        uniform float uTime;
        uniform float uDissolve;
        uniform float uCameraDistance;
        
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDistance;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Only animate if dissolving
          if (uDissolve > 0.01) {
            // Wave-like dissolution from edges
            float edgeDistance = length(originalPosition.xy);
            float dissolveTiming = smoothstep(0.0, 1.0, uDissolve - edgeDistance * 0.1);
            
            // Swirling motion
            float swirl = uTime * (0.5 + random.x) + originalIndex * 0.01;
            vec3 offset = vec3(
              sin(swirl) * (1.0 + random.y),
              cos(swirl * 0.7) * (1.0 + random.z),
              sin(swirl * 1.3) * (2.0 + random.w)
            );
            
            // Apply dissolution
            pos = mix(originalPosition, originalPosition + offset * 2.0, dissolveTiming);
            
            // Extra push when very close
            if (uCameraDistance < 3.0) {
              vec3 fromCamera = normalize(pos - cameraPosition);
              pos += fromCamera * (1.0 - uCameraDistance / 3.0) * dissolveTiming;
            }
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Store distance for fragment shader
          vDistance = -mvPosition.z;
          
          // LOD-based particle sizing - stable and consistent
          float viewDistance = length(cameraPosition - pos);
          
          // Use discrete LOD levels to prevent fluctuation
          float lodLevel = 1.0;
          if (viewDistance < 5.0) lodLevel = 0.4;       // Very close - small particles
          else if (viewDistance < 10.0) lodLevel = 0.7; // Close - medium particles  
          else if (viewDistance < 20.0) lodLevel = 1.0; // Normal - full size
          else lodLevel = 1.4;                          // Far - larger particles
          
          // Fixed base size with LOD multiplier only
          float finalSize = size * 280.0 * lodLevel;
          
          // Only add dissolution boost, no distance-based scaling
          if (uDissolve > 0.01) {
            finalSize *= (1.0 + uDissolve * 0.2);
          }
          
          gl_PointSize = finalSize;
          
          gl_Position = projectionMatrix * mvPosition;
          
          // Alpha based on distance - reduce bloom both close and far
          float closeBloomReduction = smoothstep(3.0, 8.0, vDistance);
          float farBloomReduction = 1.0 - smoothstep(15.0, 25.0, vDistance) * 0.4;
          vAlpha = closeBloomReduction * farBloomReduction;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vDistance;
        uniform float uPointsOpacity;
        
        void main() {
          // Circular particle
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Simple, stable alpha calculation
          float alpha = smoothstep(0.5, 0.2, dist);
          
          // Soft falloff for smooth blending
          alpha = alpha * alpha * (3.0 - 2.0 * alpha); // Smootherstep
          alpha *= 0.8; // Base alpha
          
          // Use exact colors without any modification
          // No brightness adjustment or glow to preserve brand colors exactly
          vec3 finalColor = vColor;
          
          gl_FragColor = vec4(finalColor, alpha * vAlpha * uPointsOpacity);
        }
      `
    });
    
    return { particleGeometry: geometry, particleMaterial: material };
  }, [imageData]);
  
  const lastUpdateTime = useRef(0);
  
  useFrame((state) => {
    if (!meshRef.current || !pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Only update every 16ms (60fps max) to prevent plaid artifacts
    if (time - lastUpdateTime.current < 0.016) return;
    lastUpdateTime.current = time;
    
    // Calculate distance to logo
    const distance = camera.position.distanceTo(meshRef.current.position);
    
    // Dissolution only when very close
    const dissolveFactor = THREE.MathUtils.clamp(
      (8 - distance) / 4,  // Start at 8, full at 4
      0,
      1
    );
    
    // Quantized time to reduce micro-movements
    const quantizedTime = Math.floor(time * 30) / 30; // 30fps time updates
    
    // Update particle uniforms with frame-rate limited updates
    if (particleMaterial) {
      particleMaterial.uniforms.uTime.value = quantizedTime;
      particleMaterial.uniforms.uDissolve.value = dissolveFactor;
      particleMaterial.uniforms.uCameraDistance.value = distance;
      
      // Completely static opacity
      particleMaterial.uniforms.uPointsOpacity.value = 0.85;
    }
    
    // Hide mesh - we're only using particles now
    meshRef.current.visible = false;
    
    // Reduced animation frequency
    const breathe = 1 + Math.sin(quantizedTime * 0.25) * 0.02; // Smaller movement
    meshRef.current.scale.setScalar(breathe);
    pointsRef.current.scale.setScalar(breathe);
    
    // Less frequent position updates
    const zPos = Math.sin(quantizedTime * 0.5) * 0.05; // Remove scroll-based movement
    meshRef.current.position.z = zPos;
    pointsRef.current.position.z = zPos;
  });
  
  return (
    <>
      {/* Regular mesh logo - visible at distance */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[8, 1.6]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          opacity={0.85}  // Higher opacity to show true colors
          blending={THREE.NormalBlending}  // Normal blending preserves colors
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}  // Prevent tone mapping from altering colors
        />
      </mesh>
      
      {/* Particle version - visible when close */}
      {particleGeometry && particleMaterial && (
        <points 
          ref={pointsRef}
          geometry={particleGeometry}
          material={particleMaterial}
          position={[0, 0, 0]}
        />
      )}
    </>
  );
}