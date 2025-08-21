"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import * as THREE from "three";

export default function LogoMesh() {
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
    
    // Breathing effect
    const breathe = Math.sin(time * 0.25) * 0.05 + 1;
    meshRef.current.scale.set(breathe, breathe, 1);
    
    // Mouse parallax effect
    const mouseX = mouse.x * viewport.width * 0.1;
    const mouseY = mouse.y * viewport.height * 0.1;
    
    // Smooth follow mouse with easing
    meshRef.current.position.x += (mouseX * 0.3 - meshRef.current.position.x) * 0.1;
    meshRef.current.position.y += (mouseY * 0.3 - meshRef.current.position.y) * 0.1;
    
    // Subtle rotation based on mouse position
    meshRef.current.rotation.y = mouse.x * 0.2;
    meshRef.current.rotation.x = -mouse.y * 0.1;
    
    // Floating animation
    meshRef.current.position.z = Math.sin(time * 0.5) * 0.2;
    
    // Hover effect
    const targetOpacity = hovered ? 1 : 0.9;
    if (meshRef.current.material) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity += 
        (targetOpacity - (meshRef.current.material as THREE.MeshBasicMaterial).opacity) * 0.1;
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
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}