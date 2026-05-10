import { secureRandom } from "@/lib/security-core";
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ParticleBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, []).map((_, i) => ({
      id: i,
      x: secureRandom() * 100,
      y: secureRandom() * 100,
      size: secureRandom() * 3 + 1,
      duration: secureRandom() * 20 + 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20 blur-[1px]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            x: [0, secureRandom() * 100 - 50, 0],
            y: [0, secureRandom() * 100 - 50, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
    </div>
  );
}
