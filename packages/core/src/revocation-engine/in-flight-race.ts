import { killSwitchActive } from './risk-escalation.js';
import type { InFlightRaceRequest, InFlightRaceResult } from './types.js';

export function resolveInFlightActionRace(request: InFlightRaceRequest): InFlightRaceResult {
  const { envelope, token } = request;
  const reason_codes: InFlightRaceResult['reason_codes'] = [];

  if (killSwitchActive(envelope.risk_mode)) {
    reason_codes.push('KILL_SWITCH_ACTIVE');
  }

  if (token.revocation_epoch < envelope.revocation_epoch) {
    reason_codes.push('IN_FLIGHT_REVOCATION_RACE');
  }

  if (token.containment_epoch < envelope.containment_epoch) {
    reason_codes.push('IN_FLIGHT_CONTAINMENT_EPOCH_RACE');
  }

  if (envelope.revocation_status !== 'active') {
    reason_codes.push('REVOCATION_STATE_INVALID');
  }

  const race_lost = reason_codes.length > 0;

  return {
    race_lost,
    reason_codes,
    action_permitted: !race_lost,
  };
}
