"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollPhysicsController, { PhysicsState } from "@/components/ScrollPhysicsController";

const ThreeScene = dynamic(() => import("@/components/ThreeScene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-light text-white/80 mb-2">
          WebGL Not Supported
        </h2>
        <p className="text-sm text-white/40">
          Please use a modern browser to view this experience
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [physicsState, setPhysicsState] = useState<PhysicsState | null>(null);
  
  useEffect(() => {
    // Check for WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);
  
  const handlePhysicsUpdate = useCallback((state: PhysicsState) => {
    setPhysicsState(state);
  }, []);
  
  return (
    <>
      {/* Physics controller */}
      <ScrollPhysicsController onPhysicsUpdate={handlePhysicsUpdate} />
      
      {/* Fixed Three.js scene */}
      <div className="fixed inset-0 w-full h-full bg-background">
        {/* Grain texture overlay */}
        <div className="grain" aria-hidden="true" />
        
        {/* Vignette overlay */}
        <div className="vignette" aria-hidden="true" />
        
        {/* 3D Scene with error boundary */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            {hasWebGL ? <ThreeScene physicsState={physicsState} /> : <WebGLFallback />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </>
  );
}