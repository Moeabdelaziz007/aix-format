/**
 * 🧮 JSON Canonicalization (RFC 8785 / JCS)
 *
 * AIX signs canonical JSON, not raw JSON. Two parties that produced the
 * same logical object must produce the exact same byte string before
 * hashing, otherwise signatures don't verify across runtimes.
 *
 * Implementation: deterministic stringify per RFC 8785:
 *   - Object keys sorted by UTF-16 code units (UCS-2 lexicographic).
 *   - No insignificant whitespace.
 *   - Numbers serialized per ECMA-262 ToString (V8/Node give us this).
 *   - Strings escaped per JSON spec.
 *   - Disallows: undefined, functions, symbols, BigInt, circular refs,
 *     NaN, +/-Infinity. These would silently mutate during JSON.stringify.
 *
 * No external dependencies. Edge/Workers safe.
 *
 * Provenance: extracted verbatim from
 * iqra/src/lib/iqra/14-aix/canonical.ts. Behaviour and test parity
 * preserved.
 */

function escapeString(s: string): string {
  // JSON spec: must escape ", \, control chars (U+0000..U+001F).
  // Non-ASCII characters stay as-is so the canonical byte length
  // matches what other compliant canonicalizers emit.
  //
  // RFC 8785 §3.2.2.2 mandates that an implementation MUST fail when
  // the input contains an unpaired UTF-16 surrogate. Different
  // implementations can otherwise disagree on the canonical bytes
  // (lone high surrogate vs replacement char vs literal) and produce
  // non-interoperable signatures for the same logical string.
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);

    // High surrogate (D800..DBFF): MUST be followed by a low surrogate.
    if (ch >= 0xd800 && ch <= 0xdbff) {
      const next = i + 1 < s.length ? s.charCodeAt(i + 1) : -1;
      if (next < 0xdc00 || next > 0xdfff) {
        throw new TypeError(
          `JCS: lone high surrogate at index ${i} (U+${ch.toString(16).toUpperCase()})`,
        );
      }
      // Pair is valid; emit both code units verbatim and skip the low.
      out += s[i] + s[i + 1];
      i++;
      continue;
    }
    // Low surrogate (DC00..DFFF) without a preceding high surrogate.
    if (ch >= 0xdc00 && ch <= 0xdfff) {
      throw new TypeError(
        `JCS: lone low surrogate at index ${i} (U+${ch.toString(16).toUpperCase()})`,
      );
    }

    if (ch === 0x22) {
      out += '\\"';
    } else if (ch === 0x5c) {
      out += '\\\\';
    } else if (ch === 0x08) {
      out += '\\b';
    } else if (ch === 0x09) {
      out += '\\t';
    } else if (ch === 0x0a) {
      out += '\\n';
    } else if (ch === 0x0c) {
      out += '\\f';
    } else if (ch === 0x0d) {
      out += '\\r';
    } else if (ch < 0x20) {
      out += '\\u' + ch.toString(16).padStart(4, '0');
    } else {
      out += s[i];
    }
  }
  out += '"';
  return out;
}

function serializeNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new TypeError(`JCS: non-finite number not allowed: ${n}`);
  }
  // Integer fast-path matches the canonical form for safe integers.
  if (Number.isInteger(n) && Math.abs(n) < 1e21) {
    return String(n);
  }
  // ECMA-262 ToString already produces shortest round-trip form for
  // doubles; that aligns with RFC 8785's reliance on ES number string.
  return String(n);
}

function canonicalizeInner(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return 'null';

  const t = typeof value;

  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') return serializeNumber(value as number);
  if (t === 'string') return escapeString(value as string);

  if (t === 'undefined' || t === 'function' || t === 'symbol' || t === 'bigint') {
    throw new TypeError(`JCS: unsupported value type: ${t}`);
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) throw new TypeError('JCS: circular structure');
    seen.add(value);
    const items = value.map((v) => canonicalizeInner(v, seen));
    seen.delete(value);
    return '[' + items.join(',') + ']';
  }

  // Plain object
  const obj = value as Record<string, unknown>;
  if (seen.has(obj)) throw new TypeError('JCS: circular structure');
  seen.add(obj);

  // RFC 8785: sort object keys by UTF-16 code units.
  const keys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (v === undefined) continue; // RFC 8785 drops these.
    parts.push(escapeString(k) + ':' + canonicalizeInner(v, seen));
  }
  seen.delete(obj);
  return '{' + parts.join(',') + '}';
}

/**
 * Produce the RFC 8785 / JCS canonical JSON string for `value`.
 *
 * Throws on circular refs, non-finite numbers, undefined-leaves outside
 * objects, BigInts, functions, or Symbols. Those are not legal in a
 * deterministic signing payload.
 */
export function canonicalizeJSON(value: unknown): string {
  return canonicalizeInner(value, new WeakSet());
}

/** Convenience: UTF-8 byte view of the canonical string. */
export function canonicalizeJSONBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalizeJSON(value));
}
