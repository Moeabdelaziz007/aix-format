"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseIntent } from "@/hooks/useVoiceCommands";

// ── Shared voice state ─────────────────────────────────────────────────────
interface VoiceCommandCtx {
  isOpen:       boolean;
  isListening:  boolean;
  transcript:   string;
  open:         () => void;
  close:        () => void;
  startListening: () => void;
  stopListening:  () => void;
  // Extras for palette
  onOpenVoiceWizard?: () => void;
  setOnOpenVoiceWizard: (fn: () => void) => void;
}

const Ctx = createContext<VoiceCommandCtx | null>(null);

export function useVoiceCommandCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVoiceCommandCtx must be inside VoiceCommandProvider");
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────
export function VoiceCommandProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isOpen,      setIsOpen]      = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript,  setTranscript]  = useState("");
  const recognitionRef = useRef<any>(null);
  const wizardCbRef    = useRef<(() => void) | undefined>(undefined);

  // ── Speech Recognition init ──────────────────────────────────────────
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined" || recognitionRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const r = new SR();
    r.continuous     = false;
    r.interimResults = false;
    r.lang           = "en-US";

    r.onresult = (e: any) => {
      const text: string = e.results?.[0]?.[0]?.transcript ?? "";
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
    try { recognitionRef.current.start(); setIsListening(true); }
    catch { setIsListening(false); }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const open  = useCallback(() => { setIsOpen(true);  setTranscript(""); }, []);
  const close = useCallback(() => { setIsOpen(false); stopListening();   }, [stopListening]);

  // ── Auto-start mic when palette opens ───────────────────────────────
  useEffect(() => {
    if (isOpen) startListening();
    else        stopListening();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcut ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") { e.preventDefault(); isOpen ? close() : open(); }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, open, close]);

  // ── Dispatch intent when transcript arrives ──────────────────────────
  const prevRef = useRef("");
  useEffect(() => {
    if (!transcript || transcript === prevRef.current) return;
    prevRef.current = transcript;

    const intent = parseIntent(transcript);

    switch (intent.type) {
      case "navigate":
        router.push(intent.path);
        toast.success(`Navigating to ${intent.label}`);
        close();
        break;
      case "open_voice_wizard":
        wizardCbRef.current?.();
        toast.success("Opening Voice Wizard");
        close();
        break;
      case "open_deploy":
        router.push(intent.agentId ? `/agents/${intent.agentId}?action=deploy` : "/my-agents");
        toast.success("Opening deploy panel");
        close();
        break;
      case "search":
        router.push(`/marketplace?q=${encodeURIComponent(intent.query)}`);
        toast.success(`Searching for ${intent.query}`);
        close();
        break;
      case "open_wikibrain":
        router.push(`/agents/${intent.agentId}`);
        toast.success(`Opening WikiBrain for ${intent.agentId}`);
        close();
        break;
      default:
        toast.error(`Command not recognised: "${transcript}"`, { duration: 3000 });
    }
  }, [transcript]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOnOpenVoiceWizard = useCallback((fn: () => void) => {
    wizardCbRef.current = fn;
  }, []);

  return (
    <Ctx.Provider value={{
      isOpen, isListening, transcript,
      open, close, startListening, stopListening,
      setOnOpenVoiceWizard,
    }}>
      {children}
    </Ctx.Provider>
  );
}
