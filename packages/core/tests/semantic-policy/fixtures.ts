import type { ActionProposal } from '../../src/types/action-proposal.js';
import { asAsciiSlug, asSha256Hex } from '../../src/types/brands.js';
import type { PaymentPolicyContext } from '../../src/semantic-policy/types.js';
import type { StateEnvelope } from '../../src/types/state-envelope.js';
import { STATE_ENVELOPE_VERSION } from '../../src/types/state-envelope.js';

const HASH = asSha256Hex('sha256:' + 'a'.repeat(64));

export const DEFAULT_PAYMENT_POLICY: PaymentPolicyContext = {
  approved_destinations: ['approved-vendor-001', 'treasury-ops-account'],
  max_amount_minor_units: 5_000_000,
  approved_invoice_references: {
    'invoice-123': {
      destination: 'approved-vendor-001',
      max_amount_minor_units: 500_000,
      currency: 'USD',
    },
  },
  allowed_user_roles_for_payment: ['finance-operator', 'treasury-admin'],
  require_attestation: true,
};

export function baseActionProposal(overrides: Partial<ActionProposal> = {}): ActionProposal {
  return {
    action: asAsciiSlug('payment.transfer'),
    amount_minor_units: 100_000,
    currency: asAsciiSlug('USD'),
    destination: asAsciiSlug('approved-vendor-001'),
    reason_code: asAsciiSlug('invoice-123'),
    payment_reference: asAsciiSlug('invoice-123'),
    ...overrides,
  };
}

export function baseStateEnvelope(overrides: Partial<StateEnvelope> = {}): StateEnvelope {
  return {
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
    ...overrides,
  };
}
