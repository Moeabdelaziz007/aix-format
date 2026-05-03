'use client';

import Image from 'next/image';
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Users,
  Zap,
  ExternalLink,
  ShieldCheck,
  MoreHorizontal,
  TrendingUp,
  Shield,
  Rocket,
  Activity,
  AlertCircle,
  Globe,
} from 'lucide-react';

import { AgentPet } from '@/components/shared/AgentPet';
import { KYABadge } from './sub/KYABadge';
import { TrustScore } from './sub/TrustScore';
import { RatingStars } from './sub/RatingStars';
import { PriceBadge } from './sub/PriceBadge';
import type { AgentCardProps } from './AgentCard.types';

/* ─── Status config (studio context) ─── */
const STATUS_CONFIG = {
  online:  { label: 'Online',  dot: 'status-online',  textColor: 'text-(--color-success)'  },
  offline: { label: 'Offline', dot: 'status-offline', textColor: 'text-(--color-on-surface-faint)' },
  busy:    { label: 'Busy',    dot: 'status-busy',    textColor: 'text-(--color-warning)'  },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   MARKETPLACE VIEWS
   ═══════════════════════════════════════════════════════════════════════════ */

function MarketplaceListView({ item, onClick }: { item: AgentCardProps & { context: 'marketplace' }; onClick?: () => void }) {
  const { item: data } = item;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      className="flex items-center gap-6 p-4 rounded-xl border border-(--color-border) bg-white/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="relative shrink-0">
        <img
          src={data.author.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${data.id}`}
          alt={data.name}
          className="w-16 h-16 rounded-xl object-cover bg-black/40"
        />
        {data.verified && (
          <div className="absolute -top-1 -right-1 bg-(--color-primary) rounded-full p-0.5">
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      <div className="grow min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white truncate">{data.name}</h3>
          <div className="flex items-center gap-3">
            <PriceBadge price={data.price} />
            <button className="px-4 py-1.5 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-dim) text-white text-sm font-medium transition-colors">
              Install
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-(--color-on-surface-variant)">by {data.author.name}</span>
          <KYABadge tier={data.kyaTier} size="sm" />
          <RatingStars rating={data.rating} count={data.reviewCount} />
        </div>

        <p className="text-sm text-(--color-on-surface-faint) line-clamp-1 mb-3">{data.description}</p>

        <div className="flex items-center gap-6 text-[11px] text-(--color-on-surface-variant) font-medium uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><Download size={12} /> {data.stats.downloads}</div>
          <div className="flex items-center gap-1.5"><Users size={12} /> {data.stats.users}</div>
          <div className="flex items-center gap-1.5"><Zap size={12} /> {data.stats.usage}</div>
        </div>
      </div>
    </motion.div>
  );
}

function MarketplaceGridView({ item, onClick }: { item: AgentCardProps & { context: 'marketplace' }; onClick?: () => void }) {
  const { item: data } = item;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative flex flex-col h-full rounded-2xl border border-(--color-border) bg-white/5 overflow-hidden hover:border-(--color-primary)/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Card Header/Visual */}
      <div className="relative aspect-video overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-(--color-background) via-transparent to-transparent z-10" />
        <img
          src={`https://api.dicebear.com/7.x/initials/svg?seed=${data.name}&backgroundColor=0a0a0f,3b82f6,10b981`}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
          alt={data.name}
        />
        <div className="absolute top-3 left-3 z-20">
          <KYABadge tier={data.kyaTier} />
        </div>
        <div className="absolute top-3 right-3 z-20">
          <TrustScore score={data.trustScore} />
        </div>
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
          <Image width={0} height={0} src={data.author.avatar} className="w-6 h-6 rounded-full border border-white/20" alt={data.author.name} />
          <span className="text-xs text-white/80 font-medium">{data.author.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col grow p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-(--color-primary) transition-colors line-clamp-2 leading-tight">
            {data.name}
          </h3>
        </div>

        <p className="text-sm text-(--color-on-surface-faint) mb-4 line-clamp-2 leading-relaxed">
          {data.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <RatingStars rating={data.rating} count={data.reviewCount} />
          <PriceBadge price={data.price} />
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-(--color-on-surface-faint) uppercase font-bold tracking-widest">
            <div className="flex items-center gap-1"><Download size={10} /> {data.stats.downloads}</div>
            <div className="flex items-center gap-1"><Zap size={10} /> {data.stats.usage}</div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-white transition-colors">
            Preview <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STUDIO VIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function StudioGridView({ agent, showDeploy = false, onClick }: { agent: AgentCardProps & { context?: 'studio' }; showDeploy?: boolean; onClick?: () => void }) {
  const router = useRouter();
  const { agent: data } = agent;

  const status = data.status || 'online';
  const statusConfig = STATUS_CONFIG[status];
  const color = data.color || '#6366f1';
  const successRate = data.successRate || 98.4;
  const tasksCompleted = data.tasksCompleted || 1247;
  const price = '0.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="card group relative overflow-hidden p-0"
      onClick={onClick}
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
          <AgentPet pet={data.pet} size="md" />

          <div className="flex items-center gap-2">
            {data.deployment?.status === 'deploying' ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Activity className="w-3 h-3 animate-spin" />
                Deploying
              </span>
            ) : data.deployment?.status === 'failed' ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-3 h-3" />
                Failed
              </span>
            ) : data.deployment?.status === 'deployed' ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Rocket className="w-3 h-3" />
                Deployed
              </span>
            ) : (
              <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] ${statusConfig.textColor}`}>
                <span className={`status-dot ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            )}

            {data.deployment?.status === 'deployed' && (
              <a
                href={data.deployment.endpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              className="btn btn-ghost btn-sm w-7 h-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Agent options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Info ── */}
        <Link href={`/workspace/${data.id}`} className="block group/link">
          <h3 className="text-base font-display font-bold text-white tracking-tight leading-tight group-hover/link:text-[var(--agent-color)] transition-colors">
            {data.name}
          </h3>
          <p className="text-[13px] text-(--color-on-surface-variant) mt-0.5">{data.role}</p>
        </Link>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <p className="text-[10px] text-(--color-on-surface-faint) uppercase tracking-wider mb-1">Success Rate</p>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-(--color-success)" />
              <span className="text-sm font-bold text-white tabular-nums">{successRate}%</span>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.05]">
            <p className="text-[10px] text-(--color-on-surface-faint) uppercase tracking-wider mb-1">Tasks Done</p>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-(--color-accent)" />
              <span className="text-sm font-bold text-white tabular-nums">{tasksCompleted.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto">
          <div>
            <p className="text-[10px] text-(--color-on-surface-faint) uppercase tracking-wider">Cost / Task</p>
            <p className="text-lg font-bold text-white mt-0.5 flex items-center gap-1">
              <span style={{ color }} className="text-base">π</span>
              <span className="tabular-nums">{price}</span>
            </p>
          </div>

          {showDeploy ? (
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/agents/${data.id}?action=deploy`); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all shadow-[0_10px_20px_rgba(99,102,241,0.2)]"
            >
              <Rocket className="w-3 h-3" />
              Deploy
            </button>
          ) : (
            <button
              className="agent-card-hire-btn btn btn-sm rounded-xl"
              style={{ ['--agent-color' as string]: color } as React.CSSProperties}
              aria-label={`Hire ${data.name}`}
            >
              Hire Agent
            </button>
          )}
        </div>

        {/* KYC verified hover badge */}
        {data.kyc_tier && data.kyc_tier !== 'unverified' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] px-3 py-1 rounded-full pointer-events-none"
          >
            <Shield className="w-3 h-3 text-(--color-success)" />
            <span className="text-[10px] font-semibold text-(--color-success)">AxiomID Verified</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UNIFIED AGENT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export const AgentCard = memo(function AgentCard(props: AgentCardProps) {
  const { view = 'grid', onClick } = props;

  /* ── Loading skeleton ── */
  if (props.variant === 'loading') {
    return (
      <div className="h-80 rounded-2xl bg-white/5 animate-pulse border border-(var(--color-border))" />
    );
  }

  /* ── Marketplace context ── */
  if (props.context === 'marketplace') {
    return view === 'list'
      ? <MarketplaceListView item={props} onClick={onClick} />
      : <MarketplaceGridView item={props} onClick={onClick} />;
  }

  /* ── Studio context (default) ── */
  return (
    <StudioGridView
      agent={props as AgentCardProps & { context?: 'studio' }}
      showDeploy={props.showDeploy}
      onClick={onClick}
    />
  );
});
