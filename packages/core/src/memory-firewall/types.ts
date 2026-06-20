import type { AsciiSlug, IsoTimestamp, Sha256Hex } from '../types/brands.js';
import type { MemoryQuotaState, StateEnvelope } from '../types/state-envelope.js';
import type { RiskMode, SourceTrustLevel } from '../types/risk.js';

export type MemoryFirewallDecision = 'allowed' | 'blocked';

export const MEMORY_FIREWALL_BLOCKED_REASONS = [
  'MEMORY_QUOTA_EXCEEDED',
  'MEMORY_PAYLOAD_NOT_INERT',
  'INVALID_MEMORY_METADATA',
  'DUPLICATE_PAYLOAD_DETECTED',
  'SIMILAR_PAYLOAD_DETECTED',
  'MEMORY_READ_TRUST_DEPRECIATED',
  'RISK_MODE_BLOCKS_MEMORY_WRITE',
  'FORBIDDEN_CONTROL_PLANE_FIELD_IN_METADATA',
] as const;

export type MemoryFirewallBlockedReason = (typeof MEMORY_FIREWALL_BLOCKED_REASONS)[number];

export const MEMORY_EVIDENCE_CONTENT_TYPES = [
  'text_plain',
  'application_json',
] as const;

export type MemoryEvidenceContentType = (typeof MEMORY_EVIDENCE_CONTENT_TYPES)[number];

/** Strict typed metadata for inert evidence stored behind the memory firewall. */
export interface MemoryEvidenceMetadata {
  evidence_id: AsciiSlug;
  evidence_trust_level: SourceTrustLevel;
  content_type: AsciiSlug;
  byte_length: number;
  content_hash: Sha256Hex;
  captured_at: IsoTimestamp;
}

export interface MemoryFirewallPolicy {
  max_memory_write_count: number;
  max_memory_payload_bytes: number;
  max_memory_index_entries: number;
  max_memory_write_count_window: number;
  max_similarity_violations: number;
  max_duplicate_attempts: number;
  max_similar_payload_attempts: number;
}

export const DEFAULT_MEMORY_FIREWALL_POLICY: MemoryFirewallPolicy = {
  max_memory_write_count: 100,
  max_memory_payload_bytes: 65_536,
  max_memory_index_entries: 50,
  max_memory_write_count_window: 20,
  max_similarity_violations: 5,
  max_duplicate_attempts: 3,
  max_similar_payload_attempts: 5,
};

export interface MemoryWriteRequest {
  metadata: MemoryEvidenceMetadata;
  payload: string;
  envelope: StateEnvelope;
  policy?: MemoryFirewallPolicy;
  known_content_hashes?: ReadonlySet<string>;
  known_normalized_hashes?: ReadonlySet<string>;
}

export interface MemoryWriteResult {
  decision: MemoryFirewallDecision;
  reason_codes: MemoryFirewallBlockedReason[];
  updated_memory_quota: MemoryQuotaState;
  quarantine_recommended: boolean;
  payload_stored: false;
}

export interface MemoryReadRequest {
  metadata: MemoryEvidenceMetadata;
  envelope: StateEnvelope;
  current_source_trust_level: SourceTrustLevel;
}

export interface MemoryReadResult {
  decision: MemoryFirewallDecision;
  reason_codes: MemoryFirewallBlockedReason[];
  effective_trust_level: SourceTrustLevel;
  trust_depreciated: boolean;
  payload_returned: false;
}
