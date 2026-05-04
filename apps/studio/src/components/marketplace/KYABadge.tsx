import React from 'react';
import { Crown, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { KYATier } from '../../lib/marketplace-api';

interface KYABadgeProps {
  tier: KYATier;
  size?: 'sm' | 'md' | 'lg';
}

export const KYABadge: React.FC<KYABadgeProps> = ({ tier, size = 'md' }) => {
  const configs = {
    0: { label: 'Unverified', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: ShieldAlert },
    1: { label: 'Basic KYC', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Shield },
    2: { label: 'Full KYC', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: ShieldCheck },
    3: { label: 'Sovereign', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Crown },
    4: { label: 'Sovereign+', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Crown },
  };

  const config = configs[tier] || configs[0];
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-[11px]';

  return (
    <div className={`inline-flex items-center gap-1.5 font-bold border rounded-full  uppercase tracking-wider ${config.color} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      {config.label}
    </div>
  );
};
