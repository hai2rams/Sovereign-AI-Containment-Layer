import type { AsciiSlug, Sha256Hex } from './brands.js';
import type { ActionProposal } from './action-proposal.js';
import type {
  MemoryQuotaStatus,
  PolicyDecision,
  ReleaseStatus,
  RevocationStatus,
  RiskMode,
  SourceTrustLevel,
} from './risk.js';

export type MemoryQuotaState = {
  memory_write_count: number;
  memory_payload_bytes: number;
  memory_index_entries: number;
  memory_write_count_window: number;
  memory_unique_payload_attempts: number;
  memory_similar_payload_attempts: number;
  memory_duplicate_payload_attempts: number;
  memory_similarity_violation_count: number;
  memory_quota_status: MemoryQuotaStatus;
};

export type StateEnvelope = {
  session_id: AsciiSlug;
  agent_did: AsciiSlug;
  release_id: AsciiSlug;
  policy_hash: Sha256Hex;
  attestation_id: AsciiSlug;
  risk_mode: RiskMode;
  source_trust_level: SourceTrustLevel;
  user_role: AsciiSlug;
  release_status: ReleaseStatus;
  revocation_status: RevocationStatus;
  revocation_epoch: number;
  containment_epoch: number;
  key_epoch: number;
  current_key_epoch: number;
  previous_key_epoch: number;
  previous_key_valid_until_tick: number;
  security_escalation: boolean;
  monotonic_start_tick: number;
  transaction_sequence_counter: number;
  state_envelope_version: AsciiSlug;
  renewal_in_flight: boolean;
  memory_quota: MemoryQuotaState;
  proposed_action: ActionProposal | null;
  policy_decision: PolicyDecision;
  action_token_id: AsciiSlug | null;
  idempotency_key: AsciiSlug;
  audit_receipt_id: AsciiSlug | null;
  previous_state_root: Sha256Hex;
  current_state_root: Sha256Hex;
};

export const STATE_ENVELOPE_VERSION = '1.0.0' as const;
