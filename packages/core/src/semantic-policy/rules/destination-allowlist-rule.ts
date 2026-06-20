import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { failed, passed, skipUnlessPayment, skipped } from './rule-helpers.js';

const RULE_ID = 'DESTINATION_ALLOWLIST_RULE';

export function evaluateDestinationAllowlistRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  if (skipUnlessPayment(input, RULE_ID)) {
    return skipped(RULE_ID);
  }

  const destination = input.proposal.destination;
  if (!input.policy.approved_destinations.includes(destination)) {
    return failed(RULE_ID, 'high', 'DESTINATION_NOT_ALLOWLISTED', 'blocked');
  }

  return passed(RULE_ID, 'low');
}
