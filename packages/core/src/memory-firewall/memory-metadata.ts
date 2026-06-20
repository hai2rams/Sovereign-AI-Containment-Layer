import { asIsoTimestamp, type AsciiSlug, type IsoTimestamp, type Sha256Hex } from '../types/brands.js';
import { validateAsciiSlug } from '../validators/ascii-slug.js';
import { validateNonNegativeSafeInteger } from '../validators/positive-safe-integer.js';
import { validateSha256Hex } from '../validators/sha256.js';
import { validateNoForbiddenFields } from '../validators/forbidden-fields.js';
import { failure, mergeFailures, success, type ValidationResult } from '../validators/result.js';
import { isSourceTrustLevel } from '../types/risk.js';
import {
  MEMORY_EVIDENCE_CONTENT_TYPES,
  type MemoryEvidenceMetadata,
} from './types.js';

const ALLOWED_METADATA_FIELDS = [
  'evidence_id',
  'evidence_trust_level',
  'content_type',
  'byte_length',
  'content_hash',
  'captured_at',
] as const;

const CONTENT_TYPE_SET = new Set<string>(MEMORY_EVIDENCE_CONTENT_TYPES);

export function validateMemoryEvidenceMetadata(input: unknown): ValidationResult<MemoryEvidenceMetadata> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return failure('MemoryEvidenceMetadata must be an object');
  }

  const record = input as Record<string, unknown>;
  const unknown = Object.keys(record).filter(
    (key) => !(ALLOWED_METADATA_FIELDS as readonly string[]).includes(key),
  );
  if (unknown.length > 0) {
    return failure(`Unknown metadata field(s): ${unknown.join(', ')}`);
  }

  const forbidden = validateNoForbiddenFields(record);
  if (!forbidden.ok) {
    return failure(...forbidden.errors);
  }

  for (const field of ALLOWED_METADATA_FIELDS) {
    if (!(field in record)) {
      return failure(`Missing required metadata field: ${field}`);
    }
  }

  const evidence_id = validateAsciiSlug(record.evidence_id);
  const content_type = validateAsciiSlug(record.content_type);
  const byte_length = validateNonNegativeSafeInteger(record.byte_length);
  const content_hash = validateSha256Hex(record.content_hash);
  const captured_at_raw = record.captured_at;
  if (typeof captured_at_raw !== 'string' || Number.isNaN(Date.parse(captured_at_raw))) {
    return failure('captured_at must be a valid ISO timestamp string');
  }

  if (!isSourceTrustLevel(record.evidence_trust_level)) {
    return failure('evidence_trust_level must be an integer between 0 and 5');
  }

  const merged = mergeFailures([evidence_id, content_type, byte_length, content_hash]);
  if (merged) {
    return merged;
  }

  if (!evidence_id.ok || !content_type.ok || !byte_length.ok || !content_hash.ok) {
    return failure('MemoryEvidenceMetadata validation failed');
  }

  if (!CONTENT_TYPE_SET.has(content_type.value)) {
    return failure(`content_type must be one of: ${MEMORY_EVIDENCE_CONTENT_TYPES.join(', ')}`);
  }

  return success({
    evidence_id: evidence_id.value,
    evidence_trust_level: record.evidence_trust_level,
    content_type: content_type.value,
    byte_length: byte_length.value,
    content_hash: content_hash.value,
    captured_at: asIsoTimestamp(captured_at_raw),
  });
}

export function metadataMatchesPayload(
  metadata: MemoryEvidenceMetadata,
  payload: string,
  content_hash: Sha256Hex,
): boolean {
  const byteLength = Buffer.byteLength(payload, 'utf8');
  return metadata.byte_length === byteLength && metadata.content_hash === content_hash;
}
