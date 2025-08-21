"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-white/40 tracking-widest uppercase">
          Initializing
        </p>
      </motion.div>
    </div>
  );
}