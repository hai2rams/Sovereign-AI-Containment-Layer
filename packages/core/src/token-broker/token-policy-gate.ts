import type { FinalSemanticResult } from '../semantic-policy/types.js';
import type { TokenIssuanceBlockedReason } from './types.js';

export type TokenPolicyGateResult =
  | { allowed: true }
  | { allowed: false; reason_code: TokenIssuanceBlockedReason };

const RISK_BLOCKED_RESULTS: ReadonlySet<FinalSemanticResult> = new Set([
  'read_only',
  'quarantine',
]);

export function evaluateTokenPolicyGate(
  final_semantic_result: FinalSemanticResult,
): TokenPolicyGateResult {
  if (final_semantic_result === 'allowed') {
    return { allowed: true };
  }
  if (final_semantic_result === 'blocked') {
    return { allowed: false, reason_code: 'POLICY_DECISION_BLOCKED' };
  }
  if (final_semantic_result === 'requires_human_approval') {
    return { allowed: false, reason_code: 'POLICY_REQUIRES_HUMAN_APPROVAL' };
  }
  if (RISK_BLOCKED_RESULTS.has(final_semantic_result)) {
    return { allowed: false, reason_code: 'RISK_MODE_BLOCKS_TOKEN' };
  }
  return { allowed: false, reason_code: 'RISK_MODE_BLOCKS_TOKEN' };
}
