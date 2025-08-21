"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";

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
  
  return (
    <main className="fixed inset-0 w-full h-full overflow-hidden bg-background">
      {/* Grain texture overlay */}
      <div className="grain" aria-hidden="true" />
      
      {/* 3D Scene with error boundary */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingScreen />}>
          {hasWebGL ? <ThreeScene /> : <WebGLFallback />}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}