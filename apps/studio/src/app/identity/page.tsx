'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/design-system/components';
import { 
  ShieldCheck, 
  Key, 
  Fingerprint, 
  Lock, 
  UserCheck, 
  Globe, 
  ArrowUpRight,
  ShieldAlert,
  History,
  FileCode,
  QrCode,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function IdentityManagerPage() {
  const [kycStatus, setKycStatus] = useState('Tier 2 (Verified)');

  const kycTiers = [
    { level: 'Tier 0', label: 'Unverified', status: 'Incomplete', color: 'zinc' },
    { level: 'Tier 1', label: 'Basic KYC', status: 'Verified', color: 'emerald' },
    { level: 'Tier 2', label: 'Advanced KYC', status: 'Verified', color: 'primary' },
    { level: 'Tier 3', label: 'Institutional', status: 'Pending', color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase flex items-center gap-4">
                Identity Manager
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase italic tracking-widest bg-primary/5">AxiomID did:axiom</Badge>
             </h1>
             <p className="text-[var(--color-on-surface-variant)] text-sm">Manage your sovereign DID, KYC tiers, and cryptographic signing keys.</p>
          </div>
          <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all">
             <QrCode size={18} /> Reveal AxiomID QR
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* DID Card */}
           <div className="lg:col-span-8 glass-panel-heavy p-10 rounded-[3rem] border-white/5 bg-black/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <Fingerprint size={200} className="text-primary" />
              </div>
              
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                       <UserCheck className="text-primary" size={32} />
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Primary Sovereign Identity</div>
                       <div className="text-2xl font-black text-white italic tracking-tight">Pioneer_Abdelaziz.did</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Public Identifier (DID)</div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                       <code className="text-xs text-zinc-400 font-mono flex-1">did:axiom:axiomid.app:8b5cf6...ec4899</code>
                       <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Copy</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                       <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Authored Agents</div>
                       <div className="text-2xl font-black text-white italic">14</div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                       <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Signatures</div>
                       <div className="text-2xl font-black text-white italic">1,284</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* KYC Tiers */}
           <div className="lg:col-span-4 glass-panel-heavy p-8 rounded-[3rem] border-white/5 bg-black/40 space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400" size={18} />
                    KYC Status
                 </h3>
                 <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 italic">Verified</Badge>
              </div>

              <div className="space-y-3">
                 {kycTiers.map((tier, i) => (
                   <div key={i} className={cn(
                     "p-4 rounded-2xl border flex items-center justify-between transition-all",
                     tier.status === 'Verified' ? "bg-emerald-500/5 border-emerald-500/10" : tier.status === 'Pending' ? "bg-amber-500/5 border-amber-500/10" : "bg-white/[0.02] border-white/5"
                   )}>
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-1.5 h-1.5 rounded-full",
                           tier.status === 'Verified' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : tier.status === 'Pending' ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-zinc-700"
                         )} />
                         <div>
                            <div className="text-[10px] font-black text-white uppercase">{tier.level}</div>
                            <div className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{tier.label}</div>
                         </div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        tier.status === 'Verified' ? "text-emerald-400" : tier.status === 'Pending' ? "text-amber-400" : "text-zinc-700"
                      )}>{tier.status}</span>
                   </div>
                 ))}
              </div>

              <button className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all">
                 Upgrade to Tier 3
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Signing Keys */}
           <div className="glass-panel-heavy p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center gap-3 text-primary">
                 <Key size={18} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em]">Signing Keys</h3>
              </div>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Ed25519 Active</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] border-emerald-500/20">Secure</Badge>
                 </div>
                 <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">Rotate Keys</button>
              </div>
           </div>

           {/* ABOM scanner */}
           <div className="glass-panel-heavy p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center gap-3 text-purple-mcp">
                 <ShieldAlert size={18} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em]">ABOM Scanner</h3>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest">Audit your agent manifests for supply chain vulnerabilities.</p>
              <button className="w-full py-3 rounded-xl bg-purple-mcp/10 border border-purple-mcp/20 text-purple-mcp font-black text-[9px] uppercase tracking-widest hover:bg-purple-mcp/20 transition-all">Run Security Scan</button>
           </div>

           {/* History */}
           <div className="glass-panel-heavy p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-6">
              <div className="flex items-center gap-3 text-zinc-400">
                 <History size={18} />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em]">Trust History</h3>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-600">KYC Verified</span>
                    <span className="text-white font-bold">2 days ago</span>
                 </div>
                 <div className="flex justify-between items-center text-[9px]">
                    <span className="text-zinc-600">DID Registered</span>
                    <span className="text-white font-bold">14 days ago</span>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
