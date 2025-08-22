"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

interface ScrollData {
  position: number;
  velocity: number;
}

export default function LogoMesh({ scrollData = { position: 0, velocity: 0 } }: { scrollData?: ScrollData }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { mouse, viewport } = useThree();
  const [hovered, setHovered] = useState(false);
  
  // Load the logo texture
  const logoTexture = useLoader(TextureLoader, "/starfield-systems-logo.png");
  
  useEffect(() => {
    if (logoTexture) {
      logoTexture.minFilter = THREE.LinearFilter;
      logoTexture.magFilter = THREE.LinearFilter;
      logoTexture.format = THREE.RGBAFormat;
    }
  }, [logoTexture]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Breathing effect - stronger at depth
    const breatheIntensity = 1 + scrollData.position * 0.2;
    const breathe = Math.sin(time * 0.25) * 0.05 * breatheIntensity + 1;
    meshRef.current.scale.set(breathe, breathe, 1);
    
    // Mouse parallax effect - more subtle
    const mouseX = mouse.x * viewport.width * 0.05;
    const mouseY = mouse.y * viewport.height * 0.05;
    
    // Smooth follow mouse with easing - reduced intensity
    meshRef.current.position.x += (mouseX * 0.15 - meshRef.current.position.x) * 0.05;
    meshRef.current.position.y += (mouseY * 0.15 - meshRef.current.position.y) * 0.05;
    
    // Subtle rotation based on mouse position - reduced
    meshRef.current.rotation.y = mouse.x * 0.05;
    meshRef.current.rotation.x = -mouse.y * 0.025;
    
    // Floating animation - moves forward at depth
    meshRef.current.position.z = Math.sin(time * 0.5) * 0.2 + scrollData.position * 2;
    
    // Scroll-based opacity: 10% at surface, up to 30% at full scroll
    const scrollOpacity = 0.1 + scrollData.position * 0.2;
    const targetOpacity = hovered ? Math.max(scrollOpacity + 0.1, 0.3) : scrollOpacity;
    
    if (meshRef.current.material) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[8, 1.6]} />
      <meshBasicMaterial
        map={logoTexture}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        alphaTest={0.1}
      />
    </mesh>
  );
}