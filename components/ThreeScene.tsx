"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ParticleField from "./ParticleField";
import PrecisionGrid from "./PrecisionGrid";

import LogoMesh from "./LogoMesh";

function Scene() {
  const { viewport } = useThree();
  
  return (
    <>
      {/* Exponential fog for natural depth */}
      <fogExp2 attach="fog" args={["#0A0A0B", 0.025]} />
      
      {/* Hemisphere light for more natural lighting */}
      <hemisphereLight 
        args={["#0EA5E9", "#050507", 0.3]} 
        position={[0, 50, 0]} 
      />
      
      {/* Subtle directional light */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.2} 
        color="#38BDF8"
        castShadow={false}
      />
      
      {/* Rim light for particle edges */}
      <pointLight 
        position={[-10, -10, -10]} 
        intensity={0.1} 
        color="#7DD3FC" 
      />
      
      <ParticleField />
      <LogoMesh />
    </>
  );
}

export default function ThreeScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-10">
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 15], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}