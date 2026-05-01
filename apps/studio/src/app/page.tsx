"use client";

import { useState } from "react";
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

export default function Home() {
  const [isVoiceWizardOpen, setIsVoiceWizardOpen] = useState(false);
  const router = useRouter();

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
            onComplete={(manifest) => {
              // Redirect to builder with manifest in state or URL
              setIsVoiceWizardOpen(false);
              router.push('/builder');
            }}
            onDeploy={(manifest) => {
              // Direct deploy logic
              setIsVoiceWizardOpen(false);
              router.push('/builder?deploy=true');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
