"use client";

export function SovereignStatusBar() {
  const verifiedAgents = 1284 + new Date().getUTCDate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-glass-border)] bg-[rgba(6,8,18,0.8)] backdrop-blur-xl px-4 py-2">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between text-xs text-gray-300">
        <span>🧬 Sovereign Status: Trust Chain Active</span>
        <span>✅ Verified Agents: {verifiedAgents.toLocaleString()}</span>
      </div>
    </div>
  );
}
