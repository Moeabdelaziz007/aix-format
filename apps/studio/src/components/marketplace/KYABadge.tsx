import React from 'react';
import { Crown } from 'lucide-react';
import { KYATier } from '../../lib/marketplace-api';

interface KYABadgeProps {
  tier: KYATier;
  size?: 'sm' | 'md' | 'lg';
}

export const KYABadge: React.FC<KYABadgeProps> = ({ tier, size = 'md' }) => {
  const configs = {
    0: { label: 'Tier 0', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
    1: { label: 'Tier 1', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    2: { label: 'Tier 2', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    3: { label: 'Tier 3', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    4: { label: 'Tier 4', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };

  const config = configs[tier];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <div className={`inline-flex items-center gap-1 font-medium border rounded-full ${config.color} ${sizeClasses}`}>
      {tier === 4 && <Crown className="w-3 h-3" />}
      {config.label}
    </div>
  );
};
