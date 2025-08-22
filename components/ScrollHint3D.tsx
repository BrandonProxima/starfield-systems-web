"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

export default function ScrollHint3D() {
  const textRef = useRef<THREE.Mesh>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in after 2 seconds
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 2000);

    // Check for scroll
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(fadeInTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame((state) => {
    if (!textRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Gentle floating animation
    textRef.current.position.y = -4 + Math.sin(time * 0.5) * 0.1;
    
    // Fade out when scrolled
    const material = textRef.current.material as THREE.MeshBasicMaterial;
    if (material) {
      if (hasScrolled) {
        material.opacity = Math.max(0, material.opacity - 0.02);
      } else {
        material.opacity = Math.min(opacity * 0.3, material.opacity + 0.01);
      }
    }
  });

  return (
    <Text
      ref={textRef}
      position={[0, -4, -5]} // Positioned behind particles in Z space
      fontSize={0.15} // Much smaller
      letterSpacing={0.3}
      font="/fonts/RBNo3.1-Medium.otf"
      anchorX="center"
      anchorY="middle"
      material-transparent={true}
      material-opacity={0}
      material-depthWrite={false}
      material-depthTest={true}
    >
      SCROLL TO EXPLORE
      <meshBasicMaterial 
        attach="material" 
        color="#ffffff" 
        transparent={true} 
        opacity={0}
        depthWrite={false}
      />
    </Text>
  );
}