"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function PrecisionGrid() {
  const gridRef = useRef<THREE.Group>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Fade in/out effect for the grid
    const opacity = (Math.sin(time * 0.5) + 1) * 0.15 + 0.1;
    
    if (linesRef.current) {
      (linesRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }
    
    // Subtle rotation
    if (gridRef.current) {
      gridRef.current.rotation.x = Math.sin(time * 0.1) * 0.02;
      gridRef.current.rotation.z = Math.cos(time * 0.15) * 0.02;
    }
  });
  
  const geometry = new THREE.BufferGeometry();
  const points: number[] = [];
  
  // Create grid lines
  const gridSize = 20;
  const divisions = 30;
  const step = gridSize / divisions;
  
  // Horizontal lines
  for (let i = 0; i <= divisions; i++) {
    const pos = -gridSize / 2 + i * step;
    points.push(-gridSize / 2, pos, 0);
    points.push(gridSize / 2, pos, 0);
  }
  
  // Vertical lines
  for (let i = 0; i <= divisions; i++) {
    const pos = -gridSize / 2 + i * step;
    points.push(pos, -gridSize / 2, 0);
    points.push(pos, gridSize / 2, 0);
  }
  
  // Add measurement markers at intersections
  const markerGeometry = new THREE.BufferGeometry();
  const markerPoints: number[] = [];
  
  for (let x = -10; x <= 10; x += 2) {
    for (let y = -10; y <= 10; y += 2) {
      // Small cross markers
      markerPoints.push(x - 0.1, y, 0);
      markerPoints.push(x + 0.1, y, 0);
      markerPoints.push(x, y - 0.1, 0);
      markerPoints.push(x, y + 0.1, 0);
    }
  }
  
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3)
  );
  
  markerGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(markerPoints, 3)
  );
  
  return (
    <group ref={gridRef}>
      <lineSegments ref={linesRef} geometry={geometry}>
        <lineBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <lineSegments geometry={markerGeometry}>
        <lineBasicMaterial
          color="#7DD3FC"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}