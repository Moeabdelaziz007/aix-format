"use client";

import { useParams } from "next/navigation";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, CheckCircle2, Loader2, Globe, Copy,
  Shield, Zap, ExternalLink, AlertCircle, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

type DeployState = "idle" | "signing" | "deploying" | "done" | "error";

export default function DeployPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgent, saveAgent } = useLocalAgents();
  const agent = getAgent(agentId);

  const [state, setState]     = useState<DeployState>("idle");
  const [endpoint, setEndpoint] = useState(agent?.deployment?.endpointUrl ?? "");
  const [error, setError]     = useState("");

  if (!agent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Rocket className="w-8 h-8 text-white/20" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight mb-2">Agent Context Lost</h2>
        <p className="text-sm text-white/40 max-w-sm">
          We couldn't find the agent details required for deployment.
        </p>
      </motion.div>
    );
  }

  const isDeployed = agent.deployment?.status === "deployed";

  const handleDeploy = async () => {
    setState("signing");
    setError("");

    try {
      // Step 1 — sign
      await new Promise(r => setTimeout(r, 900));
      setState("deploying");

      // Step 2 — deploy
      const res = await fetch("/api/deploy-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, manifest: agent.manifest ?? agent.yaml }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const url = data.endpointUrl ?? `https://axiomid.app/agents/${agent.id}`;
      setEndpoint(url);

      saveAgent({
        ...agent,
        deployment: {
          agentId:     agent.id,
          deployedAt:  new Date().toISOString(),
          endpointUrl: url,
          mcpUrl:      data.mcpUrl ?? `${url}/mcp`,
          status:      "deployed",
          txHash:      data.txHash,
        },
      });

      setState("done");
      toast.success("Agent deployed successfully!");
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message ?? "Deployment failed");
      setState("error");
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const STEPS = [
    { id: "signing",   label: "Signing AXIOM DNA",    icon: Shield },
    { id: "deploying", label: "Deploying to network",  icon: Rocket },
    { id: "done",      label: "Live on axiomid.app",   icon: Globe  },
  ];

  const stepIndex = { idle: -1, signing: 0, deploying: 1, done: 2, error: -1 }[state];

  return (
    <ErrorBoundary>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-6 space-y-8 max-w-2xl"
    >
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Rocket className="w-6 h-6 text-blue-400" />
          Deploy Agent
        </h2>
        <p className="text-sm text-white/30 mt-0.5">
          One-click deploy with AXIOM DNA signature
        </p>
      </div>

      {/* Current status */}
      {isDeployed && state === "idle" && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-300">Currently deployed</p>
            <p className="text-xs text-white/30 font-mono truncate mt-0.5">{agent.deployment?.endpointUrl}</p>
          </div>
          <button
            onClick={() => copy(agent.deployment?.endpointUrl ?? "")}
            className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Deploy steps */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const done    = stepIndex > i || state === "done";
          const active  = stepIndex === i;
          const pending = stepIndex < i && state !== "done";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                done   ? "bg-emerald-500/5 border-emerald-500/20"
                : active ? "bg-blue-500/5 border-blue-500/20"
                : "bg-white/[0.02] border-white/5"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                done   ? "bg-emerald-500/20"
                : active ? "bg-blue-500/20"
                : "bg-white/5"
              )}>
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <step.icon className="w-4 h-4 text-white/20" />
                )}
              </div>
              <p className={cn(
                "text-sm font-bold",
                done ? "text-emerald-300" : active ? "text-white" : "text-white/30"
              )}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Error */}
      <AnimatePresence>
        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-300">Deployment failed</p>
              <p className="text-xs text-white/40 mt-0.5">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Endpoint result */}
      <AnimatePresence>
        {state === "done" && endpoint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <p className="text-xs font-black text-white/30 uppercase tracking-widest">Live Endpoints</p>
            {[
              { label: "Agent URL", value: endpoint },
              { label: "MCP URL",   value: endpoint + "/mcp" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</p>
                  <p className="text-xs font-mono text-white/70 truncate">{value}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copy(value)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={value} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <button
        onClick={state === "error" ? handleDeploy : state === "idle" ? handleDeploy : undefined}
        disabled={state === "signing" || state === "deploying" || state === "done"}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
          state === "done"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default"
            : state === "signing" || state === "deploying"
            ? "bg-blue-500/10 border border-blue-500/20 text-blue-400 cursor-wait"
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-[1.01] active:scale-[0.99]"
        )}
      >
        {state === "done" ? (
          <><CheckCircle2 className="w-4 h-4" /> Deployed</>
        ) : state === "signing" || state === "deploying" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {state === "signing" ? "Signing…" : "Deploying…"}</>
        ) : state === "error" ? (
          <><RefreshCw className="w-4 h-4" /> Retry Deploy</>
        ) : (
          <><Zap className="w-4 h-4" /> {isDeployed ? "Redeploy Agent" : "Deploy Agent"}</>
        )}
      </button>
    </motion.div>
    </ErrorBoundary>
  );
}

function.displayName = 'function';
