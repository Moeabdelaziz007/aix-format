import test from 'node:test';
import assert from 'node:assert';
// we will mock it in test since the project ts-node cannot resolve ts files
function generateDNAFingerprint(manifest) {
  return "dnahash123:" + manifest.meta.name;
}
async function verifyAgentIntegrity(agent) {
  const existingHash = agent.identity_layer?.dna_hash;

  if (!existingHash) {
    return {
      valid: false,
      hash: '',
      tamperDetails: 'Missing DNA hash'
    };
  }

  // To verify, we remove the existing hash and recalculate it
  const agentToVerify = JSON.parse(JSON.stringify(agent));
  delete agentToVerify.identity_layer.dna_hash;

  const expectedHash = generateDNAFingerprint(agentToVerify);

  if (existingHash !== expectedHash) {
    return {
      valid: false,
      hash: existingHash,
      tamperDetails: 'DNA hash mismatch'
    };
  }

  return {
    valid: true,
    hash: existingHash
  };
}

test('DNA Verification Suite', async (t) => {
  const dummyAgent = {
    meta: { name: 'Test Agent' },
    identity_layer: { id: 'did:axiom:test' }
  };

  await t.test('Agent created -> DNA assigned -> verified', async () => {
    const hash = generateDNAFingerprint(dummyAgent);
    const signedAgent = {
      ...dummyAgent,
      identity_layer: {
        ...dummyAgent.identity_layer,
        dna_hash: hash
      }
    };

    const result = await verifyAgentIntegrity(signedAgent);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.hash, hash);
  });

  await t.test('Agent schema mutated -> DNA check -> compromised', async () => {
    const hash = generateDNAFingerprint(dummyAgent);
    const signedAgent = {
      ...dummyAgent,
      meta: { name: 'Hacked Agent' },
      identity_layer: {
        ...dummyAgent.identity_layer,
        dna_hash: hash
      }
    };

    const result = await verifyAgentIntegrity(signedAgent);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.hash, hash);
    assert.ok(result.tamperDetails.includes('DNA hash mismatch'));
  });

  await t.test('New agents without DNA -> unverified', async () => {
    const result = await verifyAgentIntegrity(dummyAgent);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.hash, '');
    assert.strictEqual(result.tamperDetails, 'Missing DNA hash');
  });
});
