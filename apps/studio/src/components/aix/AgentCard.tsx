import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import { Shield, Languages, Cpu, Hash, BadgeCheck, Clock, AlertTriangle } from "lucide-react";
import type { LoadedAgent } from "@/lib/aix/schema";
import { shortHash } from "@/lib/aix/hash";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: LoadedAgent;
  active?: boolean;
  onClick?: () => void;
}

const statusMap = {
  online: { color: "text-status-online", bg: "bg-status-online/15", ring: "bg-status-online", label: "نشط" },
  pending: { color: "text-status-pending", bg: "bg-status-pending/15", ring: "bg-status-pending", label: "بانتظار" },
  offline: { color: "text-status-offline", bg: "bg-status-offline/15", ring: "bg-status-offline", label: "متوقف" },
} as const;

const kycIcon = {
  verified: BadgeCheck,
  pending: Clock,
  unverified: AlertTriangle,
  revoked: AlertTriangle,
} as const;

export function AgentCard({ agent, active, onClick }: AgentCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-50, 50], [-4, 4]), { stiffness: 200, damping: 20 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const { manifest, hash, status } = agent;
  const s = statusMap[status];
  const KycIcon = kycIcon[manifest.security.kyc_status];

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className={cn(
        "glass-panel group relative cursor-pointer overflow-hidden rounded-3xl p-6 transition-all duration-300",
        "hover:bg-white/[0.08]",
        active && "ring-1 ring-azure/40 bg-white/[0.07]",
      )}
    >
      {/* shimmer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {manifest.persona.archetype ?? "Agent"}
            </span>
            <span className="text-xs text-muted-foreground/60">·</span>
            <span className="text-xs font-mono text-muted-foreground">v{manifest.meta.version}</span>
          </div>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground text-balance">
            {manifest.meta.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{manifest.meta.publisher}</p>
        </div>

        <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium", s.bg, s.color)}>
          <span className={cn("relative h-1.5 w-1.5 rounded-full", s.ring)}>
            {status === "online" && (
              <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", s.ring)} />
            )}
          </span>
          {s.label}
        </div>
      </div>

      {manifest.meta.description && (
        <p className="relative mt-3 line-clamp-2 text-sm text-foreground/70">
          {manifest.meta.description}
        </p>
      )}

      {/* meta strip */}
      <div className="relative mt-5 grid grid-cols-2 gap-3 text-xs">
        <MetaItem icon={Shield} label="التوقيع" value={manifest.security.signature_alg} />
        <MetaItem icon={KycIcon} label="KYC" value={manifest.security.kyc_status} />
        <MetaItem icon={Languages} label="اللغات" value={manifest.persona.languages.join(" · ")} />
        <MetaItem icon={Cpu} label="المحرّك" value={manifest.runtime.engine} />
      </div>

      {/* capabilities */}
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {manifest.capabilities.slice(0, 5).map((c) => (
          <span
            key={c.name}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono text-foreground/80"
          >
            {c.name}
          </span>
        ))}
        {manifest.capabilities.length > 5 && (
          <span className="rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
            +{manifest.capabilities.length - 5}
          </span>
        )}
      </div>

      {/* hash footer */}
      <div className="relative mt-5 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5 font-mono">
          <Hash className="h-3 w-3" />
          {shortHash(hash, 10, 8)}
        </div>
        <div className="font-mono">{manifest.security.did}</div>
      </div>
    </motion.div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/50" strokeWidth={1.5} />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-xs text-foreground/90">{value}</div>
      </div>
    </div>
  );
}
