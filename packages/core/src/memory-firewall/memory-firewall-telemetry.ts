import { TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from '../telemetry/types.js';
import type { MemoryReadResult, MemoryWriteResult } from './types.js';

export type MemoryFirewallTelemetryPayload = {
  telemetry_event: 'MEMORY_FIREWALL_DECISION';
  memory_firewall: Record<string, unknown>;
};

export function buildMemoryWriteTelemetryPayload(result: MemoryWriteResult): MemoryFirewallTelemetryPayload {
  return {
    telemetry_event: 'MEMORY_FIREWALL_DECISION',
    memory_firewall: {
      operation: 'write',
      decision: result.decision,
      reason_codes: result.reason_codes,
      quarantine_recommended: result.quarantine_recommended,
      memory_quota_status: result.updated_memory_quota.memory_quota_status,
      payload_stored: false,
    },
  };
}

export function buildMemoryReadTelemetryPayload(result: MemoryReadResult): MemoryFirewallTelemetryPayload {
  return {
    telemetry_event: 'MEMORY_FIREWALL_DECISION',
    memory_firewall: {
      operation: 'read',
      decision: result.decision,
      reason_codes: result.reason_codes,
      trust_depreciated: result.trust_depreciated,
      effective_trust_level: result.effective_trust_level,
      payload_returned: false,
    },
  };
}

export function assertMemoryFirewallTelemetrySafe(payload: MemoryFirewallTelemetryPayload): void {
  const serialized = JSON.stringify(payload);
  for (const forbidden of TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS) {
    if (serialized.includes(`"${forbidden}"`)) {
      throw new Error(`Telemetry payload must not include forbidden field: ${forbidden}`);
    }
  }
}
