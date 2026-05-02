'use client';

import { motion } from 'framer-motion';

export function SovereignAether() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-surface">
      {/* Infrastructure Blueprint Grid */}
      <div className="absolute inset-0 blueprint-grid opacity-10" />
      
      {/* Primary Infrastructure Pulsations */}
      <motion.div 
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px]" 
      />
      
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-mcp/10 blur-[120px]" 
      />

      {/* Vertical Data Stream Sync Line */}
      <motion.div
        animate={{
          y: ['-100%', '200%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10"
      />

      {/* Infrastructure Scanline Overlay */}
      <div className="absolute inset-0 scanline pointer-events-none opacity-20" />
      
      {/* System Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,var(--color-surface)_100%)]" />
    </div>
  );
}
