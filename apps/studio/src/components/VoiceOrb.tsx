'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'done';

interface VoiceOrbProps {
    state: VoiceState;
    onClick?: () => void;
}

export default function VoiceOrb({ state, onClick }: VoiceOrbProps) {
    // هندسة الحركات (Animations) لكل حالة من حالات معالج الصوت
    const orbVariants: Variants = {
        idle: {
            scale: [1, 1.05, 1],
            opacity: 0.8,
            boxShadow: "0px 0px 20px rgba(99, 102, 241, 0.2)",
            transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        },
        listening: {
            scale: [1, 1.2, 1.1, 1.3, 1],
            opacity: 1,
            boxShadow: "0px 0px 40px rgba(236, 72, 153, 0.6)", // لون وردي (Pi Network) للإشارة للتسجيل
            transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
        },
        processing: {
            scale: 1,
            rotate: [0, 180, 360],
            borderRadius: ["50%", "30%", "50%"],
            boxShadow: "0px 0px 30px rgba(139, 92, 246, 0.5)", // لون بنفسجي لعملية التفكير
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
        },
        speaking: {
            scale: [1, 1.15, 1],
            opacity: [0.9, 1, 0.9],
            boxShadow: "0px 0px 50px rgba(14, 165, 233, 0.7)", // أزرق سماوي للتحدث
            transition: { duration: 0.5, repeat: Infinity, ease: "circOut" } // حركة سريعة تشبه الموجات الصوتية
        },
        done: {
            scale: 1,
            opacity: 0.5,
            boxShadow: "0px 0px 10px rgba(16, 185, 129, 0.3)", // أخضر للاكتمال
            transition: { duration: 0.5 }
        }
    };

    // أمواج محيطية (Ripples) تظهر فقط عند التحدث أو الاستماع
    const showRipples = state === 'listening' || state === 'speaking';

    return (
        <div className="relative flex items-center justify-center w-64 h-64 cursor-pointer" onClick={onClick}>
            {/* تأثير الأمواج الزجاجية (Glassmorphism Ripples) */}
            {showRipples && (
                <>
                    <motion.div
                        className="absolute inset-0 rounded-full border border-indigo-500/30 bg-indigo-500/10"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full border border-pink-500/30 bg-pink-500/10"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                </>
            )}

            {/* النواة المركزية (Core Orb) */}
            <motion.div
                variants={orbVariants}
                initial="idle"
                animate={state}
                className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-900/80 to-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center overflow-hidden"
            >
                {/* تأثير انعكاس الضوء الداخلي */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-full" />

                {/* أيقونة متغيرة حسب الحالة */}
                <div className="text-white/70 text-sm font-medium tracking-widest uppercase">
                    {state === 'idle' && 'START'}
                    {state === 'listening' && 'REC'}
                    {state === 'processing' && 'AI'}
                    {state === 'speaking' && 'VOICE'}
                    {state === 'done' && 'OK'}
                </div>
            </motion.div>
        </div>
    );
}