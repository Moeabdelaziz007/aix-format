import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)] opacity-20 blur-2xl animate-pulse" />
        
        {/* Spinner */}
        <div className="relative card rounded-full p-4 border border-white/10">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-white font-medium tracking-wide animate-pulse">Syncing with Sovereign Network</p>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-bounce" />
        </div>
      </div>
    </div>
  );
}
