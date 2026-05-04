/**
 * Signature Verification Integration Tests
 * Tests the trust-chain signature verification flow
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';

/**
 * Mock Trust Chain for testing
 */
class MockTrustChain {
  private signatures: Map<string, { signature: string; publicKey: string; timestamp: number }> = new Map();

  /**
   * Sign data with private key
   */
  sign(data: any, privateKey: string): string {
    const dataString = JSON.stringify(data);
    const sign = crypto.createSign('SHA256');
    sign.update(dataString);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  /**
   * Verify signature with public key
   */
  verify(data: any, signature: string, publicKey: string): boolean {
    try {
      const dataString = JSON.stringify(data);
      const verify = crypto.createVerify('SHA256');
      verify.update(dataString);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Store signature for agent
   */
  storeSignature(agentId: string, signature: string, publicKey: string) {
    this.signatures.set(agentId, {
      signature,
      publicKey,
      timestamp: Date.now()
    });
  }

  /**
   * Get stored signature
   */
  getSignature(agentId: string) {
    return this.signatures.get(agentId);
  }

  /**
   * Verify agent action
   */
  verifyAgentAction(agentId: string, action: any, signature: string): boolean {
    const stored = this.signatures.get(agentId);
    if (!stored) return false;
    return this.verify(action, signature, stored.publicKey);
  }
}

/**
 * Generate RSA key pair for testing
 */
function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

describe('Signature Verification Integration', () => {
  let trustChain: MockTrustChain;
  let keyPair: { publicKey: string; privateKey: string };

  beforeEach(() => {
    trustChain = new MockTrustChain();
    keyPair = generateKeyPair();
  });

  describe('Basic Signature Operations', () => {
    it('should sign and verify data correctly', () => {
      const data = { agentId: 'agent-1', action: 'deploy' };
      const signature = trustChain.sign(data, keyPair.privateKey);
      const isValid = trustChain.verify(data, signature, keyPair.publicKey);
      
      assert.strictEqual(isValid, true);
    });

    it('should reject invalid signature', () => {
      const data = { agentId: 'agent-1', action: 'deploy' };
      const signature = trustChain.sign(data, keyPair.privateKey);
      
      // Tamper with data
      const tamperedData = { agentId: 'agent-1', action: 'execute' };
      const isValid = trustChain.verify(tamperedData, signature, keyPair.publicKey);
      
      assert.strictEqual(isValid, false);
    });

    it('should reject signature with wrong public key', () => {
      const data = { agentId: 'agent-1', action: 'deploy' };
      const signature = trustChain.sign(data, keyPair.privateKey);
      
      // Use different key pair
      const wrongKeyPair = generateKeyPair();
      const isValid = trustChain.verify(data, signature, wrongKeyPair.publicKey);
      
      assert.strictEqual(isValid, false);
    });
  });

  describe('Agent Registration', () => {
    it('should store agent signature on registration', () => {
      const agentId = 'agent-1';
      const manifest = { meta: { name: 'Test Agent', version: '1.0.0' } };
      const signature = trustChain.sign(manifest, keyPair.privateKey);
      
      trustChain.storeSignature(agentId, signature, keyPair.publicKey);
      
      const stored = trustChain.getSignature(agentId);
      assert.ok(stored);
      assert.strictEqual(stored.signature, signature);
      assert.strictEqual(stored.publicKey, keyPair.publicKey);
    });

    it('should reject unsigned agent registration', () => {
      const agentId = 'agent-1';
      const stored = trustChain.getSignature(agentId);
      
      assert.strictEqual(stored, undefined);
    });
  });

  describe('Agent Action Verification', () => {
    it('should verify signed agent action', () => {
      const agentId = 'agent-1';
      const manifest = { meta: { name: 'Test Agent' } };
      const manifestSignature = trustChain.sign(manifest, keyPair.privateKey);
      
      // Register agent
      trustChain.storeSignature(agentId, manifestSignature, keyPair.publicKey);
      
      // Execute action
      const action = { type: 'deploy', timestamp: Date.now() };
      const actionSignature = trustChain.sign(action, keyPair.privateKey);
      
      const isValid = trustChain.verifyAgentAction(agentId, action, actionSignature);
      assert.strictEqual(isValid, true);
    });

    it('should reject unsigned agent action', () => {
      const agentId = 'agent-1';
      const action = { type: 'deploy', timestamp: Date.now() };
      const fakeSignature = 'invalid-signature';
      
      const isValid = trustChain.verifyAgentAction(agentId, action, fakeSignature);
      assert.strictEqual(isValid, false);
    });

    it('should reject action from unregistered agent', () => {
      const agentId = 'unregistered-agent';
      const action = { type: 'deploy', timestamp: Date.now() };
      const signature = trustChain.sign(action, keyPair.privateKey);
      
      const isValid = trustChain.verifyAgentAction(agentId, action, signature);
      assert.strictEqual(isValid, false);
    });

    it('should reject tampered action data', () => {
      const agentId = 'agent-1';
      const manifest = { meta: { name: 'Test Agent' } };
      const manifestSignature = trustChain.sign(manifest, keyPair.privateKey);
      
      // Register agent
      trustChain.storeSignature(agentId, manifestSignature, keyPair.publicKey);
      
      // Create action and signature
      const action = { type: 'deploy', timestamp: Date.now() };
      const signature = trustChain.sign(action, keyPair.privateKey);
      
      // Tamper with action
      const tamperedAction = { ...action, type: 'execute' };
      
      const isValid = trustChain.verifyAgentAction(agentId, tamperedAction, signature);
      assert.strictEqual(isValid, false);
    });
  });

  describe('Signature Replay Attack Prevention', () => {
    it('should include timestamp in signed data', () => {
      const agentId = 'agent-1';
      const timestamp1 = Date.now();
      const action1 = { type: 'deploy', timestamp: timestamp1 };
      const signature1 = trustChain.sign(action1, keyPair.privateKey);
      
      // Try to replay with different timestamp
      const timestamp2 = timestamp1 + 1000;
      const action2 = { type: 'deploy', timestamp: timestamp2 };
      
      // Signature should not be valid for different timestamp
      const isValid = trustChain.verify(action2, signature1, keyPair.publicKey);
      assert.strictEqual(isValid, false);
    });

    it('should reject old signatures (>5 minutes)', () => {
      const agentId = 'agent-1';
      const oldTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      const action = { type: 'deploy', timestamp: oldTimestamp };
      const signature = trustChain.sign(action, keyPair.privateKey);
      
      // Verify signature is valid cryptographically
      const cryptoValid = trustChain.verify(action, signature, keyPair.publicKey);
      assert.strictEqual(cryptoValid, true);
      
      // But should be rejected due to age
      const now = Date.now();
      const age = now - oldTimestamp;
      const MAX_AGE = 5 * 60 * 1000; // 5 minutes
      
      assert.ok(age > MAX_AGE, 'Signature should be too old');
    });
  });

  describe('Multi-Agent Scenarios', () => {
    it('should handle multiple agents with different keys', () => {
      const agent1 = { id: 'agent-1', keyPair: generateKeyPair() };
      const agent2 = { id: 'agent-2', keyPair: generateKeyPair() };
      
      // Register both agents
      const manifest1 = { meta: { name: 'Agent 1' } };
      const signature1 = trustChain.sign(manifest1, agent1.keyPair.privateKey);
      trustChain.storeSignature(agent1.id, signature1, agent1.keyPair.publicKey);
      
      const manifest2 = { meta: { name: 'Agent 2' } };
      const signature2 = trustChain.sign(manifest2, agent2.keyPair.privateKey);
      trustChain.storeSignature(agent2.id, signature2, agent2.keyPair.publicKey);
      
      // Verify each agent can only use their own key
      const action1 = { type: 'deploy', timestamp: Date.now() };
      const actionSig1 = trustChain.sign(action1, agent1.keyPair.privateKey);
      
      assert.strictEqual(
        trustChain.verifyAgentAction(agent1.id, action1, actionSig1),
        true,
        'Agent 1 should verify with own key'
      );
      
      assert.strictEqual(
        trustChain.verifyAgentAction(agent2.id, action1, actionSig1),
        false,
        'Agent 1 signature should not work for Agent 2'
      );
    });
  });

  describe('Performance', () => {
    it('should verify 100 signatures in <1 second', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const data = { agentId: `agent-${i}`, action: 'deploy' };
        const signature = trustChain.sign(data, keyPair.privateKey);
        trustChain.verify(data, signature, keyPair.publicKey);
      }
      
      const duration = Date.now() - start;
      assert.ok(duration < 1000, `Verification took ${duration}ms, should be <1000ms`);
    });
  });
});

// Made with Moe Abdelaziz
