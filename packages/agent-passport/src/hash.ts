import { createHash } from 'node:crypto';

const HASH_PREFIX = 'sha256:';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function sha256Digest(input: string): string {
  return `${HASH_PREFIX}${sha256Hex(input)}`;
}

/** Recursively sort object keys for deterministic JSON serialization. */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeysDeep(record[key]);
    }
    return sorted;
  }

  return value;
}

export function normalizeJsonForHash(raw: string): string {
  const parsed: unknown = JSON.parse(raw);
  return `${JSON.stringify(sortKeysDeep(parsed))}\n`;
}

/** Normalize markdown/text: NFC unicode, LF line endings, trim trailing spaces per line. */
export function normalizeTextForHash(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n+$/u, '\n');
}

export function hashJsonContent(raw: string): string {
  return sha256Digest(normalizeJsonForHash(raw));
}

export function hashTextContent(raw: string): string {
  return sha256Digest(normalizeTextForHash(raw));
}

/** Root hash over sorted bundle entries (excluding bundle_root_hash). */
export function computeBundleRootHash(bundle: Record<string, string>): string {
  const lines = Object.entries(bundle)
    .filter(([key]) => key !== 'bundle_root_hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);

  return sha256Digest(lines.join('\n'));
}
