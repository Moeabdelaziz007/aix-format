import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PiKycAdapter } from '../core/pi_kyc_adapter';
import { AIXParser } from '../core/parser.js';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

describe('PiKycAdapter Unit Tests', () => {
  it('generates valid DID and identity layer from valid Pi auth result', () => {
    // 1. Generate a mock keypair
    const keypair = nacl.sign.keyPair();
    const mockUid = 'user_12345';
    const mockAccessToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.token';

    // 2. Sign the token
    const messageUint8 = naclUtil.decodeUTF8(mockAccessToken);
    const signatureUint8 = nacl.sign.detached(messageUint8, keypair.secretKey);

    // 3. Prepare the payload
    const authResult = {
      user: { uid: mockUid },
      accessToken: mockAccessToken,
      signature: naclUtil.encodeBase64(signatureUint8),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    };

    // 4. Generate identity
    const result = PiKycAdapter.generateIdentity(authResult);

    assert.ok(result.identity_layer, 'Should generate identity_layer');
    assert.ok(result.kyc_proof, 'Should generate kyc_proof');

    assert.strictEqual(result.identity_layer.authority, 'axiomid.app');
    assert.ok(result.identity_layer.id.startsWith('did:axiom:axiomid.app:'));
    assert.strictEqual(result.identity_layer.publicKey.algorithm, 'Ed25519');
    assert.strictEqual(result.identity_layer.publicKey.value, authResult.publicKey);

    assert.strictEqual(result.kyc_proof.provider, 'pi_network');
    assert.ok(result.kyc_proof.uid_hash);
    assert.ok(result.kyc_proof.access_token_hash);
  });



  it('rejects malformed base64 signature/public key payloads', () => {
    const authResult = {
      user: { uid: 'user_12345' },
      accessToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.token',
      signature: '@@not_base64@@',
      publicKey: '@@not_base64@@'
    };

    assert.throws(
      () => PiKycAdapter.generateIdentity(authResult),
      /valid base64/
    );
  });
  it('rejects invalid signature', () => {
    const keypair = nacl.sign.keyPair();
    const wrongKeypair = nacl.sign.keyPair(); // Different keypair
    const mockUid = 'user_12345';
    const mockAccessToken = 'this_is_a_sufficiently_long_token_string';

    const messageUint8 = naclUtil.decodeUTF8(mockAccessToken);
    // Sign with WRONG secret key
    const signatureUint8 = nacl.sign.detached(messageUint8, wrongKeypair.secretKey);

    const authResult = {
      user: { uid: mockUid },
      accessToken: mockAccessToken,
      signature: naclUtil.encodeBase64(signatureUint8),
      // Pass the right public key, but the signature doesn't match this public key
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    };

    assert.throws(
      () => PiKycAdapter.generateIdentity(authResult),
      /Invalid signature/
    );
  });
});



  it('supports did:web mode and adds security metadata fields', () => {
    const keypair = nacl.sign.keyPair();
    const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.token';
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(token), keypair.secretKey);

    const result = PiKycAdapter.generateIdentity({
      user: { uid: 'web_user_1' },
      accessToken: token,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    }, { didMethod: 'did:web', didAuthority: 'example.com', challengeNonce: 'nonce-123', uidSalt: 'salt-1' });

    assert.ok(result.identity_layer.id.startsWith('did:web:example.com:'));
    assert.equal(result.kyc_proof.version, '2.0');
    assert.equal(result.kyc_proof.uid_hash_salted, true);
    assert.ok(result.kyc_proof.challenge_binding_hash);
    assert.ok(result.identity_layer.publicKey.fingerprint);
  });

  it('rejects expired JWT when expiry enforcement is enabled', () => {
    const keypair = nacl.sign.keyPair();
    const payload = Buffer.from(JSON.stringify({ exp: 1 }), 'utf8').toString('base64url');
    const token = `a.${payload}.c`;
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(token), keypair.secretKey);

    assert.throws(() => PiKycAdapter.generateIdentity({
      user: { uid: 'jwt_user' },
      accessToken: token,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    }, { enforceJwtExpiry: true }), /expired/);
  });


  it('rejects disallowed JWT algorithm when enforceJwtAlg is enabled', () => {
    const keypair = nacl.sign.keyPair();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8').toString('base64url');
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000)+3600 }), 'utf8').toString('base64url');
    const token = `${header}.${payload}.x`;
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(token), keypair.secretKey);

    assert.throws(() => PiKycAdapter.generateIdentity({
      user: { uid: 'alg_user' },
      accessToken: token,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    }, { enforceJwtAlg: true, allowedJwtAlgs: ['EdDSA'] }), /not allowed/);
  });

  it('adds blockchain anchor proof metadata when configured', () => {
    const keypair = nacl.sign.keyPair();
    const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.token';
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(token), keypair.secretKey);
    const res = PiKycAdapter.generateIdentity({
      user: { uid: 'chain_user' },
      accessToken: token,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    }, { blockchainAnchor: { chain: 'pi-mainnet', txid: '0xabc123', blockHeight: 12345 } });

    assert.ok(res.kyc_proof.blockchain_anchor);
    assert.equal(res.kyc_proof.blockchain_anchor.chain, 'pi-mainnet');
    assert.ok(res.kyc_proof.blockchain_anchor.anchor_hash);
  });

  it('enforces minimum assurance level policy', () => {
    const keypair = nacl.sign.keyPair();
    const token = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.token';
    const signature = nacl.sign.detached(naclUtil.decodeUTF8(token), keypair.secretKey);

    assert.throws(() => PiKycAdapter.generateIdentity({
      user: { uid: 'assurance_user' },
      accessToken: token,
      signature: naclUtil.encodeBase64(signature),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    }, { assuranceLevel: 'low', minAssuranceLevel: 'substantial' }), /Insufficient assurance level/);
  });
describe('PiKycAdapter Integration', () => {
  it('full flow: mock Pi proof produces schema-valid identity_layer', () => {
    // 1. Mock Pi Auth
    const keypair = nacl.sign.keyPair();
    const authResult = {
      user: { uid: 'real_pi_user_999' },
      accessToken: 'pi_access_token_data',
      signature: naclUtil.encodeBase64(
        nacl.sign.detached(naclUtil.decodeUTF8('pi_access_token_data'), keypair.secretKey)
      ),
      publicKey: naclUtil.encodeBase64(keypair.publicKey)
    };

    const { identity_layer, kyc_proof } = PiKycAdapter.generateIdentity(authResult);

    // 2. Mock AIX file content
    const aixData = {
      meta: {
        version: "1.0",
        id: "did:axiom:axiomid.app:550e8400-e29b-41d4-a716-446655440000",
        name: "Test Agent",
        created: "2024-04-26T10:30:00Z",
        author: "Tester"
      },
      persona: {
        role: "test",
        instructions: "test instructions"
      },
      security: {
        checksum: {
          algorithm: "sha256",
          value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // dummy hash
        }
      },
      identity_layer,
      kyc_proof // Added next to identity_layer
    };

    // 3. Test validation using parser
    const parser = new AIXParser();
    // We expect parse to not throw an error since all required fields are provided
    const agent = parser.parse(JSON.stringify(aixData), 'test.json');

    assert.ok(agent, 'Agent should be successfully created');
    assert.strictEqual(parser.errors.length, 0);
  });
});
