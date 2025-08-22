"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import ParticleField from "./ParticleField";
import PrecisionGrid from "./PrecisionGrid";
import LogoMesh from "./LogoMesh";
import CameraController from "./CameraController";
import ParticleTrails from "./ParticleTrails";
import ConstellationConnections from "./ConstellationConnections";

interface ScrollData {
  position: number;
  velocity: number;
}

function Scene({ scrollData }: { scrollData: ScrollData }) {
  const { viewport } = useThree();
  
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
      
      <CameraController scrollData={scrollData} />
      <ParticleField scrollData={scrollData} />
      <ParticleTrails scrollData={scrollData} />
      <ConstellationConnections scrollData={scrollData} />
      <LogoMesh scrollData={scrollData} />
    </>
  );
}

export default function ThreeScene({ scrollData = { position: 0, velocity: 0 } }: { scrollData?: ScrollData }) {
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
        <Scene scrollData={scrollData} />
        <EffectComposer multisampling={0}>
          <Bloom 
            intensity={0.5 + Math.abs(scrollData.velocity) * 0.2}
            luminanceThreshold={0.8 - Math.abs(scrollData.velocity) * 0.1}
            luminanceSmoothing={0.1}
            mipmapBlur
          />
          <Vignette
            offset={0.1}
            darkness={0.8 + scrollData.position * 0.05}
            eskil={false}
          />
          <Noise
            opacity={0.15 + Math.abs(scrollData.velocity) * 0.05}
            blendFunction={BlendFunction.MULTIPLY}
          />
          <ChromaticAberration
            offset={[
              0.0005 + Math.abs(scrollData.velocity) * 0.0008,
              0.0005 + Math.abs(scrollData.velocity) * 0.0008
            ]}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}