import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { isPaymentAction } from '../types.js';

export const RULE_VERSION = '1.0.0';

export type SemanticRule = {
  rule_id: string;
  rule_version: string;
  evaluate(input: SemanticPolicyInput): SemanticRuleEvaluation;
};

export function passed(rule_id: string, severity: SemanticRuleEvaluation['severity'] = 'info'): SemanticRuleEvaluation {
  return {
    rule_id,
    rule_version: RULE_VERSION,
    result: 'passed',
    severity,
  };
}

export function failed(
  rule_id: string,
  severity: SemanticRuleEvaluation['severity'],
  reason_code: string,
  decision_on_fail: NonNullable<SemanticRuleEvaluation['decision_on_fail']>,
): SemanticRuleEvaluation {
  return {
    rule_id,
    rule_version: RULE_VERSION,
    result: 'failed',
    severity,
    reason_code,
    decision_on_fail,
  };
}

export function skipped(rule_id: string): SemanticRuleEvaluation {
  return {
    rule_id,
    rule_version: RULE_VERSION,
    result: 'skipped',
    severity: 'info',
  };
}

export function skipUnlessPayment(input: SemanticPolicyInput, rule_id: string): boolean {
  if (!isPaymentAction(input.proposal.action)) {
    return true;
  }
  return false;
}
