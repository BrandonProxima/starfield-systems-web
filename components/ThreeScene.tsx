"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import ParticleField from "./ParticleField";
import PrecisionGrid from "./PrecisionGrid";
import LogoHybrid from "./LogoHybrid";
import ParticleTrails from "./ParticleTrails";
import ConstellationConnections from "./ConstellationConnections";
import SmoothCameraController, { CameraState } from "./SmoothCameraController";

function Scene({ cameraState }: { cameraState: CameraState | null }) {
  const { viewport } = useThree();
  
  // Convert camera state to scroll-like data for compatibility
  const scrollData = cameraState ? {
    position: Math.min(1, Math.max(0, (15 - cameraState.position.z) / 30)),
    velocity: cameraState.velocity.length()
  } : { position: 0, velocity: 0 };
  
  return (
    <>
      {/* Exponential fog for natural depth - subtle change as we dive */}
      <fogExp2 attach="fog" args={["#0A0A0B", 0.025 + scrollData.position * 0.008]} />
      
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
      
      {/* Cool rim light for particle edges */}
      <pointLight 
        position={[-10, -10, -10]} 
        intensity={0.1} 
        color="#7DD3FC" 
      />
      
      {/* Subtle warm rim light - like distant heat source */}
      <pointLight 
        position={[15, -5, -8]} 
        intensity={0.05} 
        color="#F59E0B" 
      />
      
      <ParticleField scrollData={scrollData} cameraState={cameraState} />
      <ParticleTrails scrollData={scrollData} />
      <ConstellationConnections scrollData={scrollData} />
      <LogoHybrid scrollData={scrollData} cameraState={cameraState} />
    </>
  );
}

export default function ThreeScene() {
  const [cameraState, setCameraState] = useState<CameraState | null>(null);
  
  // Convert camera state for post-processing effects
  const scrollData = cameraState ? {
    position: Math.min(1, Math.max(0, (15 - cameraState.position.z) / 30)),
    velocity: cameraState.velocity.length()
  } : { position: 0, velocity: 0 };
  
  // Check if we're in auto-return mode
  const isReturning = cameraState?.isAutoReframing || false;
  return (
    <div className="absolute inset-0 w-full h-full z-10" style={{ pointerEvents: 'none' }}>
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 15], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <SmoothCameraController onCameraUpdate={setCameraState} />
        <Scene cameraState={cameraState} />
        <EffectComposer multisampling={0}>
          <Bloom 
            intensity={0.05}  // Minimal bloom for ambient particles only
            luminanceThreshold={1.5}  // Very high threshold - logo won't bloom
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.4}  // Very tight bloom radius
            kernelSize={2}  // Smaller kernel for less spread
          />
          <Vignette
            offset={0.15}
            darkness={0.75}
            eskil={false}
          />
          <Noise
            opacity={0.12}
            blendFunction={BlendFunction.MULTIPLY}
          />
          <ChromaticAberration
            offset={[0.0003, 0.0003]}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}