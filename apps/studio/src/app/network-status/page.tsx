"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Activity, Shield, Zap, Globe, Server, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";

const services = [
  { name: "Pi Network KYC Gateway", status: "operational", latency: 42, uptime: "99.98%", region: "Global" },
  { name: "AIX Validation Engine", status: "operational", latency: 18, uptime: "99.99%", region: "Edge" },
  { name: "AxiomID DID Registry", status: "operational", latency: 65, uptime: "99.95%", region: "Distributed" },
  { name: "Ed25519 Signing Service", status: "operational", latency: 12, uptime: "100%", region: "Global" },
  { name: "M2M Payment Settlement", status: "degraded", latency: 320, uptime: "98.12%", region: "Pi Mainnet" },
  { name: "ABOM Checksum Oracle", status: "operational", latency: 29, uptime: "99.97%", region: "IPFS" },
  { name: "MCP Server Registry", status: "operational", latency: 55, uptime: "99.90%", region: "Sovereign" },
  { name: "Voice Orb Inference API", status: "maintenance", latency: 0, uptime: "97.50%", region: "Cloud" },
];

const metrics = [
  { label: "Total Agents Deployed", value: "12,847", delta: "+24 today", icon: <Server className="w-5 h-5" />, color: "text-indigo-400" },
  { label: "KYC Verifications", value: "8,203", delta: "+11 today", icon: <Shield className="w-5 h-5" />, color: "text-green-400" },
  { label: "M2M Transactions", value: "94,120", delta: "+1.2k today", icon: <Zap className="w-5 h-5" />, color: "text-yellow-400" },
  { label: "Network Nodes", value: "3,441", delta: "Pi Nodes Active", icon: <Globe className="w-5 h-5" />, color: "text-cyan-400" },
];

const statusColor: Record<string, string> = {
  operational: "text-green-400",
  degraded: "text-yellow-400",
  maintenance: "text-blue-400",
  outage: "text-red-400",
};

const statusBg: Record<string, string> = {
  operational: "bg-green-400/10 border-green-400/20",
  degraded: "bg-yellow-400/10 border-yellow-400/20",
  maintenance: "bg-blue-400/10 border-blue-400/20",
  outage: "bg-red-400/10 border-red-400/20",
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "operational") return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (status === "degraded") return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  return <Clock className="w-4 h-4 text-blue-400" />;
};

export default function NetworkStatusPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => { setLastUpdated(new Date()); setRefreshing(false); }, 1200);
  };

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallOk = services.every(s => s.status === "operational");
  const degraded = services.some(s => s.status === "degraded");

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-[family-name:var(--font-manrope)]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 md:px-12 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text text-gradient tracking-tight mb-2">Network Status</h1>
            <p className="text-gray-400">Real-time health of the AIX Sovereign Network and Pi integration layer.</p>
          </div>
          <button onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-gray-400 text-sm hover:text-white hover:bg-white/5 transition">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Overall Banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 mb-8 border flex items-center gap-4 ${
            overallOk ? 'bg-green-400/5 border-green-400/20' : degraded ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-red-400/5 border-red-400/20'
          }`}
        >
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            overallOk ? 'bg-green-400' : degraded ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <div>
            <p className={`font-bold ${ overallOk ? 'text-green-400' : degraded ? 'text-yellow-400' : 'text-red-400' }`}>
              {overallOk ? '✅ All Systems Operational' : degraded ? '⚠️ Partial Degradation Detected' : '🔴 System Outage'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {metrics.map((m, i) => (
            <motion.div key={m.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card rounded-xl p-4 border border-white/5"
            >
              <div className={`flex items-center gap-2 mb-2 ${m.color}`}>{m.icon}<span className="text-xs">{m.label}</span></div>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-[10px] text-gray-500 mt-1">{m.delta}</p>
            </motion.div>
          ))}
        </div>

        {/* Services Table */}
        <h2 className="text-lg font-bold text-white mb-4">Service Health</h2>
        <div className="flex flex-col gap-3">
          {services.map((svc, i) => (
            <motion.div key={svc.name}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="card rounded-xl px-5 py-4 border border-white/5 flex items-center gap-4 flex-wrap"
            >
              <StatusIcon status={svc.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{svc.name}</p>
                <p className="text-xs text-gray-500">{svc.region}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Uptime: <span className="text-white font-mono">{svc.uptime}</span></span>
                {svc.latency > 0 && <span>Latency: <span className="text-white font-mono">{svc.latency}ms</span></span>}
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize ${statusColor[svc.status]} ${statusBg[svc.status]}`}>
                {svc.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Incident Log */}
        <h2 className="text-lg font-bold text-white mt-10 mb-4">Recent Incidents</h2>
        <div className="card rounded-xl border border-white/5 divide-y divide-white/5">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">Investigating</span>
              <span className="text-xs text-gray-500">Apr 29, 2026 — 14:30 UTC</span>
            </div>
            <p className="text-sm text-white">M2M Payment Settlement experiencing elevated latency on Pi Mainnet.</p>
            <p className="text-xs text-gray-500 mt-1">Engineering team investigating. ETA: 2h.</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full">Resolved</span>
              <span className="text-xs text-gray-500">Apr 28, 2026 — 09:15 UTC</span>
            </div>
            <p className="text-sm text-white">Voice Orb Inference API scheduled maintenance completed successfully.</p>
            <p className="text-xs text-gray-500 mt-1">All systems restored. Duration: 45min.</p>
          </div>
        </div>
      </div>
      <SovereignStatusBar />
    </div>
  );
}
