import type { MemoryQuotaState } from '../types/state-envelope.js';
import {
  DEFAULT_MEMORY_FIREWALL_POLICY,
  type MemoryFirewallBlockedReason,
  type MemoryReadRequest,
  type MemoryReadResult,
  type MemoryWriteRequest,
  type MemoryWriteResult,
} from './types.js';
import { validateMemoryEvidenceMetadata, metadataMatchesPayload } from './memory-metadata.js';
import { isInertEvidencePayload } from './inert-payload.js';
import {
  applySuccessfulWrite,
  checkWriteQuota,
  hashMemoryPayload,
  hashNormalizedPayload,
} from './quota-enforcer.js';
import {
  detectPayloadSimilarity,
  shouldQuarantineOnSimilarity,
  similarityBlockedReason,
} from './similarity-detector.js';
import { readTrustBlocksAccess, revalidateReadTrust } from './trust-revalidator.js';
import { riskModePermitsMemoryWrite } from './risk-mode-gate.js';

function blockedWrite(
  reason_codes: MemoryFirewallBlockedReason[],
  quota: MemoryQuotaState,
  quarantine_recommended = false,
): MemoryWriteResult {
  return {
    decision: 'blocked',
    reason_codes,
    updated_memory_quota: quota,
    quarantine_recommended,
    payload_stored: false,
  };
}

function allowedWrite(quota: MemoryQuotaState): MemoryWriteResult {
  return {
    decision: 'allowed',
    reason_codes: [],
    updated_memory_quota: quota,
    quarantine_recommended: false,
    payload_stored: false,
  };
}

export function evaluateMemoryWrite(request: MemoryWriteRequest): MemoryWriteResult {
  const policy = request.policy ?? DEFAULT_MEMORY_FIREWALL_POLICY;
  const quota = request.envelope.memory_quota;

  if (!riskModePermitsMemoryWrite(request.envelope.risk_mode)) {
    return blockedWrite(['RISK_MODE_BLOCKS_MEMORY_WRITE'], quota);
  }

  const metadataValidation = validateMemoryEvidenceMetadata(request.metadata);
  if (!metadataValidation.ok) {
    return blockedWrite(['INVALID_MEMORY_METADATA'], quota);
  }

  const metadata = metadataValidation.value;
  const payloadHash = hashMemoryPayload(request.payload);
  const normalizedHash = hashNormalizedPayload(request.payload);

  if (!metadataMatchesPayload(metadata, request.payload, payloadHash)) {
    return blockedWrite(['INVALID_MEMORY_METADATA'], quota);
  }

  if (!isInertEvidencePayload(request.payload)) {
    return blockedWrite(['MEMORY_PAYLOAD_NOT_INERT'], quota, true);
  }

  const quotaCheck = checkWriteQuota(quota, policy, metadata.byte_length);
  if (!quotaCheck.allowed) {
    return blockedWrite(['MEMORY_QUOTA_EXCEEDED'], quota, true);
  }

  const similarity = detectPayloadSimilarity(
    metadata,
    normalizedHash,
    request.known_content_hashes,
    request.known_normalized_hashes,
  );
  const similarityReason = similarityBlockedReason(similarity);
  if (similarityReason) {
    const quarantine = shouldQuarantineOnSimilarity(
      similarity,
      policy,
      quota.memory_similarity_violation_count,
    );
    return blockedWrite([similarityReason], quota, quarantine);
  }

  const updated = applySuccessfulWrite(quota, policy, metadata.byte_length, similarity);
  return allowedWrite(updated);
}

export function evaluateMemoryRead(request: MemoryReadRequest): MemoryReadResult {
  const metadataValidation = validateMemoryEvidenceMetadata(request.metadata);
  if (!metadataValidation.ok) {
    return {
      decision: 'blocked',
      reason_codes: ['INVALID_MEMORY_METADATA'],
      effective_trust_level: request.current_source_trust_level,
      trust_depreciated: false,
      payload_returned: false,
    };
  }

  const metadata = metadataValidation.value;
  const { effective_trust_level, trust_depreciated } = revalidateReadTrust(
    metadata,
    request.current_source_trust_level,
  );

  if (readTrustBlocksAccess(metadata, request.current_source_trust_level)) {
    return {
      decision: 'blocked',
      reason_codes: ['MEMORY_READ_TRUST_DEPRECIATED'],
      effective_trust_level,
      trust_depreciated,
      payload_returned: false,
    };
  }

  return {
    decision: 'allowed',
    reason_codes: [],
    effective_trust_level,
    trust_depreciated,
    payload_returned: false,
  };
}
