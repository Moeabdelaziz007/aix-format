"use client";

/**
 * GlobalVoiceCommand — OS-level Spotlight-style voice command palette.
 *
 * Triggered by:
 *   • Ctrl+Space
 *   • Floating mic FAB (bottom-right)
 *   • Programmatic open() call
 *
 * Architecture:
 *   useGlobalVoice  → captures transcript via Web Speech API
 *   useVoiceCommands → parses intent → fires router / callbacks
 *   Framer Motion   → animates in/out
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Command, ArrowRight, Sparkles,
  Navigation, BrainCircuit, Rocket, Search, X,
} from "lucide-react";
import { useGlobalVoice }    from "@/hooks/useGlobalVoice";
import { useVoiceCommands }  from "@/hooks/useVoiceCommands";
import { cn }                from "@/lib/utils";

// ── Suggestion chips shown when palette is idle ───────────────────────────
const SUGGESTIONS = [
  { icon: <Navigation className="w-3.5 h-3.5" />,   label: "Go to Marketplace",   cmd: "marketplace"    },
  { icon: <Sparkles   className="w-3.5 h-3.5" />,   label: "Create new agent",    cmd: "create agent"   },
  { icon: <BrainCircuit className="w-3.5 h-3.5" />, label: "Open WikiBrain",      cmd: "wikibrain"      },
  { icon: <Rocket     className="w-3.5 h-3.5" />,   label: "Deploy agent",        cmd: "deploy"         },
  { icon: <Search     className="w-3.5 h-3.5" />,   label: "Search agents",       cmd: "search agents"  },
];

// ── Props ─────────────────────────────────────────────────────────────────
interface GlobalVoiceCommandProps {
  onOpenVoiceWizard?: () => void;
  onOpenWikiBrain?:   (agentId: string) => void;
  onOpenDeploy?:      (agentId?: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────
export function GlobalVoiceCommand({
  onOpenVoiceWizard,
  onOpenWikiBrain,
  onOpenDeploy,
}: GlobalVoiceCommandProps) {
  const {
    isOpen, open, close, isListening, transcript, dispatch,
    setOnOpenVoiceWizard, setOnOpenWikiBrain, setOnOpenDeploy
  } = useGlobalVoice();

  const [feedback, setFeedback]   = useState("");
  const [matched,  setMatched]    = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");

  // ── Sync local callbacks to singleton provider ───────────────────────
  useEffect(() => {
    setOnOpenVoiceWizard(() => onOpenVoiceWizard?.());
    setOnOpenWikiBrain((id) => onOpenWikiBrain?.(id));
    setOnOpenDeploy((id) => onOpenDeploy?.(id));
  }, [onOpenVoiceWizard, onOpenWikiBrain, onOpenDeploy, setOnOpenVoiceWizard, setOnOpenWikiBrain, setOnOpenDeploy]);

  // ── Feedback logic for VOICE ─────────────────────────────────────────
  // Note: The Provider also toasts, but we want local UI feedback too.
  useEffect(() => {
    if (!transcript) return;
    // We don't call dispatch here because the Provider already does it for voice.
    // However, we need to know the result to show local feedback.
    // OPTIMIZATION: We could add result/feedback to context, but for now 
    // we'll just let the Provider handle voice feedback via Toast.
    // For manual input (text/suggestion), we'll still call dispatch locally.
  }, [transcript]);

  // ── Text input fallback ───────────────────────────────────────────────
  const handleTextSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!textInput.trim()) return;
      const result = dispatch(textInput.trim());
      setFeedback(result.feedback);
      setMatched(result.matched);
      setTextInput("");
      if (result.matched) setTimeout(() => { close(); setMatched(null); }, 1000);
    },
    [textInput, dispatch, close]
  );

  // ── Suggestion click ──────────────────────────────────────────────────
  const handleSuggestion = useCallback(
    (cmd: string) => {
      const result = dispatch(cmd);
      setFeedback(result.feedback);
      setMatched(result.matched);
      if (result.matched) setTimeout(() => { close(); setMatched(null); }, 900);
    },
    [dispatch, close]
  );

  return (
    <>
      {/* ── Floating FAB ─────────────────────────────────────────────── */}
      <motion.button
        onClick={isOpen ? close : open}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Open voice command palette (Ctrl+Space)"
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full",
          "flex items-center justify-center shadow-2xl",
          "transition-colors duration-300 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isOpen
            ? "bg-danger text-white shadow-danger/40"
            : "bg-primary text-white shadow-primary/40"
        )}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="mic"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}
            >
              <Mic className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring when listening */}
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
          />
        )}
      </motion.button>

      {/* ── Keyboard hint badge ───────────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="fixed bottom-8 right-24 z-[99] hidden md:flex items-center gap-1.5
                       px-2.5 py-1 rounded-lg bg-surface-2/80 backdrop-blur border border-white/10
                       text-[10px] font-bold text-white/30 uppercase tracking-widest pointer-events-none"
          >
            <Command className="w-3 h-3" />
            <span>Space</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Palette overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-[98] bg-black/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{   opacity: 0, y: -24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[99]
                         w-full max-w-xl mx-4"
            >
              <div className="glass-panel-heavy rounded-3xl border border-white/10
                              shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                    isListening ? "bg-danger/20 text-danger" : "bg-primary/20 text-primary"
                  )}>
                    {isListening
                      ? <MicOff className="w-4 h-4" />
                      : <Mic    className="w-4 h-4" />
                    }
                  </div>

                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Voice Command Center
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={isListening ? "listening" : "idle"}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={cn(
                          "text-sm font-semibold",
                          isListening ? "text-danger" : "text-white/50"
                        )}
                      >
                        {isListening ? "Listening…" : "Say a command or type below"}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Waveform bars */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-end gap-[3px] h-6"
                      >
                        {[0.4, 0.8, 0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                          <motion.span
                            key={i}
                            className="w-1 rounded-full bg-danger"
                            animate={{ scaleY: [h, 1, h] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.08 }}
                            style={{ height: "20px", transformOrigin: "bottom" }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Transcript display ──────────────────────────────── */}
                <AnimatePresence>
                  {transcript && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 py-3 bg-white/[0.02] border-b border-white/5"
                    >
                      <p className="text-sm text-white/70 italic">
                        <span className="text-primary font-bold not-italic">You: </span>
                        &ldquo;{transcript}&rdquo;
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Feedback ────────────────────────────────────────── */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "px-5 py-3 flex items-center gap-2 text-sm font-semibold border-b border-white/5",
                        matched === true  ? "text-success bg-success/5"  :
                        matched === false ? "text-warning bg-warning/5"  : "text-white/50"
                      )}
                    >
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                      {matched === false
                        ? `Didn't understand "${transcript}" — try typing below`
                        : feedback
                      }
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Text input fallback ─────────────────────────────── */}
                <form onSubmit={handleTextSubmit} className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl
                                  bg-white/[0.04] border border-white/10
                                  focus-within:border-primary/40 transition-colors">
                    <Search className="w-4 h-4 text-white/20 flex-shrink-0" />
                    <input
                      autoFocus
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Type a command…"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20
                                 outline-none font-medium"
                    />
                    {textInput && (
                      <button type="submit"
                        className="text-[10px] font-black uppercase tracking-widest
                                   text-primary hover:text-white transition-colors"
                      >
                        Run
                      </button>
                    )}
                  </div>
                </form>

                {/* ── Suggestion chips ────────────────────────────────── */}
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.cmd}
                      onClick={() => handleSuggestion(s.cmd)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                 bg-white/[0.04] border border-white/10 text-[11px]
                                 font-bold text-white/50 hover:bg-white/[0.08]
                                 hover:text-white hover:border-white/20 transition-all"
                    >
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* ── Footer ──────────────────────────────────────────── */}
                <div className="px-5 py-3 bg-white/[0.01] flex items-center justify-between
                                text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Command className="w-3 h-3" /> Space to toggle
                  </span>
                  <span>Esc to close</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
