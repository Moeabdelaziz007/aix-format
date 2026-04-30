'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import { useSettings } from '@/hooks/useSettings';
import { 
  User, 
  Shield, 
  Key,
  Bell,
  AlertTriangle,
  Copy, 
  Check, 
  LogOut,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
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

        <div className="space-y-8">
          {/* Profile Section */}
          <section className="glass-panel rounded-[2.5rem] p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 text-[var(--color-primary)]">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Display Name</label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  Sovereign User
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium">
                  user@pi-network.com
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Pi UID</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 font-mono text-sm truncate">
                    pi_uid_84729104829104829104
                  </div>
                  <button
                    onClick={() => handleCopy('pi_uid_84729104829104829104')}
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* API Keys Section */}
          <section className="glass-panel rounded-[2.5rem] p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 text-[var(--color-primary)]">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">API Keys</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vercel API Token</label>
                <div className="relative">
                  <input
                    type="password"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    placeholder="sk_..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">Required for automated agent deployment to Vercel edge nodes.</p>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="glass-panel rounded-[2.5rem] p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-white/5 text-[var(--color-primary)]">
                <Bell className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold">Email Alerts</h4>
                <p className="text-xs text-zinc-500">Receive alerts for deployment success and critical agent errors.</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full relative transition-all ${notifications ? 'bg-[var(--color-primary)]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="glass-panel rounded-[2.5rem] p-8 border border-red-500/20 bg-red-500/[0.02]">
            <div className="flex items-center gap-4 mb-8 text-red-500">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Danger Zone</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all">
                <Download className="w-5 h-5" />
                Export Identity
              </button>
              <button className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 font-bold hover:bg-red-500/20 transition-all">
                <LogOut className="w-5 h-5" />
                Disconnect Pi
              </button>
            </div>
          </section>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}
