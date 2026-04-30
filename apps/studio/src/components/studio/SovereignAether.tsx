'use client';

import { motion } from 'framer-motion';

export function SovereignAether() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050507]">
      {/* Animated Mesh */}
      <div className="absolute inset-0 sovereign-mesh opacity-30" />

      {/* Radial Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px]"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/10 blur-[120px]"
      />

      {/* Subtle Noise/Grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
