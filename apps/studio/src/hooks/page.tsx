'use client';

import React from 'react';
import VoiceOrb from '../../components/VoiceOrb';
import { useVoiceWizard } from '../../hooks/useVoiceWizard';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceSetupPage() {
    const { state, transcript, error, toggleRecording } = useVoiceWizard();

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-600 mb-4 tracking-wide">
                    Sovereign Voice Wizard
                </h1>
                <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                    انقر على الكرة للتحدث. صِف وكيلك الذكي وسيقوم النظام ببنائه وتوقيعه تلقائياً بهوية Pi.
                </p>
            </div>

            <VoiceOrb state={state} onClick={toggleRecording} />

            <div className="mt-12 h-24 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
                        >
                            {error}
                        </motion.p>
                    )}
                    {transcript && !error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl max-w-lg text-center shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                        >
                            <p className="text-gray-200 text-lg leading-relaxed">"{transcript}"</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}