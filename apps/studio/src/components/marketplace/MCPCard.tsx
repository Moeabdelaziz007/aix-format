'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Box, Shield, ShieldAlert, ShieldCheck, Download } from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';

interface MCPCardProps {
  item: MarketplaceItem;
  onClick?: () => void;
}

export const MCPCard: React.FC<MCPCardProps> = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="p-5 rounded-2xl border border-white/10 bg-[#0f111a] hover:border-emerald-500/50 transition-all cursor-pointer group shadow-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Box size={24} />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase">Verified</span>
          </div>
          <div className="text-[10px] text-white/20 font-bold uppercase mt-1">Risk Score: 12</div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
      <p className="text-sm text-white/40 mb-6 line-clamp-2">{item.description}</p>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
          Capabilities
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Read DB', 'Vector Search', 'Auth'].map(cap => (
            <span key={cap} className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-[9px] font-bold uppercase">
              {cap}
            </span>
          ))}
        </div>
      </div>

      <button className="w-full py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold transition-all border border-emerald-500/20">
        Add to Agent
      </button>
    </motion.div>
  );
};
