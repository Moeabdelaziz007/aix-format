'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Download, Users, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { MarketplaceItem } from '../../lib/marketplace-api';
import { KYABadge } from './KYABadge';
import { TrustScore } from './TrustScore';
import { RatingStars } from './RatingStars';

interface AgentCardProps {
  item: MarketplaceItem;
  view?: 'grid' | 'list';
  onClick?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ item, view = 'grid', onClick }) => {
  const isGrid = view === 'grid';

  if (!isGrid) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        className="flex items-center gap-6 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="relative flex-shrink-0">
          <img
            src={item.author.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`}
            alt={item.name}
            className="w-16 h-16 rounded-xl object-cover bg-black/40"
          />
          {item.verified && (
            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-white truncate">{item.name}</h3>
            <div className="flex items-center gap-3">
              <PriceBadge price={item.price} />
              <button className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                Install
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-white/60">by {item.author.name}</span>
            <KYABadge tier={item.kyaTier} size="sm" />
            <RatingStars rating={item.rating} count={item.reviewCount} />
          </div>

          <p className="text-sm text-white/40 line-clamp-1 mb-3">{item.description}</p>

          <div className="flex items-center gap-6 text-[11px] text-white/60 font-medium uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><Download size={12} /> {item.stats.downloads}</div>
            <div className="flex items-center gap-1.5"><Users size={12} /> {item.stats.users}</div>
            <div className="flex items-center gap-1.5"><Zap size={12} /> {item.stats.usage}</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative flex flex-col h-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Card Header/Visual */}
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}&backgroundColor=0a0a0f,3b82f6,10b981`}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          alt={item.name}
        />
        <div className="absolute top-3 left-3 z-20">
          <KYABadge tier={item.kyaTier} />
        </div>
        <div className="absolute top-3 right-3 z-20">
          <TrustScore score={item.trustScore} />
        </div>
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
          <img src={item.author.avatar} className="w-6 h-6 rounded-full border border-white/20" alt={item.author.name} />
          <span className="text-xs text-white/80 font-medium">{item.author.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
            {item.name}
          </h3>
        </div>

        <p className="text-sm text-white/40 mb-4 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <RatingStars rating={item.rating} count={item.reviewCount} />
          <PriceBadge price={item.price} />
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-bold tracking-widest">
            <div className="flex items-center gap-1"><Download size={10} /> {item.stats.downloads}</div>
            <div className="flex items-center gap-1"><Zap size={10} /> {item.stats.usage}</div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white transition-colors">
            Preview <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const PriceBadge: React.FC<{ price: MarketplaceItem['price'] }> = ({ price }) => {
  if (price.type === 'free') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Free</span>;
  }
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs font-bold text-white">
        {price.amount} {price.currency}
      </span>
      <span className="text-[10px] text-white/40 uppercase tracking-tighter">/{price.unit}</span>
    </div>
  );
};
