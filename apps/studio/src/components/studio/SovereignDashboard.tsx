import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * 🦅 [SOVEREIGN_COMPONENT]: SovereignDashboard
 * [AI_COGNITIVE_FOOTPRINT]: {
 *   "role": "Visual Sovereign Observer",
 *   "behavior": "Visualizes the structural and financial health of AIX-Format.",
 *   "design": "Cairo Cyberpunk - Vibrant, Glassmorphic, Alive"
 * }
 */
export const SovereignDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sovereignty/status');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Sovereign API failure', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;
  const { health, gear, auditTrail } = data;

  const isLocked = typeof window !== 'undefined' && !localStorage.getItem('axiom-id');
  const isGlitching = health < 95;

  if (isLocked) {
    return (
      <div className={`bg-white/5 backdrop-blur-3xl p-12 rounded-[40px] border ${isGlitching ? 'border-red-500 animate-pulse' : 'border-red-500/20'} text-center`}>
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest">Sovereign Node Locked</h2>
        <p className="text-white/40 text-sm mt-2">Authentication via AxiomID Required to View Topological Health.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-8 font-['Inter']">
      {/* 🌌 Header - Made with Soul */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12 border-b border-white/10 pb-6"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-[#ff3e00] to-[#00f2ff] bg-clip-text text-transparent">
            AIX SOVEREIGNTY NODE
          </h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest">Built with Moe Abdelaziz — Made with Soul</p>
        </div>
        
        <div className="flex gap-4">
          <div className={`px-4 py-2 rounded-full border ${gear === 'SOVEREIGN' ? 'border-[#00f2ff] text-[#00f2ff]' : 'border-white/20 text-white/40'} text-xs font-bold tracking-widest`}>
            {gear} GEAR ACTIVE
          </div>
        </div>
      </motion.div>

      {/* 🏗️ Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 📊 Health Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">🛡️</div>
          <h2 className="text-white/60 text-xs font-bold uppercase mb-4">Topological Health</h2>
          <div className="text-6xl font-black text-[#00f2ff]">{health}%</div>
          <div className="w-full bg-white/10 h-1 mt-4 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${health}%` }}
              className="bg-[#00f2ff] h-full"
            />
          </div>
        </motion.div>

        {/* 🌀 Rounds Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10"
        >
          <h2 className="text-white/60 text-xs font-bold uppercase mb-4">Sovereign Rounds</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-[#ff3e00]">{data.currentRound || 0}</span>
            <span className="text-white/20 font-bold">/ 69</span>
          </div>
          <div className="text-[10px] text-white/40 mt-4 uppercase tracking-widest font-mono">
            Protocol: Sovereign Stress Test 
          </div>
        </motion.div>

        {/* 📜 Audit Log Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 md:col-span-1"
        >
          <h2 className="text-white/60 text-xs font-bold uppercase mb-4">TrustChain Audit</h2>
          <div className="space-y-3 mt-4">
            {auditTrail.map((log: any, i: number) => (
              <div key={i} className={`text-[10px] font-mono opacity-80 ${log.level === 'warning' ? 'text-[#ff3e00]' : log.level === 'success' ? 'text-[#39ff14]' : 'text-[#00f2ff]'}`}>
                [{log.time}] {log.event}
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* 💠 Soul Signature */}
      <div className="fixed bottom-8 right-8 opacity-20 text-[10px] font-mono tracking-[0.5em] uppercase pointer-events-none">
        Aix-Format v2.0 // Quantum-Sovereign-Loop
      </div>
    </div>
  );
};
