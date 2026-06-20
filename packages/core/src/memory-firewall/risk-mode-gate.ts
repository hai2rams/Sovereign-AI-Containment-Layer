import type { RiskMode } from '../types/risk.js';

const BLOCKED_WRITE_RISK_MODES: ReadonlySet<RiskMode> = new Set([
  'quarantine',
  'revoked',
  'read_only',
]);

export function riskModePermitsMemoryWrite(risk_mode: RiskMode): boolean {
  return !BLOCKED_WRITE_RISK_MODES.has(risk_mode);
}
