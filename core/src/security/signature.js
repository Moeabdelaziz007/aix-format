import crypto from 'crypto';
import { canonicalizeForSigning } from '../../canonicalize.js';

function ensureEd25519PrivateKey(privateKeyPem) {
  const keyObj = crypto.createPrivateKey(privateKeyPem);
  if (keyObj.asymmetricKeyType !== 'ed25519') {
    throw new Error(`Invalid private key type: ${keyObj.asymmetricKeyType}. Expected ed25519`);
  }
  return keyObj;
}

function ensureEd25519PublicKey(publicKeyPem) {
  const keyObj = crypto.createPublicKey(publicKeyPem);
  if (keyObj.asymmetricKeyType !== 'ed25519') {
    throw new Error(`Invalid public key type: ${keyObj.asymmetricKeyType}. Expected ed25519`);
  }
  return keyObj;
}

export function signManifest(manifest, privateKeyPem, kid = 'local-ed25519') {
  const privateKey = ensureEd25519PrivateKey(privateKeyPem);
  const { canonicalString, bytes } = canonicalizeForSigning(manifest);
  const checksum = crypto.createHash('sha256').update(bytes).digest('hex');
  const signature = crypto.sign(null, bytes, privateKey).toString('base64');

  return { canonicalString, checksum, signature: { algorithm: 'ed25519', kid, value: signature } };
}


export function verifyManifest(manifest, publicKeyPem) {
  const publicKey = ensureEd25519PublicKey(publicKeyPem);
  const security = manifest?.security || {};
  const declaredChecksum = security?.checksum?.value;
  const declaredAlgorithm = security?.checksum?.algorithm || 'sha256';
  const sig = security?.signature;

  if (!sig?.value || sig?.algorithm !== 'ed25519') {
    return { ok: false, checksumValid: false, signatureValid: false, reason: 'Missing or invalid security.signature' };
  }

  // Verification for build_provenance
  if (manifest.build_provenance) {
    if (manifest.build_provenance.slsa_level >= 2 && !manifest.build_provenance.builder_signature) {
      return { ok: false, checksumValid: false, signatureValid: false, reason: 'Missing builder_signature in build_provenance' };
    }

    if (manifest.build_provenance.builder_signature) {
      const isProvValid = verifyBuildProvenance(manifest.build_provenance, manifest.build_provenance.builder_signature, publicKeyPem);
      if (!isProvValid) {
        return { ok: false, checksumValid: false, signatureValid: false, reason: 'Invalid builder_signature in build_provenance' };
      }
    }
  }

  const { bytes } = canonicalizeForSigning(manifest);

  const calculatedChecksum = crypto.createHash(declaredAlgorithm).update(bytes).digest('hex');
  const checksumValid = declaredChecksum === calculatedChecksum;
  const signatureValid = crypto.verify(null, bytes, publicKey, Buffer.from(sig.value, 'base64'));

  return { ok: checksumValid && signatureValid, checksumValid, signatureValid, calculatedChecksum, declaredChecksum, kid: sig.kid || null };
}


export function signBuildProvenance(provenanceData, privateKeyPem) {
  const privateKey = ensureEd25519PrivateKey(privateKeyPem);
  // Ensure we sort keys and stringify so it's deterministic
  const str = JSON.stringify({
    builder: provenanceData.builder,
    source_commit: provenanceData.source_commit,
    source_repo: provenanceData.source_repo,
    build_timestamp: provenanceData.build_timestamp
  });
  const bytes = Buffer.from(str, 'utf8');
  return crypto.sign(null, bytes, privateKey).toString('base64');
}

export function verifyBuildProvenance(provenanceData, signature, publicKeyPem) {
  const publicKey = ensureEd25519PublicKey(publicKeyPem);
  const str = JSON.stringify({
    builder: provenanceData.builder,
    source_commit: provenanceData.source_commit,
    source_repo: provenanceData.source_repo,
    build_timestamp: provenanceData.build_timestamp
  });
  const bytes = Buffer.from(str, 'utf8');
  return crypto.verify(null, bytes, publicKey, Buffer.from(signature, 'base64'));
}
