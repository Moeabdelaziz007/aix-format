import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { LiveActivityTicker } from "@/components/layout/LiveActivityTicker";
import { Hero } from "@/sections/Hero";
import { QuickAccessGrid } from "@/sections/QuickAccessGrid";
import { FeaturedAgents } from "@/sections/FeaturedAgents";
import { TrustedBy } from "@/sections/TrustedBy";
import { Footer } from "@/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-white overflow-x-hidden">
      {/* Global Navigation */}
      <Navbar />

      <main>
        {/* Section 1: Hero */}
        <Hero />

        {/* Live Activity Ticker */}
        <LiveActivityTicker />

        {/* Section 2: Quick Access */}
        <QuickAccessGrid />

        {/* Section 3: Featured Agents */}
        <FeaturedAgents />

        {/* Section 4: Social Proof */}
        <TrustedBy />
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Bottom Status Bar */}
      <SovereignStatusBar />
    </div>
  );
}
