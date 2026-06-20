import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { validateAsciiSlug } from '../../validators/ascii-slug.js';
import { failed, passed, skipUnlessPayment, skipped } from './rule-helpers.js';

const RULE_ID = 'ATTESTATION_REQUIRED_RULE';

export function evaluateAttestationRequiredRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  if (!input.policy.require_attestation) {
    return skipped(RULE_ID);
  }

  if (skipUnlessPayment(input, RULE_ID)) {
    return skipped(RULE_ID);
  }

  const attestation = validateAsciiSlug(input.envelope.attestation_id);
  if (!attestation.ok) {
    return failed(RULE_ID, 'high', 'ATTESTATION_REQUIRED', 'blocked');
  }

  return passed(RULE_ID, 'medium');
}
