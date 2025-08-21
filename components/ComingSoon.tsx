"use client";

import { motion } from "framer-motion";

export default function ComingSoon() {
  return (
    <motion.div
      className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 1 }}
    >
      <p className="text-sm font-display font-bold italic tracking-[0.3em] text-white/60 uppercase dissolve-shadow">
        Coming Soon
      </p>
    </motion.div>
  );
}