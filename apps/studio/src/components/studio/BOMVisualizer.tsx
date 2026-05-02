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
  agent: 'var(--color-primary)',
  saas: 'var(--color-purple-mcp)',
  ai: 'var(--color-warning)',
  abom: 'var(--color-danger)',
  infra: 'var(--color-success)',
};

const nodeStyles = {
  container: "relative px-5 py-4 rounded-2xl border bg-indigo-950/40   transition-all duration-300 group hover:scale-105",
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
    style={{ borderLeft: `3px solid ${color}` }}
    className={nodeStyles.container}
  >
    {children}
  </motion.div>
);

const AgentNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.agent}>
    <div className={nodeStyles.label}>Sovereign Core</div>
    <div className={nodeStyles.title}>
      <Shield className="w-4 h-4 text-primary" />
      {data.label}
    </div>
    <Handle type="source" position={Position.Bottom} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const SaaSNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.saas}>
    <div className={nodeStyles.label}>M2M Interface</div>
    <div className={nodeStyles.title}>
      <Cloud className="w-4 h-4 text-purple-mcp" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const AINode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.ai}>
    <div className={nodeStyles.label}>Cognitive Engine</div>
    <div className={nodeStyles.title}>
      <Cpu className="w-4 h-4 text-warning" />
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className={nodeStyles.handle} />
  </CustomNodeWrapper>
);

const ABOMNode = ({ data }: any) => (
  <CustomNodeWrapper color={COLORS.abom}>
    <div className={nodeStyles.label}>Recursive BOM</div>
    <div className={nodeStyles.title}>
      <Box className="w-4 h-4 text-danger" />
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
      <Database className="w-4 h-4 text-success" />
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
      { key: 'saas', items: formData.abom?.saas_services || [], color: 'var(--color-purple-mcp)' },
      { key: 'ai_models', items: [], color: 'var(--color-warning)', type: 'ai' },
      { key: 'aboms', items: [], color: 'var(--color-danger)', type: 'abom' },
      { key: 'infrastructure', items: [], color: 'var(--color-success)', type: 'infra' },
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
          style: { stroke: cat.color, strokeWidth: 1, opacity: 0.3 },
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
    <div className="w-full h-full min-h-[650px] relative group card">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        className="rounded-3xl border border-white/5 overflow-hidden "
      >
        <Background 
          color="var(--color-border)" 
          gap={30} 
          size={1} 
          variant={BackgroundVariant.Dots}
          className="opacity-40"
        />
        <Controls className="! !border-white/10 !rounded-xl !p-1 " />
        <Panel position="top-left" className="m-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-white font-black text-sm flex items-center gap-2 uppercase tracking-widest">
              <Network className="w-4 h-4 text-primary" />
              Sovereign ABOM Graph
            </h3>
            <p className="text-zinc-600 text-[9px] font-black tracking-tighter uppercase">
              Real-time Supply Chain Analysis • AIX v1.3.0
            </p>
          </div>
        </Panel>
        
        <Panel position="bottom-right" className="m-4">
          <div className="px-4 py-2   border border-white/10 rounded-xl flex gap-4">
            {Object.entries(COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-none" style={{ backgroundColor: color }} />
                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider">{key}</span>
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
