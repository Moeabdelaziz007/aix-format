"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Mic, MicOff, Activity, Volume2, Settings } from 'lucide-react';
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  onTranscript?: (transcript: string) => void;
  isProcessing?: boolean;
}

export function VoiceOrb({ onTranscript, isProcessing: externalProcessing }: VoiceOrbProps) {
  const [isActive, setIsActive] = useState(false);
  const [internalProcessing, setInternalProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isProcessing = externalProcessing || internalProcessing;
  const prevProcessing = useRef(isProcessing);

  useEffect(() => {
    if (prevProcessing.current && !isProcessing && window.speechSynthesis) {
        speakText("Agent DNA generated successfully. Proceed to KYC verification.");
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1.1;
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
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
    <div className="flex flex-col items-center justify-center p-8 bg-[rgba(20,20,30,0.4)] rounded-2xl border border-[var(--color-border)] backdrop-blur-xl glassmorphism-card">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Live Voice Configurator</h3>
        <p className="text-sm text-gray-400">Speak to configure your AIX agent. Zero code required.</p>
      </div>

      <div className="relative flex items-center justify-center w-32 h-32">
        {(isActive || isProcessing || isSpeaking) && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className={cn(
              "absolute inset-0 rounded-full border",
              isSpeaking ? "border-[#d2bbff]" : "border-[var(--color-primary)]"
            )}
          />
        )}
        {(isActive || isProcessing || isSpeaking) && (
          <motion.div
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className={cn(
              "absolute inset-0 rounded-full border",
               isSpeaking ? "border-white" : "border-[var(--color-secondary)]"
            )}
          />
        )}

        <motion.button
          onClick={handleToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isSpeaking
              ? "0 0 50px rgba(210, 187, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.6)"
              : isActive
              ? "0 0 40px rgba(0, 219, 233, 0.6), inset 0 0 20px rgba(210, 187, 255, 0.4)"
              : isProcessing
              ? "0 0 30px rgba(210, 187, 255, 0.6), inset 0 0 20px rgba(0, 219, 233, 0.4)"
              : "0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05)",
          }}
          className={cn(
            "relative z-10 flex items-center justify-center w-full h-full rounded-full transition-all duration-500",
            isProcessing || isSpeaking ? "bg-[var(--color-surface-container-high)]" : "bg-gradient-primary cursor-pointer"
          )}
        >
          {isProcessing ? (
            <Activity className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-10 h-10 text-[#d2bbff] animate-pulse" />
          ) : isActive ? (
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ["10px", "30px", "10px"] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  className="w-1.5 bg-white rounded-full"
                />
              ))}
            </div>
          ) : (
            <Mic className="w-10 h-10 text-white drop-shadow-md" />
          )}
        </motion.button>
      </div>

      <div className="mt-8 text-center space-y-2">
        <h3 className="text-xl font-display font-medium text-white tracking-wide">
          {isSpeaking ? "Agent Speaking..." : isProcessing ? "Agent Analyzing..." : isActive ? "Listening..." : "Voice Orchestration"}
        </h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
          {isSpeaking
            ? "The Sovereign Engine is communicating."
            : isActive
            ? "Speak clearly. The AIX engine is ready for your command."
            : "Tap the orb to configure your agent or deploy a new AIX payload using voice."}
        </p>

        <div className="mt-4 text-sm text-gray-300 h-6">
          {isProcessing ? "Processing voice command..." : isActive ? "Listening... 'Create a customer support agent'" : "Tap the orb to start"}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
        <Settings className="w-4 h-4" />
        <span>Voice Settings (Hume / OpenAI Realtime)</span>
      </div>
    </div>
  );
}
