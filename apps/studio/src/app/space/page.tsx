'use client';

/**
 * Agent Space — Sovereign Swarm Topology
 *
 * This page used to ship an aspirational 3D/2D force-graph view powered
 * by `three` and `react-force-graph-3d/2d`. Neither dependency is in
 * `apps/studio/package.json`, the dynamic imports were commented out at
 * the top of the file, and several JSX blocks were structurally broken,
 * so the page never type-checked and was blocking the entire
 * `apps/studio` TypeScript build on `main`.
 *
 * To unblock CI without silently dropping the route, this is a
 * compile-clean placeholder that:
 *  - Keeps the `/space` route alive (voice-command dispatcher in
 *    `hooks/useVoiceCommands.ts` and the `/api/space/graph` endpoint
 *    still resolve).
 *  - Fetches the same `/api/space/graph` payload so the API contract
 *    stays exercised.
 *  - Surfaces node/link counts so the page is visibly wired to the
 *    backend instead of looking dead.
 *
 * Restoration plan: reintroduce `three`, `@types/three`,
 * `react-force-graph-3d`, and `react-force-graph-2d` in a focused PR,
 * then replace this placeholder body with a real visualization in
 * another PR. Keep both changes out of this CI-unblock pass.
 */

import { useEffect, useState } from 'react';
import { Network } from 'lucide-react';

interface SpaceGraphNode {
  id: string;
  name: string;
}

interface SpaceGraphLink {
  source: string;
  target: string;
}

interface SpaceGraphPayload {
  nodes: SpaceGraphNode[];
  links: SpaceGraphLink[];
}

export default function SpacePage() {
  const [graphData, setGraphData] = useState<SpaceGraphPayload>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/space/graph');
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.nodes) && Array.isArray(data?.links)) {
          setGraphData(data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden relative flex flex-col items-center justify-center p-10">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Network className="text-indigo-500 w-5 h-5" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">
            Sovereign Swarm Topology
          </span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter">AGENT SPACE</h1>
        <p className="text-sm text-white/60 leading-relaxed">
          The interactive 3D topology view is being rebuilt. The
          underlying graph API is live and you can still observe live
          node and edge counts below.
        </p>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">
              Live Nodes
            </div>
            <div className="text-3xl font-black">
              {loading ? '…' : graphData.nodes.length}
            </div>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">
              Live Links
            </div>
            <div className="text-3xl font-black">
              {loading ? '…' : graphData.links.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 font-mono">
            graph fetch error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
