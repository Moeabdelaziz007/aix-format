"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "purple";
  size?: "sm" | "md" | "lg";
  isAnimated?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isAnimated = true, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-primary text-primary-dark hover:bg-primary/90 [0_0_20px_rgba(59,130,246,0.3)]",
      secondary: "bg-surface-3 text-foreground border border-white/10 hover:bg-surface-4",
      ghost: "bg-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground",
      danger: "bg-danger text-white hover:bg-danger/90 [0_0_20px_rgba(239,68,68,0.3)]",
      purple: "bg-purple-mcp text-white hover:bg-purple-mcp/90 [0_0_20px_rgba(139,92,246,0.3)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    const CombinedButton = isAnimated ? motion.button : "button";

    return (
      <CombinedButton
        ref={ref as any}
        whileHover={isAnimated ? { scale: 1.02, translateY: -1 } : undefined}
        whileTap={isAnimated ? { scale: 0.98 } : undefined}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = "Button";
