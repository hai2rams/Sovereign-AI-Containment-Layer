import type { ActionProposal } from '../types/action-proposal.js';
import type { ParameterBoundActionToken } from '../token-broker/types.js';

export type ToolExecutionDecision = 'allowed' | 'blocked';

export const TOOL_EXECUTION_BLOCKED_REASONS = [
  'INVALID_TOKEN_SIGNATURE',
  'PARAMETER_HASH_MISMATCH',
  'ACTION_MISMATCH',
  'TOOL_ID_MISMATCH',
  'REVOCATION_EPOCH_MISMATCH',
  'CONTAINMENT_EPOCH_MISMATCH',
  'KEY_EPOCH_MISMATCH',
  'TOKEN_JTI_REUSED',
  'IDEMPOTENCY_KEY_REUSED',
  'RISK_MODE_BLOCKS_EXECUTION',
  'TOKEN_NOT_SINGLE_USE',
  'TOKEN_EXPIRED',
] as const;

export type ToolExecutionBlockedReason = (typeof TOOL_EXECUTION_BLOCKED_REASONS)[number];

export interface ToolExecutionVerificationRequest {
  token: ParameterBoundActionToken;
  execution_payload: ActionProposal;
  current_revocation_epoch: number;
  current_containment_epoch: number;
  current_key_epoch: number;
  used_jtis?: ReadonlySet<string>;
  used_idempotency_keys?: ReadonlySet<string>;
}

export interface ToolExecutionVerificationResult {
  decision: ToolExecutionDecision;
  reason_codes: string[];
  parameter_hash_matches: boolean;
  signature_valid: boolean;
  action_matches: boolean;
  revocation_epoch_matches: boolean;
  containment_epoch_matches: boolean;
  key_epoch_matches: boolean;
  jti_unused: boolean;
  idempotency_key_unused: boolean;
  risk_mode_permits_execution: boolean;
  downstream_tool_called: false;
  transaction_executed: false;
}

export type ToolExecutorVerifierOptions = {
  /** Epoch milliseconds for expiry check; defaults to Date.now(). */
  now_ms?: number;
};
