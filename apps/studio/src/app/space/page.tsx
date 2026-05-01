'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Activity, 
  ShieldAlert, 
  Zap, 
  X, 
  ExternalLink, 
  Play, 
  Skull,
  BrainCircuit,
  MessageCircle
} from 'lucide-react';
import { AgentPet } from '@/components/shared/AgentPet';
import { FadeIn } from '@/components/animations/FadeIn';

// Dynamically import the 3D/2D Graphs to avoid SSR issues with ThreeJS
// const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
// const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Node {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'flagged';
  pet: any;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export default function SpacePage() {
  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const fgRef = useRef<any>();

  const fetchData = async () => {
    try {
      const res = await fetch('/api/space/graph');
      const data = await res.json();
      if (data.nodes) {
        setGraphData(data);
      }
    } catch (e) {
      console.error("Failed to fetch graph data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Trick 1 & 2: Custom 3D Object with Glow & Persona
  const nodeThreeObject = useCallback((node: Node) => {
    const group = new THREE.Group();

    // 1. Glowing Sphere (Status Indicator)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(node.val),
      new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: node.status === 'active' ? 2 : node.status === 'flagged' ? 4 : 0.5,
        transparent: true,
        opacity: 0.8
      })
    );
    group.add(sphere);

    // 2. Pet Billboard (Sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '48px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.pet?.emoji || '🤖', 32, 32);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(node.val * 2.5, node.val * 2.5, 1);
    sprite.position.y = node.val + 5;
    group.add(sprite);

    return group;
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden relative">
      {/* HUD Header */}
      <header className="absolute top-24 left-10 z-20 pointer-events-none">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Network className="text-indigo-500 w-5 h-5" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Sovereign Swarm Topology</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter">AGENT SPACE</h1>
          <div className="mt-4 flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/60">LIVE NODES: {graphData.nodes.length}</span>
            </div>
            
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shadow-2xl backdrop-blur-xl">
              <button 
                onClick={() => setMode('2d')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === '2d' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-white/40 hover:text-white'}`}
              >
                2D TACTICAL
              </button>
              <button 
                onClick={() => setMode('3d')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${mode === '3d' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-white/40 hover:text-white'}`}
              >
                3D IMMERSIVE
              </button>
            </div>
          </div>
        </FadeIn>
      </header>

      {/* Canvas Area */}
      <div className="w-full h-screen">
        {!loading && (
          mode === '3d' ? (
            <ForceGraph3D
              ref={fgRef}
              graphData={graphData}*/}
              backgroundColor="#0A0A0F"
              showNavInfo={false}
              nodeThreeObject={nodeThreeObject}
              nodeThreeObjectExtend={false}
              linkWidth={(link: any) => link.value}
              linkColor={() => 'rgba(99, 102, 241, 0.1)'}
              linkDirectionalParticles={4}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleColor={() => '#818CF8'}
              onNodeClick={(node: any) => {
                setSelectedNode(node);
                const distance = 400;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                fgRef.current.cameraPosition(
                  { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                  node,
                  3000
                );
              }}
            />
          ) : (
            {/*<ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              backgroundColor="#0A0A0F"
              nodeLabel={(node: any) => `${node.pet?.emoji || '🤖'} ${node.name}`}
              nodeColor={(node: any) => node.color}
              nodeVal={(node: any) => node.val}
              linkWidth={(link: any) => link.value}
              linkDirectionalParticles={4}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={4}
              linkDirectionalParticleColor={() => '#00FF88'}
              onNodeClick={(node: any) => setSelectedNode(node)}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = `${node.pet?.emoji || '🤖'} ${node.name}`;
                const fontSize = 14 / globalScale;
                ctx.font = `bold ${fontSize}px Inter`;
                
                // Glowing Circle (Trick 1)
                ctx.shadowColor = node.color;
                ctx.shadowBlur = 20 / globalScale;
                
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color;
                ctx.fill();
                
                // Label with backdrop
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(label, node.x, node.y + node.val + fontSize + 4);
              }}
            />
          )
        )}
      </div>

      {/* Side Panel (Framer Motion) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute top-0 right-0 w-full md:w-[400px] h-full bg-[#0D0D14]/80 backdrop-blur-3xl border-l border-white/10 z-50 p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto"
          >
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-all"
            >
              <X size={20} className="text-white/40" />
            </button>

            <div className="mt-12 mb-10 flex flex-col items-center text-center">
              <AgentPet pet={selectedNode.pet} size="xl" className="mb-6" />
              <h2 className="text-3xl font-black tracking-tighter mb-2">{selectedNode.name}</h2>
              <p className="text-sm text-indigo-400 font-bold uppercase tracking-widest">{selectedNode.role}</p>
              
              <div className="mt-6 flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  selectedNode.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  selectedNode.status === 'flagged' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  ● {selectedNode.status}
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40">
                  KYC Verified
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Invocations</div>
                  <div className="text-xl font-black">{selectedNode.val}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Memory</div>
                  <div className="text-xl font-black">234 <span className="text-[10px] text-white/20 font-medium">Nodes</span></div>
                </div>
              </div>

              <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
                <div className="flex items-center gap-3 mb-4 text-indigo-400">
                  <MessageCircle size={18} />
                  <h3 className="text-sm font-bold">Platform Reach</h3>
                </div>
                <p className="text-xs text-white/40 mb-4 leading-relaxed">
                  Agent is connected to Telegram Managed Bots.
                </p>
                <button className="w-full flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl group hover:bg-indigo-500/20 transition-all">
                  <span className="text-xs font-mono text-indigo-300">@zara_research_bot</span>
                  <ExternalLink size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="space-y-3 pt-6">
                <button className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]">
                  <Play size={18} fill="black" /> INVOKE AGENT
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                    <BrainCircuit size={16} /> Memory
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-all">
                    <Skull size={16} /> Kill Agent
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Global Pulse Indicator */}
      <div className="absolute bottom-10 right-10 z-20 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl">
        <div className="flex -space-x-3">
          {graphData.nodes.slice(0, 3).map((n, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-4 border-zinc-950 overflow-hidden">
               <AgentPet pet={n.pet} size="sm" />
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">Global Swarm Pulse</div>
          <div className="text-xs font-bold text-white/60">Synchronized with Gateway</div>
        </div>
      </div>
    </div>
  );
}
