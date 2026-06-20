import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  verifyTokenNotExpired,
  verifyTokenSignature,
  verifyTokenSingleUse,
} from '../../src/tool-executor/token-verifier.js';
import { issueTokenForPayload, SWAP_ORIGINAL_PAYLOAD } from './fixtures.js';

describe('token-verifier', () => {
  it('valid mock signature passes', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyTokenSignature(token), true);
  });

  it('6. invalid signature fails', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const tampered = { ...token, signature: 'mock_sig_v1:deadbeef' };
    assert.equal(verifyTokenSignature(tampered), false);
  });

  it('expired token fails freshness check', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const expiredAt = Date.parse('2030-01-01T00:01:30.000Z');
    assert.equal(verifyTokenNotExpired(token, expiredAt), false);
  });

  it('single_use true passes', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyTokenSingleUse(token), true);
  });
});
