"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BUTTON PRIMITIVES
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "purple";
  size?: "sm" | "md" | "lg";
  isAnimated?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isAnimated = true, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-primary text-primary-dark hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      secondary: "bg-surface-3 text-foreground border border-white/10 hover:bg-surface-4",
      ghost: "bg-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground",
      danger: "bg-danger text-white hover:bg-danger/90 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
      purple: "bg-purple-mcp text-white hover:bg-purple-mcp/90 shadow-[0_0_20px_rgba(139,92,246,0.3)]",
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

/**
 * CARD PRIMITIVES
 */
interface CardProps extends HTMLMotionProps<"div"> {
  elevation?: 1 | 2 | 3;
}

export const Card = ({ className, elevation = 1, ...props }: CardProps) => {
  const elevations = {
    1: "bg-surface-1 border-white/5",
    2: "bg-surface-2 border-white/10",
    3: "bg-surface-3 border-white/15",
  };

  return (
    <motion.div
      whileHover={{ translateY: -4, shadow: "0 20px 40px rgba(0,0,0,0.4)" }}
      className={cn(
        "rounded-xl border p-6 transition-all duration-300",
        elevations[elevation],
        className
      )}
      {...props}
    />
  );
};

/**
 * INPUT PRIMITIVES
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-white/10 bg-surface-1 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

/**
 * BADGE PRIMITIVES
 */
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    outline: "bg-transparent text-foreground border-white/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

/**
 * TYPOGRAPHY PRIMITIVES
 */
interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption" | "code";
  weight?: "regular" | "medium" | "semibold" | "bold";
  gradient?: boolean;
}

export const Typography = ({ 
  variant = "body", 
  weight, 
  gradient, 
  className, 
  children, 
  ...props 
}: TypographyProps) => {
  const tags: Record<string, keyof JSX.IntrinsicElements> = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    body: "p",
    caption: "span",
    code: "code",
  };

  const Tag = tags[variant];

  const variants = {
    h1: "text-[clamp(2.5rem,8vw,5rem)] leading-[1.1] font-bold tracking-tight",
    h2: "text-[clamp(2rem,6vw,3.5rem)] leading-[1.2] font-bold tracking-tight",
    h3: "text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.3] font-bold",
    h4: "text-xl sm:text-2xl font-semibold",
    h5: "text-lg sm:text-xl font-semibold",
    h6: "text-base sm:text-lg font-medium",
    body: "text-base sm:text-lg text-foreground/80 leading-relaxed",
    caption: "text-xs sm:text-sm text-foreground/60",
    code: "font-mono text-sm bg-surface-2 px-1.5 py-0.5 rounded border border-white/5",
  };

  const weights = {
    regular: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  return (
    <Tag
      className={cn(
        variants[variant],
        weight && weights[weight],
        gradient && "bg-gradient-to-r from-primary via-purple-mcp to-primary-accent bg-clip-text text-transparent animate-gradient-x",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};

/**
 * LAYOUT PRIMITIVES
 */
export const Container = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props}>
    {children}
  </div>
);

interface SectionProps extends HTMLMotionProps<"section"> {
  background?: "dark" | "surface-1" | "surface-2";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Section = ({ 
  className, 
  background = "dark", 
  padding = "md", 
  children, 
  ...props 
}: SectionProps) => {
  const backgrounds = {
    dark: "bg-background",
    "surface-1": "bg-surface-1",
    "surface-2": "bg-surface-2",
  };

  const paddings = {
    none: "py-0",
    sm: "py-12 sm:py-16",
    md: "py-20 sm:py-24",
    lg: "py-32 sm:py-40",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(backgrounds[background], paddings[padding], className)}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export const SectionHeader = ({ 
  title, 
  subtitle, 
  alignment = "center", 
  className 
}: { 
  title: string; 
  subtitle?: string; 
  alignment?: "left" | "center"; 
  className?: string;
}) => (
  <div className={cn(
    "mb-12 sm:mb-16",
    alignment === "center" ? "text-center" : "text-left",
    className
  )}>
    <Typography variant="h2" gradient className="mb-4">
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body" className={cn("max-w-2xl", alignment === "center" && "mx-auto")}>
        {subtitle}
      </Typography>
    )}
  </div>
);
