"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { useVoiceCommandCtx } from "@/components/providers/VoiceCommandProvider";
import { cn } from "@/lib/utils";

/**
 * Floating Action Button — bottom-right.
 * • Tap   → toggle command palette
 * • Hold  → hold-to-talk (500 ms threshold)
 */
export function GlobalVoiceFAB() {
  const { isOpen, open, close, isListening, startListening, stopListening } =
    useVoiceCommandCtx();

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holding   = useRef(false);

  const onDown = useCallback(() => {
    holding.current = false;
    holdTimer.current = setTimeout(() => {
      holding.current = true;
      if (!isOpen) open();
      startListening();
    }, 500);
  }, [isOpen, open, startListening]);

  const onUp = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (holding.current) {
      stopListening();
    } else if (isOpen) {
      close();
    } else {
      open();
    }
    holding.current = false;
  }, [isOpen, open, close, stopListening]);

  return (
    <div className="fixed bottom-6 right-6 z-[9997] flex flex-col items-end gap-2">
      {/* Tooltip */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="pointer-events-none"
          >
            <div className="bg-[#0d0d14]/90 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white/40 font-medium whitespace-nowrap backdrop-blur-xl">
              Ctrl+Space · hold to talk
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Voice command (Ctrl+Space)"
        className={cn(
          "relative w-14 h-14 rounded-2xl flex items-center justify-center",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isListening
            ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            : isOpen
            ? "bg-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            : "bg-[#1a1a2e] border border-white/10 hover:border-blue-500/30"
        )}
      >
        {/* Pulse rings */}
        {isListening && [1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-2xl border border-red-400/40"
            animate={{ scale: [1, 1.4 + i * 0.2], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.25 }}
          />
        ))}

        <Mic className={cn(
          "w-5 h-5 transition-colors",
          isListening ? "text-white animate-pulse"
            : isOpen   ? "text-white"
            : "text-white/50"
        )} />
      </motion.button>
    </div>
  );
}
