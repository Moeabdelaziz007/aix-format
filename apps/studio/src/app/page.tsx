import { Navbar } from "@/components/layout/Navbar";
import { SetupWizard } from "@/components/studio/SetupWizard";
import Image from "next/image";
import { AgentCard } from "@/components/studio/AgentCard";
import { VoiceOrb } from "@/components/studio/VoiceOrb";
import { AgenticKycSetup } from "@/components/studio/AgenticKycSetup";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#05050A] font-[family-name:var(--font-geist-sans)]">
      <Navbar />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-12 row-start-2 items-center sm:items-start w-full max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
            <div className="flex flex-col gap-4 text-center md:text-left">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
                Sovereign Pi Agents
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl font-light">
                Build, deploy, and monetize autonomous AI agents via the AIX format and Pi Network KYC.
              </p>
              <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
                <a
                  className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-2 hover:bg-indigo-700 text-sm sm:text-base h-12 px-8 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  href="#"
                >
                  Deploy New Agent
                </a>
                <a
                  className="rounded-full border border-solid border-[var(--color-border)] transition-colors flex items-center justify-center bg-[rgba(20,20,30,0.5)] hover:bg-[rgba(30,30,40,0.8)] text-white text-sm sm:text-base h-12 px-8 sm:px-6 backdrop-blur-sm"
                  href="#"
                >
                  Read AIX Spec
                </a>
              </div>
            </div>

            <div className="w-full md:w-1/3 flex justify-center">
              <VoiceOrb />
            </div>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-white mb-2">My Agents</h2>
              <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
                <AgentCard
                  name="Data Analyzer Pro"
                  role="Data Scientist"
                  price="0.5"
                  status="online"
                  color="#6366f1"
                />
                <AgentCard
                  name="Customer Support Bot"
                  role="Support Specialist"
                  price="0.1"
                  status="offline"
                  color="#8b5cf6"
                />
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-white mb-2">Security & Identity</h2>
                <AgenticKycSetup />
              </div>
              <div className="flex flex-col gap-6">
                <h2 className="text-2xl font-bold text-white mb-2">Quick Setup</h2>
                <SetupWizard />
              </div>
            </div>
          </div>
        </main>


      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-gray-500 text-sm">
        <a className="flex items-center gap-2 hover:text-white transition-colors" href="#">
          AIX Format Spec
        </a>
        <a className="flex items-center gap-2 hover:text-white transition-colors" href="#">
          Pi Network Integration
        </a>
        <a className="flex items-center gap-2 hover:text-white transition-colors" href="#">
          AMRIKYY AI Solutions
        </a>
      </footer>
    </div>
  );
}
