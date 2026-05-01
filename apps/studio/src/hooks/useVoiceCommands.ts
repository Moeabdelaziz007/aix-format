"use client";

import { useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

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
  | { type: "run_agent"; agentId: string }
  | { type: "scan_agent"; agentId: string }
  | { type: "show_pulse"; agentId: string }
  | { type: "query_risk"; agentId: string }
  | { type: "unknown"; raw: string };

// ── Intent parser ──────────────────────────────────────────────────────────
export function parseIntent(transcript: string, agentId?: string): VoiceIntent {
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
    skills:           agentId ? `/workspace/${agentId}/skills` : "/skills",
    playground:       "/playground",
    pulse:            agentId ? `/workspace/${agentId}/pulse`  : "/pulse",
    deploy:           agentId ? `/workspace/${agentId}/deploy` : "/deploy",
    wikibrain:        agentId ? `/workspace/${agentId}/wikibrain` : "/my-agents",
    pricing:          "/pricing",
    space:            "/space",
    home:             "/",
  };

  for (const [keyword, path] of Object.entries(navMap)) {
    if (t.includes(keyword)) {
      return { type: "navigate", path, label: keyword };
    }
  }

  // Workspace / Open Agent — "open agent x" / "workspace x"
  const workspaceMatch = t.match(/(?:workspace|open agent|agent)\s+([a-z0-9_-]+)/i);
  if (workspaceMatch) {
    return { type: "navigate", path: `/workspace/${workspaceMatch[1]}`, label: `agent ${workspaceMatch[1]}` };
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

  // Run Agent — "run agent x"
  const runMatch = t.match(/(?:run|execute|start)\s+(?:agent\s+)?([a-z0-9_-]+)/i);
  if (runMatch) {
    return { type: "run_agent", agentId: runMatch[1] };
  }

  // Scan Agent — "scan agent x"
  const scanMatch = t.match(/(?:scan|check|validate)\s+(?:agent\s+)?([a-z0-9_-]+)/i);
  if (scanMatch) {
    return { type: "scan_agent", agentId: scanMatch[1] };
  }

  // Pulse — "show pulse for x"
  const pulseMatch = t.match(/(?:pulse|activity|logs)\s+(?:for\s+)?([a-z0-9_-]+)/i);
  if (pulseMatch) {
    return { type: "show_pulse", agentId: pulseMatch[1] };
  }

  // Risk Score — "what is the risk score of x"
  const riskMatch = t.match(/(?:risk|security|score)\s+(?:of|for\s+)?([a-z0-9_-]+)/i);
  if (riskMatch) {
    return { type: "query_risk", agentId: riskMatch[1] };
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
  const params = useParams();
  const agentId = params?.agentId as string | undefined;

  // Use ref to avoid callback thrashing on every render
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const dispatch = useCallback(
    (transcript: string): { matched: boolean; feedback: string } => {
      const intent = parseIntent(transcript, agentId);

      switch (intent.type) {
        case "navigate":
          router.push(intent.path);
          return { matched: true, feedback: `Navigating to ${intent.label}` };

        case "open_wikibrain":
          // If already in workspace, just go to sub-route, otherwise go to full path
          if (agentId === intent.agentId) {
            router.push(`/workspace/${intent.agentId}/wikibrain`);
          } else {
            router.push(`/workspace/${intent.agentId}/wikibrain`);
          }
          optsRef.current.onOpenWikiBrain?.(intent.agentId);
          return { matched: true, feedback: `Opening WikiBrain for ${intent.agentId}` };

        case "open_voice_wizard":
          optsRef.current.onOpenVoiceWizard?.();
          return { matched: true, feedback: "Opening Voice Wizard" };

        case "open_deploy":
          const targetId = intent.agentId || agentId;
          if (targetId) {
            router.push(`/workspace/${targetId}/deploy`);
          } else {
            router.push("/fleet");
          }
          optsRef.current.onOpenDeploy?.(intent.agentId);
          return { matched: true, feedback: "Opening deploy panel" };

        case "search":
          optsRef.current.onSearch?.(intent.query);
          router.push(`/marketplace?q=${encodeURIComponent(intent.query)}`);
          return { matched: true, feedback: `Searching for ${intent.query}` };

        case "run_agent":
          router.push(`/workspace/${intent.agentId}?action=run`);
          return { matched: true, feedback: `Executing agent ${intent.agentId}` };

        case "scan_agent":
          router.push(`/workspace/${intent.agentId}/scan`);
          return { matched: true, feedback: `Scanning agent ${intent.agentId}` };

        case "show_pulse":
          router.push(`/workspace/${intent.agentId}/pulse`);
          return { matched: true, feedback: `Showing pulse for ${intent.agentId}` };

        case "query_risk":
          router.push(`/workspace/${intent.agentId}/scan?view=summary`);
          return { matched: true, feedback: `Retrieving risk score for ${intent.agentId}` };

        case "unknown":
        default:
          optsRef.current.onUnknown?.(intent.raw);
          return { matched: false, feedback: "" };
      }
    },
    [router, agentId] // opts removed from deps
  );

  return { dispatch, parseIntent };
}
