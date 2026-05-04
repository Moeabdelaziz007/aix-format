"use client";
import { APP_VERSION } from "@/lib/version";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const sections = [
  { id: "overview",     label: "Overview" },
  { id: "structure",    label: "File Structure" },
  { id: "identity",     label: "Identity & KYC" },
  { id: "signing",      label: "Cryptographic Signing" },
  { id: "abom",         label: "ABOM" },
  { id: "permissions",  label: "Permissions" },
  { id: "extensions",   label: "Extensions" },
  { id: "topology",     label: "Quantum Topology" },
  { id: "economy",      label: "Sovereign Economy" },
  { id: "versioning",   label: "Versioning" },
  { id: "examples",     label: "Examples" },
];

const specContent: Record<string, { title: string; badge?: string; body: React.ReactNode }> = {
  overview: {
    title: "AIX Format — Agent Identity Exchange",
    badge: `v${APP_VERSION}`,
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] text-lg leading-relaxed">
          The <span className="text-[var(--color-primary)] font-semibold">.aix</span> format is an open standard
          for declaring, signing, and publishing autonomous AI agent manifests. It provides a
          cryptographically verifiable identity layer for agents operating on sovereign infrastructure.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { icon: "🔐", title: "Sovereign Identity",  desc: "Ed25519-signed manifests tied to Pi Network KYC" },
            { icon: "📦", title: "Agent Bill of Materials", desc: "ABOM tracks every dependency and capability" },
            { icon: "⚡", title: "Interoperable",       desc: "Works with any A2A protocol or LLM runtime" },
          ].map((f) => (
            <div key={f.title} className="spec-card rounded-2xl p-5 border border-white/5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white font-semibold mt-3 mb-1">{f.title}</h3>
              <p className="text-sm text-[var(--color-on-surface-variant)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  structure: {
    title: "File Structure",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          An <code className="code-inline">.aix</code> file is a JSON document with six top-level keys.
          Every field except <code className="code-inline">extensions</code> is required.
        </p>
        <pre className="code-block"><code>{`{
  "aix_version":  "1.2",
  "agent_id":     "did:axiom:pi:abc123",
  "metadata":     { ... },
  "identity":     { ... },
  "capabilities": [ ... ],
  "abom":         { ... },
  "permissions":  { ... },
  "signature":    "...",
  "extensions":   { }       // optional
}`}</code></pre>
        <table className="spec-table w-full text-sm">
          <thead>
            <tr>
              <th>Field</th><th>Type</th><th>Required</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["aix_version",  "string",   "✅", "Spec version, currently \"1.2\""],
              ["agent_id",     "DID",      "✅", "Globally unique decentralized identifier"],
              ["metadata",     "object",   "✅", "Name, description, author, license"],
              ["identity",     "object",   "✅", "KYC binding and trust anchors"],
              ["capabilities", "array",    "✅", "Declared skills and tool permissions"],
              ["abom",         "object",   "✅", "Agent Bill of Materials"],
              ["permissions",  "object",   "✅", "Scope and access control"],
              ["signature",    "string",   "✅", "Ed25519 / SHA-256 signature"],
              ["extensions",   "object",   "—",  "Namespace-scoped custom fields"],
            ].map(([f, t, r, d]) => (
              <tr key={f}>
                <td><code className="code-inline text-xs">{f}</code></td>
                <td className="text-[var(--color-on-surface-variant)]">{t}</td>
                <td className="text-center">{r}</td>
                <td className="text-[var(--color-on-surface-variant)]">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  identity: {
    title: "Identity & KYC Binding",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          The <code className="code-inline">identity</code> block binds the agent to a human-verified
          Pi Network KYC credential, preventing sybil attacks and establishing legal accountability.
        </p>
        <pre className="code-block"><code>{`"identity": {
  "did_method":    "did:axiom:pi",
  "pi_uid":        "pi_user_abc123",
  "kyc_status":    "verified",
  "kyc_provider":  "pi_network",
  "kyc_timestamp": "2025-11-01T00:00:00Z",
  "trust_level":   3,
  "public_key":    "ed25519:AAAA...BBBB"
}`}</code></pre>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="spec-card rounded-2xl p-4 border border-white/5">
            <h4 className="text-white font-semibold mb-2">Trust Levels</h4>
            <ul className="text-sm text-[var(--color-on-surface-variant)] space-y-1">
              <li><span className="text-[var(--color-primary)]">[1]</span> — Self-declared (no KYC)</li>
              <li><span className="text-[var(--color-primary)]">[2]</span> — Email/phone verified</li>
              <li><span className="text-[var(--color-primary)]">[3]</span> — Pi KYC (human verified)</li>
              <li><span className="text-[var(--color-primary)]">[4]</span> — Enterprise / institutional</li>
            </ul>
          </div>
          <div className="spec-card rounded-2xl p-4 border border-white/5">
            <h4 className="text-white font-semibold mb-2">DID Methods</h4>
            <ul className="text-sm text-[var(--color-on-surface-variant)] space-y-1">
              <li><code className="code-inline">did:axiom:pi</code> — Pi Network anchor</li>
              <li><code className="code-inline">did:web</code> — Web-based DID</li>
              <li><code className="code-inline">did:key</code> — Key-only (no chain)</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  signing: {
    title: "Cryptographic Signing",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          Every <code className="code-inline">.aix</code> manifest must be signed before publishing.
          Use the CLI tool to sign locally with your Ed25519 private key.
        </p>
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Sign via CLI</h4>
          <pre className="code-block"><code>{`# Install
npm install -g @aix-format/cli

# Sign a manifest
aix sign --key ./private.pem --manifest agent.aix.json

# Verify a signed manifest
aix verify agent.aix.json`}</code></pre>
        </div>
        <div className="space-y-3">
          <h4 className="text-white font-semibold">Signature Algorithm</h4>
          <pre className="code-block"><code>{`// Canonical signing procedure:
// 1. Exclude the "signature" field from the manifest
// 2. Canonicalize JSON (RFC 8785 JSON Canonicalization Scheme)
// 3. Compute SHA-256 digest
// 4. Sign digest with Ed25519 private key
// 5. Base64url-encode the signature

const payload   = canonicalize(manifestWithoutSignature);
const digest    = sha256(payload);
const signature = ed25519.sign(digest, privateKey);
manifest.signature = base64url(signature);`}</code></pre>
        </div>
      </div>
    ),
  },
  abom: {
    title: "ABOM — Agent Bill of Materials",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          The Agent Bill of Materials (<code className="code-inline">abom</code>) declares every model,
          tool, dataset, and dependency the agent uses — enabling supply-chain security audits
          and reproducible deployments.
        </p>
        <pre className="code-block"><code>{`"abom": {
  "schema_version": "1.0",
  "generated_at":   "2025-11-01T00:00:00Z",
  "models": [
    {
      "id":       "gpt-4o",
      "provider": "openai",
      "version":  "2024-11",
      "hash":     "sha256:abc..."
    }
  ],
  "tools": [
    {
      "name":    "web_search",
      "version": "2.1.0",
      "source":  "npm:@aix/tools-web"
    }
  ],
  "datasets":     [],
  "dependencies": []
}`}</code></pre>
      </div>
    ),
  },
  permissions: {
    title: "Permissions & Access Control",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          Permissions follow a least-privilege model. Each capability must be explicitly
          declared with its allowed scope and any required user consent.
        </p>
        <pre className="code-block"><code>{`"permissions": {
  "network": {
    "outbound": ["https://*.pi.network", "https://api.openai.com"],
    "inbound":  false
  },
  "filesystem": {
    "read":  ["/tmp/aix-sandbox"],
    "write": ["/tmp/aix-sandbox"]
  },
  "data_retention": {
    "max_days":   7,
    "pii_allowed": false
  },
  "human_in_loop": {
    "required_for": ["financial_transactions", "identity_ops"]
  }
}`}</code></pre>
      </div>
    ),
  },
  extensions: {
    title: "Extensions & Custom Statutes",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          Extensions allow developers to attach arbitrary metadata or custom logic to an agent. 
          All extension data must be namespace-scoped to prevent collisions.
        </p>
        <pre className="code-block"><code>{`"extensions": {
  "com.axiom.governance": {
    "statute_id": "ST-2026-001",
    "enforcement": "strict",
    "sovereign_override": false
  },
  "io.pi.payment": {
    "preferred_currency": "PI",
    "max_gas_fee": 0.01
  }
}`}</code></pre>
        <div className="spec-card rounded-2xl p-5 border border-white/5">
          <h4 className="text-white font-semibold mb-3">Extension Rules</h4>
          <ul className="text-sm text-[var(--color-on-surface-variant)] space-y-2">
            <li><span className="text-primary font-bold">Namespace Required:</span> Use reverse-DNS notation (e.g., <code className="code-inline">com.org.plugin</code>).</li>
            <li><span className="text-primary font-bold">Immutable Signing:</span> Extensions are included in the manifest signature hash.</li>
            <li><span className="text-primary font-bold">TrustChain Integration:</span> Extension actions must be logged via <code className="code-inline">TrustChain.append()</code>.</li>
          </ul>
        </div>
      </div>
    ),
  },
  topology: {
    title: "Quantum Topology & Meta-Loop",
    body: (
      <div className="space-y-8">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          The system doesn't just improve; it observes itself improving. Through Quantum Topology, 
          we track the relationships and emergent behaviors across the entire agent network.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="spec-card rounded-2xl p-5 border border-white/5 space-y-3">
             <h4 className="text-white font-black text-xs uppercase tracking-widest text-primary">Layered Evolution</h4>
             <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                The Meta-Loop operates across 5 distinct layers of consciousness, from raw execution to quantum path optimization.
             </p>
             <div className="space-y-2 pt-2">
                {[
                   { l: "L0", t: "Execution", d: "Agent performs the task" },
                   { l: "L1", t: "Reflection", d: "Agent reviews own work" },
                   { l: "L2", t: "Patterns", d: "Discovery of mistakes" },
                   { l: "L3", t: "Topology", d: "Cross-agent relationships" },
                   { l: "L4", t: "Quantum", d: "Parallel path optimization" },
                ].map(item => (
                   <div key={item.l} className="flex items-center gap-3 p-2 rounded-xl bg-black/20 border border-white/5">
                      <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/20 text-primary font-black text-[10px]">{item.l}</span>
                      <div>
                         <div className="text-[10px] font-bold text-white">{item.t}</div>
                         <div className="text-[8px] text-zinc-500">{item.d}</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          <div className="spec-card rounded-2xl p-5 border border-white/5 space-y-4">
             <h4 className="text-white font-black text-xs uppercase tracking-widest text-primary">Topological Wisdom</h4>
             <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                Wisdom is synthesized by contrasting recent performance with historical "scar tissue" failures.
             </p>
             <pre className="code-block text-[10px]"><code>{`// Alchemy: Logs -> Wisdom
const synthesis = await Alchemist.consolidate({
  recent_logs: logs.slice(-10),
  historical_scars: failures.all(),
  goal: "Zero recurrence"
});

// Result indexed in WikiBrain
await WikiBrain.index(synthesis);`}</code></pre>
          </div>
        </div>
      </div>
    ),
  },
  economy: {
    title: "Sovereign Economy & Financial Agency",
    body: (
      <div className="space-y-8">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          AIX Agents are economic actors. By integrating Coinbase Agentic Wallets (TEE) 
          and Stripe MCP, we enable agents to hold capital and execute transactions autonomously.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              t: "Coinbase TEE Vault", 
              d: "MPC + Trusted Execution Environment for private keys.", 
              i: "security", 
              v: "Active" 
            },
            { 
              t: "Stripe MCP Bridge", 
              d: "Native Stripe tool access via Model Context Protocol.", 
              i: "payments", 
              v: "L3 Verified" 
            },
            { 
              t: "Agentic Wallets", 
              d: "Programmable session caps and spending limits.", 
              i: "account_balance", 
              v: "Tesla 3-6-9" 
            },
          ].map(item => (
            <div key={item.t} className="spec-card rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <span className="material-symbols-rounded text-primary text-2xl mb-3">{item.i}</span>
                <h4 className="text-white font-bold text-sm mb-2">{item.t}</h4>
                <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed">{item.d}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">{item.v}</span>
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="spec-card rounded-2xl p-6 border border-white/5 space-y-4">
           <h4 className="text-white font-black text-xs uppercase tracking-widest text-primary">Financial Guardrails</h4>
           <pre className="code-block text-[11px]"><code>{`// Financial Clearance Logic (Tesla Harmony)
if (tool.isFinancial()) {
  const safety = await abom.getScore(agentDid);
  if (safety < 9.0) { // Tesla 9: Universal Security
    throw new Error("Financial Tier 3 requires 9.0+ Safety Score");
  }
  await CoinbaseVault.requestTEEAttestation(agentId, 1369); // Tesla 1-3-6-9
}`}</code></pre>
        </div>
      </div>
    ),
  },
  versioning: {
    title: "Versioning",
    body: (
      <div className="space-y-6">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          AIX follows semantic versioning. The <code className="code-inline">aix_version</code> field
          in the manifest must match a published spec version.
        </p>
        <table className="spec-table w-full text-sm">
          <thead>
            <tr><th>Version</th><th>Status</th><th>Key Changes</th></tr>
          </thead>
          <tbody>
            {[
              ["1.2", "✅ Current",    "ABOM v1, Ed25519 signing, Pi KYC binding"],
              ["1.1", "⚠️ Deprecated", "SHA-256 signing only, no ABOM"],
              ["1.0", "❌ EOL",        "Initial draft, unstable"],
            ].map(([v, s, k]) => (
              <tr key={v}>
                <td><code className="code-inline">{v}</code></td>
                <td>{s}</td>
                <td className="text-[var(--color-on-surface-variant)]">{k}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  examples: {
    title: "Complete Example",
    body: (
      <div className="space-y-4">
        <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
          A minimal but complete <code className="code-inline">.aix</code> manifest for a data analysis agent.
        </p>
        <pre className="code-block"><code>{`{
  "aix_version": "1.2",
  "agent_id":    "did:axiom:pi:7xk2m9pqr",
  "metadata": {
    "name":        "Data Analyzer Pro",
    "description": "Analyzes datasets and produces structured reports",
    "author":      "AMRIKYY AI Solutions",
    "license":     "MIT",
    "created_at":  "2025-11-01T00:00:00Z"
  },
  "identity": {
    "did_method":   "did:axiom:pi",
    "pi_uid":       "pi_user_abc123",
    "kyc_status":   "verified",
    "trust_level":  3,
    "public_key":   "ed25519:AAAA...BBBB"
  },
  "capabilities": [
    { "id": "data_analysis",  "version": "2.0", "granted": true },
    { "id": "file_read",      "version": "1.0", "granted": true }
  ],
  "permissions": {
    "network": { "outbound": [], "inbound": false },
    "data_retention": { "max_days": 1, "pii_allowed": false }
  },
  "abom": {
    "schema_version": "1.0",
    "models": [{ "id": "gpt-4o", "provider": "openai" }],
    "tools":  [{ "name": "csv_parser", "version": "1.2.0" }]
  },
  "signature": "base64url:xyz..."
}`}</code></pre>
      </div>
    ),
  },
};

export default function SpecPage() {
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const current = specContent[active];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-background)]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[rgba(9,9,9,0.85)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 flex items-center justify-center">
              <span className="text-[var(--color-primary)] text-xs font-bold">.aix</span>
            </div>
            <span className="text-sm text-[var(--color-on-surface-variant)] group-hover:text-white transition-colors">
              AIX Spec
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[var(--color-primary)]/30 text-[var(--color-primary)] bg-[var(--color-primary)]/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
              v${APP_VERSION} — Current
            </span>
            <button
              className="sm:hidden text-[var(--color-on-surface-variant)] hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar — desktop */}
        <aside className="hidden sm:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/5 py-8 px-4">
          <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-4 px-2">
            Specification
          </p>
          <nav className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${
                  active === s.id
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                    : "text-[var(--color-on-surface-variant)] hover:text-white hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile nav dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="sm:hidden fixed top-14 left-0 right-0 z-40 bg-[var(--color-surface)] border-b border-white/5 px-4 py-3 flex flex-wrap gap-2"
            >
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActive(s.id); setMobileOpen(false); }}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                    active === s.id
                      ? "border-[var(--color-primary)]/50 text-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-white/10 text-[var(--color-on-surface-variant)] hover:border-white/20 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{current.title}</h1>
                {current.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-mono">
                    {current.badge}
                  </span>
                )}
              </div>
              {current.body}
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next */}
          <div className="flex justify-between mt-16 pt-6 border-t border-white/5">
            {sections.findIndex((s) => s.id === active) > 0 ? (
              <button
                onClick={() => setActive(sections[sections.findIndex((s) => s.id === active) - 1].id)}
                className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                {sections[sections.findIndex((s) => s.id === active) - 1].label}
              </button>
            ) : <span />}
            {sections.findIndex((s) => s.id === active) < sections.length - 1 ? (
              <button
                onClick={() => setActive(sections[sections.findIndex((s) => s.id === active) + 1].id)}
                className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-white transition-colors ml-auto"
              >
                {sections[sections.findIndex((s) => s.id === active) + 1].label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            ) : <span />}
          </div>
        </main>
      </div>

      <style jsx>{`
        .spec-card {
          background: linear-gradient(135deg, rgba(57,255,20,0.04) 0%, rgba(255,255,255,0.01) 100%), rgba(20,20,20,0.55);
          backdrop-filter: blur(20px);
        }
        .code-block {
          background: rgba(0,0,0,0.55);
          border: 1px solid rgba(57,255,20,0.12);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          font-size: 0.8rem;
          line-height: 1.7;
          overflow-x: auto;
          color: #c9f5a0;
          font-family: 'Geist Mono', 'Fira Code', monospace;
        }
        .code-inline {
          background: rgba(57,255,20,0.08);
          border: 1px solid rgba(57,255,20,0.15);
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 0.85em;
          color: #7dde50;
          font-family: 'Geist Mono', monospace;
        }
        .spec-table { border-collapse: collapse; }
        .spec-table th {
          text-align: left;
          padding: 8px 12px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-on-surface-variant);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .spec-table td {
          padding: 10px 12px;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #e5e5e5;
        }
        .spec-table tr:hover td { background: rgba(255,255,255,0.02); }
      `}</style>
    </div>
  );
}

