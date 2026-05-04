"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from "@/components/layout/Navbar";
import { SovereignStatusBar } from "@/components/layout/SovereignStatusBar";
import { Shield, AlertTriangle, CheckCircle, Info, Copy, Download, Search, FileText } from 'lucide-react';

export default function ScanPage() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scan failed');
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#39FF14]';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium': return <Info className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(5,5,7,1)] font-[family-name:var(--font-manrope)] pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-24 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight text-glow">ABOM Risk Scanner</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Scan your AI Agent manifests (AIX Format) for security risks, compliance with EU CRA / NIST RMF, and cryptographic integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="card rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Agent Manifest (YAML/JSON)</label>
                <button
                  onClick={() => setContent('')}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste AIX YAML here..."
                className="w-full h-80 bg-black/40 rounded-2xl p-4 font-mono text-sm border border-white/10 focus:border-[var(--color-primary)] outline-none transition-all resize-none text-white shadow-inner"
              />
              <button
                onClick={handleScan}
                disabled={isLoading || !content.trim()}
                className="w-full py-4 rounded-2xl bg-[var(--color-primary)] text-black font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)] active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isLoading ? 'Scanning Agent...' : 'Analyze Agent Security'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {!report && !error && !isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full card rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center gap-4 text-gray-500"
                >
                  <div className="p-4 rounded-full bg-white/5">
                    <FileText className="w-12 h-12 opacity-20" />
                  </div>
                  <p className="text-sm">Paste a manifest and click scan to see the security analysis.</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card rounded-3xl p-6 border border-red-500/20 bg-red-500/5 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <AlertTriangle className="w-5 h-5" />
                    Scan Error
                  </div>
                  <p className="text-sm text-red-300/80">{error}</p>
                </motion.div>
              )}

              {report && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* Score Card */}
                  <div className="card rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent flex flex-col items-center gap-2 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)] opacity-[0.03] blur-3xl rounded-full" />
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * report.score) / 100 }}
                          strokeDasharray={364.4}
                          className={getScoreColor(report.score)}
                          strokeLinecap="round"
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white">{report.score}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Grade {report.grade}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col items-center">
                      <h3 className="text-xl font-bold text-white">Trust Assessment</h3>
                      <p className="text-[11px] font-mono text-gray-500 mt-1 uppercase tracking-wider">{new Date(report.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Compliance List */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card rounded-2xl p-4 border border-white/5 bg-white/[0.02] flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">EU CRA Compliance</span>
                      <div className="flex items-center gap-2">
                        {report.compliance.eu_cra ? <CheckCircle className="w-4 h-4 text-[#39FF14]" /> : <AlertTriangle className="w-4 h-4 text-gray-600" />}
                        <span className={report.compliance.eu_cra ? 'text-white text-xs font-bold' : 'text-gray-500 text-xs'}>
                          {report.compliance.eu_cra ? 'Compliant' : 'Non-compliant'}
                        </span>
                      </div>
                    </div>
                    <div className="card rounded-2xl p-4 border border-white/5 bg-white/[0.02] flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">NIST AI RMF</span>
                      <div className="flex items-center gap-2">
                        {report.compliance.nist_ai_rmf ? <CheckCircle className="w-4 h-4 text-[#39FF14]" /> : <AlertTriangle className="w-4 h-4 text-gray-600" />}
                        <span className={report.compliance.nist_ai_rmf ? 'text-white text-xs font-bold' : 'text-gray-500 text-xs'}>
                          {report.compliance.nist_ai_rmf ? 'Compliant' : 'Non-compliant'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risks List */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identified Risks</h4>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-gray-400 font-mono">{report.risks.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {report.risks.length > 0 ? report.risks.map((risk: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="card rounded-2xl p-4 border border-white/5 bg-white/[0.02] flex gap-3 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="mt-0.5 flex-shrink-0">{getSeverityIcon(risk.severity)}</div>
                          <p className="text-xs text-gray-300 leading-relaxed">{risk.message}</p>
                        </motion.div>
                      )) : (
                        <div className="card rounded-2xl p-4 border border-[#39FF14]/20 bg-[#39FF14]/5 flex gap-3 items-center">
                          <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                          <p className="text-xs text-[#39FF14] font-bold uppercase tracking-wide">No security risks identified.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 bg-white/[0.05] text-white text-xs font-bold hover:bg-white/[0.1] transition-all group">
                      <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                      Export Report
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 bg-[rgba(0,212,255,0.06)] text-[var(--color-primary)] text-xs font-bold hover:bg-[rgba(0,212,255,0.1)] transition-all">
                      <Copy className="w-4 h-4" />
                      Copy Badge
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
