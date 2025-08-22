"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  rotation: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  thrust: number;
  roll: number;
  pitch: number;
  yaw: number;
}

interface ScrollPhysicsControllerProps {
  onPhysicsUpdate: (state: PhysicsState) => void;
}

export default function ScrollPhysicsController({ onPhysicsUpdate }: ScrollPhysicsControllerProps) {
  const physics = useRef<PhysicsState>({
    position: new THREE.Vector3(0, 0, 15),
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Quaternion(),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    thrust: 0,
    roll: 0,
    pitch: 0,
    yaw: 0
  });
  
  const scrollAccumulator = useRef(0);
  const lastTime = useRef(Date.now());
  const mousePosition = useRef({ x: 0, y: 0 });
  const isShiftPressed = useRef(false);
  const isDragging = useRef(false);
  
  // Physics constants
  const THRUST_POWER = 0.002;
  const DRAG_COEFFICIENT = 0.98;
  const ANGULAR_DRAG = 0.95;
  const MOUSE_SENSITIVITY = 0.0003;
  const MAX_VELOCITY = 2;
  const STABILIZATION_FORCE = 0.02;
  
  // Boundary constants - adjusted for better feel
  const BOUNDARY_X = { min: -15, max: 15 };
  const BOUNDARY_Y = { min: -8, max: 8 };
  const BOUNDARY_Z = { min: 5, max: 30 }; // Stay in front of logo (which is at z=0)
  const LOGO_OPTIMAL_Z = 15; // Best viewing distance from logo
  const RETURN_THRESHOLD_Z = 3; // Start returning if too close to logo
  const RETURN_FORCE = 0.002; // Gentler return force
  
  // Auto-return state
  const autoReturnTimer = useRef(0);
  const isReturning = useRef(false);
  const targetReturnPosition = useRef(new THREE.Vector3(0, 0, 15));
  
  useEffect(() => {
    let animationFrame: number;
    
    // Physics update loop using Verlet integration
    const updatePhysics = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastTime.current) / 1000, 0.1); // Cap at 100ms
      lastTime.current = now;
      
      const state = physics.current;
      
      // Apply thrust from scroll - free movement based on mouse position
      if (Math.abs(scrollAccumulator.current) > 0.01) {
        const scrollForce = -scrollAccumulator.current * THRUST_POWER;
        
        // Strong mouse influence for multi-axis movement
        const mouseInfluence = 0.8; // Much stronger influence
        
        // Distribute scroll force across all axes based on mouse position
        state.acceleration.z = scrollForce * (0.3 + (1.0 - Math.abs(mousePosition.current.y)) * 0.7);
        state.acceleration.y = scrollForce * mousePosition.current.y * mouseInfluence;
        state.acceleration.x = scrollForce * mousePosition.current.x * mouseInfluence;
        
        scrollAccumulator.current *= 0.9;
      }
      
      // Check if idle for auto-leveling
      const currentlyIdle = state.velocity.length() < 0.1 && Math.abs(scrollAccumulator.current) < 0.1;
      
      // Apply rotational forces from mouse
      if (!isDragging.current) {
        // Natural banking based on horizontal movement
        const targetRoll = -state.velocity.x * 0.3;
        state.roll += (targetRoll - state.roll) * STABILIZATION_FORCE;
        
        // Pitch and yaw from mouse position - but always trend back to center
        const targetPitch = -mousePosition.current.y * MOUSE_SENSITIVITY;
        const targetYaw = mousePosition.current.x * MOUSE_SENSITIVITY;
        
        state.pitch += (targetPitch - state.pitch) * STABILIZATION_FORCE * 2;
        state.yaw += (targetYaw - state.yaw) * STABILIZATION_FORCE * 2;
        
        // Auto-level when idle or returning
        if (currentlyIdle || isReturning.current) {
          // Gradually return rotation to neutral
          state.pitch *= 0.98;
          state.yaw *= 0.98;
          state.roll *= 0.95;
          
          // Also reset the rotation quaternion toward identity
          const identityQuat = new THREE.Quaternion();
          state.rotation.slerp(identityQuat, 0.01);
        }
      }
      
      // Update angular velocity
      state.angularVelocity.set(state.pitch, state.yaw, state.roll);
      state.angularVelocity.multiplyScalar(ANGULAR_DRAG);
      
      // Update rotation quaternion
      const euler = new THREE.Euler(
        state.angularVelocity.x * deltaTime * 60,
        state.angularVelocity.y * deltaTime * 60,
        state.angularVelocity.z * deltaTime * 60,
        'YXZ'
      );
      const deltaRotation = new THREE.Quaternion().setFromEuler(euler);
      state.rotation.multiplyQuaternions(deltaRotation, state.rotation);
      
      // Apply lateral drift based on rotation
      const driftForce = new THREE.Vector3(
        Math.sin(state.yaw) * Math.abs(state.velocity.z) * 0.1,
        Math.sin(state.pitch) * Math.abs(state.velocity.z) * 0.05,
        0
      );
      state.acceleration.add(driftForce);
      
      // Verlet integration for position
      state.velocity.add(state.acceleration.clone().multiplyScalar(deltaTime));
      
      // Apply drag
      state.velocity.multiplyScalar(DRAG_COEFFICIENT);
      
      // Clamp velocity
      if (state.velocity.length() > MAX_VELOCITY) {
        state.velocity.normalize().multiplyScalar(MAX_VELOCITY);
      }
      
      // Update position
      state.position.add(state.velocity.clone().multiplyScalar(deltaTime * 60));
      
      // Universal auto-return system - reframe after idle period from any position
      const distanceFromLogo = state.position.distanceTo(new THREE.Vector3(0, 0, 0));
      const isIdle = state.velocity.length() < 0.1 && Math.abs(scrollAccumulator.current) < 0.1;
      
      if (isIdle) {
        autoReturnTimer.current += deltaTime;
        
        if (autoReturnTimer.current > 3.0) { // Return after 3 seconds of idleness
          if (!isReturning.current) {
            isReturning.current = true;
            
            // Calculate optimal viewing position with slight randomization
            const angle = Math.random() * Math.PI * 2; // Random angle around logo
            const distance = 12 + Math.random() * 6; // 12-18 units from logo
            const height = (Math.random() - 0.5) * 4; // ±2 units height variation
            
            targetReturnPosition.current.set(
              Math.cos(angle) * distance * 0.3, // Closer to center on X
              height,
              Math.sin(angle) * distance + 15 // Prefer positions in front of logo
            );
            
            // Gentle rotation reset
            state.pitch *= 0.3;
            state.yaw *= 0.3;
            state.roll *= 0.3;
          }
        }
      } else {
        autoReturnTimer.current = 0;
        if (isReturning.current) {
          isReturning.current = false;
        }
      }
      
      // Apply auto-return force with very gentle easing
      if (isReturning.current) {
        const returnDirection = targetReturnPosition.current.clone().sub(state.position);
        const distance = returnDirection.length();
        
        if (distance > 0.5) {
          returnDirection.normalize();
          // Very gentle easing - starts slow, speeds up, then slows down
          const t = Math.min(1, (autoReturnTimer.current - 2.5) / 8); // 8 seconds for full return after trigger
          const easedStrength = t * t * t * (t * (t * 6 - 15) + 10); // Quintic easing
          const returnStrength = Math.min(distance * RETURN_FORCE * easedStrength, 0.015); // Lower max force
          state.acceleration.add(returnDirection.multiplyScalar(returnStrength));
        } else {
          // Gently stop returning
          isReturning.current = false;
          autoReturnTimer.current = 0;
        }
      }
      
      // Apply boundary constraints with exponential soft repulsion
      const boundaryForce = new THREE.Vector3();
      const BOUNDARY_SOFTNESS = 3; // Distance from boundary where force starts
      
      // Helper function for smooth boundary force
      const getBoundaryForce = (pos: number, min: number, max: number): number => {
        if (pos < min + BOUNDARY_SOFTNESS) {
          const distance = Math.max(0, pos - min);
          const normalized = distance / BOUNDARY_SOFTNESS;
          // Exponential falloff for smooth boundary
          return (1 - normalized) * (1 - normalized) * 0.05;
        } else if (pos > max - BOUNDARY_SOFTNESS) {
          const distance = Math.max(0, max - pos);
          const normalized = distance / BOUNDARY_SOFTNESS;
          return -(1 - normalized) * (1 - normalized) * 0.05;
        }
        return 0;
      };
      
      // Apply smooth boundary forces
      boundaryForce.x = getBoundaryForce(state.position.x, BOUNDARY_X.min, BOUNDARY_X.max);
      boundaryForce.y = getBoundaryForce(state.position.y, BOUNDARY_Y.min, BOUNDARY_Y.max);
      boundaryForce.z = getBoundaryForce(state.position.z, BOUNDARY_Z.min, BOUNDARY_Z.max);
      
      // Only dampen velocity if actually at hard boundary (not in soft zone)
      if (state.position.x <= BOUNDARY_X.min || state.position.x >= BOUNDARY_X.max) {
        state.velocity.x *= 0.5;
      }
      if (state.position.y <= BOUNDARY_Y.min || state.position.y >= BOUNDARY_Y.max) {
        state.velocity.y *= 0.5;
      }
      if (state.position.z <= BOUNDARY_Z.min || state.position.z >= BOUNDARY_Z.max) {
        state.velocity.z *= 0.5;
      }
      
      state.acceleration.add(boundaryForce);
      
      // Add subtle idle drift when not moving
      if (state.velocity.length() < 0.01 && !isReturning.current) {
        const time = Date.now() * 0.0001;
        state.position.x += Math.sin(time * 2.3) * 0.001;
        state.position.y += Math.cos(time * 1.7) * 0.001;
      }
      
      // Reset acceleration for next frame
      state.acceleration.multiplyScalar(0.9);
      
      // Callback with current state
      onPhysicsUpdate({
        ...state,
        position: state.position.clone(),
        velocity: state.velocity.clone(),
        acceleration: state.acceleration.clone(),
        rotation: state.rotation.clone(),
        angularVelocity: state.angularVelocity.clone(),
        thrust: scrollAccumulator.current
      });
      
      animationFrame = requestAnimationFrame(updatePhysics);
    };
    
    // Input handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Respect user's scroll direction preference (natural/inverted)
      // Don't override - just use raw deltaY
      const delta = e.deltaY;
      scrollAccumulator.current += delta;
      scrollAccumulator.current = Math.max(-1000, Math.min(1000, scrollAccumulator.current));
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      mousePosition.current = {
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY
      };
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        e.preventDefault();
        isShiftPressed.current = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        e.preventDefault();
        isShiftPressed.current = false;
      }
    };
    
    // Handle window blur and focus changes to reset shift state
    const handleWindowBlur = () => {
      isShiftPressed.current = false;
    };
    
    const handleWindowFocus = () => {
      isShiftPressed.current = false;
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isShiftPressed.current = false;
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        isDragging.current = true;
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        isDragging.current = false;
      }
    };
    
    // Start physics loop
    updatePhysics();
    
    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', handleKeyUp, { capture: true } as any);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onPhysicsUpdate]);
  
  return null;
}