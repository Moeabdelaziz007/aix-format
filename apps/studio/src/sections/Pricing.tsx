"use client";

import { Card, Button, Badge, Section, Container, SectionHeader, Typography } from "@/components/shared";
import { FadeIn, StaggerContainer } from "@/components/animations/FadeIn";
import { Check, Zap, Shield, Crown } from "lucide-react";

const plans = [
  {
    name: "Hobby",
    price: "$0",
    description: "Perfect for exploring the AIX ecosystem.",
    features: [
      "Up to 3 active agents",
      "Standard ABOM manifests",
      "Public marketplace listing",
      "Community support"
    ],
    icon: Zap,
    buttonText: "Get Started",
    variant: "secondary" as const
  },
  {
    name: "Pro",
    price: "$49",
    description: "Professional tools for serious agent builders.",
    features: [
      "Unlimited agents",
      "Custom DID namespaces",
      "Private MCP connections",
      "Priority verification",
      "Advanced analytics"
    ],
    icon: Shield,
    buttonText: "Upgrade to Pro",
    variant: "primary" as const,
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Scale your agent workforce with confidence.",
    features: [
      "White-label studio",
      "Custom security audits",
      "SLA guaranteed uptime",
      "Dedicated account manager",
      "Custom protocol extensions"
    ],
    icon: Crown,
    buttonText: "Contact Sales",
    variant: "outline" as const
  }
];

export function Pricing() {
  return (
    <Section background="surface-1" className="bg-surface-1/30">
      <Container>
        <SectionHeader 
          title="Build for Any Scale"
          subtitle="Transparent pricing designed to grow with your agent ecosystem."
        />

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <FadeIn key={i} direction="up" delay={i * 0.1}>
              <Card 
                elevation={plan.featured ? 3 : 1}
                className={`h-full flex flex-col p-8 relative ${
                  plan.featured ? "border-primary/30 ring-1 ring-primary/20 scale-105" : "border-white/5"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-dark text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    plan.featured ? "bg-primary/20 text-primary" : "bg-white/5 text-white/40"
                  }`}>
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <Typography variant="h4" className="uppercase italic">{plan.name}</Typography>
                    <Typography variant="caption" className="font-medium text-foreground/40">Monthly billing</Typography>
                  </div>
                </div>

                <div className="mb-8">
                  <Typography variant="h2" className="inline-block">{plan.price}</Typography>
                  {plan.price !== "Custom" && <Typography variant="caption" className="ml-2 text-foreground/40">/mo</Typography>}
                </div>

                <Typography variant="body" className="text-sm mb-8">
                  {plan.description}
                </Typography>

                <div className="flex-grow space-y-4 mb-10">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <Typography variant="body" className="text-sm text-white/70">{feature}</Typography>
                    </div>
                  ))}
                </div>

                <Button variant={plan.variant} className="w-full" size="lg">
                  {plan.buttonText}
                </Button>
              </Card>
            </FadeIn>
          ))}
        </StaggerContainer>
      </Container>
    </Section>
  );
}
