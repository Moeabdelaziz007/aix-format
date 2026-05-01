"use client";

import { motion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";
import { Badge, Button, Section, Container, Typography } from "@/components/shared";
import { Terminal, Play, Save, Share2, ShieldCheck } from "lucide-react";

export function LiveDemo() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <FadeIn className="lg:w-1/2" direction="left">
            <Badge variant="outline" className="mb-4">Interactive</Badge>
            <Typography variant="h2" className="uppercase italic mb-6 leading-tight">
              Build in <br />
              <span className="text-primary">Real-Time</span>
            </Typography>
            <Typography variant="body" className="mb-8 text-foreground/60">
              Experience the power of the AIX Studio. Define personas, connect tools via MCP, and see your agent manifest update instantly. 
              Built-in validation ensures your agent is always protocol-compliant.
            </Typography>
            
            <div className="flex flex-col gap-4">
              {[
                "Instant YAML/JSON generation",
                "Recursive ABOM tracking",
                "Live MCP server connection tests",
                "Cryptographic manifest signing"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <Typography variant="body" className="text-base sm:text-base text-white/80">{item}</Typography>
                </div>
              ))}
            </div>

            <Button className="mt-10" size="lg">
              Try the Builder
            </Button>
          </FadeIn>

          <FadeIn className="lg:w-1/2 w-full" direction="right">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-primary/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Editor Mockup */}
              <div className="relative bg-[#0d0d15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md">
                      <Terminal className="w-3 h-3 text-primary" />
                      <Typography variant="caption" className="font-mono uppercase tracking-widest text-white/40">agent-manifest.aix</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Play className="w-4 h-4 text-emerald-500 cursor-pointer hover:scale-110 transition-transform" />
                    <Save className="w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors" />
                    <Share2 className="w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 font-mono text-sm">
                  <div className="flex gap-4">
                    <div className="text-white/20 select-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <div className="text-white/80">
                      <div className="text-primary">aix_version:</div> <div className="text-emerald-400 inline">"1.2.0"</div>
                      <div className="text-primary">agent:</div>
                      <div className="pl-4">
                        <div className="text-primary">name:</div> <div className="text-emerald-400 inline">"SovereignAnalyst"</div>
                        <div className="text-primary">did:</div> <div className="text-emerald-400 inline">"did:axiom:7f2e..."</div>
                        <div className="text-primary">persona:</div>
                        <div className="pl-4 text-white/40"># AIX Personality Profile</div>
                        <div className="pl-4">
                          <div className="text-primary">instructions:</div> <div className="text-emerald-400 inline">"Analyze on-chain data..."</div>
                        </div>
                      </div>
                      <div className="text-primary">capabilities:</div>
                      <div className="pl-4">
                        <div className="text-white">- mcp:network_analysis</div>
                        <div className="text-white">- fs:read_only</div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <motion.div 
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-2 h-4 bg-primary"
                        />
                        <span className="text-white/20 italic"># Ready for deployment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floaties */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 bg-surface-3 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <Typography variant="caption" className="uppercase font-bold tracking-widest leading-none mb-1 text-white/40">Status</Typography>
                    <Typography variant="h6" className="text-xs text-white font-bold">Protocol Validated</Typography>
                  </div>
                </div>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
