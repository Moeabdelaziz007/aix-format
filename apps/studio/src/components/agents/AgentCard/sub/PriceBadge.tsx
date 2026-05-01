'use client';

import React from 'react';
import type { MarketplaceItem } from '@/lib/marketplace-api';

interface PriceBadgeProps {
  price: MarketplaceItem['price'];
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({ price }) => {
  if (price.type === 'free') {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-(--color-success)/20 text-(--color-success) uppercase tracking-wider">
        Free
      </span>
    );
  }
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs font-bold text-white">
        {price.amount} {price.currency}
      </span>
      <span className="text-[10px] text-(--color-on-surface-faint) uppercase tracking-tighter">
        /{price.unit}
      </span>
    </div>
  );
};
