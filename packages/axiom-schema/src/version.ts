/**
 * 📌 Pinned AIX format version constants.
 *
 * The JSON schema and TypeScript surface in this package target a
 * specific AIX format version. Consumers should pin against these
 * constants instead of re-typing literal strings, so a future
 * version bump propagates atomically.
 *
 * Update protocol:
 *   - Bump `AIX_FORMAT_VERSION` here.
 *   - Bump `version` in this package's `package.json` to match.
 *   - Re-export from `@axiom/schema` is automatic via index.ts.
 *
 * Provenance: extracted from iqra/src/lib/iqra/14-aix/version.ts.
 */

/**
 * The AIX schema major.minor that this package targets.
 *
 * Matches `meta.format_version` in a manifest. Two-segment intentionally:
 * the schema is keyed by major.minor and uses semver patches only for
 * non-shape-breaking changes (added optional fields, doc updates).
 */
export const AIX_FORMAT_VERSION = '1.3';

/**
 * The full AIX Sovereign Protocol release this package is published
 * alongside. Surfaces the Tesla 369 motif in the patch segment.
 */
export const AIX_PROTOCOL_VERSION = '0.369.0';

/**
 * Axiom A2A protocol pin. The Axiom agent-to-agent transport layer
 * negotiates this string in its handshake; bumping it forces a
 * compat-renegotiation across runtimes.
 */
export const AXIOM_PROTOCOL = 'axiom-a2a-v1';

/**
 * Canonical schema URL. Resolvers may fetch this for runtime
 * validation; bundled callers should prefer the local
 * `@axiom/schema/schema.json` import to avoid network dependencies.
 */
export const AIX_SCHEMA_URL = 'https://axiomid.app/schemas/aix.schema.json';

/**
 * The DID method authority this package is bound to. Manifests that
 * use `did:axiom:` MUST set the authority segment to this value;
 * anything else is rejected by the identity_layer schema.
 */
export const AXIOM_AUTHORITY = 'axiomid.app';
