import type { ParameterBoundActionToken } from '../token-broker/types.js';
import type { StateEnvelope } from '../types/state-envelope.js';
import { killSwitchActive } from './risk-escalation.js';

export function isTokenInvalidatedByRevocation(
  token: Pick<ParameterBoundActionToken, 'revocation_epoch' | 'containment_epoch' | 'key_epoch'>,
  envelope: StateEnvelope,
): boolean {
  if (token.revocation_epoch < envelope.revocation_epoch) {
    return true;
  }
  if (token.containment_epoch < envelope.containment_epoch) {
    return true;
  }
  if (envelope.security_escalation && token.key_epoch < envelope.key_epoch) {
    return true;
  }
  if (envelope.revocation_status !== 'active') {
    return true;
  }
  if (killSwitchActive(envelope.risk_mode)) {
    return true;
  }
  return false;
}
