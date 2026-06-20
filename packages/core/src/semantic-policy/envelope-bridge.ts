import type { PolicyDecision } from '../types/risk.js';
import type { RiskMode } from '../types/risk.js';
import { RISK_MODE_SEVERITY } from '../types/risk.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import type { FinalSemanticResult, SemanticValidationResult } from './types.js';

export function mapSemanticResultToPolicyDecision(
  result: FinalSemanticResult,
): PolicyDecision {
  switch (result) {
    case 'allowed':
      return 'allow';
    case 'requires_human_approval':
      return 'defer';
    case 'read_only':
    case 'blocked':
    case 'quarantine':
      return 'deny';
    default:
      return 'deny';
  }
}

function riskModeFromSemanticResult(result: FinalSemanticResult): RiskMode | null {
  if (result === 'quarantine') {
    return 'quarantine';
  }
  if (result === 'read_only') {
    return 'read_only';
  }
  return null;
}

export function applySemanticResultToEnvelope(
  envelope: StateEnvelope,
  semantic: SemanticValidationResult,
): StateEnvelope {
  const policy_decision = mapSemanticResultToPolicyDecision(semantic.final_semantic_result);
  const proposedRisk = riskModeFromSemanticResult(semantic.final_semantic_result);

  let risk_mode = envelope.risk_mode;
  if (proposedRisk !== null) {
    if (RISK_MODE_SEVERITY[proposedRisk] > RISK_MODE_SEVERITY[risk_mode]) {
      risk_mode = proposedRisk;
    }
  }

  return {
    ...envelope,
    policy_decision,
    risk_mode,
  };
}
