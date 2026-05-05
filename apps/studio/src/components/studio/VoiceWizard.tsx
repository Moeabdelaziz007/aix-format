'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Settings, Sparkles } from 'lucide-react';

const Card = ({ children, className }: any) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden ${className}`}>
    {children}
  </div>
);

export function VoiceWizard() {
  const [isListening, setIsListening] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <motion.div
              animate={{ scale: isListening ? [1, 1.2, 1] : 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`w-24 h-24 rounded-full flex items-center justify-center ${isListening ? 'bg-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.4)]' : 'bg-zinc-800'}`}
            >
              {isListening ? <Mic size={40} className="text-white" /> : <MicOff size={40} className="text-white/40" />}
            </motion.div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white">Agent Voice Configuration</h3>
            <p className="text-zinc-500 mt-2">Speak to your agent to calibrate the VLA response latency.</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsListening(!isListening)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all"
            >
              {isListening ? 'Stop Calibration' : 'Start Calibration'}
            </button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
              <Settings size={24} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50 text-center mt-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Powered by Groq Whisper & Gemini 2.0 Flash
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
