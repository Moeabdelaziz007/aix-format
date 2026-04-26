"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export function VoiceOrb({ onTranscript, isProcessing }: VoiceOrbProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Can be made dynamic for Arabic later

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
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
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center w-32 h-32">
        {/* Outer Ripple */}
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-[var(--color-primary)]"
          />
        )}
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 rounded-full border border-[var(--color-secondary)]"
          />
        )}

        {/* Core Orb */}
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: isListening
              ? "0 0 40px rgba(0, 219, 233, 0.6), inset 0 0 20px rgba(210, 187, 255, 0.4)"
              : isProcessing
              ? "0 0 30px rgba(210, 187, 255, 0.6), inset 0 0 20px rgba(0, 219, 233, 0.4)"
              : "0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05)",
          }}
          className={cn(
            "relative z-10 flex items-center justify-center w-full h-full rounded-full transition-all duration-500",
            isProcessing ? "bg-[var(--color-surface-container-high)]" : "bg-gradient-primary"
          )}
        >
          {isProcessing ? (
            <Activity className="w-10 h-10 text-[var(--color-primary)] animate-pulse" />
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
          {isProcessing ? "Agent Analyzing..." : isListening ? "Listening..." : "Voice Orchestration"}
        </h3>
        <p className="text-sm text-[var(--color-on-surface-variant)] max-w-xs mx-auto leading-relaxed">
          {isListening
            ? "Speak clearly. The AIX engine is ready for your command."
            : "Tap the orb to configure your agent or deploy a new AIX payload using voice."}
        </p>
      </div>
    </div>
  );
}
