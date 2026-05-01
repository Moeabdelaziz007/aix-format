"use client";

import React from "react";
import { motion } from "framer-motion";
import { tokens } from "@/design-system/tokens";
import { Button, Card, Input, Badge } from "@/components/shared";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Zap, 
  Shield, 
  Cpu, 
  Rocket, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from "lucide-react";

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto pt-32 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold mb-4 tracking-tighter bg-gradient-to-r from-primary to-purple-mcp bg-clip-text text-transparent">
            Design System
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
            A comprehensive design language for AIX Studio, built for high-performance AI agent development.
          </p>
        </motion.div>

        {/* Colors */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch name="Primary Dark" color={tokens.colors.primary.dark} />
            <ColorSwatch name="Primary Accent" color={tokens.colors.primary.accent} />
            <ColorSwatch name="MCP Purple" color={tokens.colors.primary.purple} />
            <ColorSwatch name="Neon Green" color={tokens.colors.status.success} />
            <ColorSwatch name="Warning" color={tokens.colors.status.warning} />
            <ColorSwatch name="Danger" color={tokens.colors.status.danger} />
          </div>
          
          <h3 className="text-lg font-medium mt-10 mb-4">Surface Elevations</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ColorSwatch name="Surface L1" color={tokens.colors.surfaces.l1} />
            <ColorSwatch name="Surface L2" color={tokens.colors.surfaces.l2} />
            <ColorSwatch name="Surface L3" color={tokens.colors.surfaces.l3} />
            <ColorSwatch name="Surface L4" color={tokens.colors.surfaces.l4} />
            <ColorSwatch name="Surface L5" color={tokens.colors.surfaces.l5} />
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" /> Buttons
          </h2>
          <Card className="p-8 space-y-8 bg-surface-1/50 backdrop-blur-xl">
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Action</Button>
              <Button variant="purple">MCP Server Action</Button>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large Scale</Button>
            </div>
          </Card>
        </section>

        {/* Typography */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Typography
          </h2>
          <Card className="p-8 space-y-6 bg-surface-1/50 backdrop-blur-xl">
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Hero Display - 96px</p>
              <h1 className="text-[96px] font-bold leading-[1.1] tracking-tighter">AIX Studio</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Heading 2 - 64px</p>
              <h2 className="text-[64px] font-bold leading-[1.1] tracking-tighter">The Agent Economy</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Body Text - 16px</p>
              <p className="text-base text-muted-foreground max-w-3xl">
                The Sovereign Agent Protocol enables the next generation of autonomous intelligence. 
                Built on the Pi Network ecosystem, it provides a secure, decentralized foundation 
                for agents to build, deploy, and monetize their capabilities.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Code Block - JetBrains Mono</p>
              <pre className="p-4 bg-black rounded-lg border border-white/10 font-mono text-sm overflow-x-auto text-primary">
{`const manifest = {
  meta: {
    name: "Aether Sentinel",
    version: "2.4.0"
  },
  capabilities: ["mcp:search", "mcp:compute"]
};`}
              </pre>
            </div>
          </Card>
        </section>

        {/* Badges & Status */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Badges & Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Verified</Badge>
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="danger">High Risk</Badge>
                <Badge variant="outline">Unverified</Badge>
              </div>
            </Card>
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">KYC Tiers</h3>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Tier 1</Badge>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Tier 2</Badge>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Tier 3 (Gold)</Badge>
              </div>
            </Card>
          </div>
        </section>

        {/* Forms */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Form Elements
          </h2>
          <Card className="p-8 max-w-md mx-auto bg-surface-1/50 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Agent Name</label>
                <Input placeholder="e.g. Aether Sentinel" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Description</label>
                <textarea 
                  className="w-full h-32 rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all"
                  placeholder="Describe your agent's purpose..."
                />
              </div>
              <Button variant="primary" className="w-full">Create Agent</Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function ColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <div className="space-y-2">
      <div 
        className="h-20 w-full rounded-xl border border-white/10 shadow-lg"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium">{name}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{color}</span>
      </div>
    </div>
  );
}
