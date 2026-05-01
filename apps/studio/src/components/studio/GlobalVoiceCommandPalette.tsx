"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Keyboard, X, Zap, Navigation, Search, BrainCircuit, Rocket } from "lucide-react";
import { useVoiceCommandCtx } from "@/components/providers/VoiceCommandProvider";
import { parseIntent } from "@/hooks/useVoiceCommands";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const HINTS = [
  { icon: Navigation,   label: "Go to marketplace",        cmd: "marketplace"        },
  { icon: Zap,          label: "Build a new agent",        cmd: "build agent"        },
  { icon: BrainCircuit, label: "Open WikiBrain for agent", cmd: "wikibrain for <id>" },
  { icon: Rocket,       label: "Deploy agent",             cmd: "deploy"             },
  { icon: Search,       label: "Search agents",            cmd: "find <query>"       },
];

const BARS = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4];

export function GlobalVoiceCommandPalette() {
  const { isOpen, close, isListening, transcript } = useVoiceCommandCtx();
  const router = useRouter();

  const fireHint = (cmd: string) => {
    const intent = parseIntent(cmd);
    switch (intent.type) {
      case "navigate":
        router.push(intent.path);
        toast.success(`Navigating to ${intent.label}`);
        close();
        break;
      case "open_voice_wizard":
        toast.info("Say 'new agent' or click the mic");
        break;
      default:
        toast.info(`Try saying: "${cmd}"`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="vcp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            key="vcp-panel"
            initial={{ opacity: 0, scale: 0.94, y: -20 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{   opacity: 0, scale: 0.94, y: -20  }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 z-[9999] w-full max-w-xl px-4"
          >
            <div className="rounded-3xl border border-white/10 bg-[#0d0d14]/95 shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden">

              {/* Header */}
              <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-white/5">
                {/* Orb */}
                <div className={cn(
                  "relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  isListening
                    ? "bg-red-500/20 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-blue-500/10 border border-blue-500/20"
                )}>
                  <Mic className={cn(
                    "w-5 h-5 transition-colors",
                    isListening ? "text-red-400 animate-pulse" : "text-blue-400"
                  )} />
                  {isListening && [1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute inset-0 rounded-2xl border border-red-500/30"
                      animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
                    />
                  ))}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-base font-semibold truncate transition-colors",
                    transcript ? "text-white" : "text-white/30"
                  )}>
                    {transcript || (isListening ? "Listening…" : "Say a command")}
                  </p>
                  <p className="text-[11px] text-white/20 mt-0.5 font-medium">
                    {isListening
                      ? "Speak now — release to process"
                      : "Ctrl+Space to toggle · Esc to close"}
                  </p>
                </div>

                <button
                  onClick={close}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Waveform */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 48, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex items-center justify-center gap-[3px] px-6 overflow-hidden"
                  >
                    {BARS.map((h, i) => (
                      <motion.span
                        key={i}
                        className="w-1 rounded-full bg-red-400"
                        animate={{ scaleY: [h, 1, h * 0.6, 1, h] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8 + i * 0.05,
                          delay: i * 0.06,
                          ease: "easeInOut",
                        }}
                        style={{ height: 32, transformOrigin: "center" }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hints */}
              <div className="p-4 grid grid-cols-1 gap-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-2 mb-1">
                  Quick Commands
                </p>
                {HINTS.map(({ icon: Icon, label, cmd }) => (
                  <button
                    key={cmd}
                    onClick={() => fireHint(cmd)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/10 transition-colors">
                      <Icon className="w-3.5 h-3.5 text-white/40 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <span className="text-sm text-white/50 group-hover:text-white transition-colors flex-1">
                      {label}
                    </span>
                    <kbd className="hidden sm:block text-[10px] font-mono text-white/20 bg-white/5 px-2 py-0.5 rounded-md">
                      {cmd}
                    </kbd>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-white/20 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="w-3 h-3" /> Ctrl+Space
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3 h-3" /> Hold FAB
                  </span>
                </div>
                <span className="text-[10px] text-white/15 font-mono">AIX Voice Engine v1</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
