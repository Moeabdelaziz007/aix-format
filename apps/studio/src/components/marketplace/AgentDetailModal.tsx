'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Share2, 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Lock,
  Cpu,
  Star
} from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';
import { KYABadge } from './KYABadge';
import { TrustScore } from './TrustScore';
import { RatingStars } from './RatingStars';
import { InfoTooltip } from '@/components/shared';

interface AgentDetailModalProps {
  item: MarketplaceItem | null;
  onClose: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!item) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'security', label: 'Security' },
    { id: 'abom', label: 'ABOM' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050508]/90 "
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden [0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header */}
          <div className="relative h-64 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent z-10" />
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}&backgroundColor=0a0a0f`}
              className="w-full h-full object-cover"
              alt=""
            />
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-20 p-2 rounded-full  hover:bg-black/60 text-white/60 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            <div className="absolute bottom-6 left-8 right-8 z-20 flex items-end justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-white/10 overflow-hidden bg-black ">
                  <img src={item.author.avatar} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{item.name}</h2>
                    <KYABadge tier={item.kyaTier} size="lg" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/60">by <span className="text-white font-medium">{item.author.name}</span></span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <RatingStars rating={item.rating} count={item.reviewCount} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <TrustScore score={item.trustScore} size={60} />
                <div className="text-right">
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Trust Score</div>
                  <div className="text-sm font-bold text-emerald-400">Highly Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 px-8 border-b border-white/5 bg-black/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-bold tracking-wider uppercase transition-all relative ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'features' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Cpu size={20} className="text-blue-500" />
                      Technical DNA
                    </h3>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Core Model</span>
                        <Badge variant="outline">{item.type === 'agent' ? 'Mistral-Large-v2' : 'N/A'}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Context Window</span>
                        <span className="text-sm font-mono">128k Tokens</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Registry Status</span>
                        <span className="text-xs font-bold text-emerald-400 uppercase">Anchored</span>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Star size={20} className="text-yellow-500" />
                      Included Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['Network Scanner', 'ZK-Verifier', 'JSON-Parser', 'Identity-Adapter'].map((skill) => (
                        <div key={skill} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase">
                          {skill}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold">Raw Manifest Preview</h3>
                     <button className="text-[10px] font-black uppercase text-blue-500 hover:underline">Copy DNA</button>
                   </div>
                   <div className="p-6 rounded-2xl bg-black/60 border border-white/10 font-mono text-[11px] leading-relaxed text-zinc-400 overflow-x-auto">
                     <pre>
{`meta:
  name: ${item.name}
  version: 1.3.1
  author: ${item.author.name}
identity_layer:
  provider: pi_network
  kyc_tier: ${item.kyaTier}
economics:
  pricing_model: pay_per_call
  settlement:
    layer: pi_network
    currency: PI`}
                     </pre>
                   </div>
                </section>
              </div>
            )}

            {activeTab === 'abom' && (
              <div className="space-y-8">
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Supply Chain Transparency</h4>
                    <p className="text-white/60 text-sm">
                      This Agent Bill of Materials (ABOM) discloses all third-party models and data sources used.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Dependencies</h4>
                    <div className="space-y-3">
                      {[
                        { name: "Sovereign-SDK-v4", type: "Framework", hash: "sha256:4f8e..." },
                        { name: "Axiom-Security-Core", type: "Security", hash: "sha256:7d2a..." },
                        { name: "Pi-KYC-Adapter", type: "Identity", hash: "sha256:1c9b..." }
                      ].map((dep, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-white">{dep.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase font-black">{dep.type}</div>
                          </div>
                          <code className="text-[9px] text-zinc-600">{dep.hash}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Model Provenance</h4>
                    <div className="p-6 rounded-2xl  border border-white/10 space-y-4">
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-white/60">Model Provider</span>
                         <span className="text-sm font-bold text-white">Mistral AI</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-white/60">Training Data</span>
                         <span className="text-sm font-bold text-emerald-400">Public Domain</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm text-white/60">Alignment</span>
                         <span className="text-sm font-bold text-white">Constitutional AI</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'pricing' && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                  <Star size={40} className="text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Usage-Based Settlement</h3>
                <p className="text-white/40 max-w-sm mb-8 leading-relaxed">
                  This component uses the AIX Economics Layer for real-time M2M payments.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                   <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                     <div className="text-[10px] font-black text-zinc-500 uppercase mb-1">Current Oracle Price</div>
                     <div className="text-2xl font-bold text-white">{oracleData ? Number(oracleData.currentPrice).toFixed(4) : '...'}π</div>
                   </div>
                   <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                     <div className="text-[10px] font-black text-zinc-500 uppercase mb-1">Price Impact (Buy 10)</div>
                     {/* Simplified preview assuming a small change for 10 units for UI display */}
                     <div className="text-2xl font-bold text-white">+{oracleData ? '0.01' : '...'}%</div>
                   </div>
                </div>
              </div>
            )}
{activeTab === 'security' && (
              <div className="space-y-8">
                <div className="flex items-start gap-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <Shield size={32} className="text-emerald-500" />
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">Security Audit Passed</h4>
                    <p className="text-white/60 text-sm">
                      This agent has been audited by the AIX Security Foundation and meets SLSA Level {item.slsaLevel || 1} requirements. All code signatures are valid and verified.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Verification Artifacts</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'SHA-256 Checksum', status: 'Verified', icon: Code2 },
                        { label: 'Developer Signature', status: 'Valid (Axiom ID)', icon: Lock },
                        { label: 'Resource Quotas', status: 'Enforced', icon: Cpu },
                      ].map((art, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                          <div className="flex items-center gap-3">
                            <art.icon size={18} className="text-white/40" />
                            <span className="text-sm font-medium">{art.label}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-400">{art.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Compliance</h4>
                    <div className="p-6 rounded-2xl border border-white/5 bg-black/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">W3C DID Compatible</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Sovereign Data Storage</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60">Zero-Trust Architecture</span>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-6 border-t border-white/5  flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-white transition-colors">
                <Share2 size={16} /> Share
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-white/40 hover:text-red-400 transition-colors">
                <AlertTriangle size={16} /> Report
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-bold text-white/40 uppercase">Pricing</div>
                <div className="text-lg font-bold text-white">
                  {item.price.type === 'free' ? 'FREE' : `${item.price.amount} ${item.price.currency}`}
                </div>
              </div>
              <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all  /20">
                Install Component
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
