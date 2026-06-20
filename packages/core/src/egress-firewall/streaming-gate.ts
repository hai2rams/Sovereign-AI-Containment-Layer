import type { RiskMode } from '../types/risk.js';

const STREAMING_BLOCKED_RISK_MODES: ReadonlySet<RiskMode> = new Set([
  'quarantine',
  'revoked',
]);

export function streamingPermitted(risk_mode: RiskMode, streaming_requested: boolean): boolean {
  if (!streaming_requested) {
    return true;
  }
  return !STREAMING_BLOCKED_RISK_MODES.has(risk_mode);
}

export function riskModePermitsEgress(risk_mode: RiskMode): boolean {
  return risk_mode !== 'revoked';
}
