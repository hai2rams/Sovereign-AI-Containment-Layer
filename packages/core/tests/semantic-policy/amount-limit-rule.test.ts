import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateAmountLimitRule } from '../../src/semantic-policy/rules/amount-limit-rule.js';
import { baseActionProposal, baseStateEnvelope, DEFAULT_PAYMENT_POLICY } from './fixtures.js';

describe('AMOUNT_LIMIT_RULE', () => {
  it('passes within global max', () => {
    const result = evaluateAmountLimitRule({
      proposal: baseActionProposal({ amount_minor_units: 100_000 }),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'passed');
  });

  it('fails when amount exceeds configured max', () => {
    const result = evaluateAmountLimitRule({
      proposal: baseActionProposal({ amount_minor_units: 9_000_000 }),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'AMOUNT_EXCEEDS_LIMIT');
  });
});
