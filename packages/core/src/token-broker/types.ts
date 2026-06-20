import type { ActionProposal } from '../types/action-proposal.js';
import type { AsciiSlug, IsoTimestamp, Sha256Hex } from '../types/brands.js';
import type { RiskMode, SourceTrustLevel } from '../types/risk.js';
import type { SemanticValidationResult } from '../semantic-policy/types.js';
import type { StateEnvelope } from '../types/state-envelope.js';

import { asAsciiSlug } from '../types/brands.js';

export const TOKEN_TYPE_PARAMETER_BOUND = 'parameter_bound_action_capability' as const;
export const TOKEN_ISSUER = 'sovereign-containment-token-broker' as const;
export const DEFAULT_PARAMETER_SCHEMA_VERSION = 'action_proposal_v1' as const;
export const DEFAULT_SIGNING_KEY_ID = asAsciiSlug('session_key_001');
export const DEFAULT_TOKEN_TTL_MS = 5 * 60 * 1000;

export type TokenIssuanceDecision = 'issued' | 'blocked';

export const TOKEN_ISSUANCE_BLOCKED_REASONS = [
  'POLICY_DECISION_BLOCKED',
  'POLICY_REQUIRES_HUMAN_APPROVAL',
  'RISK_MODE_BLOCKS_TOKEN',
  'INVALID_ACTION_PROPOSAL',
  'INVALID_PARAMETER_HASH_INPUT',
  'TOKEN_SIGNING_FAILED',
] as const;

export type TokenIssuanceBlockedReason = (typeof TOKEN_ISSUANCE_BLOCKED_REASONS)[number];

export interface ParameterBoundActionToken {
  token_type: typeof TOKEN_TYPE_PARAMETER_BOUND;
  issuer: typeof TOKEN_ISSUER;
  session_id: AsciiSlug;
  release_id: AsciiSlug;
  policy_hash: Sha256Hex;
  policy_decision_id: AsciiSlug;
  action: AsciiSlug;
  tool_id: AsciiSlug;
  parameter_schema_version: AsciiSlug;
  parameter_hash: Sha256Hex;
  source_trust_level: SourceTrustLevel;
  risk_mode: RiskMode;
  revocation_epoch: number;
  containment_epoch: number;
  key_epoch: number;
  issued_at: IsoTimestamp;
  expires_at: IsoTimestamp;
  idempotency_key: AsciiSlug;
  jti: AsciiSlug;
  single_use: true;
  signing_key_id: AsciiSlug;
  signature: string;
}

export type UnsignedParameterBoundActionToken = Omit<ParameterBoundActionToken, 'signature'>;

export interface TokenIssuanceResult {
  decision: TokenIssuanceDecision;
  reason_code?: TokenIssuanceBlockedReason;
  token?: ParameterBoundActionToken;
  parameter_hash?: Sha256Hex;
}

export interface TokenIssuanceRequest {
  proposal: ActionProposal;
  envelope: StateEnvelope;
  semantic: SemanticValidationResult;
  tool_id: AsciiSlug;
  parameter_schema_version: AsciiSlug;
  policy_decision_id: AsciiSlug;
  signing_key_id?: AsciiSlug;
  ttl_ms?: number;
  issued_at?: IsoTimestamp;
}
