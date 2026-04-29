"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Mic, Volume2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  onTranscript?: (transcript: string) => void;
  isProcessing?: boolean;
}

export function VoiceOrb({ onTranscript, isProcessing: externalProcessing = false }: VoiceOrbProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const recognitionRef = useRef<any>(null);

  const isProcessing = externalProcessing;
  const prevProcessing = useRef(isProcessing);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = 1.1;
    utterance.rate = 1.05;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize Speech Recognition
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        if (onTranscript) onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  useEffect(() => {
    initRecognition();
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initRecognition]);

  useEffect(() => {
    if (prevProcessing.current && !isProcessing && window.speechSynthesis) {
      speakText("Agent DNA generated successfully. Proceed to KYC verification.");
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, speakText]);

  useEffect(() => {
    if (!isListening) {
      setMicLevel(0);
      return;
    }

    const pulseInterval = window.setInterval(() => {
      setMicLevel(Math.random());
    }, 120);

    return () => window.clearInterval(pulseInterval);
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      initRecognition();
      if (!recognitionRef.current) {
        alert("Voice recognition is not supported in this browser.");
        return;
      }
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[rgba(20,20,30,0.4)] rounded-2xl border border-[var(--color-border)] backdrop-blur-xl">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-display font-bold text-white mb-2">Sovereign Voice Engine</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)]">Speak to configure your AIX agent. Pi Network Secured.</p>
      </div>

      <div
        className="relative flex items-center justify-center w-32 h-32 mb-8"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          setPointerOffset({ x: x * 10, y: y * 10 });
        }}
        onMouseLeave={() => setPointerOffset({ x: 0, y: 0 })}
      >
        {/* Ripples */}
        {(isListening || isProcessing || isSpeaking) && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className={cn(
                "absolute inset-0 rounded-full border",
                isSpeaking ? "border-[#d2bbff]" : "border-[var(--color-primary)]"
              )}
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
              className={cn(
                "absolute inset-0 rounded-full border",
                isSpeaking ? "border-white" : "border-[var(--color-secondary)]"
              )}
            />
          </>
        )}

        {/* Core Orb */}
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            x: pointerOffset.x,
            y: pointerOffset.y,
            scale: 1 + micLevel * 0.05,
            boxShadow: isSpeaking
              ? "0 0 50px rgba(210, 187, 255, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.6)"
              : isListening
              ? "0 0 40px rgba(0, 219, 233, 0.6), inset 0 0 20px rgba(210, 187, 255, 0.4)"
              : isProcessing
              ? "0 0 30px rgba(210, 187, 255, 0.6), inset 0 0 20px rgba(0, 219, 233, 0.4)"
              : "0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05)",
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
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

      <div className="mt-8 text-sm text-gray-300 h-6">
        {isProcessing ? "Processing voice command..." : isListening ? "Listening... 'Create a customer support agent'" : "Tap the orb to start"}
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-[var(--color-primary)] cursor-pointer hover:text-[var(--color-secondary)] transition-colors">
        <Settings className="w-4 h-4" />
        <span>Voice Settings (AIX Quantum Mode)</span>
      </div>
    </div>
  );
}
