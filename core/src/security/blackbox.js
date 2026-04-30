import crypto from 'crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export function signLogEntry(action, details, privateKeyPem) {
  const timestamp = new Date().toISOString();

  const payload = {
    timestamp,
    action,
    details
  };

  // Canonicalize string to make hashing deterministic
  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
  const bytes = Buffer.from(canonicalString, 'utf8');

  const privateKey = crypto.createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    throw new Error(`Invalid private key type: ${privateKey.asymmetricKeyType}. Expected ed25519`);
  }

  const signature = crypto.sign(null, bytes, privateKey).toString('base64');

  return {
    ...payload,
    signature: {
      algorithm: 'ed25519',
      value: signature
    }
  };
}

export function verifyLogEntry(entry, publicKeyPem) {
  const { signature, ...payload } = entry;

  if (!signature || !signature.value) {
    return false;
  }

  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
  const bytes = Buffer.from(canonicalString, 'utf8');

  try {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    if (publicKey.asymmetricKeyType !== 'ed25519') {
       return false;
    }

    return crypto.verify(null, bytes, publicKey, Buffer.from(signature.value, 'base64'));
  } catch (error) {
    return false;
  }
}
