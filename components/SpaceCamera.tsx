"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PhysicsState } from "./ScrollPhysicsController";

interface SpaceCameraProps {
  physicsState: PhysicsState | null;
}

export default function SpaceCamera({ physicsState }: SpaceCameraProps) {
  const { camera } = useThree();
  const smoothedPosition = useRef(new THREE.Vector3(0, 0, 15));
  const smoothedRotation = useRef(new THREE.Quaternion());
  const velocityTrail = useRef<THREE.Vector3[]>([]);
  const cameraShake = useRef(new THREE.Vector3());
  const boundaryWarning = useRef(0);
  
  useFrame((state, delta) => {
    if (!physicsState) return;
    
    const time = state.clock.getElapsedTime();
    
    // Smooth position interpolation with LERP
    smoothedPosition.current.lerp(physicsState.position, 0.1);
    
    // Smooth rotation interpolation with SLERP
    smoothedRotation.current.slerp(physicsState.rotation, 0.08);
    
    // Auto-level correction when idle
    if (physicsState.velocity.length() < 0.05) {
      // Gradually return to level orientation
      const identityQuat = new THREE.Quaternion();
      smoothedRotation.current.slerp(identityQuat, 0.005);
    }
    
    // Add velocity-based camera shake
    const shakeIntensity = physicsState.velocity.length() * 0.02;
    if (shakeIntensity > 0.001) {
      cameraShake.current.set(
        Math.sin(time * 43.7) * shakeIntensity,
        Math.cos(time * 37.3) * shakeIntensity,
        Math.sin(time * 31.1) * shakeIntensity * 0.5
      );
    } else {
      cameraShake.current.multiplyScalar(0.9); // Decay shake
    }
    
    // Update velocity trail for motion effects
    velocityTrail.current.push(physicsState.velocity.clone());
    if (velocityTrail.current.length > 10) {
      velocityTrail.current.shift();
    }
    
    // Calculate average velocity for smooth effects
    const avgVelocity = velocityTrail.current.reduce(
      (acc, vel) => acc.add(vel),
      new THREE.Vector3()
    ).multiplyScalar(1 / Math.max(1, velocityTrail.current.length));
    
    // Apply position with shake
    camera.position.copy(smoothedPosition.current).add(cameraShake.current);
    
    // Apply rotation
    camera.quaternion.copy(smoothedRotation.current);
    
    // Add subtle banking effect based on lateral velocity
    const bankAngle = avgVelocity.x * 0.1;
    
    // Apply banking but always trend back to level
    if (Math.abs(avgVelocity.x) > 0.01) {
      camera.rotation.z = bankAngle;
    } else {
      // Return to level when not moving laterally
      camera.rotation.z *= 0.95;
    }
    
    // Check boundary proximity for visual feedback
    const BOUNDARY_WARNING_DISTANCE = 3;
    let nearBoundary = false;
    
    // Check if near any boundary (within warning distance)
    const nearX = physicsState.position.x < -12 || physicsState.position.x > 12;
    const nearY = physicsState.position.y < -6 || physicsState.position.y > 6;
    const nearZ = physicsState.position.z < 8 || physicsState.position.z > 27;
    
    nearBoundary = nearX || nearY || nearZ;
    
    // Update boundary warning
    if (nearBoundary) {
      boundaryWarning.current = Math.min(1, boundaryWarning.current + 0.05);
    } else {
      boundaryWarning.current = Math.max(0, boundaryWarning.current - 0.02);
    }
    
    // Dynamic FOV based on velocity (speed effect) and boundary warning
    const speedFOV = 50 + Math.min(avgVelocity.length() * 5, 20);
    const boundaryFOV = speedFOV - boundaryWarning.current * 5; // Narrow FOV near boundaries
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov += (boundaryFOV - camera.fov) * 0.05;
      camera.updateProjectionMatrix();
    }
    
    // Add boundary vignette effect through camera rotation wobble
    if (boundaryWarning.current > 0) {
      const wobble = Math.sin(time * 10) * boundaryWarning.current * 0.005;
      camera.rotation.z += wobble;
    }
    
    // Look-ahead offset based on velocity
    const lookAhead = avgVelocity.clone().multiplyScalar(0.3);
    camera.position.add(lookAhead);
  });
  
  // Initialize camera settings
  useEffect(() => {
    camera.near = 0.1;
    camera.far = 1000;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50;
    }
    camera.updateProjectionMatrix();
  }, [camera]);
  
  return null;
}