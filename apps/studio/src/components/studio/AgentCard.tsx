'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BrainCircuit, 
  MoreHorizontal, 
  TrendingUp, 
  Zap, 
  Shield,
  Rocket
} from 'lucide-react';
import { AgentRecord } from '@/lib/types';

interface Props {
  agent: AgentRecord;
  showDeploy?: boolean;
}

// ─── Status config — stable, defined outside component ───────────────────────
const STATUS_CONFIG = {
  online:  { label: 'Online',  dot: 'status-online',  textColor: 'text-[var(--color-success)]'  },
  offline: { label: 'Offline', dot: 'status-offline', textColor: 'text-[var(--color-on-surface-faint)]' },
  busy:    { label: 'Busy',    dot: 'status-busy',    textColor: 'text-[var(--color-warning)]'  },
} as const;

export const AgentCard = memo(function AgentCard({
  agent,
  showDeploy = false,
}: Props) {
  const router = useRouter();
  
  const status = agent.status || 'online';
  const statusConfig = STATUS_CONFIG[status];
  const color = agent.color || '#6366f1';
  const successRate = agent.successRate || 98.4;
  const tasksCompleted = agent.tasksCompleted || 1247;
  const price = '0.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="card group relative overflow-hidden p-0"
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      {/* Ambient background glow */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10 p-6 flex flex-col gap-5">

        {/* ── Top row ── */}
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0"
            style={{
              background:  `linear-gradient(135deg, ${color}18, ${color}30)`,
              borderColor: `${color}30`,
              boxShadow:   `0 0 16px ${color}20`,
            }}
          >
            <BrainCircuit className="w-6 h-6" style={{ color }} />
          </div>

          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] ${statusConfig.textColor}`}>
              <span className={`status-dot ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <button
              className="btn btn-ghost btn-sm w-7 h-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Agent options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Info ── */}
        <Link href={`/agents/${agent.id}`} className="block group/link">
          <h3 className="text-base font-display font-bold text-white tracking-tight leading-tight group-hover/link:text-[var(--agent-color)] transition-colors">{agent.name}</h3>
          <p className="text-[13px] text-[var(--color-on-surface-variant)] mt-0.5">{agent.role}</p>
        </Link>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <p className="text-[10px] text-[var(--color-on-surface-faint)] uppercase tracking-wider mb-1">Success Rate</p>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--color-success)]" />
              <span className="text-sm font-bold text-white tabular-nums">{successRate}%</span>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <p className="text-[10px] text-[var(--color-on-surface-faint)] uppercase tracking-wider mb-1">Tasks Done</p>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span className="text-sm font-bold text-white tabular-nums">{tasksCompleted.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto">
          <div>
            <p className="text-[10px] text-[var(--color-on-surface-faint)] uppercase tracking-wider">Cost / Task</p>
            <p className="text-lg font-bold text-white mt-0.5 flex items-center gap-1">
              <span style={{ color }} className="text-base">π</span>
              <span className="tabular-nums">{price}</span>
            </p>
          </div>

          {showDeploy ? (
            <button
              onClick={() => router.push(`/agents/${agent.id}?action=deploy`)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
            >
              <Rocket className="w-3 h-3" />
              Deploy
            </button>
          ) : (
            <button
              className="agent-card-hire-btn btn btn-sm rounded-xl"
              style={{
                ['--agent-color' as string]: color,
              } as React.CSSProperties}
              aria-label={`Hire ${agent.name}`}
            >
              Hire Agent
            </button>
          )}
        </div>

        {/* KYC verified hover badge */}
        {agent.kyc_tier && agent.kyc_tier !== 'unverified' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] px-3 py-1 rounded-full pointer-events-none"
          >
            <Shield className="w-3 h-3 text-[var(--color-success)]" />
            <span className="text-[10px] font-semibold text-[var(--color-success)]">AxiomID Verified</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

