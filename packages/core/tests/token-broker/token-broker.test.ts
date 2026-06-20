import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { validateActionProposal } from '../../src/validators/action-proposal-validator.js';
import {
  TokenBroker,
  buildTokenIssuanceTelemetryPayload,
  assertTokenIssuanceTelemetrySafe,
  MockTokenSigner,
  type TokenSigner,
  type UnsignedParameterBoundActionToken,
} from '../../src/token-broker/index.js';
import { resetJtiSequenceForTests } from '../../src/token-broker/jti.js';
import {
  baseActionProposal,
  baseIssuanceRequest,
  blockedSemantic,
  humanApprovalSemantic,
  invalidProposalInput,
  quarantineSemantic,
  readOnlySemantic,
} from './fixtures.js';

class FailingSigner implements TokenSigner {
  readonly signing_key_id = asAsciiSlug('fail-key');
  sign(_claims: UnsignedParameterBoundActionToken): string {
    throw new Error('signing secret unavailable');
  }
}

describe('TokenBroker', () => {
  it('1. does not issue when semantic result is blocked', () => {
    const result = new TokenBroker().issueToken(
      baseIssuanceRequest({ semantic: blockedSemantic() }),
    );
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'POLICY_DECISION_BLOCKED');
    assert.equal(result.token, undefined);
  });

  it('2. does not issue when semantic result is quarantine', () => {
    const result = new TokenBroker().issueToken(
      baseIssuanceRequest({ semantic: quarantineSemantic() }),
    );
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'RISK_MODE_BLOCKS_TOKEN');
  });

  it('3. does not issue when semantic result is read_only', () => {
    const result = new TokenBroker().issueToken(
      baseIssuanceRequest({ semantic: readOnlySemantic() }),
    );
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'RISK_MODE_BLOCKS_TOKEN');
  });

  it('4. does not issue when semantic result requires_human_approval', () => {
    const result = new TokenBroker().issueToken(
      baseIssuanceRequest({ semantic: humanApprovalSemantic() }),
    );
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'POLICY_REQUIRES_HUMAN_APPROVAL');
  });

  it('5. issues when semantic result is allowed', () => {
    resetJtiSequenceForTests();
    const result = new TokenBroker().issueToken(baseIssuanceRequest());
    assert.equal(result.decision, 'issued');
    assert.ok(result.token);
  });

  it('6-11. issued token includes parameter_hash, epochs, signing_key_id, single_use, jti', () => {
    resetJtiSequenceForTests();
    const result = new TokenBroker().issueToken(baseIssuanceRequest());
    const token = result.token!;
    assert.ok(token.parameter_hash);
    assert.equal(token.revocation_epoch, 42);
    assert.equal(token.containment_epoch, 7);
    assert.equal(token.key_epoch, 3);
    assert.equal(token.signing_key_id, 'session_key_001');
    assert.equal(token.single_use, true);
    assert.match(token.jti, /^jti-/);
  });

  it('13. model cannot supply jti via ActionProposal', () => {
    const withJti = { ...baseActionProposal(), jti: 'model-jti' };
    const validation = validateActionProposal(withJti);
    assert.equal(validation.ok, false);
  });

  it('14. model cannot supply idempotency_key via ActionProposal', () => {
    const withIdem = { ...baseActionProposal(), idempotency_key: 'model-idem' };
    const validation = validateActionProposal(withIdem);
    assert.equal(validation.ok, false);
  });

  it('19. invalid action proposal blocks issuance', () => {
    const result = new TokenBroker().issueToken(
      baseIssuanceRequest({ proposal: invalidProposalInput() }),
    );
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'INVALID_ACTION_PROPOSAL');
  });

  it('signing failure returns TOKEN_SIGNING_FAILED without leaking secrets', () => {
    resetJtiSequenceForTests();
    const result = new TokenBroker(new FailingSigner()).issueToken(baseIssuanceRequest());
    assert.equal(result.decision, 'blocked');
    assert.equal(result.reason_code, 'TOKEN_SIGNING_FAILED');
    assert.ok(result.parameter_hash);
    assert.equal(JSON.stringify(result).includes('secret'), false);
  });

  it('21. token telemetry does not include secrets', () => {
    resetJtiSequenceForTests();
    const issued = new TokenBroker().issueToken(baseIssuanceRequest());
    const allowedPayload = buildTokenIssuanceTelemetryPayload(issued);
    assert.doesNotThrow(() => assertTokenIssuanceTelemetrySafe(allowedPayload));

    const blocked = new TokenBroker().issueToken(
      baseIssuanceRequest({ semantic: blockedSemantic() }),
    );
    const blockedPayload = buildTokenIssuanceTelemetryPayload(blocked);
    assert.doesNotThrow(() => assertTokenIssuanceTelemetrySafe(blockedPayload));
    assert.equal(blockedPayload.token_broker.token_issued, false);
  });
});
