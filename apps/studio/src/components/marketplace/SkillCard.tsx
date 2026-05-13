'use client';

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, Download, Cpu, ExternalLink } from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';
import { RatingStars } from './RatingStars';

interface SkillCardProps {
  item: MarketplaceItem;
  onClick?: () => void;
}

export const SkillCard: React.FC<SkillCardProps> = ({ item, onClick }) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="p-5 rounded-2xl border border-white/10 bg-white/5 hover:border-purple-500/50 hover: transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <FileCode size={24} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Skill Type</span>
          <span className="text-xs font-bold text-white">Python Module</span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-2 truncate">
        {item.name}
      </h3>
      
      <p className="text-sm text-white/40 line-clamp-2 mb-6">
        {item.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <RatingStars rating={item.rating} count={item.reviewCount} size={12} />
        <span className="text-[10px] font-bold text-white/20 uppercase">~50 Tokens Base</span>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Image width={0} height={0} src={item.author.avatar} className="w-5 h-5 rounded-full" alt="" />
          <span className="text-xs text-white/40">{item.author.name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
          <Download size={10} /> {item.stats.downloads}
        </div>
      </div>
    </motion.div>
  );
};
