'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_EVENTS = [
  "Inbound Handshake: did:aix:7f2... Verified",
  "Manifest integrity check: sha256:8b1... PASSED",
  "Agent 'Sentinel-1' propagated to edge-node-04",
  "Sovereign identity '0x4f...d2' authorized deployment",
  "ABOM validation complete for v1.3.2",
  "New peer connection established: poly-mainnet-7",
  "Cryptographic signature verified: ECDSA/secp256k1",
  "Agentic KYC Level 2: UNLOCKED for session",
  "Axiom ID protocol sync: 100%",
  "Relay node handoff successful"
];

export function IntelligenceStream() {
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    // Initial fill
    setEvents(MOCK_EVENTS.slice(0, 5));

    const interval = setInterval(() => {
      setEvents(prev => {
        const next = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        return [next, ...prev.slice(0, 4)];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-4 h-[300px] flex flex-col gap-3 overflow-hidden border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
          Intelligence Stream
        </h3>
        <span className="text-[10px] text-zinc-600 font-mono">LIVE_FEED_v4.2</span>
      </div>

      <div className="flex-1 flex flex-col gap-2 font-mono text-[11px]">
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => (
            <motion.div
              key={`${event}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="p-2 rounded bg-white/5 border border-white/5 text-zinc-400 hover:text-cyan-300 transition-colors cursor-default"
            >
              <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              {event}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
