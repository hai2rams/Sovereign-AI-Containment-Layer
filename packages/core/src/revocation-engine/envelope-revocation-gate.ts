import type { StateEnvelope } from '../types/state-envelope.js';
import { killSwitchActive } from './risk-escalation.js';
import type { EnvelopeRevocationGateResult } from './types.js';

export function evaluateEnvelopeRevocationGate(
  envelope: StateEnvelope,
): EnvelopeRevocationGateResult {
  if (envelope.revocation_status !== 'active') {
    return { allowed: false, reason_code: 'REVOCATION_STATE_INVALID' };
  }
  if (killSwitchActive(envelope.risk_mode)) {
    return { allowed: false, reason_code: 'KILL_SWITCH_ACTIVE' };
  }
  return { allowed: true };
}
