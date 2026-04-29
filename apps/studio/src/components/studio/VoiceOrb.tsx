
"use client";

import React, { useState } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';

interface VoiceOrbProps {
  onTranscript?: (transcript: string) => void;
  isProcessing?: boolean;
}

export function VoiceOrb({ onTranscript, isProcessing: externalProcessing }: VoiceOrbProps) {
  const [isActive, setIsActive] = useState(false);
  const [internalProcessing, setInternalProcessing] = useState(false);

  const isProcessing = externalProcessing || internalProcessing;

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      setTimeout(() => {
        setInternalProcessing(true);
        setTimeout(() => {
          setInternalProcessing(false);
          setIsActive(false);
          if (onTranscript) {
            onTranscript("Create a customer support agent");
          }
        }, 2000);
      }, 3000);
    } else {
      setIsActive(false);
      setInternalProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[rgba(20,20,30,0.4)] rounded-2xl border border-[var(--color-border)] backdrop-blur-xl">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Live Voice Configurator</h3>
        <p className="text-sm text-gray-400">Speak to configure your AIX agent. Zero code required.</p>
      </div>

      <div
        onClick={handleToggle}
        className={`relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out ${
          isActive
            ? 'bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.6)] scale-110'
            : 'bg-[rgba(30,30,40,0.8)] shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:bg-[rgba(40,40,50,0.8)]'
        }`}
      >
        {isProcessing ? (
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-white animate-spin"></div>
        ) : null}

        {isActive ? (
          <Mic className="w-12 h-12 text-white animate-pulse" />
        ) : (
          <MicOff className="w-12 h-12 text-gray-400" />
        )}
      </div>

      <div className="mt-8 text-sm text-gray-300 h-6">
        {isProcessing ? "Processing voice command..." : isActive ? "Listening... 'Create a customer support agent'" : "Tap the orb to start"}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
        <Settings className="w-4 h-4" />
        <span>Voice Settings (Hume / OpenAI Realtime)</span>
      </div>
    </div>
  );
}
