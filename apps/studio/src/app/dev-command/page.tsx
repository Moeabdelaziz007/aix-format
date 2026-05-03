'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface CommandState {
  input: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress: number;
}

interface ReasoningStep {
  id: string;
  timestamp: number;
  phase: 'observe' | 'decide' | 'act' | 'reflect';
  content: string;
  confidence: number;
}

interface TrustNode {
  id: string;
  type: 'validation' | 'execution' | 'verification';
  status: 'pending' | 'mining' | 'complete';
  hash?: string;
  connections: string[];
}

interface PetState {
  x: number;
  y: number;
  mood: 'sleeping' | 'curious' | 'working' | 'celebrating' | 'dying';
  animation: 'idle' | 'walk' | 'jump' | 'dance';
}

interface StreamChunk {
  id: string;
  content: string;
  type: 'thought' | 'action' | 'result' | 'error';
  timestamp: number;
}

export default function DevCommandPage() {
  // State
  const [command, setCommand] = useState<CommandState>({
    input: '',
    status: 'idle',
    progress: 0
  });
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [trustChain, setTrustChain] = useState<TrustNode[]>([]);
  const [pet, setPet] = useState<PetState>({
    x: 50,
    y: 50,
    mood: 'curious',
    animation: 'idle'
  });
  const [streamChunks, setStreamChunks] = useState<StreamChunk[]>([]);
  const [formData, setFormData] = useState({
    agentId: 'agent-001',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  });

  const terminalRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminals
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [reasoning, streamChunks]);

  // Pet movement
  useEffect(() => {
    const interval = setInterval(() => {
      if (command.status === 'processing') {
        setPet(prev => ({
          ...prev,
          x: Math.max(0, Math.min(100, prev.x + (Math.random() - 0.5) * 10)),
          y: Math.max(0, Math.min(100, prev.y + (Math.random() - 0.5) * 5)),
          animation: 'walk'
        }));
      } else {
        setPet(prev => ({ ...prev, animation: 'idle' }));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [command.status]);

  // Execute command
  const executeCommand = async () => {
    if (!command.input.trim()) return;

    setCommand(prev => ({ ...prev, status: 'processing', progress: 0 }));
    setReasoning([]);
    setTrustChain([]);
    setStreamChunks([]);
    setPet(prev => ({ ...prev, mood: 'working' }));

    try {
      // Simulate SSE stream
      const eventSource = new EventSource(`/api/dev-command/execute?cmd=${encodeURIComponent(command.input)}`);

      eventSource.addEventListener('reasoning', (e) => {
        const step: ReasoningStep = JSON.parse(e.data);
        setReasoning(prev => [...prev, step]);
      });

      eventSource.addEventListener('trust', (e) => {
        const node: TrustNode = JSON.parse(e.data);
        setTrustChain(prev => [...prev, node]);
      });

      eventSource.addEventListener('stream', (e) => {
        const chunk: StreamChunk = JSON.parse(e.data);
        setStreamChunks(prev => [...prev, chunk]);
      });

      eventSource.addEventListener('progress', (e) => {
        const { progress } = JSON.parse(e.data);
        setCommand(prev => ({ ...prev, progress }));
      });

      eventSource.addEventListener('complete', () => {
        setCommand(prev => ({ ...prev, status: 'complete', progress: 100 }));
        setPet(prev => ({ ...prev, mood: 'celebrating', animation: 'dance' }));
        eventSource.close();
      });

      eventSource.addEventListener('error', () => {
        setCommand(prev => ({ ...prev, status: 'error' }));
        setPet(prev => ({ ...prev, mood: 'dying' }));
        eventSource.close();
      });

    } catch (err) {
      setCommand(prev => ({ ...prev, status: 'error' }));
      setPet(prev => ({ ...prev, mood: 'dying' }));
    }
  };

  // Pet emoji based on mood
  const getPetEmoji = () => {
    const emojis = {
      sleeping: '😴',
      curious: '🤔',
      working: '⚡',
      celebrating: '🎉',
      dying: '💀'
    };
    return emojis[pet.mood];
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-transparent via-green-500 to-transparent animate-scan" />
      
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none opacity-5" style={{
        backgroundImage: 'linear-gradient(#0f0 1px, transparent 1px), linear-gradient(90deg, #0f0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Animated Pet */}
      <motion.div
        className="fixed text-6xl z-50 cursor-pointer"
        animate={{
          left: `${pet.x}%`,
          top: `${pet.y}%`,
          rotate: pet.animation === 'dance' ? [0, 10, -10, 0] : 0
        }}
        transition={{ duration: 0.5 }}
        onClick={() => setPet(prev => ({ ...prev, animation: 'jump' }))}
      >
        {getPetEmoji()}
      </motion.div>

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="border border-green-500 p-4 bg-black/80 backdrop-blur">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="animate-pulse">▶</span>
            INTERACTIVE DEV ENVIRONMENT
          </h1>
          <p className="text-green-600 text-sm">Multi-dimensional command execution with real-time visualization</p>
        </div>

        {/* Command Input + Dynamic Form */}
        <div className="grid grid-cols-2 gap-4">
          {/* Command Input */}
          <div className="border border-green-500 p-4 bg-black/80 backdrop-blur">
            <label className="block text-sm mb-2 text-green-600">COMMAND INPUT</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={command.input}
                onChange={(e) => setCommand(prev => ({ ...prev, input: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                placeholder="Enter command..."
                className="flex-1 bg-black border border-green-700 px-3 py-2 text-green-400 focus:border-green-500 focus:outline-none"
                disabled={command.status === 'processing'}
              />
              <button
                onClick={executeCommand}
                disabled={command.status === 'processing'}
                className="px-6 py-2 bg-green-900 border border-green-500 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {command.status === 'processing' ? 'PROCESSING...' : 'EXECUTE'}
              </button>
            </div>
            
            {/* Progress Bar */}
            {command.status === 'processing' && (
              <div className="mt-4">
                <div className="h-2 bg-green-950 border border-green-700 overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${command.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-green-600 mt-1">{command.progress}% complete</p>
              </div>
            )}
          </div>

          {/* Dynamic Form */}
          <div className="border border-green-500 p-4 bg-black/80 backdrop-blur">
            <label className="block text-sm mb-2 text-green-600">CONFIGURATION</label>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-green-700">Agent ID</label>
                <input
                  type="text"
                  value={formData.agentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, agentId: e.target.value }))}
                  className="w-full bg-black border border-green-700 px-2 py-1 text-sm text-green-400 focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-green-700">Model</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full bg-black border border-green-700 px-2 py-1 text-sm text-green-400 focus:border-green-500 focus:outline-none"
                >
                  <option>gpt-4</option>
                  <option>gpt-3.5-turbo</option>
                  <option>claude-3</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-green-700">Temperature: {formData.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Terminal + Trust Chain */}
        <div className="grid grid-cols-2 gap-4">
          {/* Reasoning Terminal */}
          <div className="border border-green-500 bg-black/80 backdrop-blur">
            <div className="border-b border-green-500 p-2 flex items-center gap-2">
              <span className="text-xs">●</span>
              <span className="text-sm">REASONING TERMINAL</span>
            </div>
            <div ref={terminalRef} className="h-96 overflow-y-auto p-4 space-y-2 font-mono text-xs">
              <AnimatePresence>
                {reasoning.map((step) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span className="text-green-700">[{new Date(step.timestamp).toLocaleTimeString()}]</span>
                    <span className={`font-bold ${
                      step.phase === 'observe' ? 'text-blue-400' :
                      step.phase === 'decide' ? 'text-yellow-400' :
                      step.phase === 'act' ? 'text-red-400' :
                      'text-purple-400'
                    }`}>
                      {step.phase.toUpperCase()}:
                    </span>
                    <span className="text-green-400">{step.content}</span>
                    <span className="text-green-700 ml-auto">({(step.confidence * 100).toFixed(0)}%)</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {reasoning.length === 0 && (
                <div className="text-green-700 text-center py-8">Waiting for command execution...</div>
              )}
            </div>
          </div>

          {/* Trust Chain Visualizer */}
          <div className="border border-green-500 bg-black/80 backdrop-blur">
            <div className="border-b border-green-500 p-2 flex items-center gap-2">
              <span className="text-xs">🔗</span>
              <span className="text-sm">TRUST CHAIN BUILDER</span>
            </div>
            <div className="h-96 overflow-y-auto p-4">
              <svg className="w-full h-full">
                <AnimatePresence>
                  {trustChain.map((node, idx) => (
                    <g key={node.id}>
                      {/* Node */}
                      <motion.circle
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        cx={50 + (idx % 3) * 150}
                        cy={50 + Math.floor(idx / 3) * 100}
                        r={20}
                        fill={
                          node.status === 'complete' ? '#10b981' :
                          node.status === 'mining' ? '#f59e0b' :
                          '#6b7280'
                        }
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                      {/* Label */}
                      <text
                        x={50 + (idx % 3) * 150}
                        y={50 + Math.floor(idx / 3) * 100}
                        textAnchor="middle"
                        dy=".3em"
                        className="text-xs fill-black font-bold"
                      >
                        {node.type[0].toUpperCase()}
                      </text>
                      {/* Connections */}
                      {node.connections.map((connId) => {
                        const connIdx = trustChain.findIndex(n => n.id === connId);
                        if (connIdx === -1) return null;
                        return (
                          <motion.line
                            key={`${node.id}-${connId}`}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            x1={50 + (idx % 3) * 150}
                            y1={50 + Math.floor(idx / 3) * 100}
                            x2={50 + (connIdx % 3) * 150}
                            y2={50 + Math.floor(connIdx / 3) * 100}
                            stroke="#22c55e"
                            strokeWidth={1}
                            strokeDasharray="4"
                          />
                        );
                      })}
                    </g>
                  ))}
                </AnimatePresence>
              </svg>
              {trustChain.length === 0 && (
                <div className="text-green-700 text-center py-8">No trust nodes yet...</div>
              )}
            </div>
          </div>
        </div>

        {/* Streaming Results */}
        <div className="border border-green-500 bg-black/80 backdrop-blur">
          <div className="border-b border-green-500 p-2 flex items-center gap-2">
            <span className="text-xs">📡</span>
            <span className="text-sm">STREAMING RESULTS</span>
          </div>
          <div ref={streamRef} className="h-64 overflow-y-auto p-4 space-y-1 font-mono text-sm">
            <AnimatePresence>
              {streamChunks.map((chunk) => (
                <motion.div
                  key={chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${
                    chunk.type === 'thought' ? 'text-blue-400' :
                    chunk.type === 'action' ? 'text-yellow-400' :
                    chunk.type === 'error' ? 'text-red-400' :
                    'text-green-400'
                  }`}
                >
                  <span className="text-green-700">[{chunk.type}]</span> {chunk.content}
                </motion.div>
              ))}
            </AnimatePresence>
            {streamChunks.length === 0 && (
              <div className="text-green-700 text-center py-8">Waiting for stream data...</div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="border border-green-500 p-2 bg-black/80 backdrop-blur flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <span>Pet Mood: <span className="text-green-400">{pet.mood}</span></span>
            <span>Reasoning Steps: <span className="text-green-400">{reasoning.length}</span></span>
            <span>Trust Nodes: <span className="text-green-400">{trustChain.length}</span></span>
            <span>Stream Chunks: <span className="text-green-400">{streamChunks.length}</span></span>
          </div>
          <div className="flex gap-2">
            <span className={`w-2 h-2 rounded-full ${command.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span>{command.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Made with Bob
