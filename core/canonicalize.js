// Buffer is globally available in Node.js, no need to import
export class CanonicalizationError extends Error {
  constructor(code, message, path = '$') {
    super(`${code}: ${message} @ ${path}`);
    this.name = 'CanonicalizationError';
    this.code = code;
    this.path = path;
  }
}

function sanitize(value, path, seen) {
  if (value === null) return null;
  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean' || kind === 'number') return value;
  if (kind === 'undefined' || kind === 'function' || kind === 'symbol' || kind === 'bigint') {
    throw new CanonicalizationError('CANON_UNSUPPORTED_TYPE', `Unsupported type: ${kind}`, path);
  }
  if (seen.has(value)) throw new CanonicalizationError('CANON_CIRCULAR_REFERENCE', 'Circular reference detected', path);
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item, i) => sanitize(item, `${path}[${i}]`, seen));
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = sanitize(value[key], `${path}.${key}`, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

export function stripDynamicSecurityFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CanonicalizationError('CANON_INVALID_ROOT', 'Root payload must be an object');
  }

  const cloned = sanitize(input, '$', new WeakSet());
  if (cloned.security && typeof cloned.security === 'object' && !Array.isArray(cloned.security)) {
    delete cloned.security.checksum;
    delete cloned.security.signature;
  }
  return cloned;
}

export function serialize(value, path, seen) {
  if (value === null) return 'null';

  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean') return JSON.stringify(value);
  if (kind === 'number') {
    if (!Number.isFinite(value)) {
      throw new CanonicalizationError('CANON_NON_FINITE_NUMBER', 'Non-finite number is not allowed', path);
    }
    return JSON.stringify(value);
  }
  if (kind === 'undefined' || kind === 'function' || kind === 'symbol' || kind === 'bigint') {
    throw new CanonicalizationError('CANON_UNSUPPORTED_TYPE', `Unsupported type: ${kind}`, path);
  }

  if (seen.has(value)) {
    throw new CanonicalizationError('CANON_CIRCULAR_REFERENCE', 'Circular reference detected', path);
  }
  seen.add(value);

  try {
    if (Array.isArray(value)) {
      return `[${value.map((item, idx) => serialize(item, `${path}[${idx}]`, seen)).join(',')}]`;
    }

    const keys = Object.keys(value).sort();
    const pairs = [];
    for (const key of keys) {
      const child = value[key];
      if (typeof child === 'undefined') {
        throw new CanonicalizationError('CANON_UNSUPPORTED_TYPE', 'undefined is not allowed', `${path}.${key}`);
      }
      pairs.push(`${JSON.stringify(key)}:${serialize(child, `${path}.${key}`, seen)}`);
    }
    return `{${pairs.join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export function canonicalizeForSigning(payload) {
  const normalized = stripDynamicSecurityFields(payload);
  const canonicalString = serialize(normalized, '$', new WeakSet());
  return {
    canonicalString,
    bytes: Buffer.from(canonicalString, 'utf8')
  };
}
