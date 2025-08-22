"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ScrollData {
  position: number;
  velocity: number;
}

export default function CameraController({ scrollData }: { scrollData: ScrollData }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0, 15));
  const currentPosition = useRef(new THREE.Vector3(0, 0, 15));
  const smoothedPosition = useRef(0);
  const smoothedVelocity = useRef(0);
  
  useFrame(() => {
    // Smooth the scroll data internally
    smoothedPosition.current += (scrollData.position - smoothedPosition.current) * 0.05;
    smoothedVelocity.current += (scrollData.velocity - smoothedVelocity.current) * 0.1;
    
    // Use smoothed values
    const safePosition = Math.min(1, Math.max(0, smoothedPosition.current));
    const safeVelocity = Math.min(1, Math.max(-1, smoothedVelocity.current));
    
    // Very smooth camera movement based on scroll
    targetPosition.current.z = 15 - safePosition * 3;
    targetPosition.current.y = safePosition * 0.8;
    targetPosition.current.x = Math.sin(safePosition * Math.PI) * 0.2;
    
    // Minimal velocity influence
    targetPosition.current.x += safeVelocity * 0.01;
    
    // Very smooth interpolation for silky movement
    currentPosition.current.lerp(targetPosition.current, 0.03);
    camera.position.copy(currentPosition.current);
    
    // Minimal camera tilt
    camera.rotation.z = safeVelocity * 0.003;
  });

  return null;
}