import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectPayloadSimilarity } from '../../src/memory-firewall/similarity-detector.js';
import { hashMemoryPayload, hashNormalizedPayload } from '../../src/memory-firewall/quota-enforcer.js';
import { evidenceMetadata, INERT_PAYLOAD, SIMILAR_PAYLOAD } from './fixtures.js';

describe('similarity-detector', () => {
  it('detects duplicate content hash', () => {
    const metadata = evidenceMetadata(INERT_PAYLOAD);
    const known = new Set([metadata.content_hash]);
    const detection = detectPayloadSimilarity(metadata, hashNormalizedPayload(INERT_PAYLOAD), known);
    assert.equal(detection.duplicate_detected, true);
  });

  it('detects normalized similar payload', () => {
    const metadata = evidenceMetadata(SIMILAR_PAYLOAD);
    const knownNormalized = new Set([hashNormalizedPayload(INERT_PAYLOAD)]);
    const detection = detectPayloadSimilarity(
      metadata,
      hashNormalizedPayload(SIMILAR_PAYLOAD),
      undefined,
      knownNormalized,
    );
    assert.equal(detection.similar_detected, true);
    assert.notEqual(hashMemoryPayload(INERT_PAYLOAD), hashMemoryPayload(SIMILAR_PAYLOAD));
  });
});
