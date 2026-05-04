'use client';

import { motion } from 'framer-motion';

export function SovereignAether() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050507]">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 opacity-20"
           style={{
             backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
             backgroundSize: '40px 40px'
           }}
      />
      
      {/* Primary Ambient Glows */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full bg-cyan-500/10 blur-[150px]"
      />
      
      <motion.div 
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, -60, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-purple-600/10 blur-[150px]"
      />

      {/* Tertiary Accent Glow */}
      <motion.div
        animate={{
          opacity: [0, 0.3, 0],
          scale: [0.8, 1.1, 0.8],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
        className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]"
      />

      {/* Scanning Line Effect */}
      <motion.div
        animate={{
          y: ['-100%', '200%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-10"
      />

      {/* Noise/Grain Texture */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient(circle, transparent 40%, #050507 100%)" />
    </div>
  );
}
