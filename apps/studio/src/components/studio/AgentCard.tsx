import React from 'react';

interface AgentCardProps {
  name: string;
  role: string;
  price: string;
  status: 'online' | 'offline';
  color: string;
}

export function AgentCard({ name, role, price, status, color }: AgentCardProps) {
  return (
    <div className="glass-panel p-6 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer" style={{ borderColor: `${color}40` }}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)]">{role}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
          status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
          {status}
        </div>
      </div>

      <div className="flex justify-between items-end mt-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">Execution Cost</p>
          <p className="text-lg font-mono text-white flex items-center gap-1">
            <span style={{ color }}>π</span> {price} <span className="text-xs text-gray-500">/ query</span>
          </p>
        </div>

        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[rgba(20,20,30,0.6)] border border-[var(--color-border)]">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
        </div>
      </div>
    </div>
  );
}
