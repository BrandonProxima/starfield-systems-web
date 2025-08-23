"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  velocity: THREE.Vector3;
  isAutoReframing: boolean;
}

interface SmoothCameraControllerProps {
  onCameraUpdate: (state: CameraState) => void;
}

export default function SmoothCameraController({ onCameraUpdate }: SmoothCameraControllerProps) {
  const { camera } = useThree();
  
  // Simple intro state
  const introRef = useRef({
    active: true,
    startTime: Date.now(),
    duration: 4000, // 4 seconds
    startZ: 50,
    endZ: 15
  });
  
  // Camera state - start far out for intro
  const cameraState = useRef<CameraState>({
    position: new THREE.Vector3(0, 0, 50), // Start far away
    target: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    isAutoReframing: false
  });
  
  // Input state
  const mousePosition = useRef({ x: 0, y: 0 });
  const scrollAccumulator = useRef(0);
  const lastMoveTime = useRef(Date.now());
  const autoReframeTimer = useRef(0);
  
  // Smooth damping constants
  const MOVEMENT_SPEED = 0.02;
  const DAMPING_FACTOR = 0.08; // Exponential damping
  const MOUSE_INFLUENCE = 0.4;
  const AUTO_REFRAME_DELAY = 3000; // 3 seconds
  const REFRAME_SPEED = 0.03;
  
  // Soft boundaries
  const BOUNDARY_DISTANCE = 25;
  const BOUNDARY_SOFTNESS = 0.02;
  
  // Golden ratio and fibonacci for aesthetics
  const GOLDEN_RATIO = 1.618;
  const PHI = (1 + Math.sqrt(5)) / 2;
  
  // Track recentering state
  const recenteringStartPos = useRef(new THREE.Vector3());
  const recenteringTargetPos = useRef(new THREE.Vector3());
  const recenteringProgress = useRef(0);
  const currentPresetIndex = useRef(0);
  
  // Professional easing function (cubic ease-in-out)
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Dramatic easing for occasional quick movements
  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };
  
  // Calculate optimal camera positions using cinematography principles
  const getOptimalCameraPosition = (index: number): THREE.Vector3 => {
    // Every 3rd position returns to center for logo readability
    if (index % 3 === 0) {
      // Centered, readable position with slight variation
      const centerVariation = (index / 3) % 4;
      const positions = [
        new THREE.Vector3(0, 0, 15),      // Perfect center
        new THREE.Vector3(2, 1, 14),      // Slight right
        new THREE.Vector3(-2, 1, 14),     // Slight left
        new THREE.Vector3(0, 2, 16),      // Slightly elevated
      ];
      return positions[centerVariation];
    }
    
    // For non-centered positions, use subtle fibonacci spiral
    const angle = index * 2.399963229728653; // Golden angle in radians
    const radius = 14 + Math.sqrt(index) * 1.5; // More subtle radius expansion
    
    // Keep height variations minimal for stability
    const heightVariation = Math.sin(index * 0.618) * 2; // Reduced from 4
    const baseHeight = 1 + heightVariation;
    
    // Ensure most positions keep logo somewhat visible
    const x = Math.cos(angle) * radius * 0.4; // Reduced from 0.618 for less lateral movement
    const z = Math.sin(angle) * radius * 0.8 + 10; // Keep camera mostly in front
    const y = baseHeight;
    
    // Very subtle randomization
    const jitter = 0.05; // Reduced from 0.15
    return new THREE.Vector3(
      x + (Math.random() - 0.5) * jitter * radius * 0.05,
      y + (Math.random() - 0.5) * jitter,
      z + (Math.random() - 0.5) * jitter * radius * 0.05
    );
  };
  
  useEffect(() => {
    // Input handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumulator.current += e.deltaY * 0.01;
      scrollAccumulator.current = THREE.MathUtils.clamp(scrollAccumulator.current, -5, 5);
      lastMoveTime.current = Date.now();
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.documentElement.getBoundingClientRect();
      mousePosition.current = {
        x: ((e.clientX - rect.width / 2) / rect.width) * 2,
        y: ((e.clientY - rect.height / 2) / rect.height) * 2
      };
      lastMoveTime.current = Date.now();
    };
    
    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  useFrame((state, delta) => {
    const currentState = cameraState.current;
    const deltaTime = Math.min(delta, 0.1); // Cap delta time
    
    // Simple intro animation
    if (introRef.current.active) {
      const elapsed = Date.now() - introRef.current.startTime;
      const progress = Math.min(elapsed / introRef.current.duration, 1);
      
      // Simple cubic ease in-out
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Animate Z position only for stability
      currentState.position.z = introRef.current.startZ - 
        (introRef.current.startZ - introRef.current.endZ) * eased;
      
      // End intro when complete
      if (progress >= 1) {
        introRef.current.active = false;
        currentState.position.z = introRef.current.endZ;
      }
      
      // Update camera
      camera.position.copy(currentState.position);
      camera.lookAt(currentState.target);
      
      // Update callback
      onCameraUpdate({
        ...currentState,
        position: currentState.position.clone(),
        target: currentState.target.clone(),
        velocity: currentState.velocity.clone(),
      });
      
      // Skip normal controls during intro
      return;
    }
    
    // Check if user is idle
    const timeSinceLastMove = Date.now() - lastMoveTime.current;
    const isIdle = timeSinceLastMove > 100 && Math.abs(scrollAccumulator.current) < 0.01;
    
    if (!isIdle) {
      // User input - manual control
      currentState.isAutoReframing = false;
      autoReframeTimer.current = 0;
      
      // Calculate movement direction based on mouse position and scroll
      if (Math.abs(scrollAccumulator.current) > 0.01) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        
        // Base forward/backward movement
        const moveForward = scrollAccumulator.current * MOVEMENT_SPEED;
        
        // Add mouse-influenced lateral movement
        const lateralX = moveForward * mousePosition.current.x * MOUSE_INFLUENCE;
        const lateralY = -moveForward * mousePosition.current.y * MOUSE_INFLUENCE * 0.5;
        
        // Combine movements
        const movement = forwardDir.multiplyScalar(moveForward)
          .add(rightDir.multiplyScalar(lateralX))
          .add(upDir.multiplyScalar(lateralY));
        
        currentState.velocity.add(movement);
        
        // Decay scroll accumulator
        scrollAccumulator.current *= 0.9;
      }
    } else {
      // User is idle - check for auto-reframing
      autoReframeTimer.current += deltaTime * 1000;
      
      if (autoReframeTimer.current > AUTO_REFRAME_DELAY && !currentState.isAutoReframing) {
        currentState.isAutoReframing = true;
        recenteringProgress.current = 0;
        recenteringStartPos.current.copy(currentState.position);
        
        // Calculate optimal viewing position using cinematography principles
        const distanceFromCenter = currentState.position.distanceTo(currentState.target);
        
        // Always recenter for best visual experience
        if (distanceFromCenter < 10 || distanceFromCenter > 22 || Math.random() > 0.3) {
          // Get next position in fibonacci spiral sequence
          recenteringTargetPos.current = getOptimalCameraPosition(currentPresetIndex.current);
          currentPresetIndex.current = (currentPresetIndex.current + 1) % 20; // Cycle through 20 positions
        }
      }
      
      // Handle smooth recentering animation
      if (currentState.isAutoReframing && recenteringProgress.current < 1) {
        // Occasionally use dramatic movement (10% chance)
        const isDramatic = currentPresetIndex.current === 10;
        const animationSpeed = isDramatic ? 0.5 : 0.25; // Faster for dramatic, slower for normal
        
        recenteringProgress.current += deltaTime * animationSpeed;
        
        if (recenteringProgress.current >= 1) {
          recenteringProgress.current = 1;
          currentState.isAutoReframing = false;
        }
        
        // Use different easing based on movement type
        const easedProgress = isDramatic 
          ? easeOutQuart(Math.min(1, recenteringProgress.current))
          : easeInOutCubic(Math.min(1, recenteringProgress.current));
        
        // Interpolate position with arc motion for cinematic feel
        const lerpedPos = new THREE.Vector3().lerpVectors(
          recenteringStartPos.current,
          recenteringTargetPos.current,
          easedProgress
        );
        
        // Arc motion varies with dramatic movements
        const arcHeight = isDramatic 
          ? Math.sin(easedProgress * Math.PI) * 2.5  // More arc for drama
          : Math.sin(easedProgress * Math.PI) * 0.8; // Very subtle normally
        lerpedPos.y += arcHeight;
        
        // Calculate velocity to reach target position
        const targetVelocity = lerpedPos.clone().sub(currentState.position);
        const trackingSpeed = isDramatic ? 10 : 5; // Faster tracking for dramatic moves
        targetVelocity.multiplyScalar(trackingSpeed);
        
        // Blend with current velocity for extra smoothness
        const blendRate = isDramatic ? 0.2 : 0.12;
        currentState.velocity.lerp(targetVelocity, blendRate);
      }
    }
    
    // Apply soft boundaries with exponential repulsion
    const distanceFromCenter = currentState.position.length();
    if (distanceFromCenter > BOUNDARY_DISTANCE) {
      const repulsionDir = currentState.position.clone().normalize().multiplyScalar(-1);
      const repulsionStrength = Math.pow((distanceFromCenter - BOUNDARY_DISTANCE) / BOUNDARY_DISTANCE, 2);
      const repulsion = repulsionDir.multiplyScalar(repulsionStrength * BOUNDARY_SOFTNESS);
      currentState.velocity.add(repulsion);
    }
    
    // Apply exponential damping (frame-rate independent)
    const dampingFactor = 1 - Math.pow(1 - DAMPING_FACTOR, deltaTime * 60);
    currentState.velocity.multiplyScalar(1 - dampingFactor);
    
    // Update position
    currentState.position.add(currentState.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Prevent camera from getting too close to target (prevents flip)
    const minDistance = 3; // Minimum distance from target
    const distToTarget = currentState.position.distanceTo(currentState.target);
    
    // Also prevent camera from going behind the logo (negative Z)
    if (currentState.position.z < 2) {
      currentState.position.z = 2;
      // Stop forward velocity if we hit this limit
      if (currentState.velocity.z < 0) {
        currentState.velocity.z *= 0.1; // Dampen forward movement
      }
    }
    
    if (distToTarget < minDistance) {
      // Push camera back to minimum distance
      const pushDirection = currentState.position.clone().sub(currentState.target).normalize();
      if (pushDirection.length() < 0.001) {
        // If we're exactly at the target, push back along Z axis
        pushDirection.set(0, 0, 1);
      }
      currentState.position.copy(
        currentState.target.clone().add(pushDirection.multiplyScalar(minDistance))
      );
      
      // Dampen velocity when too close
      currentState.velocity.multiplyScalar(0.5);
    }
    
    // Update camera
    camera.position.copy(currentState.position);
    
    // Smooth lookAt to prevent sudden flips
    const lookAtTarget = currentState.target.clone();
    
    // If camera is very close to the target, offset the lookAt point slightly forward
    if (distToTarget < 5) {
      const forwardOffset = new THREE.Vector3(0, 0, -2);
      lookAtTarget.add(forwardOffset);
    }
    
    camera.lookAt(lookAtTarget);
    
    // Update callback
    onCameraUpdate({
      ...currentState,
      position: currentState.position.clone(),
      target: currentState.target.clone(),
      velocity: currentState.velocity.clone(),
    });
  });
  
  return null;
}