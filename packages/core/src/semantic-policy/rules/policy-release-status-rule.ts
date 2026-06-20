import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { failed, passed } from './rule-helpers.js';

const RULE_ID = 'POLICY_RELEASE_STATUS_RULE';

export function evaluatePolicyReleaseStatusRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  if (input.envelope.release_status !== 'certified') {
    return failed(RULE_ID, 'high', 'RELEASE_NOT_CERTIFIED', 'blocked');
  }

  if (input.envelope.revocation_status !== 'active') {
    return failed(RULE_ID, 'critical', 'RELEASE_REVOKED', 'blocked');
  }

  return passed(RULE_ID, 'medium');
}
