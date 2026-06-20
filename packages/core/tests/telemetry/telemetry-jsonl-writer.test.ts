import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { buildTelemetryEvent } from '../../src/telemetry/telemetry-event.js';
import { TelemetryJsonlWriter } from '../../src/telemetry/telemetry-jsonl-writer.js';

describe('TelemetryJsonlWriter', () => {
  it('appends one event per line', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telemetry-'));
    const path = join(dir, 'stream.jsonl');
    const writer = new TelemetryJsonlWriter(path);

    const event = buildTelemetryEvent({
      event_type: 'SESSION_STARTED',
      session_id: 'session-x',
      trace_id: 'trace-x',
      span_id: 'span-x',
      event_sequence: 1,
      previous_event_hash: null,
    });

    writer.append(event);
    writer.append({
      ...event,
      event_id: 'second',
      event_sequence: 2,
      previous_event_hash: event.event_hash,
      event_hash: '0'.repeat(64),
    });

    const raw = readFileSync(path, 'utf8');
    const lines = raw.trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[0]).event_type, 'SESSION_STARTED');

    rmSync(dir, { recursive: true, force: true });
  });
});
