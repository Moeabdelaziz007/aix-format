import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from "framer-motion";
import { Mic, MicOff, Settings, Activity, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  onTranscript?: (transcript: string) => void;
  isProcessing?: boolean;
}

export function VoiceOrb({ onTranscript, isProcessing: externalProcessing = false }: VoiceOrbProps) {
  const [isActive, setIsActive] = useState(false);
  const [internalProcessing, setInternalProcessing] = useState(false);

  const isProcessing = externalProcessing || internalProcessing;

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      // Simulate listening state
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
    <div className="flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-full">
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.5, 0.8, 0.5] : 0.2
          }}
          transition={{
            repeat: Infinity,
            duration: 2
          }}
          className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl"
        />

        <button
          onClick={handleToggle}
          className={cn(
            "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
            isActive
              ? "bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.5)]"
              : "bg-gray-800 border border-white/20 hover:border-white/40 hover:bg-gray-700"
          )}
        >
          {isProcessing ? (
            <Activity className="w-10 h-10 text-white animate-pulse" />
          ) : isActive ? (
            <Mic className="w-10 h-10 text-white" />
          ) : (
            <MicOff className="w-10 h-10 text-gray-400" />
          )}
        </button>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-white tracking-wider">VoiceOrb</h3>
        <p className="text-gray-400 text-sm h-5">
          {isProcessing
            ? "Processing DNA..."
            : isActive
              ? "Listening..."
              : "Tap to begin voice configuration"}
        </p>
      </div>
    </div>
  );
}
