import { asAsciiSlug } from '../../src/types/brands.js';
import { OUTPUT_CONTRACT_ACTION_PROPOSAL_V1 } from '../../src/types/sanitized-task-packet.js';
import {
  DEFAULT_EGRESS_POLICY,
  type EgressPolicyArtifact,
  type EgressVerificationRequest,
} from '../../src/egress-firewall/types.js';

export const VALID_ACTION_PROPOSAL_JSON = JSON.stringify({
  action: 'payment.transfer',
  amount_minor_units: 4500,
  currency: 'USD',
  destination: 'approved-vendor-001',
  reason_code: 'invoice_payment',
  payment_reference: 'invoice_2026_001',
});

export const VALID_TEXT_EGRESS = 'Certified summary for operator review.';

export const EXFIL_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----`;

export const HIGH_ENTROPY_BLOB =
  'Zx9kLm2pQr4sTv6wXy8zA1bC3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY3zA5bC7dE9fG1hJ3kL5mN7pQ9rS';

export function egressPolicy(overrides: Partial<EgressPolicyArtifact> = {}): EgressPolicyArtifact {
  return { ...DEFAULT_EGRESS_POLICY, ...overrides };
}

export function baseEgressRequest(
  overrides: Partial<EgressVerificationRequest> = {},
): EgressVerificationRequest {
  const policy = egressPolicy();
  return {
    output_body: VALID_TEXT_EGRESS,
    output_contract_id: asAsciiSlug('TEXT_EGRESS_V1'),
    egress_destination: asAsciiSlug('telemetry_sink'),
    risk_mode: 'normal',
    envelope_policy_hash: policy.policy_hash,
    policy,
    streaming_requested: false,
    monotonic_tick: 0,
    ...overrides,
  };
}

export function actionProposalEgressRequest(
  overrides: Partial<EgressVerificationRequest> = {},
): EgressVerificationRequest {
  return baseEgressRequest({
    output_body: VALID_ACTION_PROPOSAL_JSON,
    output_contract_id: asAsciiSlug(OUTPUT_CONTRACT_ACTION_PROPOSAL_V1),
    egress_destination: asAsciiSlug('model_response_channel'),
    ...overrides,
  });
}
