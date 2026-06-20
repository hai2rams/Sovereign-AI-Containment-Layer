import type { SemanticPolicyInput, SemanticValidationResult } from './types.js';
import {
  DECISION_ON_FAIL_TO_FINAL,
  strictestFinalResult,
  type FinalSemanticResult,
  type SemanticRuleEvaluation,
} from './types.js';
import { evaluateDestinationAllowlistRule } from './rules/destination-allowlist-rule.js';
import { evaluateAmountLimitRule } from './rules/amount-limit-rule.js';
import { evaluatePaymentReferenceBindingRule } from './rules/payment-reference-binding-rule.js';
import { evaluateSourceTrustActionRule } from './rules/source-trust-action-rule.js';
import { evaluateUserRolePermissionRule } from './rules/user-role-permission-rule.js';
import { evaluateRiskModeActionRule } from './rules/risk-mode-action-rule.js';
import { evaluatePolicyReleaseStatusRule } from './rules/policy-release-status-rule.js';
import { evaluateAttestationRequiredRule } from './rules/attestation-required-rule.js';

const ENGINE_ID = 'deterministic_semantic_rules_v1' as const;

const RULE_EVALUATORS = [
  evaluatePolicyReleaseStatusRule,
  evaluateAttestationRequiredRule,
  evaluateRiskModeActionRule,
  evaluateSourceTrustActionRule,
  evaluateUserRolePermissionRule,
  evaluateDestinationAllowlistRule,
  evaluateAmountLimitRule,
  evaluatePaymentReferenceBindingRule,
] as const;

function aggregateFinalResult(rules: SemanticRuleEvaluation[]): FinalSemanticResult {
  let final: FinalSemanticResult = 'allowed';

  for (const rule of rules) {
    if (rule.result !== 'failed' || !rule.decision_on_fail) {
      continue;
    }
    const mapped = DECISION_ON_FAIL_TO_FINAL[rule.decision_on_fail];
    final = strictestFinalResult(final, mapped);
  }

  return final;
}

export class SemanticPolicyEngine {
  evaluate(input: SemanticPolicyInput): SemanticValidationResult {
    const rules_evaluated = RULE_EVALUATORS.map((evaluate) => evaluate(input));
    const final_semantic_result = aggregateFinalResult(rules_evaluated);
    const reason_codes = rules_evaluated
      .filter((rule) => rule.result === 'failed' && rule.reason_code)
      .map((rule) => rule.reason_code as string);

    return {
      accepted: final_semantic_result === 'allowed',
      engine: ENGINE_ID,
      action: input.proposal.action,
      rules_evaluated,
      final_semantic_result,
      reason_codes,
    };
  }
}

export function evaluateSemanticPolicy(input: SemanticPolicyInput): SemanticValidationResult {
  return new SemanticPolicyEngine().evaluate(input);
}
