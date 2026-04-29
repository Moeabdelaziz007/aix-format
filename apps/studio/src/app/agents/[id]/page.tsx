"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  BrainCircuit, 
  Zap, 
  ArrowLeft, 
  Globe, 
  Lock, 
  Cpu, 
  Coins, 
  ChevronRight,
  Code2,
  FileJson,
  CheckCircle2,
  Terminal,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { AgentRecord } from "@/lib/types";
import { mockAgents } from "@/lib/mock-agents";

export default function AgentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { getAgent, isLoading } = useLocalAgents();
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "capabilities" | "discovery">("overview");

  useEffect(() => {
    if (!isLoading) {
      const localAgent = getAgent(id);
      if (localAgent) {
        setAgent(localAgent);
      } else {
        // Fallback to mock data for demonstration
        const mock = mockAgents.find(a => a.id.toString() === id);
        if (mock) {
          // Convert mock to AgentRecord format
          setAgent({
            id: mock.id.toString(),
            manifest: {
              meta: { name: mock.name, role: mock.role, version: "1.0.0", format_version: "1.3", author: "Axiom Studio", description: mock.description },
              persona: { role: mock.role, instructions: "Standard operational parameters.", tone: "professional" },
              skills: mock.tags.map(t => ({ name: t, description: `Specialized in ${t}` })),
              security: { checksum: { algorithm: "sha256", value: "0x..." } },
              identity_layer: { id: `did:axiom:axiomid.app:agent-${id}`, authority: "axiomid.app", issuedAt: new Date().toISOString() },
              economics: { pricing_model: "pay_per_call", token: "PI" },
              abom: { bom_format: "CycloneDX", spec_version: "1.6", risk_level: "low", integrity_hash: "0x...", dependencies: [] }
            } as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: mock.status as any,
            color: mock.color,
            successRate: mock.rating * 20, // scale to 100
            tasksCompleted: mock.reviews * 5
          });
        }
      }
    }
  }, [id, isLoading, getAgent]);

  if (isLoading) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center"><Activity className="animate-spin text-[var(--color-primary)]" /></div>;
  if (!agent) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-white">Agent not found</div>;

  const color = agent.color || "#6366f1";

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-manrope)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Breadcrumbs / Back */}
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Hero Section */}
        <section className="relative glass-panel-heavy rounded-[32px] p-8 md:p-12 border border-white/5 overflow-hidden">
          <div 
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20"
            style={{ backgroundColor: color }}
          />
          
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            {/* Avatar/Icon */}
            <div 
              className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] flex items-center justify-center border flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${color}20, ${color}40)`,
                borderColor: `${color}40`,
                boxShadow: `0 0 40px ${color}20`,
              }}
            >
              <BrainCircuit className="w-16 h-16 md:w-20 md:h-20" style={{ color }} />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col gap-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{agent.manifest.meta.name}</h1>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  AxiomID Verified
                </span>
              </div>
              <p className="text-xl text-gray-400 font-light">{agent.manifest.meta.role}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Pricing</span>
                  <span className="text-xl font-bold text-white flex items-center gap-1">
                    <span style={{ color }}>π</span> 0.5 <span className="text-xs text-gray-500 font-normal">/ task</span>
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Success Rate</span>
                  <span className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {agent.successRate}%
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10 hidden md:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">Identity</span>
                  <span className="text-sm font-mono text-gray-400 truncate max-w-[200px]">{agent.manifest.identity_layer.id}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button className="btn btn-primary h-14 px-10 rounded-2xl shadow-[0_0_30px_rgba(57,255,20,0.3)] whitespace-nowrap">
                Hire Agent Now
              </button>
              <button className="btn btn-ghost h-12 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                Add to Favorites
              </button>
            </div>
          </div>
        </section>

        {/* Tabs Navigation */}
        <div className="flex border-b border-white/5 gap-8">
          {(["overview", "capabilities", "discovery"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-all relative capitalize ${
                activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="glass-panel p-8 rounded-3xl border border-white/5">
                    <h3 className="text-xl font-bold text-white mb-4">About Agent</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {agent.manifest.meta.description || "This agent is a specialized autonomous entity designed for high-precision operations within the Pi Network ecosystem. It adheres strictly to AIX v1.3 protocols and is identity-verified via AxiomID."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Globe className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Network Access</h4>
                        <p className="text-sm text-gray-500">Public Internet, Pi RPC</p>
                      </div>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Lock className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">Privacy Tier</h4>
                        <p className="text-sm text-gray-500">Encrypted Sovereign Edge</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="glass-panel p-6 rounded-3xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-[var(--color-primary)]" />
                      Sovereign Metadata
                    </h3>
                    <div className="flex flex-col gap-5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">AIX Version</span>
                        <span className="text-white text-sm font-mono">{agent.manifest.meta.format_version}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Release Tag</span>
                        <span className="text-white text-sm font-mono">v{agent.manifest.meta.version}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">ABOM Compliance</span>
                        <span className="text-emerald-400 text-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Certified
                        </span>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">Developer</span>
                        <span className="text-white text-sm">{agent.manifest.meta.author}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent">
                    <h3 className="text-lg font-bold text-white mb-2">Monetization</h3>
                    <p className="text-sm text-gray-400 mb-4">Earnings distributed via Pi Protocol smart contracts.</p>
                    <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <Coins className="w-6 h-6 text-[var(--color-primary)]" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Settlement Token</p>
                        <p className="text-white font-bold">Pi Network (Mainnet)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "capabilities" && (
              <motion.div
                key="capabilities"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="glass-panel p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Terminal className="w-6 h-6 text-blue-400" />
                    Tools & Skills
                  </h3>
                  <div className="flex flex-col gap-4">
                    {agent.manifest.skills.map((skill, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] group hover:border-white/10 transition-colors">
                        <h4 className="text-white font-medium mb-1 flex items-center justify-between">
                          {skill.name}
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                        </h4>
                        <p className="text-sm text-gray-500">{skill.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-white/5">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Code2 className="w-6 h-6 text-purple-400" />
                    MCP Prompts
                  </h3>
                  <div className="flex flex-col gap-4">
                    {agent.manifest.mcp?.prompts && agent.manifest.mcp.prompts.length > 0 ? (
                      agent.manifest.mcp.prompts.map((prompt, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                          <h4 className="text-white font-medium mb-1 font-mono text-sm">{prompt.name}</h4>
                          <p className="text-sm text-gray-500">{prompt.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-600">
                        <p>No MCP prompts configured for this agent.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "discovery" && (
              <motion.div
                key="discovery"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-medium">agent.aix.json</span>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase">Discovery Format</span>
                  </div>
                  <button className="text-xs text-gray-500 hover:text-white transition-colors underline">Download Manifest</button>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/40 overflow-hidden">
                  <pre className="text-xs md:text-sm font-mono text-emerald-500/90 overflow-x-auto custom-scrollbar leading-relaxed">
                    {JSON.stringify(agent.manifest, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
