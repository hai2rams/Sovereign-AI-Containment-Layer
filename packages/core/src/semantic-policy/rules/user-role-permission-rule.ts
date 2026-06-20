import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { failed, passed, skipUnlessPayment, skipped } from './rule-helpers.js';

const RULE_ID = 'USER_ROLE_PERMISSION_RULE';

export function evaluateUserRolePermissionRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  if (skipUnlessPayment(input, RULE_ID)) {
    return skipped(RULE_ID);
  }

  if (!input.policy.allowed_user_roles_for_payment.includes(input.envelope.user_role)) {
    return failed(RULE_ID, 'high', 'USER_ROLE_NOT_PERMITTED', 'blocked');
  }

  return passed(RULE_ID, 'low');
}
