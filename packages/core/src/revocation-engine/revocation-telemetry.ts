import { TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from '../telemetry/types.js';
import type { HeartbeatResult, RevocationTransitionResult } from './types.js';

export type RevocationTelemetryPayload = {
  telemetry_event: 'SESSION_RISK_STATE_UPDATED';
  revocation_engine: Record<string, unknown>;
};

export function buildRevocationTransitionTelemetryPayload(
  result: RevocationTransitionResult,
  signal: string,
): RevocationTelemetryPayload {
  return {
    telemetry_event: 'SESSION_RISK_STATE_UPDATED',
    revocation_engine: {
      transition_applied: result.applied,
      signal,
      previous_revocation_epoch: result.previous_revocation_epoch,
      revocation_epoch: result.updated_envelope.revocation_epoch,
      containment_epoch: result.updated_envelope.containment_epoch,
      revocation_status: result.updated_envelope.revocation_status,
      risk_mode: result.updated_envelope.risk_mode,
      tokens_invalidated: result.tokens_invalidated,
      revocation_state_root_changed:
        result.previous_revocation_state_root !== result.revocation_state_root,
    },
  };
}

export function buildHeartbeatTelemetryPayload(result: HeartbeatResult): RevocationTelemetryPayload {
  return {
    telemetry_event: 'SESSION_RISK_STATE_UPDATED',
    revocation_engine: {
      heartbeat_decision: result.decision,
      reason_codes: result.reason_codes,
      renewal_permitted: result.renewal_permitted,
      containment_epoch_matches: result.containment_epoch_matches,
    },
  };
}

export function assertRevocationTelemetrySafe(payload: RevocationTelemetryPayload): void {
  const serialized = JSON.stringify(payload);
  for (const forbidden of TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS) {
    if (serialized.includes(`"${forbidden}"`)) {
      throw new Error(`Telemetry payload must not include forbidden field: ${forbidden}`);
    }
  }
}
