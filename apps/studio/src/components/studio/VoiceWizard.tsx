"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, Volume2, Sparkles, CheckCircle2 } from "lucide-react";
import { useVoiceWizard } from "@/hooks/useVoiceWizard";

import { Card } from "@/components/ui/card";

/**
 * AIX Voice Setup Wizard UI
 * A premium, interactive overlay for conversational agent creation.
 */
export function VoiceWizard({ 
  onClose, 
  onComplete,
  onDeploy 
}: { 
  onClose: () => void;
  onComplete: (manifest: any) => void;
  onDeploy: (manifest: any) => void;
}) {
  const { 
    handleVoiceTurn, 
    isListening, 
    isSpeaking, 
    isProcessing,
    manifest, 
    messages 
  } = useVoiceWizard();

  const lastMessage = messages[messages.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 "
    >
      <Card className="relative w-full max-w-2xl overflow-hidden border-zinc-800 bg-zinc-950/90 ">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sovereign Wizard</h2>
              <p className="text-sm text-zinc-400">Describe your agent to get started</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 space-y-8 min-h-[400px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!manifest ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full text-center space-y-6"
              >
                {/* Visualizer / Pulse */}
                <div className="relative flex items-center justify-center h-48">
                  <AnimatePresence>
                    {(isListening || isSpeaking) && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className={`absolute w-32 h-32 rounded-full blur-3xl ${
                          isListening ? "bg-red-500/20" : "bg-blue-500/20"
                        }`}
                      />
                    )}
                  </AnimatePresence>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500  ${
                      isListening 
                        ? "bg-red-500 text-white /50"
                        : isSpeaking
                        ? "bg-blue-500 text-white /50"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                    onMouseDown={handleVoiceTurn}
                  >
                    {isListening ? (
                      <Mic className="w-10 h-10 animate-pulse" />
                    ) : isProcessing ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-10 h-10" />
                    ) : (
                      <Mic className="w-10 h-10" />
                    )}
                  </motion.div>
                </div>

                {/* Status & Last Message */}
                <div className="space-y-4 max-w-md mx-auto">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      isListening ? "border-red-500 text-red-500 bg-red-500/5" :
                      isProcessing ? "border-purple-500 text-purple-500 bg-purple-500/5" :
                      isSpeaking ? "border-blue-500 text-blue-500 bg-blue-500/5" :
                      "border-zinc-800 text-zinc-500"
                    }`}
                  >
                    {isListening ? "LISTENING..." :
                     isProcessing ? "THINKING..." :
                     isSpeaking ? "WIZARD SPEAKING..." :
                     "HOLD TO TALK"}
                  </span>
                  
                  <p className="text-lg text-white font-medium leading-relaxed">
                    {lastMessage?.role === 'assistant' 
                      ? lastMessage.content 
                      : lastMessage?.role === 'user'
                      ? `"${lastMessage.content}"`
                      : "Hi! I'm your AIX Architect. What kind of agent should we build today?"}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center space-y-6"
              >
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Manifest Ready!</h3>
                  <p className="text-zinc-400">I've generated a draft for "{manifest.meta?.name}".</p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-left max-h-[200px] overflow-auto scrollbar-hide">
                  <pre className="text-xs text-zinc-500 font-mono">
                    {JSON.stringify(manifest, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => onComplete(manifest)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900 rounded-md px-4 py-2 text-sm font-medium text-white"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeploy(manifest)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2 text-sm font-semibold"
                  >
                    Deploy Agent
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Hint */}
        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Powered by Groq Whisper & Gemini 2.0 Flash
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
