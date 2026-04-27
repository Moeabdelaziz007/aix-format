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
    <div className="bg-[rgba(20,20,30,0.6)] rounded-2xl border border-[var(--color-border)] p-6 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-indigo-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Agentic KYC Setup</h3>
          <p className="text-sm text-gray-400">Zero-code Pi Network Verification</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 1 ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'}`}>1</div>
            <div>
              <h4 className="font-semibold text-white">Initiate Agentic Request</h4>
              <p className="text-xs text-gray-400">Our agent will automatically request a secure Pi KYC check.</p>
            </div>
          </div>
          {step === 1 && (
            <button
              onClick={startKyc}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Start KYC Agent
            </button>
          )}
        </div>

        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 2 ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <Smartphone className={`w-8 h-8 ${step >= 2 ? 'text-indigo-400' : 'text-gray-600'}`} />
            <div>
              <h4 className="font-semibold text-white">Pi Browser Verification</h4>
              <p className="text-xs text-gray-400">{step === 2 ? 'Waiting for your approval on Pi App...' : 'Please open your Pi Browser app to approve.'}</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border transition-all duration-300 ${step >= 3 ? 'border-green-500/50 bg-green-500/10' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>
          <div className="flex items-center gap-4">
            <UserCheck className={`w-8 h-8 ${step >= 4 ? 'text-green-400' : step === 3 ? 'text-indigo-400 animate-pulse' : 'text-gray-600'}`} />
            <div>
              <h4 className="font-semibold text-white">AxiomID Generated</h4>
              <p className="text-xs text-gray-400">{step === 4 ? 'DID successfully attached to AIX payload.' : 'Generating cryptographic signature...'}</p>
            </div>
          </div>
        </div>
      </div>

      {step === 4 && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Your AI agent is now KYC verified and ready to deploy to the Sovereign Network!
          </p>
        </div>
      )}
    </div>
  );
}
