import { randomUUID } from 'node:crypto';
import type { TelemetryEventEnvelope, TelemetryEventType } from './types.js';
import { buildTelemetryEvent } from './telemetry-event.js';
import { TelemetryJsonlWriter } from './telemetry-jsonl-writer.js';
import { verifyHashChain } from './telemetry-hash-chain.js';
import type { RedactionProfile } from './redaction.js';
import { redactPayloadFields } from './redaction.js';

export type TelemetryEmitterOptions = {
  session_id: string;
  trace_id?: string;
  writer: TelemetryJsonlWriter;
  redaction_profile?: RedactionProfile;
};

export class TelemetryEmitter {
  private readonly session_id: string;
  private readonly trace_id: string;
  private readonly writer: TelemetryJsonlWriter;
  private readonly redaction_profile: RedactionProfile;
  private sequence = 0;
  private previous_event_hash: string | null = null;
  private readonly events: TelemetryEventEnvelope[] = [];

  constructor(options: TelemetryEmitterOptions) {
    this.session_id = options.session_id;
    this.trace_id = options.trace_id ?? randomUUID();
    this.writer = options.writer;
    this.redaction_profile = options.redaction_profile ?? 'demo';
  }

  getTraceId(): string {
    return this.trace_id;
  }

  getEvents(): readonly TelemetryEventEnvelope[] {
    return this.events;
  }

  emit(
    event_type: TelemetryEventType,
    payload: Record<string, unknown> = {},
    span_id = randomUUID(),
    parent_span_id: string | null = null,
    event_status: TelemetryEventEnvelope['event_status'] = 'recorded',
  ): TelemetryEventEnvelope {
    this.sequence += 1;
    const redactedPayload = redactPayloadFields(payload, this.redaction_profile);

    const event = buildTelemetryEvent({
      event_type,
      session_id: this.session_id,
      trace_id: this.trace_id,
      span_id,
      parent_span_id,
      event_sequence: this.sequence,
      previous_event_hash: this.previous_event_hash,
      payload: redactedPayload,
      event_status,
    });

    this.writer.append(event);
    this.events.push(event);
    this.previous_event_hash = event.event_hash;
    return event;
  }

  emitSkipped(event_type: TelemetryEventType, reason: string): TelemetryEventEnvelope {
    return this.emit(event_type, { skip_reason: reason }, randomUUID(), null, 'skipped');
  }

  verifyChain(): ReturnType<typeof verifyHashChain> {
    return verifyHashChain([...this.events]);
  }
}
