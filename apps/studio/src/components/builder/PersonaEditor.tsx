"use client";

import { useState } from "react";
import { Plus, X, BrainCircuit, Sparkles } from "lucide-react";

export function PersonaEditor() {
  const [traits, setTraits] = useState(["Analytical", "Professional", "Concise"]);
  const [prompt, setPrompt] = useState("");

  const addTrait = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      setTraits([...traits, e.currentTarget.value]);
      e.currentTarget.value = "";
    }
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
            Personality Traits
          </label>
          <span className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-bold tracking-widest">
            Enter to Add
          </span>
        </div>
        <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] min-h-[52px]">
          {traits.map((trait, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-primary-dim)]/20 border border-[var(--color-primary-dim)]/30 text-[var(--color-primary)] text-xs font-medium group"
            >
              {trait}
              <button onClick={() => removeTrait(i)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            placeholder="Add trait..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-white min-w-[100px]"
            onKeyDown={addTrait}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-white flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-[var(--color-secondary)]" />
          System Instructions
        </label>
        <div className="relative">
          <textarea
            placeholder="Define the core behavioral logic and constraints for the agent..."
            className="input min-h-[200px] resize-none py-4 font-mono text-xs leading-relaxed"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-50">
            <span className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-mono">Tokens: {prompt.length} / 4096</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[var(--color-primary-dim)]/5 border border-[var(--color-primary-dim)]/10">
        <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed italic">
          "Persona is the soul of your agent. These instructions define how the agent perceives and interacts with the world via the AIX protocol."
        </p>
      </div>
    </div>
  );
}
