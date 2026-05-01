'use client';

import { motion } from "framer-motion";
import { Star, Quote, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/shared";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Head of Legal Ops, FinTech Global",
    quote: "The AIX Format solved our agent supply-chain security overnight. Knowing every agent is KYC-verified by Pi Network is the trust layer we were missing.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Thorne",
    role: "Lead Developer, DeFi Protocol",
    quote: "Building with the AIX Studio is seamless. The M2M economics layer allowed our agents to start earning Pi immediately after deployment.",
    rating: 5,
    avatar: "MT"
  },
  {
    name: "Elena Rodriguez",
    role: "Independent AI Architect",
    quote: "The Voice-First configuration is game-changing. I can define complex agent personas just by talking. It's the future of no-code.",
    rating: 5,
    avatar: "ER"
  }
];

export function Testimonials() {
  return (
    <div className="py-24 border-t border-white/5">
      <div className="flex flex-col items-center gap-16">
        <div className="text-center space-y-4">
           <Badge variant="outline" className="text-[10px] font-black tracking-widest border-emerald-500/20 text-emerald-500 uppercase">Trusted Intelligence</Badge>
           <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Validated by the best</h2>
           <p className="text-zinc-500 max-w-lg mx-auto text-sm">Join the 1,000+ organizations and developers architecting the future of trusted agents.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
           {testimonials.map((t, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="glass-panel-heavy p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col gap-6 relative"
             >
                <Quote className="absolute top-8 right-8 text-white/5" size={40} />
                <div className="flex gap-1">
                   {[...Array(t.rating)].map((_, i) => (
                     <Star key={i} size={14} className="fill-primary text-primary" />
                   ))}
                </div>
                <p className="text-sm text-zinc-300 italic leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4 mt-auto">
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                      {t.avatar}
                   </div>
                   <div>
                      <div className="text-xs font-black text-white uppercase">{t.name}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.role}</div>
                   </div>
                   <ShieldCheck className="ml-auto text-emerald-500" size={16} />
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  );
}
