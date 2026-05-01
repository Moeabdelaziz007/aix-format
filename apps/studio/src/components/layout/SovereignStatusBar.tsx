"use client";

import { useEffect, useState } from "react";

// FIX: was computing `new Date().getUTCDate()` during render — this causes a
// React hydration mismatch (server date ≠ client date when SSR runs on a
// different tick). Use useEffect to set the value only on the client.
export function SovereignStatusBar() {
  const [verifiedAgents, setVerifiedAgents] = useState(1284);

  useEffect(() => {
    setVerifiedAgents(1284 + new Date().getUTCDate());
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-glass-border)] bg-[rgba(6,8,18,0.8)] backdrop-blur-xl px-4 py-2">
      {/* Add bottom padding so content above isn't hidden behind this bar */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs text-gray-300 gap-2">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sovereign Status: Trust Chain Active
        </span>
        <span className="flex items-center gap-2">
          <span className="font-mono tabular-nums">{verifiedAgents.toLocaleString()}</span>
          Verified Agents
        </span>
        <span className="flex items-center gap-4 text-emerald-400">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Domain Verified
          </span>
        </span>
      </div>
    </div>
  );
}
