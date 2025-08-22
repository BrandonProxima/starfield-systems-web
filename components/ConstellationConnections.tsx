"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ScrollData {
  position: number;
  velocity: number;
}

const CONNECTION_COUNT = 30; // Number of connections to show
const TRIGGER_DEPTHS = [0.25, 0.5, 0.75]; // Scroll positions to trigger connections

export default function ConstellationConnections({ scrollData = { position: 0, velocity: 0 } }: { scrollData?: ScrollData }) {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const { camera } = useThree();
  const targetOpacity = useRef(0);
  const currentOpacity = useRef(0);
  const lastTriggerDepth = useRef(-1);
  
  // Create line geometry for connections
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(CONNECTION_COUNT * 2 * 3); // 2 vertices per line
    const colors = new Float32Array(CONNECTION_COUNT * 2 * 3);
    
    // Initialize with random positions (will be updated in animation loop)
    for (let i = 0; i < CONNECTION_COUNT; i++) {
      const i6 = i * 6; // Each line has 2 vertices, 3 coords each
      
      // Random positions in space
      const startRadius = 5 + Math.random() * 10;
      const endRadius = 5 + Math.random() * 10;
      const startAngle = Math.random() * Math.PI * 2;
      const endAngle = Math.random() * Math.PI * 2;
      const startHeight = (Math.random() - 0.5) * 10;
      const endHeight = (Math.random() - 0.5) * 10;
      
      // Start point
      positions[i6] = Math.cos(startAngle) * startRadius;
      positions[i6 + 1] = startHeight;
      positions[i6 + 2] = Math.sin(startAngle) * startRadius;
      
      // End point
      positions[i6 + 3] = Math.cos(endAngle) * endRadius;
      positions[i6 + 4] = endHeight;
      positions[i6 + 5] = Math.sin(endAngle) * endRadius;
      
      // Cool blue-white color for all vertices
      for (let j = 0; j < 6; j += 3) {
        colors[i6 + j] = 0.7;
        colors[i6 + j + 1] = 0.85;
        colors[i6 + j + 2] = 1.0;
      }
    }
    
    return { positions, colors };
  }, []);
  
  useFrame((state) => {
    if (!lineRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Check if we're at a trigger depth
    let shouldShow = false;
    for (const depth of TRIGGER_DEPTHS) {
      if (Math.abs(scrollData.position - depth) < 0.05) {
        shouldShow = true;
        if (depth !== lastTriggerDepth.current) {
          // New trigger depth reached, regenerate connections
          lastTriggerDepth.current = depth;
          regenerateConnections(positions, depth, time);
        }
        break;
      }
    }
    
    // Set target opacity
    targetOpacity.current = shouldShow ? 0.08 : 0;
    
    // Smooth opacity transition
    currentOpacity.current += (targetOpacity.current - currentOpacity.current) * 0.02;
    
    // Update shader uniform
    const material = lineRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uOpacity.value = currentOpacity.current;
    
    // Gentle animation of connections
    if (currentOpacity.current > 0.01) {
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < CONNECTION_COUNT; i++) {
        const i6 = i * 6;
        const offset = i * 0.1;
        
        // Gentle floating animation
        positions[i6 + 1] += Math.sin(time * 0.3 + offset) * 0.001;
        positions[i6 + 4] += Math.cos(time * 0.3 + offset) * 0.001;
      }
      
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  function regenerateConnections(positions: Float32Array, depth: number, time: number) {
    // Generate new connection patterns based on depth
    const depthSeed = depth * 1000;
    
    for (let i = 0; i < CONNECTION_COUNT; i++) {
      const i6 = i * 6;
      
      // Create constellation-like patterns at different depths
      const pattern = Math.floor(depth * 3); // 0, 1, or 2
      
      let startX, startY, startZ, endX, endY, endZ;
      
      switch (pattern) {
        case 0: // Wide spiral pattern
          const angle1 = (i / CONNECTION_COUNT) * Math.PI * 2;
          const angle2 = ((i + 1) / CONNECTION_COUNT) * Math.PI * 2;
          const radius = 8 + (i % 5) * 2;
          
          startX = Math.cos(angle1) * radius;
          startY = Math.sin(angle1) * 2;
          startZ = Math.sin(angle1) * radius * 0.5 - depth * 5;
          
          endX = Math.cos(angle2) * (radius + 1);
          endY = Math.sin(angle2) * 2;
          endZ = Math.sin(angle2) * (radius + 1) * 0.5 - depth * 5;
          break;
          
        case 1: // Grid-like pattern
          const gridX = (i % 6) - 2.5;
          const gridY = Math.floor(i / 6) - 2.5;
          
          startX = gridX * 3;
          startY = gridY * 2;
          startZ = Math.sin(gridX * gridY) * 2 - depth * 8;
          
          endX = (gridX + (Math.random() - 0.5)) * 3;
          endY = (gridY + (Math.random() - 0.5)) * 2;
          endZ = startZ + (Math.random() - 0.5) * 2;
          break;
          
        default: // Radial burst pattern
          const burstAngle = (i / CONNECTION_COUNT) * Math.PI * 2;
          const innerRadius = 3;
          const outerRadius = 10 + Math.random() * 5;
          
          startX = Math.cos(burstAngle) * innerRadius;
          startY = Math.sin(burstAngle) * innerRadius * 0.3;
          startZ = -depth * 12;
          
          endX = Math.cos(burstAngle + 0.1) * outerRadius;
          endY = Math.sin(burstAngle + 0.1) * outerRadius * 0.3;
          endZ = -depth * 12 + (Math.random() - 0.5) * 3;
          break;
      }
      
      positions[i6] = startX;
      positions[i6 + 1] = startY;
      positions[i6 + 2] = startZ;
      
      positions[i6 + 3] = endX;
      positions[i6 + 4] = endY;
      positions[i6 + 5] = endZ;
    }
    
    if (lineRef.current) {
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          uOpacity: { value: 0 }
        }}
        vertexShader={`
          varying vec3 vColor;
          void main() {
            vColor = color;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            // Gradient along the line for softer appearance
            float alpha = uOpacity * (1.0 - length(gl_PointCoord - 0.5) * 2.0);
            gl_FragColor = vec4(vColor, alpha);
            gl_FragColor.rgb *= gl_FragColor.a;
          }
        `}
      />
    </lineSegments>
  );
}