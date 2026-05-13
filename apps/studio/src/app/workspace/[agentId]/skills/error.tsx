"use client";
import React from 'react';

import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { agentId } = useParams();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      
      <h2 className="text-xl font-black text-white tracking-tight mb-2">
        Skill Tree Corruption
      </h2>
      <p className="text-sm text-white/40 max-w-sm mb-8">
        Failed to load the agent's capability manifest. The neural links might be unstable.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Reconnect
        </button>
        <Link
          href={`/workspace/${agentId}/pulse`}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          Workspace Root
        </Link>
      </div>
    </div>
  );
}

export default React.memo(Error);

Error.displayName = 'Error';
