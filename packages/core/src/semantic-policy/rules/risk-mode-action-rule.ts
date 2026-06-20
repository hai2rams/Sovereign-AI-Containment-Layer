import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { isPaymentAction } from '../types.js';
import { failed, passed, skipped } from './rule-helpers.js';

const RULE_ID = 'RISK_MODE_ACTION_RULE';

export function evaluateRiskModeActionRule(input: SemanticPolicyInput): SemanticRuleEvaluation {
  if (!isPaymentAction(input.proposal.action)) {
    return skipped(RULE_ID);
  }

  const mode = input.envelope.risk_mode;

  if (mode === 'normal') {
    return passed(RULE_ID, 'info');
  }

  if (mode === 'degraded') {
    return failed(RULE_ID, 'medium', 'RISK_MODE_RESTRICTS_STATE_CHANGE', 'requires_human_approval');
  }

  if (mode === 'read_only') {
    return failed(RULE_ID, 'high', 'RISK_MODE_RESTRICTS_STATE_CHANGE', 'blocked');
  }

  if (mode === 'quarantine') {
    return failed(RULE_ID, 'critical', 'SESSION_QUARANTINED', 'blocked');
  }

  return failed(RULE_ID, 'critical', 'SESSION_REVOKED', 'blocked');
}
