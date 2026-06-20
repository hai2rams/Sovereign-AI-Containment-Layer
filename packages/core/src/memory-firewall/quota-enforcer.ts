import { createHash } from 'node:crypto';
import { asSha256Hex, type Sha256Hex } from '../types/brands.js';
import type { MemoryFirewallPolicy } from './types.js';
import type { MemoryQuotaState } from '../types/state-envelope.js';

export function hashMemoryPayload(payload: string): Sha256Hex {
  const digest = createHash('sha256').update(payload, 'utf8').digest('hex');
  return asSha256Hex(`sha256:${digest}`);
}

export function normalizeForSimilarity(payload: string): string {
  return payload.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function hashNormalizedPayload(payload: string): Sha256Hex {
  return hashMemoryPayload(normalizeForSimilarity(payload));
}

export type QuotaCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'MEMORY_QUOTA_EXCEEDED'; field: string };

export function checkWriteQuota(
  quota: MemoryQuotaState,
  policy: MemoryFirewallPolicy,
  payload_bytes: number,
): QuotaCheckResult {
  if (quota.memory_write_count >= policy.max_memory_write_count) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_write_count' };
  }
  if (quota.memory_index_entries >= policy.max_memory_index_entries) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_index_entries' };
  }
  if (quota.memory_write_count_window >= policy.max_memory_write_count_window) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_write_count_window' };
  }
  if (quota.memory_payload_bytes + payload_bytes > policy.max_memory_payload_bytes) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_payload_bytes' };
  }
  if (quota.memory_similarity_violation_count >= policy.max_similarity_violations) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_similarity_violation_count' };
  }
  if (quota.memory_duplicate_payload_attempts >= policy.max_duplicate_attempts) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_duplicate_payload_attempts' };
  }
  if (quota.memory_similar_payload_attempts >= policy.max_similar_payload_attempts) {
    return { allowed: false, reason: 'MEMORY_QUOTA_EXCEEDED', field: 'memory_similar_payload_attempts' };
  }
  return { allowed: true };
}

export function deriveQuotaStatus(
  quota: MemoryQuotaState,
  policy: MemoryFirewallPolicy,
): MemoryQuotaState['memory_quota_status'] {
  const ratios = [
    quota.memory_write_count / policy.max_memory_write_count,
    quota.memory_payload_bytes / policy.max_memory_payload_bytes,
    quota.memory_index_entries / policy.max_memory_index_entries,
  ];
  const peak = Math.max(...ratios);
  if (peak >= 1) {
    return 'exceeded';
  }
  if (peak >= 0.8) {
    return 'near_limit';
  }
  return 'normal';
}

export function applySuccessfulWrite(
  quota: MemoryQuotaState,
  policy: MemoryFirewallPolicy,
  payload_bytes: number,
  options: {
    duplicate_detected: boolean;
    similar_detected: boolean;
    unique_payload: boolean;
  },
): MemoryQuotaState {
  const next: MemoryQuotaState = {
    ...quota,
    memory_write_count: quota.memory_write_count + 1,
    memory_payload_bytes: quota.memory_payload_bytes + payload_bytes,
    memory_index_entries: quota.memory_index_entries + 1,
    memory_write_count_window: quota.memory_write_count_window + 1,
    memory_unique_payload_attempts:
      quota.memory_unique_payload_attempts + (options.unique_payload ? 1 : 0),
    memory_similar_payload_attempts:
      quota.memory_similar_payload_attempts + (options.similar_detected ? 1 : 0),
    memory_duplicate_payload_attempts:
      quota.memory_duplicate_payload_attempts + (options.duplicate_detected ? 1 : 0),
    memory_similarity_violation_count:
      quota.memory_similarity_violation_count +
      (options.duplicate_detected || options.similar_detected ? 1 : 0),
  };
  next.memory_quota_status = deriveQuotaStatus(next, policy);
  return next;
}
