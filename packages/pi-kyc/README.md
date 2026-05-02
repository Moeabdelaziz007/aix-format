# Pi Network KYC Integration

Comprehensive Pi Network authentication and KYC verification for the AIX Sovereign ecosystem.

## Features

- **Pi Network Authentication**: Secure Ed25519 signature verification
- **KYC Identity Generation**: Privacy-preserving DID generation with salted UID hashing
- **Multi-layer Validation**: JWT expiry, algorithm enforcement, assurance level policies
- **Blockchain Anchoring**: Optional on-chain verification anchoring
- **VLA Device Registry**: Hardware-backed identity verification
- **E2E Test Coverage**: 60+ comprehensive tests covering all flows

## Installation

```bash
npm install @aix/pi-kyc
```

## Quick Start

### Basic Authentication

```typescript
import { PiKycAdapter } from '@aix/pi-kyc';

const piAuthResult = {
  user: { uid: 'pi_user_12345' },
  accessToken: 'eyJhbGc...',
  signature: 'base64_signature',
  publicKey: 'base64_public_key'
};

const { identity_layer, kyc_proof } = PiKycAdapter.generateIdentity(piAuthResult);

console.log(identity_layer.id); // did:axiom:axiomid.app:abc123...
console.log(kyc_proof.assurance_level); // 'substantial'
```

### Advanced Configuration

```typescript
const options = {
  uidSalt: 'production_salt',
  challengeNonce: 'challenge_123',
  assuranceLevel: 'high',
  minAssuranceLevel: 'substantial',
  enforceJwtExpiry: true,
  enforceJwtAlg: true,
  allowedJwtAlgs: ['EdDSA'],
  blockchainAnchor: {
    chain: 'pi-mainnet',
    txid: '0xabcdef123456',
    blockHeight: 54321
  }
};

const result = PiKycAdapter.generateIdentity(piAuthResult, options);
```

## E2E Test Suite

Run comprehensive tests covering all Pi Network integration flows:

```bash
npm test
```

### Test Coverage (60+ tests)

**Authentication Flow:**
- ✅ Valid Pi credentials authentication
- ✅ Missing user.uid rejection
- ✅ Missing accessToken rejection
- ✅ Missing signature rejection
- ✅ Missing publicKey rejection
- ✅ Invalid signature rejection
- ✅ Tampered accessToken detection

**KYC Identity Generation:**
- ✅ Valid DID generation
- ✅ Public key fingerprint generation
- ✅ Custom DID methods support
- ✅ Unique DIDs for different users

**KYC Proof Generation:**
- ✅ All required fields present
- ✅ Different assurance levels
- ✅ Assurance level policy enforcement
- ✅ Challenge binding inclusion
- ✅ Salted UID hash marking

**Blockchain Anchoring:**
- ✅ Valid anchor inclusion
- ✅ Invalid anchor rejection
- ✅ Anchor hash generation

**VLA Device Registry:**
- ✅ Device info inclusion
- ✅ Missing device graceful handling

**JWT Validation:**
- ✅ Expired JWT rejection
- ✅ Not-yet-active JWT rejection
- ✅ Invalid algorithm rejection

**Privacy & Security:**
- ✅ UID hashing for privacy
- ✅ Different salts produce different hashes
- ✅ Access token hashing
- ✅ Base64 validation (strict)

**Edge Cases:**
- ✅ Very long UIDs handling
- ✅ Excessively long UIDs rejection
- ✅ Whitespace in UID handling
- ✅ Whitespace in token handling
- ✅ Malformed signature payload rejection
- ✅ Wrong public key size rejection

**Integration Scenarios:**
- ✅ Full E2E flow with all features
- ✅ Consistency across multiple calls

## License

Apache-2.0 - Mohamed Abdelaziz / AMRIKYY AI Solutions 2026
