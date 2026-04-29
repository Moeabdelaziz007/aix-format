"use client";
import { memo, useCallback, useState } from "react";
import { ShieldCheck, UserCheck, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Stable class maps — defined outside component, never recreated ───────────
const stepActive   = "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10";
const stepInactive = "border-[var(--color-glass-border)] bg-[var(--color-surface)]";

export const AgenticKycSetup = memo(function AgenticKycSetup() {
  const [step, setStep] = useState(1);

  // useCallback so the button reference is stable (no child re-renders)
  const startKyc = useCallback(() => {
    setStep(2);
    const t1 = setTimeout(() => {
      setStep(3);
      const t2 = setTimeout(() => setStep(4), 2500);
      return () => clearTimeout(t2);
    }, 2500);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className="bg-[rgba(20,20,20,0.62)] rounded-2xl border border-[var(--color-glass-border)] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-[var(--color-primary)]" />
        <div>
          <h3 className="text-xl font-bold text-white">Agentic KYC Setup</h3>
          <p className="text-sm text-[var(--color-on-surface-variant)]">Zero-code Pi Network Verification</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className={cn("p-4 rounded-xl border transition-all duration-300", step >= 1 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              step >= 2 ? "bg-[var(--color-primary)] text-black" : "bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]"
            )}>1</div>
            <div>
              <h4 className="font-semibold text-white">Initiate Agentic Request</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">Our agent will automatically request a secure Pi KYC check.</p>
            </div>
          </div>
          {step === 1 && (
            <button
              onClick={startKyc}
              className="mt-4 w-full py-2 bg-[var(--color-primary)] hover:brightness-110 text-black rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
            >
              Start KYC Agent
            </button>
          )}
        </div>

        {/* Step 2 */}
        <div className={cn("p-4 rounded-xl border transition-all duration-300", step >= 2 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <Smartphone className={cn(
              "w-8 h-8 transition-colors",
              step >= 2 ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-faint)]"
            )} />
            <div>
              <h4 className="font-semibold text-white">Pi Browser Verification</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                {step === 2 ? "Waiting for your approval on Pi App…" : "Please open your Pi Browser app to approve."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className={cn("p-4 rounded-xl border transition-all duration-300", step >= 3 ? stepActive : stepInactive)}>
          <div className="flex items-center gap-4">
            <UserCheck className={cn(
              "w-8 h-8 transition-colors",
              step >= 4
                ? "text-[var(--color-primary)]"
                : step === 3
                ? "text-[var(--color-secondary)] animate-pulse"
                : "text-[var(--color-on-surface-faint)]"
            )} />
            <div>
              <h4 className="font-semibold text-white">AxiomID Generated</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">
                {step === 4 ? "DID successfully attached to AIX payload." : "Generating cryptographic signature…"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {step === 4 && (
        <div className="mt-6 p-4 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 rounded-lg">
          <p className="text-sm text-[var(--color-primary)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            Your AI agent is now KYC verified and ready to deploy to the Sovereign Network!
          </p>
        </div>
      )}
    </div>
  );
});
