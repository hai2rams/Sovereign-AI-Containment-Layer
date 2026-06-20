import { asAsciiSlug, type AsciiSlug } from '../types/brands.js';
import { TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from '../telemetry/types.js';
import type {
  ToolExecutionBlockedReason,
  ToolExecutionVerificationRequest,
  ToolExecutionVerificationResult,
  ToolExecutorVerifierOptions,
} from './types.js';
import { buildVerificationResult, emptyVerificationFlags } from './verification-result.js';
import { verifyParameterHash } from './parameter-verifier.js';
import {
  verifyTokenNotExpired,
  verifyTokenSignature,
  verifyTokenSingleUse,
} from './token-verifier.js';
import {
  verifyContainmentEpoch,
  verifyKeyEpoch,
  verifyRevocationEpoch,
} from './epoch-verifier.js';
import { verifyIdempotencyKeyUnused, verifyJtiUnused } from './replay-verifier.js';
import { verifyRiskModePermitsExecution } from './risk-mode-verifier.js';

export function deriveToolIdFromAction(action: AsciiSlug): AsciiSlug {
  return asAsciiSlug(`tool.${action}`);
}

export function verifyToolExecution(
  request: ToolExecutionVerificationRequest,
  options: ToolExecutorVerifierOptions = {},
): ToolExecutionVerificationResult {
  const now_ms = options.now_ms ?? Date.now();
  const { token, execution_payload } = request;
  const flags = emptyVerificationFlags();
  const reason_codes: ToolExecutionBlockedReason[] = [];

  flags.signature_valid = verifyTokenSignature(token);
  if (!flags.signature_valid) {
    reason_codes.push('INVALID_TOKEN_SIGNATURE');
  }

  if (!verifyTokenSingleUse(token)) {
    reason_codes.push('TOKEN_NOT_SINGLE_USE');
  } else {
    // single_use flag satisfied when true
  }

  if (!verifyTokenNotExpired(token, now_ms)) {
    reason_codes.push('TOKEN_EXPIRED');
  }

  flags.action_matches = token.action === execution_payload.action;
  if (!flags.action_matches) {
    reason_codes.push('ACTION_MISMATCH');
  }

  const expectedToolId = deriveToolIdFromAction(execution_payload.action);
  if (token.tool_id !== expectedToolId) {
    reason_codes.push('TOOL_ID_MISMATCH');
  }

  flags.parameter_hash_matches = verifyParameterHash(token.parameter_hash, execution_payload);
  if (!flags.parameter_hash_matches) {
    reason_codes.push('PARAMETER_HASH_MISMATCH');
  }

  flags.revocation_epoch_matches = verifyRevocationEpoch(
    token,
    request.current_revocation_epoch,
  );
  if (!flags.revocation_epoch_matches) {
    reason_codes.push('REVOCATION_EPOCH_MISMATCH');
  }

  flags.containment_epoch_matches = verifyContainmentEpoch(
    token,
    request.current_containment_epoch,
  );
  if (!flags.containment_epoch_matches) {
    reason_codes.push('CONTAINMENT_EPOCH_MISMATCH');
  }

  flags.key_epoch_matches = verifyKeyEpoch(token, request.current_key_epoch);
  if (!flags.key_epoch_matches) {
    reason_codes.push('KEY_EPOCH_MISMATCH');
  }

  flags.jti_unused = verifyJtiUnused(token, request.used_jtis);
  if (!flags.jti_unused) {
    reason_codes.push('TOKEN_JTI_REUSED');
  }

  flags.idempotency_key_unused = verifyIdempotencyKeyUnused(
    token,
    request.used_idempotency_keys,
  );
  if (!flags.idempotency_key_unused) {
    reason_codes.push('IDEMPOTENCY_KEY_REUSED');
  }

  flags.risk_mode_permits_execution = verifyRiskModePermitsExecution(
    token.risk_mode,
    execution_payload,
  );
  if (!flags.risk_mode_permits_execution) {
    reason_codes.push('RISK_MODE_BLOCKS_EXECUTION');
  }

  return buildVerificationResult(reason_codes, flags);
}

export type ToolExecutorVerificationTelemetryPayload = {
  telemetry_event: 'TOOL_EXECUTOR_VERIFICATION_COMPLETED';
  tool_executor_verification: Record<string, unknown>;
};

export function buildToolExecutorVerificationTelemetryPayload(
  result: ToolExecutionVerificationResult,
): ToolExecutorVerificationTelemetryPayload {
  const primaryReason = result.reason_codes[0];
  return {
    telemetry_event: 'TOOL_EXECUTOR_VERIFICATION_COMPLETED',
    tool_executor_verification: {
      verification_result: result.decision,
      ...(primaryReason ? { reason_code: primaryReason } : {}),
      signature_valid: result.signature_valid,
      parameter_hash_matches: result.parameter_hash_matches,
      revocation_epoch_matches: result.revocation_epoch_matches,
      containment_epoch_matches: result.containment_epoch_matches,
      key_epoch_matches: result.key_epoch_matches,
      idempotency_key_unused: result.idempotency_key_unused,
      jti_unused: result.jti_unused,
      downstream_tool_called: false,
      transaction_executed: false,
    },
  };
}

export function assertToolExecutorVerificationTelemetrySafe(
  payload: ToolExecutorVerificationTelemetryPayload,
): void {
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
