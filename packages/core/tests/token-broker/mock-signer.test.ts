import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug, asIsoTimestamp } from '../../src/types/brands.js';
import {
  MockTokenSigner,
  MOCK_SIGNATURE_PREFIX,
  isMockSignature,
} from '../../src/token-broker/mock-signer.js';
import { buildUnsignedTokenClaims } from '../../src/token-broker/token-claims.js';
import { HASH_A } from './fixtures.js';

describe('mock-signer', () => {
  it('20. creates deterministic mock signature', () => {
    const signer = new MockTokenSigner(asAsciiSlug('session_key_001'));
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
      revocation_epoch: 0,
      containment_epoch: 0,
      key_epoch: 1,
      issued_at: asIsoTimestamp('2026-06-18T00:00:00.000Z'),
      expires_at: asIsoTimestamp('2026-06-18T00:05:00.000Z'),
      idempotency_key: asAsciiSlug('idem-test'),
      jti: asAsciiSlug('jti-test'),
      signing_key_id: asAsciiSlug('session_key_001'),
    });

    const sigA = signer.sign(claims);
    const sigB = signer.sign(claims);
    assert.equal(sigA, sigB);
    assert.ok(isMockSignature(sigA));
    assert.ok(sigA.startsWith(MOCK_SIGNATURE_PREFIX));
    assert.doesNotMatch(sigA, /private|secret|seed/i);
  });
});
