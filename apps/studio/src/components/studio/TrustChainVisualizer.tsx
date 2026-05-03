'use client';

import { useEffect, useState } from 'react';

/**
 * Trust Chain Block
 */
interface TrustBlock {
  index: number;
  hash: string;
  prevHash: string;
  nonce: number;
  timestamp: number;
  agentId: string;
  action: string;
  delta: number;
  status: 'mining' | 'mined' | 'verified';
}

/**
 * Component Props
 */
interface TrustChainVisualizerProps {
  agentId: string;
  maxBlocks?: number;
  className?: string;
}

/**
 * Trust Chain Visualizer
 * 
 * Displays a vertical blockchain visualization showing trust transactions.
 * Animates mining process with real-time nonce counting and hash updates.
 * 
 * @param agentId - Agent identifier to filter events
 * @param maxBlocks - Maximum blocks to display (default: 10)
 * @param className - Additional CSS classes
 */
export function TrustChainVisualizer({
  agentId,
  maxBlocks = 10,
  className = ''
}: TrustChainVisualizerProps) {
  const [blocks, setBlocks] = useState<TrustBlock[]>([
    {
      index: 0,
      hash: '0x0000000000000000',
      prevHash: '0x0000000000000000',
      nonce: 0,
      timestamp: Date.now(),
      agentId,
      action: 'GENESIS',
      delta: 0,
      status: 'verified'
    }
  ]);
  const [trustScore, setTrustScore] = useState(0.0);
  const [miningNonce, setMiningNonce] = useState(0);
  const [miningHash, setMiningHash] = useState('0x????');

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(`/api/pulse/stream?agentId=${agentId}`);

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);

        // Handle TRUST_TX_MINING
        if (event.type === 'TRUST_TX_MINING') {
          const { nonce, hash } = event.metadata || {};
          setMiningNonce(nonce || 0);
          setMiningHash(hash || '0x????');

          // Add or update mining block
          setBlocks((prev) => {
            const existingIndex = prev.findIndex((b) => b.status === 'mining');
            const newBlock: TrustBlock = {
              index: prev.length,
              hash: hash || '0x????',
              prevHash: prev[prev.length - 1]?.hash || '0x0000',
              nonce: nonce || 0,
              timestamp: event.timestamp || Date.now(),
              agentId: event.agentId,
              action: event.message || 'Mining...',
              delta: 0,
              status: 'mining'
            };

            if (existingIndex >= 0) {
              // Update existing mining block
              const updated = [...prev];
              updated[existingIndex] = newBlock;
              return updated;
            } else {
              // Add new mining block
              return [...prev, newBlock].slice(-maxBlocks);
            }
          });
        }

        // Handle TRUST_TX_MINED
        if (event.type === 'TRUST_TX_MINED') {
          const { nonce, hash, done } = event.metadata || {};
          if (done) {
            setBlocks((prev) => {
              const updated = prev.map((b) =>
                b.status === 'mining'
                  ? { ...b, hash: hash || b.hash, nonce: nonce || b.nonce, status: 'mined' as const }
                  : b
              );
              return updated;
            });

            // Auto-verify after 1 second
            setTimeout(() => {
              setBlocks((prev) =>
                prev.map((b) => (b.status === 'mined' ? { ...b, status: 'verified' } : b))
              );
            }, 1000);
          }
        }

        // Handle TRUST_SCORE_UPDATED
        if (event.type === 'TRUST_SCORE_UPDATED') {
          const { totalTrust } = event.metadata || {};
          if (typeof totalTrust === 'number') {
            setTrustScore(totalTrust);
          }
        }
      } catch (err) {
        console.error('[TrustChainVisualizer] Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('[TrustChainVisualizer] SSE connection error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [agentId, maxBlocks]);

  // Animate mining nonce (fake increments for visual effect)
  useEffect(() => {
    const miningBlock = blocks.find((b) => b.status === 'mining');
    if (!miningBlock) return;

    const interval = setInterval(() => {
      setMiningNonce((prev) => prev + 100);
      // Generate random hex for visual effect
      const randomHex = Math.random().toString(16).slice(2, 14);
      setMiningHash(`0x${randomHex}`);
    }, 200);

    return () => clearInterval(interval);
  }, [blocks]);

  return (
    <div className={`flex flex-col gap-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          🔗 Trust Chain
        </h3>
        <div className="px-3 py-1 bg-green-950/30 border border-green-500/30 rounded-full">
          <span className="text-sm font-mono text-green-400">
            Score: {trustScore.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Chain */}
      <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
        {blocks.map((block, idx) => (
          <div key={`${block.index}-${block.timestamp}`}>
            {/* Block */}
            <div
              className={`
                p-4 rounded-lg border-2 transition-all duration-300
                ${
                  block.status === 'verified'
                    ? 'border-green-500 bg-green-950/20'
                    : block.status === 'mining'
                    ? 'border-yellow-500 bg-yellow-950/20 animate-pulse'
                    : 'border-blue-500 bg-blue-950/20'
                }
              `}
            >
              {/* Block Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-zinc-400">
                  #{block.index} {block.action}
                </span>
                {block.delta !== 0 && (
                  <span
                    className={`text-sm font-mono ${
                      block.delta > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {block.delta > 0 ? '+' : ''}
                    {block.delta.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Hash */}
              <div className="mb-2">
                <span className="text-xs text-zinc-500">hash: </span>
                <span className="text-xs font-mono text-zinc-300">
                  {block.status === 'mining' ? miningHash : block.hash.slice(0, 16)}...
                </span>
              </div>

              {/* Nonce (only for mining) */}
              {block.status === 'mining' && (
                <div className="mb-2">
                  <span className="text-xs text-zinc-500">nonce: </span>
                  <span className="text-xs font-mono text-yellow-400">
                    {miningNonce.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                {block.status === 'verified' && (
                  <span className="text-xs text-green-400">✅ verified</span>
                )}
                {block.status === 'mined' && (
                  <span className="text-xs text-blue-400">🔷 mined</span>
                )}
                {block.status === 'mining' && (
                  <span className="text-xs text-yellow-400">⛏️ mining...</span>
                )}
              </div>

              {/* Mining Progress Bar */}
              {block.status === 'mining' && (
                <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 animate-pulse"
                    style={{ width: `${(miningNonce % 1000) / 10}%` }}
                  />
                </div>
              )}
            </div>

            {/* Connector Arrow */}
            {idx < blocks.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="text-zinc-600">▼</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Made with Bob
