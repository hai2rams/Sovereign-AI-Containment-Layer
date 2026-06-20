import type { SemanticPolicyInput, SemanticRuleEvaluation } from '../types.js';
import { failed, passed, skipUnlessPayment, skipped } from './rule-helpers.js';

const RULE_ID = 'PAYMENT_REFERENCE_BINDING_RULE';

export function evaluatePaymentReferenceBindingRule(
  input: SemanticPolicyInput,
): SemanticRuleEvaluation {
  if (skipUnlessPayment(input, RULE_ID)) {
    return skipped(RULE_ID);
  }

  const reference = input.proposal.payment_reference;
  const invoice = input.policy.approved_invoice_references[reference];

  if (!invoice) {
    return failed(RULE_ID, 'high', 'PAYMENT_REFERENCE_UNKNOWN', 'blocked');
  }

  if (invoice.destination !== input.proposal.destination) {
    return failed(RULE_ID, 'high', 'PAYMENT_REFERENCE_DESTINATION_MISMATCH', 'blocked');
  }

  if (invoice.currency !== input.proposal.currency) {
    return failed(RULE_ID, 'high', 'PAYMENT_REFERENCE_CURRENCY_MISMATCH', 'blocked');
  }

  if (input.proposal.amount_minor_units > invoice.max_amount_minor_units) {
    return failed(
      RULE_ID,
      'high',
      'PAYMENT_REFERENCE_AMOUNT_EXCEEDS_APPROVED',
      'blocked',
    );
  }

  return passed(RULE_ID, 'medium');
}
