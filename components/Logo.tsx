"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Logo() {
  return (
    <motion.div
      className="absolute top-8 left-8 z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      {/* Using the gradient logo image provided */}
      <Image
        src="/starfield-systems-logo.png"
        alt="Starfield Systems"
        width={280}
        height={60}
        className="w-auto h-10 md:h-12"
        priority
      />
    </motion.div>
  );
}