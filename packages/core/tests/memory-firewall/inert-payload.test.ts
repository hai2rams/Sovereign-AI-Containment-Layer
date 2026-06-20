import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isInertEvidencePayload } from '../../src/memory-firewall/inert-payload.js';
import { INERT_PAYLOAD, POISONED_PAYLOAD } from './fixtures.js';

describe('inert-payload', () => {
  it('allows plain text evidence', () => {
    assert.equal(isInertEvidencePayload(INERT_PAYLOAD), true);
  });

  it('blocks executable script patterns', () => {
    assert.equal(isInertEvidencePayload(POISONED_PAYLOAD), false);
  });
});
