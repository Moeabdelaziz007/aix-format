import { motion } from "framer-motion";
import { useMemo } from "react";
import type { LoadedAgent } from "@/lib/aix/schema";
import { cn } from "@/lib/utils";

interface SwarmCanvasProps {
  agents: LoadedAgent[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function SwarmCanvas({ agents, activeId, onSelect }: SwarmCanvasProps) {
  const nodes = useMemo(() => {
    const cx = 50;
    const cy = 50;
    const r = 30;
    return agents.map((a, i) => {
      const angle = agents.length === 1 ? 0 : (i / agents.length) * Math.PI * 2 - Math.PI / 2;
      return {
        agent: a,
        x: agents.length === 1 ? cx : cx + Math.cos(angle) * r,
        y: agents.length === 1 ? cy : cy + Math.sin(angle) * r,
      };
    });
  }, [agents]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Connecting lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n, i) =>
          nodes.slice(i + 1).map((m, j) => (
            <line
              key={`${i}-${j}`}
              x1={n.x}
              y1={n.y}
              x2={m.x}
              y2={m.y}
              stroke="oklch(1 0 0 / 0.08)"
              strokeWidth="0.15"
              strokeDasharray="0.6 0.6"
            />
          )),
        )}
        {/* center hub */}
        {nodes.length > 1 && (
          <circle cx="50" cy="50" r="0.8" fill="oklch(0.85 0.08 240 / 0.4)" />
        )}
      </svg>

      {/* Nodes */}
      {nodes.map(({ agent, x, y }) => {
        const active = agent.manifest.meta.id === activeId;
        return (
          <motion.button
            key={agent.manifest.meta.id}
            onClick={() => onSelect(agent.manifest.meta.id)}
            className={cn(
              "glass absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-4 py-3 text-start transition-all",
              "hover:bg-white/[0.10]",
              active && "ring-2 ring-azure/40 bg-white/[0.10]",
            )}
            style={{ left: `${x}%`, top: `${y}%`, minWidth: 180 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  agent.status === "online" && "bg-status-online",
                  agent.status === "pending" && "bg-status-pending",
                  agent.status === "offline" && "bg-status-offline",
                )}
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {agent.manifest.persona.archetype ?? "Agent"}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {agent.manifest.meta.name}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              v{agent.manifest.meta.version}
            </div>
          </motion.button>
        );
      })}

      {agents.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-sm text-muted-foreground">
            لا يوجد وكلاء في السرب — حمّل ملف AIX من اللوحة الجانبية
          </div>
        </div>
      )}
    </div>
  );
}
