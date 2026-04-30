import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { SovereignStatusBar } from '@/components/layout/SovereignStatusBar';
import {
  TrendingUp,
  Users,
  CheckCircle,
  Activity,
  DollarSign,
  BarChart3
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics | AIX Studio',
  description: 'Monitor your sovereign agent fleet performance and earnings.',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Agent Analytics</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-2">
            Real-time performance metrics for your AIX ecosystem.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KPICard
            title="Total Earnings"
            value="748π"
            icon={<DollarSign className="w-5 h-5" />}
            trend="+12% from last month"
          />
          <KPICard
            title="Tasks Completed"
            value="1,284"
            icon={<CheckCircle className="w-5 h-5" />}
            trend="+84 this week"
          />
          <KPICard
            title="Success Rate"
            value="99.4%"
            icon={<TrendingUp className="w-5 h-5" />}
            trend="Stable"
          />
          <KPICard
            title="Active Agents"
            value="2"
            icon={<Activity className="w-5 h-5" />}
            trend="Online"
          />
        </div>

        {/* Chart Section */}
        <div className="glass-panel rounded-[2.5rem] p-8 mb-12 border border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
              Revenue over time (connecting...)
            </h3>
          </div>
          <div className="h-64 flex items-end gap-2 px-4">
            {[40, 70, 45, 90, 65, 80, 50, 85, 30, 60, 75, 95].map((h, i) => (
              <div 
                key={i}
                className="flex-1 bg-white/5 rounded-t-lg relative group transition-all hover:bg-[var(--color-primary)]/20"
                style={{ height: `${h}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-white/10">
          <div className="px-8 py-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                  <th className="px-8 py-4 font-semibold">Agent</th>
                  <th className="px-8 py-4 font-semibold">Action</th>
                  <th className="px-8 py-4 font-semibold">Status</th>
                  <th className="px-8 py-4 font-semibold">Earnings</th>
                  <th className="px-8 py-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                    <td className="px-8 py-6"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                    <td className="px-8 py-6"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                    <td className="px-8 py-6"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                    <td className="px-8 py-6"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SovereignStatusBar />
    </div>
  );
}

function KPICard({ title, value, icon, trend }: any) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-[var(--color-primary)]/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-[var(--color-on-surface-variant)] text-sm font-medium">{title}</h4>
        <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
        <p className="text-[10px] text-[var(--color-primary)] font-medium uppercase tracking-wider">{trend}</p>
      </div>
    </div>
  );
}
