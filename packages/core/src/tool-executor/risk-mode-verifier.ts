import type { ActionProposal } from '../types/action-proposal.js';
import type { RiskMode } from '../types/risk.js';
import { isPaymentAction } from '../semantic-policy/types.js';

const BLOCKED_RISK_MODES: ReadonlySet<RiskMode> = new Set(['quarantine', 'revoked']);

export function verifyRiskModePermitsExecution(
  risk_mode: RiskMode,
  execution_payload: ActionProposal,
): boolean {
  if (BLOCKED_RISK_MODES.has(risk_mode)) {
    return false;
  }
  if (risk_mode === 'read_only' && isStateChangingAction(execution_payload)) {
    return false;
  }
  return true;
}

function isStateChangingAction(proposal: ActionProposal): boolean {
  return isPaymentAction(proposal.action) || proposal.action.includes('.');
}
