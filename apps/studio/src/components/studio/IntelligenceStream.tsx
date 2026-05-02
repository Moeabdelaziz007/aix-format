'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

const MOCK_EVENTS = [
  "CRYPTO_HS [did:aix:7f2...]: VERIFIED",
  "INTEGRITY_SIG [sha256:8b1...]: VALIDATED",
  "PROPAGATION: 'Sentinel-1' -> EDGE_NODE_04",
  "AUTH_SIG [0x4f...d2]: DEPLOYMENT_CONFIRMED",
  "ABOM_AUDIT: v1.3.2 SECURITY_PASS",
  "PEER_SYNC: POLY_MAINNET_NODE_7 CONNECTED",
  "KYC_GATE [LEVEL_2]: SESSION_UNLOCKED",
  "AXIOM_ID: PROTOCOL_SYNC_100%",
  "HANDOFF: RELAY_NODE_SIG_SUCCESS",
  "NEURAL_LATENCY: 42ms STABLE",
  "SIGNATURE: ECDSA/secp256k1 VERIFIED",
  "BOM_SCAN: NO_VULNERABILITIES_DETECTED"
];

export function IntelligenceStream() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    // Initial fill
    setEvents(MOCK_EVENTS.slice(0, 6));

    const interval = setInterval(() => {
      setEvents(prev => {
        const next = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        return [next, ...prev.slice(0, 5)];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel-heavy rounded-sm p-5 h-[350px] flex flex-col gap-4 overflow-hidden border border-white/10  relative">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/40" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/40" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/40" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/40" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 bg-primary rounded-none" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
            Sovereign Intelligence Stream
          </h3>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-primary/10 border border-primary/20">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-[9px] text-primary font-mono font-black">LIVE</span>
          </div>
          <span className="text-[9px] text-zinc-600 font-mono self-center">v4.2.0-STABLE</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-2.5 font-mono text-[10px] overflow-hidden">
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => (
            <motion.div
              key={`${event}-${i}`}
              initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="group flex items-start gap-3 p-2.5 rounded-lg  border border-white/[0.05] hover: hover:border-cyan-500/30 transition-all duration-300 cursor-default"
            >
              <div className="mt-0.5 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                {event.includes('HS') || event.includes('AUTH') ? <Shield className="w-3 h-3" /> : 
                 event.includes('BOM') ? <Cpu className="w-3 h-3" /> : 
                 <Terminal className="w-3 h-3" />}
              </div>
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-center opacity-40 group-hover:opacity-60 text-[8px]">
                  <span>SYSTEM_EVENT_{i + 1024}</span>
                  <span>{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div className="text-zinc-400 group-hover:text-white transition-colors tracking-tight">
                  {event}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ambient scanning light */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
    </div>
  );
}
