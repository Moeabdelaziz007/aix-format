import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Hero } from "@/sections/Hero";
import { Features } from "@/sections/Features";
import { HowItWorks } from "@/sections/HowItWorks";
import { LiveDemo } from "@/sections/LiveDemo";
import { Pricing } from "@/sections/Pricing";
import { Footer } from "@/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-white">
      {/* Global Navigation */}
      <Navbar />

      <main>
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: Features Grid */}
        <Features />

        {/* Section 3: Interactive Demo */}
        <LiveDemo />

        {/* Section 4: Workflow / How it works */}
        <HowItWorks />

        {/* Section 5: Pricing */}
        <Pricing />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Bottom Status Bar */}
      <SovereignStatusBar />
    </div>
  );
}
