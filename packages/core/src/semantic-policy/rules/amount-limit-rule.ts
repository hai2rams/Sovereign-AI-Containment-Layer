import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { failed, passed, skipUnlessPayment, skipped } from './rule-helpers.js';

const RULE_ID = 'AMOUNT_LIMIT_RULE';

export function evaluateAmountLimitRule(input: SemanticPolicyInput): SemanticRuleEvaluation {
  if (skipUnlessPayment(input, RULE_ID)) {
    return skipped(RULE_ID);
  }

  const amount = input.proposal.amount_minor_units;
  if (amount > input.policy.max_amount_minor_units) {
    return failed(RULE_ID, 'high', 'AMOUNT_EXCEEDS_LIMIT', 'blocked');
  }

  return passed(RULE_ID, 'low');
}
