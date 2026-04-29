import crypto from 'crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export class PiKycAdapter {
  /**
   * Verify Pi KYC proof and generate an identity layer and KYC proof.
   */
  static generateIdentity(piAuthResult, options = {}) {
    const { user, accessToken, signature, publicKey } = piAuthResult;

    if (!user || !user.uid) {
      throw new Error('Invalid Pi Auth Result: Missing user.uid');
    }

    if (!accessToken || !signature || !publicKey) {
      throw new Error('Invalid Pi Auth Result: Missing token, signature, or public key');
    }

    if (typeof user.uid !== 'string' || user.uid.length < 3 || user.uid.length > 256) {
      throw new Error('Invalid Pi Auth Result: user.uid must be a non-empty string');
    }

    if (typeof accessToken !== 'string' || accessToken.length < 10 || accessToken.length > 8192) {
      throw new Error('Invalid Pi Auth Result: accessToken length is out of allowed bounds');
    }

    if (!PiKycAdapter.isValidBase64(signature) || !PiKycAdapter.isValidBase64(publicKey)) {
      throw new Error('Invalid Pi Auth Result: signature/publicKey must be valid base64');
    }

    // Verify the signature
    let isValid = false;
    try {
      const messageUint8 = naclUtil.decodeUTF8(accessToken);
      const signatureUint8 = naclUtil.decodeBase64(signature);
      const publicKeyUint8 = naclUtil.decodeBase64(publicKey);

      if (publicKeyUint8.length !== nacl.sign.publicKeyLength) {
        throw new Error('Invalid public key size');
      }
      if (signatureUint8.length !== nacl.sign.signatureLength) {
        throw new Error('Invalid signature size');
      }

      isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
    } catch (error) {
      throw new Error('Signature verification failed: malformed signature payload');
    }

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const normalizedUid = user.uid.trim();
    const normalizedToken = accessToken.trim();

    PiKycAdapter.validateJwtTimestamps(normalizedToken, options);

    // Generate privacy-preserving UID hash (salted when configured)
    const uidSalt = options.uidSalt || process.env.AIX_UID_HASH_SALT || '';
    const uidHash = crypto.createHash('sha256').update(`${normalizedUid}:${uidSalt}`).digest('hex').slice(0, 32);

    // Generate SHA-256 hash of the access token and optional challenge binding
    const accessTokenHash = crypto.createHash('sha256').update(normalizedToken).digest('hex');
    const challengeBinding = options.challengeNonce
      ? crypto.createHash('sha256').update(`${normalizedToken}:${options.challengeNonce}`).digest('hex')
      : undefined;

    const didMethod = options.didMethod || 'did:axiom';
    const didAuthority = options.didAuthority || 'axiomid.app';
    const did = PiKycAdapter.buildDid(didMethod, didAuthority, uidHash);
    const timestamp = new Date().toISOString();

    const identity_layer = {
      id: did,
      authority: didAuthority,
      issuedAt: timestamp,
      publicKey: {
        algorithm: "Ed25519",
        value: publicKey,
        encoding: "base64",
        fingerprint: crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16)
      }
    };

        const kyc_proof = {
      version: '2.0',
      provider: "pi_network",
      assurance_level: options.assuranceLevel || 'substantial',
      uid_hash: uidHash,
      uid_hash_algorithm: 'sha256',
      uid_hash_salted: Boolean(uidSalt),
      verified_at: timestamp,
      access_token_hash: accessTokenHash,
      challenge_binding_hash: challengeBinding
    };

    if (piAuthResult.vlaDevice) {
      kyc_proof.vla_device_registry = {
        adapter: piAuthResult.vlaDevice.adapter || 'generic',
        hardware_id: piAuthResult.vlaDevice.id || 'unknown'
      };
    }

return { identity_layer, kyc_proof };
  }

  static buildDid(method, authority, subject) {
    if (method === 'did:web') return `did:web:${authority}:${subject}`;
    return `${method}:${authority}:${subject}`;
  }

  static validateJwtTimestamps(token, options = {}) {
    if (!options.enforceJwtExpiry) return;
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid Pi Auth Result: JWT format required when enforceJwtExpiry is enabled');

    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === 'number' && payload.exp < now) {
        throw new Error('JWT has expired');
      }
      if (typeof payload.nbf === 'number' && payload.nbf > now + 60) {
        throw new Error('JWT not active yet');
      }
    } catch (err) {
      if (err.message === 'JWT has expired' || err.message === 'JWT not active yet') throw err;
      throw new Error('Invalid Pi Auth Result: unable to parse JWT payload timestamps');
    }
  }

  static isValidBase64(value) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 4096) return false;
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
  }
}
