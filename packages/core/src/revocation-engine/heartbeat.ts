import { killSwitchActive } from './risk-escalation.js';
import type { HeartbeatRequest, HeartbeatResult } from './types.js';

export const DEFAULT_MAX_RENEWALS_PER_SESSION = 8;

export function evaluateHeartbeat(request: HeartbeatRequest): HeartbeatResult {
  const {
    envelope,
    nonce,
    containment_epoch,
    renewal_count,
    seen_nonces,
    max_renewals_per_session,
  } = request;

  const reason_codes: HeartbeatResult['reason_codes'] = [];
  const containment_epoch_matches = containment_epoch === envelope.containment_epoch;

  if (!containment_epoch_matches) {
    reason_codes.push('HEARTBEAT_CONTAINMENT_EPOCH_MISMATCH');
  }

  if (envelope.revocation_status !== 'active' || killSwitchActive(envelope.risk_mode)) {
    reason_codes.push('HEARTBEAT_REVOCATION_BLOCKS_RENEWAL');
  }

  if (envelope.renewal_in_flight) {
    reason_codes.push('HEARTBEAT_RENEWAL_IN_FLIGHT');
  }

  if (seen_nonces.has(nonce)) {
    reason_codes.push('HEARTBEAT_NONCE_REPLAY');
  }

  if (renewal_count >= max_renewals_per_session) {
    reason_codes.push('HEARTBEAT_RENEWAL_CEILING_EXCEEDED');
  }

  if (reason_codes.length > 0) {
    return {
      decision: 'blocked',
      reason_codes,
      renewal_permitted: false,
      containment_epoch_matches,
    };
  }

  return {
    decision: 'allowed',
    reason_codes: [],
    renewal_permitted: true,
    containment_epoch_matches,
  };
}
