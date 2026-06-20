import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  verifyContainmentEpoch,
  verifyKeyEpoch,
  verifyRevocationEpoch,
} from '../../src/tool-executor/epoch-verifier.js';
import { issueTokenForPayload, SWAP_ORIGINAL_PAYLOAD } from './fixtures.js';

describe('epoch-verifier', () => {
  it('7. revocation epoch mismatch fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyRevocationEpoch(token, token.revocation_epoch + 1), false);
  });

  it('8. containment epoch mismatch fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyContainmentEpoch(token, token.containment_epoch + 1), false);
  });

  it('9. key epoch mismatch fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyKeyEpoch(token, token.key_epoch + 1), false);
  });
});
