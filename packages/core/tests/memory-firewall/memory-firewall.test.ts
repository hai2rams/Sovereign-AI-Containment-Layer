import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateMemoryWrite,
  evaluateMemoryRead,
  buildMemoryWriteTelemetryPayload,
  assertMemoryFirewallTelemetrySafe,
} from '../../src/memory-firewall/index.js';
import { hashMemoryPayload, hashNormalizedPayload } from '../../src/memory-firewall/quota-enforcer.js';
import {
  evidenceMetadata,
  INERT_PAYLOAD,
  memoryEnvelope,
  POISONED_PAYLOAD,
  SIMILAR_PAYLOAD,
  TIGHT_POLICY,
} from './fixtures.js';

describe('MemoryFirewall', () => {
  it('allows inert memory write within quota', () => {
    const result = evaluateMemoryWrite({
      metadata: evidenceMetadata(INERT_PAYLOAD),
      payload: INERT_PAYLOAD,
      envelope: memoryEnvelope(),
    });
    assert.equal(result.decision, 'allowed');
    assert.equal(result.payload_stored, false);
    assert.equal(result.updated_memory_quota.memory_write_count, 1);
  });

  it('blocks non-inert poisoned payload', () => {
    const result = evaluateMemoryWrite({
      metadata: evidenceMetadata(POISONED_PAYLOAD),
      payload: POISONED_PAYLOAD,
      envelope: memoryEnvelope(),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('MEMORY_PAYLOAD_NOT_INERT'));
    assert.equal(result.quarantine_recommended, true);
  });

  it('blocks duplicate payload', () => {
    const metadata = evidenceMetadata(INERT_PAYLOAD);
    const result = evaluateMemoryWrite({
      metadata,
      payload: INERT_PAYLOAD,
      envelope: memoryEnvelope(),
      known_content_hashes: new Set([metadata.content_hash]),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('DUPLICATE_PAYLOAD_DETECTED'));
  });

  it('blocks similar payload poisoning attempt', () => {
    const metadata = evidenceMetadata(SIMILAR_PAYLOAD);
    const result = evaluateMemoryWrite({
      metadata,
      payload: SIMILAR_PAYLOAD,
      envelope: memoryEnvelope(),
      known_normalized_hashes: new Set([hashNormalizedPayload(INERT_PAYLOAD)]),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('SIMILAR_PAYLOAD_DETECTED'));
  });

  it('blocks when quota exceeded', () => {
    const envelope = memoryEnvelope({
      memory_quota: {
        ...memoryEnvelope().memory_quota,
        memory_write_count: 2,
      },
    });
    const result = evaluateMemoryWrite({
      metadata: evidenceMetadata(INERT_PAYLOAD),
      payload: INERT_PAYLOAD,
      envelope,
      policy: TIGHT_POLICY,
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('MEMORY_QUOTA_EXCEEDED'));
    assert.equal(result.quarantine_recommended, true);
  });

  it('blocks memory write in quarantine risk mode', () => {
    const result = evaluateMemoryWrite({
      metadata: evidenceMetadata(INERT_PAYLOAD),
      payload: INERT_PAYLOAD,
      envelope: memoryEnvelope({ risk_mode: 'quarantine' }),
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('RISK_MODE_BLOCKS_MEMORY_WRITE'));
  });

  it('read revalidation blocks when evidence trust is worse than session trust', () => {
    const metadata = evidenceMetadata(INERT_PAYLOAD, { evidence_trust_level: 5 });
    const result = evaluateMemoryRead({
      metadata,
      envelope: memoryEnvelope({ source_trust_level: 1 }),
      current_source_trust_level: 1,
    });
    assert.equal(result.decision, 'blocked');
    assert.ok(result.reason_codes.includes('MEMORY_READ_TRUST_DEPRECIATED'));
    assert.equal(result.payload_returned, false);
  });

  it('telemetry does not include secrets or raw payload', () => {
    const blocked = evaluateMemoryWrite({
      metadata: evidenceMetadata(POISONED_PAYLOAD),
      payload: POISONED_PAYLOAD,
      envelope: memoryEnvelope(),
    });
    const telemetry = buildMemoryWriteTelemetryPayload(blocked);
    assert.doesNotThrow(() => assertMemoryFirewallTelemetrySafe(telemetry));
    assert.equal(JSON.stringify(telemetry).includes('steal_secrets'), false);
  });
});
