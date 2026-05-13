"use client";
import React from 'react';

import { BrainCircuit } from "lucide-react";

function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-white/10" />
            <div className="h-8 w-32 bg-white/5 rounded-lg" />
          </div>
          <div className="h-4 w-64 bg-white/5 rounded-md" />
        </div>
        <div className="h-10 w-28 bg-white/5 rounded-xl" />
      </div>

      <div className="rounded-3xl border border-white/5 bg-white/[0.01] min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-purple-500/50 animate-spin" />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            Syncing Neural Graph
          </p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Loading);

Loading.displayName = 'Loading';
