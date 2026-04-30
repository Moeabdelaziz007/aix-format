/**
 * AIX Studio Design System Tokens
 * Following the specific instructions for deep space aesthetics, 
 * electric blue accents, and neon highlights.
 */

export const tokens = {
  colors: {
    primary: {
      dark: "#0a0a0f", // deep space black
      accent: "#3b82f6", // electric blue
      purple: "#8b5cf6", // MCP purple
    },
    status: {
      success: "#10b981", // neon green
      warning: "#f59e0b",
      danger: "#ef4444",
    },
    surfaces: {
      l1: "#0f0f1a",
      l2: "#121222",
      l3: "#16162a",
      l4: "#1a1a2e",
      l5: "#1e1e35",
    },
    gradients: {
      hero: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
      accent: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      success: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
    }
  },
  typography: {
    fonts: {
      body: "Inter, system-ui, sans-serif",
      code: "JetBrains Mono, monospace",
    },
    scale: {
      caption: "12px",
      base: "16px",
      h6: "20px",
      h5: "24px",
      h4: "32px",
      h3: "48px",
      h2: "64px",
      h1: "96px",
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.6,
    }
  },
  spacing: {
    unit: 4,
    scale: {
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      6: "24px",
      8: "32px",
      12: "48px",
      16: "64px",
      24: "96px",
      32: "128px",
    }
  },
  animations: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },
    easing: {
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    }
  }
};
