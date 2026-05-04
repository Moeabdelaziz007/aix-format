"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { LiveActivityTicker } from "@/components/layout/LiveActivityTicker";
import { Hero } from "@/sections/Hero";
import { QuickAccessGrid } from "@/sections/QuickAccessGrid";
import { FeaturedAgents } from "@/sections/FeaturedAgents";
import { TrustedBy } from "@/sections/TrustedBy";
import { Footer } from "@/sections/Footer";
import { VoiceWizard } from "@/components/studio/VoiceWizard";
import { useVoiceCommandCtx } from "@/components/providers/VoiceCommandProvider";

export default function Home() {
  const [isVoiceWizardOpen, setIsVoiceWizardOpen] = useState(false);
  const router = useRouter();
  const { setOnOpenVoiceWizard } = useVoiceCommandCtx();

  // Register the voice-wizard callback so voice commands can open it
  useEffect(() => {
    setOnOpenVoiceWizard(() => setIsVoiceWizardOpen(true));
  }, [setOnOpenVoiceWizard]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      <Navbar />

      <main>
        <Hero onStartVoice={() => setIsVoiceWizardOpen(true)} />
        <LiveActivityTicker />
        <QuickAccessGrid />
        <FeaturedAgents />
        <TrustedBy />
      </main>

      <Footer />
      <SovereignStatusBar />

      <AnimatePresence>
        {isVoiceWizardOpen && (
          <VoiceWizard
            onClose={() => setIsVoiceWizardOpen(false)}
            onComplete={() => {
              setIsVoiceWizardOpen(false);
              router.push('/builder');
            }}
            onDeploy={() => {
              setIsVoiceWizardOpen(false);
              router.push('/builder?deploy=true');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
