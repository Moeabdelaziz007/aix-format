"use client";

import React, { useState } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Activity, Volume2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isProcessing = externalProcessing;
  const prevProcessing = useRef(isProcessing);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    // Optional: tweak voice parameters for a more "AI" feel
    utterance.pitch = 1.1;
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onTranscript]);

  useEffect(() => {
    // Simple logic: if we just finished processing, maybe speak a confirmation
    if (prevProcessing.current && !isProcessing && window.speechSynthesis) {
        speakText("Agent DNA generated successfully. Proceed to KYC verification.");
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, speakText]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    // Stop speaking if listening starts
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
        setIsListening(false);
      }
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
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Outer Ripple */}
          {(isListening || isProcessing || isSpeaking) && (
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
          {(isListening || isProcessing || isSpeaking) && (
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

          {/* Core Orb */}
          <motion.button
            onClick={toggleListening}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: isSpeaking
                ? "0 0 50px rgba(210, 187, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.6)"
                : isListening
                ? "0 0 40px rgba(0, 219, 233, 0.6), inset 0 0 20px rgba(210, 187, 255, 0.4)"
                : isProcessing
                ? "0 0 30px rgba(210, 187, 255, 0.6), inset 0 0 20px rgba(0, 219, 233, 0.4)"
                : "0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05)",
            }}
            className={cn(
              "relative z-10 flex items-center justify-center w-full h-full rounded-full transition-all duration-500",
              isProcessing || isSpeaking ? "bg-[var(--color-surface-container-high)]" : "bg-gradient-primary"
            )}
          >
            {isProcessing ? (
              <Activity className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
            ) : isSpeaking ? (
              <Volume2 className="w-10 h-10 text-[#d2bbff] animate-pulse" />
            ) : isListening ? (
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

        <div className="text-center space-y-2">
          <h3 className="text-xl font-display font-medium text-white tracking-wide">
            {isSpeaking ? "Agent Speaking..." : isProcessing ? "Agent Analyzing..." : isListening ? "Listening..." : "Voice Orchestration"}
          </h3>
          <p className="text-sm text-[var(--color-on-surface-variant)] max-w-xs mx-auto leading-relaxed">
            {isSpeaking
              ? "The Sovereign Engine is communicating."
              : isListening
              ? "Speak clearly. The AIX engine is ready for your command."
              : "Tap the orb to configure your agent or deploy a new AIX payload using voice."}
          </p>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-300 h-6">
        {isProcessing ? "Processing voice command..." : isListening ? "Listening... 'Create a customer support agent'" : "Tap the orb to start"}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-indigo-400 cursor-pointer hover:text-indigo-300">
        <Settings className="w-4 h-4" />
        <span>Voice Settings (Hume / OpenAI Realtime)</span>
      </div>
    </div>
  );
}
