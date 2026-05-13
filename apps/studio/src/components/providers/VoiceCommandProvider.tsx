"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseIntent, useVoiceCommands } from "@/hooks/useVoiceCommands";
import { useParams } from "next/navigation";

// ── Shared voice state ─────────────────────────────────────────────────────
interface VoiceCommandCtx {
  isOpen:       boolean;
  isListening:  boolean;
  transcript:   string;
  open:         () => void;
  close:        () => void;
  startListening: () => void;
  stopListening:  () => void;
  dispatch:     (transcript: string) => { matched: boolean; feedback: string };
  // Extras for palette
  setOnOpenVoiceWizard: (fn: () => void) => void;
  setOnOpenWikiBrain:   (fn: (agentId: string) => void) => void;
  setOnOpenDeploy:      (fn: (agentId?: string) => void) => void;
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
  const wikiCbRef      = useRef<((agentId: string) => void) | undefined>(undefined);
  const deployCbRef    = useRef<((agentId?: string) => void) | undefined>(undefined);

  const { dispatch } = useVoiceCommands({
    onOpenVoiceWizard: () => wizardCbRef.current?.(),
    onOpenWikiBrain:   (id) => wikiCbRef.current?.(id),
    onOpenDeploy:      (id) => deployCbRef.current?.(id),
  });

  // ── Speech Recognition init ──────────────────────────────────────────
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined" || recognitionRef.current) return;
    const SR = (window as unknown).SpeechRecognition || (window as unknown).webkitSpeechRecognition;
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
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
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

    const result = dispatch(transcript);
    
    if (result.matched) {
      toast.success(result.feedback);
      // Auto-close palette on success if it was open
      if (isOpen) {
        const t = setTimeout(() => close(), 800);
        return () => clearTimeout(t);
      }
    } else {
      toast.error(`Command not recognised: "${transcript}"`, { duration: 3000 });
    }
  }, [transcript, dispatch, close, isOpen]);

  const setOnOpenVoiceWizard = useCallback((fn: () => void) => { wizardCbRef.current = fn; }, []);
  const setOnOpenWikiBrain   = useCallback((fn: (id: string) => void) => { wikiCbRef.current = fn; }, []);
  const setOnOpenDeploy      = useCallback((fn: (id?: string) => void) => { deployCbRef.current = fn; }, []);

  return (
    <Ctx.Provider value={{
      isOpen, isListening, transcript,
      open, close, startListening, stopListening,
      dispatch,
      setOnOpenVoiceWizard,
      setOnOpenWikiBrain,
      setOnOpenDeploy,
    }}>
      {children}
    </Ctx.Provider>
  );
}
