import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug, asIsoTimestamp } from '../../src/types/brands.js';
import { buildUnsignedTokenClaims } from '../../src/token-broker/token-claims.js';
import { HASH_A } from './fixtures.js';

describe('token-claims', () => {
  it('8. issued token receipt shape includes required claim fields', () => {
    const claims = buildUnsignedTokenClaims({
      session_id: asAsciiSlug('session-001'),
      release_id: asAsciiSlug('release-certified-001'),
      policy_hash: HASH_A,
      policy_decision_id: asAsciiSlug('policy-decision-001'),
      action: asAsciiSlug('payment.transfer'),
      tool_id: asAsciiSlug('tool.payment.transfer'),
      parameter_schema_version: asAsciiSlug('action_proposal_v1'),
      parameter_hash: HASH_A,
      source_trust_level: 1,
      risk_mode: 'normal',
      revocation_epoch: 42,
      containment_epoch: 7,
      key_epoch: 3,
      issued_at: asIsoTimestamp('2026-06-18T00:00:00.000Z'),
      expires_at: asIsoTimestamp('2026-06-18T00:05:00.000Z'),
      idempotency_key: asAsciiSlug('idem-test'),
      jti: asAsciiSlug('jti-test'),
      signing_key_id: asAsciiSlug('session_key_001'),
    });

    assert.equal(claims.token_type, 'parameter_bound_action_capability');
    assert.equal(claims.single_use, true);
    assert.equal(claims.revocation_epoch, 42);
    assert.equal(claims.containment_epoch, 7);
    assert.equal(claims.key_epoch, 3);
    assert.equal(claims.signing_key_id, 'session_key_001');
    assert.equal(claims.parameter_hash, HASH_A);
  });
});
