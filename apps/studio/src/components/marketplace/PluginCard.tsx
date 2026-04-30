'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plug, Shield, Download } from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';

interface PluginCardProps {
  item: MarketplaceItem;
  onClick?: () => void;
}

export const PluginCard: React.FC<PluginCardProps> = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      whileHover={{ scale: 0.98 }}
      onClick={onClick}
      className="p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent hover:from-blue-500/10 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <Plug size={20} />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
          <Shield size={12} /> Sandboxed
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{item.name}</h3>
      <span className="text-[10px] text-white/40 font-medium mb-3 block">v1.0.2 • Compatible with AIX 1.3</span>
      
      <p className="text-xs text-white/60 mb-6 line-clamp-2">
        {item.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">
            P
          </div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Extension</span>
        </div>
        <button className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all">
          <Download size={14} />
        </button>
      </div>
    </motion.div>
  );
};
