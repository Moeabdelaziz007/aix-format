"use client";

import { Shield } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 bg-white/5 rounded-lg" />
        <div className="h-4 w-72 bg-white/5 rounded-md" />
      </div>

      <div className="space-y-8 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-white/5" />
              <div className="h-4 w-20 bg-white/5 rounded-full" />
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] h-32 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white/5" />
                    <div className="w-4 h-4 rounded-full bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-white/5 rounded-md" />
                    <div className="h-1.5 w-full bg-white/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
