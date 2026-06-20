import type { AsciiSlug, IsoTimestamp, Sha256Hex } from '../types/brands.js';
import type { RiskMode, SourceTrustLevel } from '../types/risk.js';
import {
  TOKEN_ISSUER,
  TOKEN_TYPE_PARAMETER_BOUND,
  type UnsignedParameterBoundActionToken,
} from './types.js';

/** Fields the model must never control on a token. */
export const MODEL_FORBIDDEN_TOKEN_FIELDS = [
  'jti',
  'idempotency_key',
  'signature',
  'signing_key_id',
  'key_epoch',
  'revocation_epoch',
  'containment_epoch',
  'policy_hash',
  'parameter_hash',
  'issued_at',
  'expires_at',
  'token_type',
  'issuer',
  'single_use',
] as const;

export function assertNoModelSuppliedTokenFields(
  record: Record<string, unknown>,
): { ok: true } | { ok: false; field: string } {
  for (const field of MODEL_FORBIDDEN_TOKEN_FIELDS) {
    if (field in record) {
      return { ok: false, field };
    }
  }
  return { ok: true };
}

export type BuildTokenClaimsInput = {
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
  signing_key_id: AsciiSlug;
};

export function buildUnsignedTokenClaims(input: BuildTokenClaimsInput): UnsignedParameterBoundActionToken {
  return {
    token_type: TOKEN_TYPE_PARAMETER_BOUND,
    issuer: TOKEN_ISSUER,
    session_id: input.session_id,
    release_id: input.release_id,
    policy_hash: input.policy_hash,
    policy_decision_id: input.policy_decision_id,
    action: input.action,
    tool_id: input.tool_id,
    parameter_schema_version: input.parameter_schema_version,
    parameter_hash: input.parameter_hash,
    source_trust_level: input.source_trust_level,
    risk_mode: input.risk_mode,
    revocation_epoch: input.revocation_epoch,
    containment_epoch: input.containment_epoch,
    key_epoch: input.key_epoch,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
    idempotency_key: input.idempotency_key,
    jti: input.jti,
    single_use: true,
    signing_key_id: input.signing_key_id,
  };
}
