import crypto from 'crypto';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export class PiKycAdapter {
  /**
   * Verify Pi KYC proof and generate an identity layer and KYC proof.
   */
  static generateIdentity(piAuthResult) {
    const { user, accessToken, signature, publicKey } = piAuthResult;

    if (!user || !user.uid) {
      throw new Error('Invalid Pi Auth Result: Missing user.uid');
    }

    if (!accessToken || !signature || !publicKey) {
      throw new Error('Invalid Pi Auth Result: Missing token, signature, or public key');
    }

    // Verify the signature
    let isValid = false;
    try {
      const messageUint8 = naclUtil.decodeUTF8(accessToken);
      const signatureUint8 = naclUtil.decodeBase64(signature);
      const publicKeyUint8 = naclUtil.decodeBase64(publicKey);

      isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
    } catch (error) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Generate SHA-256 hash of the UID
    const uidHash = crypto.createHash('sha256').update(user.uid).digest('hex').slice(0, 32);

    // Generate SHA-256 hash of the accessToken
    const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');

    const did = `did:web:axiomid.app:${uidHash}`;
    const timestamp = new Date().toISOString();

    const identity_layer = {
      id: did,
      authority: "axiomid.app",
      issuedAt: timestamp,
      publicKey: {
        algorithm: "Ed25519",
        value: publicKey,
        encoding: "base64"
      }
    };

        const kyc_proof = {
      provider: "pi_network",
      uid_hash: uidHash,
      verified_at: timestamp,
      access_token_hash: accessTokenHash
    };

    if (piAuthResult.vlaDevice) {
      kyc_proof.vla_device_registry = {
        adapter: piAuthResult.vlaDevice.adapter || 'generic',
        hardware_id: piAuthResult.vlaDevice.id || 'unknown'
      };
    }

return { identity_layer, kyc_proof };
  }
}
