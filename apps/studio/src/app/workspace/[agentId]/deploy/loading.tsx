"use client";
import React from 'react';

import { Rocket } from "lucide-react";

function Loading() {
  return (
    <div className="p-6 space-y-8 max-w-2xl animate-pulse">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-white/10" />
          <div className="h-8 w-40 bg-white/5 rounded-lg" />
        </div>
        <div className="h-4 w-72 bg-white/5 rounded-md" />
      </div>

      <div className="h-20 bg-white/[0.01] border border-white/5 rounded-2xl" />

      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.01]">
            <div className="w-9 h-9 rounded-xl bg-white/5" />
            <div className="h-4 w-40 bg-white/5 rounded-md" />
          </div>
        ))}
      </div>

      <div className="h-14 bg-white/5 rounded-2xl" />
    </div>
  );
}

export default React.memo(Loading);

Loading.displayName = 'Loading';
