"use client";

import { useParams } from "next/navigation";
import { useLocalAgents } from "@/hooks/useLocalAgents";
import { AgentPet } from "@/components/shared/AgentPet";
import { motion } from "framer-motion";
import { Sparkles, Zap, Heart, Moon, Coffee, AlertTriangle, Palette } from "lucide-react";
import { PetConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

const MOODS: { value: PetConfig["mood"]; icon: React.ElementType; label: string; color: string }[] = [
  { value: "happy",     icon: Heart,        label: "Happy",     color: "#10b981" },
  { value: "energized", icon: Zap,          label: "Energized", color: "#f59e0b" },
  { value: "creative",  icon: Sparkles,     label: "Creative",  color: "#8b5cf6" },
  { value: "busy",      icon: Coffee,       label: "Busy",      color: "#3b82f6" },
  { value: "sleep",     icon: Moon,         label: "Sleep",     color: "#6366f1" },
  { value: "alert",     icon: AlertTriangle,label: "Alert",     color: "#ef4444" },
];

const PET_TYPES: PetConfig["type"][] = [
  "fox","octopus","owl","bee","lion","dolphin","wolf","butterfly","elephant","eagle"
];

export default function PetPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { getAgent, saveAgent } = useLocalAgents();
  const agent = getAgent(agentId);

  const [pet, setPet] = useState<PetConfig>(
    agent?.pet ?? { type: "fox", color: "#3b82f6", mood: "happy", level: 1 }
  );

  if (!agent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-white/20" />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight mb-2">Agent Not Found</h2>
        <p className="text-sm text-white/40 max-w-sm">
          We couldn't locate the agent profile for this pet workspace.
        </p>
      </motion.div>
    );
  }

  const update = (patch: Partial<PetConfig>) => {
    const next = { ...pet, ...patch };
    setPet(next);
    saveAgent({ ...agent, pet: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-6 space-y-8"
    >
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-pink-400" />
          Agent Pet
        </h2>
        <p className="text-sm text-white/30 mt-0.5">
          Customize your agent's visual persona and mood
        </p>
      </div>

      {/* Live preview */}
      <div className="flex flex-col items-center gap-6 py-10 rounded-3xl bg-white/[0.02] border border-white/5">
        <motion.div
          key={`${pet.type}-${pet.mood}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AgentPet pet={pet} size="xl" />
        </motion.div>

        <div className="text-center">
          <p className="text-lg font-black text-white">{agent.name}</p>
          <p className="text-sm text-white/30">{agent.role}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
              LVL {pet.level}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
              {pet.mood}
            </span>
          </div>
        </div>
      </div>

      {/* Mood selector */}
      <div>
        <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">Mood</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {MOODS.map(({ value, icon: Icon, label, color }) => (
            <button
              key={value}
              onClick={() => update({ mood: value })}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                pet.mood === value
                  ? "border-white/20 bg-white/5"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              )}
            >
              <Icon className="w-5 h-5" style={{ color: pet.mood === value ? color : "rgba(255,255,255,0.3)" }} />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                pet.mood === value ? "text-white" : "text-white/30"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Type selector */}
      <div>
        <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">
          <Palette className="w-3.5 h-3.5 inline mr-1.5" />
          Pet Type
        </p>
        <div className="flex flex-wrap gap-2">
          {PET_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => update({ type })}
              className={cn(
                "px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                pet.type === type
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white hover:bg-white/5"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">Accent Color</p>
        <div className="flex items-center gap-3">
          {["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444","#ec4899","#06b6d4"].map(c => (
            <button
              key={c}
              onClick={() => update({ color: c })}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all",
                pet.color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={pet.color}
            onChange={e => update({ color: e.target.value })}
            className="w-8 h-8 rounded-full cursor-pointer bg-transparent border border-white/10"
            title="Custom color"
          />
        </div>
      </div>
    </motion.div>
  );
}
