import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verifyIdempotencyKeyUnused, verifyJtiUnused } from '../../src/tool-executor/replay-verifier.js';
import { issueTokenForPayload, SWAP_ORIGINAL_PAYLOAD } from './fixtures.js';

describe('replay-verifier', () => {
  it('10. reused jti fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const used = new Set([token.jti]);
    assert.equal(verifyJtiUnused(token, used), false);
  });

  it('11. reused idempotency key fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const used = new Set([token.idempotency_key]);
    assert.equal(verifyIdempotencyKeyUnused(token, used), false);
  });
});
