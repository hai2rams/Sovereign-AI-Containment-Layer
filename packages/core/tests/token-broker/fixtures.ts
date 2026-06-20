import type { ActionProposal } from '../../src/types/action-proposal.js';
import { asAsciiSlug, asSha256Hex } from '../../src/types/brands.js';
import type { SemanticValidationResult } from '../../src/semantic-policy/types.js';
import type { StateEnvelope } from '../../src/types/state-envelope.js';
import {
  baseActionProposal,
  baseStateEnvelope,
  DEFAULT_PAYMENT_POLICY,
} from '../semantic-policy/fixtures.js';
import { evaluateSemanticPolicy } from '../../src/semantic-policy/index.js';
import {
  DEFAULT_PARAMETER_SCHEMA_VERSION,
  DEFAULT_SIGNING_KEY_ID,
  type TokenIssuanceRequest,
} from '../../src/token-broker/index.js';

export { baseActionProposal, baseStateEnvelope, DEFAULT_PAYMENT_POLICY };

export function allowedSemantic(): SemanticValidationResult {
  return evaluateSemanticPolicy({
    proposal: baseActionProposal(),
    envelope: baseStateEnvelope({ source_trust_level: 1 }),
    policy: DEFAULT_PAYMENT_POLICY,
  });
}

export function blockedSemantic(): SemanticValidationResult {
  return {
    ...allowedSemantic(),
    accepted: false,
    final_semantic_result: 'blocked',
    reason_codes: ['DESTINATION_NOT_ALLOWLISTED'],
  };
}

export function quarantineSemantic(): SemanticValidationResult {
  return {
    ...allowedSemantic(),
    accepted: false,
    final_semantic_result: 'quarantine',
    reason_codes: ['LOW_SOURCE_TRUST_FOR_STATE_CHANGE'],
  };
}

export function readOnlySemantic(): SemanticValidationResult {
  return {
    ...allowedSemantic(),
    accepted: false,
    final_semantic_result: 'read_only',
    reason_codes: ['READ_ONLY_MODE'],
  };
}

export function humanApprovalSemantic(): SemanticValidationResult {
  return {
    ...allowedSemantic(),
    accepted: false,
    final_semantic_result: 'requires_human_approval',
    reason_codes: ['HUMAN_APPROVAL_REQUIRED'],
  };
}

export function baseIssuanceRequest(
  overrides: Partial<TokenIssuanceRequest> = {},
): TokenIssuanceRequest {
  return {
    proposal: baseActionProposal(),
    envelope: baseStateEnvelope({
      source_trust_level: 1,
      revocation_epoch: 42,
      containment_epoch: 7,
      key_epoch: 3,
      transaction_sequence_counter: 5,
    }),
    semantic: allowedSemantic(),
    tool_id: asAsciiSlug('tool.payment.transfer'),
    parameter_schema_version: asAsciiSlug(DEFAULT_PARAMETER_SCHEMA_VERSION),
    policy_decision_id: asAsciiSlug('policy-decision-001'),
    signing_key_id: DEFAULT_SIGNING_KEY_ID,
    ...overrides,
  };
}

export const HASH_A = asSha256Hex('sha256:' + 'a'.repeat(64));

export function invalidProposalInput(): ActionProposal {
  return {
    action: asAsciiSlug('payment.transfer'),
    amount_minor_units: 1.5,
    currency: asAsciiSlug('USD'),
    destination: asAsciiSlug('approved-vendor-001'),
    reason_code: asAsciiSlug('invoice-123'),
    payment_reference: asAsciiSlug('invoice-123'),
  } as unknown as ActionProposal;
}
