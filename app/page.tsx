"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollUI from "@/components/ScrollUI";

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
  const [scrollData, setScrollData] = useState({ position: 0, velocity: 0 });
  const lastScrollPosition = useRef(0);
  const scrollVelocityTimeout = useRef<NodeJS.Timeout | null>(null);
  
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
  
  useEffect(() => {
    let rafId: number | null = null;
    let isScrolling = false;
    
    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        
        rafId = requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
          const normalizedPosition = Math.min(1, Math.max(0, currentScroll / maxScroll));
          const velocity = (currentScroll - lastScrollPosition.current) / 50;
          
          setScrollData({
            position: normalizedPosition,
            velocity: Math.min(1, Math.max(-1, velocity))
          });
          
          lastScrollPosition.current = currentScroll;
          isScrolling = false;
        });
      }
      
      // Reset velocity after scrolling stops
      if (scrollVelocityTimeout.current) {
        clearTimeout(scrollVelocityTimeout.current);
      }
      scrollVelocityTimeout.current = setTimeout(() => {
        setScrollData(prev => ({ ...prev, velocity: 0 }));
      }, 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollVelocityTimeout.current) {
        clearTimeout(scrollVelocityTimeout.current);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);
  
  return (
    <>
      {/* Fixed Three.js scene */}
      <div className="fixed inset-0 w-full h-full bg-background">
        {/* Grain texture overlay */}
        <div className="grain" aria-hidden="true" />
        
        {/* Vignette overlay */}
        <div className="vignette" aria-hidden="true" />
        
        {/* 3D Scene with error boundary */}
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            {hasWebGL ? <ThreeScene scrollData={scrollData} /> : <WebGLFallback />}
          </Suspense>
        </ErrorBoundary>
        
        {/* Scroll UI overlay */}
        <ScrollUI scrollData={scrollData} />
      </div>
      
      {/* Invisible scroll container */}
      <main className="relative z-0">
        <div className="h-[400vh]" aria-hidden="true" />
      </main>
    </>
  );
}