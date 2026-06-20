import type { StateEnvelope } from '../types/state-envelope.js';
import { STATE_ENVELOPE_VERSION } from '../types/state-envelope.js';
import type { ActionProposal } from '../types/action-proposal.js';
import type { MemoryQuotaState } from '../types/state-envelope.js';
import type { AsciiSlug, Sha256Hex } from '../types/brands.js';
import {
  MEMORY_QUOTA_STATUSES,
  POLICY_DECISIONS,
  RELEASE_STATUSES,
  REVOCATION_STATUSES,
  RISK_MODES,
  SOURCE_TRUST_LEVELS,
} from '../types/risk.js';
import { validateAsciiSlug } from './ascii-slug.js';
import { validateNonNegativeSafeInteger } from './positive-safe-integer.js';
import { validateSha256Hex } from './sha256.js';
import { validateActionProposal } from './action-proposal-validator.js';
import { failure, mergeFailures, success, type ValidationResult } from './result.js';

function isEnumValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function requireSlug(input: unknown): ValidationResult<AsciiSlug> {
  return validateAsciiSlug(input);
}

function requireHash(input: unknown): ValidationResult<Sha256Hex> {
  return validateSha256Hex(input);
}

function validateMemoryQuota(input: unknown): ValidationResult<MemoryQuotaState> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return failure('memory_quota must be an object');
  }
  const record = input as Record<string, unknown>;
  const counters = [
    validateNonNegativeSafeInteger(record.memory_write_count),
    validateNonNegativeSafeInteger(record.memory_payload_bytes),
    validateNonNegativeSafeInteger(record.memory_index_entries),
    validateNonNegativeSafeInteger(record.memory_write_count_window),
    validateNonNegativeSafeInteger(record.memory_unique_payload_attempts),
    validateNonNegativeSafeInteger(record.memory_similar_payload_attempts),
    validateNonNegativeSafeInteger(record.memory_duplicate_payload_attempts),
    validateNonNegativeSafeInteger(record.memory_similarity_violation_count),
  ];
  const merged = mergeFailures(counters);
  if (merged) {
    return merged;
  }
  if (!isEnumValue(record.memory_quota_status, MEMORY_QUOTA_STATUSES)) {
    return failure('memory_quota_status is invalid');
  }
  const [
    memory_write_count,
    memory_payload_bytes,
    memory_index_entries,
    memory_write_count_window,
    memory_unique_payload_attempts,
    memory_similar_payload_attempts,
    memory_duplicate_payload_attempts,
    memory_similarity_violation_count,
  ] = counters.map((c) => (c.ok ? c.value : 0));

  return success({
    memory_write_count,
    memory_payload_bytes,
    memory_index_entries,
    memory_write_count_window,
    memory_unique_payload_attempts,
    memory_similar_payload_attempts,
    memory_duplicate_payload_attempts,
    memory_similarity_violation_count,
    memory_quota_status: record.memory_quota_status,
  });
}

export function validateStateEnvelope(input: unknown): ValidationResult<StateEnvelope> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return failure('StateEnvelope must be an object');
  }
  const record = input as Record<string, unknown>;

  const sessionId = requireSlug(record.session_id);
  const agentDid = requireSlug(record.agent_did);
  const releaseId = requireSlug(record.release_id);
  const policyHash = requireHash(record.policy_hash);
  const attestationId = requireSlug(record.attestation_id);
  const userRole = requireSlug(record.user_role);
  const envelopeVersion = requireSlug(record.state_envelope_version);
  const idempotencyKey = requireSlug(record.idempotency_key);
  const previousStateRoot = requireHash(record.previous_state_root);
  const currentStateRoot = requireHash(record.current_state_root);

  const intResults = [
    validateNonNegativeSafeInteger(record.revocation_epoch),
    validateNonNegativeSafeInteger(record.containment_epoch),
    validateNonNegativeSafeInteger(record.key_epoch),
    validateNonNegativeSafeInteger(record.current_key_epoch),
    validateNonNegativeSafeInteger(record.previous_key_epoch),
    validateNonNegativeSafeInteger(record.previous_key_valid_until_tick),
    validateNonNegativeSafeInteger(record.monotonic_start_tick),
    validateNonNegativeSafeInteger(record.transaction_sequence_counter),
  ];

  const merged = mergeFailures([
    sessionId,
    agentDid,
    releaseId,
    policyHash,
    attestationId,
    userRole,
    envelopeVersion,
    idempotencyKey,
    previousStateRoot,
    currentStateRoot,
    ...intResults,
  ]);
  if (merged) {
    return merged;
  }

  if (!isEnumValue(record.risk_mode, RISK_MODES)) {
    return failure('risk_mode is invalid');
  }
  if (!isEnumValue(record.source_trust_level, SOURCE_TRUST_LEVELS)) {
    return failure('source_trust_level is invalid');
  }
  if (!isEnumValue(record.release_status, RELEASE_STATUSES)) {
    return failure('release_status is invalid');
  }
  if (!isEnumValue(record.revocation_status, REVOCATION_STATUSES)) {
    return failure('revocation_status is invalid');
  }
  if (!isEnumValue(record.policy_decision, POLICY_DECISIONS)) {
    return failure('policy_decision is invalid');
  }
  if (typeof record.security_escalation !== 'boolean') {
    return failure('security_escalation must be boolean');
  }
  if (typeof record.renewal_in_flight !== 'boolean') {
    return failure('renewal_in_flight must be boolean');
  }

  const memoryQuota = validateMemoryQuota(record.memory_quota);
  if (!memoryQuota.ok) {
    return memoryQuota;
  }

  let proposedAction: ActionProposal | null = null;
  if (record.proposed_action !== null) {
    const proposal = validateActionProposal(record.proposed_action);
    if (!proposal.ok) {
      return failure(...proposal.errors.map((e) => `proposed_action: ${e}`));
    }
    proposedAction = proposal.value;
  }

  let actionTokenId: AsciiSlug | null = null;
  if (record.action_token_id !== null) {
    const tokenId = requireSlug(record.action_token_id);
    if (!tokenId.ok) {
      return tokenId;
    }
    actionTokenId = tokenId.value;
  }

  let auditReceiptId: AsciiSlug | null = null;
  if (record.audit_receipt_id !== null) {
    const receiptId = requireSlug(record.audit_receipt_id);
    if (!receiptId.ok) {
      return receiptId;
    }
    auditReceiptId = receiptId.value;
  }

  if (envelopeVersion.ok && envelopeVersion.value !== STATE_ENVELOPE_VERSION) {
    return failure(`state_envelope_version must be ${STATE_ENVELOPE_VERSION}`);
  }

  if (
    !sessionId.ok ||
    !agentDid.ok ||
    !releaseId.ok ||
    !policyHash.ok ||
    !attestationId.ok ||
    !userRole.ok ||
    !envelopeVersion.ok ||
    !idempotencyKey.ok ||
    !previousStateRoot.ok ||
    !currentStateRoot.ok ||
    !intResults.every((r) => r.ok)
  ) {
    return failure('StateEnvelope field validation failed');
  }

  const [
    revocation_epoch,
    containment_epoch,
    key_epoch,
    current_key_epoch,
    previous_key_epoch,
    previous_key_valid_until_tick,
    monotonic_start_tick,
    transaction_sequence_counter,
  ] = intResults.map((r) => (r.ok ? r.value : 0));

  return success({
    session_id: sessionId.value,
    agent_did: agentDid.value,
    release_id: releaseId.value,
    policy_hash: policyHash.value,
    attestation_id: attestationId.value,
    risk_mode: record.risk_mode,
    source_trust_level: record.source_trust_level,
    user_role: userRole.value,
    release_status: record.release_status,
    revocation_status: record.revocation_status,
    revocation_epoch,
    containment_epoch,
    key_epoch,
    current_key_epoch,
    previous_key_epoch,
    previous_key_valid_until_tick,
    security_escalation: record.security_escalation,
    monotonic_start_tick,
    transaction_sequence_counter,
    state_envelope_version: envelopeVersion.value,
    renewal_in_flight: record.renewal_in_flight,
    memory_quota: memoryQuota.value,
    proposed_action: proposedAction,
    policy_decision: record.policy_decision,
    action_token_id: actionTokenId,
    idempotency_key: idempotencyKey.value,
    audit_receipt_id: auditReceiptId,
    previous_state_root: previousStateRoot.value,
    current_state_root: currentStateRoot.value,
  });
}
