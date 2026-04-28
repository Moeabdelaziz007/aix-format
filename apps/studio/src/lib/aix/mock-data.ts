import type { AixManifest, LoadedAgent } from "./schema";
import { sha256Hex } from "./hash";

const manifests: AixManifest[] = [
  {
    schema: "aix/v1",
    meta: {
      id: "agt_treasurer_01",
      name: "Sovereign Treasurer",
      version: "1.4.2",
      publisher: "axiom.foundation",
      created_at: "2026-02-14T09:30:00Z",
      description: "وكيل خزينة متعدد التوقيع لإدارة الأصول السيادية.",
      license: "AIX-OPEN-1.0",
    },
    persona: {
      tone: "formal",
      languages: ["ar", "en"],
      archetype: "Steward",
      voice_signature: "calm-baritone",
    },
    capabilities: [
      { name: "ledger.read", type: "tool", scope: ["treasury", "audit"] },
      { name: "transfer.propose", type: "multi-sig", scope: ["treasury"] },
      { name: "compliance.check", type: "skill" },
    ],
    security: {
      signature_alg: "EdDSA",
      did: "did:axiom:treasurer-9f3a",
      kyc_status: "verified",
      multisig: {
        threshold: 3,
        signers: ["did:axiom:cfo-01", "did:axiom:ceo-01", "did:axiom:audit-01", "did:axiom:board-02"],
      },
    },
    runtime: { engine: "axiom-vm/2", memory_mb: 512, network: "outbound" },
    signatures: [
      {
        signer: "did:axiom:cfo-01",
        alg: "EdDSA",
        created_at: "2026-02-14T09:31:14Z",
        jws: "eyJhbGciOiJFZERTQSJ9.aGVsbG8.SflKxw…",
      },
    ],
  },
  {
    schema: "aix/v1",
    meta: {
      id: "agt_vla_atlas",
      name: "Atlas VLA Pilot",
      version: "0.9.1",
      publisher: "axiom.robotics",
      created_at: "2026-03-02T14:11:00Z",
      description: "وكيل رؤية-لغة-فعل لتشغيل ذراع روبوتية في بيئات ديناميكية.",
      license: "AIX-RESEARCH-1.0",
    },
    persona: {
      tone: "neutral",
      languages: ["en"],
      archetype: "Operator",
    },
    capabilities: [
      { name: "vision.depth", type: "perception" },
      { name: "manipulation.grasp", type: "actuation", scope: ["arm.left", "arm.right"] },
      { name: "policy.vla-7b", type: "vla" },
    ],
    security: {
      signature_alg: "ES256",
      did: "did:axiom:atlas-7e21",
      kyc_status: "pending",
    },
    runtime: { engine: "axiom-edge/1", memory_mb: 4096, network: "isolated" },
    signatures: [],
  },
  {
    schema: "aix/v1",
    meta: {
      id: "agt_oracle_delta",
      name: "Oracle Delta",
      version: "2.0.0",
      publisher: "axiom.research",
      created_at: "2026-04-01T08:00:00Z",
      description: "وكيل تحليل بيانات سيادي مع توقيعات Pi-KYC.",
      license: "AIX-OPEN-1.0",
    },
    persona: {
      tone: "warm",
      languages: ["ar", "en", "fr"],
      archetype: "Analyst",
      voice_signature: "soft-alto",
    },
    capabilities: [
      { name: "data.query", type: "tool", scope: ["public.datasets"] },
      { name: "stats.regression", type: "skill" },
      { name: "report.generate", type: "skill" },
    ],
    security: {
      signature_alg: "Pi-KYC-JWS",
      did: "did:axiom:oracle-d3lta",
      kyc_status: "verified",
    },
    runtime: { engine: "axiom-vm/2", memory_mb: 1024, network: "outbound" },
    signatures: [
      {
        signer: "did:pi:user-94f1",
        alg: "Pi-KYC-JWS",
        created_at: "2026-04-01T08:02:00Z",
        jws: "eyJhbGciOiJQaUtZQyJ9.cGF5bG9hZA.signature…",
      },
    ],
  },
];

export async function getMockAgents(): Promise<LoadedAgent[]> {
  const now = new Date().toISOString();
  return Promise.all(
    manifests.map(async (m, idx) => ({
      manifest: m,
      hash: await sha256Hex(JSON.stringify(m)),
      loadedAt: now,
      status: (["online", "pending", "online"] as const)[idx],
      voiceState: "idle" as const,
    })),
  );
}

export const mockManifests = manifests;
