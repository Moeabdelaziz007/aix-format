/**
 * AIX Protocol Constants
 * Tracks supported versions and latest standards.
 */

export const SUPPORTED_VERSIONS = ["1.2.0", "1.3.0"] as const;
export const LATEST_VERSION = "1.3.0" as const;

export type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number];
