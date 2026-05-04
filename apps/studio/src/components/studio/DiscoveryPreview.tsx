'use client';

import { useEffect, useState } from 'react';
import { 
  FileCode, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { McpDiscoveryResponse, McpAgent } from '@/lib/types';

interface Props {
  agentDid?: string;
  agentName?: string;
}

export default function DiscoveryPreview({ agentDid, agentName }: Props) {
  const [data, setData] = useState<McpDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    fetch('/api/mcp-discovery')
      .then(r => { 
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`); 
        return r.json(); 
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Scanning MCP Registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 rounded-3xl bg-red-500/5 border border-red-500/20 flex flex-col items-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <div className="space-y-1">
          <h4 className="text-white font-bold">Discovery Failed</h4>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl border border-zinc-800 transition"
        >
          <RefreshCw className="w-3 h-3" />
          Retry Connection
        </button>
      </div>
    );
  }

  const foundAgent = agentDid && data?.agents?.find(a => a.did === agentDid);

  return (
    <div className="space-y-6">
      <div className="group relative p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 transition-all duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl border ${foundAgent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              {foundAgent ? <ShieldCheck className="w-6 h-6" /> : <Search className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                {foundAgent ? 'Discoverable via MCP' : (agentDid ? 'Not yet in MCP registry' : 'No DID — not discoverable')}
                {foundAgent && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              </h3>
              <p className="text-sm text-zinc-500 font-medium">
                {foundAgent ? `Active on the sovereign discovery layer` : `Registry scan completed for ${agentName || 'agent'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2  rounded-xl border border-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            <div className={`w-2 h-2 rounded-full ${foundAgent ? 'bg-emerald-500 [0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 [0_0_8px_rgba(245,158,11,0.5)]'}`} />
            {foundAgent ? 'Status: Indexed' : 'Status: Unknown'}
          </div>
        </div>

        {foundAgent ? (
          <div className="relative rounded-2xl border border-zinc-800 bg-black/50 overflow-hidden group/code">
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">discovery_record.json</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-emerald-500/60">VALID_SIGNATURE</span>
              </div>
            </div>
            <pre className="p-6 text-[12px] font-mono text-indigo-300 overflow-x-auto leading-relaxed custom-scrollbar">
              {JSON.stringify(foundAgent, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-black/20 border border-zinc-800 border-dashed flex flex-col items-center gap-4 text-center">
            <div className="p-3 rounded-full bg-zinc-800/50 text-zinc-600">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div className="max-w-xs space-y-2">
              <p className="text-sm text-zinc-400 font-medium italic">
                Connect your agent to a sovereign provider to enable global discovery.
              </p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-tighter">
                MCP Protocol v{data?.mcpVersion || '1.3.0'} Standard
              </p>
            </div>
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
             <span>v{data?.mcpVersion}</span>
             <span className="w-1 h-1 rounded-full bg-zinc-800" />
             <span>{data?.totalAgents} Agents Registered</span>
             <span className="w-1 h-1 rounded-full bg-zinc-800" />
             <span>Generated: {data?.generated ? new Date(data.generated).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 group-hover:text-indigo-400 transition-colors uppercase tracking-[0.2em] cursor-help">
            Protocol Compliant
            <CheckCircle2 className="w-3 h-3" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
