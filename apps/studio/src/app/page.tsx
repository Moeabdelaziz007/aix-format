import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { AgentsDashboard } from "@/components/home/AgentsDashboard";
import { LiveSection } from "@/components/home/LiveSection";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-manrope)]">
      <Navbar />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-12 row-start-2 items-center sm:items-start w-full max-w-6xl">
          <HeroSection />

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <AgentsDashboard />
            <LiveSection />
          </div>
        </main>

        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-500 text-sm">
          <Link href="/spec" className="flex items-center gap-2 hover:text-white transition-colors">
            AIX Format Spec
          </Link>
          <a className="flex items-center gap-2 hover:text-white transition-colors" href="https://axiomid.app">
            Pi Network Integration
          </a>
          <a className="flex items-center gap-2 hover:text-white transition-colors" href="https://axiomid.app">
            AMRIKYY AI Solutions
          </a>
        </footer>
      </div>

      <SovereignStatusBar />
    </div>
  );
}
