"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Hammer, PlugZap, ArrowRight } from "lucide-react";
import { Container, Typography } from "@/components/shared";
import Link from "next/link";

const CARDS = [
  {
    title: "Identity",
    desc: "Sovereign did:axiom identity with cross-chain KYC verification layers.",
    icon: <Search className="w-8 h-8 text-primary" />,
    link: "/identity",
    btn: "Manage ID",
    color: "primary"
  },
  {
    title: "ABOM Risk",
    desc: "Automated Agent Bill of Materials scanning for supply-chain security.",
    icon: <Hammer className="w-8 h-8 text-purple-mcp" />,
    link: "/scan",
    btn: "Scan Manifest",
    color: "purple"
  },
  {
    title: "Economics",
    desc: "Decentralized revenue routing and automated settlement protocols.",
    icon: <PlugZap className="w-8 h-8 text-emerald-400" />,
    link: "/analytics",
    btn: "View Revenue",
    color: "emerald"
  }
];

export const QuickAccessGrid = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={card.link} className="group block h-full">
                <div className="glass-panel-heavy p-10 rounded-[3rem] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all h-full flex flex-col gap-8 relative overflow-hidden">
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 w-fit group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{card.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                      {card.desc}
                    </p>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5 group-hover:text-white transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-white transition-colors">
                      {card.btn}
                    </span>
                    <ArrowRight className="w-5 h-5 text-zinc-800 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
