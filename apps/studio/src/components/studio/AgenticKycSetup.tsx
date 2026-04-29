"use client";
import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Smartphone } from 'lucide-react';

export function AgenticKycSetup() {
  const [step, setStep] = useState(1);

  const startKyc = () => {
    setStep(2);
    setTimeout(() => {
      setStep(3);
      setTimeout(() => {
        setStep(4);
      }, 2500);
    }, 2500);
  };

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
        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 1 ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10' : 'border-[var(--color-glass-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-bright)] text-[var(--color-on-surface-variant)]'}`}>1</div>
            <div>
              <h4 className="font-semibold text-white">Initiate Agentic Request</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">Our agent will automatically request a secure Pi KYC check.</p>
            </div>
          </div>
          {step === 1 && (
            <button
              onClick={startKyc}
              className="mt-4 w-full py-2 bg-[var(--color-primary)] hover:brightness-110 text-black rounded-lg text-sm font-semibold transition-colors"
            >
              Start KYC Agent
            </button>
          )}
        </div>

        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 2 ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10' : 'border-[var(--color-glass-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <Smartphone className={`w-8 h-8 ${step >= 2 ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]/60'}`} />
            <div>
              <h4 className="font-semibold text-white">Pi Browser Verification</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{step === 2 ? 'Waiting for your approval on Pi App...' : 'Please open your Pi Browser app to approve.'}</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 3 ? 'border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10' : 'border-[var(--color-glass-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <UserCheck className={`w-8 h-8 ${step >= 4 ? 'text-[var(--color-primary)]' : step === 3 ? 'text-[var(--color-secondary)] animate-pulse' : 'text-[var(--color-on-surface-variant)]/60'}`} />
            <div>
              <h4 className="font-semibold text-white">AxiomID Generated</h4>
              <p className="text-xs text-[var(--color-on-surface-variant)]">{step === 4 ? 'DID successfully attached to AIX payload.' : 'Generating cryptographic signature...'}</p>
            </div>
          </div>
        </div>
      </div>

      {step === 4 && (
        <div className="mt-6 p-4 bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/40 rounded-lg">
          <p className="text-sm text-[var(--color-primary)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Your AI agent is now KYC verified and ready to deploy to the Sovereign Network!
          </p>
        </div>
      )}
    </div>
  );
}
