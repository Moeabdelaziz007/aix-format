"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Check, Zap, Shield, Crown } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-[rgba(5,5,7,1)] font-[family-name:var(--font-manrope)] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-24 flex flex-col items-center gap-16">
        <div className="flex flex-col items-center text-center gap-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge badge-primary px-4 py-1.5"
          >
            Sovereign Monetization
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white tracking-tight"
          >
            Scale Your <span className="text-glow text-[var(--color-primary)]">Agent Empire</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            Choose the protocol tier that fits your deployment needs. Pay securely via Pi Network or Stripe.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {Object.values(PLANS).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`card rounded-[2rem] p-8 border border-white/5 flex flex-col gap-8 relative overflow-hidden ${plan.id === 'pro' ? 'border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/20' : ''}`}
            >
              {plan.id === 'pro' && (
                <div className="absolute top-0 right-0 bg-[var(--color-primary)] text-black text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                  Recommended
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-2">
                  {plan.id === 'free' && <Zap className="w-6 h-6 text-blue-400" />}
                  {plan.id === 'builder' && <Shield className="w-6 h-6 text-green-400" />}
                  {plan.id === 'pro' && <Crown className="w-6 h-6 text-[var(--color-primary)]" />}
                  {plan.id === 'enterprise' && <Zap className="w-6 h-6 text-purple-400" />}
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 flex-grow">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">What's included</p>
                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <Check className="w-4 h-4 text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                  plan.id === 'free'
                    ? 'bg-white/5 text-white hover:bg-white/10'
                    : 'bg-[var(--color-primary)] text-black hover:brightness-110 shadow-[0_0_20px_rgba(57,255,20,0.15)]'
                }`}
              >
                {plan.id === 'free' ? 'Current Plan' : 'Get Started'}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="card rounded-3xl p-8 border border-white/5 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex flex-col gap-2">
            <h4 className="text-xl font-bold text-white">Need a custom solution?</h4>
            <p className="text-sm text-gray-400">Contact our enterprise team for volume licensing and custom protocol integrations.</p>
          </div>
          <button className="px-8 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-white font-bold whitespace-nowrap">
            Talk to Sales
          </button>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
    </ErrorBoundary>
  );
}
