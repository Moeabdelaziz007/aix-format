'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Terminal, Lock, Zap } from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';

interface APICardProps {
  item: MarketplaceItem;
  onClick?: () => void;
}

export const APICard: React.FC<APICardProps> = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="p-5 rounded-2xl border border-white/10 bg-black/40 hover:border-blue-400/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Globe size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
            {item.name}
          </h3>
          <span className="text-[10px] font-bold text-white/40 uppercase">API Provider</span>
        </div>
      </div>

      <p className="text-xs text-white/60 mb-6 line-clamp-2 leading-relaxed">
        {item.description}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[9px] font-bold text-white/20 uppercase mb-1">Auth Type</span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/80">
            <Lock size={10} /> OAuth2
          </div>
        </div>
        <div className="flex flex-col p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[9px] font-bold text-white/20 uppercase mb-1">Latency</span>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400">
            <Zap size={10} /> ~120ms
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button className="flex-grow py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase transition-all">
          Docs
        </button>
        <button className="flex items-center justify-center p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">
          <Terminal size={14} />
        </button>
      </div>
    </motion.div>
  );
};
