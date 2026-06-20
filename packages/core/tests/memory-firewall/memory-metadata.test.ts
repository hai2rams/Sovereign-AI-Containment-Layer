import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateMemoryEvidenceMetadata } from '../../src/memory-firewall/memory-metadata.js';
import { asAsciiSlug } from '../../src/types/brands.js';
import { evidenceMetadata, INERT_PAYLOAD } from './fixtures.js';

describe('memory-metadata', () => {
  it('accepts strict metadata schema', () => {
    const result = validateMemoryEvidenceMetadata(evidenceMetadata(INERT_PAYLOAD));
    assert.equal(result.ok, true);
  });

  it('rejects forbidden control-plane fields in metadata', () => {
    const bad = { ...evidenceMetadata(INERT_PAYLOAD), policy_hash: 'sha256:' + 'a'.repeat(64) };
    const result = validateMemoryEvidenceMetadata(bad);
    assert.equal(result.ok, false);
  });

  it('rejects unknown metadata fields', () => {
    const bad = { ...evidenceMetadata(INERT_PAYLOAD), jti: asAsciiSlug('model-jti') };
    const result = validateMemoryEvidenceMetadata(bad);
    assert.equal(result.ok, false);
  });

  it('rejects invalid captured_at', () => {
    const bad = {
      ...evidenceMetadata(INERT_PAYLOAD),
      captured_at: 'not-a-date',
    };
    const result = validateMemoryEvidenceMetadata(bad);
    assert.equal(result.ok, false);
  });
});
