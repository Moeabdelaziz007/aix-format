import { AgentManifestSchema } from '../domain';

/**
 * MissionValidator
 * Actually validates mission/agent manifest structure using Zod schemas.
 */
export class MissionValidator {
  /**
   * Validates an agent manifest.
   * @param manifest - The agent manifest object to validate.
   * @returns boolean - True if valid, throws error if invalid.
   */
  static async validate(manifest: any): Promise<boolean> {
    try {
      if (!manifest) throw new Error('Manifest is null or undefined');
      AgentManifestSchema.parse(manifest);
      return true;
    } catch (error: any) {
      console.error('[MissionValidator] Validation failed:', error.errors || error.message);
      throw new Error(`Protocol Compliance Failure: ${error.message}`);
    }
  }

  /**
   * Performs a deeper semantic validation.
   */
  static async verifyAlignment(manifest: any): Promise<{ aligned: boolean; score: number }> {
    // Basic alignment logic: check for persona and identity fields
    const hasPersona = !!manifest.persona;
    const hasIdentity = !!manifest.identity_layer;
    const score = (hasPersona ? 50 : 0) + (hasIdentity ? 50 : 0);

    return {
      aligned: score >= 50,
      score
    };
  }
}
