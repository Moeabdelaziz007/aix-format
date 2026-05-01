'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { Badge, Typography } from '@/design-system/components';
import { 
  Download, 
  Star, 
  ShieldCheck, 
  Cpu, 
  FileSearch, 
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Twitter,
  Github
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const DEVELOPERS = {
  axiom_labs: {
    name: 'Axiom Labs',
    bio: 'Pioneering the sovereign agent ecosystem. We build core infrastructure and security primitives for the decentralized future.',
    verified: true,
    website: 'https://axiom.org',
    twitter: '@AxiomFoundation',
    github: 'axiom-foundation',
    stats: {
      total_plugins: 2,
      total_downloads: '12.6k',
      avg_rating: 4.9
    },
    plugins: [
      {
        id: 'axiom_trust_guard',
        name: 'Axiom Trust Guard',
        description: 'Advanced biometric identity verification and KYC anchoring for institutional agents.',
        category: 'kyc',
        downloads: '4.2k',
        rating: 4.9,
        icon: <ShieldCheck className="text-emerald-400" />
      },
      {
        id: 'immutable_logger',
        name: 'Immutable Logger',
        description: 'Cryptographically signed audit logs for all agent decisions and tool invocations.',
        category: 'audit',
        downloads: '8.4k',
        rating: 4.9,
        icon: <FileSearch className="text-purple-mcp" />
      }
    ]
  }
};

export default function DeveloperProfilePage() {
  const params = useParams();
  const devId = params.id as string;
  const dev = DEVELOPERS[devId as keyof typeof DEVELOPERS];

  if (!dev) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
         <div className="text-center space-y-4">
            <h1 className="text-2xl font-black text-white">Developer Not Found</h1>
            <Link href="/plugins" className="text-primary hover:underline text-sm font-bold uppercase tracking-widest">Back to Directory</Link>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <Link 
          href="/plugins"
          className="flex items-center gap-2 text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-widest mb-12 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Side: Profile Info */}
          <div className="lg:col-span-4 space-y-8">
             <div className="space-y-6">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-purple-mcp p-0.5 shadow-2xl">
                   <div className="w-full h-full rounded-[1.9rem] bg-black flex items-center justify-center text-3xl font-black text-white italic">
                      {dev.name[0]}
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase italic">{dev.name}</h1>
                      {dev.verified && <CheckCircle2 className="text-primary" size={20} />}
                   </div>
                   <p className="text-sm text-zinc-400 leading-relaxed">
                      {dev.bio}
                   </p>
                </div>

                <div className="flex items-center gap-4">
                   <a href={dev.website} target="_blank" className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-all">
                      <Globe size={18} />
                   </a>
                   <a href={`https://twitter.com/${dev.twitter}`} target="_blank" className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-all">
                      <Twitter size={18} />
                   </a>
                   <a href={`https://github.com/${dev.github}`} target="_blank" className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-primary transition-all">
                      <Github size={18} />
                   </a>
                </div>
             </div>

             <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Developer Stats</div>
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-1">
                      <div className="text-2xl font-black text-white italic">{dev.stats.total_plugins}</div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Plugins</div>
                   </div>
                   <div className="space-y-1">
                      <div className="text-2xl font-black text-white italic">{dev.stats.total_downloads}</div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Downloads</div>
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2 text-2xl font-black text-white italic">
                         {dev.stats.avg_rating} <Star size={18} className="fill-amber-400 text-amber-400 mb-1" />
                      </div>
                      <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Avg. Rating</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Side: Plugins List */}
          <div className="lg:col-span-8 space-y-6">
             <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4 ml-2">Plugins by {dev.name}</div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dev.plugins.map((plugin, i) => (
                  <motion.div
                    key={plugin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group glass-panel-heavy p-6 rounded-[2.5rem] border-white/5 hover:border-primary/40 hover:bg-white/[0.03] transition-all flex flex-col gap-6"
                  >
                     <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-2xl shadow-2xl">
                           {plugin.icon}
                        </div>
                     </div>

                     <div className="space-y-1">
                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">{plugin.name}</h3>
                        <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">{plugin.category}</p>
                     </div>

                     <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px] line-clamp-2">
                        {plugin.description}
                     </p>

                     <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5">
                              <Download size={14} className="text-zinc-600" />
                              <span className="text-[10px] font-bold text-white">{plugin.downloads}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold text-white">{plugin.rating}</span>
                           </div>
                        </div>
                        <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-black hover:border-primary transition-all">
                           Install
                        </button>
                     </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
