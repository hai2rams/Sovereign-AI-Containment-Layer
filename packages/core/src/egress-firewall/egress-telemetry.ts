import { TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from '../telemetry/types.js';
import type { EgressVerificationResult } from './types.js';

export type EgressTelemetryPayload = {
  telemetry_event: 'EGRESS_CONTRACTION_APPLIED';
  egress_firewall: Record<string, unknown>;
};

export function buildEgressTelemetryPayload(result: EgressVerificationResult): EgressTelemetryPayload {
  return {
    telemetry_event: 'EGRESS_CONTRACTION_APPLIED',
    egress_firewall: {
      decision: result.decision,
      reason_codes: result.reason_codes,
      schema_valid: result.schema_valid,
      destination_allowed: result.destination_allowed,
      exfil_pattern_detected: result.exfil_pattern_detected,
      streaming_permitted: result.streaming_permitted,
      policy_hash_matches: result.policy_hash_matches,
      timing_pad_ms: result.timing_pad_ms,
      egress_transmitted: false,
    },
  };
}

export function assertEgressTelemetrySafe(payload: EgressTelemetryPayload): void {
  const serialized = JSON.stringify(payload);
  for (const forbidden of TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS) {
    if (serialized.includes(`"${forbidden}"`)) {
      throw new Error(`Telemetry payload must not include forbidden field: ${forbidden}`);
    }
  }
}
