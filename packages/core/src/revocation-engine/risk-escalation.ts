import type { RiskMode } from '../types/risk.js';
import { RISK_MODE_SEVERITY } from '../types/risk.js';
import type { RevocationSignal } from './types.js';

export function escalateRiskMode(current: RiskMode, proposed: RiskMode): RiskMode {
  if (RISK_MODE_SEVERITY[proposed] > RISK_MODE_SEVERITY[current]) {
    return proposed;
  }
  return current;
}

export function riskModeForRevocationSignal(signal: RevocationSignal, current: RiskMode): RiskMode {
  if (signal === 'revoke') {
    return escalateRiskMode(current, 'revoked');
  }
  if (signal === 'quarantine' || signal === 'security_escalation') {
    return escalateRiskMode(current, 'quarantine');
  }
  return current;
}

export function killSwitchActive(risk_mode: RiskMode): boolean {
  return risk_mode === 'quarantine' || risk_mode === 'revoked';
}
