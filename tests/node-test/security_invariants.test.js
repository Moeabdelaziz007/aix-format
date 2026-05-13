import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import { scanAgent } from '../core/abom-scanner.js';

test('Security Invariants: Low Risk Manifest', async (t) => {
  const content = await fs.readFile('tests/golden_manifests/low-risk.aix.json', 'utf8');
  const agent = JSON.parse(content);
  const report = scanAgent(agent);
  
  assert.strictEqual(report.grade, 'A');
  assert.ok(report.score >= 90);
  assert.strictEqual(report.risks.length, 0);
});

test('Security Invariants: Infra Agent MUST have Build Provenance', async (t) => {
  const content = await fs.readFile('tests/golden_manifests/high-risk-infra.aix.json', 'utf8');
  const agent = JSON.parse(content);
  
  // Test with provenance
  const reportWith = scanAgent(agent);
  assert.ok(reportWith.score >= 80);

  // Test without provenance
  const agentWithout = JSON.parse(content);
  delete agentWithout.abom.build_provenance;
  const reportWithout = scanAgent(agentWithout);
  
  const provenanceRisk = reportWithout.risks.find(r => r.message.includes('requires verified build_provenance'));
  assert.ok(provenanceRisk, 'Should have risk about missing provenance');
  assert.strictEqual(provenanceRisk.severity, 'critical');
});

test('Security Invariants: High Risk SaaS Compliance', async (t) => {
  const content = await fs.readFile('tests/golden_manifests/saas-heavy.aix.json', 'utf8');
  const agent = JSON.parse(content);
  agent.abom.risk_level = 'high'; // Force high risk
  
  // Test with compliant SaaS
  const reportWith = scanAgent(agent);
  assert.ok(!reportWith.risks.some(r => r.message.includes('compliance for all SaaS services')));

  // Test with non-compliant SaaS
  agent.abom.saas_services[0].compliance_tier = 'low';
  const reportWithout = scanAgent(agent);
  
  assert.ok(reportWithout.risks.some(r => r.message.includes('compliance for all SaaS services')), 'Should detect non-compliant SaaS for high risk');
});

test('Security Invariants: MCP requires Sandbox', async (t) => {
  const content = await fs.readFile('tests/golden_manifests/low-risk.aix.json', 'utf8');
  const agent = JSON.parse(content);
  
  agent.mcp = { endpoints: [{ uri: 'https://api.example.com' }] };
  agent.security.sandboxed = false;
  
  const report = scanAgent(agent);
  assert.ok(report.risks.some(r => r.message.includes('MCP usage requires mandatory sandboxing')));
});
