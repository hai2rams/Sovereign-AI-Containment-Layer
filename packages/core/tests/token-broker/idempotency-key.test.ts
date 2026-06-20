import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { generateIdempotencyKey } from '../../src/token-broker/idempotency-key.js';
import { computeParameterHash } from '../../src/token-broker/parameter-hash.js';
import { baseActionProposal, HASH_A } from './fixtures.js';

describe('idempotency-key', () => {
  it('14. control plane generates idempotency key bound to session and parameters', () => {
    const parameter_hash = computeParameterHash(baseActionProposal());
    const key = generateIdempotencyKey({
      session_id: asAsciiSlug('session-001'),
      transaction_sequence_counter: 5,
      policy_hash: HASH_A,
      parameter_hash,
      action: asAsciiSlug('payment.transfer'),
      tool_id: asAsciiSlug('tool.payment.transfer'),
      revocation_epoch: 42,
    });
    assert.match(key, /^idem-[a-f0-9]{40}$/);
    assert.doesNotMatch(key, /secret|private|seed/i);
  });
});
