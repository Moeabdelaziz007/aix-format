'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, Skull, Activity, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock AgentPet component
const AgentPet = ({ pet, size, className }: any) => (
  <div className={`rounded-full bg-zinc-800 ${className}`} style={{ width: size === 'xl' ? 80 : 40, height: size === 'xl' ? 80 : 40 }}>
    {pet}
  </div>
);

// Lazy load ForceGraph
const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph2D), { ssr: false });

export default function SpacePage() {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [graphData, setGraphData] = useState({
    nodes: [
      { id: '1', name: 'Analyst', pet: '🦉', val: 10 },
      { id: '2', name: 'Coder', pet: '🤖', val: 12 },
      { id: '3', name: 'Researcher', pet: '🧠', val: 8 }
    ],
    links: [
      { source: '1', target: '2' },
      { source: '2', target: '3' }
    ]
  });

  return (
    <div className="relative w-full h-screen bg-[#050508] overflow-hidden">
      <div className="absolute inset-0 z-10">
        {typeof window !== 'undefined' && (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            backgroundColor="transparent"
            nodeRelSize={6}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Inter`;

              // Node point
              ctx.beginPath();
              ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = '#6366f1';
              ctx.fill();

              // Label with backdrop
              ctx.shadowBlur = 0;
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.fillText(label, node.x, node.y + 10);
            }}
            onNodeClick={(node) => setSelectedNode(node)}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 w-full md:w-[400px] h-full bg-[#0D0D14]/80 backdrop-blur-3xl border-l border-white/10 z-50 p-8 overflow-y-auto"
          >
            <button onClick={() => setSelectedNode(null)} className="absolute top-8 right-8 text-white/40"><X /></button>
            <div className="mt-12 flex flex-col items-center">
              <AgentPet pet={selectedNode.pet} size="xl" className="mb-6" />
              <h2 className="text-3xl font-black mb-2">{selectedNode.name}</h2>
              <div className="w-full space-y-4 mt-8">
                <button className="w-full py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold">Configure</button>
                <button className="w-full py-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2">
                  <Skull size={16} /> Kill Agent
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 right-10 z-20 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl">
        <div className="flex -space-x-3">
          {graphData.nodes.slice(0, 3).map((n, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-4 border-zinc-950 overflow-hidden">
               <AgentPet pet={n.pet} size="sm" />
            </div>
          ))}
        </div>
        <div className="text-sm font-medium text-white/60">Ecosystem Pulse Active</div>
      </div>
    </div>
  );
}
