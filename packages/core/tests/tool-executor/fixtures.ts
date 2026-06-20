import type { ActionProposal } from '../../src/types/action-proposal.js';
import { asAsciiSlug, asIsoTimestamp } from '../../src/types/brands.js';
import type { PaymentPolicyContext } from '../../src/semantic-policy/types.js';
import type { StateEnvelope } from '../../src/types/state-envelope.js';
import type { ParameterBoundActionToken } from '../../src/token-broker/types.js';
import type { ToolExecutionVerificationRequest } from '../../src/tool-executor/types.js';
import { evaluateSemanticPolicy } from '../../src/semantic-policy/index.js';
import {
  DEFAULT_PARAMETER_SCHEMA_VERSION,
  DEFAULT_SIGNING_KEY_ID,
  TokenBroker,
  type TokenIssuanceRequest,
} from '../../src/token-broker/index.js';
import { baseStateEnvelope } from '../token-broker/fixtures.js';

export const SWAP_PAYMENT_POLICY: PaymentPolicyContext = {
  approved_destinations: ['approved_vendor_001'],
  max_amount_minor_units: 10_000_000,
  approved_invoice_references: {
    invoice_2026_001: {
      destination: 'approved_vendor_001',
      max_amount_minor_units: 10_000,
      currency: 'USD',
    },
  },
  allowed_user_roles_for_payment: ['finance-operator'],
  require_attestation: false,
};

export const SWAP_ORIGINAL_PAYLOAD: ActionProposal = {
  action: asAsciiSlug('payment.transfer'),
  amount_minor_units: 4500,
  currency: asAsciiSlug('USD'),
  destination: asAsciiSlug('approved_vendor_001'),
  reason_code: asAsciiSlug('invoice_payment'),
  payment_reference: asAsciiSlug('invoice_2026_001'),
};

export const SWAP_ATTACK_PAYLOAD: ActionProposal = {
  ...SWAP_ORIGINAL_PAYLOAD,
  destination: asAsciiSlug('attacker_account'),
};

export function swapTestEnvelope(overrides: Partial<StateEnvelope> = {}): StateEnvelope {
  return baseStateEnvelope({
    source_trust_level: 1,
    risk_mode: 'normal',
    revocation_epoch: 42,
    containment_epoch: 7,
    key_epoch: 3,
    user_role: asAsciiSlug('finance-operator'),
    ...overrides,
  });
}

export function issueTokenForPayload(
  proposal: ActionProposal,
  envelope: StateEnvelope = swapTestEnvelope(),
): ParameterBoundActionToken {
  const semantic = evaluateSemanticPolicy({
    proposal,
    envelope,
    policy: SWAP_PAYMENT_POLICY,
  });
  const request: TokenIssuanceRequest = {
    proposal,
    envelope,
    semantic,
    tool_id: asAsciiSlug('tool.payment.transfer'),
    parameter_schema_version: asAsciiSlug(DEFAULT_PARAMETER_SCHEMA_VERSION),
    policy_decision_id: asAsciiSlug('policy-decision-swap-test'),
    signing_key_id: DEFAULT_SIGNING_KEY_ID,
    issued_at: asIsoTimestamp('2030-01-01T00:00:00.000Z'),
    ttl_ms: 60_000,
  };
  const result = new TokenBroker().issueToken(request);
  if (result.decision !== 'issued' || !result.token) {
    throw new Error(`Token issuance failed: ${result.reason_code}`);
  }
  return result.token;
}

export function verificationRequest(
  token: ParameterBoundActionToken,
  execution_payload: ActionProposal,
  overrides: Partial<ToolExecutionVerificationRequest> = {},
): ToolExecutionVerificationRequest {
  return {
    token,
    execution_payload,
    current_revocation_epoch: token.revocation_epoch,
    current_containment_epoch: token.containment_epoch,
    current_key_epoch: token.key_epoch,
    ...overrides,
  };
}
