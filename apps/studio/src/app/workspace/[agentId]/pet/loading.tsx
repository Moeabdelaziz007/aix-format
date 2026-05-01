"use client";

import { Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-white/10" />
          <div className="h-8 w-40 bg-white/5 rounded-lg" />
        </div>
        <div className="h-4 w-72 bg-white/5 rounded-md" />
      </div>

      <div className="flex flex-col items-center gap-6 py-10 rounded-3xl bg-white/[0.01] border border-white/5">
        <div className="w-32 h-32 rounded-full bg-white/5" />
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-6 w-32 bg-white/5 rounded-md" />
          <div className="h-4 w-48 bg-white/5 rounded-md" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-white/5 rounded-full" />
            <div className="h-6 w-16 bg-white/5 rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-4 w-20 bg-white/5 rounded-md" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-20 bg-white/[0.01] border border-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
