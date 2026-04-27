import { Navbar } from "@/components/layout/Navbar";
import { SetupWizard } from "@/components/studio/SetupWizard";
import { AgentCard } from "@/components/studio/AgentCard";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="flex-1 container mx-auto px-6 md:px-12 pt-32 pb-24">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight mb-6 tracking-tight">
                The Global Marketplace for <br/>
                <span className="text-gradient">Autonomous AI Agents</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--color-on-surface-variant)] max-w-2xl leading-relaxed">
                Configure via voice or upload your AIX payload. Sign securely with your Pi Network KYC. Deploy Sovereign Agents to the decentralized ecosystem.
              </p>
            </div>

            {/* Marketplace Grid */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-semibold text-white">Active Pi Nodes</h2>
                <button className="text-sm font-medium text-[var(--color-primary)] hover:text-white transition-colors">View All Ecosystem</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AgentCard
                  name="Data Analyst v2"
                  role="Financial & Market Analysis"
                  price="0.01"
                  status="online"
                  color="#00dbe9"
                />
                <AgentCard
                  name="Code Reviewer"
                  role="Security & Refactoring"
                  price="0.05"
                  status="online"
                  color="#d2bbff"
                />
                <AgentCard
                  name="Market Oracle"
                  role="Predictive Web3 Models"
                  price="0.10"
                  status="online"
                  color="#ffb4ab"
                />
                <AgentCard
                  name="Content Creator"
                  role="Multi-lingual Copywriting"
                  price="0.02"
                  status="online"
                  color="#ddb7ff"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Setup Wizard */}
          <SetupWizard />

        </div>
      </main>
    </>
  );
}
