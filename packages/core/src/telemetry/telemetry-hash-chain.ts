import { createHash } from 'node:crypto';
import type { TelemetryEventEnvelope } from './types.js';
import { stableStringify } from './types.js';

export function computeEventHash(
  event: Omit<TelemetryEventEnvelope, 'event_hash'> | TelemetryEventEnvelope,
): string {
  const { event_hash: _ignored, ...rest } = event as TelemetryEventEnvelope;
  const canonical = stableStringify(rest);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function verifyEventHash(event: TelemetryEventEnvelope): boolean {
  const expected = computeEventHash(event);
  return expected === event.event_hash;
}

export function verifyHashChain(events: TelemetryEventEnvelope[]): {
  valid: boolean;
  broken_at_sequence: number | null;
  reason?: string;
} {
  if (events.length === 0) {
    return { valid: true, broken_at_sequence: null };
  }

  for (const event of events) {
    if (!verifyEventHash(event)) {
      return {
        valid: false,
        broken_at_sequence: event.event_sequence,
        reason: 'event_hash mismatch',
      };
    }
  }

  const sorted = [...events].sort((a, b) => a.event_sequence - b.event_sequence);

  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i];
    const expectedPrevious = i === 0 ? null : sorted[i - 1].event_hash;
    if (event.previous_event_hash !== expectedPrevious) {
      return {
        valid: false,
        broken_at_sequence: event.event_sequence,
        reason: 'previous_event_hash link broken',
      };
    }
  }

  return { valid: true, broken_at_sequence: null };
}
