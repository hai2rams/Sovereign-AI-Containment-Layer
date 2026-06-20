import { createHash } from 'node:crypto';

/** Canonical telemetry event kinds (M3). */
export const TELEMETRY_EVENT_TYPES = [
  'SESSION_STARTED',
  'INPUT_SOURCE_CLASSIFIED',
  'SANITIZED_TASK_PACKET_CREATED',
  'INFERENCE_PROPOSAL_INGESTED',
  'STRICT_JSON_INTAKE_COMPLETED',
  'STRUCTURAL_VALIDATION_COMPLETED',
  'SEMANTIC_VALIDATION_COMPLETED',
  'ADVISORY_CLASSIFIER_COMPLETED',
  'POLICY_DECISION_ISSUED',
  'TOKEN_ISSUANCE_DECISION',
  'TOOL_EXECUTOR_VERIFICATION_COMPLETED',
  'TOOL_EXECUTION_DECISION',
  'EGRESS_CONTRACTION_APPLIED',
  'AUDIT_RECEIPT_WRITTEN',
  'SESSION_RISK_STATE_UPDATED',
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

export type TelemetryEventStatus = 'recorded' | 'skipped' | 'placeholder';

/** Fields that must never appear in telemetry payloads. */
export const TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS = [
  'idempotency_key',
  'action_token_id',
  'action_token',
  'token_secret',
  'private_key',
  'signature',
  'state_envelope',
  'StateEnvelope',
] as const;

export type TelemetryEventEnvelope = {
  schema_version: 'telemetry.v1';
  event_id: string;
  event_type: TelemetryEventType;
  event_status: TelemetryEventStatus;
  emitted_at: string;
  session_id: string;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  event_sequence: number;
  event_hash: string;
  previous_event_hash: string | null;
  payload: Record<string, unknown>;
};

export function isTelemetryEventType(value: string): value is TelemetryEventType {
  return (TELEMETRY_EVENT_TYPES as readonly string[]).includes(value);
}

export function hashTelemetryPayload(data: Record<string, unknown>): string {
  const canonical = stableStringify(data);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}
