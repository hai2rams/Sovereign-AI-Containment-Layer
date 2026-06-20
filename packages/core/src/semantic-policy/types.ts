import type { ActionProposal } from '../types/action-proposal.js';
import type { StateEnvelope } from '../types/state-envelope.js';

export type SemanticRuleResultStatus = 'passed' | 'failed' | 'skipped';

export type SemanticSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type SemanticDecisionOnFail =
  | 'blocked'
  | 'requires_human_approval'
  | 'read_only'
  | 'quarantine';

export type FinalSemanticResult =
  | 'allowed'
  | 'blocked'
  | 'requires_human_approval'
  | 'read_only'
  | 'quarantine';

export interface SemanticRuleEvaluation {
  rule_id: string;
  rule_version: string;
  result: SemanticRuleResultStatus;
  severity: SemanticSeverity;
  reason_code?: string;
  decision_on_fail?: SemanticDecisionOnFail;
}

export interface SemanticValidationResult {
  accepted: boolean;
  engine: 'deterministic_semantic_rules_v1';
  action: string;
  rules_evaluated: SemanticRuleEvaluation[];
  final_semantic_result: FinalSemanticResult;
  reason_codes: string[];
}

export interface ApprovedInvoiceReference {
  destination: string;
  max_amount_minor_units: number;
  currency: string;
}

export interface PaymentPolicyContext {
  approved_destinations: readonly string[];
  max_amount_minor_units: number;
  approved_invoice_references: Record<string, ApprovedInvoiceReference>;
  allowed_user_roles_for_payment: readonly string[];
  require_attestation: boolean;
}

export interface SemanticPolicyInput {
  proposal: ActionProposal;
  envelope: StateEnvelope;
  policy: PaymentPolicyContext;
}

export const FINAL_SEMANTIC_RESULT_ORDER: readonly FinalSemanticResult[] = [
  'allowed',
  'requires_human_approval',
  'read_only',
  'blocked',
  'quarantine',
];

export const DECISION_ON_FAIL_TO_FINAL: Record<SemanticDecisionOnFail, FinalSemanticResult> = {
  blocked: 'blocked',
  requires_human_approval: 'requires_human_approval',
  read_only: 'read_only',
  quarantine: 'quarantine',
};

export function finalResultSeverity(result: FinalSemanticResult): number {
  return FINAL_SEMANTIC_RESULT_ORDER.indexOf(result);
}

export function strictestFinalResult(
  current: FinalSemanticResult,
  candidate: FinalSemanticResult,
): FinalSemanticResult {
  return finalResultSeverity(candidate) > finalResultSeverity(current) ? candidate : current;
}

export function isPaymentAction(action: string): boolean {
  return action === 'payment.transfer' || action.startsWith('payment.');
}
