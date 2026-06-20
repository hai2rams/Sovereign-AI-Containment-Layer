import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asAsciiSlug } from '../../src/types/brands.js';
import { evaluateDestinationAllowlistRule } from '../../src/semantic-policy/rules/destination-allowlist-rule.js';
import {
  baseActionProposal,
  baseStateEnvelope,
  DEFAULT_PAYMENT_POLICY,
} from './fixtures.js';

describe('DESTINATION_ALLOWLIST_RULE', () => {
  it('passes for approved destination', () => {
    const result = evaluateDestinationAllowlistRule({
      proposal: baseActionProposal(),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'passed');
  });

  it('fails for unknown destination', () => {
    const result = evaluateDestinationAllowlistRule({
      proposal: baseActionProposal({ destination: asAsciiSlug('attacker-wallet') }),
      envelope: baseStateEnvelope(),
      policy: DEFAULT_PAYMENT_POLICY,
    });
    assert.equal(result.result, 'failed');
    assert.equal(result.reason_code, 'DESTINATION_NOT_ALLOWLISTED');
  });
});
