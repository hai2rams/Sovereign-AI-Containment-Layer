import { asAsciiSlug, asIsoTimestamp } from '../../src/types/brands.js';
import type { MemoryEvidenceMetadata, MemoryFirewallPolicy } from '../../src/memory-firewall/types.js';
import type { StateEnvelope } from '../../src/types/state-envelope.js';
import { baseStateEnvelope } from '../semantic-policy/fixtures.js';
import { hashMemoryPayload } from '../../src/memory-firewall/quota-enforcer.js';

export function memoryEnvelope(overrides: Partial<StateEnvelope> = {}): StateEnvelope {
  return baseStateEnvelope({
    risk_mode: 'normal',
    memory_quota: {
      memory_write_count: 0,
      memory_payload_bytes: 0,
      memory_index_entries: 0,
      memory_write_count_window: 0,
      memory_unique_payload_attempts: 0,
      memory_similar_payload_attempts: 0,
      memory_duplicate_payload_attempts: 0,
      memory_similarity_violation_count: 0,
      memory_quota_status: 'normal',
    },
    ...overrides,
  });
}

export function evidenceMetadata(
  payload: string,
  overrides: Partial<MemoryEvidenceMetadata> = {},
): MemoryEvidenceMetadata {
  const byte_length = Buffer.byteLength(payload, 'utf8');
  return {
    evidence_id: asAsciiSlug('evidence-001'),
    evidence_trust_level: 2,
    content_type: asAsciiSlug('text_plain'),
    byte_length,
    content_hash: hashMemoryPayload(payload),
    captured_at: asIsoTimestamp('2030-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

export const TIGHT_POLICY: MemoryFirewallPolicy = {
  max_memory_write_count: 2,
  max_memory_payload_bytes: 1024,
  max_memory_index_entries: 2,
  max_memory_write_count_window: 2,
  max_similarity_violations: 2,
  max_duplicate_attempts: 1,
  max_similar_payload_attempts: 1,
};

export const INERT_PAYLOAD = 'Approved invoice summary for vendor payment.';
export const POISONED_PAYLOAD = '<script>steal_secrets()</script>';
export const SIMILAR_PAYLOAD = 'Approved   invoice   summary for vendor payment.';
