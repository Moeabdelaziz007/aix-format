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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[rgba(6,8,18,0.9)] px-4 py-2 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-[10px] text-[var(--color-on-surface)] gap-2 font-mono uppercase tracking-widest font-bold">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-none bg-success animate-pulse" />
          Sovereign Status: <span className="text-success">Trust Chain Active</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums text-white">{verifiedAgents.toLocaleString()}</span>
          Verified Agents
        </span>
        <span className="flex items-center gap-4 text-success">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-success/10 border border-success/20 rounded-none">
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
