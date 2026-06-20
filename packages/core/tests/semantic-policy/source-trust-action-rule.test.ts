import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateSourceTrustActionRule } from '../../src/semantic-policy/rules/source-trust-action-rule.js';
import { baseActionProposal, baseStateEnvelope, DEFAULT_PAYMENT_POLICY } from './fixtures.js';

describe('SOURCE_TRUST_ACTION_RULE', () => {
  it('passes for trust level 2 on payment', () => {
    const result = evaluateSourceTrustActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ source_trust_level: 2 }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'passed');
  });

  it('requires human approval at trust level 3', () => {
    const result = evaluateSourceTrustActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ source_trust_level: 3 }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'LOW_SOURCE_TRUST_FOR_STATE_CHANGE');
    assert.equal(result.decision_on_fail, 'requires_human_approval');
  });

  it('quarantines at trust level 5', () => {
    const result = evaluateSourceTrustActionRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope({ source_trust_level: 5 }),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.decision_on_fail, 'quarantine');
  });
});
