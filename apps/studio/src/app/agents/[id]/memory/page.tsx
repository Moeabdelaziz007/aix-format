'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ReactFlow,
  Background, 
  Controls, 
  MiniMap, 
  Handle, 
  Position,
  type NodeProps,
  type Edge,
  type Node,
  applyEdgeChanges,
  applyNodeChanges,
  type OnNodesChange,
  type OnEdgesChange,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Database, 
  Clock, 
  Zap, 
  Search, 
  ChevronRight, 
  Calendar,
  X,
  History,
  Info,
  Network
} from 'lucide-react';
import { AgentPet } from '@/components/shared/AgentPet';
import { useLocalAgents } from '@/hooks/useLocalAgents';
import { useWikiBrainSearch } from '@/hooks/useWikiBrainSearch';

// --- Custom Node Components ---

const RootNode = ({ data }: NodeProps) => (
  <div className="px-6 py-4 bg-indigo-600 rounded-2xl border-4 border-indigo-400/50 shadow-[0_0_40px_rgba(99,102,241,0.4)] flex flex-col items-center gap-2 min-w-[150px]">
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-300" />
    <AgentPet pet={data.pet} size="lg" />
    <div className="text-white font-black tracking-tighter text-lg">{data.name}</div>
    <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Sovereign Core</div>
  </div>
);

const CategoryNode = ({ data }: NodeProps) => {
  const glowStyles = {
    sessions: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    facts: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    skills: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    connections: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
  } as any;

  return (
    <div className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 min-w-[140px] ${data.color} bg-black/40 backdrop-blur-xl transition-all hover:scale-105 ${glowStyles[data.id] || ''}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 opacity-50" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 opacity-50" />
      <div className={`p-2 rounded-lg ${data.iconBg}`}>
        {data.icon}
      </div>
      <div className="text-sm font-black text-white uppercase tracking-wider">{data.label}</div>
    </div>
  );
};

const MemoryItemNode = ({ data }: NodeProps) => (
  <div className={`group p-4 rounded-xl border border-white/5 bg-zinc-900/80 backdrop-blur-md hover:border-indigo-500/50 transition-all max-w-[220px]`}>
    <Handle type="target" position={Position.Top} className="w-1.5 h-1.5 opacity-30" />
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
          {data.timestamp || 'Index #'+data.id.slice(-4)}
        </span>
        {data.type === 'skill' && (
          <div className="flex gap-0.5 text-amber-400">
            {[...Array(5)].map((_, i) => <Zap key={i} size={8} fill={i < (data.rating || 4) ? 'currentColor' : 'none'} />)}
          </div>
        )}
      </div>
      <div className="text-xs font-bold text-white/80 leading-relaxed truncate group-hover:whitespace-normal">
        {data.label}
      </div>
      {data.summary && (
        <div className="text-[10px] text-white/40 italic">
          {data.summary}
        </div>
      )}
    </div>
  </div>
);

const nodeTypes = {
  root: RootNode,
  category: CategoryNode,
  item: MemoryItemNode
};

// --- Main Page Component ---

export default function WikiBrainExplorer() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getAgent, loaded } = useLocalAgents();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const { query: search, setQuery: setSearch, results: searchResults, loading: searchLoading } = useWikiBrainSearch();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [timeValue, setTimeValue] = useState(100);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  useEffect(() => {
    if (!loaded) return;
    const agent = getAgent(id);
    if (!agent) return;

    async function fetchMemory() {
      try {
        const res = await fetch(`/api/agents/${id}/memory/tree`);
        const data = await res.json();
        if (data.success) {
          const { tree } = data;
          
          // Layout Algorithm (Simple Tree)
          const newNodes: Node[] = [];
          const newEdges: Edge[] = [];
          
          // Root
          newNodes.push({
            id: 'root',
            type: 'root',
            position: { x: 500, y: 0 },
            data: { name: agent?.name, pet: agent?.pet }
          });

          // Level 1 Categories
          const categories = tree.children || [];
          categories.forEach((cat: any, i: number) => {
            const x = 100 + (i * 300);
            const y = 200;
            
            const colors = {
              sessions: 'border-blue-500/30 text-blue-400',
              facts: 'border-purple-500/30 text-purple-400',
              skills: 'border-emerald-500/30 text-emerald-400',
              connections: 'border-orange-500/30 text-orange-400'
            } as any;

            const icons = {
              sessions: <Clock size={16} />,
              facts: <Database size={16} />,
              skills: <Zap size={16} />,
              connections: <Network size={16} />
            } as any;

            const iconBgs = {
              sessions: 'bg-blue-500/20 text-blue-400',
              facts: 'bg-purple-500/20 text-purple-400',
              skills: 'bg-emerald-500/20 text-emerald-400',
              connections: 'bg-orange-500/20 text-orange-400'
            } as any;

            newNodes.push({
              id: cat.id,
              type: 'category',
              position: { x, y },
              data: { 
                label: cat.label, 
                color: colors[cat.id] || 'border-zinc-800', 
                icon: icons[cat.id],
                iconBg: iconBgs[cat.id]
              }
            });

            newEdges.push({
              id: `e-root-${cat.id}`,
              source: 'root',
              target: cat.id,
              animated: true,
              style: { stroke: '#4F46E5', strokeWidth: 2 }
            });

            // Level 2 Items
            (cat.children || []).forEach((item: any, j: number) => {
               const ix = x - 100 + (j % 3 * 120);
               const iy = y + 150 + (Math.floor(j / 3) * 120);
               
               newNodes.push({
                 id: item.id,
                 type: 'item',
                 position: { x: ix, y: iy },
                 data: { 
                   ...item, 
                   type: cat.id.slice(0, -1) // session, fact, skill
                 }
               });

               newEdges.push({
                 id: `e-${cat.id}-${item.id}`,
                 source: cat.id,
                 target: item.id,
                 animated: true,
                 style: { stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }
               });
            });
          });

          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (e) {
        console.error("Failed to load WikiBrain:", e);
      }
    }
    fetchMemory();
  }, [id, getAgent, loaded]);

  const filteredNodes = useMemo(() => {
    if (!search) return nodes;

    // Create a set of IDs from semantic search results
    const matchingIds = new Set(searchResults.map(r => r.id));

    return nodes.map(n => {
      const isMatch = searchResults.some(r => r.id === n.id);
      return {
        ...n,
        style: isMatch ? { ...n.style, filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.8))' } : n.style,
        hidden: n.type === 'item' && !matchingIds.has(n.id) && !n.data.label.toLowerCase().includes(search.toLowerCase())
      };
    });
  }, [nodes, search, searchResults]);

  if (!loaded) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-screen w-full bg-[#050508] relative overflow-hidden flex flex-col">
      {/* Header Panel */}
      <header className="p-6 md:p-8 bg-zinc-950/50 border-b border-white/5 backdrop-blur-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-white/5 transition-all text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="text-indigo-500 w-4 h-4" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Memory Matrix</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">WIKIBRAIN EXPLORER</h1>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Temporal Depth</span>
              <div className="flex items-center gap-4 w-48">
                 <History size={14} className="text-zinc-500" />
                 <input 
                   type="range" 
                   min="0" max="100" 
                   value={timeValue} 
                   onChange={(e) => setTimeValue(parseInt(e.target.value))}
                   className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                 />
              </div>
           </div>
           
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all w-64"
              />
           </div>
        </div>
      </header>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full relative">
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => node.type === 'item' && setSelectedItem(node.data)}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background color="#111" gap={20} />
          <Controls className="!bg-zinc-900 !border-white/10 !shadow-2xl" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'root') return '#4F46E5';
              if (n.type === 'category') return '#333';
              return '#111';
            }}
            maskColor="rgba(0,0,0,0.8)"
            className="!bg-zinc-950 !border-white/5 !rounded-2xl"
          />
          
          <Panel position="bottom-left" className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/5 m-6">
            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Swarm Legend</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] font-bold text-white/60">Sessions</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-[10px] font-bold text-white/60">Knowledge</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-white/60">Skills</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-white/60">Connections</span></div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Detail Drawer */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 z-50 p-10 shadow-2xl overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-10 right-10 p-2 hover:bg-white/5 rounded-full transition-all text-white/40"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 rounded-2xl ${
                  selectedItem.type === 'session' ? 'bg-blue-500/20 text-blue-400' :
                  selectedItem.type === 'fact' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedItem.type === 'session' ? <Clock size={24} /> : selectedItem.type === 'fact' ? <Database size={24} /> : <Zap size={24} />}
                </div>
                <div>
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{selectedItem.type} Details</div>
                   <h2 className="text-xl font-black text-white">{selectedItem.label}</h2>
                </div>
              </div>

              <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">
                      <History size={12} /> Temporal Metadata
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-white/40 font-medium">Timestamp</span>
                         <span className="text-xs font-mono text-white/80">{selectedItem.timestamp || '2026-05-01 09:03'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-white/40 font-medium">Certainty Score</span>
                         <span className="text-xs font-mono text-emerald-400">0.982</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <Info size={12} /> Semantic Content
                   </div>
                   <p className="text-sm text-zinc-300 leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                      {selectedItem.summary || "No extended metadata available for this node. The Sovereign Gateway successfully indexed this entry as part of the primary agentic loop."}
                   </p>
                </div>

                {selectedItem.type === 'session' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                       <span>Conversation Snippet</span>
                       <button className="text-indigo-400 hover:text-indigo-300">View Full Log →</button>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 font-mono text-[11px] space-y-3">
                       <div className="text-white/40"><span className="text-indigo-400">User:</span> "Setup my telegram bot"</div>
                       <div className="text-white/80"><span className="text-emerald-400">Agent:</span> "Done! Your bot @zara_bot is live 🎉"</div>
                    </div>
                  </div>
                )}

                <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20">
                  RE-VALIDATE NODE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
