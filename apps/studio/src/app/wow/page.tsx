"use client";

import React from 'react';
import dynamic from 'next/dynamic';

/**
 * Dynamic imports with SSR disabled for client components
 */
const ReasoningTerminal = dynamic(
    () => import('@/components/studio/ReasoningTerminal').then(mod => ({ default: (mod as any).ReasoningTerminal || mod.default })),
    { ssr: false }
);

const TrustChainVisualizer = dynamic(
  () => import('@/components/studio/TrustChainVisualizer').then(mod => ({ default: (mod as any).TrustChainVisualizer || mod.default })),
  { ssr: false }
);

export default function WowPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-12">Agent Interactive Trace</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 overflow-hidden h-[600px]">
          <ReasoningTerminal />
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6 overflow-hidden h-[600px]">
          <TrustChainVisualizer />
        </div>
      </div>
    </div>
  );
}
