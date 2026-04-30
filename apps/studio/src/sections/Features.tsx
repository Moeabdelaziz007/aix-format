"use client";

import { Card, Badge, Section, Container, SectionHeader, Typography } from "@/design-system/components";
import { FadeIn, StaggerContainer } from "@/components/animations/FadeIn";
import { 
  Fingerprint, 
  Box, 
  Search,
  Lock,
  Network,
  Coins
} from "lucide-react";

const features = [
  {
    title: "Identity Layer",
    description: "DID-based agent identity with nested KYC/KYA tiers. Ensure every agent is who they say they are.",
    icon: Fingerprint,
    color: "from-blue-500 to-cyan-400"
  },
  {
    title: "ABOM",
    description: "Agent Bill of Materials for full provenance. Track every sub-agent and tool used in a recursive manifest.",
    icon: Box,
    color: "from-primary to-purple-500"
  },
  {
    title: "Security First",
    description: "SHA-256 integrity, Ed25519 signatures, and fine-grained capability sandboxing for zero-trust execution.",
    icon: Lock,
    color: "from-emerald-500 to-teal-400"
  },
  {
    title: "MCP Native",
    description: "First-class Model Context Protocol support. Connect your agent to any data source or tool in seconds.",
    icon: Network,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Built-in Economics",
    description: "Flexible pricing models, automated revenue sharing, and native support for Pi Network and ERC-20.",
    icon: Coins,
    color: "from-amber-500 to-orange-400"
  },
  {
    title: "Discovery",
    description: "W3C-style agent discovery via .well-known paths. Find and integrate agents across any infrastructure.",
    icon: Search,
    color: "from-rose-500 to-red-400"
  }
];

export function Features() {
  return (
    <Section background="dark">
      <Container>
        <SectionHeader 
          title="Sovereign Architecture"
          subtitle="The AIX format provides a standardized, secure, and interoperable foundation for the next generation of autonomous agents."
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FadeIn key={i} direction="up" delay={i * 0.05}>
              <Card className="h-full p-8 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-[0.03] blur-3xl group-hover:opacity-10 transition-opacity`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg shadow-black/40`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <Typography variant="h4" className="mb-3 group-hover:text-primary transition-colors italic uppercase">
                  {feature.title}
                </Typography>
                <Typography variant="body" className="text-foreground/50 text-sm">
                  {feature.description}
                </Typography>
              </Card>
            </FadeIn>
          ))}
        </StaggerContainer>
      </Container>
    </Section>
  );
}
