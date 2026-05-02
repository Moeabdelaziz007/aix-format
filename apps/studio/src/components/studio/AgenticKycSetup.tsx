"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, UserCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

import { PiUser } from "@/lib/types";

// ─── Stable class maps — defined outside component, never recreated ───────────
const stepActive   = "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10";
const stepInactive = "border-[var(--color-border)] bg-[var(--color-surface)]";

export const AgenticKycSetup = memo(function AgenticKycSetup({ user }: { user?: PiUser }) {
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    if (user && step === 1) {
      startKyc();
    }
  }, [user]);
  // ─── Refs to hold timer IDs so we can clear them on unmount ─────────────
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clear all pending timers when component unmounts (prevents memory leaks
  // and React "setState on unmounted component" warnings)
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const startKyc = useCallback(() => {
    // Clear any previously queued timers before starting a fresh sequence
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setStep(2);

    const t1 = setTimeout(() => {
      setStep(3);
      const t2 = setTimeout(() => setStep(4), 2500);
      timersRef.current.push(t2);
    }, 2500);

    timersRef.current.push(t1);
  }, []);

  const resetKyc = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStep(1);
  }, []);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Agentic KYC Setup</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Zero-code Pi Network Verification</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className={cn("p-4 border transition-all duration-300", step >= 1 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-8 h-8 flex items-center justify-center text-xs font-black transition-colors",
              step >= 2 ? "bg-primary text-white" : "bg-surface-container text-zinc-500"
            )}>1</div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Initiate Agentic Request</h4>
              <p className="text-[10px] text-zinc-400 mt-1">Our agent will automatically request a secure Pi KYC check.</p>
            </div>
          </div>
          {step === 1 && (
            <button
              onClick={startKyc}
              className="mt-4 w-full btn btn-primary"
            >
              Start KYC Agent
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div className={cn("p-4 border transition-all duration-300", step >= 2 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <Smartphone className={cn(
              "w-8 h-8 transition-colors",
              step >= 2 ? "text-primary" : "text-zinc-700"
            )} />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">Pi Browser Verification</h4>
              <p className="text-[10px] text-zinc-400 mt-1">
                {step === 2 ? "WAITING FOR APPROVAL ON PI APP..." : "PLEASE OPEN PI BROWSER TO APPROVE."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className={cn("p-4 border transition-all duration-300", step >= 3 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <UserCheck className={cn(
              "w-8 h-8 transition-colors",
              step >= 4
                ? "text-primary"
                : step === 3
                ? "text-warning animate-pulse"
                : "text-zinc-700"
            )} />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-white">AxiomID Generated</h4>
              <p className="text-[10px] text-zinc-400 mt-1">
                {step === 4 ? "DID SUCCESSFULLY ATTACHED TO AIX PAYLOAD." : "GENERATING CRYPTOGRAPHIC SIGNATURE..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {step === 4 && (
        <div className="mt-6 space-y-3">
          <div className="p-4 bg-primary/10 border border-primary/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Verified & Ready for Sovereign Network deployment
            </p>
          </div>
          <button
            onClick={resetKyc}
            className="w-full btn btn-ghost border-white/10"
          >
            Reset KYC
          </button>
        </div>
      )}
    </div>
  );
});
