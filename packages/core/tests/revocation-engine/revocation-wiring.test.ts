import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateEnvelopeRevocationGate } from '../../src/revocation-engine/envelope-revocation-gate.js';
import { evaluateRevocationSemanticOverride } from '../../src/revocation-engine/semantic-invalidation.js';
import { isTokenInvalidatedByRevocation } from '../../src/revocation-engine/token-invalidation.js';
import { TokenBroker } from '../../src/token-broker/token-broker.js';
import { allowedSemantic, baseIssuanceRequest } from '../token-broker/fixtures.js';
import { baseStateEnvelope, issuedTokenAtEpoch, quarantinedEnvelope, revokedEnvelope } from './fixtures.js';

describe('revocation wiring', () => {
  it('blocks token issuance when revocation state invalid', () => {
    const broker = new TokenBroker();
    const result = broker.issueToken(
      baseIssuanceRequest({
        envelope: quarantinedEnvelope(),
        semantic: allowedSemantic(),
      }),
    );
    assert.equal(result.decision, 'blocked');
    assert.ok(
      result.reason_code === 'REVOCATION_STATE_INVALID' ||
        result.reason_code === 'KILL_SWITCH_ACTIVE',
    );
  });

  it('semantic override blocks quarantined session', () => {
    const override = evaluateRevocationSemanticOverride(quarantinedEnvelope());
    assert.equal(override.override, true);
    assert.equal(override.final_semantic_result, 'quarantine');
    assert.ok(override.reason_codes.includes('SESSION_QUARANTINED'));
  });

  it('semantic override blocks revoked session', () => {
    const override = evaluateRevocationSemanticOverride(revokedEnvelope());
    assert.equal(override.override, true);
    assert.equal(override.final_semantic_result, 'blocked');
    assert.ok(override.reason_codes.includes('SESSION_REVOKED'));
  });

  it('invalidates stale token after revocation transition', () => {
    const token = issuedTokenAtEpoch(42);
    const envelope = quarantinedEnvelope({ revocation_epoch: 43, containment_epoch: 8 });
    assert.equal(isTokenInvalidatedByRevocation(token, envelope), true);
    assert.equal(evaluateEnvelopeRevocationGate(envelope).allowed, false);
  });

  it('allows active envelope through revocation gate', () => {
    assert.equal(evaluateEnvelopeRevocationGate(baseStateEnvelope()).allowed, true);
  });
});
