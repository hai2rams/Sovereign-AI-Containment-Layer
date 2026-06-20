import type {
  ToolExecutionBlockedReason,
  ToolExecutionDecision,
  ToolExecutionVerificationResult,
} from './types.js';

export type VerificationFlags = Pick<
  ToolExecutionVerificationResult,
  | 'parameter_hash_matches'
  | 'signature_valid'
  | 'action_matches'
  | 'revocation_epoch_matches'
  | 'containment_epoch_matches'
  | 'key_epoch_matches'
  | 'jti_unused'
  | 'idempotency_key_unused'
  | 'risk_mode_permits_execution'
>;

export function emptyVerificationFlags(): VerificationFlags {
  return {
    parameter_hash_matches: false,
    signature_valid: false,
    action_matches: false,
    revocation_epoch_matches: false,
    containment_epoch_matches: false,
    key_epoch_matches: false,
    jti_unused: false,
    idempotency_key_unused: false,
    risk_mode_permits_execution: false,
  };
}

export function buildVerificationResult(
  reason_codes: ToolExecutionBlockedReason[],
  flags: VerificationFlags,
): ToolExecutionVerificationResult {
  const decision: ToolExecutionDecision = reason_codes.length === 0 ? 'allowed' : 'blocked';
  return {
    decision,
    reason_codes,
    ...flags,
    downstream_tool_called: false,
    transaction_executed: false,
  };
}
