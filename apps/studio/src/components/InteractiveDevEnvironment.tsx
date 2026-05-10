import { secureRandom } from "@/lib/security-core";
/**
 * 🎨 INTERACTIVE DEVELOPMENT ENVIRONMENT
 * Multi-dimensional interface with simultaneous visual layers
 * 
 * Features:
 * - Dynamic form interface (real-time adaptation)
 * - Live terminal (AI reasoning process)
 * - Animated pet character (responds to events)
 * - Trust chain visualizer (real-time verification)
 * - Streaming results (progressive disclosure)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TerminalLine {
  id: string;
  type: 'thinking' | 'decision' | 'action' | 'result' | 'error';
  content: string;
  timestamp: number;
  depth: number; // Indentation level for nested reasoning
}

interface TrustNode {
  id: string;
  type: 'signature' | 'validation' | 'verification' | 'consensus';
  status: 'pending' | 'validating' | 'verified' | 'failed';
  label: string;
  connections: string[];
  timestamp: number;
}

interface PetState {
  x: number;
  y: number;
  mood: 'idle' | 'thinking' | 'excited' | 'worried' | 'celebrating';
  animation: 'walk' | 'jump' | 'spin' | 'bounce' | 'float';
  message?: string;
}

interface FormField {
  id: string;
  type: 'text' | 'select' | 'number' | 'toggle' | 'slider';
  label: string;
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  visible: boolean;
  disabled: boolean;
  hint?: string;
}

interface StreamChunk {
  id: string;
  content: string;
  type: 'text' | 'code' | 'data' | 'visualization';
  timestamp: number;
  complete: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function InteractiveDevEnvironment() {
  const [isActive, setIsActive] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [trustNodes, setTrustNodes] = useState<TrustNode[]>([]);
  const [petState, setPetState] = useState<PetState>({
    x: 50,
    y: 50,
    mood: 'idle',
    animation: 'float',
  });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [streamChunks, setStreamChunks] = useState<StreamChunk[]>([]);
  const [progress, setProgress] = useState(0);

  // SSE connection for real-time updates
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize environment
  useEffect(() => {
    if (isActive) {
      startEnvironment();
    } else {
      stopEnvironment();
    }

    return () => stopEnvironment();
  }, [isActive]);

  const startEnvironment = () => {
    // Connect to SSE stream
    eventSourceRef.current = new EventSource('/api/dev-environment/stream');

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleStreamEvent(data);
    };

    eventSourceRef.current.onerror = () => {
      console.error('SSE connection error');
      addTerminalLine('error', 'Connection lost. Reconnecting...', 0);
    };

    // Initialize form
    initializeForm();

    // Start pet animation loop
    startPetLoop();

    // Add welcome message
    addTerminalLine('thinking', 'Environment initialized. Ready to process...', 0);
  };

  const stopEnvironment = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleStreamEvent = (data: any) => {
    switch (data.type) {
      case 'terminal':
        addTerminalLine(data.lineType, data.content, data.depth || 0);
        break;
      case 'trust_node':
        addTrustNode(data.node);
        break;
      case 'pet_event':
        updatePetState(data.event);
        break;
      case 'form_update':
        updateFormField(data.fieldId, data.updates);
        break;
      case 'stream_chunk':
        addStreamChunk(data.chunk);
        break;
      case 'progress':
        setProgress(data.value);
        break;
    }
  };

  const addTerminalLine = (type: TerminalLine['type'], content: string, depth: number) => {
    const line: TerminalLine = {
      id: `line-${Date.now()}-${secureRandom()}`,
      type,
      content,
      timestamp: Date.now(),
      depth,
    };

    setTerminalLines(prev => [...prev.slice(-50), line]); // Keep last 50 lines
  };

  const addTrustNode = (node: Partial<TrustNode>) => {
    const fullNode: TrustNode = {
      id: node.id || `node-${Date.now()}`,
      type: node.type || 'signature',
      status: node.status || 'pending',
      label: node.label || '',
      connections: node.connections || [],
      timestamp: Date.now(),
    };

    setTrustNodes(prev => [...prev, fullNode]);

    // Animate pet to celebrate verification
    if (fullNode.status === 'verified') {
      setPetState(prev => ({ ...prev, mood: 'celebrating', animation: 'jump' }));
    }
  };

  const updatePetState = (event: any) => {
    setPetState(prev => ({
      ...prev,
      ...event,
    }));
  };

  const updateFormField = (fieldId: string, updates: Partial<FormField>) => {
    setFormFields(prev =>
      prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const addStreamChunk = (chunk: Partial<StreamChunk>) => {
    const fullChunk: StreamChunk = {
      id: chunk.id || `chunk-${Date.now()}`,
      content: chunk.content || '',
      type: chunk.type || 'text',
      timestamp: Date.now(),
      complete: chunk.complete || false,
    };

    setStreamChunks(prev => [...prev, fullChunk]);
  };

  const initializeForm = () => {
    setFormFields([
      {
        id: 'task',
        type: 'text',
        label: 'Task Description',
        value: '',
        visible: true,
        disabled: false,
        hint: 'Describe what you want to build',
      },
      {
        id: 'mode',
        type: 'select',
        label: 'Execution Mode',
        value: 'auto',
        options: ['auto', 'step-by-step', 'interactive'],
        visible: true,
        disabled: false,
      },
      {
        id: 'trust_level',
        type: 'slider',
        label: 'Trust Threshold',
        value: 0.8,
        min: 0,
        max: 1,
        visible: true,
        disabled: false,
        hint: 'Minimum trust score for auto-execution',
      },
    ]);
  };

  const startPetLoop = () => {
    const interval = setInterval(() => {
      setPetState(prev => {
        // Random movement
        const newX = Math.max(10, Math.min(90, prev.x + (secureRandom() - 0.5) * 10));
        const newY = Math.max(10, Math.min(90, prev.y + (secureRandom() - 0.5) * 10));

        return {
          ...prev,
          x: newX,
          y: newY,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  };

  const executeCommand = async () => {
    const taskField = formFields.find(f => f.id === 'task');
    if (!taskField?.value) return;

    setIsActive(true);
    setProgress(0);

    // Simulate command execution with streaming
    addTerminalLine('thinking', `Analyzing task: "${taskField.value}"`, 0);
    
    setTimeout(() => {
      addTerminalLine('thinking', 'Breaking down into subtasks...', 1);
      setPetState(prev => ({ ...prev, mood: 'thinking', animation: 'bounce' }));
    }, 500);

    setTimeout(() => {
      addTerminalLine('decision', 'Selected approach: Incremental implementation', 1);
      addTrustNode({
        type: 'signature',
        status: 'pending',
        label: 'Code signature verification',
      });
    }, 1500);

    setTimeout(() => {
      addTerminalLine('action', 'Generating code structure...', 1);
      setProgress(30);
    }, 2500);

    setTimeout(() => {
      addTrustNode({
        type: 'validation',
        status: 'validating',
        label: 'Syntax validation',
      });
      addStreamChunk({
        type: 'code',
        content: 'export function processTask() {\n  // Implementation\n}',
        complete: false,
      });
    }, 3500);

    setTimeout(() => {
      setProgress(60);
      addTerminalLine('action', 'Running tests...', 1);
      setPetState(prev => ({ ...prev, mood: 'excited', animation: 'spin' }));
    }, 4500);

    setTimeout(() => {
      addTrustNode({
        type: 'verification',
        status: 'verified',
        label: 'All tests passed',
      });
      setProgress(100);
      addTerminalLine('result', '✓ Task completed successfully', 0);
      setPetState(prev => ({ ...prev, mood: 'celebrating', animation: 'jump' }));
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-4xl">🎨</span>
          Interactive Dev Environment
        </h1>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? 'Stop' : 'Start'}
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        {/* Left Column: Dynamic Form + Pet */}
        <div className="col-span-3 space-y-4">
          <DynamicForm fields={formFields} onExecute={executeCommand} />
          <PetCharacter state={petState} />
        </div>

        {/* Center Column: Terminal + Streaming Results */}
        <div className="col-span-6 space-y-4">
          <LiveTerminal lines={terminalLines} />
          <StreamingResults chunks={streamChunks} progress={progress} />
        </div>

        {/* Right Column: Trust Chain Visualizer */}
        <div className="col-span-3">
          <TrustChainVisualizer nodes={trustNodes} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC FORM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function DynamicForm({ fields, onExecute }: { fields: FormField[]; onExecute: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>📝</span> Configuration
      </h2>

      <div className="space-y-4">
        <AnimatePresence>
          {fields.filter(f => f.visible).map(field => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-purple-300">
                {field.label}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value}
                  disabled={field.disabled}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={field.hint}
                />
              )}

              {field.type === 'select' && (
                <select
                  value={field.value}
                  disabled={field.disabled}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'slider' && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={0.1}
                    value={field.value}
                    disabled={field.disabled}
                    className="w-full"
                  />
                  <div className="text-xs text-purple-300 text-right">
                    {field.value.toFixed(2)}
                  </div>
                </div>
              )}

              {field.hint && (
                <p className="text-xs text-purple-400/70">{field.hint}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={onExecute}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
        >
          Execute Command
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE TERMINAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function LiveTerminal({ lines }: { lines: TerminalLine[] }) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      (terminalRef.current as any).scrollTop = (terminalRef.current as any).scrollHeight;
    }
  }, [lines]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'thinking': return 'text-blue-400';
      case 'decision': return 'text-yellow-400';
      case 'action': return 'text-green-400';
      case 'result': return 'text-purple-400';
      case 'error': return 'text-red-400';
    }
  };

  const getLineIcon = (type: TerminalLine['type']) => {
    switch (type) {
      case 'thinking': return '🤔';
      case 'decision': return '🎯';
      case 'action': return '⚡';
      case 'result': return '✨';
      case 'error': return '❌';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/80 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 h-[400px] flex flex-col"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>💻</span> AI Reasoning Process
      </h2>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto space-y-2 font-mono text-sm"
      >
        <AnimatePresence>
          {lines.map(line => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-start gap-2 ${getLineColor(line.type)}`}
              style={{ paddingLeft: `${line.depth * 20}px` }}
            >
              <span className="text-lg">{getLineIcon(line.type)}</span>
              <span className="flex-1">{line.content}</span>
              <span className="text-xs text-gray-500">
                {new Date(line.timestamp).toLocaleTimeString()}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PET CHARACTER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function PetCharacter({ state }: { state: PetState }) {
  const getPetEmoji = () => {
    switch (state.mood) {
      case 'idle': return '🐾';
      case 'thinking': return '🤔';
      case 'excited': return '🎉';
      case 'worried': return '😰';
      case 'celebrating': return '🎊';
    }
  };

  const getAnimationVariants = (): any => {
    switch (state.animation) {
      case 'walk':
        return {
          x: [0, 5, 0, -5, 0],
          transition: { repeat: Infinity, duration: 2 },
        };
      case 'jump':
        return {
          y: [0, -30, 0],
          transition: { repeat: 3, duration: 0.5 },
        };
      case 'spin':
        return {
          rotate: [0, 360],
          transition: { repeat: 2, duration: 1 },
        };
      case 'bounce':
        return {
          y: [0, -10, 0],
          transition: { repeat: Infinity, duration: 1 },
        };
      case 'float':
        return {
          y: [0, -5, 0],
          transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-pink-500/30 h-[300px] relative overflow-hidden"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🐾</span> Pet Assistant
      </h2>

      <motion.div
        animate={getAnimationVariants()}
        style={{
          position: 'absolute',
          left: `${state.x}%`,
          top: `${state.y}%`,
        }}
        className="text-6xl cursor-pointer"
      >
        {getPetEmoji()}
      </motion.div>

      {state.message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 text-white text-sm"
        >
          {state.message}
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRUST CHAIN VISUALIZER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TrustChainVisualizer({ nodes }: { nodes: TrustNode[] }) {
  const getNodeColor = (status: TrustNode['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'validating': return 'bg-yellow-500 animate-pulse';
      case 'verified': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
    }
  };

  const getNodeIcon = (type: TrustNode['type']) => {
    switch (type) {
      case 'signature': return '🔐';
      case 'validation': return '✓';
      case 'verification': return '🛡️';
      case 'consensus': return '🤝';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30 h-full flex flex-col"
    >
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🔗</span> Trust Chain
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4">
        <AnimatePresence>
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connection line to previous node */}
              {index > 0 && (
                <div className="absolute left-6 -top-4 w-0.5 h-4 bg-blue-500/50" />
              )}

              {/* Node */}
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{
                    scale: node.status === 'validating' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ repeat: node.status === 'validating' ? Infinity : 0, duration: 1 }}
                  className={`w-12 h-12 rounded-full ${getNodeColor(node.status)} flex items-center justify-center text-2xl`}
                >
                  {getNodeIcon(node.type)}
                </motion.div>

                <div className="flex-1">
                  <div className="text-white font-medium">{node.label}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(node.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-purple-400 mt-1">
                    {node.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAMING RESULTS COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StreamingResults({ chunks, progress }: { chunks: StreamChunk[]; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/80 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 h-[300px] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📊</span> Streaming Results
        </h2>
        <div className="text-sm text-purple-400">{progress}%</div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
        />
      </div>

      {/* Streaming content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence>
          {chunks.map(chunk => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg ${
                chunk.type === 'code'
                  ? 'bg-slate-800 border border-green-500/30 font-mono text-sm'
                  : 'bg-slate-800/50 border border-purple-500/20'
              }`}
            >
              <div className="text-white whitespace-pre-wrap">{chunk.content}</div>
              {!chunk.complete && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="inline-block w-2 h-4 bg-purple-500 ml-1"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Made with Moe Abdelaziz
