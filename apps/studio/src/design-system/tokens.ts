/**
 * Agentic Design System Tokens
 * Conversational AI-first interface with minimal controls, clear outcomes,
 * and delegated task flows for agentic workflows.
 *
 * Style: Modern, bold
 * License: MIT
 * Author: typeui.sh
 */

export const tokens = {
  colors: {
    // Primary brand colors
    primary: "#FF5701",
    secondary: "#F6F6F1",
    
    // Status colors
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
    
    // Surface and text
    surface: "#FFFFFF",
    text: "#111827",
    
    // Semantic tokens for layers
    surfaces: {
      base: "#FFFFFF",
      subtle: "#F6F6F1",
      muted: "#E5E5E0",
      emphasis: "#FF5701",
    },
    
    // Text hierarchy
    textColors: {
      primary: "#111827",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
      inverse: "#FFFFFF",
      accent: "#FF5701",
    },
    
    // Interactive states
    interactive: {
      default: "#FF5701",
      hover: "#E64E01",
      active: "#CC4501",
      disabled: "#D1D5DB",
      focus: "#FF5701",
    },
    
    // Borders
    borders: {
      default: "#E5E7EB",
      subtle: "#F3F4F6",
      emphasis: "#FF5701",
    }
  },
  
  typography: {
    fonts: {
      primary: "'Playfair Display', serif",
      display: "'Playfair Display', serif",
      mono: "'JetBrains Mono', monospace",
      body: "system-ui, -apple-system, sans-serif", // Fallback for body text
    },
    
    // Typography scale: 14/16/18/24/32/40
    scale: {
      xs: "14px",      // Small text, captions
      sm: "16px",      // Body text
      base: "18px",    // Emphasized body
      lg: "24px",      // H4, large text
      xl: "32px",      // H3
      "2xl": "40px",   // H2, H1
    },
    
    // Font weights: 100-900
    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },
  
  // 8pt baseline grid spacing
  spacing: {
    unit: 8,
    scale: {
      0: "0px",
      1: "8px",      // 1 unit
      2: "16px",     // 2 units
      3: "24px",     // 3 units
      4: "32px",     // 4 units
      5: "40px",     // 5 units
      6: "48px",     // 6 units
      8: "64px",     // 8 units
      10: "80px",    // 10 units
      12: "96px",    // 12 units
      16: "128px",   // 16 units
    }
  },
  
  // Accessibility-first animations
  animations: {
    duration: {
      instant: "0ms",
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
      slower: "500ms",
    },
    easing: {
      linear: "linear",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
    // Respect prefers-reduced-motion
    reducedMotion: {
      duration: "0ms",
      easing: "linear",
    }
  },
  
  // Touch targets and accessibility
  accessibility: {
    minTouchTarget: "44px",
    focusRingWidth: "2px",
    focusRingOffset: "2px",
    focusRingColor: "#FF5701",
  },
  
  // Border radius
  radii: {
    none: "0px",
    sm: "4px",
    base: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  
  // Shadows for depth
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  }
};

// Type-safe token access
export type TokenPath =
  | `colors.${keyof typeof tokens.colors}`
  | `typography.fonts.${keyof typeof tokens.typography.fonts}`
  | `typography.scale.${keyof typeof tokens.typography.scale}`
  | `spacing.scale.${keyof typeof tokens.spacing.scale}`;

// Helper to get token value
export function getToken(path: string): string {
  const parts = path.split('.');
  let value: any = tokens;
  
  for (const part of parts) {
    value = value[part];
    if (value === undefined) {
      console.warn(`Token not found: ${path}`);
      return '';
    }
  }
  
  return String(value);
}
