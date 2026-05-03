import dynamic from 'next/dynamic';
import { Metadata } from 'next';

/**
 * Dynamic imports with SSR disabled for client components
 */
const ReasoningTerminal = dynamic(
  () => import('@/components/studio/ReasoningTerminal').then(mod => ({ default: mod.ReasoningTerminal })),
  { ssr: false }
);

const TrustChainVisualizer = dynamic(
  () => import('@/components/studio/TrustChainVisualizer').then(mod => ({ default: mod.TrustChainVisualizer })),
  { ssr: false }
);

/**
 * Page Props
 */
interface WowPageProps {
  searchParams: {
    agent?: string;
  };
}

/**
 * Generate metadata
 */
export async function generateMetadata({ searchParams }: WowPageProps): Promise<Metadata> {
  const agentId = searchParams.agent ?? 'default';
  return {
    title: `AIX Interactive — ${agentId}`,
    description: 'Real-time AI agent development environment'
  };
}

/**
 * WOW Dashboard Page
 * 
 * Interactive Development Environment showing:
 * - Live ReAct reasoning terminal
 * - Trust chain visualization
 * - Real-time agent state
 * 
 * @param searchParams.agent - Agent ID to monitor (default: 'default')
 */
export default function WowPage({ searchParams }: WowPageProps) {
  const agentId = searchParams.agent ?? 'default';

  return (
    <div className="grid grid-cols-[300px_1fr] grid-rows-[1fr_auto] h-screen bg-zinc-950">
      {/* Left Sidebar: Trust Chain */}
      <div className="row-span-2 border-r border-zinc-800 p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-zinc-100 mb-2">
            Agent: {agentId}
          </h2>
          <p className="text-sm text-zinc-500">
            Real-time monitoring
          </p>
        </div>
        <TrustChainVisualizer agentId={agentId} maxBlocks={5} />
      </div>

      {/* Right Panel: Reasoning Terminal */}
      <div className="overflow-hidden flex flex-col">
        <ReasoningTerminal agentId={agentId} className="flex-1" />
        
        {/* Bottom Info Bar */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-900">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">
                Streaming from: <span className="text-zinc-100 font-mono">/api/pulse/stream</span>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">
                Agent: <span className="text-zinc-100 font-mono">{agentId}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-zinc-400">Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Moe Abdelaziz
