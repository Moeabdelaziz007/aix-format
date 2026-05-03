'use client';

import { useEffect, useState, useRef } from 'react';

/**
 * Terminal Entry Type
 */
type EntryType = 'THOUGHT' | 'ACTION' | 'OBSERVE' | 'REFLECT' | 'STEP' | 'DONE' | 'FAILED';

/**
 * Terminal Entry
 */
interface TerminalEntry {
  id: string;
  timestamp: number;
  type: EntryType;
  content: string;
  expanded: boolean;
}

/**
 * Component Props
 */
interface ReasoningTerminalProps {
  agentId: string;
  taskId?: string;
  className?: string;
}

/**
 * Reasoning Terminal
 * 
 * Displays the AI agent's ReAct loop in real-time.
 * Shows Thought → Action → Observation → Reflection cycle.
 * 
 * @param agentId - Agent identifier to filter events
 * @param taskId - Optional task ID for further filtering
 * @param className - Additional CSS classes
 */
export function ReasoningTerminal({
  agentId,
  taskId,
  className = ''
}: ReasoningTerminalProps) {
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxEntries = 100;

  // Auto-scroll to latest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [entries]);

  // Connect to SSE stream
  useEffect(() => {
    const url = taskId
      ? `/api/pulse/stream?agentId=${agentId}&taskId=${taskId}`
      : `/api/pulse/stream?agentId=${agentId}`;
    
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);

        let entryType: EntryType | null = null;
        let content = '';

        // Map event types to terminal entry types
        switch (event.type) {
          case 'THOUGHT_GENERATED':
            entryType = 'THOUGHT';
            content = event.metadata?.thought || event.message || '';
            break;
          case 'ACTION_EXECUTING':
            entryType = 'ACTION';
            const tool = event.metadata?.tool || 'unknown';
            const input = event.metadata?.input ? JSON.stringify(event.metadata.input, null, 2) : '{}';
            content = `${tool}(${input})`;
            break;
          case 'OBSERVATION_RECORDED':
            entryType = 'OBSERVE';
            content = event.metadata?.observation || event.message || '';
            break;
          case 'REFLECTION_COMPLETE':
            entryType = 'REFLECT';
            const shouldContinue = event.metadata?.shouldContinue;
            content = shouldContinue ? 'Continuing to next step...' : 'Task analysis complete';
            break;
          case 'STEP_STARTED':
            entryType = 'STEP';
            const step = event.metadata?.step || '?';
            const maxSteps = event.metadata?.maxSteps || '?';
            content = `Step ${step}/${maxSteps}`;
            break;
          case 'AGENT_DONE':
            entryType = 'DONE';
            content = event.message || 'Task completed successfully';
            break;
          case 'AGENT_FAILED':
            entryType = 'FAILED';
            content = event.message || 'Task failed';
            break;
        }

        if (entryType) {
          const newEntry: TerminalEntry = {
            id: event.id || Math.random().toString(36).slice(2),
            timestamp: event.timestamp || Date.now(),
            type: entryType,
            content,
            expanded: false
          };

          setEntries((prev) => {
            const updated = [...prev, newEntry];
            return updated.slice(-maxEntries);
          });
        }
      } catch (err) {
        console.error('[ReasoningTerminal] Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [agentId, taskId]);

  // Toggle entry expansion
  const toggleExpand = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, expanded: !entry.expanded } : entry
      )
    );
  };

  // Clear terminal
  const handleClear = () => {
    setEntries([]);
  };

  // Export to markdown
  const handleExport = () => {
    const markdown = entries
      .map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        return `## ${time} | ${entry.type}\n\n${entry.content}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reasoning-${agentId}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get entry style
  const getEntryStyle = (type: EntryType) => {
    switch (type) {
      case 'THOUGHT':
        return 'text-blue-400 bg-blue-950/30 border-blue-500/30';
      case 'ACTION':
        return 'text-yellow-400 bg-yellow-950/30 border-yellow-500/30';
      case 'OBSERVE':
        return 'text-purple-400 bg-purple-950/30 border-purple-500/30';
      case 'REFLECT':
        return 'text-green-400 bg-green-950/30 border-green-500/30';
      case 'STEP':
        return 'text-cyan-400 bg-cyan-950/20 border-cyan-500/20';
      case 'DONE':
        return 'text-green-400 bg-green-950/40 border-green-500/50';
      case 'FAILED':
        return 'text-red-400 bg-red-950/40 border-red-500/50';
      default:
        return 'text-zinc-400 bg-zinc-950/30 border-zinc-500/30';
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#09090B] rounded-lg border border-zinc-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-100">💭 AI Reasoning</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            clear
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            export
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
        {entries.length === 0 && (
          <div className="text-zinc-600 text-center py-8">
            Waiting for agent activity...
          </div>
        )}

        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => toggleExpand(entry.id)}
            className={`
              p-3 rounded border cursor-pointer transition-all duration-200
              hover:border-opacity-60
              ${getEntryStyle(entry.type)}
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-zinc-500 text-xs whitespace-nowrap">
                {formatTime(entry.timestamp)}
              </span>
              <span className="font-semibold whitespace-nowrap min-w-[80px]">
                {entry.type}
              </span>
              <div className="flex-1 overflow-hidden">
                <div className={entry.expanded ? '' : 'truncate'}>
                  {entry.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Auto-scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}

// Made with Moe Abdelaziz
