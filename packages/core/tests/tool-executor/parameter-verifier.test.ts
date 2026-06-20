import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verifyParameterHash } from '../../src/tool-executor/parameter-verifier.js';
import { asAsciiSlug } from '../../src/types/brands.js';
import { issueTokenForPayload, SWAP_ATTACK_PAYLOAD, SWAP_ORIGINAL_PAYLOAD } from './fixtures.js';

describe('parameter-verifier', () => {
  it('matches when payload equals token binding', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyParameterHash(token.parameter_hash, SWAP_ORIGINAL_PAYLOAD), true);
  });

  it('2. destination swap fails parameter hash check', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    assert.equal(verifyParameterHash(token.parameter_hash, SWAP_ATTACK_PAYLOAD), false);
  });

  it('3. amount swap fails parameter hash check', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const swapped = { ...SWAP_ORIGINAL_PAYLOAD, amount_minor_units: 9999 };
    assert.equal(verifyParameterHash(token.parameter_hash, swapped), false);
  });

  it('4. payment reference swap fails parameter hash check', () => {
    const token = issueTokenForPayload(SWAP_ORIGINAL_PAYLOAD);
    const swapped = {
      ...SWAP_ORIGINAL_PAYLOAD,
      payment_reference: asAsciiSlug('invoice_2026_999'),
    };
    assert.equal(verifyParameterHash(token.parameter_hash, swapped), false);
  });
});
