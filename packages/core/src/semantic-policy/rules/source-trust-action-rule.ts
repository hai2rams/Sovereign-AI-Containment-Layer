import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { isPaymentAction } from '../types.js';
import { failed, passed } from './rule-helpers.js';

const RULE_ID = 'SOURCE_TRUST_ACTION_RULE';

export function evaluateSourceTrustActionRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  const trust = input.envelope.source_trust_level;
  const stateChangingPayment =
    isPaymentAction(input.proposal.action) && input.proposal.action !== 'payment.read';

  if (!stateChangingPayment) {
    return passed(RULE_ID, 'info');
  }

  if (trust <= 2) {
    return passed(RULE_ID, 'low');
  }

  if (trust === 3) {
    return failed(RULE_ID, 'medium', 'LOW_SOURCE_TRUST_FOR_STATE_CHANGE', 'requires_human_approval');
  }

  if (trust === 4) {
    return failed(RULE_ID, 'high', 'UNKNOWN_OR_ADVERSARIAL_SOURCE', 'read_only');
  }

  return failed(RULE_ID, 'critical', 'UNKNOWN_OR_ADVERSARIAL_SOURCE', 'quarantine');
}
