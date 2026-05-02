# @aix-format/aix-zkkyc

Zero-Knowledge KYC verification module for AIX Format. Provides cryptographic proof verification using groth16 and replay attack prevention.

## Features

- **Real Cryptographic Verification**: Uses snarkjs groth16 for ZK proof verification
- **Replay Attack Prevention**: NullifierRegistry prevents proof reuse
- **Timestamp Validation**: Rejects expired proofs (configurable window)
- **Nullifier Format Validation**: Enforces 64-character hex string format
- **Comprehensive Error Handling**: Detailed error codes for debugging

## Installation

```bash
npm install @aix-format/aix-zkkyc
```

## Usage

### ProofVerifier

```typescript
import { ProofVerifier, NullifierRegistry, ZKProof } from '@aix-format/aix-zkkyc';

// Create registry for replay prevention (30 days TTL)
const registry = new NullifierRegistry(30 * 24 * 60 * 60 * 1000);

// Load your verification key
const verificationKey = {
  protocol: "groth16",
  curve: "bn128",
  // ... your verification key data
};

// Create verifier (5 minute proof expiry)
const verifier = new ProofVerifier(registry, verificationKey, 5 * 60 * 1000);

// Verify a proof
const proof: ZKProof = {
  proof: { /* groth16 proof object */ },
  publicSignals: ["12345"],
  nullifier: "a".repeat(64), // 64-char hex string
  timestamp: Date.now()
};

const result = await verifier.verify(proof);

if (result.valid) {
  console.log('Proof verified!', result.nullifier);
} else {
  console.error('Verification failed:', result.error, result.errorCode);
}
```

### API Endpoint

The package includes a Next.js API route at `/api/zkkyc/verify-proof`:

```typescript
// POST /api/zkkyc/verify-proof
{
  "proof": { /* groth16 proof */ },
  "publicSignals": ["12345"],
  "nullifier": "a".repeat(64),
  "timestamp": 1234567890
}

// Success Response (200)
{
  "success": true,
  "data": {
    "verified": true,
    "nullifier": "aaa...aaa",
    "timestamp": "2026-05-02T13:47:00.000Z"
  }
}

// Error Responses
// 400 - Invalid proof, expired, or invalid nullifier
// 409 - Replay attack detected
// 500 - Internal error
```

## Error Codes

- `INVALID_PROOF`: Cryptographic verification failed
- `REPLAY_ATTACK`: Proof has already been used
- `EXPIRED`: Proof timestamp is too old
- `INVALID_NULLIFIER`: Nullifier format is invalid

## Configuration

### Environment Variables

- `ZK_VERIFICATION_KEY`: JSON string of groth16 verification key
- `UPSTASH_REDIS_REST_URL`: Redis URL for distributed nullifier storage
- `UPSTASH_REDIS_REST_TOKEN`: Redis authentication token

### Proof Expiry

Default: 5 minutes. Configure via ProofVerifier constructor:

```typescript
const verifier = new ProofVerifier(
  registry,
  verificationKey,
  10 * 60 * 1000 // 10 minutes
);
```

### Nullifier TTL

Default: 30 days. Configure via NullifierRegistry constructor:

```typescript
const registry = new NullifierRegistry(
  60 * 24 * 60 * 60 * 1000 // 60 days
);
```

## Testing

```bash
npm test
```

Comprehensive test suite includes:
- Valid proof verification
- Invalid proof rejection
- Replay attack prevention
- Malformed input validation
- Timestamp expiry validation
- Error handling

## Security Considerations

1. **Verification Key**: Store securely, never commit to version control
2. **Nullifier Storage**: Use Redis for production to prevent replay across instances
3. **Timestamp Window**: Balance security vs. clock skew tolerance
4. **Logging**: Never log sensitive proof data or personal information

## Architecture

```
┌─────────────────┐
│   API Endpoint  │
│  verify-proof   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ProofVerifier   │
│  - Validates    │
│  - Verifies     │
│  - Registers    │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────┐
│snarkjs │ │  Nullifier   │
│groth16 │ │  Registry    │
└────────┘ └──────┬───────┘
                  │
            ┌─────┴─────┐
            ▼           ▼
        ┌────────┐  ┌───────┐
        │ Memory │  │ Redis │
        └────────┘  └───────┘
```

## License

Apache-2.0