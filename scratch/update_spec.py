import sys

file_path = '/Users/cryptojoker710/Desktop/aix-format/apps/studio/src/app/spec/page.tsx'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_content = """  economy: {
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
"""

# Find line 314 (1-indexed) which is index 313
# We want to insert AFTER the closing brace of topology
# Looking at cat -n:
# 313	    ),
# 314	  },

# Insert after index 314 (which is the closing brace of topology object)
lines.insert(314, new_content)

with open(file_path, 'w') as f:
    f.writelines(lines)

print("Successfully inserted economy section.")
