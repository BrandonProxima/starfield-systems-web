"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollUIProps {
  scrollData: {
    position: number;
    velocity: number;
  };
}

export default function ScrollUI({ scrollData }: ScrollUIProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    if (scrollData.position > 0.01) {
      setHasScrolled(true);
    }
    // Calculate depth in meters (arbitrary scale for effect)
    setDepth(Math.floor(scrollData.position * 10000));
  }, [scrollData.position]);

  return (
    <>

      {/* Depth indicator */}
      <motion.div
        className="fixed top-8 right-8 z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasScrolled ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/20 mb-1">
            Depth
          </p>
          <p className="text-lg font-light text-white/40 tabular-nums">
            -{depth.toString().padStart(5, '0')}m
          </p>
        </div>
      </motion.div>

      {/* Scroll progress line */}
      <motion.div
        className="fixed right-0 top-0 bottom-0 w-[1px] z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: hasScrolled ? 0.2 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-full bg-white/10">
          <motion.div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-amber-500/50 to-transparent"
            style={{
              height: `${scrollData.position * 100}%`,
            }}
          />
        </div>
      </motion.div>

    </>
  );
}