import { asAsciiSlug, asSha256Hex } from '../types/brands.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import { STATE_ENVELOPE_VERSION } from '../types/state-envelope.js';
import type { ScenarioEnvelopeInput } from './types.js';

const HASH = asSha256Hex('sha256:' + 'a'.repeat(64));

export function envelopeFromScenario(input: ScenarioEnvelopeInput = {}): StateEnvelope {
  const base: StateEnvelope = {
    session_id: asAsciiSlug('session-001'),
    agent_did: asAsciiSlug('did:agent:001'),
    release_id: asAsciiSlug('release-certified-001'),
    policy_hash: HASH,
    attestation_id: asAsciiSlug('attest-001'),
    risk_mode: 'normal',
    source_trust_level: 1,
    user_role: asAsciiSlug('finance-operator'),
    release_status: 'certified',
    revocation_status: 'active',
    revocation_epoch: 0,
    containment_epoch: 0,
    key_epoch: 1,
    current_key_epoch: 1,
    previous_key_epoch: 0,
    previous_key_valid_until_tick: 0,
    security_escalation: false,
    monotonic_start_tick: 0,
    transaction_sequence_counter: 0,
    state_envelope_version: asAsciiSlug(STATE_ENVELOPE_VERSION),
    renewal_in_flight: false,
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
    proposed_action: null,
    policy_decision: 'defer',
    action_token_id: null,
    idempotency_key: asAsciiSlug('idem-001'),
    audit_receipt_id: null,
    previous_state_root: HASH,
    current_state_root: HASH,
  };

  const overrides: Partial<StateEnvelope> = {};

  if (input.source_trust_level !== undefined) {
    overrides.source_trust_level = input.source_trust_level as StateEnvelope['source_trust_level'];
  }
  if (input.user_role !== undefined) {
    overrides.user_role = asAsciiSlug(input.user_role);
  }
  if (input.risk_mode !== undefined) {
    overrides.risk_mode = input.risk_mode;
  }
  if (input.release_status !== undefined) {
    overrides.release_status = input.release_status;
  }
  if (input.revocation_status !== undefined) {
    overrides.revocation_status = input.revocation_status;
  }
  if (input.attestation_id !== undefined) {
    overrides.attestation_id = asAsciiSlug(input.attestation_id);
  }
  if (input.revocation_epoch !== undefined) {
    overrides.revocation_epoch = input.revocation_epoch;
  }
  if (input.containment_epoch !== undefined) {
    overrides.containment_epoch = input.containment_epoch;
  }
  if (input.key_epoch !== undefined) {
    overrides.key_epoch = input.key_epoch;
    overrides.current_key_epoch = input.key_epoch;
  }

  return { ...base, ...overrides };
}
