import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTelemetryEvent } from '../../src/telemetry/telemetry-event.js';
import { verifyHashChain } from '../../src/telemetry/telemetry-hash-chain.js';

describe('telemetry hash chain', () => {
  it('previous_event_hash links to prior event_hash', () => {
    const e1 = buildTelemetryEvent({
      event_type: 'SESSION_STARTED',
      session_id: 's',
      trace_id: 't',
      span_id: 'span-1',
      event_sequence: 1,
      previous_event_hash: null,
    });
    const e2 = buildTelemetryEvent({
      event_type: 'SEMANTIC_VALIDATION_COMPLETED',
      session_id: 's',
      trace_id: 't',
      span_id: 'span-2',
      event_sequence: 2,
      previous_event_hash: e1.event_hash,
    });

    const result = verifyHashChain([e1, e2]);
    assert.equal(result.valid, true);
  });

  it('broken chain is detectable', () => {
    const e1 = buildTelemetryEvent({
      event_type: 'SESSION_STARTED',
      session_id: 's',
      trace_id: 't',
      span_id: 'span-1',
      event_sequence: 1,
      previous_event_hash: null,
    });
    const e2 = buildTelemetryEvent({
      event_type: 'SEMANTIC_VALIDATION_COMPLETED',
      session_id: 's',
      trace_id: 't',
      span_id: 'span-2',
      event_sequence: 2,
      previous_event_hash: 'deadbeef',
    });

    const result = verifyHashChain([e1, e2]);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'previous_event_hash link broken');
  });
});
