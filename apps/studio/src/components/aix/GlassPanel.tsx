import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "subtle";
  padded?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", padded = true, ...props }, ref) => {
    const base =
      variant === "strong"
        ? "glass-strong"
        : variant === "subtle"
          ? "glass"
          : "glass-panel";
    return (
      <div
        ref={ref}
        className={cn(
          base,
          "rounded-2xl",
          padded && "p-6",
          "transition-all duration-300",
          className,
        )}
        {...props}
      />
    );
  },
);
GlassPanel.displayName = "GlassPanel";
