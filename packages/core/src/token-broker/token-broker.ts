import { asIsoTimestamp } from '../types/brands.js';
import { validateActionProposal } from '../validators/action-proposal-validator.js';
import type {
  ParameterBoundActionToken,
  TokenIssuanceBlockedReason,
  TokenIssuanceRequest,
  TokenIssuanceResult,
  UnsignedParameterBoundActionToken,
} from './types.js';
import {
  DEFAULT_SIGNING_KEY_ID,
  DEFAULT_TOKEN_TTL_MS,
} from './types.js';
import { computeParameterHash } from './parameter-hash.js';
import { generateIdempotencyKey } from './idempotency-key.js';
import { generateJti } from './jti.js';
import { buildUnsignedTokenClaims } from './token-claims.js';
import { evaluateTokenPolicyGate } from './token-policy-gate.js';
import { MockTokenSigner, type TokenSigner } from './mock-signer.js';
import { TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from '../telemetry/types.js';

export type TokenIssuanceTelemetryPayload = {
  telemetry_event: 'TOKEN_ISSUANCE_DECISION';
  token_broker: Record<string, unknown>;
};

export type TokenBrokerOptions = {
  signer?: TokenSigner;
  default_ttl_ms?: number;
};

function blocked(
  reason_code: TokenIssuanceBlockedReason,
  parameter_hash?: TokenIssuanceResult['parameter_hash'],
): TokenIssuanceResult {
  return {
    decision: 'blocked',
    reason_code,
    parameter_hash,
  };
}

export class TokenBroker {
  private readonly defaultTtlMs: number;

  constructor(
    private readonly signer: TokenSigner = new MockTokenSigner(DEFAULT_SIGNING_KEY_ID),
    options: TokenBrokerOptions = {},
  ) {
    this.defaultTtlMs = options.default_ttl_ms ?? DEFAULT_TOKEN_TTL_MS;
  }

  issueToken(request: TokenIssuanceRequest): TokenIssuanceResult {
    const proposalValidation = validateActionProposal(request.proposal);
    if (!proposalValidation.ok) {
      return blocked('INVALID_ACTION_PROPOSAL');
    }

    const gate = evaluateTokenPolicyGate(request.semantic.final_semantic_result);
    if (!gate.allowed) {
      return blocked(gate.reason_code);
    }

    let parameter_hash;
    try {
      parameter_hash = computeParameterHash(proposalValidation.value);
    } catch {
      return blocked('INVALID_PARAMETER_HASH_INPUT');
    }

    const issuedAt = request.issued_at ?? asIsoTimestamp(new Date().toISOString());
    const ttl = request.ttl_ms ?? this.defaultTtlMs;
    const expiresAt = asIsoTimestamp(new Date(Date.parse(issuedAt) + ttl).toISOString());

    const envelope = request.envelope;
    const jti = generateJti(envelope.session_id, envelope.transaction_sequence_counter);
    const idempotency_key = generateIdempotencyKey({
      session_id: envelope.session_id,
      transaction_sequence_counter: envelope.transaction_sequence_counter,
      policy_hash: envelope.policy_hash,
      parameter_hash,
      action: proposalValidation.value.action,
      tool_id: request.tool_id,
      revocation_epoch: envelope.revocation_epoch,
    });

    const signing_key_id = request.signing_key_id ?? this.signer.signing_key_id;

    const unsigned = buildUnsignedTokenClaims({
      session_id: envelope.session_id,
      release_id: envelope.release_id,
      policy_hash: envelope.policy_hash,
      policy_decision_id: request.policy_decision_id,
      action: proposalValidation.value.action,
      tool_id: request.tool_id,
      parameter_schema_version: request.parameter_schema_version,
      parameter_hash,
      source_trust_level: envelope.source_trust_level,
      risk_mode: envelope.risk_mode,
      revocation_epoch: envelope.revocation_epoch,
      containment_epoch: envelope.containment_epoch,
      key_epoch: envelope.key_epoch,
      issued_at: issuedAt,
      expires_at: expiresAt,
      idempotency_key,
      jti,
      signing_key_id,
    });

    let signature: string;
    try {
      signature = this.signer.sign(unsigned);
    } catch {
      return blocked('TOKEN_SIGNING_FAILED', parameter_hash);
    }

    const token: ParameterBoundActionToken = { ...unsigned, signature };

    return {
      decision: 'issued',
      token,
      parameter_hash,
    };
  }
}

export function buildTokenIssuanceTelemetryPayload(
  result: TokenIssuanceResult,
): TokenIssuanceTelemetryPayload {
  if (result.decision === 'issued' && result.token) {
    return {
      telemetry_event: 'TOKEN_ISSUANCE_DECISION',
      token_broker: {
        token_issued: true,
        parameter_hash: result.parameter_hash,
        signing_key_id: result.token.signing_key_id,
        key_epoch: result.token.key_epoch,
        revocation_epoch: result.token.revocation_epoch,
        containment_epoch: result.token.containment_epoch,
        single_use: true,
      },
    };
  }

  return {
    telemetry_event: 'TOKEN_ISSUANCE_DECISION',
    token_broker: {
      token_issued: false,
      reason_code: result.reason_code,
      parameter_hash_created: result.parameter_hash !== undefined,
      idempotency_key_created: false,
      signing_key_used: false,
    },
  };
}

export function assertTokenIssuanceTelemetrySafe(payload: TokenIssuanceTelemetryPayload): void {
  const serialized = JSON.stringify(payload);
  for (const forbidden of TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS) {
    if (serialized.includes(`"${forbidden}"`)) {
      throw new Error(`Telemetry payload must not include forbidden field: ${forbidden}`);
    }
  }
  if (serialized.includes('mock_sig_v1:')) {
    throw new Error('Telemetry payload must not include raw token signature');
  }
}
