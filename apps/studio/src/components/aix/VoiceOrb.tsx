import { motion } from "framer-motion";
import type { VoiceState } from "@/lib/aix/schema";
import { cn } from "@/lib/utils";

interface VoiceOrbProps {
  state: VoiceState;
  size?: number;
  label?: string;
}

const stateLabel: Record<VoiceState, string> = {
  idle: "في الاستراحة",
  listening: "ينصت",
  processing: "يفكّر",
  speaking: "يتحدّث",
};

export function VoiceOrb({ state, size = 220, label }: VoiceOrbProps) {
  const speed = state === "processing" ? 1.2 : state === "speaking" ? 1.5 : state === "listening" ? 2.5 : 4;
  const scale = state === "speaking" ? [1, 1.08, 1] : state === "listening" ? [1, 1.03, 1] : [1, 1.02, 1];

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer halo */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, oklch(0.85 0.08 240 / 0.18), transparent 70%)",
          }}
          animate={{ scale: state === "idle" ? [1, 1.05, 1] : [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: speed, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ring 3 */}
        <motion.div
          className="absolute rounded-full border border-white/10"
          style={{ width: size * 0.95, height: size * 0.95 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />

        {/* Ring 2 — animated */}
        <motion.div
          className="absolute rounded-full border border-white/15"
          style={{ width: size * 0.78, height: size * 0.78 }}
          animate={{ scale, rotate: state === "processing" ? -360 : 0 }}
          transition={{
            scale: { duration: speed * 0.6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* Ring 1 */}
        <motion.div
          className="absolute rounded-full border border-white/20"
          style={{ width: size * 0.6, height: size * 0.6 }}
          animate={{ scale }}
          transition={{ duration: speed * 0.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core orb */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center rounded-full",
            "backdrop-blur-2xl",
          )}
          style={{
            width: size * 0.42,
            height: size * 0.42,
            background:
              "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.95), oklch(0.85 0.06 240 / 0.5) 60%, oklch(0.65 0.08 250 / 0.3) 100%)",
            boxShadow:
              "0 0 40px oklch(0.85 0.08 240 / 0.4), inset 0 -10px 30px oklch(0.5 0.1 260 / 0.4), inset 0 5px 20px oklch(1 0 0 / 0.6)",
          }}
          animate={{ scale }}
          transition={{ duration: speed * 0.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Inner shimmer */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, oklch(1 0 0 / 0.15), transparent, oklch(1 0 0 / 0.1), transparent)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>

      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {label ?? "Voice State"}
        </div>
        <div className="mt-1 text-sm font-medium text-foreground/90">{stateLabel[state]}</div>
      </div>
    </div>
  );
}
