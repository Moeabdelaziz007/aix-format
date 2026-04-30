'use client';

import React from 'react';
import { SlidersHorizontal, ChevronDown, Check } from 'lucide-react';

export const FilterSidebar: React.FC = () => {
  return (
    <aside className="w-72 flex-shrink-0 space-y-8 pr-8 border-r border-white/5 h-fit sticky top-24">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
          <SlidersHorizontal size={14} /> Filters
        </h2>
        <button className="text-xs font-bold text-blue-400 hover:text-blue-300">Clear All</button>
      </div>

      <FilterGroup title="KYA Tier">
        {[0, 1, 2, 3, 4].map(tier => (
          <Checkbox key={tier} label={`Tier ${tier}`} count={tier === 4 ? 12 : 45} />
        ))}
      </FilterGroup>

      <FilterGroup title="Pricing">
        <Checkbox label="Free" count={120} />
        <Checkbox label="Pay-per-call" count={45} />
        <Checkbox label="Subscription" count={22} />
      </FilterGroup>

      <FilterGroup title="Security">
        <Checkbox label="Verified Only" />
        <Checkbox label="SLSA L3" />
        <Checkbox label="DID Compatible" />
      </FilterGroup>

      <FilterGroup title="Network">
        <Checkbox label="Axiom" defaultChecked />
        <Checkbox label="Pi Network" />
        <Checkbox label="Solana" />
        <Checkbox label="Ethereum" />
      </FilterGroup>
    </aside>
  );
};

const FilterGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between cursor-pointer group">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
      <ChevronDown size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
    </div>
    <div className="space-y-3 pl-1">
      {children}
    </div>
  </div>
);

const Checkbox: React.FC<{ label: string; count?: number; defaultChecked?: boolean }> = ({ label, count, defaultChecked }) => (
  <label className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${defaultChecked ? 'bg-blue-500 border-blue-500' : 'border-white/10 bg-white/5 group-hover:border-white/30'}`}>
        {defaultChecked && <Check size={10} className="text-white" />}
      </div>
      <span className="text-sm text-white/60 group-hover:text-white transition-colors">{label}</span>
    </div>
    {count !== undefined && <span className="text-[10px] font-bold text-white/20">{count}</span>}
  </label>
);
