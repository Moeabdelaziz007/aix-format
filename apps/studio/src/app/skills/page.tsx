'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/components/shared';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Shield, 
  Code2, 
  BarChart3, 
  Scale, 
  ChevronRight,
  User,
  Zap,
  Eye,
  ShoppingBag,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const SKILL_CATEGORIES = [
  { id: 'all', label: 'All Skills', icon: <Zap size={16} /> },
  { id: 'research', label: 'Market Research', icon: <BarChart3 size={16} /> },
  { id: 'security', label: 'Cybersecurity', icon: <Shield size={16} /> },
  { id: 'dev', label: 'Coding & Ops', icon: <Code2 size={16} /> },
  { id: 'legal', label: 'Legal & Compliance', icon: <Scale size={16} /> },
];

const SKILLS = [
  {
    id: 'deep_market_analysis',
    title: 'Institutional Market Analysis',
    description: 'Autonomous research workflow for analyzing L1 protocol tokenomics and whale activity.',
    category: 'research',
    author: 'did:aix:axiom_labs',
    price: '0.5π',
    content: `## Institutional Market Analysis Skill
This skill enables agents to perform deep-dive analysis on blockchain protocols.
### Methodology
1. Data ingestion from indexing nodes.
2. Sentiment analysis via social graphs.
3. Liquidity depth assessment.
### Operational Parameters
- Context Window: 128k
- Reliability Score: 98%
...[REDACTED]...`
  },
  {
    id: 'abom_security_audit',
    title: 'ABOM Forensic Auditor',
    description: 'Specialized skill for detecting supply chain vulnerabilities in agent manifests.',
    category: 'security',
    author: 'did:aix:security_dao',
    price: 'Free',
    content: `## ABOM Forensic Auditor
Automated scanning for dependency risks in AIX v1.3 manifests.
### Core Checks
- SLSA Level verification.
- Signature integrity validation.
- Malware pattern matching in MCP toolhooks.`
  },
  {
    id: 'legal_drafting_m2m',
    title: 'M2M Service Agreement Drafter',
    description: 'Generates legally binding M2M contracts for autonomous agent service delivery.',
    category: 'legal',
    author: 'did:aix:legal_node',
    price: '1.2π',
    content: `## M2M Service Agreement Drafter
Generates standard AIX Service Agreements.
- Parties: AxiomID identities.
- Settlement: Network native.
- Dispute Resolution: Decentralized arbitration.`
  }
];

export default function SkillsCatalogPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewSkill, setPreviewSkill] = useState<any>(null);

  const filteredSkills = SKILLS.filter(s => activeCategory === 'all' || s.category === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase">Skills Catalog</h1>
            <p className="text-[var(--color-on-surface-variant)] max-w-2xl leading-relaxed">
              Equip your agents with specialized intelligence modules. Modular Markdown-based skills for complex task execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                <Info size={16} className="text-primary" />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                   Revenue Sharing: <span className="text-white">70% Author / 30% Platform</span>
                </span>
             </div>
             <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                <Plus size={16} /> Publish Skill
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Categories */}
          <div className="lg:col-span-3 space-y-2">
             <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 ml-2">Specializations</div>
             {SKILL_CATEGORIES.map(cat => (
               <button
                 key={cat.id}
                 onClick={() => setActiveCategory(cat.id)}
                 className={cn(
                   "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all border group",
                   activeCategory === cat.id 
                     ? "bg-primary/10 border-primary/20 text-white" 
                     : "bg-transparent border-transparent text-zinc-500 hover:bg-white/5 hover:text-white"
                 )}
               >
                 <span className={cn(
                   "transition-colors",
                   activeCategory === cat.id ? "text-primary" : "text-zinc-600 group-hover:text-zinc-300"
                 )}>
                    {cat.icon}
                 </span>
                 <span className="text-[11px] font-bold uppercase tracking-wider">{cat.label}</span>
               </button>
             ))}
          </div>

          {/* Grid */}
          <div className="lg:col-span-9">
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSkills.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group card p-6 rounded-[2.5rem] border-white/5 hover:border-primary/40 hover:bg-white/[0.03] transition-all flex flex-col gap-6"
                  >
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-white/10 text-zinc-500">{skill.category}</Badge>
                           <span className={cn(
                             "text-[10px] font-black italic",
                             skill.price === 'Free' ? "text-emerald-400" : "text-primary"
                           )}>{skill.price}</span>
                        </div>
                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors leading-tight">{skill.title}</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed min-h-[40px]">{skill.description}</p>
                     </div>

                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                           <User size={12} className="text-zinc-600" />
                        </div>
                        <code className="text-[10px] text-zinc-700 font-mono tracking-tighter truncate w-32">{skill.author}</code>
                     </div>

                     <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button 
                          onClick={() => setPreviewSkill(skill)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                           <Eye size={14} /> Preview
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-black font-black text-[10px] uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20">
                           <Plus size={14} /> Add to Agent
                        </button>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewSkill && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setPreviewSkill(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl card rounded-[3rem] border-white/10 p-10 space-y-6 overflow-hidden bg-[#050507]"
            >
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">{previewSkill.title}</h2>
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest">Skill Intelligence Preview (First 500 chars)</p>
                  </div>
                  <button onClick={() => setPreviewSkill(null)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                     <Plus className="rotate-45" size={24} />
                  </button>
               </div>

               <div className="p-8 rounded-3xl bg-black/40 border border-white/5 font-mono text-xs leading-relaxed text-zinc-400 overflow-y-auto max-h-[400px] custom-scrollbar">
                  <pre className="whitespace-pre-wrap">{previewSkill.content}</pre>
               </div>

               <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                     <span>Settlement: Pi Network</span>
                     <span>DID: {previewSkill.author.slice(0, 15)}...</span>
                  </div>
                  <button className="px-10 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:scale-[1.02] transition-all">
                     Purchase & Install
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SovereignStatusBar />
    </div>
  );
}
