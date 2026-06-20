import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertRequiredEnvelopeFields,
  buildTelemetryEvent,
  REQUIRED_ENVELOPE_FIELDS,
} from '../../src/telemetry/telemetry-event.js';

describe('telemetry event schema', () => {
  it('required telemetry envelope fields exist', () => {
    const event = buildTelemetryEvent({
      event_type: 'SESSION_STARTED',
      session_id: 'session-1',
      trace_id: 'trace-1',
      span_id: 'span-1',
      event_sequence: 1,
      previous_event_hash: null,
      payload: { ok: true },
    });

    assertRequiredEnvelopeFields(event);
    for (const field of REQUIRED_ENVELOPE_FIELDS) {
      assert.ok(field in event, `missing ${field}`);
    }
    assert.equal(event.schema_version, 'telemetry.v1');
  });

  it('event_sequence increments via emitter pattern', () => {
    const first = buildTelemetryEvent({
      event_type: 'SESSION_STARTED',
      session_id: 's',
      trace_id: 't',
      span_id: 'a',
      event_sequence: 1,
      previous_event_hash: null,
    });
    const second = buildTelemetryEvent({
      event_type: 'POLICY_DECISION_ISSUED',
      session_id: 's',
      trace_id: 't',
      span_id: 'b',
      event_sequence: 2,
      previous_event_hash: first.event_hash,
    });
    assert.equal(second.event_sequence, first.event_sequence + 1);
    assert.equal(second.previous_event_hash, first.event_hash);
  });
});
