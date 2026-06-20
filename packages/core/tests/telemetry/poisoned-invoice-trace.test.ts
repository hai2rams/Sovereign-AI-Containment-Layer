import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { emitPoisonedInvoiceTrace } from '../../src/telemetry/poisoned-invoice-trace.js';
import {
  baseActionProposal,
  baseStateEnvelope,
  DEFAULT_PAYMENT_POLICY,
} from '../semantic-policy/fixtures.js';
import { verifyHashChain } from '../../src/telemetry/telemetry-hash-chain.js';
import { TelemetryJsonlWriter } from '../../src/telemetry/telemetry-jsonl-writer.js';

describe('poisoned invoice trace emission', () => {
  it('emits deterministic semantic denial trace', () => {
    const dir = mkdtempSync(join(tmpdir(), 'poisoned-'));
    const path = join(dir, 'telemetry_stream.jsonl');

    const { events, semantic } = emitPoisonedInvoiceTrace({
      session_id: 'poisoned-session',
      proposal: baseActionProposal({
        destination: asAsciiSlug('attacker-wallet'),
        amount_minor_units: 9_000_000,
        payment_reference: asAsciiSlug('fake-invoice'),
      }),
      envelope: baseStateEnvelope({ source_trust_level: 3 }),
      policy: DEFAULT_PAYMENT_POLICY,
      writer_path: path,
    });

    assert.equal(semantic.accepted, false);
    assert.ok(events.some((e) => e.event_type === 'SEMANTIC_VALIDATION_COMPLETED'));
    assert.ok(events.some((e) => e.event_type === 'AUDIT_RECEIPT_WRITTEN'));

    const chain = verifyHashChain(events);
    assert.equal(chain.valid, true);

    const lines = readFileSync(path, 'utf8').trim().split('\n');
    assert.ok(lines.length >= 5);
    const parsed = TelemetryJsonlWriter.parseLines(readFileSync(path, 'utf8'));
    for (const event of parsed) {
      assert.equal('idempotency_key' in event.payload, false);
      assert.equal('state_envelope' in event.payload, false);
    }

    rmSync(dir, { recursive: true, force: true });
  });
});
