import { randomUUID } from 'node:crypto';
import type {
  TelemetryEventEnvelope,
  TelemetryEventStatus,
  TelemetryEventType,
} from './types.js';
import { hashTelemetryPayload, TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS } from './types.js';
import { computeEventHash } from './telemetry-hash-chain.js';

export const REQUIRED_ENVELOPE_FIELDS = [
  'schema_version',
  'event_id',
  'event_type',
  'event_status',
  'emitted_at',
  'session_id',
  'trace_id',
  'span_id',
  'parent_span_id',
  'event_sequence',
  'event_hash',
  'previous_event_hash',
  'payload',
] as const;

export type BuildTelemetryEventInput = {
  event_type: TelemetryEventType;
  session_id: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  event_sequence: number;
  previous_event_hash: string | null;
  payload?: Record<string, unknown>;
  event_status?: TelemetryEventStatus;
  emitted_at?: string;
  event_id?: string;
};

export function sanitizeTelemetryPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if ((TELEMETRY_FORBIDDEN_PAYLOAD_FIELDS as readonly string[]).includes(key)) {
      continue;
    }
    if (key === 'state_envelope' || key === 'full_envelope') {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function buildTelemetryEvent(input: BuildTelemetryEventInput): TelemetryEventEnvelope {
  const payload = sanitizeTelemetryPayload(input.payload ?? {});
  const emitted_at = input.emitted_at ?? new Date().toISOString();
  const event_id = input.event_id ?? randomUUID();

  const withoutHash: Omit<TelemetryEventEnvelope, 'event_hash'> = {
    schema_version: 'telemetry.v1',
    event_id,
    event_type: input.event_type,
    event_status: input.event_status ?? 'recorded',
    emitted_at,
    session_id: input.session_id,
    trace_id: input.trace_id,
    span_id: input.span_id,
    parent_span_id: input.parent_span_id ?? null,
    event_sequence: input.event_sequence,
    previous_event_hash: input.previous_event_hash,
    payload,
  };

  const event_hash = computeEventHash(withoutHash);

  return {
    ...withoutHash,
    event_hash,
  };
}

export function assertRequiredEnvelopeFields(event: TelemetryEventEnvelope): void {
  for (const field of REQUIRED_ENVELOPE_FIELDS) {
    if (!(field in event)) {
      throw new Error(`Missing required telemetry field: ${field}`);
    }
  }
  if (typeof event.event_sequence !== 'number' || !Number.isInteger(event.event_sequence)) {
    throw new Error('event_sequence must be an integer');
  }
}

export function payloadDigest(payload: Record<string, unknown>): string {
  return hashTelemetryPayload(payload);
}
