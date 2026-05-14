/**
 * Pi Network environment configuration (server-only).
 * Centralises all Pi-related environment variables.
 */

export interface PiEnv {
  /** Pi Platform API key (Pi Developer Portal). */
  apiKey: string;
  /** Optional Stellar-format wallet seed for server-side payments. */
  walletPrivateSeed: string;
  /** Route via sandbox network when true. */
  sandbox: boolean;
  /** Base URL of the deployed app. */
  siteUrl: string;
}

let cached: PiEnv | null = null;

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `[@axiom/pi] Missing required env var: ${name}. ` +
        `Set it in .env.local or Vercel project settings.`
    );
  }
  return value;
}

function readOptional(name: string, fallback = ""): string {
  const raw = process.env[name];
  return raw == null ? fallback : raw.trim();
}

/**
 * Returns the Pi environment for this process.
 * Throws at boot if PI_API_KEY is missing.
 */
export function getPiEnv(): PiEnv {
  if (cached) return cached;

  cached = {
    apiKey: readRequired("PI_API_KEY"),
    walletPrivateSeed: readOptional("PI_WALLET_PRIVATE_SEED"),
    sandbox: readOptional("NEXT_PUBLIC_PI_SANDBOX", "false") === "true",
    siteUrl: readOptional("NEXT_PUBLIC_SITE_URL", "https://axiomid.app"),
  };

  return cached;
}

/** Clear cached env (test helper). */
export function __resetPiEnvCache(): void {
  cached = null;
}
