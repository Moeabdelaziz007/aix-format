"use client";

import { motion } from "framer-motion";
import { FadeIn, StaggerContainer } from "@/components/animations/FadeIn";
import { Badge, Section, Container, SectionHeader, Typography } from "@/design-system/components";
import { Edit3, Layers, ShieldCheck, Rocket } from "lucide-react";

const steps = [
  {
    title: "Define",
    description: "Use the AIX Studio to define your agent's persona, capabilities, and sovereign identity.",
    icon: Edit3,
    color: "bg-blue-500"
  },
  {
    title: "Build",
    description: "Connect MCP servers and integrate tools with simple configurations. Build complex recursive agents.",
    icon: Layers,
    color: "bg-purple-500"
  },
  {
    title: "Verify",
    description: "Sign your agent manifest and verify its identity, ABOM integrity, and capability restrictions.",
    icon: ShieldCheck,
    color: "bg-emerald-500"
  },
  {
    title: "Deploy",
    description: "Push your agent to any compatible infrastructure or marketplace. Start monetizing immediately.",
    icon: Rocket,
    color: "bg-primary"
  }
];

export function HowItWorks() {
  return (
    <Section background="surface-1" className="bg-surface-1/30">
      <Container>
        <SectionHeader 
          title="How It Works"
          subtitle="From architecture to deployment, AIX provides a streamlined pipeline for professional agent development."
        />

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, i) => (
              <FadeIn key={i} direction="up" delay={i * 0.1} className="relative">
                <div className="flex flex-col items-center text-center group">
                  <div className={`w-20 h-20 rounded-3xl ${step.color} flex items-center justify-center mb-8 relative z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500`}>
                    <step.icon className="w-10 h-10 text-white" />
                    
                    {/* Step Number Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-xl">
                      {i + 1}
                    </div>
                  </div>
                  
                  <Typography variant="h4" className="mb-4 uppercase italic tracking-tight group-hover:text-primary transition-colors">
                    {step.title}
                  </Typography>
                  <Typography variant="body" className="text-foreground/50 text-sm">
                    {step.description}
                  </Typography>
                </div>
              </FadeIn>
            ))}
          </StaggerContainer>
        </div>
      </Container>
    </Section>
  );
}
