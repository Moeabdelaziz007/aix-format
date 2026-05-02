"use client";

import { useParams } from "next/navigation";
import { WikiBrain } from "@/components/shared/WikiBrain";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function WikiBrainPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const [key, setKey] = useState(0); // force remount to re-fetch

  return (
    <ErrorBoundary>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            WikiBrain
          </h2>
          <p className="text-sm text-white/30 mt-0.5">
            Hierarchical memory graph — sessions, facts, skills
          </p>
        </div>
        <button
          onClick={() => setKey(k => k + 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-index
        </button>
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden min-h-[500px]">
        <WikiBrain key={key} agentId={agentId} />
      </div>
    </motion.div>
    </ErrorBoundary>
  );
}
