import type { ActionProposal } from '../types/action-proposal.js';
import { ACTION_PROPOSAL_ALLOWED_FIELDS } from '../types/action-proposal.js';
import { stableStringify } from '../telemetry/types.js';

/**
 * Deterministic canonical serialization for validated ActionProposal parameters.
 *
 * **Limitation (M5):** This is a locked local canonicalizer for flat primitive objects —
 * not full RFC 8785 (JCS). Nested objects are not used in ActionProposal v1. Key order is
 * lexicographic; JSON key reorder in source input does not change the hash after validation.
 */
export type ApprovedExecutionParameters = {
  action: string;
  amount_minor_units: number;
  currency: string;
  destination: string;
  reason_code: string;
  payment_reference: string;
};

export class ParameterCanonicalizerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParameterCanonicalizerError';
  }
}

export function actionProposalToApprovedParameters(
  proposal: ActionProposal,
): ApprovedExecutionParameters {
  return {
    action: proposal.action,
    amount_minor_units: proposal.amount_minor_units,
    currency: proposal.currency,
    destination: proposal.destination,
    reason_code: proposal.reason_code,
    payment_reference: proposal.payment_reference,
  };
}

export function canonicalizeApprovedParameters(params: ApprovedExecutionParameters): string {
  for (const key of ACTION_PROPOSAL_ALLOWED_FIELDS) {
    const value = params[key as keyof ApprovedExecutionParameters];
    if (value === undefined) {
      throw new ParameterCanonicalizerError(`Missing required parameter field: ${key}`);
    }
    if (key === 'amount_minor_units') {
      if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
        throw new ParameterCanonicalizerError('amount_minor_units must be a safe integer');
      }
      continue;
    }
    if (typeof value !== 'string') {
      throw new ParameterCanonicalizerError(`Field ${key} must be a string`);
    }
  }

  const unknown = Object.keys(params).filter(
    (k) => !(ACTION_PROPOSAL_ALLOWED_FIELDS as readonly string[]).includes(k),
  );
  if (unknown.length > 0) {
    throw new ParameterCanonicalizerError(`Unknown parameter field(s): ${unknown.join(', ')}`);
  }

  return stableStringify(params);
}

export function canonicalizeActionProposal(proposal: ActionProposal): string {
  return canonicalizeApprovedParameters(actionProposalToApprovedParameters(proposal));
}
