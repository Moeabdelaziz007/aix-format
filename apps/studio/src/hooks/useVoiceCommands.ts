"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Intent → Action router.
 * Parses a transcript and fires the matching side-effect.
 * Returns { matched: boolean, action: string } so the caller can
 * give audio feedback.
 */

export type VoiceIntent =
  | { type: "navigate"; path: string; label: string }
  | { type: "open_wikibrain"; agentId: string }
  | { type: "open_voice_wizard" }
  | { type: "open_builder" }
  | { type: "open_deploy"; agentId?: string }
  | { type: "search"; query: string }
  | { type: "unknown"; raw: string };

// ── Intent parser ──────────────────────────────────────────────────────────
export function parseIntent(transcript: string): VoiceIntent {
  const t = transcript.toLowerCase().trim();

  // Navigation
  const navMap: Record<string, string> = {
    marketplace:      "/marketplace",
    market:           "/marketplace",
    builder:          "/builder",
    "build agent":    "/builder",
    fleet:            "/fleet",
    "my fleet":       "/fleet",
    "my agents":      "/my-agents",
    analytics:        "/analytics",
    revenue:          "/analytics",
    settings:         "/settings",
    identity:         "/identity",
    kyc:              "/settings",
    scan:             "/scan",
    "abom scan":      "/scan",
    mcp:              "/mcp",
    "mcp registry":   "/mcp",
    skills:           "/skills",
    playground:       "/playground",
    pulse:            "/pulse",
    pricing:          "/pricing",
    space:            "/space",
    home:             "/",
  };

  for (const [keyword, path] of Object.entries(navMap)) {
    if (t.includes(keyword)) {
      return { type: "navigate", path, label: keyword };
    }
  }

  // WikiBrain — "show wikibrain for <agentId>" / "open brain <agentId>"
  const wikiMatch = t.match(/(?:wikibrain|wiki brain|brain|memory)\s+(?:for\s+)?([a-z0-9_-]+)/i);
  if (wikiMatch) {
    return { type: "open_wikibrain", agentId: wikiMatch[1] };
  }

  // Voice Wizard
  if (t.includes("voice wizard") || t.includes("create agent") || t.includes("new agent")) {
    return { type: "open_voice_wizard" };
  }

  // Deploy
  const deployMatch = t.match(/deploy\s+(?:agent\s+)?([a-z0-9_-]+)?/i);
  if (deployMatch) {
    return { type: "open_deploy", agentId: deployMatch[1] };
  }

  // Search
  const searchMatch = t.match(/(?:search|find|look for)\s+(.+)/i);
  if (searchMatch) {
    return { type: "search", query: searchMatch[1] };
  }

  return { type: "unknown", raw: transcript };
}

// ── Hook ───────────────────────────────────────────────────────────────────
interface UseVoiceCommandsOptions {
  onOpenVoiceWizard?: () => void;
  onOpenWikiBrain?: (agentId: string) => void;
  onOpenDeploy?: (agentId?: string) => void;
  onSearch?: (query: string) => void;
  onUnknown?: (raw: string) => void;
}

export function useVoiceCommands(opts: UseVoiceCommandsOptions = {}) {
  const router = useRouter();

  const dispatch = useCallback(
    (transcript: string): { matched: boolean; feedback: string } => {
      const intent = parseIntent(transcript);

      switch (intent.type) {
        case "navigate":
          router.push(intent.path);
          return { matched: true, feedback: `Navigating to ${intent.label}` };

        case "open_wikibrain":
          opts.onOpenWikiBrain?.(intent.agentId);
          return { matched: true, feedback: `Opening WikiBrain for ${intent.agentId}` };

        case "open_voice_wizard":
          opts.onOpenVoiceWizard?.();
          return { matched: true, feedback: "Opening Voice Wizard" };

        case "open_deploy":
          opts.onOpenDeploy?.(intent.agentId);
          return { matched: true, feedback: "Opening deploy panel" };

        case "search":
          opts.onSearch?.(intent.query);
          router.push(`/marketplace?q=${encodeURIComponent(intent.query)}`);
          return { matched: true, feedback: `Searching for ${intent.query}` };

        case "unknown":
        default:
          opts.onUnknown?.(intent.raw);
          return { matched: false, feedback: "" };
      }
    },
    [router, opts]
  );

  return { dispatch, parseIntent };
}
