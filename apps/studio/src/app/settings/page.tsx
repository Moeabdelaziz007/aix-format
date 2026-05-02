'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { useSettings } from '@/hooks/useSettings';
import {
  AlertTriangle,
  Copy,
  Check,
  LogOut,
  Download,
  Settings as SettingsIcon,
  Cpu,
  Box,
  Layers,
  Fingerprint,
  Bell,
  Key,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge, InfoTooltip, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState('identity');
  const {
    vercelToken,
    setVercelToken,
    notifications,
    setNotifications
  } = useSettings();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORIES = [
    { id: 'identity', label: 'Identity & KYC', icon: Fingerprint },
    { id: 'infrastructure', label: 'Infrastructure', icon: Cpu },
    { id: 'security', label: 'API & Security', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">
            Manage your AIX Studio configuration and identity.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Category Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-black shadow-[0_10px_30px_rgba(0,219,233,0.2)]"
                    : "bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10"
                )}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-8">
            {activeCategory === 'identity' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="card rounded-[2.5rem] p-8 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 text-primary">
                        <Fingerprint className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Identity DNA</h2>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="success" className="mb-1">Verified</Badge>
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Sovereign Level 2</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assigned DID</label>
                        <InfoTooltip content="Your Decentralized Identifier (DID) is your unique, cryptographically verifiable ID on the network." />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 px-4 py-4 bg-black/40 border border-white/5 rounded-2xl text-primary font-mono text-xs truncate">
                          did:aix:84729104829104829104...
                        </div>
                        <button
                          onClick={() => handleCopy('did:aix:84729104829104829104')}
                          className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">KYC Tier</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <span className="text-white font-bold">Institutional</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Verification Hash</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl truncate font-mono text-[10px] text-zinc-400">
                          sha256:4f8e7d2a1c9b...
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="card rounded-[2.5rem] p-8 border border-white/10 space-y-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Connected Wallets</h3>
                    <InfoTooltip content="Manage the external accounts that can settle transactions for your agents." />
                  </div>
                  <div className="space-y-3">
                    {['Pi Wallet (Primary)', 'Ethereum (Cold Storage)'].map((w) => (
                      <div key={w} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          <span className="text-sm font-bold text-white">{w}</span>
                        </div>
                        <button className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Manage</button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'infrastructure' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="card rounded-[2.5rem] p-8 border border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 text-purple-mcp">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">MCP Servers</h2>
                    </div>
                    <button className="px-4 py-2 bg-purple-mcp/10 border border-purple-mcp/20 rounded-xl text-purple-mcp text-[10px] font-black uppercase tracking-widest hover:bg-purple-mcp/20 transition-all">
                      Add Server
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Axiom Core V1', status: 'Online', delay: '12ms' },
                      { name: 'Local SQLite Node', status: 'Online', delay: '2ms' }
                    ].map((s) => (
                      <div key={s.name} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Box className="w-5 h-5 text-zinc-600" />
                          <div>
                            <div className="text-sm font-bold text-white">{s.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">mcp://localhost:4000</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <div className="text-[10px] font-black text-emerald-500 uppercase">{s.status}</div>
                             <div className="text-[10px] text-zinc-600">{s.delay}</div>
                           </div>
                           <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"><SettingsIcon className="w-4 h-4 text-white/40" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card rounded-[2.5rem] p-8 border border-white/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 text-blue-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Plugins & Extensions</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {[
                       { name: 'Live Validator', desc: 'Real-time DNA linting' },
                       { name: 'Cost Estimator', desc: 'Predictive π pricing' }
                     ].map((p) => (
                       <div key={p.name} className="p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all">
                         <div className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{p.name}</div>
                         <div className="text-xs text-zinc-500 mb-4">{p.desc}</div>
                         <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px]">v1.2</Badge>
                            <button className="text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Uninstall</button>
                         </div>
                       </div>
                     ))}
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="card rounded-[2.5rem] p-8 border border-white/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 text-primary">
                      <Key className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">API Keys & Tokens</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Vercel API Token</label>
                        <InfoTooltip content="Required for automated agent deployment to Vercel edge nodes." />
                      </div>
                      <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="sk_..."
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">OpenAI API Key</label>
                        <InfoTooltip content="Used for internal AIX reasoning and persona refinement during construction." />
                      </div>
                      <input
                        type="password"
                        placeholder="sk_..."
                        className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary transition-all text-sm"
                      />
                    </div>
                  </div>
                </section>

                <section className="card rounded-[2.5rem] p-8 border border-red-500/20 bg-red-500/[0.02]">
                  <div className="flex items-center gap-4 mb-8 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">Danger Zone</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all text-sm uppercase tracking-widest">
                      <Download className="w-4 h-4" /> Export Identity
                    </button>
                    <button className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold hover:bg-red-500/20 transition-all text-sm uppercase tracking-widest">
                      <LogOut className="w-4 h-4" /> Disconnect
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeCategory === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="card rounded-[2.5rem] p-8 border border-white/10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-white/5 text-primary">
                      <Bell className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Alert Preferences</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div>
                        <h4 className="text-white font-bold">Deployment Success</h4>
                        <p className="text-xs text-zinc-500">Notify when an agent is successfully anchored to the registry.</p>
                      </div>
                      <button
                        onClick={() => setNotifications(!notifications)}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all",
                          notifications ? 'bg-primary' : 'bg-white/10'
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          notifications ? 'left-7' : 'left-1'
                        )} />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
