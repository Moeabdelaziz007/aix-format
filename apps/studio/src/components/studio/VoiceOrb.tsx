"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, Activity, Settings2, Cpu, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  onTranscript?: (transcript: string) => void;
  isProcessing?: boolean;
}

/* ─── Canvas waveform ─── */
function WaveCanvas({ active, color }: { active: boolean; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const timeRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (!active) {
        /* idle flat line */
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.04;
      const t = timeRef.current;

      const bars  = 40;
      const barW  = width / bars;
      const grad  = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0,   color + "44");
      grad.addColorStop(0.5, color);
      grad.addColorStop(1,   color + "44");

      for (let i = 0; i < bars; i++) {
        const amp   = (Math.sin(i * 0.4 + t * 2) * 0.5 + 0.5) *
                      (Math.sin(i * 0.7 - t) * 0.3 + 0.7);
        const barH  = amp * (height * 0.72);
        const x     = i * barW + barW * 0.15;
        const y     = (height - barH) / 2;

        ctx.fillStyle = grad;
        const r = Math.min(barW * 0.35, 3);
        ctx.beginPath();
        ctx.roundRect(x, y, barW * 0.7, barH, r);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={48}
      className="w-full h-12 opacity-80"
    />
  );
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

export function VoiceOrb({ onTranscript, isProcessing: extProcessing = false }: VoiceOrbProps) {
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [micLevel,     setMicLevel]     = useState(0);
  const [transcript,   setTranscript]   = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessing   = extProcessing;
  const prevProcessing = useRef(isProcessing);

  /* — state label — */
  const stateLabel = isSpeaking
    ? "Agent Speaking"
    : isProcessing
    ? "Processing"
    : isListening
    ? "Listening…"
    : "Voice Ready";

  const stateColor = isSpeaking
    ? "#8b5cf6"
    : isProcessing
    ? "#f5a623"
    : isListening
    ? "#00d4ff"
    : "#00d4ff";

  const orbActive = isListening || isSpeaking || isProcessing;

  /* — TTS — */
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.pitch = 1.05; u.rate = 1.0;
    u.onstart = () => setIsSpeaking(true);
    u.onend   = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  /* — Speech Recognition — */
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR && !recognitionRef.current) {
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-US";
      r.onresult = (e: SpeechRecognitionEvent) => {
        const t = e.results?.[0]?.[0]?.transcript ?? "";
        setTranscript(t);
        if (onTranscript) onTranscript(t);
        setIsListening(false);
      };
      r.onerror = () => setIsListening(false);
      r.onend   = () => setIsListening(false);
      recognitionRef.current = r;
    }
  }, [onTranscript]);

  useEffect(() => {
    initRecognition();
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, [initRecognition]);

  useEffect(() => {
    if (prevProcessing.current && !isProcessing) {
      speakText("Agent manifest generated. Proceed to KYC verification.");
    }
    prevProcessing.current = isProcessing;
  }, [isProcessing, speakText]);

  useEffect(() => {
    if (!isListening) { setMicLevel(0); return; }
    const id = setInterval(() => setMicLevel(Math.random()), 100);
    return () => clearInterval(id);
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) { initRecognition(); }
    if (!recognitionRef.current) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try { recognitionRef.current.start(); setIsListening(true); }
      catch { setIsListening(false); }
    }
  };

  /* orb scale based on mic level */
  const orbScale = 1 + micLevel * 0.06;

  return (
    <div className="glass-heavy rounded-3xl p-8 flex flex-col items-center gap-6 w-full border border-[rgba(0,212,255,0.1)] relative overflow-hidden">

      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: orbActive
            ? `radial-gradient(ellipse 60% 50% at 50% 40%, ${stateColor}10 0%, transparent 70%)`
            : "transparent",
        }}
      />

      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-base font-display font-bold text-white tracking-tight">Sovereign Voice Engine</h3>
          <p className="text-[11px] text-[var(--color-on-surface-variant)] mt-0.5 flex items-center gap-1.5">
            <span className="status-dot status-online" />
            Pi Network Secured · AIX v1.2
          </p>
        </div>
        <button className="btn btn-ghost btn-sm p-2 rounded-xl" aria-label="Voice settings">
          <Settings2 className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      {/* ─── ORB ─── */}
      <div className="relative flex items-center justify-center w-36 h-36">

        {/* Ambient rings — always visible, just dim */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px solid ${stateColor}` }}
            animate={orbActive
              ? { scale: [1, 1.2 + i * 0.2, 1], opacity: [0.3, 0, 0.3] }
              : { scale: 1, opacity: 0.06 }
            }
            transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3, ease: "easeInOut" }}
          />
        ))}

        {/* Outer plasma ring */}
        <motion.div
          className="absolute inset-1 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 0deg, transparent 60%, ${stateColor}40 80%, transparent 100%)`,
            opacity: orbActive ? 1 : 0.2,
            transition: "opacity 0.5s",
          }}
        />

        {/* Core orb button */}
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          animate={{ scale: orbScale }}
          transition={{ duration: 0.12 }}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
          className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-none"
          style={{
            background: orbActive
              ? `radial-gradient(circle at 35% 35%, ${stateColor}cc, ${stateColor}44)`
              : "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.3), rgba(0,212,255,0.08))",
            boxShadow: orbActive
              ? `0 0 0 1px ${stateColor}44, 0 0 32px ${stateColor}55, inset 0 0 20px ${stateColor}22`
              : `0 0 0 1px rgba(0,212,255,0.15), 0 0 16px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Inner icon */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div key="proc" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Activity className="w-9 h-9 text-[var(--color-accent)] animate-pulse" />
              </motion.div>
            ) : isSpeaking ? (
              <motion.div key="speak" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Volume2 className="w-9 h-9 text-[#8b5cf6]" />
              </motion.div>
            ) : isListening ? (
              <motion.div key="listen" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-end gap-[3px] h-9"
              >
                {[0.6, 1, 0.75, 1, 0.6].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 rounded-full bg-white"
                    animate={{ scaleY: [h, 1, h] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.1 }}
                    style={{ height: "32px", transformOrigin: "bottom" }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Mic className="w-9 h-9 text-white drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* State label */}
      <div className="text-center">
        <motion.p
          key={stateLabel}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold tracking-wide"
          style={{ color: stateColor }}
        >
          {stateLabel}
        </motion.p>
        <p className="text-[12px] text-[var(--color-on-surface-variant)] mt-1 max-w-[200px] mx-auto leading-relaxed">
          {isSpeaking
            ? "Sovereign Engine is responding…"
            : isListening
            ? "Speak your agent command clearly"
            : isProcessing
            ? "Analyzing AIX manifest…"
            : "Tap orb to deploy or configure agents via voice"}
        </p>
      </div>

      {/* Waveform visualizer */}
      <div className="w-full px-2">
        <WaveCanvas active={orbActive} color={stateColor} />
      </div>

      {/* Transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full px-4 py-3 rounded-xl bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] text-sm text-[var(--color-on-surface-variant)] italic"
          >
            <span className="text-[var(--color-primary)] font-medium not-italic">You said: </span>
            &ldquo;{transcript}&rdquo;
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status strip */}
      <div className="w-full flex items-center justify-between text-[11px] text-[var(--color-on-surface-faint)] pt-2 border-t border-white/[0.04]">
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3" /> AIX Quantum Mode
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="w-3 h-3" /> Pi KYC Active
        </span>
      </div>
    </div>
  );
}
