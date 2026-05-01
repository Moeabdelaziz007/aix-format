"use client";

import { motion } from "framer-motion";
import { Button, Typography, Container, Section } from "@/design-system/components";
import { ParticleBackground } from "@/components/animations/ParticleBackground";
import { Rocket, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <Section padding="none" className="relative min-h-[70vh] flex flex-col items-center justify-center pt-32 overflow-hidden bg-background">
      <ParticleBackground />

      <Container className="relative z-10 text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <Typography variant="h1" className="uppercase italic tracking-tighter text-white">
            Build Sovereign AI Agents <br />
            <span className="text-primary italic">In 60 Seconds</span>
          </Typography>
          
          <div className="flex flex-col gap-2">
             <Typography variant="h4" className="text-zinc-500 uppercase font-black tracking-widest italic">
                Define. Sign. Deploy. Monetize.
             </Typography>
             <Typography variant="body" className="max-w-2xl mx-auto text-zinc-600 font-medium uppercase text-xs tracking-widest">
                The open standard for KYC-verified autonomous agents.
             </Typography>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-2xl px-10 py-8 text-black font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_20px_50px_rgba(0,219,233,0.3)] hover:scale-105 transition-all"
          >
            <Rocket className="w-5 h-5" />
            <Link href="/builder">Get Started — Free</Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="lg" 
            className="rounded-2xl px-10 py-8 text-white font-black uppercase tracking-widest flex items-center gap-3 border border-white/5 hover:bg-white/5 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            <Link href="/docs">Read Docs</Link>
          </Button>
        </motion.div>
      </Container>
      
      {/* Visual accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
    </Section>
  );
}
