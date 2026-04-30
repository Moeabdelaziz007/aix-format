'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { Manifest } from '@/lib/types';
import { Box, Shield, Cpu, Cloud, Database, Network } from 'lucide-react';

/**
 * Sovereign Aether Design Tokens
 */
const COLORS = {
  agent: '#22d3ee', // Cyan 400
  saas: '#6366f1',  // Indigo 500
  ai: '#a855f7',    // Purple 500
  abom: '#f59e0b',  // Amber 500
  infra: '#10b981', // Emerald 500
};

const nodeStyles = {
  container: "relative px-5 py-4 rounded-2xl border bg-indigo-950/40 backdrop-blur-xl shadow-2xl transition-all duration-300 group hover:scale-105",
  label: "text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2 group-hover:text-white/60 transition-colors",
  title: "text-sm font-bold flex items-center gap-2 text-white",
  handle: "w-2.5 h-2.5 !bg-indigo-400 !border-2 !border-indigo-950 hover:!scale-125 transition-transform",
};

// --- Custom Node Components with Framer Motion ---

const CustomNodeWrapper = ({ children, color }: { children: React.ReactNode, color: string }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    style={{ borderColor: `${color}40`, boxShadow: `0 0 20px ${color}15` }}
    className={nodeStyles.container}
  >
    {children}
  </motion.div>
);

const AgentNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.agent}>
    <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl animate-pulse" />
    <div className={nodeStyles.label}>Sovereign Core</div>
    <div className={nodeStyles.title}>
      <Shield className="w-5 h-5 text-cyan-400" />
      {data.label}
    </div>
    <Handle type="source" position={Position.Bottom} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const SaaSNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.saas}>
    <div className={nodeStyles.label}>M2M Interface</div>
    <div className={nodeStyles.title}>
      <Cloud className="w-4 h-4 text-indigo-400" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const AINode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.ai}>
    <div className={nodeStyles.label}>Cognitive Engine</div>
    <div className={nodeStyles.title}>
      <Cpu className="w-4 h-4 text-purple-400" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const ABOMNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.abom}>
    <div className={nodeStyles.label}>Recursive BOM</div>
    <div className={nodeStyles.title}>
      <Box className="w-4 h-4 text-amber-400" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
    <Handle type="source" position={Position.Bottom} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const InfraNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.infra}>
    <div className={nodeStyles.label}>Hardware Layer</div>
    <div className={nodeStyles.title}>
      <Database className="w-4 h-4 text-emerald-400" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const nodeTypes = {
  agent: AgentNode,
  saas: SaaSNode,
  ai: AINode,
  abom: ABOMNode,
  infra: InfraNode,
};

interface BOMVisualizerProps {
  formData: Manifest;
}

export default function BOMVisualizer({ formData }: BOMVisualizerProps) {
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    const rootId = 'root-agent';
    nodes.push({
      id: rootId,
      type: 'agent',
      position: { x: 400, y: 0 },
      data: { label: formData.meta?.name || 'Sovereign Agent' },
    });

    const categories = [
      { key: 'saas', items: formData.abom?.saas_services || [], color: COLORS.saas },
      { key: 'ai_models', items: [], color: COLORS.ai, type: 'ai' },
      { key: 'aboms', items: [], color: COLORS.abom, type: 'abom' },
      { key: 'infrastructure', items: [], color: COLORS.infra, type: 'infra' },
    ];

    let currentX = 0;
    const yLevel2 = 250;
    const xGap = 250;

    categories.forEach((cat) => {
      cat.items.forEach((item: any, idx: number) => {
        const id = `${cat.key}-${idx}`;
        const label = item.name || (item.model ? `${item.provider}: ${item.model}` : `${item.type}: ${item.provider}`);
        
        nodes.push({
          id,
          type: cat.type || cat.key,
          position: { x: currentX, y: yLevel2 + (idx % 2 * 50) }, // Subtle staggered layout
          data: { label },
        });

        edges.push({
          id: `edge-${rootId}-${id}`,
          source: rootId,
          target: id,
          animated: true,
          style: { stroke: cat.color, strokeWidth: 2, opacity: 0.4 },
          type: 'default',
        });
        
        currentX += xGap;
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [formData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-full min-h-[650px] relative group">
      {/* Decorative Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        className="rounded-3xl border border-white/5 overflow-hidden shadow-inner"
      >
        <Background 
          color="#4f46e5" 
          gap={30} 
          size={1.5} 
          variant={BackgroundVariant.Dots}
          className="opacity-20"
        />
        <Controls className="!bg-black/40 !border-white/10 !rounded-xl !p-1 backdrop-blur-md" />
        <Panel position="top-left" className="m-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-display font-bold text-lg flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              Sovereign ABOM Graph
            </h3>
            <p className="text-white/40 text-[10px] font-mono tracking-tighter uppercase">
              Real-time Supply Chain Analysis • AIX v1.3.0
            </p>
          </div>
        </Panel>
        
        <Panel position="bottom-right" className="m-4">
          <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex gap-4">
            {Object.entries(COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[9px] uppercase font-bold text-white/40">{key}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Add this to handle BackgroundVariant which might not be imported if the types are strict
const BackgroundVariant = {
  Dots: 'dots',
  Lines: 'lines',
  Cross: 'cross',
} as any;
