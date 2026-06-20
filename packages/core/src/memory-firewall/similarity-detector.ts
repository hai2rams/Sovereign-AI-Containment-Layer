import type { MemoryEvidenceMetadata, MemoryFirewallPolicy } from './types.js';

export type SimilarityDetectionResult = {
  duplicate_detected: boolean;
  similar_detected: boolean;
  unique_payload: boolean;
};

export function detectPayloadSimilarity(
  metadata: MemoryEvidenceMetadata,
  normalized_hash: string,
  known_content_hashes?: ReadonlySet<string>,
  known_normalized_hashes?: ReadonlySet<string>,
): SimilarityDetectionResult {
  const contentHash = metadata.content_hash;
  const duplicate_detected =
    known_content_hashes !== undefined && known_content_hashes.has(contentHash);
  const similar_detected =
    !duplicate_detected &&
    known_normalized_hashes !== undefined &&
    known_normalized_hashes.has(normalized_hash);
  const unique_payload = !duplicate_detected && !similar_detected;
  return { duplicate_detected, similar_detected, unique_payload };
}

export function similarityBlockedReason(
  detection: SimilarityDetectionResult,
): 'DUPLICATE_PAYLOAD_DETECTED' | 'SIMILAR_PAYLOAD_DETECTED' | null {
  if (detection.duplicate_detected) {
    return 'DUPLICATE_PAYLOAD_DETECTED';
  }
  if (detection.similar_detected) {
    return 'SIMILAR_PAYLOAD_DETECTED';
  }
  return null;
}

export function shouldQuarantineOnSimilarity(
  detection: SimilarityDetectionResult,
  policy: MemoryFirewallPolicy,
  quota_similarity_violation_count: number,
): boolean {
  if (!detection.duplicate_detected && !detection.similar_detected) {
    return false;
  }
  return quota_similarity_violation_count + 1 >= policy.max_similarity_violations;
}
