import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { TelemetryEventEnvelope } from './types.js';
import { assertRequiredEnvelopeFields } from './telemetry-event.js';

export class TelemetryJsonlWriter {
  constructor(private readonly filePath: string) {}

  append(event: TelemetryEventEnvelope): void {
    assertRequiredEnvelopeFields(event);
    mkdirSync(dirname(this.filePath), { recursive: true });
    const line = `${JSON.stringify(event)}\n`;
    appendFileSync(this.filePath, line, 'utf8');
  }

  static parseLines(content: string): TelemetryEventEnvelope[] {
    const events: TelemetryEventEnvelope[] = [];
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      events.push(JSON.parse(trimmed) as TelemetryEventEnvelope);
    }
    return events;
  }
}
