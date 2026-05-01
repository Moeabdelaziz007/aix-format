"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Global keyboard shortcut + hold-to-talk hook.
 *
 * Triggers:
 *   • Ctrl+Space  (desktop)
 *   • Long-press on the floating mic button (mobile)
 *
 * Returns:
 *   isOpen      — whether the command palette is visible
 *   open/close  — imperative controls
 *   transcript  — last recognised text (Web Speech API, no server round-trip)
 *   isListening — mic is active
 */
export function useGlobalVoice() {
  const [isOpen, setIsOpen]           = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript]   = useState("");
  const recognitionRef = useRef<any>(null);

  // ── Keyboard shortcut ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        stopListening();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Web Speech API ───────────────────────────────────────────────────────
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR || recognitionRef.current) return;

    const r = new SR();
    r.continuous      = false;
    r.interimResults  = false;
    r.lang            = "en-US";

    r.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      setIsListening(false);
    };
    r.onerror = () => setIsListening(false);
    r.onend   = () => setIsListening(false);

    recognitionRef.current = r;
  }, []);

  const startListening = useCallback(() => {
    initRecognition();
    if (!recognitionRef.current) return;
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const open  = useCallback(() => { setIsOpen(true);  setTranscript(""); }, []);
  const close = useCallback(() => { setIsOpen(false); stopListening();   }, [stopListening]);

  // Auto-start mic when palette opens
  useEffect(() => {
    if (isOpen) startListening();
    else        stopListening();
  }, [isOpen, startListening, stopListening]);

  return { isOpen, open, close, isListening, transcript, startListening, stopListening };
}
