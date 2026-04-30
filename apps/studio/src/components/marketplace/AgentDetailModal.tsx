'use client';

import React, { useState } from 'react';
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
          className="absolute inset-0 bg-[#050508]/90 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a0f] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
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
              className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-all"
            >
              <X size={20} />
            </button>

            <div className="absolute bottom-6 left-8 right-8 z-20 flex items-end justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl border-2 border-white/10 overflow-hidden bg-black shadow-2xl">
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
            {activeTab === 'overview' && (
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2 space-y-8">
                  <section>
                    <h3 className="text-lg font-bold mb-4">About this {item.type}</h3>
                    <p className="text-white/60 leading-relaxed text-lg">
                      {item.description}
                      <br /><br />
                      This autonomous agent is built using the latest AIX v1.3 standard, ensuring maximum interoperability and security. It leverages decentralized identity (DID) for authentication and provides a transparent Bill of Materials (ABOM) for full supply chain visibility.
                    </p>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-bold mb-4">Key Capabilities</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Self-sovereign execution', 'End-to-end encryption', 'Real-time validation', 'Multi-chain support'].map((cap, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <span className="text-sm font-medium">{cap}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">Deployment</h4>
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">License</span>
                        <span className="text-white">Apache-2.0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Last Updated</span>
                        <span className="text-white">2 days ago</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Version</span>
                        <span className="text-white">v1.2.4</span>
                      </div>
                    </div>
                    <button className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                      <Download size={18} /> Install to Studio
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-black/20">
                        <div className="text-xl font-bold text-white">{item.stats.downloads}</div>
                        <div className="text-[10px] uppercase font-bold text-white/20">Installs</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-black/20">
                        <div className="text-xl font-bold text-white">{item.stats.usage}</div>
                        <div className="text-[10px] uppercase font-bold text-white/20">Calls</div>
                      </div>
                    </div>
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
          <div className="flex-shrink-0 px-8 py-6 border-t border-white/5 bg-black/40 flex items-center justify-between">
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
              <button className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20">
                Install Component
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
