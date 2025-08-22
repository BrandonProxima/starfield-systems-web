"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PhysicsState } from "./ScrollPhysicsController";

interface ScrollData {
  position: number;
  velocity: number;
}

// Create particles that form text-like shapes
function createLogoParticles(width: number = 8, height: number = 1.6, depth: number = 0.8) {
  const particles: { position: THREE.Vector3; scale: number; randomOffset: THREE.Vector3 }[] = [];
  
  // Create two lines of text particles
  const createTextLine = (yOffset: number, text: string) => {
    const charWidth = width / text.length;
    const particlesPerChar = 15;
    
    for (let charIndex = 0; charIndex < text.length; charIndex++) {
      const char = text[charIndex];
      const charX = (charIndex - text.length / 2 + 0.5) * charWidth;
      
      // Skip spaces
      if (char === ' ') continue;
      
      // Create particles for each character
      for (let i = 0; i < particlesPerChar; i++) {
        // Create particles along character strokes
        const angle = (i / particlesPerChar) * Math.PI * 2;
        const radius = charWidth * 0.3;
        
        // Main body of character
        for (let d = 0; d < 3; d++) {
          particles.push({
            position: new THREE.Vector3(
              charX + Math.cos(angle) * radius * (0.5 + d * 0.3),
              yOffset + Math.sin(angle) * height * 0.2,
              (d - 1) * depth * 0.3
            ),
            scale: 0.02 + Math.random() * 0.015,
            randomOffset: new THREE.Vector3(
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2,
              (Math.random() - 0.5) * 0.2
            )
          });
        }
        
        // Vertical strokes for certain letters
        if ('ITEFHKLMNR'.includes(char)) {
          for (let y = -0.3; y <= 0.3; y += 0.1) {
            particles.push({
              position: new THREE.Vector3(
                charX + (Math.random() - 0.5) * charWidth * 0.2,
                yOffset + y * height * 0.5,
                (Math.random() - 0.5) * depth * 0.5
              ),
              scale: 0.02 + Math.random() * 0.01,
              randomOffset: new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15,
                (Math.random() - 0.5) * 0.15
              )
            });
          }
        }
      }
    }
  };
  
  // Create "STARFIELD" on top line
  createTextLine(height * 0.2, 'STARFIELD');
  // Create "SYSTEMS" on bottom line
  createTextLine(-height * 0.2, 'SYSTEMS');
  
  // Add some extra floating particles around the logo for depth
  for (let i = 0; i < 50; i++) {
    particles.push({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * width * 1.2,
        (Math.random() - 0.5) * height * 1.2,
        (Math.random() - 0.5) * depth * 2
      ),
      scale: 0.01 + Math.random() * 0.01,
      randomOffset: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      )
    });
  }
  
  return particles;
}

export default function LogoParticles({ 
  scrollData = { position: 0, velocity: 0 },
  physicsState
}: { 
  scrollData?: ScrollData;
  physicsState?: PhysicsState | null;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const { camera } = useThree();
  
  // Create particles
  const particles = useMemo(() => createLogoParticles(), []);
  const particleCount = particles.length;
  
  // Initialize instance matrices
  useEffect(() => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    particles.forEach((particle, i) => {
      position.copy(particle.position);
      scale.setScalar(particle.scale);
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particles]);
  
  // Create geometry and material
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0); // Low-poly sphere for performance
    
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(3, 3, 3), // Extra bright for bloom effect
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      fog: false, // Don't be affected by fog
    });
    
    return { geometry: geo, material: mat };
  }, []);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Calculate camera distance to logo center
    const logoWorldPos = new THREE.Vector3(0, 0, scrollData.position * 2);
    const cameraDistance = camera.position.distanceTo(logoWorldPos);
    
    // Update each instance
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    // Dissolution parameters
    const dissolveStart = 10;
    const dissolveEnd = 3;
    const dissolveFactor = 1 - THREE.MathUtils.clamp(
      (cameraDistance - dissolveEnd) / (dissolveStart - dissolveEnd),
      0,
      1
    );
    
    particles.forEach((particle, i) => {
      // Base position
      position.copy(particle.position);
      
      // Add time-based floating
      const floatSpeed = 0.5;
      const floatAmount = 0.05;
      position.y += Math.sin(time * floatSpeed + i * 0.1) * floatAmount;
      
      // Dissolution effect - particles drift apart when close
      if (dissolveFactor > 0) {
        const drift = particle.randomOffset.clone();
        
        // Add swirling motion
        const swirl = time * 0.3 + i * 0.01;
        drift.x += Math.sin(swirl) * dissolveFactor * 2;
        drift.y += Math.cos(swirl * 0.7) * dissolveFactor * 1.5;
        drift.z += Math.sin(swirl * 1.3) * dissolveFactor * 3;
        
        position.add(drift.multiplyScalar(dissolveFactor));
        
        // Push particles away from camera when very close
        if (cameraDistance < 5) {
          const toCam = position.clone().sub(camera.position);
          const pushForce = (1 - cameraDistance / 5) * 2;
          const pushDir = toCam.normalize().multiplyScalar(pushForce);
          position.add(pushDir);
        }
      }
      
      // Scale based on distance and dissolution
      const baseScale = particle.scale;
      const distanceScale = THREE.MathUtils.clamp(cameraDistance / 20, 0.5, 1);
      const dissolveScale = 1 + dissolveFactor * 0.5;
      scale.setScalar(baseScale * distanceScale * dissolveScale);
      
      // Random rotation for sparkle effect
      rotation.setFromEuler(new THREE.Euler(
        time * 0.1 + i * 0.01,
        time * 0.15 + i * 0.02,
        time * 0.12 + i * 0.015
      ));
      
      // Apply transformation
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Update material opacity based on distance
    const baseOpacity = 0.3; // Higher base opacity
    const scrollBoost = scrollData.position * 0.3;
    const distanceOpacity = THREE.MathUtils.clamp(cameraDistance / 20, 0.5, 1);
    const dissolveFade = 1 - dissolveFactor * 0.7;
    material.opacity = Math.min(1, (baseOpacity + scrollBoost) * distanceOpacity * dissolveFade);
    
    // Overall logo movement - keep it at origin with slight movement
    meshRef.current.position.set(
      0,
      0,
      Math.sin(time * 0.5) * 0.2 // Gentle floating in Z
    );
    
    // Breathing effect
    const breathe = Math.sin(time * 0.25) * 0.05 + 1;
    meshRef.current.scale.setScalar(breathe);
  });
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, particleCount]}
      position={[0, 0, 0]}
    />
  );
}