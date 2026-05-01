"use client";

import React from "react";
import { Container, Typography } from "@/components/shared";
import { FeaturedAgentCard } from "@/components/studio/FeaturedAgentCard";
import { Code2, Search, LineChart, MessageSquare } from "lucide-react";

const FEATURED = [
  {
    name: "Research Analyst",
    role: "Data Intelligence",
    rating: 4.8,
    price: "π 0.5/call",
    icon: <Search size={24} />
  },
  {
    name: "Customer Support",
    role: "User Relations",
    rating: 4.5,
    price: "π 0.3/call",
    icon: <MessageSquare size={24} />
  },
  {
    name: "Code Reviewer",
    role: "Dev Tools",
    rating: 4.9,
    price: "π 1.0/call",
    icon: <Code2 size={24} />
  },
  {
    name: "Finance Forecaster",
    role: "Economic Analyst",
    rating: 4.7,
    price: "π 2.0/call",
    icon: <LineChart size={24} />
  }
];

export const FeaturedAgents = () => {
  return (
    <section className="py-24 bg-background">
      <Container className="space-y-16">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-4">
             <Typography variant="h2" className="uppercase italic tracking-tighter text-white">
                Featured <span className="text-primary">Agents</span>
             </Typography>
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Top performing verified agents this week</p>
          </div>
          <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
             View All Agents
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURED.map((agent) => (
            <FeaturedAgentCard key={agent.name} {...agent} />
          ))}
        </div>
      </Container>
    </section>
  );
};
