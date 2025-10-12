# AIX Manifest Specification v1.1

**Title:** AIX Manifest File Format - Detached Signature Architecture  
**Version:** 1.1  
**Status:** Stable  
**Date:** January 2025  
**Author:** Mohamed H Abdelaziz  
**Organization:** AMRIKYY AI Solutions  
**Contact:** amrikyy@gmail.com

---

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**  
Licensed under MIT with Attribution Requirements. See [LICENSE.md](../LICENSE.md)

---

## Abstract

This document specifies the AIX Manifest format, a detached signature architecture that separates content from cryptographic verification. This eliminates the circular dependency problem in v1.0 and enables multi-party signing, reproducible builds, and version chain verification.

---

## 1. Architecture Overview

### 1.1 Two-File System

AIX v1.1 uses a **detached manifest architecture**:

```
agent.aix          → Content file (pure agent definition)
agent.aix.manifest → Manifest file (hashes + signatures)
```

**Benefits:**
- ✅ **No Circular Dependencies**: Content hash calculated independently
- ✅ **Multi-Party Signing**: Multiple entities can sign the same content
- ✅ **Reproducible Builds**: Build environment tracked separately
- ✅ **Version Chains**: Link to previous versions for integrity
- ✅ **Offline Verification**: Manifest can be verified without re-computing

### 1.2 Content File (.aix)

The `.aix` file contains **only agent content**, with **NO security metadata**:

```yaml
aix_version: "1.1"

meta:
  id: "550e8400-e29b-41d4-a716-446655440001"
  name: "ResearchBot"
  version: "1.0.0"
  created: "2025-01-15T10:30:00Z"
  author: "Mohamed H Abdelaziz"

persona:
  role: "research assistant"
  instructions: "Help users with academic research tasks"

# ... skills, apis, mcp, memory sections ...
```

**Key Changes from v1.0:**
- ❌ **Removed**: `security` section
- ✅ **Added**: `aix_version` field at top level

### 1.3 Manifest File (.aix.manifest)

The `.aix.manifest` file contains **verification data only**:

```yaml
manifest_version: "1.0"
content_file: "agent.aix"

content_hash:
  algorithm: "SHA-256"
  value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  timestamp: "2025-01-15T10:30:00Z"

signatures:
  - signer: "Mohamed H Abdelaziz <amrikyy@gmail.com>"
    algorithm: "RSA-SHA256"
    public_key_fingerprint: "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8"
    signature_value: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
    timestamp: "2025-01-15T10:30:00Z"

integrity:
  previous_version_hash: null
  reproducible_build: true
```

---

## 2. Manifest File Structure

### 2.1 Required Fields

```yaml
manifest_version: string      # Manifest format version (e.g., "1.0")
content_file: string          # Name of the content file (e.g., "agent.aix")

content_hash:
  algorithm: string           # Hash algorithm (SHA-256, SHA-512, BLAKE3)
  value: string              # Hex-encoded hash of content file
  timestamp: string          # ISO 8601 timestamp when hash was calculated
```

### 2.2 Optional Fields

```yaml
signatures: array             # Array of digital signatures (see below)
integrity: object            # Build integrity metadata
encryption: object           # Encryption metadata (if content is encrypted)
metadata: object             # Additional manifest metadata
```

---

## 3. Signature Structure

### 3.1 Signature Format

Each signature in the `signatures` array has this structure:

```yaml
signer: string                      # Human-readable signer identity
algorithm: string                   # Signature algorithm
public_key_fingerprint: string      # SHA-256 hash of public key
signature_value: string             # Base64-encoded signature
timestamp: string                   # ISO 8601 signing timestamp
```

**Optional Fields:**

```yaml
public_key: string                  # Full public key (PEM format)
certificate_chain: array            # X.509 certificate chain
revocation_check:
  crl_url: string                  # Certificate Revocation List URL
  ocsp_url: string                 # OCSP responder URL
signing_context:
  location: string                 # Geographic location
  device: string                   # Signing device
  ip_address: string               # IP address (if applicable)
```

### 3.2 Supported Signature Algorithms

| Algorithm | Key Size | Security Level | Performance | Recommended |
|-----------|----------|----------------|-------------|-------------|
| RSA-SHA256 | 2048+ bits | High | Medium | ✅ Production |
| RSA-SHA512 | 4096 bits | Very High | Slow | ✅ High Security |
| Ed25519 | 256 bits | Very High | Fast | ✅ Modern Apps |
| ECDSA-SHA256 | 256+ bits | High | Fast | ✅ Compact |

---

## 4. Hash Calculation

### 4.1 Content Hash Algorithm

**Step-by-Step Process:**

1. **Read Content File**: Load entire `.aix` file
2. **Normalize**: Convert line endings to LF (`\n`)
3. **Trim**: Remove leading/trailing whitespace
4. **Hash**: Calculate using specified algorithm
5. **Encode**: Convert to lowercase hexadecimal

**Example (Python):**

```python
import hashlib

def calculate_content_hash(file_path, algorithm='sha256'):
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Normalize line endings
    content = content.replace(b'\r\n', b'\n')
    
    # Trim
    content = content.strip()
    
    # Hash
    hasher = hashlib.new(algorithm)
    hasher.update(content)
    
    return hasher.hexdigest()
```

**Example (Node.js):**

```javascript
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

function calculateContentHash(filePath, algorithm = 'sha256') {
  let content = readFileSync(filePath, 'utf8');
  
  // Normalize line endings
  content = content.replace(/\r\n/g, '\n');
  
  // Trim
  content = content.trim();
  
  // Hash
  return createHash(algorithm)
    .update(content, 'utf8')
    .digest('hex');
}
```

### 4.2 Verification Process

**To verify an AIX agent:**

1. **Read manifest** → Load `.aix.manifest`
2. **Calculate hash** → Hash the `.aix` file
3. **Compare** → Verify hash matches `content_hash.value`
4. **Verify signatures** → Check all digital signatures (optional but recommended)

**Exit Codes:**
- ✅ `0` - Verification successful
- ❌ `1` - Hash mismatch (content tampered)
- ❌ `2` - Signature invalid
- ❌ `3` - Manifest malformed

---

## 5. Multi-Party Signing

### 5.1 Chain of Trust

Multiple entities can sign the same agent:

```yaml
signatures:
  # Original author
  - signer: "Mohamed H Abdelaziz <amrikyy@gmail.com>"
    algorithm: "Ed25519"
    public_key_fingerprint: "SHA256:abc123..."
    signature_value: "..."
    timestamp: "2025-01-15T10:30:00Z"
  
  # Organization attestation
  - signer: "AMRIKYY AI Solutions <amrikyy@gmail.com>"
    algorithm: "RSA-SHA256"
    public_key_fingerprint: "SHA256:def456..."
    signature_value: "..."
    timestamp: "2025-01-15T10:35:00Z"
  
  # Third-party auditor
  - signer: "Security Audit Co <audit@example.com>"
    algorithm: "ECDSA-SHA256"
    public_key_fingerprint: "SHA256:ghi789..."
    signature_value: "..."
    timestamp: "2025-01-15T11:00:00Z"
```

**Use Cases:**
- **Author signs** → Proves who created it
- **Organization attests** → Official endorsement
- **Auditor verifies** → Security validation
- **Distributor signs** → Supply chain integrity

---

## 6. Integrity Metadata

### 6.1 Build Environment

Track the environment where the agent was created:

```yaml
integrity:
  reproducible_build: true
  
  build_environment:
    os: "linux"
    os_version: "Ubuntu 22.04"
    arch: "x86_64"
    aix_tools_version: "1.1.0"
    build_date: "2025-01-15T10:30:00Z"
    builder: "GitHub Actions"
    commit_sha: "abc123def456..."
  
  source:
    repository: "https://github.com/amrikyy/research-bot"
    branch: "main"
    commit: "abc123def456789..."
    tag: "v1.0.0"
```

### 6.2 Version Chain

Link to previous versions:

```yaml
integrity:
  version_chain:
    - version: "0.9.0"
      content_hash: "def456..."
      released: "2025-01-10T10:00:00Z"
    
    - version: "1.0.0"
      content_hash: "e3b0c4..."
      released: "2025-01-15T10:30:00Z"
  
  previous_version_hash: "def456..."
```

**Benefits:**
- Verify upgrade path
- Detect rollback attacks
- Track agent evolution

---

## 7. Encryption Support

### 7.1 Encrypted Content

If the `.aix` file is encrypted:

```yaml
encryption:
  encrypted: true
  algorithm: "AES-256-GCM"
  
  key_derivation:
    method: "PBKDF2-HMAC-SHA256"
    iterations: 600000
    salt: "base64-encoded-salt"
  
  symmetric_key:
    encrypted_with: "RSA-OAEP-256"
    recipient_fingerprints:
      - "SHA256:nThbg6kXUp..."
    encrypted_key: "base64-encoded-encrypted-key"
  
  iv: "base64-encoded-initialization-vector"
  auth_tag: "base64-encoded-authentication-tag"
```

**Note:** The `content_hash` is calculated on the **encrypted** content, not the plaintext.

---

## 8. Validation Rules

### 8.1 Manifest Validation

**Required Checks:**

1. ✅ `manifest_version` present and valid
2. ✅ `content_file` matches actual filename
3. ✅ `content_hash.algorithm` is supported
4. ✅ `content_hash.value` is valid hex string
5. ✅ `content_hash.value` length matches algorithm
6. ✅ All `signatures` have required fields
7. ✅ Timestamps are valid ISO 8601

**Optional Checks:**

8. ⚠️ Content hash matches actual file
9. ⚠️ Signatures verify correctly
10. ⚠️ Certificates are not revoked
11. ⚠️ Signing timestamps are reasonable

### 8.2 Security Validation

**Recommended Checks:**

```yaml
security_policy:
  require_signature: true
  minimum_signatures: 1
  
  trusted_signers:
    - "SHA256:nThbg6kXUp..."  # Only accept these keys
  
  signature_max_age_days: 365
  
  allowed_algorithms:
    hash: ["SHA-256", "SHA-512"]
    signature: ["RSA-SHA256", "Ed25519"]
```

---

## 9. CLI Tools

### 9.1 Generate Manifest

```bash
aix-manifest create agent.aix \
  --output agent.aix.manifest \
  --algorithm SHA-256 \
  --sign-with ~/.ssh/id_ed25519
```

### 9.2 Verify Manifest

```bash
aix-manifest verify agent.aix agent.aix.manifest \
  --check-signatures \
  --trusted-keys trusted_keys.txt
```

### 9.3 Add Signature

```bash
aix-manifest sign agent.aix.manifest \
  --key ~/.ssh/id_rsa \
  --signer "Company Name <company@example.com>"
```

---

## 10. Migration from v1.0

### 10.1 Conversion Process

**For v1.0 AIX files:**

1. **Remove security section** from `.aix` file
2. **Add `aix_version: "1.1"`** to top of file
3. **Calculate content hash**
4. **Create manifest file** with hash
5. **Sign manifest** (optional)

**Automated Tool:**

```bash
aix-convert v1.0-to-v1.1 old-agent.aix \
  --output agent.aix \
  --manifest agent.aix.manifest \
  --sign-with ~/.ssh/id_ed25519
```

### 10.2 Backward Compatibility

**Parser Behavior:**

- v1.1 parser **can read** v1.0 files (with warnings)
- v1.0 parser **cannot read** v1.1 files (different structure)

**Recommendation:** Upgrade to v1.1 for production deployments.

---

## 11. Examples

### 11.1 Minimal Manifest

```yaml
manifest_version: "1.0"
content_file: "simple-agent.aix"

content_hash:
  algorithm: "SHA-256"
  value: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  timestamp: "2025-01-15T10:30:00Z"
```

### 11.2 Signed Manifest

```yaml
manifest_version: "1.0"
content_file: "signed-agent.aix"

content_hash:
  algorithm: "SHA-256"
  value: "a1b2c3d4e5f6..."
  timestamp: "2025-01-15T10:30:00Z"

signatures:
  - signer: "Mohamed H Abdelaziz <amrikyy@gmail.com>"
    algorithm: "Ed25519"
    public_key_fingerprint: "SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8"
    signature_value: "aGVsbG8gd29ybGQgdGhpcyBpcyBhIHNpZ25hdHVyZQ=="
    timestamp: "2025-01-15T10:30:00Z"
```

### 11.3 Enterprise Manifest

```yaml
manifest_version: "1.0"
content_file: "enterprise-agent.aix"

content_hash:
  algorithm: "SHA-512"
  value: "abc123def456..."
  timestamp: "2025-01-15T10:30:00Z"

signatures:
  - signer: "Mohamed H Abdelaziz <amrikyy@gmail.com>"
    algorithm: "Ed25519"
    public_key_fingerprint: "SHA256:author_key_fp"
    signature_value: "..."
    timestamp: "2025-01-15T10:30:00Z"
  
  - signer: "AMRIKYY AI Solutions <amrikyy@gmail.com>"
    algorithm: "RSA-SHA256"
    public_key_fingerprint: "SHA256:org_key_fp"
    signature_value: "..."
    timestamp: "2025-01-15T10:35:00Z"
    certificate_chain:
      - "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"

integrity:
  previous_version_hash: "def456789abc..."
  reproducible_build: true
  build_environment:
    os: "linux"
    arch: "x86_64"
    aix_tools_version: "1.1.0"
  version_chain:
    - version: "1.0.0"
      content_hash: "abc123..."
      released: "2025-01-15T10:30:00Z"

metadata:
  generator: "aix-cli/1.1.0"
  created_by: "GitHub Actions"
  build_id: "run-12345"
```

---

## 12. Security Considerations

### 12.1 Threat Model

**Threats Mitigated:**

✅ **Tampering**: Content hash detects modifications  
✅ **Spoofing**: Signatures prove authorship  
✅ **Replay**: Timestamps prevent old versions  
✅ **Supply Chain**: Multi-party signing builds trust

**Threats Not Covered:**

⚠️ **Revocation**: Need CRL/OCSP for key revocation  
⚠️ **Key Compromise**: Signatures valid until key revoked  
⚠️ **Timing Attacks**: Signatures don't prevent timing leaks

### 12.2 Best Practices

1. **Always verify signatures** in production
2. **Use hardware security modules** (HSMs) for signing keys
3. **Rotate keys annually**
4. **Maintain revocation lists**
5. **Use strong algorithms** (Ed25519 or RSA-4096)
6. **Timestamp all operations**
7. **Audit signature chains** regularly

---

## 13. Standards Compliance

This specification aligns with:

- **RFC 4880**: OpenPGP Message Format (detached signatures)
- **RFC 5280**: X.509 Certificate and CRL Profile
- **NIST SP 800-57**: Key Management Guidelines
- **NIST SP 800-131A**: Cryptographic Algorithms
- **ISO/IEC 27001**: Information Security Management

---

## Appendix A: Algorithm Specifications

### SHA-256
- **Output Size**: 256 bits (64 hex characters)
- **Security**: 128-bit security level
- **Performance**: ~500 MB/s

### SHA-512
- **Output Size**: 512 bits (128 hex characters)
- **Security**: 256-bit security level
- **Performance**: ~600 MB/s (64-bit systems)

### BLAKE3
- **Output Size**: 256 bits (configurable)
- **Security**: 128-bit security level
- **Performance**: ~3000 MB/s (highly optimized)

---

**End of Manifest Specification**

For questions: amrikyy@gmail.com

**Copyright © 2025 Mohamed H Abdelaziz / AMRIKYY AI Solutions**

